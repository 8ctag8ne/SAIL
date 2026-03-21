# main.py
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.database import get_db
from app.db.models import Book, Tag, Author
from app.db.schemas import BookResponse, TagResponse, AuthorResponse

app = FastAPI(title="AI Knowledge Service")

@app.get("/")
def root():
    return {"message": "Я не можу здійснювати розумову діяльність, бо в мене немає повноважень та відповідного наказу."}

@app.get("/tags", response_model=List[TagResponse])
async def get_all_tags(db: AsyncSession = Depends(get_db)):
    """Отримати всі теги з бази даних (DI в дії)"""
    # 1. Формуємо запит
    stmt = select(Tag)
    # 2. Виконуємо запит асинхронно
    result = await db.execute(stmt)
    # 3. Витягуємо об'єкти зі скалярного результату
    return result.scalars().all()

@app.get("/authors", response_model=List[AuthorResponse])
async def get_all_authors(db: AsyncSession = Depends(get_db)):
    """Отримати всіх авторів"""
    stmt = select(Author)
    result = await db.execute(stmt)
    return result.scalars().all()

@app.get("/books", response_model=List[BookResponse])
async def get_all_books(db: AsyncSession = Depends(get_db)):
    """Отримати всі книги (тільки базові поля)"""
    stmt = select(Book)
    result = await db.execute(stmt)
    return result.scalars().all()