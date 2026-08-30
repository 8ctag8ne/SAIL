---
name: mars-backend
description: Інструкції та специфікація для розробки Backend API на ASP.NET Core (Controllers, RBAC, SSE Proxying, Rate Limiting, Docker & Deployment).
---

# Скіл: Backend Розробник (ASP.NET Core)

## 1. Архітектура та Технологічний Стек
- **Платформа:** C# 12, .NET 8.0 ASP.NET Core Web API.
- **ORM & База даних:** Entity Framework Core 8, Npgsql (`Npgsql.EntityFrameworkCore.PostgreSQL`), Pgvector (`Pgvector.EntityFrameworkCore`).
- **Автентифікація & Безпека:** ASP.NET Core Identity, JWT Bearer Tokens (`Microsoft.AspNetCore.Authentication.JwtBearer`).
- **Обробка документів & Медіа:** Docnet.Core (PDF rendering), SixLabors.ImageSharp / System.Drawing.Common.
- **Об'єктне сховище & Інтеграції:** AWSSDK.S3 (BackBlaze B2 S3-сумісний API), `IHttpClientFactory` для зв'язку з AI мікросервісом.
- **Автоматична ініціалізація:** Виконання EF Core міграцій БД (`db.Database.Migrate()`) та авто-посів ролей/адміністратора (`RoleHelper.SeedRolesAndAdmin`) під час старту застосунку.

---

## 2. Специфікація Контролерів та Зони Відповідальності

### 🔑 `AccountController` (`/api/account`)
- **Реєстрація та Автентифікація:**
  - `POST /register`: Створення акаунту користувача з валідацією пароля (цифри, спецсимволи, мінімум 8 символів).
  - `POST /login`: Перевірка даних користувача та видача JWT-токена з claims (`Username`, `Email`, `Role`).
- **Профіль та Ролі:**
  - `GET /profile`: Отримання даних поточного користувача.
  - `POST /update-profile`: Редагування персональних даних.
  - `POST /set-role` (Admin): Динамічне призначення ролей користувачам.
- **Модерація та Блокування:**
  - `POST /ban/{id}` (Admin): Блокування користувача з вказанням причини (`BanReason`).
  - `POST /unban/{id}` (Admin): Розблокування користувача.
  - `GET /banned-users` (Admin): Отримання списку всіх заблокованих користувачів.
- **Рейт-лімітинг:** Захищено біндінгом `[EnableRateLimiting("AuthRateLimiter")]` (5 запитів на хвилину на IP).

### 🤖 `AiController` (`/api/ai`)
- **API Gateway для AI-мікросервісу:**
  - `POST /upload-to-convert`: Прийом PDF через multipart/form-data та перенаправлення на парсинг у FastAPI.
  - `GET /status/{taskId}`: Отримання статусу фонових завдань конвертації/індексування.
  - `POST /extract-metadata`: Отримання метаданих через мультимодальну модель Qwen3-VL.
  - `POST /rag/process-book/{bookId}` & `POST /rag/parse-pdf/{bookId}`: Запуск RAG-індексування чи парсингу книги за її ідентифікатором.
  - `POST /rag/ask`: Стрімінговий семантичний пошук через SSE (Server-Sent Events).
- **Рейт-лімітинг:** Захищено біндінгом `[EnableRateLimiting("AiRateLimiter")]` (10 запитів на хвилину на IP).

### 📚 `BookController` (`/api/book`)
- **CRUD операції з книгами:**
  - `GET /`: Отримання каталогу книг із сторінковою пагінацією, фільтрацією за авторами, тегами та пошуковим словом.
  - `GET /{id}`: Отримання детальної інформації про книгу, статус обробки, авторів, теги та посилання на PDF у B2.
  - `POST /`: Завантаження нової книги (PDF файл + метадані). Завантаження в BackBlaze B2 через `IFileService`, генерація обкладинки-прев'ю першої сторінки через `IPdfRenderService`.
  - `PUT /{id}` & `DELETE /{id}` (Librarian/Admin): Оновлення метаданих книги або її видалення із баз даних та об'єктного сховища.
  - `PATCH /{id}/status`: Оновлення статусу обробки книги (`parsed`, `processed`).

