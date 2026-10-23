# SAIL — agent guide

SAIL (in-app name MARS) is an electronic library of military literature: book catalogue, reading
lists and comments, plus Ukrainian-language semantic search (hybrid BM25 + pgvector RAG) over the
books' text. Product overview: [README.md](README.md). Its stack table and setup steps are out of
date (no SQL Server, Gemini or Tesseract any more); trust this file and the code.

Detailed per-part specs (Ukrainian, written for the Antigravity IDE) live in `.agents/`:
[`.agents/AGENTS.md`](.agents/AGENTS.md) and `.agents/skills/mars-{backend,frontend,ai-microservice}/SKILL.md`.
Read the matching one before larger changes to a part. Code comments and UI text are Ukrainian.

## How the parts fit

| Part | What | Stack |
|---|---|---|
| `api/` | Gateway: auth (Identity + JWT, roles), CRUD, file storage, rate limits, proxies AI calls and the SSE stream `/api/ai/rag/ask` | ASP.NET Core 8, EF Core 8 + Npgsql + Pgvector |
| `api.Tests/` | NUnit + Moq tests, **currently broken** (see Pitfalls) | net9.0 |
| `frontend/` | React 19 PWA, MUI 7, "terminal" theme in `src/theme.ts` | Create React App, TypeScript 4.9 |
| `ai/` | FastAPI: PDF → Markdown (OpenDataLoader), metadata extraction, hierarchical chunking + embeddings, RAG answers | Python 3.11, async SQLAlchemy + asyncpg, OpenRouter |
| `benchmark/` | Offline RAG evaluation scripts (LLM-as-judge via Gemini) against a running AI service | Python |
| `docker-compose.local.example.yml` | Local stack: `db` (pgvector pg16, :5432), `api` (:8080), `ai-service` (:8000), `frontend` (:3000) | |

- frontend → api only, at `REACT_APP_BASE_URL`. api → ai through the named `HttpClient` `"AiService"`
  (`AI_SERVICE_URL`, default `http://localhost:8000`). ai → api to fetch a book's PDF:
  `GET {MAIN_API_URL}/api/Book/{id}/download`.
- api and ai share one Postgres. **api owns the schema**: EF migrations in `api/Migrations/` run
  automatically at startup (`db.Database.Migrate()` in `Program.cs`), with snake_case names
  (`UseSnakeCaseNamingConvention`). `ai/app/db/models.py` maps the same tables (`books`,
  `book_markdowns`, `document_chunks`, `tags`, `authors`): change a column in a migration first, then
  mirror it there. Embeddings are `vector(2560)`.
- Production: api and ai on Railway, DB on Supabase (via `SUPABASE_SESSION_POOLER`, PgBouncer), files
  on Backblaze B2, frontend on Netlify.

## Configuration

Names only; values live in untracked `.env` files and deploy secrets. Never commit a value.

