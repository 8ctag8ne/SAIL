from .parser.base import IDocumentParser
from .parser.heuristic_service import HeuristicService

class DocumentPipeline:
    def __init__(self, parser: IDocumentParser, heuristic_service: HeuristicService):
        self.parser = parser
        self.heuristic_service = heuristic_service
        
    async def process(self, file_bytes: bytes) -> str:
        # Parse the document
        raw_markdown = await self.parser.parse(file_bytes)
        
        # Clean the resulting markdown
        clean_markdown = self.heuristic_service.clean_markdown(raw_markdown)
        
        return clean_markdown
