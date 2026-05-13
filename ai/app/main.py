# main.py
import asyncio
import time
import uuid
import httpx

from fastapi import BackgroundTasks, FastAPI, Depends, File, HTTPException, UploadFile, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, List, Optional

from app.db.database import get_db, AsyncSessionLocal
from app.db.models import Book, Tag, Author
from app.db.schemas import BookResponse, TagResponse, AuthorResponse, MetadataTaskResponse, DocumentChunkResponse
from app.core.config import settings
from app.services.md_service import process_document_combined
from app.services.parser.opendataloader_service import OpenDataLoaderService
from app.services.parser.heuristic_service import HeuristicService
from app.services.llm_service import LLMService
from app.services.chunking_strategies import SimpleChunkingStrategy
from app.services.rag_service import ChunkingService, RAGService
from fastapi.responses import StreamingResponse

app = FastAPI(title="AI Knowledge Service")

@app.get("/")
def root():
    return {"message": "Я не можу здійснювати розумову діяльність, бо в мене немає повноважень та відповідного наказу."}

TASKS_DB: Dict[str, dict] = {}

class TaskResponse(BaseModel):
    task_id: str
    status: str
    markdown: Optional[str] = None
    execution_time_seconds: Optional[float] = None
    error: Optional[str] = None

class ProcessBookTaskResponse(BaseModel):
    task_id: str
    status: str
    error: Optional[str] = None

class RagAskRequest(BaseModel):
    query: str
    temperature: Optional[float] = 0.7
    enable_thinking: Optional[bool] = False
    use_hybrid_search: Optional[bool] = True

class RagAskResponse(BaseModel):
    answer: str
    sources: List[DocumentChunkResponse]
    suggested_questions: List[str] = []

async def background_conversion_task(task_id: str, file_bytes: bytes, filename: str):
    """Обгортка для BackgroundTask, яка оновлює статус у словнику"""
    """Виконує повний цикл і записує результати та час"""
    start_time = time.time() # Початок відліку
    
    try:
        markdown = await process_document_combined(file_bytes=file_bytes, filename=filename)
        
        # 3. Фіксуємо час
        execution_time = round(time.time() - start_time, 2)
        
        # Оновлюємо базу тасок
        TASKS_DB[task_id].update({
            "status": "completed",
            "markdown": markdown,
            "execution_time_seconds": execution_time
        })
        
        print(f"Задача {task_id} завершена за {execution_time} секунд.")
        
    except Exception as e:
        execution_time = round(time.time() - start_time, 2)
        TASKS_DB[task_id].update({
            "status": "failed", 
            "error": str(e),
            "execution_time_seconds": execution_time
        })


