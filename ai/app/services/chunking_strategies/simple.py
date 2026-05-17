#ai/app/services/chunking_strategies.py
import uuid
import asyncio
from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.db.models import DocumentChunk
from app.services.chunking_strategies.base import BaseChunkingStrategy

class SimpleChunkingStrategy(BaseChunkingStrategy):
    async def chunk_document(self, book_id: int, markdown_text: str) -> List[DocumentChunk]:
        if not isinstance(markdown_text, str):
            # Fallback if old code somehow passes dict
            from app.services.parser.heuristic_service import HeuristicService
            markdown_text = HeuristicService().convert_to_markdown(markdown_text)

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
                    page_start=None,
                    page_end=None,
                    text=t,
                    embedding=emb,
                    parent_id=None
                )
                all_chunks.append(chunk)
                
            # Невелика пауза, щоб дати CPU/Network "подихати"
            await asyncio.sleep(0.5)
            
        return all_chunks