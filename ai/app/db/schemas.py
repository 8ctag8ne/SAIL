from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

class MetadataTaskResponse(BaseModel):
    task_id: str
    status: str
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Базові схеми для відповідей (Read)
class TagResponse(BaseModel):
    id: int
    title: str
    info: Optional[str] = None
    model_config = ConfigDict(from_attributes=True) 

class DocumentChunkResponse(BaseModel):
    id: str
    book_id: int
    level: int
    parent_id: Optional[str]
    page_start: Optional[int]
    page_end: Optional[int]
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