- **api**: `DotEnv.Load()` loads `.env` from the working directory into the process environment,
  overwriting variables already set. It runs after `WebApplication.CreateBuilder`, so
  `ASPNETCORE_ENVIRONMENT` must come from the real environment or `launchSettings.json`, not `.env`.
  Unset means `Production` (the Docker image's default). The environment decides the wiring:
  `Production` → `SUPABASE_SESSION_POOLER` + `CloudFileService` (B2, `Backblaze__*`); anything
  else → `DB_CONNECTION_LOCAL` + `LocalFileService` (writes under `wwwroot/`, e.g.
  `wwwroot/Books/Images`). `JWT__Issuer`, `JWT__Audience` and `JWT__SigningKey` are required. Also
  `AllowedOrigins` (comma-separated, default `http://localhost:3000`), `AI_SERVICE_URL`, and for
  mail `RESEND_API_KEY` (or `RESEND_KEY`), `RESEND_FROM_EMAIL`, `SMTP_*` (or `GMAIL_APP_PASSWORD`)
  and `FEEDBACK_RECIPIENT_EMAIL`. `EmailService` falls back to a real project Gmail address for
  the sender and recipient, so a local test can send real mail.
- **ai**: `app/core/config.py` (pydantic-settings, reads `ai/.env`): `SUPABASE_SESSION_POOLER`,
  else `DATABASE_URL` (URL or ADO.NET-style string). **The pooler wins**: if it is set anywhere,
  `DATABASE_URL` is ignored and ai talks to Supabase. Also `OPENROUTER_API_KEY`, `MAIN_API_URL`,
  `OLLAMA_API_BASE`, `ENVIRONMENT`. The engine is built at import time, so even importing
  `app.main` needs a DB URL set; it does not connect until a request needs it.
- **frontend**: `REACT_APP_BASE_URL` (read in `src/config.ts`), baked in at build time.

## Commands

Run from the repo root unless a `cd` is shown. "✓" means it was run on 2026-10-23 and worked.

### api

```bash
cd api && dotnet build                         # ✓ (in the mcr.microsoft.com/dotnet/sdk:8.0 container)
docker build -t sail-api ./api                 # ✓ the deploy image (port 8080)
cd api && dotnet run                           # http://localhost:5102, Swagger at /swagger
cd api && dotnet ef migrations add <Name>      # new migration; applied on next start
```

`dotnet run` was not run directly (no .NET SDK on that machine). The equivalent was ✓: the
`sail-api` image against a fresh `pgvector/pgvector:pg16` container applied all 9 migrations and
answered `/swagger` and `GET /api/book` with 200. `dotnet ef` was not run (needs the `dotnet-ef`
tool and a DB).

### api.Tests

```bash
dotnet test api.Tests                          # ✗ does not compile, see Pitfalls
```

### frontend

```bash
cd frontend && npm ci                          # ✓
cd frontend && CI=false npm run build          # ✓ same as the Netlify workflow; output in build/
cd frontend && npm start                       # dev server on :3000
cd frontend && CI=true npm test -- --watchAll=false   # ✗ fails, see Pitfalls
```

`npm start` was not run (a long-running dev server; it compiles the same code as the build).

### ai

```bash
cd ai && python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt   # ✓
cd ai && .venv/bin/uvicorn app.main:app --reload --port 8000                     # ✓ GET / → 200
```

Debug endpoints: `GET /debug/db-tags`, `POST /debug/glossary-detect`, `POST /debug/query-rewrite`.
OpenDataLoader runs Java, so the AI service needs a JRE (`ai/Dockerfile` installs `default-jre`).

### benchmark

```bash
cd benchmark && pip install -r requirements.txt
python benchmark/04_eval_models.py --name <run-name> [--no-hybrid] [--rewrite] [--thinking]
```

Not run: needs the AI service on `:8000`, a Google GenAI key and a testset CSV
(`data/output/testset.csv`, produced by `generate_dataset_clean.py`).

### Whole stack

```bash
cp docker-compose.local.example.yml docker-compose.local.yml   # gitignored; fill in the values
docker compose -f docker-compose.local.yml up --build
```

The example validates (`docker compose -f docker-compose.local.example.yml config -q` ✓); a full
`up` was not run (needs real keys). The example has drifted from the code:
- `ai-service` sets `DATABASE_URL_LOCAL` and `UNSTRUCTURED_API_KEY`, which ai never reads (use
  `DATABASE_URL`), and lacks `MAIN_API_URL` (ai → `http://api:8080`).
- `api` still sets the dead `Gemini__*` variables and lacks the `RESEND_*` ones.
- `frontend` lacks `REACT_APP_BASE_URL`.

Neither `api/` nor `ai/` has a `.dockerignore`, and `ai/Dockerfile` does `COPY . .`. A
`--build` therefore bakes `ai/.env` (secrets, maybe the Supabase pooler) and `ai/.venv` into the
image, and the baked `.env` then supplies every value compose doesn't set.

## Branches and PRs

**Never push to `main`.** All work goes on a `feature/<short-desc>` or `fix/<short-desc>` branch
cut from `main` and lands through a PR to `main` on GitHub (`8ctag8ne/SAIL`). Merging is the
owner's call. The next section explains why: `main` is production.

## CI/CD (`.github/workflows`)

- `deploy-frontend.yml`: every push to `main`/`master` touching `frontend/**` builds and deploys to
  Netlify production, so merging a PR that touches `frontend/` is a production deploy. It passes the secret
  `REACT_APP_API_URL`, which the code never reads; the API URL the build really uses is
  `REACT_APP_BASE_URL` from the tracked `frontend/.env`.
- `health-check.yml`: cron `0 0,12 * * *` (its comment's "every 5 days" is wrong) curls
  `${RAILWAY_API_URL}/health` so Supabase doesn't auto-pause. Keep `HealthController`'s `/health`
  route working.
- No workflow builds or tests `api/` or `ai/`; they deploy through Railway, not from this repo.

## Conventions

- api layers: `Controllers/` → services → `ApplicationDbContext`. Domain services live in
  `api/Data/Services/{Interfaces,Implementations}`, infrastructure services (files, PDF, email,
  tokens, RAG quota) in `api/Services/{Interfaces,Implementations}`; register new ones in
  `Program.cs`. Entities in `Models/Entities`, DTOs per area in `Models/DTOs/<Area>/`, static mapping
  extension methods in `Mappers/`, filter objects in `Helpers/*QueryObject.cs`.
- Namespaces are mixed: most code is `MilLib.*`, but `Program.cs`, migrations and some DTOs and
  helpers use `api.*`. Follow the neighbouring files in the same folder.
- Rate-limit policies (`AuthRateLimiter`, `AiRateLimiter`, `HealthCheckLimiter`,
  `FeedbackRateLimiter`) are defined in `Program.cs` and applied with `[EnableRateLimiting]`.
- Roles: `User`, `Librarian`, `Admin`, seeded at startup by `RoleHelper.SeedRolesAndAdmin`
  (`Helpers/RoleSeeder.cs`). On a database with no admin it creates user `admin` with a
  hard-coded password: change it on any new environment.
- frontend: API wrappers live in `src/api/`, most going through the shared axios instance in
  `src/api/axios.ts` (it adds the JWT). The exceptions use raw `fetch` with their own token
  handling: `src/api/markdownApi.ts` and the RAG stream in `src/pages/RagSearchPage.tsx`. A change
  to the axios interceptor doesn't reach them. Build new UI from
  `src/components/ui/` and the `theme.ts` tokens, not one-off styles.
- ai: HTTP routes in `app/main.py`, logic in `app/services/` (parsers, chunking strategies behind
  base classes, `rag_service.py`, `llm_service.py`, `query_service.py` with `glossary.json`). Long
  jobs run as `BackgroundTasks` with in-memory status, so a restart loses in-flight tasks.

## Pitfalls

- `frontend/.env` is tracked in git and holds deploy credentials. Don't add values to it, and
  never print its contents.
- `api.Tests` does not compile: `UnitTest1.cs` tests a removed `IBookRepository` /
  `MilLib.Repositories` API. (It also targets net9.0, so it needs SDK 9; that is not the compile
  error.) Its `bin/` and `obj/` are committed despite `.gitignore`. Its failure is not caused by
  your change.
- The frontend tests fail: Jest (CRA 5) can't resolve `react-router-dom` v7, and `App.test.tsx` is
  the CRA boilerplate ("learn react"). Check frontend changes with `npm run build`.
- The deploy workflow sets `CI: false` so ESLint warnings don't fail the build; a local build with
  `CI=true` can fail on warnings production ignores.
- `api/.gitignore` ignores `*.csv`, `*.log`, `wwwroot/` and more under `api/`; use `git add -f` when
  such a file must be tracked.
- Missing JWT settings don't stop the api from starting. Program.cs only logs "Issues with JWT or
  role seeding", roles and the admin aren't seeded, and the first login or authenticated request
  fails. Read that log line on startup.
