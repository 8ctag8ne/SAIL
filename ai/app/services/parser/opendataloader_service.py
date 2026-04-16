#ai/app/services/parser/opendataloader_service.py
import asyncio
import os
import tempfile
import shutil
import json
import opendataloader_pdf
from typing import List, Dict, Any
from .base import IDocumentParser

class OpenDataLoaderService(IDocumentParser):
    async def parse(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        # Create temporary directories for input and output
        in_dir = tempfile.mkdtemp()
        out_dir = tempfile.mkdtemp()
        
        try:
            # Write bytes to a pdf file in the input directory
            temp_pdf_path = os.path.join(in_dir, "document.pdf")
            with open(temp_pdf_path, 'wb') as f:
                f.write(file_bytes)
            
            def _convert_sync() -> List[Dict[str, Any]]:
                # Based on the documentation, this batch processes the file and spawns a JVM
                opendataloader_pdf.convert(
                    input_path=[temp_pdf_path],
                    output_dir=out_dir,
                    format="json"
                )
                
                # Check for the expected output file (document.json)
                out_json_path = os.path.join(out_dir, "document.json")
                if os.path.exists(out_json_path):
                    with open(out_json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        return data.get("kids", [])
                
                # Fallback: if filename differs, just find and read the first .json file
                for root, _, files in os.walk(out_dir):
                    for file in files:
                        if file.endswith('.json'):
                            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                                data = json.load(f)
                                return data.get("kids", [])
                
                return []
                
            # Run the synchronous conversion in a thread to prevent blocking the event loop
            json_data = await asyncio.to_thread(_convert_sync)
            return json_data
            
        finally:
            # Clean up both temporary directories
            shutil.rmtree(in_dir, ignore_errors=True)
            shutil.rmtree(out_dir, ignore_errors=True)
