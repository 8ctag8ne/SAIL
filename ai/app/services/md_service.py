#ai/app/services/md_service.py
from app.services.parser.opendataloader_service import OpenDataLoaderService
from app.services.parser.heuristic_service import HeuristicService
from app.services.pipeline_service import DocumentPipeline

# Pipeline Initialization
_parser = OpenDataLoaderService()
_heuristic = HeuristicService()
pipeline = DocumentPipeline(parser=_parser, heuristic_service=_heuristic)

async def process_document_combined(file_bytes: bytes, filename: str) -> str:
    """
    Combines parsing and post-processing heuristics to extract clean markdown from a document.
    """
    return await pipeline.process(file_bytes)