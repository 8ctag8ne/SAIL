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
        
    async def rewrite_query_for_retrieval(self, query: str, uncensored: bool = False) -> tuple[str, str]:
        """Rewrite *query* using the glossary + LLM and return (rewritten_query, bm25_query).

        Args:
            query:      Original user query.
            uncensored: Passed to LLMService.rewrite_query — if True, tries the
                        uncensored model (dolphin) first; if False (default),
                        goes directly to qwen.
        """
        glossary_context = self.query_processor.extract_glossary_context(query)

        print("Retrieved glossary context: \n")
        print(glossary_context+"\n\n----------------\n\n")

        # if not glossary_context:
        #     # Nothing matched — skip the LLM call entirely and use the raw query.
        #     return query, query

        print("QueryProcessor matched glossary terms:\n%s", glossary_context)

        # Dense retrieval path — full LLM rewrite.
        rewritten_query = await self.llm_service.rewrite_query(query, glossary_context, uncensored=uncensored)
        print(f"Rewritten query for dense search: {rewritten_query}")

        # BM25 benefits from extra keywords; append matched terms/synonyms to the
        # original query rather than using the full LLM-rewritten version.
        # Context lines now start with either "Термін:" or "Синонім:"
        glossary_keywords = " ".join(
            line.split(":", 1)[1].strip()
            for line in glossary_context.splitlines()
            if line.startswith(("Термін:", "Синонім:"))
        ).strip()
        bm25_query = f"{query} {glossary_keywords}".strip() if glossary_keywords else query

        return rewritten_query, bm25_query

    async def retrieve_chunks(
        self,
        db: AsyncSession,
        vector_query: str,
        bm25_query: str,
        top_k: int = 10,
        use_hybrid_search: bool = True,
    ) -> List[DocumentChunk]:
        """Retrieve chunks using pre-prepared *vector_query* (dense) and *bm25_query* (sparse).

        Query rewriting is NOT performed here — callers are expected to prepare
        the queries beforehand (e.g. via ``rewrite_query_for_retrieval``).
        """
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

            # ── Concurrent search ─────────────────────────────────────────────
            bm25_result, vector_result = await asyncio.gather(
                bm25_retriever.ainvoke(bm25_query),
                vector_retriever.ainvoke(vector_query),
            )

            # ── Weighted RRF (Reciprocal Rank Fusion) ─────────────────────────
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
                    normalized_score = rrf_score / theoretical_max
                    chunk.similarity_score = round(normalized_score, 4)
                    final_chunks.append(chunk)
                    seen_ids.add(chunk_id)
            return final_chunks[:top_k]
        else:
            docs = await vector_retriever.ainvoke(vector_query)
            final_chunks = []
            seen_ids: set = set()
            for doc in docs:
                chunk = doc.metadata.get("chunk")
                if chunk and chunk.id not in seen_ids:
                    final_chunks.append(chunk)
                    seen_ids.add(chunk.id)
            return final_chunks[:top_k]
        
    async def ask_question(
        self,
        db: AsyncSession,
        query: str,
        temperature: float = 0.1,
        use_hybrid_search: bool = True,
        rewrite: bool = True,
        uncensored: bool = False,
        additional_questions: bool = True,
    ) -> Tuple[str, List[DocumentChunk], List[str]]:
        # ── Query rewriting ───────────────────────────────────────────────────
        if rewrite:
            vector_query, bm25_query = await self.rewrite_query_for_retrieval(query, uncensored=uncensored)
        else:
            vector_query, bm25_query = query, query

        chunks = await self.retrieve_chunks(
            db, vector_query, bm25_query, use_hybrid_search=use_hybrid_search
        )

        if not chunks:
            return "На жаль, інформації за вашим запитом не знайдено.", [], []

        context_parts = []
        for chunk in chunks:
            pages = f"{chunk.page_start}-{chunk.page_end}" if chunk.page_start != chunk.page_end else str(chunk.page_start)
            context_parts.append(f"[Сторінки: {pages}]: {chunk.text}")

        context = "\n\n".join(context_parts)
        answer_task = self.llm_service.generate_rag_answer(vector_query, context, temperature)
        
        if additional_questions:
            questions_task = self.llm_service.generate_suggested_questions(vector_query, context)
            answer, suggested_questions = await asyncio.gather(answer_task, questions_task)
        else:
            answer = await answer_task
            suggested_questions = []

        return answer, chunks, suggested_questions

    async def ask_question_stream(
        self,
        db: AsyncSession,
        query: str,
        temperature: float = 0.7,
        enable_thinking: bool = False,
        use_hybrid_search: bool = True,
        rewrite: bool = True,
        uncensored: bool = False,
        req=None,
        additional_questions: bool = True,
    ):
        # ── Query rewriting ───────────────────────────────────────────────────
        if rewrite:
            vector_query, bm25_query = await self.rewrite_query_for_retrieval(query, uncensored=uncensored)
            import json as _json
            yield f'data: {_json.dumps({"type": "rewritten_query", "data": vector_query}, ensure_ascii=False)}\n\n'
        else:
            vector_query, bm25_query = query, query
 
 
        chunks = await self.retrieve_chunks(
            db, vector_query, bm25_query, use_hybrid_search=use_hybrid_search
        )
        
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
        
        # Start suggested questions task (it runs concurrently if enabled)
        questions_task = None
        if additional_questions:
            questions_task = asyncio.create_task(self.llm_service.generate_suggested_questions(vector_query, context))
        
        try:
            # Stream answer
            async for sse_chunk in self.llm_service.generate_rag_answer_stream(vector_query, context, temperature, enable_thinking, req):
                if req and await req.is_disconnected():
                    print("DEBUG: Клієнт відключився під час стрімінгу відповіді.")
                    break
                yield sse_chunk
                
            # Await and yield questions
            if additional_questions and questions_task:
                try:
                    suggested_questions = await questions_task
                    yield f'data: {json.dumps({"type": "questions", "data": suggested_questions}, ensure_ascii=False)}\n\n'
                except Exception as e:
                    pass
        finally:
            if additional_questions and questions_task and not questions_task.done():
                questions_task.cancel()
                try:
                    await questions_task
                except asyncio.CancelledError:
                    pass