import asyncio
import os
import tempfile
import shutil
import opendataloader_pdf
from .base import IDocumentParser

class OpenDataLoaderService(IDocumentParser):
    async def parse(self, file_bytes: bytes) -> str:
        # Create temporary directories for input and output
        in_dir = tempfile.mkdtemp()
        out_dir = tempfile.mkdtemp()
        
        try:
            # Write bytes to a pdf file in the input directory
            temp_pdf_path = os.path.join(in_dir, "document.pdf")
            with open(temp_pdf_path, 'wb') as f:
                f.write(file_bytes)
            
            def _convert_sync() -> str:
                # Based on the documentation, this batch processes the file and spawns a JVM
                opendataloader_pdf.convert(
                    input_path=[temp_pdf_path],
                    output_dir=out_dir,
                    format="markdown"
                )
                
                # Check for the expected output file (document.md)
                out_md_path = os.path.join(out_dir, "document.md")
                if os.path.exists(out_md_path):
                    with open(out_md_path, 'r', encoding='utf-8') as f:
                        return f.read()
                
                # Fallback: if filename differs, just find and read the first .md file
                for root, _, files in os.walk(out_dir):
                    for file in files:
                        if file.endswith('.md'):
                            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                                return f.read()
                
                return ""
                
            # Run the synchronous conversion in a thread to prevent blocking the event loop
            markdown_text = await asyncio.to_thread(_convert_sync)
            return markdown_text
            
        finally:
            # Clean up both temporary directories
            shutil.rmtree(in_dir, ignore_errors=True)
            shutil.rmtree(out_dir, ignore_errors=True)
