# Управління Схемою Бази Даних та Міграціями (EF Core)

## 1. Архітектурне Правило
У системі MARS вся структура реляційної бази даних PostgreSQL (включно зі спільними таблицями для AI-мікросервісу) централізовано управляється через **Entity Framework Core 8** у проєкті `api`.

### Спільні таблиці:
1. **Каталог літератури:** `books`, `authors`, `tags`, `author_books`, `book_tags`, `book_lists`, `book_list_books`
2. **Користувачі та безпека:** `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, `comments`, `likes`
3. **AI та RAG таблиці:**
   - `book_markdowns`: Вилучений та відредагований Markdown-контент книг.
   - `document_chunks`: Векторизовані фрагменти книг (з розширенням `pgvector`, розмірність 2560).
   - `ai_tasks`: Перзистентна черга завдань для асинхронного опрацювання документів та метаданих.

---

## 2. Автоматичне Застосування Міграцій
Під час старту сервісу [Program.cs](../../../../api/Program.cs) автоматично викликає:
```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}
```
Це означає:
- При запуску через `docker-compose.local.yml` контейнер `sail-api` самостійно накатує всі нові міграції на локальний PostgreSQL (`sail-db`).
- При деплої в хмару (Railway) міграції автоматично застосовуються до Supabase.
- Розробникам не потрібно вручну виконувати `update database` для повсякденної розробки.

---

## 3. Процедура Додавання Нових Міграцій

Якщо з'являється потреба змінити схему або додати таблицю:
1. Створити або оновити сутність у папці `api/Models/Entities/` (наприклад, [AITask.cs](../../../../api/Models/Entities/AITask.cs)).
2. Зареєструвати `DbSet<T>` у [ApplicationDbContext.cs](../../../../api/Data/ApplicationDbContext.cs) та налаштувати поля / індекси в `OnModelCreating`.
3. Виконати команду генерації міграції:
   ```bash
   cd api
   dotnet ef migrations add <НазваМіграції>
   ```
4. У разі потреби додати RLS-політику у згенеровану міграцію (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
5. Перевірити збірку: `dotnet build api/api.csproj`.
6. Якщо таблиця використовується в Python AI-сервісі — створити або оновити відповідну модель SQLAlchemy у [models.py](../../../../ai/app/db/models.py).

---

## 4. Корисні CLI Команди EF Core
- Створення міграції: `dotnet ef migrations add <Name>`
- Ручне оновлення локальної БД: `dotnet ef database update`
- Відкат останньої міграції (якщо ще не закомічена): `dotnet ef migrations remove`
- Скрипт SQL для ручного аудиту: `dotnet ef migrations script -i`
