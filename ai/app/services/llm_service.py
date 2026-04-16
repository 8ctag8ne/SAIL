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
            "Ти — досвідчений бібліотекар. Твоє завдання: видобути метадані з тексту і повернути виключно валідний JSON без markdown-форматування (без ```json)."
        )
        
        user_prompt = f"""Знайди наступні метадані у тексті:
1. "title": Назва книги (залишай оригінальну мову).
2. "author": Автор книги (залишай оригінальну мову).
3. "description": Короткий опис або анотація книги (ОБОВ'ЯЗКОВО українською мовою).
4. "tags": Список тегів (Масив рядків, 3-5 штук, ОБОВ'ЯЗКОВО українською мовою).

Ось список існуючих тегів у базі: {existing_tags}. 
Призначаючи теги цій книзі (3-5 штук), максимально намагайся використовувати теги з цього списку. Створюй нові теги ТІЛЬКИ якщо серед існуючих немає жодного релевантного.

Текст:
{text}

Поверни виключно JSON:
{{
  "title": "",
  "author": "",
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
                temperature=0.1,
                max_tokens=1000
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
