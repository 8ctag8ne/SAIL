---
name: mars-ai-microservice
description: Інструкції та специфікація для розробки AI/Python мікросервісу (FastAPI, RAG, OpenDataLoader, pgvector, SOLID/DRY, Qwen/Mistral LLM).
---

# Скіл: AI / Python Microservice Розробник

## 1. Архітектура та Технологічний Стек
- **Мова / Фреймворк:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2 (строга валідація схем).
- **ORM та DB Драйвери:** Async SQLAlchemy 2, `asyncpg` (асинхронний драйвер PostgreSQL), `pgvector` (оператори векторної відстані `cosine_distance`).
- **Обробка документів:** OpenDataLoader (`langchain-opendataloader-pdf`, алгоритм XY-Cut++ для екстракції структури Markdown та таблиць), PyMuPDF (`pymupdf` для завантаження сторінок PDF та рендеру обкладинок у Base64).
- **NLP / Морфологія:** `pymorphy3` + `pymorphy3-dicts-uk` (морфологічна лематизація української мови), `QueryProcessor` з доменним глосарієм (`glossary.json` для сленгу та військових термінів), `rank_bm25` (лексичний пошук).
- **Векторизація та LLM Провайдери (OpenRouter API):** LangChain (`langchain-openai`, `langchain-community`), AsyncOpenAI client, `@retry` експоненціальний повтор через `tenacity`, обмеження семафором `asyncio.Semaphore(5)` для захисту лімітів API.

---

## 2. Стандарти Коду та Архітектурні Принципи (SOLID / DRY)

### 🧼 Стандарти Якості та Рефакторингу:
1. **Single Responsibility (SRP):** Чіткий розподіл відповідальності:
   - `app/api/` — лише обробка HTTP-запитів FastAPI, маршрутизація та ін'єкція залежностей (`Depends(get_db)`).
   - `app/services/` — ізольована бізнес-логіка (парсер `parser/`, чункінг `chunking_strategies/`, RAG `rag_service.py`, LLM `llm_service.py`, обробка запитів `query_service.py`).
   - `app/db/` — декларативні SQLAlchemy моделі (`models.py`) та Pydantic схеми (`schemas.py`).
