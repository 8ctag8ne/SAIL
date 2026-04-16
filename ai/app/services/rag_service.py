import uuid
import asyncio
import re
from typing import List, Tuple

from langchain.text_splitter import RecursiveCharacterTextSplitter
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import DocumentChunk
from app.services.llm_service import LLMService

class ChunkingService:
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service

    def _chunk_text(self, text: str, max_len: int = 1000, overlap: int = 200) -> List[str]:
        if not text.strip():
            return []
            
        # RecursiveCharacterTextSplitter naturally keeps paragraphs, sentences, and words together
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=max_len,
            chunk_overlap=overlap,
            separators=["\n\n", "\n", "(?<=[.!?]) +", " ", ""],
            is_separator_regex=True
        )
        
        return text_splitter.split_text(text)

    async def _process_node_dfs(self, node: dict, book_id: int) -> Tuple[List[str], List[DocumentChunk], List[uuid.UUID]]:
        """
        DFS traversal to process the document tree.
        Returns:
            - texts: list of text excerpts intended for the parent's summarization.
            - all_chunks: list of all DocumentChunk objects created in this subtree.
            - root_ids: list of root chunk ids for this node (so parent can link to them).
        """
        children = node.get("children", [])
        page_number = node.get("page_start", 1)  # Using 1 as default to match usual parsing payload keys
        level = node.get("level", 5)             # Base blocks generally use lowest/highest nested level
        node_text = node.get("text", "")
        
        if not children:
            # Base node without children
            chunks_texts = self._chunk_text(node_text, max_len=1000, overlap=200)
            
            if not chunks_texts:
                return [], [], []
                
            # Perform parallel generation embeddings per chunk segment
            embeddings = await asyncio.gather(*[self.llm_service.generate_embedding(t) for t in chunks_texts])
            
            all_chunks = []
            root_ids = []
            
            for t, emb in zip(chunks_texts, embeddings):
                chunk_id = uuid.uuid4()
                chunk = DocumentChunk(
                    id=chunk_id,
                    book_id=book_id,
                    level=level,
                    page_number=page_number,
                    text=t,
                    embedding=emb,
                    parent_id=None
                )
                all_chunks.append(chunk)
                root_ids.append(chunk_id)
                
            return chunks_texts, all_chunks, root_ids
        else:
            # Parent node
            tasks = [self._process_node_dfs(child, book_id) for child in children]
            results = await asyncio.gather(*tasks)
            
            all_children_texts = []
            all_subtree_chunks = []
            direct_children_ids = []
            
            for child_texts, child_chunks, child_root_ids in results:
                all_children_texts.extend(child_texts)
                all_subtree_chunks.extend(child_chunks)
                direct_children_ids.extend(child_root_ids)
                
            # Summarize the combined context from child nodes
            summary = await self.llm_service.summarize_children(all_children_texts)
            
            # Persist original header logic but map to the context summary
            final_text = f"{node_text}\n\nSummary:\n{summary}" if node_text else summary
            final_text = final_text.strip()
            
            if not final_text:
                return [], all_subtree_chunks, direct_children_ids
            
            emb = await self.llm_service.generate_embedding(final_text)
            parent_id = uuid.uuid4()
            parent_chunk = DocumentChunk(
                id=parent_id,
                book_id=book_id,
                level=level,
                page_number=page_number,
                text=final_text,
                embedding=emb,
                parent_id=None
            )
            
            # Map children components' 'parent_id' references directly to the new structured block
            for child_id in direct_children_ids:
                for chunk in all_subtree_chunks:
                    if chunk.id == child_id:
                        chunk.parent_id = parent_id
                        break
                        
            all_subtree_chunks.append(parent_chunk)
            
            return [final_text], all_subtree_chunks, [parent_id]

    async def process_and_save_book(self, db: AsyncSession, book_id: int, hierarchical_data: List[dict]):
        """
        Executes hierarchical traversal storing chunks within PostgreSQL asynchronously natively matching the DB connection structure
        """
        tasks = [self._process_node_dfs(node, book_id) for node in hierarchical_data]
        results = await asyncio.gather(*tasks)
        
        all_book_chunks = []
        for _, chunks, _ in results:
            all_book_chunks.extend(chunks)
            
        if all_book_chunks:
            db.add_all(all_book_chunks)
            await db.commit()
