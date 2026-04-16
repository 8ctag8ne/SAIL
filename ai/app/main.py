# main.py
import asyncio
import time
import uuid

from fastapi import BackgroundTasks, FastAPI, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, List, Optional

from app.db.database import get_db
from app.db.models import Book, Tag, Author
from app.db.schemas import BookResponse, TagResponse, AuthorResponse, MetadataTaskResponse
from app.services.md_service import process_document_combined
from app.services.parser.opendataloader_service import OpenDataLoaderService
from app.services.parser.heuristic_service import HeuristicService
from app.services.llm_service import LLMService

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