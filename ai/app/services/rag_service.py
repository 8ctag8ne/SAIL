#ai/app/services/rag_service.py
import uuid
import asyncio
import re
from typing import List, Tuple

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.db.models import DocumentChunk
from app.services.llm_service import LLMService
from app.services.chunking_strategies import BaseChunkingStrategy

class ChunkingService:
    def __init__(self, strategy: BaseChunkingStrategy):
        self.strategy = strategy

    async def process_and_save_book(self, db: AsyncSession, book_id: int, parsed_data: any):
        # 1. Видаляємо старі чанки книги
        await db.execute(delete(DocumentChunk).where(DocumentChunk.book_id == book_id))
        
        # 2. Викликаємо обрану стратегію
        all_book_chunks = await self.strategy.chunk_document(book_id, parsed_data)
        
        # 3. Записуємо в БД
        if all_book_chunks:
            db.add_all(all_book_chunks)
            await db.commit()

class RAGService:
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service
        
    async def retrieve_chunks(self, db: AsyncSession, query: str, top_k: int = 10) -> List[DocumentChunk]:
        query_embedding = await self.llm_service.generate_embedding(query)
        if not query_embedding:
            return []
            
        # Пошук за косинусною відстанню pgvector
        result = await db.execute(
            select(DocumentChunk)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        found_chunks = result.scalars().all()
        
        final_chunks = []
        for chunk in found_chunks:
            if chunk not in final_chunks:
                final_chunks.append(chunk)
            # Якщо є батьківський чанк, додаємо його також для ширшого контексту
            if chunk.parent_id:
                parent_result = await db.execute(
                    select(DocumentChunk).where(DocumentChunk.id == chunk.parent_id)
                )
                parent_chunk = parent_result.scalar_one_or_none()
                if parent_chunk and parent_chunk not in final_chunks:
                    final_chunks.append(parent_chunk)
                    
        return final_chunks
        
    async def ask_question(self, db: AsyncSession, query: str) -> Tuple[str, List[DocumentChunk]]:
        chunks = await self.retrieve_chunks(db, query)
        
        if not chunks:
            return "На жаль, інформації за вашим запитом не знайдено.", []
            
        context_parts = []
        
        for chunk in chunks:
            pages = f"{chunk.page_start}-{chunk.page_end}" if chunk.page_start != chunk.page_end else str(chunk.page_start)
            context_parts.append(f"[Сторінки: {pages}]: {chunk.text}")
                
        context = "\n\n".join(context_parts)
        answer = await self.llm_service.generate_rag_answer(query, context)
        
        return answer, chunks