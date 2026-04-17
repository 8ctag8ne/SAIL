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
        self.chat_model = os.getenv("CHAT_MODEL", "qwen/qwen-2.5-72b-instruct")
        
        # Обмежуємо кількість одночасних запитів до API
        self.semaphore = asyncio.Semaphore(5)

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError))
    )
    async def generate_embedding(self, text: str) -> list[float]:
        if not text.strip():
            return []
        
        model = self.embedding_model
        
        async with self.semaphore:
            response = await self.client.embeddings.create(
                input=text,
                model=model
            )
            return response.data[0].embedding[:2048]

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

        model = self.summary_model

        try:
            async with self.semaphore:
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

        formatted_tags = "\n".join([f"- {tag}" for tag in existing_tags]) if existing_tags else "- (База порожня)"
        
        user_prompt = f"""### ІНСТРУКЦІЯ З АНАЛІЗУ ДОКУМЕНТА
        
Проаналізуй текст та сформуй метадані за наступними суворими правилами:

**1. "title" (Назва книги):**
Залишай оригінальну мову. Якщо точної назви немає, сформуй коротку та змістовну.

**2. "author" (Автор/Організація):**
Залишай оригінальну мову. Якщо автора не вказано, пиши "Невідомо".

**3. "description" (Анотація):**
- ОБОВ'ЯЗКОВО українською мовою.
- Опис має розкривати головний зміст та синопсис документа.
- Обмеження довжини: строго від 200 до 500 символів.

**4. "tags" (Список тегів):**
Масив рядків (3-5 штук). Ти працюєш як жорсткий словниковий фільтр:
- **ПРАВИЛО 1 (ГОЛОВНЕ):** Твій пріоритет — вибрати найбільш релевантні теги з БАЗИ ІСНУЮЧИХ ТЕГІВ.
- **ПРАВИЛО 2:** Якщо ти береш тег з бази, ТИ ЗОБОВ'ЯЗАНИЙ скопіювати його ІДЕАЛЬНО ТОЧНО, символ у символ, разом з англійською частиною та дужками (наприклад: "Tactics (Тактика)").
- **ПРАВИЛО 3:** Створювати нові теги дозволяється ТІЛЬКИ якщо в базі критично не вистачає підходящого варіанту (не більше 2 нових). Нові теги пиши ВИКЛЮЧНО українською мовою.

### БАЗА ІСНУЮЧИХ ТЕГІВ (ВИБИРАЙ ЗВІДСИ):
{formatted_tags}

### ТЕКСТ ДЛЯ АНАЛІЗУ:
{text}

### ОЧІКУВАНИЙ ФОРМАТ ВІДПОВІДІ (ТІЛЬКИ JSON):
{{
  "title": "",
  "author": "",
  "description": "",
  "tags": []
}}"""

        try:
            print("=" * 50)
            print(f"DEBUG - КІЛЬКІСТЬ ТЕГІВ ДЛЯ LLM: {len(existing_tags)}")
            print(f"DEBUG - ТЕГИ: {existing_tags}")
            print("=" * 50)
            
            async with self.semaphore:
                response = await self.client.chat.completions.create(
                    model=self.chat_model,
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

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError))
    )
    async def generate_rag_answer(self, query: str, context: str, temperature: float = 0.7) -> str:
        async with self.semaphore:
            try:
                response = await self.client.chat.completions.create(
                    model=self.chat_model,
                    messages=[
                        {"role": "system", "content": "Ти професійний військовий аналітик. Твоє завдання - дати чітку відповідь на запит.\n\nПРАВИЛА:\n1. МОВА: Відповідай ТІЛЬКИ тією ж мовою, якою написано запит користувача (наприклад, якщо запит українською - відповідай українською, якщо англійською - англійською).\n2. ДОСТОВІРНІСТЬ: Спирайся ВИКЛЮЧНО на наданий контекст. Не вигадуй фактів. Якщо в контексті немає відповіді, скажи про це прямо."},
                        {"role": "user", "content": f"Контекст:\n{context}\n\nЗапит: {query}"}
                    ],
                    temperature=temperature
                )
                
                # Безпечна перевірка наявності відповіді
                if not response or not response.choices:
                    print(f"DEBUG: OpenRouter повернув порожню відповідь або помилку: {response}")
                    return "Виникла помилка при генерації відповіді (порожня відповідь від API)."
                    
                return response.choices[0].message.content
                
            except Exception as e:
                print(f"DEBUG LLM Error: {str(e)}")
                return f"Виникла помилка при зверненні до ШІ: {str(e)}"

    async def generate_suggested_questions(self, query: str, context: str) -> list[str]:
        async with self.semaphore:
            try:
                response = await self.client.chat.completions.create(
                    model="qwen/qwen-2.5-72b-instruct",
                    messages=[
                        {"role": "system", "content": "Ти помічник. Твоє завдання - згенерувати 3 логічні наступні запитання на основі контексту та попереднього запиту користувача. \nПРАВИЛА:\n1. Пиши тією ж мовою, що й запит.\n2. Поверни ТІЛЬКИ валідний JSON-масив рядків (наприклад: [\"Питання 1?\", \"Питання 2?\"]). Ніякого додаткового тексту чи форматування Markdown."},
                        {"role": "user", "content": f"Контекст:\n{context}\n\nПопередній запит: {query}"}
                    ],
                    temperature=0.7
                )
                
                content = response.choices[0].message.content.strip()
                # Очищення від можливих markdown-блоків (наприклад, ```json ... ```)
                if content.startswith("```"):
                    content = content.split("\n", 1)[1].rsplit("\n", 1)[0]
                
                questions = json.loads(content)
                if isinstance(questions, list):
                    return questions[:3]
                return []
            except Exception as e:
                print(f"DEBUG: Помилка генерації питань: {e}")
                return []