### 📄 `BookMarkdownController` (`/api/bookmarkdown`)
- **Управління Markdown-контентом:**
  - `GET /{bookId}`: Отримання вилученого Markdown-тексту книги для перегляду та читання у фронтенді.
  - `POST /{bookId}` (Librarian/Admin): Збереження або редагування згенерованого Markdown (Human-in-the-Loop).

### 📑 `BookListController` (`/api/booklist`)
- **Списки читання користувачів:**
  - `GET /`: Перегляд публічних списків читання або персональних списків поточного користувача.
  - `POST /` & `DELETE /{id}`: Створення та видалення списків книг.
  - `POST /{listId}/add-book/{bookId}` & `DELETE /{listId}/remove-book/{bookId}`: Додавання та видалення книг зі списку.

### 👤 `AuthorController` (`/api/author`)
- **Управління авторами:**
  - `GET /` & `GET /{id}`: Перегляд каталогу авторів, біографії та пов'язаних книг.
  - `POST /`, `PUT /{id}`, `DELETE /{id}` (Librarian/Admin): Створення та редагування карток авторів.

### 🏷️ `TagController` (`/api/tag`)
- **Теги та Категорії:**
  - `GET /`: Перегляд усіх військових тегів та категорій літератури (тактика, статути, артилерія тощо).
  - `POST /`, `DELETE /{id}` (Librarian/Admin): Додавання та видалення тегів.

### 💬 `CommentController` (`/api/comment`)
- **Рецензії та Коментарі:**
  - `GET /book/{bookId}`: Отримання коментарів до книги.
  - `POST /book/{bookId}`: Додавання коментаря авторизованим користувачем.
  - `DELETE /{id}`: Видалення власних коментарів або модерація (Admin/Librarian).

### 👁️ `PdfController` (`/api/pdf`)
- **Прев'ю та Сторінки:**
  - `GET /{bookId}/page/{pageNumber}`: Рендеринг конкретної сторінки PDF у растрове зображення через `Docnet.Core` / `IPdfRenderService`.

### 🩺 `HealthController` (`/api/health`)
- **Моніторинг інфраструктури:**
  - `GET /health` & `GET /health/ping`: Комплексна перевірка трьох компонентів: Supabase PostgreSQL DB (`pgvector`), BackBlaze B2 S3 приватного та публічного бакетів (`PrivateBucketName`, `PublicBucketName`) та FastAPI AI Microservice.
- **Рейт-лімітинг:** Захищено `[EnableRateLimiting("HealthCheckLimiter")]` (5 запитів на хвилину).

---

## 3. Протокол Взаємодії з AI-мікросервісом

- **Реєстрація HTTP-клієнта:** В `Program.cs` зареєстровано `HttpClient` з іменованою конфігурацією `"AiService"`, що використовує базову адресу з конфігурації `AI_SERVICE_URL`.
- **Передача файлів:** Використання `MultipartFormDataContent` для завантаження PDF-файлів у FastAPI ендпоінти.
- **Завантаження книг AI-сервісом:** AI-сервіс завантажує PDF безпосередньо через внутрішній шлюз `GET /api/Book/{bookId}/download`.
- **Асинхронний статус завдань:** Для тривалих операцій (парсинг PDF, векторизація) AI-сервіс повертає `task_id`. Backend проксіює запити перевірки статусу за допомогою `status/{taskId}`.
- **Проксіювання SSE-стрімів (`/api/ai/rag/ask`):**
  - Отримання JSON-запиту від фронтенду (`RagAskRequestDto`).
  - Відправка `HttpRequestMessage` у FastAPI ендпоінти `rag/ask` із `HttpCompletionOption.ResponseHeadersRead`.
  - Встановлення відповідних HTTP заголовков відповіді для клієнта:
    - `Content-Type: text/event-stream`
    - `Cache-Control: no-cache`
    - `Connection: keep-alive`
    - `X-Accel-Buffering: no` (для вимкнення буферизації Nginx/Railway).
  - Потокове зчитування даних шматками по `8192` байти та негайне проксіювання клієнту через `Response.Body.WriteAsync()` і `Response.Body.FlushAsync(cancellationToken)`.

