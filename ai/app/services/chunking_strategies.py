import uuid
import asyncio
from abc import ABC, abstractmethod
from typing import List, Tuple

from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.db.models import DocumentChunk
from app.services.llm_service import LLMService

class BaseChunkingStrategy(ABC):
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service

    @abstractmethod
    async def chunk_document(self, book_id: int, parsed_data: any) -> List[DocumentChunk]:
        """Приймає розпарсені дані і повертає готовий до запису в БД список чанків."""
        pass

class SimpleChunkingStrategy(BaseChunkingStrategy):
    async def chunk_document(self, book_id: int, parsed_data: any) -> List[DocumentChunk]:
        # Використовуємо локальний імпорт для уникнення циклічних залежностей
        from app.services.parser.heuristic_service import HeuristicService
        heuristic = HeuristicService()
        
        # Перетворюємо побудоване дерево в єдиний markdown документ
        markdown_text = heuristic.convert_to_markdown(parsed_data)
        markdown_text = markdown_text.replace('\x00', '')
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", "(?<=[.!?]) +", " ", ""],
            is_separator_regex=True
        )
        
        chunks_texts = text_splitter.split_text(markdown_text)
        
        if not chunks_texts:
            return []
            
        all_chunks = []
        batch_size = 10
        
        for i in range(0, len(chunks_texts), batch_size):
            batch_texts = chunks_texts[i:i + batch_size]
            
            # Паралельна обробка тільки ДЛЯ ОДНІЄЇ ПАРТІЇ
            embeddings = await asyncio.gather(*[self.llm_service.generate_embedding(t) for t in batch_texts])
            
            # Формування об'єктів DocumentChunk і додавання до all_chunks
            for t, emb in zip(batch_texts, embeddings):
                chunk = DocumentChunk(
                    id=uuid.uuid4(),
                    book_id=book_id,
                    level=0,
                    page_start=0,
                    page_end=0,
                    text=t,
                    embedding=emb,
                    parent_id=None
                )
                all_chunks.append(chunk)
                
            # Невелика пауза, щоб дати CPU/Network "подихати"
            await asyncio.sleep(0.5)
            
        return all_chunks

class HierarchicalChunkingStrategy(BaseChunkingStrategy):
    def _get_subtree_text(self, node: dict) -> str:
        text = node.get("text", "").strip()
        for child in node.get("children", []):
            child_text = self._get_subtree_text(child)
            if child_text:
                text += "\n\n" + child_text
        return text.strip()

    def _chunk_text(self, text: str, max_len: int = 1000, overlap: int = 200) -> List[str]:
        if not text.strip():
            return []
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=max_len, chunk_overlap=overlap,
            separators=["\n\n", "\n", "(?<=[.!?]) +", " ", ""],
            is_separator_regex=True)
        return text_splitter.split_text(text)

    async def _process_node_dfs(self, node: dict, book_id: int) -> Tuple[List[str], List[DocumentChunk], List[uuid.UUID]]:
        children = node.get("children", [])
        page_start = node.get("page_start", 1)
        page_end = node.get("page_end", page_start)
        level = node.get("level", 5)
        node_text = node.get("text", "")
        
        full_text = self._get_subtree_text(node)
        
        if len(full_text) <= 1000 and full_text:
            emb = await self.llm_service.generate_embedding(full_text)
            chunk_id = uuid.uuid4()
            chunk = DocumentChunk(
                id=chunk_id, book_id=book_id, level=level,
                page_start=page_start, page_end=page_end, text=full_text,
                embedding=emb, parent_id=None
            )
            return [full_text], [chunk], [chunk_id]
        elif len(full_text) > 1000 and not children:
            chunks_texts = self._chunk_text(full_text, max_len=1000, overlap=200)
            if not chunks_texts:
                return [], [], []
            embeddings = await asyncio.gather(*[self.llm_service.generate_embedding(t) for t in chunks_texts])
            all_chunks, root_ids = [], []
            for t, emb in zip(chunks_texts, embeddings):
                chunk_id = uuid.uuid4()
                chunk = DocumentChunk(
                    id=chunk_id, book_id=book_id, level=level,
                    page_start=page_start, page_end=page_end, text=t,
                    embedding=emb, parent_id=None
                )
                all_chunks.append(chunk)
                root_ids.append(chunk_id)
            return chunks_texts, all_chunks, root_ids
        else:
            tasks = [self._process_node_dfs(child, book_id) for child in children]
            results = await asyncio.gather(*tasks)
            all_children_texts, all_subtree_chunks, direct_children_ids = [], [], []
            for child_texts, child_chunks, child_root_ids in results:
                all_children_texts.extend(child_texts)
                all_subtree_chunks.extend(child_chunks)
                direct_children_ids.extend(child_root_ids)
            combined_for_summary = "\n\n".join(all_children_texts)
            safe_context = combined_for_summary[:15000] 
            summary = await self.llm_service.summarize_children([safe_context])
            final_text = f"{node_text}\n\nSummary:\n{summary}" if node_text else summary
            final_text = final_text.strip()
            if not final_text:
                return [], all_subtree_chunks, direct_children_ids
            emb = await self.llm_service.generate_embedding(final_text)
            parent_id = uuid.uuid4()
            parent_chunk = DocumentChunk(
                id=parent_id, book_id=book_id, level=level,
                page_start=page_start, page_end=page_end, text=final_text,
                embedding=emb, parent_id=None
            )
            for child_id in direct_children_ids:
                for chunk in all_subtree_chunks:
                    if chunk.id == child_id:
                        chunk.parent_id = parent_id
                        break
            all_subtree_chunks.append(parent_chunk)
            return [final_text], all_subtree_chunks, [parent_id]

    async def chunk_document(self, book_id: int, parsed_data: any) -> List[DocumentChunk]:
        tasks = [self._process_node_dfs(node, book_id) for node in parsed_data]
        results = await asyncio.gather(*tasks)
        all_book_chunks = []
        for _, chunks, _ in results:
            all_book_chunks.extend(chunks)
        all_book_chunks.reverse()
        return all_book_chunks
