from abc import ABC, abstractmethod
from typing import List
from app.services.llm_service import LLMService
from app.db.models import DocumentChunk

class BaseChunkingStrategy(ABC):
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service

    @abstractmethod
    async def chunk_document(self, book_id: int, parsed_data: any) -> List[DocumentChunk]:
        """Приймає розпарсені дані і повертає готовий до запису в БД список чанків."""
        pass