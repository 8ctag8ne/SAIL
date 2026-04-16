#ai/app/services/parser/base.py
from typing import Protocol, List, Dict, Any

class IDocumentParser(Protocol):
    async def parse(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        ...