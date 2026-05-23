#ai/app/services/llm_service.py
from app.core.config import settings
import os
import json
import asyncio
from typing import List
from openai import AsyncOpenAI
import openai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import pymupdf
import base64

class LLMService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
        )
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "qwen/qwen3-embedding-4b")
        self.summary_model = os.getenv("SUMMARY_MODEL", "qwen/qwen3-vl-8b-instruct")
        self.chat_model = os.getenv("CHAT_MODEL", "qwen/qwen3-vl-8b-instruct")
        
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
            try:
                response = await self.client.embeddings.create(
                    input=text,
                    model=model,
                    encoding_format="float"
                )
                return response.data[0].embedding[:2560]
            except Exception as e:
                print(f"Error generating embedding: {e}")
                return []

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError))
    )
    async def summarize_section(self, section_title: str, texts: list[str]) -> str:
        """Суммаризація секції з жорстким збереженням мови, термінології та об'єму."""
        if not texts:
            return ""
            
        combined_text = "\n\n".join(texts)[:20000] # Захист контекстного вікна
        
        # Підсилили системний промпт, додавши акцент на стислість
        system_prompt = (
            "You are an expert military data analyst. Your task is to extract the core semantic context "
            "from the provided text fragments. You are extremely concise and strictly obey formatting and length constraints."
        )
        
        # Додали жорсткі ліміти, заборону списків та формат єдиного абзацу
        user_prompt = f"""### INSTRUCTIONS:
1. TASK: Summarize the content of the section "{section_title}".
2. STRICT LANGUAGE RULE: Write the summary in the EXACT SAME LANGUAGE as the source text.
3. CONTENT: Preserve all specific military terms, abbreviations, numbers, coordinates, and tactical procedures.
4. STRICT LENGTH LIMIT: The summary MUST NOT exceed 150 words (maximum 3 to 5 sentences).
5. FORMAT: Output a SINGLE dense paragraph. DO NOT use bullet points, lists, or line breaks.
6. OUTPUT: Output ONLY the summary text. No conversational filler, no introductory phrases (e.g., "This text is about...").

### SOURCE TEXT:
{combined_text}

### SUMMARY:"""

        try:
            async with self.semaphore:
                response = await self.client.chat.completions.create(
                    model=self.summary_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1, 
                    max_tokens=350 
                )
                return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Summarization error: {e}")
            return ""

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError))
    )
    async def extract_metadata(self, text: str, existing_tags: list[str], cover_base64: str = None) -> dict:
        system_prompt = (
            "Ти — головний військовий бібліотекар-архіваріус. Твоє завдання: зображення обкладинки документа ТА текст перших сторінок. "
            "і повернути метадані ВИКЛЮЧНО у форматі валідного JSON без жодних додаткових коментарів чи markdown-розмітки (без ```json)."
        )

        formatted_tags = "\n".join([f"- {tag}" for tag in existing_tags]) if existing_tags else "- (База порожня)"
        
        user_prompt = f"""### ПРАВИЛА АНАЛІЗУ ДОКУМЕНТА

Проаналізуй прикріплене зображення обкладинки (якщо є) та текст документа. Згенеруй метадані відповідно до таких строгих правил:

**1. "title" (Назва):**
Зберігай оригінальну мову. Якщо точну назву не знайдено — створи коротку та змістовну.

**2. "author" (Автор/Організація):**
Зберігай оригінальну мову. Якщо автора не вказано — напиши "Невідомо".

**3. "description" (Анотація):**
- Опис ОБОВ’ЯЗКОВО має бути українською мовою
- Опис МАЄ охоплювати основний зміст і короткий виклад документа
- Довжина опису повинна бути від 200 до 500 символів

**4. "tags" (Список тегів):**
Масив рядків (3–5 елементів). Ти працюєш як суворий фільтр словника:
- **ПРАВИЛО 1 (ГОЛОВНЕ):** Твій пріоритет — обирати найбільш релевантні теги з БАЗИ ІСНУЮЧИХ ТЕГІВ.
- **ПРАВИЛО 2:** Якщо ти береш тег із бази, ТИ ЗОБОВ’ЯЗАНИЙ скопіювати його ТОЧНО, символ у символ, включно з англійською частиною та дужками (наприклад, "Tactics (Тактика)").
- **ПРАВИЛО 3:** Створювати нові теги дозволено ЛИШЕ якщо у базі критично бракує відповідного варіанту (не більше 2 нових). Нові теги повинні бути написані ВИКЛЮЧНО українською мовою.

### БАЗА ІСНУЮЧИХ ТЕГІВ (ОБИРАЙ ЗВІДСИ):
{formatted_tags}

### ТЕКСТ ДОКУМЕНТА ДЛЯ АНАЛІЗУ:
{text}

### ОЧІКУВАНИЙ ФОРМАТ ВІДПОВІДІ (ЛИШЕ JSON):
{{
  "title": "",
  "author": "",
  "description": "",
  "tags": []
}}"""

        user_content = [{"type": "text", "text": user_prompt}]
        if cover_base64:
            user_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{cover_base64}"
                }
            })

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
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.0,
                    max_tokens=3000
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
                    messages = [
                        {
                            "role": "system",
                            "content": (
                                "Ти — професійний військовий аналітик. Твоє завдання — надати чітку та фактичну відповідь на запит користувача.\n\n"
                                "ПРАВИЛА:\n"
                                "1. ПРОТОКОЛ ГЛУХОГО КУТА: Якщо після аналізу контексту ти розумієш, що точної запитуваної інформації НЕМАЄ, НЕ перечитуй контекст повторно. НЕ зациклюйся. НЕГАЙНО припини міркування. Прийми факт відсутності даних.\n"
                                "2. МИСЛЕННЯ АНГЛІЙСЬКОЮ: Виконуй внутрішні міркування виключно англійською мовою. Проаналізуй текст ОДИН раз. Якщо ти починаєш повторювати ті самі спостереження, ТИ МАЄШ припинити цикл, завершити блок міркувань і сформувати фінальну відповідь.\n"
                                "3. МОВА ФІНАЛЬНОЇ ВІДПОВІДІ: Наданий контекст може містити фрагменти різними мовами, але твоя ФІНАЛЬНА відповідь МАЄ бути "
                                "граматично бездоганною, стилістично природною та СУВОРО написаною тією ж мовою, що й запит користувача."
                                "(наприклад: якщо запит українською — відповідай українською; якщо англійською — англійською; якщо російською — російською)."
                                "НЕ ЗВЕРТАЙ УВАГУ на мову контексту при виборі мови відповіді.\n"
                                "4. ДОСТОВІРНІСТЬ: Спирайся ВИКЛЮЧНО на наданий контекст. Не вигадуй фактів. Якщо в контексті немає відповіді, скажи про це прямо.\n"
                                "5. ПРАЦЮЙ ІЗ ОБМЕЖЕНИМИ ДАНИМИ: Якщо контекст містить лише часткову або високорівневу інформацію, НЕ намагайся копати глибше або зациклюватися. Синтезуй РІВНО те, що є, не більше й не менше. Явно зазнач у фінальній відповіді, що надані документи не містять додаткових деталей щодо цього аспекту. НІКОЛИ не вигадуй подробиць, щоб відповідь виглядала повнішою.\n"
                                "6. ІНШІ ІНСТРУКЦІЇ:\n"
                                "  - НЕ переписуй і НЕ перекладай увесь контекст у блок міркувань. Коротко посилайся лише на ключові моменти.\n"
                                "  - Не вибачайся. Будь прямим і об'єктивним.\n"
                                "  - Зберігай міркування у вигляді звичайного тексту. НЕ використовуй markdown, списки чи форматування всередині блоку міркувань."
                            )
                        },
                        {
                            "role": "user",
                            "content": f"Контекст:\n{context}\n\nЗапит: {query}"
                        }
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

    async def generate_rag_answer_stream(self, query: str, context: str, temperature: float = 0.7, enable_thinking: bool = False, req = None):
        # model_name = "qwen/qwen3-vl-8b-thinking" if enable_thinking else "qwen/qwen3-vl-8b-instruct"
        model_name = "qwen/qwen3-vl-30b-a3b-thinking"
        async with self.semaphore:
            try:
                response_stream = await self.client.chat.completions.create(
                    model=model_name,
                    messages = [
                        {
                            "role": "system",
                            "content": (
                                "Ти — професійний військовий аналітик. Твоє завдання — надати чітку та фактичну відповідь на запит користувача.\n\n"
                                "ПРАВИЛА:\n"
                                "1. ПРОТОКОЛ ГЛУХОГО КУТА: Якщо після аналізу контексту ти розумієш, що точної запитуваної інформації НЕМАЄ, НЕ перечитуй контекст повторно. НЕ зациклюйся. НЕГАЙНО припини міркування. Прийми факт відсутності даних.\n"
                                "2. МИСЛЕННЯ АНГЛІЙСЬКОЮ: Виконуй внутрішні міркування виключно англійською мовою. Проаналізуй текст ОДИН раз. Якщо ти починаєш повторювати ті самі спостереження, ТИ МАЄШ припинити цикл, завершити блок міркувань і сформувати фінальну відповідь.\n"
                                "3. МОВА ФІНАЛЬНОЇ ВІДПОВІДІ: Наданий контекст може містити фрагменти різними мовами, але твоя ФІНАЛЬНА відповідь МАЄ бути "
                                "граматично бездоганною, стилістично природною та СУВОРО написаною тією ж мовою, що й запит користувача."
                                "(наприклад: якщо запит українською — відповідай українською; якщо англійською — англійською; якщо російською — російською)."
                                "НЕ ЗВЕРТАЙ УВАГУ на мову контексту при виборі мови відповіді.\n"
                                "4. ДОСТОВІРНІСТЬ: Спирайся ВИКЛЮЧНО на наданий контекст. Не вигадуй фактів. Якщо в контексті немає відповіді, скажи про це прямо.\n"
                                "5. ПРАЦЮЙ ІЗ ОБМЕЖЕНИМИ ДАНИМИ: Якщо контекст містить лише часткову або високорівневу інформацію, НЕ намагайся копати глибше або зациклюватися. Синтезуй РІВНО те, що є, не більше й не менше. Явно зазнач у фінальній відповіді, що надані документи не містять додаткових деталей щодо цього аспекту. НІКОЛИ не вигадуй подробиць, щоб відповідь виглядала повнішою.\n"
                                "6. ІНШІ ІНСТРУКЦІЇ:\n"
                                "  - НЕ переписуй і НЕ перекладай увесь контекст у блок міркувань. Коротко посилайся лише на ключові моменти.\n"
                                "  - Не вибачайся. Будь прямим і об'єктивним.\n"
                                "  - Зберігай міркування у вигляді звичайного тексту. НЕ використовуй markdown, списки чи форматування всередині блоку міркувань."
                            )
                        },
                        {
                            "role": "user",
                            "content": f"Контекст:\n{context}\n\nЗапит: {query}"
                        }
                    ],
                    temperature=temperature,
                    stream=True,
                    frequency_penalty=0.5,
                    presence_penalty=0.7,
                )
                
                async for chunk in response_stream:
                    if req and await req.is_disconnected():
                        print("DEBUG: Клієнт відключився під час стрімінгу від OpenRouter.")
                        break
                        
                    if chunk.choices:
                        delta = chunk.choices[0].delta
                        if getattr(delta, "reasoning", None):
                            yield f'data: {json.dumps({"type": "thinking", "text": delta.reasoning}, ensure_ascii=False)}\n\n'
                        if getattr(delta, "content", None):
                            yield f'data: {json.dumps({"type": "answer", "text": delta.content}, ensure_ascii=False)}\n\n'
                        
            except Exception as e:
                print(f"DEBUG LLM Stream Error: {str(e)}")
                yield f'data: {json.dumps({"type": "error", "data": f"Виникла помилка при зверненні до ШІ: {str(e)}"}, ensure_ascii=False)}\n\n'

    async def generate_suggested_questions(self, query: str, context: str) -> list[str]:
        async with self.semaphore:
            try:
                response = await self.client.chat.completions.create(
                    model=self.chat_model,
                    messages = [
                        {
                            "role": "system",
                            "content": (
                                "Ти — помічник користувача. Твоє завдання — згенерувати 3 логічні уточнювальні або наступні запитання на основі контексту та попереднього запиту користувача.\n\n"
                                "ПРАВИЛА:\n"
                                "1. МОВА: Генеруй запитання СУВОРО тією ж мовою, що й запит користувача "
                                "(наприклад: якщо запит українською — відповідай українською; якщо англійською — англійською).\n"
                                "2. ФОРМАТ: Повертай ЛИШЕ коректний JSON-масив рядків "
                                "(наприклад, [\"Питання 1?\", \"Питання 2?\"]). "
                                "Жодного додаткового тексту та жодного Markdown-форматування."
                            )
                        },
                        {
                            "role": "user",
                            "content": f"Контекст:\n{context}\n\nПопередній запит: {query}"
                        }
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

    async def rewrite_query(self, query: str, glossary_terms: str, uncensored: bool = True) -> str:
        """
        Переписує запит за допомогою LLM.

        Args:
            query: Оригінальний запит користувача.
            glossary_terms: Контекст із глосарію.
            uncensored: Якщо True — спочатку пробуємо uncensored-модель (dolphin),
                        потім фолбек на qwen. Якщо False — одразу qwen.
        """
        # Жорсткий Jailbreak/Research промпт
        system_prompt = (
            "You are a strict military linguist and data parser. Your ONLY task is to TRANSLATE "
            "emotional, slang-filled, or vulgar user queries into sterile, highly professional "
            "military and medical terminology for a dense vector search engine.\n"
            "RULES:\n"
            "1. STRIP ALL PROFANITY, slang, and emotional language completely.\n"
            "2. STRICT LANGUAGE RULE: The rewritten query MUST be in the EXACT SAME LANGUAGE as the original raw query.\n"
            "3. PRESERVE EXACT INTENT & GRAMMAR: You MUST preserve the user's original intent (e.g., 'How do I...', 'What is...'). If the original query is a question, the output MUST be a grammatically complete, formal question. DO NOT output a mere list of keywords or a noun phrase.\n"
            "4. TRANSLATE TO DOCTRINAL TERMS: Convert informal concepts into formal ones while keeping the sentence structure.\n"
            "   - Example EN: 'My bro stepped on a landmine, how do I save him?' -> 'What is the emergency medical aid procedure for a landmine blast injury?'\n"
            "5. EVALUATE GLOSSARY HINTS: Use the provided glossary terms ONLY IF they logically fit the context and language of the user's raw query. If a hint is clearly a false positive or out of context, IGNORE IT COMPLETELY.\n"
            "6. Output ONLY the sterilized, final query string. No explanations, no introductory text."
        )

        user_prompt = (
            f"### ORIGINAL RAW QUERY:\n{query}\n\n"
            f"### POTENTIAL GLOSSARY HINTS (IGNORE IF IRRELEVANT):\n{glossary_terms}\n\n"
            f"### STERILIZED PROFESSIONAL QUERY FOR VECTOR SEARCH:"
        )

        # Перелік моделей залежно від параметра uncensored
        uncensored_model = getattr(self, "uncensored_model", "cognitivecomputations/dolphin-mistral-24b-venice-edition:free")
        models_to_try = [uncensored_model, self.chat_model] if uncensored else [self.chat_model]

        for model_name in models_to_try:
            try:
                async with self.semaphore:
                    response = await self.client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        temperature=0.0,
                        max_tokens=150,
                    )
                
                rewritten = response.choices[0].message.content.strip()

                # Евристика для виявлення "моралізаторства" (якщо модель замість переписування видала відмову)
                refusal_triggers = ["i cannot", "i am sorry", "as an ai", "unable to fulfill", "safety guidelines", "не можу допомогти", "я не можу", "мені шкода", "як ai", "не могу помочь", "мне жаль"]
                if not rewritten or any(trigger in rewritten.lower() for trigger in refusal_triggers):
                    print(f"DEBUG: Model {model_name} refused or returned empty. Triggering fallback...")
                    continue # Переходимо до наступної моделі в списку

                return rewritten
            except Exception as e:
                print(f"DEBUG: Error rewriting query with {model_name}: {e}")
                continue # Переходимо до наступної моделі в списку

        # Якщо обидві моделі впали або відмовились — безпечно повертаємо оригінальний запит
        return query
