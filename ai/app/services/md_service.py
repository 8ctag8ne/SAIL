# services/md_service.py
import re
import tempfile
import os
import asyncio
from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from docling.document_converter import PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from openai import AsyncOpenAI

from app.core.config import settings
sem = asyncio.Semaphore(8)

# Налаштовуємо пайплайн для PDF
pipeline_options = PdfPipelineOptions()
pipeline_options.do_ocr = True # Дозволяємо OCR для картинок/сканів
# Вказуємо мови для розпізнавання (en - англійська, uk - українська)
pipeline_options.ocr_options.lang = ["en", "uk", "ru"] 

# Ініціалізуємо конвертер з нашими налаштуваннями
converter = DocumentConverter(
    allowed_formats=[InputFormat.PDF, InputFormat.DOCX],
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
        InputFormat.DOCX: PdfFormatOption(pipeline_options=pipeline_options),
    }
)

llm_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

async def process_pdf_to_markdown(file_bytes: bytes, filename: str) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(file_bytes)
        tmp_file_path = tmp_file.name

    try:
        # 1. Парсимо через Docling (синхронно, бо це CPU-bound операція)
        result = await asyncio.to_thread(converter.convert, tmp_file_path)
        raw_markdown = result.document.export_to_markdown()
        
        # 2. Очищуємо та структуруємо через LLM (асинхронно)
        refined_markdown = await refine_markdown_semantically(raw_markdown)
        
        return refined_markdown
        
    finally:
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)

async def convert_with_docling(file_bytes: bytes, filename: str) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(file_bytes)
        tmp_file_path = tmp_file.name

    try:
        # 1. Парсимо через Docling (синхронно, бо це CPU-bound операція)
        result = await asyncio.to_thread(converter.convert, tmp_file_path)
        raw_markdown = result.document.export_to_markdown()
        
        return raw_markdown
        
    finally:
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


async def refine_chunk_safe(chunk_text: str, chunk_index: int) -> str:
    """Обгортка, яка контролює паралельність запитів"""
    async with sem:
        return await refine_chunk(chunk_text, chunk_index)

async def refine_chunk(chunk_text: str, chunk_index: int) -> str:
    """Обробляє один невеликий шматок тексту через LLM."""
    system_prompt = """
    You are a STRICT Markdown formatting engine. 
    Your ONLY job is to fix the Markdown hierarchy and tables from OCR output.
    You do NOT converse, you do NOT summarize, and you do NOT add ANY introductory or concluding remarks.
    
    YOUR EXACT TASK:
    1. Receive raw, unformatted text extracted from an OCR engine.
    2. DO NOT REPHRASE, SUMMARIZE, OR CHANGE ANY WORDS. Keep the exact original text, even if OCR has minor typos. Your job is ONLY markup.
    3. Reconstruct the logical hierarchy using Markdown headings (# for main title, ## for chapters, ### for sections, etc.) based on context and numbering (e.g., 1., 1.1, 1.1.1).
    4. Fix broken tables and lists, formatting them perfectly in Markdown.
    5. Remove all garbage data: page numbers, repetitive headers/footers, and meaningless characters.
    6. DO NOT alter the original meaning, facts, or language of the text. Keep it in the original language (Ukrainian/English/Russian).
    
    CRITICAL CONSTRAINT: Output ONLY the formatted Markdown. If you output phrases like "Here is the formatted text:" or "The text says...", you will fail your core directive.
    """
    try:
        response = await llm_client.chat.completions.create(
            model="qwen/qwen-2.5-72b-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"RAW TEXT TO FORMAT:\n\n{chunk_text}"}
            ],
            temperature=0.0,
            max_tokens=8000 # Даємо моделі простір для відповіді
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Помилка в чанку {chunk_index}: {e}")
        return chunk_text # Повертаємо як є у разі збою

async def refine_markdown_semantically(raw_markdown: str, max_chunk_size: int = 10000) -> str:
    """Розбиває текст ПО ЗАГОЛОВКАХ, щоб не розривати контекст."""
    
    # Регулярний вираз: шукає початок рядка (^), за яким ідуть від 1 до 3 символів # і пробіл.
    # Прапорець (?m) означає multiline.
    # Ми розрізаємо текст ПЕРЕД заголовком, тому заголовок завжди буде на початку нового блоку.
    parts = re.split(r'(?m)^(?=#{1,3}\s)', raw_markdown)
    
    chunks = []
    current_chunk = ""
    
    for part in parts:
        if not part.strip():
            continue
            
        # Якщо додавання наступного розділу перевищить ліміт (20к символів)
        # І поточний чанк вже має якісь дані, відправляємо його в масив
        if len(current_chunk) + len(part) > max_chunk_size and current_chunk:
            chunks.append(current_chunk)
            current_chunk = part
        else:
            current_chunk += part
            
    if current_chunk:
        chunks.append(current_chunk)

    print(f"Книгу розбито на {len(chunks)} семантичних блоків (по розділах).")
    
    tasks = [refine_chunk_safe(chunk, i) for i, chunk in enumerate(chunks)]
    refined_chunks = await asyncio.gather(*tasks)
    
    return "\n\n".join(refined_chunks)