---

## 4. Сервіси, Рейт-ліміти та Фільтри

### 🛠️ Сервісний шар (Dependency Injection)
- **`IFileService`**:
  - `CloudFileService`: Використовується в Production. Працює з BackBlaze B2 через `AWSSDK.S3`. Розділяє сховище на `PrivateBucketName` (для PDF із генерацією S3 Pre-signed URLs через `GetPresignedUrl`) та `PublicBucketName` (для обкладинок/медіа з прямими публічними URL).
  - `LocalFileService`: Використовується в Development. Зберігає файли локально у `wwwroot/local_uploads`.
- **`IBookService` / `ITagService` / `IAuthorService` / `IBookListService` / `ICommentService`**: Бізнес-логіка предметної області.
- **`IPdfRenderService` (`PdfService`)**: Використовує `Docnet.Core` для вилучення обкладинки та рендерингу сторінок PDF у звичайні PNG/JPEG зображення.
- **`ITokenService`**: Генерація JWT токенів з підписом `HMAC-SHA256`.

### ⏱️ Рейт-лімітинг (`Microsoft.AspNetCore.RateLimiting`)
- **`HealthCheckLimiter`**: Фіксоване вікно, 5 запитів на хвилину, queue limit 0.
- **`AuthRateLimiter`**: Фіксоване вікно per IP адрес (`X-Forwarded-For` або `RemoteIpAddress`), 5 запитів на хвилину.
- **`AiRateLimiter`**: Фіксоване вікно per IP адрес, 10 запитів на хвилину для захисту ресурсоємних ендпоінтів ШІ.
- При перевищенні ліміту повертається HTTP `429 Too Many Requests`.

### ⏱️ Фільтри вимірювання швидкодії
- **`ExecutionTimeFilter`**: Автоматично додає заголовок `X-Execution-Time-ms` до кожного HTTP-запиту для моніторингу продуктивності API Gateway.

---

## 5. Контейнеризація та Розгортання (Docker & Railway)

### 🐳 Multi-Stage Dockerfile (`api/Dockerfile`)
- **Build Stage:** `mcr.microsoft.com/dotnet/sdk:8.0 AS build` (кешування `dotnet restore`, збірка `dotnet publish -c Release`).
- **Runtime Stage:** `mcr.microsoft.com/dotnet/aspnet:8.0` (мінімальний образ для запуску `api.dll`).
- **Порт:** `ASPNETCORE_URLS=http://+:8080`, `EXPOSE 8080`.

### 🐙 Локальний Docker Compose (`docker-compose.local.yml`)
- **Мережева архітектура:**
  - `sail-db` (`pgvector/pgvector:pg16`): Порт 5432, змонтований том `postgres_data`.
  - `sail-api` (`./api/Dockerfile`): Порт 8080. Підключається до БД через `Host=db` і до AI мікросервісу через `AI_SERVICE_URL=http://ai-service:8000`. Змонтований том `./local_uploads:/app/wwwroot`.
  - `sail-ai` (`./ai/Dockerfile`): Порт 8000. Зв'язок з API через `MAIN_API_URL=http://api:8080`.
  - `sail-frontend` (`node:22-alpine`): Порт 3000. Направляє запити на `REACT_APP_BASE_URL=http://localhost:8080`.

### ☁️ Хмарне розгортання (Railway & Supabase)
- **Supabase Session Pooler:** Конфігурація `SUPABASE_SESSION_POOLER` у Production для ефективного пул-менеджменту з'єднань PostgreSQL (PgBouncer).
- **Змінні оточення (Env Vars):**
  - `ASPNETCORE_ENVIRONMENT=Production`
  - `SUPABASE_SESSION_POOLER`
  - `AI_SERVICE_URL`
  - `Backblaze__PrivateBucketName`, `Backblaze__PublicBucketName`
  - `Backblaze__KeyId`, `Backblaze__ApplicationKey`, `Backblaze__ServiceUrl`
  - `JWT__SigningKey`, `JWT__Issuer`, `JWT__Audience`
  - `AllowedOrigins`
