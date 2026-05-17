# db/models.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.db.database import Base
import uuid

class Book(Base):
    __tablename__ = "books" # Назва таблиці в PostgreSQL
    
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    info = Column(Text, nullable=True)
    
    embedding = Column(Vector(2560), nullable=True) 
    
    parsed = Column(Boolean, default=False)
    processed = Column(Boolean, default=False)

class BookMarkdown(Base):
    __tablename__ = "book_markdowns"
    
    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey("books.id"), unique=True, nullable=False)
    content = Column(Text, nullable=False)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    
    level = Column(Integer, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("document_chunks.id"), nullable=True)
    
    page_start = Column(Integer, nullable=False)
    page_end = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    # similarity_score = Column(float, nullable=True)
    
    embedding = Column(Vector(2560), nullable=True)

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    info = Column(Text, nullable=True)

class Author(Base):
    __tablename__ = "authors"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)