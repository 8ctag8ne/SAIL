# Архітектура та Патерн Черги Завдань на PostgreSQL (Task Queue)

## 1. Контекст та Мотивація
Раніше фонові задачі AI-мікросервісу (конвертація PDF, екстракція метаданих, RAG-індексування) відстежувалися в in-memory словнику `TASKS_DB: Dict[str, dict]`.
Це спричиняло проблеми:
1. **Витік оперативної пам'яті (RAM):** Результати важких задач (великі Markdown-тексти, структури метаданих) не очищувалися з пам'яті процесу Python.
2. **Вразливість до перезавантажень:** При рестарті контейнера чи збої процесу всі активні та завершені задачі втрачалися, а клієнти отримували `404 Task not found`.
3. **Неможливість горизонтального масштабування:** In-memory черга прив'язана до одного конкретного інстансу; підняття кількох реплік `sail-ai` було неможливим без зовнішнього брокера.

**Рішення:** Замість введення додаткового брокера (Redis/RabbitMQ/Celery), який збільшує вимоги до інфраструктури, система використовує надійний транзакційний патерн черги на базі існуючого **PostgreSQL** із використанням `JSONB` та `FOR UPDATE SKIP LOCKED`.

---

## 2. Структура Таблиці `ai_tasks`

Таблиця визначена синхронно у двох сервісах:
- **C# (.NET API):** [AITask.cs](file:///Users/nazarii/Desktop/University/SAIL/api/Models/Entities/AITask.cs) та [ApplicationDbContext.cs](file:///Users/nazarii/Desktop/University/SAIL/api/Data/ApplicationDbContext.cs)
- **Python (FastAPI):** [models.py](file:///Users/nazarii/Desktop/University/SAIL/ai/app/db/models.py) (`AITask`)

```sql
CREATE TABLE IF NOT EXISTS ai_tasks (
    id VARCHAR(64) PRIMARY KEY,                         -- UUID ідентифікатор завдання
    task_type VARCHAR(50) NOT NULL,                    -- Тип: 'convert_to_md', 'extract_metadata', 'process_book', 'convert_book_md'
    status VARCHAR(20) NOT NULL DEFAULT 'processing',   -- Стан: 'pending', 'processing', 'completed', 'failed'
    book_id INTEGER NULL,                              -- ID книги (якщо стосується каталогу)
    result JSONB NULL,                                 -- Результати: { markdown, execution_time_seconds, metadata }
    error TEXT NULL,                                   -- Текст помилки у разі збою
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Індекс для миттєвої вибірки та чергування
CREATE INDEX IF NOT EXISTS ix_ai_tasks_status_created_at ON ai_tasks (status, created_at);

-- RLS політика (згідно з правилами безпеки Supabase)
ALTER TABLE IF EXISTS ai_tasks ENABLE ROW LEVEL SECURITY;
```

---

## 3. Сервісний Рівень: `TaskService` ([task_service.py](file:///Users/nazarii/Desktop/University/SAIL/ai/app/services/task_service.py))

`TaskService` інкапсулює всі операції над чергою задач:

### 1) Створення задачі (`create_task`):
Створює запис у статусі `processing` (для негайного виконання у `BackgroundTasks`) або `pending` (для воркерної моделі).
```python
await TaskService.create_task(
    task_id=task_id,
    task_type="convert_to_md",
    book_id=book_id,
    status="processing"
)
```

### 2) Оновлення стану та результатів (`update_task`):
Атомарно оновлює статус, записує помилку або зливає новий JSON у поле `result`:
```python
await TaskService.update_task(
    task_id=task_id,
    status="completed",
    result={"markdown": markdown_text, "execution_time_seconds": elapsed}
)
```

### 3) Отримання статусу задачі (`get_task`):
Використовується polling-ендпоінтами статусу (наприклад, `/rag/convert-to-md/status/{task_id}`):
```python
task = await TaskService.get_task(task_id)
if not task:
    raise HTTPException(status_code=404, detail="Task not found")
```

### 4) Механізм черги для масштабування (`claim_next_pending_task`):
Використовує нативну конструкцію PostgreSQL `FOR UPDATE SKIP LOCKED`. Це гарантує:
- Якщо кілька воркерів одночасно намагаються взяти задачу з черги, кожен отримує своє унікальне завдання.
- Жодних race conditions, взаємних блокувань (deadlocks) чи дублювання обробки.
```python
stmt = (
    select(AITask)
    .where(AITask.status == "pending")
    .order_by(AITask.created_at.asc())
    .limit(1)
    .with_for_update(skip_locked=True)
)
```

---

## 4. Правило Single Source of Truth для Схеми БД

1. **Єдине джерело правди:** Проєкт `api` (ASP.NET Core / Entity Framework Core) є єдиним розпорядником схеми PostgreSQL.
2. **Заборона незалежних DDL у Python:** AI-мікросервіс **НЕ** повинен створювати чи модифікувати таблиці самостійно в продакшені або обходити міграції EF Core.
3. **Процес додавання змін до схеми:**
   - Додати або оновити C# клас у `api/Models/Entities/`.
   - Зареєструвати `DbSet` у `api/Data/ApplicationDbContext.cs`.
   - Згенерувати міграцію: `dotnet ef migrations add <MigrationName>`.
   - Запустити додаток (або `docker-compose.local.yml`), де `db.Database.Migrate()` автоматично застосує зміни.
   - Оновити SQLAlchemy модель у `ai/app/db/models.py`.

---

## 5. Очищення та Ротація Задач (Retention Policy)
Оскільки результати зберігаються в базі даних, старі завершені задачі не повинні накопичуватися нескінченно. Рекомендовано:
- Додавати періодичну очистку (Cron / фонова задача) для видалення завершених задач (`completed` або `failed`), старших за 7–14 днів:
```sql
DELETE FROM ai_tasks 
WHERE status IN ('completed', 'failed') 
  AND created_at < NOW() - INTERVAL '14 days';
```
