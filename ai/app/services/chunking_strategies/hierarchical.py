import uuid
import asyncio
import re
from typing import List, Dict, Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.db.models import DocumentChunk
from app.services.chunking_strategies.base import BaseChunkingStrategy

class HierarchicalChunkingStrategy(BaseChunkingStrategy):
    def __init__(self, llm_service):
        super().__init__(llm_service)
        # Статична ініціалізація спліттера для найнижчого (6+) рівня
        self.leaf_splitter = RecursiveCharacterTextSplitter(
            chunk_size=700, 
            chunk_overlap=150,
            separators=["\n\n", "\n", "(?<=[.!?]) +", " ", ""]
        )

    async def chunk_document(self, book_id: int, markdown_text: str, book_title: str) -> List[DocumentChunk]:
        """Оркестратор, який запускає всі етапи по черзі."""
        if not markdown_text:
            return []
            
        markdown_text = markdown_text.replace('\x00', '')
        
        # КРОК 1: Будуємо деревоподібну структуру (Рекурсивний спліт)
        tree = self._build_tree(markdown_text, current_level=0)
        
        # КРОК 2: Bottom-Up Суммаризація (проходимо знизу вгору)
        await self._summarize_bottom_up(tree, book_title)
        
        # КРОК 3: Top-Down Прокидання контексту та шляхів
        self._inject_context_top_down(tree, parent_context="", current_path=book_title)
        
        # КРОК 4: Сплющення дерева (Flattening)
        flat_nodes = self._flatten_tree(tree)
        
        # КРОК 5: Векторизація та формування об'єктів для БД
        all_chunks = []
        batch_size = 10
        
        for i in range(0, len(flat_nodes), batch_size):
            batch = flat_nodes[i:i + batch_size]
            
            # Збираємо бутерброди для векторизації
            texts_to_embed = []
            for node in batch:
                breadcrumb = f"Шлях: {node['path']}\nКонтекст: {node['context']}\nТекст: {node['text']}"
                node['composite_text'] = breadcrumb
                texts_to_embed.append(breadcrumb)
                
            embeddings = await asyncio.gather(*[self.llm_service.generate_embedding(t) for t in texts_to_embed])
            
            for node, emb in zip(batch, embeddings):
                chunk = DocumentChunk(
                    id=uuid.uuid4(),
                    book_id=book_id,
                    level=node["level"],
                    page_start=None, 
                    page_end=None,
                    text=node["composite_text"], # Фінальний текст, готовий до пошуку
                    embedding=emb,
                    parent_id=None
                )
                all_chunks.append(chunk)
                
            await asyncio.sleep(0.5)
            
        return all_chunks

    # ================= ВНУТРІШНІ ЕТАПИ =================

    def _build_tree(self, text: str, current_level: int) -> List[Dict[str, Any]]:
        """Крок 1: Рекурсивно сплітить текст, будуючи масив children."""
        text = text.strip()
        if not text:
            return []

        # Якщо ми пробили дно ієрархії Markdown (рівень 6) - використовуємо RecursiveTextSplitter
        if current_level >= 6:
            if len(text) > 700:
                splits = self.leaf_splitter.split_text(text)
                return [{"title": "", "text": sp, "level": 7, "children": [], "summary": "", "context": "", "path": ""} for sp in splits]
            else:
                return [{"title": "", "text": text, "level": 7, "children": [], "summary": "", "context": "", "path": ""}]

        next_level = current_level + 1
        
        # Шукаємо, чи є в тексті заголовки наступного рівня
        pattern = re.compile(rf'\n(?=#{{{next_level}}}\s)')
        parts = pattern.split('\n' + text)
        
        nodes = []
        for part in parts:
            part = part.strip()
            if not part:
                continue

            lines = part.split('\n', 1)
            first_line = lines[0]
            rest_content = lines[1] if len(lines) > 1 else ""

            title_match = re.match(rf'^#{{{next_level}}}\s+(.*)', first_line)
            
            if title_match:
                title = title_match.group(1).strip()
                content = rest_content.strip()
                node_level = next_level
            else:
                # Це "висячий" вступний текст перед першим підзаголовком
                title = ""
                content = part
                node_level = current_level

            # Трешхолд спліту: якщо контент великий, розбиваємо його далі (наступним рівнем)
            children = []
            if len(content) > 700:
                children = self._build_tree(content, next_level)
            else:
                # Якщо контент маленький, але має якийсь текст, він стає власною дитиною (Leaf)
                if content:
                     children = [{"title": "", "text": content, "level": node_level + 1, "children": [], "summary": "", "context": "", "path": ""}]
                content = "" # Контент батька очищаємо, бо він перейшов у дитину

            nodes.append({
                "title": title,
                "text": content,
                "level": node_level,
                "children": children,
                "summary": "",
                "context": "",
                "path": ""
            })

        return nodes

    async def _summarize_bottom_up(self, nodes: List[Dict], parent_title: str):
        """Крок 2: Знизу вгору збирає контекст і суммаризує батьків."""
        for node in nodes:
            children = node.get("children", [])
            
            if children:
                # Спочатку спускаємося на дно
                node_title = node["title"] or parent_title
                await self._summarize_bottom_up(children, node_title)
                
                # Коли піднялися, збираємо тексти дітей для суммаризації
                child_texts = []
                for c in children:
                    # Якщо дитина має summary, беремо його, якщо ні - сирий текст
                    text_to_add = c.get("summary") or c.get("text", "")
                    if text_to_add:
                        child_texts.append(text_to_add)
                
                # Суммаризуємо і записуємо в батька
                if child_texts:
                    node["summary"] = await self.llm_service.summarize_section(node_title, child_texts)
            else:
                # Якщо дітей немає (це Leaf), його текст і є його summary
                node["summary"] = node["text"][:500]

    def _inject_context_top_down(self, nodes: List[Dict], parent_context: str, current_path: str):
        """Крок 3: Зверху вниз прокидає контекст і формує шлях."""
        for node in nodes:
            # Формуємо шлях (якщо є тайтл, додаємо його до шляху)
            my_path = f"{current_path} > {node['title']}" if node['title'] else current_path
            node["path"] = my_path
            
            # Прокидаємо контекст: батьківський summary стає контекстом дитини
            node["context"] = parent_context
            
            # Якщо є діти, мій summary стає їхнім батьківським контекстом
            if node.get("children"):
                my_summary = node.get("summary", "")
                self._inject_context_top_down(node["children"], my_summary, my_path)

    def _flatten_tree(self, nodes: List[Dict]) -> List[Dict]:
        """Крок 4: Сплющує дерево у плоский масив (відкидаємо порожні батьківські вузли)."""
        flat = []
        for node in nodes:
            # Якщо вузол має текст (тобто це Leaf або нерозбитий шматок), додаємо його в список
            if node.get("text"):
                flat.append(node)
                
            # Рекурсивно збираємо дітей
            if node.get("children"):
                flat.extend(self._flatten_tree(node["children"]))
                
        return flat