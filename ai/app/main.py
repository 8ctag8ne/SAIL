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
from app.db.schemas import BookResponse, TagResponse, AuthorResponse
from app.services.md_service import process_pdf_to_markdown, refine_markdown_semantically, convert_with_docling

app = FastAPI(title="AI Knowledge Service")

@app.get("/")
def root():
    return {"message": "Я не можу здійснювати розумову діяльність, бо в мене немає повноважень та відповідного наказу."}

TASKS_DB: Dict[str, dict] = {}

class TaskResponse(BaseModel):
    task_id: str
    status: str
    md_ocr: Optional[str] = None       # Сирий результат від Docling
    md_final: Optional[str] = None     # Результат після LLM
    execution_time_seconds: Optional[float] = None
    error: Optional[str] = None

async def background_conversion_task(task_id: str, file_bytes: bytes, filename: str):
    """Обгортка для BackgroundTask, яка оновлює статус у словнику"""
    """Виконує повний цикл і записує результати та час"""
    start_time = time.time() # Початок відліку
    
    try:
        # 1. OCR через Docling (виконуємо в окремому потоці, щоб не блокувати FastAPI)
        # Припускаємо, що ти виніс логіку конвертації Docling в окрему функцію convert_with_docling
        raw_md = await convert_with_docling(file_bytes, filename)
        
        # Проміжне збереження (на випадок, якщо LLM впаде)
        TASKS_DB[task_id]["md_ocr"] = raw_md
        
        # 2. Форматування через LLM (Llama 3.3)
        final_md = await refine_markdown_semantically(raw_md)
        
        # 3. Фіксуємо час
        execution_time = round(time.time() - start_time, 2)
        
        # Оновлюємо базу тасок
        TASKS_DB[task_id].update({
            "status": "completed",
            "md_final": final_md,
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
        md_ocr=task_data.get("md_ocr"),
        md_final=task_data.get("md_final"),
        execution_time_seconds=task_data.get("execution_time_seconds"),
        error=task_data.get("error")
    )