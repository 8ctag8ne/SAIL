# models/schemas.py
from pydantic import BaseModel, ConfigDict
from typing import Optional

# Базові схеми для відповідей (Read)
class TagResponse(BaseModel):
    id: int
    title: str
    info: Optional[str] = None    
    # Цей рядок каже Pydantic: "Не лякайся, якщо тобі дадуть об'єкт SQLAlchemy, 
    # просто читай його властивості (my_tag.title)"
    model_config = ConfigDict(from_attributes=True) 

class DocumentChunkResponse(BaseModel):
    id: str
    book_id: int
    level: int
    parent_id: Optional[str]
    page_number: int
    text: str
    embedding: Optional[list[float]] = []
    model_config = ConfigDict(from_attributes=True)
    
class AuthorResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class BookResponse(BaseModel):
    id: int
    title: str
    info: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)