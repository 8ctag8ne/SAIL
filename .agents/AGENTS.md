# MARS (Military Archive & Retrieval System) - Agentic Development Context

## Про проєкт
MARS — це відмовостійка інформаційно-пошукова система електронної бібліотеки військової літератури з відкритим кодом. Проєкт забезпечує мультимовний семантичний пошук з урахуванням військової термінології та сленгу, зберігає ієрархічну структуру джерел і підтримує можливість автономного/локального розгортання.

## Архітектура системи
Система побудована за мікросервісним підходом і складається з трьох основних компонентів:
1. **Frontend (`/frontend`):** React 19 PWA застосунок, стилізований під Terminal UI (JetBrains Mono, темна палітра, CRT ефекти, Material UI 7).
2. **Backend (`/api`):** ASP.NET Core 8.0 Web API шлюз, що відповідає за API Gateway, RBAC авторизацію, файлове сховище, рейт-лімітинг та проксіювання SSE стрімів.
3. **AI Microservice (`/ai`):** Python 3.11 / FastAPI сервіс, що інкапсулює логіку RAG, векторизацію (pgvector), ієрархічне індексування (OpenDataLoader) та OpenRouter LLM моделей.

## Інфраструктура, Бази Даних та Докер
- **База даних:** Supabase PostgreSQL із розширенням `pgvector` для збереження метаданих, таблиць книг та семантичних векторів chunk-ів (`document_chunks`).
- **Сховище об'єктів:** BackBlaze B2 (S3-сумісний API через `AWSSDK.S3`) з розділенням на приватний бакет для захищених PDF-документів (доступ через S3 Pre-signed URLs та внутрішній API Gateway) і публічний бакет для медіафайлів/обкладинок. В режимі розробки використовується локальний фолбек `LocalFileService`.
- **Контейнеризація & Мережа (`docker-compose.local.yml`):**
  - `sail-db` (`pgvector/pgvector:pg16`): PostgreSQL із pgvector розширенням (порт 5432).
  - `sail-api` (ASP.NET Core Web API): Сервісний шлюз (порт 8080).
  - `sail-ai` (FastAPI AI microservice): Сервіс ШІ (порт 8000).
  - `sail-frontend` (Node 22 React PWA): Інтерфейс користувача (порт 3000).
- **Хмарне розгортання:** Docker-контейнери, розгорнуті в хмарі через Railway. Використання PgBouncer connection pooler (`SUPABASE_SESSION_POOLER`).
- **LLM / Embedding Провайдер:** OpenRouter API (моделі Qwen3-VL-32B-Instruct, Qwen3-Embedding-4B, Dolphin-Mistral-24B).

## Загальні правила середовища Antigravity IDE
- Дотримуватися підходу vibe coding та чіткого розподілу відповідальності між мікросервісами.
- Всі нові функції повинні бути сумісними з локальним розгортанням та оптимізованими для роботи без GPU.
- Суворо дотримуватися конвенції розгортання налаштувань у папці `.agents/` (`AGENTS.md` та `.agents/skills/<skill-name>/SKILL.md`).
