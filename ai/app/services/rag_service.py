#ai/app/services/rag_service.py
import asyncio
import logging
from typing import List, Tuple, Any

from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_community.retrievers import BM25Retriever
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.db.models import DocumentChunk
from app.services.llm_service import LLMService
from app.services.query_service import QueryProcessor
from app.services.chunking_strategies.base import BaseChunkingStrategy

logger = logging.getLogger(__name__)

class AsyncCustomVectorRetriever(BaseRetriever):
    db: Any = Field(exclude=True)
    llm_service: Any = Field(exclude=True)
    top_k: int = 10

    def _get_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun) -> List[Document]:
        raise NotImplementedError("This retriever only supports async operations.")

    async def _aget_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun) -> List[Document]:
        query_embedding = await self.llm_service.generate_embedding(query)
        if not query_embedding:
            return []
            
        distance_expr = DocumentChunk.embedding.cosine_distance(query_embedding)
        result = await self.db.execute(
            select(DocumentChunk, distance_expr).order_by(distance_expr).limit(self.top_k)
        )
        
        docs = []
        seen_ids = set()
        
        for chunk, distance in result.all():
            similarity_score = round(1.0 - float(distance), 4) 
            if chunk.id not in seen_ids:
                chunk.similarity_score = similarity_score
                docs.append(Document(page_content=chunk.text, metadata={"chunk": chunk}))
                seen_ids.add(chunk.id)
                
            if chunk.parent_id and chunk.parent_id not in seen_ids:
                parent_result = await self.db.execute(
                    select(DocumentChunk).where(DocumentChunk.id == chunk.parent_id)
                )
                parent_chunk = parent_result.scalar_one_or_none()
                if parent_chunk:
                    parent_chunk.similarity_score = similarity_score 
                    docs.append(Document(page_content=parent_chunk.text, metadata={"chunk": parent_chunk}))
                    seen_ids.add(parent_chunk.id)
        return docs

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
        self.query_processor = QueryProcessor()
        
    async def retrieve_chunks(self, db: AsyncSession, query: str, top_k: int = 10, use_hybrid_search: bool = True) -> List[DocumentChunk]:
        # ── Step 1: Domain Query Adaptation ──────────────────────────────────
        glossary_context = self.query_processor.extract_glossary_context(query)
        if glossary_context:
            logger.debug(
                "QueryProcessor matched glossary terms:\n%s", glossary_context
            )

        # ── Step 2: Query Rewriting (dense retrieval path) ───────────────────
        # rewrite_query has its own fallback — it always returns a usable string.
        rewritten_query = await self.llm_service.rewrite_query(query, glossary_context)
        logger.debug("Rewritten query for dense search: %s", rewritten_query)

        # BM25 benefits from extra keywords, so append glossary terms to the
        # original query rather than using the full LLM-rewritten version.
        glossary_keywords = " ".join(
            line.replace("Синоніми: ", "").replace("Термін: ", "")
            for line in glossary_context.splitlines()
            if line.startswith(("Термін:", "Синоніми:"))
        ).strip()
        bm25_query = f"{query} {glossary_keywords}".strip() if glossary_keywords else query

        vector_retriever = AsyncCustomVectorRetriever(
            db=db, llm_service=self.llm_service, top_k=top_k
        )

        if use_hybrid_search:
            all_chunks_result = await db.execute(select(DocumentChunk))
            all_chunks = all_chunks_result.scalars().all()
            if not all_chunks:
                return []

            bm25_docs = [
                Document(page_content=c.text, metadata={"chunk": c})
                for c in all_chunks
            ]
            bm25_retriever = BM25Retriever.from_documents(bm25_docs)
            bm25_retriever.k = top_k

            # ── Step 3: Concurrent search ─────────────────────────────────────
            bm25_result, vector_result = await asyncio.gather(
                bm25_retriever.ainvoke(bm25_query),
                vector_retriever.ainvoke(rewritten_query),
            )

            # ── Step 4: Weighted RRF (Reciprocal Rank Fusion) ─────────────────
            c = 60
            weights = [0.3, 0.7]

            rrf_scores: dict = {}
            chunk_map: dict = {}

            for rank, doc in enumerate(bm25_result, start=1):
                chunk = doc.metadata.get("chunk")
                if chunk:
                    chunk_map[chunk.id] = chunk
                    rrf_scores[chunk.id] = (
                        rrf_scores.get(chunk.id, 0.0)
                        + weights[0] * (1.0 / (rank + c))
                    )

            for rank, doc in enumerate(vector_result, start=1):
                chunk = doc.metadata.get("chunk")
                if chunk:
                    chunk_map[chunk.id] = chunk
                    rrf_scores[chunk.id] = (
                        rrf_scores.get(chunk.id, 0.0)
                        + weights[1] * (1.0 / (rank + c))
                    )

            sorted_items = sorted(
                rrf_scores.items(), key=lambda x: x[1], reverse=True
            )
            theoretical_max = sum(w / (1 + c) for w in weights)

            final_chunks: list = []
            seen_ids: set = set()
            for chunk_id, rrf_score in sorted_items:
                if chunk_id not in seen_ids:
                    chunk = chunk_map[chunk_id]
                    # Нормалізація істинного RRF
                    normalized_score = rrf_score / theoretical_max
                    chunk.similarity_score = round(normalized_score, 4)
                    final_chunks.append(chunk)
                    seen_ids.add(chunk_id)
            return final_chunks[:top_k]
        else:
            docs = await vector_retriever.ainvoke(rewritten_query)
            final_chunks = []
            seen_ids: set = set()
            for doc in docs:
                chunk = doc.metadata.get("chunk")
                if chunk and chunk.id not in seen_ids:
                    final_chunks.append(chunk)
                    seen_ids.add(chunk.id)
            return final_chunks[:top_k]
        
    async def ask_question(self, db: AsyncSession, query: str, temperature: float = 0.1, use_hybrid_search: bool = True) -> Tuple[str, List[DocumentChunk], List[str]]:
        chunks = await self.retrieve_chunks(db, query, use_hybrid_search=use_hybrid_search)
        
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

    async def ask_question_stream(self, db: AsyncSession, query: str, temperature: float = 0.7, enable_thinking: bool = False, use_hybrid_search: bool = True, req = None):
        chunks = await self.retrieve_chunks(db, query, use_hybrid_search=use_hybrid_search)
        
        if req and await req.is_disconnected():
            return
        
        if not chunks:
            yield f'data: {{"type": "error", "data": "На жаль, інформації за вашим запитом не знайдено."}}\n\n'
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
            
        yield f'data: {json.dumps({"type": "sources", "data": formatted_sources}, ensure_ascii=False)}\n\n'
        
        # Start suggested questions task (it runs concurrently)
        questions_task = asyncio.create_task(self.llm_service.generate_suggested_questions(query, context))
        
        # Stream answer
        async for sse_chunk in self.llm_service.generate_rag_answer_stream(query, context, temperature, enable_thinking, req):
            if req and await req.is_disconnected():
                print("DEBUG: Клієнт відключився під час стрімінгу відповіді.")
                break
            yield sse_chunk
            
        # Await and yield questions
        try:
            suggested_questions = await questions_task
            yield f'data: {json.dumps({"type": "questions", "data": suggested_questions}, ensure_ascii=False)}\n\n'
        except Exception as e:
            pass