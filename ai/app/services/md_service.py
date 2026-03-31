import fitz  # PyMuPDF
import base64
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings
import re
from liteparse import LiteParse

# Ініціалізація клієнта OpenRouter
llm_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

parser = LiteParse()

# Лімітуємо паралельні запити, щоб не зловити Rate Limit від OpenRouter
sem = asyncio.Semaphore(5)

async def process_page_with_vlm(image_base64: str, page_num: int) -> str:
    """Відправляє одну картинку у Qwen VL для отримання ідеальної розмітки."""
    prompt = """
You are a strictly automated Vision-Language Document Parser. Your sole purpose is to convert an image of a SINGLE document page into clean, accurate Markdown.

CONTEXT: You are processing just ONE PAGE of a larger document. The text at the top may start mid-sentence or mid-paragraph from the previous page. The text at the bottom may end mid-sentence or mid-paragraph that continues on the next page (it can also be a heading that stands alone). The page may contain various elements such as paragraphs, headings, lists, tables, images, and more. Your task is to analyze the visual layout and content of this page and produce a Markdown representation that faithfully captures the structure and formatting.

RULES:
1. EXACT REPRODUCTION: Transcribe the main body text exactly as it appears. Do not summarize text, add conversational filler, or invent structure.
2. HEADER/FOOTER EXCLUSION: Completely ignore and exclude page numbers, running headers, and footers from your output.
3. IMAGES & DIAGRAMS: If the page contains images, charts, or diagrams, generate a concise textual description of their contents. Format it exactly as: `> **[Illustration]:** <your description>`
Convert this document page into clean, structured Markdown.
4. TEXT & HEADINGS: Extract all text exactly as it appears. Use `#`, `##`, `###` for headings based strictly on visual cues (larger font, bold text, standalone lines).
5. TABLES: Format all tabular data strictly as Markdown tables (using |---|---| syntax).
6. OUTPUT: Return ONLY the raw Markdown text.
7. EMPTY PAGES: If there is no readable text or meaningful diagram, return an empty string.
8. OUTPUT FORMAT: Output ONLY the raw Markdown text. Do not add introductions or conclusions.
"""
    
    async with sem:
        # Використовуємо вказану тобою модель (переконайся, що ID точний для OpenRouter)
        response = await llm_client.chat.completions.create(
            model="qwen/qwen3-vl-32b-instruct", 
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ],
            temperature=0.0
        )
        return response.choices[0].message.content.strip()

async def fallback_liteparse(file_bytes: bytes, filename: str) -> str:
    print("⚠️ LiteParse fallback (layout-aware)...")

    result = await asyncio.to_thread(parser.parse, file_bytes)

    return postprocess_text(result.text)

def postprocess_text(text: str) -> str:
    text = fix_hyphenation(text)
    return text.strip()


def fix_hyphenation(text: str) -> str:
    import re
    return re.sub(r'(\w+)-\s+(\w+)', r'\1\2', text)



async def process_document_combined(file_bytes: bytes, filename: str) -> str:
    """
    Головний метод: намагається використати VLM, при помилці падає на фолбек.
    """
    try:
        print("🚀 Запуск основної VLM моделі через OpenRouter...")
        
        # 1. Читаємо PDF прямо з пам'яті (блискавично швидка операція)
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        tasks = []
        
        # 2. Нарізаємо сторінки
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) 
            img_base64 = base64.b64encode(pix.tobytes("jpeg")).decode("utf-8")
            
            # Додаємо сторінку в пул задач
            tasks.append(process_page_with_vlm(img_base64, page_num + 1))
            
        # 3. Чекаємо на відповідь від усіх сторінок паралельно
        pages_markdown = await asyncio.gather(*tasks)
        
        return "\n\n".join(pages_markdown)

    except Exception as e:
        print(f"❌ Помилка основної VLM гілки: {str(e)}")
        # 4. Якщо OpenRouter впав, відпрацьовує надійний локальний парсер
        return await fallback_liteparse(file_bytes, filename)