2. **Open/Closed & Dependency Inversion (DIP):** Використання базових абстрактних класів (`BaseChunkingStrategy`, `BaseRetriever`) для легкого розширення нових алгоритмів індексування чи пошуку без зміни існуючого коду.
3. **DRY (Don't Repeat Yourself):** Заборона дублювання логіки підключення до БД, обробки помилок LLM та парсингу метаданих. Перевикористання сесій через `AsyncSessionLocal` та єдиної конфігурації `settings`.
4. **Читабельність та Типізація:** Усьому новому коду та в ході рефакторингу демо-начерків обов'язково додавати явні анотації типів (`typing`, `Pydantic`), docstrings, інформативне логування (`logger.error`) та зрозумілі назви змінних.

---

## 3. Набір Моделей OpenRouter LLM & Embedding

- **`qwen/qwen3-embedding-4b`**: Модель генерації векторних етикеток (зріз до 2560 float значений).
- **`qwen/qwen3-vl-8b-instruct` / `qwen/qwen3-vl-32b-instruct`**: Мультимодальні моделі для екстракції метаданих з обкладинок та генерації фінальних відповідей у RAG.
- **`qwen/qwen3-vl-8b-thinking`**: Стрімінгова модель генерації відповіді з виділеним блоком міркувань (`thinking`).
- **`cognitivecomputations/dolphin-mistral-24b-venice-edition:free`**: Uncensored модель для очищення та перефразування жаргону/сленгу в офіційну термінологію (з автоматичним фолбеком на Qwen-Instruct).

---

## 4. Обробка Документів, PDF Парсинг та Екстракція Метаданих

- **Конвертація PDF у Markdown (`/rag/convert-to-md/upload`, `/rag/convert-to-md/book/{book_id}`):**
  - Асинхронний прийом файлу через OpenDataLoader.
  - При виклику для існуючої книги (`/rag/convert-to-md/book/{book_id}`) AI-сервіс завантажує PDF безпечно через внутрішній ендпоінт бекенду `GET /api/Book/{book_id}/download` (незалежно від приватності S3 бакета).
  - Двопрохідне очищення артефактів OCR, нормалізація кирилиці та видалення нульових байтів (`\x00`).
- **Генерація обкладинки (`get_pdf_cover_base64`):**
  - Рендеринг першої сторінки PDF у JPEG Base64 (DPI 150) без збереження на диск.
- **Екстракція метаданих (`/convert/extract-metadata`):**
  - Промпт для Qwen3-VL з передачею обкладинки та тексту перших сторінок.
  - Повернення валідного JSON: `title`, `author`, `description` (українською, 200–500 символів), `tags` (3–5 тегів з пріоритетним збігом проти існуючих тегів у БД).
- **Фонові завдання (`BackgroundTasks`):**
  - Відстеження стану задач у пам'яті через `TASKS_DB` за допомогою унікальних `uuid.uuid4()`.

---

## 5. Ієрархічне Індексування (Hierarchical Chunking)

- **Запуск обробки книги (`/rag/process-book/{book_id}`):**
  - Виклик `HierarchicalChunkingStrategy`.
  - Побудова структурного дерева документа на основі Markdown-заголовків (`#`, `##`, `###`).
  - Сумаризація вузлів знизу вгору (`summarize_section`) з жорстким збереженням мови та термінології.
  - Прокидання батьківського контексту зверху вниз.
  - Формування `composite_text` (`path + context + chunk_text`), обчислення векторів та масовий запис у таблицю `document_chunks` Supabase.

---

## 6. Доменна Адаптація та Гібридний RAG Пошук

### 🧠 Алгоритм обробки запиту (`QueryProcessor` & `RAGService`):
1. **Морфологія & Пошук у глосарії:** Пошук термінів/абревіатур/синонімів у `glossary.json` із використанням `pymorphy3`.
2. **Перефразування запиту:**
   - `vector_query`: Перефразування запиту через Dolphin-Mistral / Qwen в офіційну доктринальну термінологію.
   - `bm25_query`: Збагачення оригінального запиту ключовими словами та синонімами з глосарію.
3. **Гібридне вилучення:**
   - **Dense Search (`AsyncCustomVectorRetriever`):** Пошук за косинусною відстанню `DocumentChunk.embedding.cosine_distance(query_embedding)` у pgvector (top_k = 10). Обчислення схожості `1.0 - distance` та підтягування батьківських контекстних чанків.
   - **Sparse Search (`BM25Retriever`):** Лексичний BM25 пошук за фрагментами тексту.
4. **Reciprocal Rank Fusion (RRF):**
   - Обчислення підсумкового рангу з ваговими коефіцієнтами ($w_{\text{bm25}} = 0.3$, $w_{\text{dense}} = 0.7$):
     $$\text{RRF}(d) = w_{\text{bm25}} \cdot \frac{1}{r_{\text{bm25}}(d) + 60} + w_{\text{dense}} \cdot \frac{1}{r_{\text{dense}}(d) + 60}$$
   - Нормалізація оцінки до діапазону `0.0` – `1.0` (`similarityScore`).

---

## 7. SSE Стрімінг та Відлагоджувальні Ендпоінти

- **Стрімінговий пошук (`/rag/ask`):**
  - Передача потоку `StreamingResponse(..., media_type="text/event-stream")`.
  - Відправка послідовних чанків: `rewritten_query` -> `sources` -> `thinking` (якщо увімкнено) -> `answer` -> `questions`.
  - Перевірка розриву з'єднання `req.is_disconnected()`.
- **Debug ендпоінти:**
  - `GET /debug/db-tags`: Перевірка підключення до БД Supabase та читання тегів.
  - `POST /debug/glossary-detect`: Перевірка виявлення військових термінів та синонімів у запиті.
  - `POST /debug/query-rewrite`: Тестування роботи перефразування запиту від моделей Dolphin-Mistral та Qwen.
