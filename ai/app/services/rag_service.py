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
            
        distance_expr = DocumentChunk.embedding.cosine_distance(query_embedding)
        result = await db.execute(
            select(DocumentChunk, distance_expr)
            .order_by(distance_expr)
            .limit(top_k)
        )
        
        final_chunks = []
        seen_ids = set()
        
        for chunk, distance in result.all():
            if chunk.id not in seen_ids:
                chunk.similarity_score = round(1.0 - float(distance), 4) 
                final_chunks.append(chunk)
                seen_ids.add(chunk.id)
                
            if chunk.parent_id and chunk.parent_id not in seen_ids:
                parent_result = await db.execute(
                    select(DocumentChunk).where(DocumentChunk.id == chunk.parent_id)
                )
                parent_chunk = parent_result.scalar_one_or_none()
                if parent_chunk:
                    parent_chunk.similarity_score = chunk.similarity_score 
                    final_chunks.append(parent_chunk)
                    seen_ids.add(parent_chunk.id)
                    
        return final_chunks
        
    async def ask_question(self, db: AsyncSession, query: str, temperature: float = 0.1) -> Tuple[str, List[DocumentChunk], List[str]]:
        chunks = await self.retrieve_chunks(db, query)
        
        if not chunks:
            return "На жаль, інформації за вашим запитом не знайдено.", [], []
            
        context_parts = []
        
        for chunk in chunks:
            pages = f"{chunk.page_start}-{chunk.page_end}" if chunk.page_start != chunk.page_end else str(chunk.page_start)
            context_parts.append(f"[Сторінки: {pages}]: {chunk.text}")
                
        context = "\n\n".join(context_parts)
        answer_task = self.llm_service.generate_rag_answer(query, context, temperature)
        questions_task = self.llm_service.generate_suggested_questions(query, context)
        
        answer, suggested_questions = await asyncio.gather(answer_task, questions_task)
        
        return answer, chunks, suggested_questions

    async def ask_question_stream(self, db: AsyncSession, query: str, temperature: float = 0.7, enable_thinking: bool = False):
        chunks = await self.retrieve_chunks(db, query)
        
        if not chunks:
            yield '{"type": "error", "data": "На жаль, інформації за вашим запитом не знайдено."}\n'
            return
            
        context_parts = []
        for chunk in chunks:
            pages = f"{chunk.page_start}-{chunk.page_end}" if chunk.page_start != chunk.page_end else str(chunk.page_start)
            context_parts.append(f"[Сторінки: {pages}]: {chunk.text}")
                
        context = "\n\n".join(context_parts)
        
        # Prepare and yield sources
        import json
        formatted_sources = []
        for chunk in chunks:
            formatted_sources.append({
                "id": str(chunk.id),
                "bookId": chunk.book_id,
                "level": chunk.level,
                "parentId": str(chunk.parent_id) if getattr(chunk, "parent_id", None) else None,
                "pageStart": chunk.page_start,
                "pageEnd": chunk.page_end,
                "text": chunk.text,
                "similarityScore": getattr(chunk, "similarity_score", 0.0)
            })
            
        yield json.dumps({"type": "sources", "data": formatted_sources}, ensure_ascii=False) + "\n"
        
        # Start suggested questions task (it runs concurrently)
        questions_task = asyncio.create_task(self.llm_service.generate_suggested_questions(query, context))
        
        # Stream answer
        async for chunk_text in self.llm_service.generate_rag_answer_stream(query, context, temperature, enable_thinking):
            yield json.dumps({"type": "chunk", "data": chunk_text}, ensure_ascii=False) + "\n"
            
        # Await and yield questions
        try:
            suggested_questions = await questions_task
            yield json.dumps({"type": "questions", "data": suggested_questions}, ensure_ascii=False) + "\n"
        except Exception as e:
            pass