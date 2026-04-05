from typing import Protocol

class IDocumentParser(Protocol):
    async def parse(self, file_bytes: bytes) -> str:
        ...
