#ai/app/services/pipeline_service.py
from .parser.base import IDocumentParser
from .parser.heuristic_service import HeuristicService

class DocumentPipeline:
    def __init__(self, parser: IDocumentParser, heuristic_service: HeuristicService):
        self.parser = parser
        self.heuristic_service = heuristic_service
        
    async def process(self, file_bytes: bytes) -> str:
        # 1. Parse the document to raw JSON
        raw_json_data = await self.parser.parse(file_bytes)
        print("\n\n\n\n\n\n----------------------RAW JSON----------------------")
        print(raw_json_data)
        print("\n\n\n\n\n\n")
        
        # 2. Clean and merge JSON elements
        cleaned_json_data = self.heuristic_service.clean_json_elements(raw_json_data)
        print("\n\n\n\n\n\n----------------------CLEAN JSON----------------------")
        print(cleaned_json_data)
        print("\n\n\n\n\n\n")
        
        # 3. Build hierarchical structure
        hierarchical_data = self.heuristic_service.build_hierarchical_structure(cleaned_json_data)
        # print("\n\n\n\n\n\n----------------------HIERARCHICAL JSON----------------------")
        # print(hierarchical_data)
        # print("\n\n\n\n\n\n")
        
        # 3. Convert back to markdown
        clean_markdown = self.heuristic_service.convert_to_markdown(hierarchical_data)
        # print("\n\n\n\n\n\n----------------------CLEAN MARKDOWN----------------------")
        # print(clean_markdown)
        # print("\n\n\n\n\n\n")
        
        return clean_markdown
