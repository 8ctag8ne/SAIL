import uuid
import asyncio
import re
from typing import List, Dict, Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.db.models import DocumentChunk, Book
from app.db.database import AsyncSessionLocal
from sqlalchemy.future import select
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

    async def chunk_document(self, book_id: int, markdown_text: str) -> List[DocumentChunk]:
        """Оркестратор, який запускає всі етапи по черзі."""
        if not markdown_text:
            return []
            
        markdown_text = markdown_text.replace('\x00', '')

        # Отримуємо назву книги з її id
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(select(Book.title).where(Book.id == book_id))
                book_title = result.scalar_one_or_none()
                if not book_title:
                    book_title = f"Книга {book_id}"
            except Exception as db_err:
                print(f"CRITICAL DB ERROR: {db_err}")
                await db.rollback()
                raise db_err
        
        # КРОК 1: Будуємо деревоподібну структуру (Рекурсивний спліт)
        tree = self._build_tree(markdown_text, current_level=0)
        print("\n\n\n\n Built tree: \n")
        print(tree)
        print("\n\n\n\n End\n")
        
        # КРОК 2: Bottom-Up Суммаризація (проходимо знизу вгору)
        print("\n\n\n\n Summarizing...\n")
        await self._summarize_bottom_up(tree, book_title)
        print("\n\n\n\n End\n")
        
        # КРОК 3: Top-Down Прокидання контексту та шляхів
        print("\n\n\n\n Injecting context...\n")
        self._inject_context_top_down(tree, parent_context="", current_path=book_title)
        print("\n\n\n\n End\n")
        
        # КРОК 4: Сплющення дерева (Flattening)
        print("\n\n\n\n Flattening...\n")
        flat_nodes = self._flatten_tree(tree)
        print("\n\n\n\n End\n")
        
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
        """Крок 1: Рекурсивна побудова дерева без дублювання тексту в батьківських вузлах."""
        text = text.strip()
        if not text:
            return []

        # Якщо ми пробили дно ієрархії (6 рівень) АБО текст малий (< 700)
        # Зупиняємо рекурсію і робимо листок (Leaf)
        if current_level >= 6 or len(text) <= 700:
            if len(text) > 700:
                splits = self.leaf_splitter.split_text(text)
                return [{"title": "", "text": sp, "level": 7, "children": [], "summary": "", "context": "", "path": ""} for sp in splits]
            else:
                return [{"title": "", "text": text, "level": current_level + 1, "children": [], "summary": "", "context": "", "path": ""}]

        next_level = current_level + 1
        
        # Шукаємо підзаголовки наступного рівня
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
                title = ""
                content = part
                node_level = current_level

            children = []
            node_text = ""
            
            # Якщо контент масивний (>700), сплітаємо його далі.
            # Зверни увагу: node_text залишається порожнім, щоб не дублювати дані!
            if len(content) > 700:
                children = self._build_tree(content, next_level)
            else:
                # Якщо контент малий (<700), він стає текстом поточного вузла.
                if content:
                    node_text = content

            nodes.append({
                "title": title,
                "text": node_text,
                "level": node_level,
                "children": children,
                "summary": "",
                "context": "",
                "path": ""
            })

        return nodes

    async def _summarize_bottom_up(self, nodes: List[Dict], parent_title: str):
        """Крок 2: Знизу вгору збирає контекст. Працює конкурентно, без втрати контексту."""
        
        # 1. Паралельно спускаємося на дно для всіх гілок
        child_tasks = []
        for node in nodes:
            children = node.get("children", [])
            if children:
                node_title = node["title"] or parent_title
                child_tasks.append(self._summarize_bottom_up(children, node_title))
                
        if child_tasks:
            # Чекаємо, поки всі діти нижніх рівнів зроблять свої summary
            await asyncio.gather(*child_tasks)
            
        # 2. Формуємо пули задач для суммаризації на поточному рівні
        summarize_tasks = []
        nodes_to_summarize = []
        
        for node in nodes:
            children = node.get("children", [])
            
            if children:
                # Збираємо тексти дітей. Нічого не обрізаємо!
                child_texts = []
                for c in children:
                    text_to_add = c.get("summary") or c.get("text", "")
                    if text_to_add:
                        child_texts.append(text_to_add)
                
                if child_texts:
                    node_title = node["title"] or parent_title
                    # Передаємо в llm_service масив текстів
                    summarize_tasks.append(
                        self.llm_service.summarize_section(node_title, child_texts)
                    )
                    nodes_to_summarize.append(node)
            else:
                # Для листків (де немає дітей): summary дорівнює всьому сирому тексту. Жодного зрізання!
                node["summary"] = node.get("text", "")

        # 3. Виконуємо всі запити батчем (Семафор в llm_service випустить їх по 5 штук)
        if summarize_tasks:
            summaries = await asyncio.gather(*summarize_tasks)
            
            for node, summary in zip(nodes_to_summarize, summaries):
                node["summary"] = summary

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