@app.post("/convert/pdf-to-md", response_model=TaskResponse, status_code=202)
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Приймає файл, віддає ID задачі і запускає конвертацію у фоні"""
    task_id = str(uuid.uuid4())
    TASKS_DB[task_id] = {"status": "processing"}
    
    file_bytes = await file.read()
    
    # Запускаємо background_conversion_task у фоні
    background_tasks.add_task(background_conversion_task, task_id, file_bytes, file.filename)
    
    return TaskResponse(task_id=task_id, status="processing")

@app.get("/convert/status/{task_id}", response_model=TaskResponse)
async def get_status(task_id: str):
    """Повертає поточний статус або готовий результат"""
    if task_id not in TASKS_DB:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task_data = TASKS_DB[task_id]
    return TaskResponse(
        task_id=task_id,
        status=task_data["status"],
        markdown=task_data.get("markdown"),
        execution_time_seconds=task_data.get("execution_time_seconds"),
        error=task_data.get("error")
    )

async def background_metadata_task(task_id: str, file_bytes: bytes, filename: str, existing_tags: List[str]):
    try:
        parser = OpenDataLoaderService()
        heuristic = HeuristicService()
        llm_service = LLMService()
        
        # 1. Розпарсити PDF у JSON
        raw_json_data = await parser.parse(file_bytes)
        
        # 2. Витягнути текст перших і останніх сторінок
        metadata_text = heuristic.extract_metadata_context(raw_json_data)
        
        # 3. Витягнути метадані через LLM
        metadata = await llm_service.extract_metadata(metadata_text, existing_tags)
        
        # 4. Зберегти у TASKS_DB
        TASKS_DB[task_id].update({
            "status": "completed",
            "metadata": metadata
        })
        print(f"Metadata task {task_id} completed successfully.")
        
    except Exception as e:
        print(f"Metadata task {task_id} failed: {e}")
        TASKS_DB[task_id].update({
            "status": "failed",
            "error": str(e)
        })

@app.post("/convert/extract-metadata", response_model=MetadataTaskResponse, status_code=202)
async def extract_metadata_endpoint(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    task_id = str(uuid.uuid4())
    TASKS_DB[task_id] = {"status": "processing"}
    
    file_bytes = await file.read()
    
    # Отримуємо списки існуючих тегів
    result = await db.execute(select(Tag.title))
    existing_tags = [row[0] for row in result.all()]
    
    # Запускаємо фонову задачу
    background_tasks.add_task(background_metadata_task, task_id, file_bytes, file.filename, existing_tags)
    
    return MetadataTaskResponse(task_id=task_id, status="processing")

@app.get("/convert/extract-metadata/status/{task_id}", response_model=MetadataTaskResponse)
async def get_metadata_status(task_id: str):
    if task_id not in TASKS_DB:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task_data = TASKS_DB[task_id]
    return MetadataTaskResponse(
        task_id=task_id,
        status=task_data["status"],
        metadata=task_data.get("metadata"),
        error=task_data.get("error")
    )

@app.get("/debug/db-tags")
async def debug_db_tags(db: AsyncSession = Depends(get_db)):
    """Перевірка доступу ai-service до бази даних Supabase"""
    try:
        # Спробуємо витягнути теги
        result = await db.execute(select(Tag.title))
        tags = result.scalars().all()
        
        return {
            "status": "success",
            "connection": "OK",
            "tags_count": len(tags),
            "tags_sample": tags[:5] # Показуємо перші 5 тегів
        }
    except Exception as e:
        # Якщо є помилка підключення (наприклад, SSL чи таймаут), ми її тут побачимо
        return {
            "status": "error",
            "error_type": type(e).__name__,
            "message": str(e)
        }

async def background_chunking_task(task_id: str, book_id: int, file_bytes: bytes):
    try:
        parser = OpenDataLoaderService()
        heuristic = HeuristicService()
        llm_service = LLMService()
        
        strategy = SimpleChunkingStrategy(llm_service)
        chunking_service = ChunkingService(strategy)
        
        raw_json_data = await parser.parse(file_bytes)
        print(f"DEBUG: Розпарсено JSON. Кількість сирих елементів: {len(raw_json_data)}")
        
        hierarchical_data = heuristic.build_hierarchical_structure(raw_json_data)
        print(f"DEBUG: Побудовано ієрархію. Кількість вузлів після обробки: {len(hierarchical_data)}")
        
        async with AsyncSessionLocal() as db:
            try:
                print("DEBUG: Починаємо запис чанків у БД...")
                await chunking_service.process_and_save_book(db, book_id, hierarchical_data)
                print("DEBUG: Транзакція успішно зафіксована (commit).")
            except Exception as db_err:
                print(f"CRITICAL DB ERROR: {db_err}")
                raise db_err
            
        TASKS_DB[task_id].update({"status": "completed"})
        print(f"Chunking task {task_id} completed successfully.")
    except Exception as e:
        print(f"Chunking task {task_id} failed: {e}")
        TASKS_DB[task_id].update({
            "status": "failed",
            "error": str(e)
        })

@app.post("/rag/process-book/{book_id}")
async def process_book_for_rag(book_id: int, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    TASKS_DB[task_id] = {"status": "processing"}
    
    try:
        async with httpx.AsyncClient() as client:
            api_response = await client.get(f"{settings.MAIN_API_URL}/api/Book/{book_id}")
            if api_response.status_code != 200:
                raise HTTPException(status_code=404, detail="Book not found in Main API")
            
            book_data = api_response.json()
            file_url = book_data.get("fileUrl")
            
            if not file_url:
                raise HTTPException(status_code=400, detail="Book does not have a file")
                
            file_response = await client.get(file_url)
            if file_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to download book file")
                
            file_bytes = file_response.content
    except httpx.RequestError as e:
        TASKS_DB[task_id] = {"status": "failed", "error": f"Network error: {str(e)}"}
        raise HTTPException(status_code=500, detail=f"Error communicating with Main API: {str(e)}")
        
    background_tasks.add_task(background_chunking_task, task_id, book_id, file_bytes)
    return {"task_id": task_id, "status": "processing"}

@app.get("/rag/process-book/status/{task_id}", response_model=ProcessBookTaskResponse)
async def get_process_book_status(task_id: str):
    if task_id not in TASKS_DB:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task_data = TASKS_DB[task_id]
    return ProcessBookTaskResponse(
        task_id=task_id,
        status=task_data["status"],
        error=task_data.get("error")
    )

@app.post("/rag/ask")
async def ask_rag_question(request: RagAskRequest, req: Request, db: AsyncSession = Depends(get_db)):
    llm_service = LLMService()
    rag_service = RAGService(llm_service)
    
    return StreamingResponse(
        rag_service.ask_question_stream(db, request.query, request.temperature, request.enable_thinking, request.use_hybrid_search, req),
        media_type="text/event-stream"
    )

@app.post("/rag/ask/old")
async def ask_rag_question_old(request: RagAskRequest, db: AsyncSession = Depends(get_db)):
    llm_service = LLMService()
    rag_service = RAGService(llm_service)
    answer, sources, suggested_questions = await rag_service.ask_question(db, request.query, request.temperature, request.use_hybrid_search)
    
    formatted_sources = []
    for chunk in sources:
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
        
    return {
        "answer": answer if answer else "Не вдалося згенерувати відповідь.", 
        "sources": formatted_sources,
        "suggestedQuestions": suggested_questions
    }