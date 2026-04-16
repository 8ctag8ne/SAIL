from app.core.config import settings
import os
import json
import asyncio
from typing import List
from openai import AsyncOpenAI
import openai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class LLMService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
        )
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "qwen/qwen3-embedding-4b")
        self.summary_model = os.getenv("SUMMARY_MODEL", "qwen/qwen-2.5-7b-instruct")

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError))
    )
    async def generate_embedding(self, text: str) -> list[float]:
        if not text.strip():
            return []
        
        model = os.getenv("EMBEDDING_MODEL", "qwen/qwen3-embedding-4b")
        
        response = await self.client.embeddings.create(
            input=text,
            model=model
        )
        return response.data[0].embedding

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError))
    )
    async def summarize_children(self, children_texts: list[str]) -> str:
        if not children_texts:
            return ""
            
        combined_text = "\n\n".join([f"Child node {i+1}: {text}" for i, text in enumerate(children_texts)])
        
        prompt = f"""Summarize the following sections into a single, cohesive description that represents the combined context.
Keep the summary concise and focused on the main thematic concepts.

{combined_text}

Summary:"""

        model = os.getenv("SUMMARY_MODEL", "qwen/qwen2.5-7b-instruct") # fallback to 0.6b or 7b

        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that summarizes hierarchical document nodes."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise e

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError))
    )
    async def extract_metadata(self, text: str, existing_tags: list[str]) -> dict:
        system_prompt = (
            "Ти — головний військовий бібліотекар-архіваріус. Твоє завдання: глибоко проаналізувати текст "
            "і повернути метадані ВИКЛЮЧНО у форматі валідного JSON без жодних додаткових коментарів чи markdown-розмітки (без ```json)."
        )
        
        user_prompt = f"""### ІНСТРУКЦІЯ З АНАЛІЗУ ДОКУМЕНТА
        
Проаналізуй текст та сформуй метадані за наступними суворими правилами:

**1. "title" (Назва книги):**
Залишай оригінальну мову. Якщо точної назви немає, сформуй коротку та змістовну.

**2. "author" (Автори/Організації):**
Залишай оригінальну мову. Якщо авторів не вказано, пиши "Невідомо".

**3. "description" (Анотація):**
- ОБОВ'ЯЗКОВО українською мовою.
- Опис має розкривати головний зміст та синопсис документа.
- **Обмеження довжини:** строго від 200 до 500 символів. Пиши по суті, без зайвих вступних слів.

**4. "tags" (Список тегів):**
Масив рядків (3-5 штук), ОБОВ'ЯЗКОВО українською мовою.
- **ПРИКЛАДИ ПОГАНИХ ТЕГІВ (ЗАБОРОНЕНО):** "інструкція", "методичка", "війна", "книга", "документ", "pdf", "збірник".
- **ПРИКЛАДИ ХОРОШИХ ТЕГІВ:** "БПЛА", "Тактична Медицина", "Артилерійська Розвідка", "CQB", "Інженерна Підготовка", "Логістика".
- **ПРАВИЛО БАЗИ:** Максимально використовуй теги з наданого списку існуючих. Якщо ти обираєш тег зі списку, копіюй його **ТОЧНО ТАК, ЯК ВІН НАПИСАНИЙ (навіть якщо там є інша мова)**.
- **ЛІМІТ НОВИХ ТЕГІВ:** Дозволяється створити **НЕ БІЛЬШЕ 3-х нових тегів**, лише якщо в базі немає релевантних.

### БАЗА ІСНУЮЧИХ ТЕГІВ:
{existing_tags}

### ТЕКСТ ДЛЯ АНАЛІЗУ:
{text}

### ОЧІКУВАНИЙ ФОРМАТ ВІДПОВІДІ (ТІЛЬКИ JSON):
{{
  "title": "",
  "author": "[]",
  "description": "",
  "tags": []
}}"""

        try:
            response = await self.client.chat.completions.create(
                model="qwen/qwen-2.5-72b-instruct",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.0,
                max_tokens=2000
            )
            
            raw_content = response.choices[0].message.content.strip()
            # Очищення від markdown блоків
            clean_content = raw_content.replace("```json", "").replace("```", "").strip()
            
            return json.loads(clean_content)
        except Exception:
            return {
                "title": "",
                "author": "",
                "description": "",
                "tags": []
            }
