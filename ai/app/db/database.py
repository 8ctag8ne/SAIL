# db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

def get_database_url() -> str:
    raw_url = settings.SUPABASE_SESSION_POOLER or settings.DATABASE_URL or ""
    raw_url = raw_url.strip().strip('"').strip("'")
    
    # Якщо рядок у форматі .NET / ADO.NET (User Id=...;Password=...;Server=...)
    if "Server=" in raw_url or "Host=" in raw_url:
        parts = {}
        for item in raw_url.split(";"):
            if "=" in item:
                k, v = item.split("=", 1)
                parts[k.strip().lower()] = v.strip()
        user = parts.get("user id") or parts.get("username") or parts.get("user") or "postgres"
        password = parts.get("password") or ""
        host = parts.get("server") or parts.get("host") or "localhost"
        port = parts.get("port") or "5432"
        db = parts.get("database") or "postgres"
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"
        
    url = raw_url
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        
    # asyncpg doesn't support ?pgbouncer=true query param directly
    if "?" in url:
        base, query = url.split("?", 1)
        params = [p for p in query.split("&") if not p.startswith("pgbouncer=")]
        url = f"{base}?{'&'.join(params)}" if params else base
    return url

# Створюємо движок з вимкненим кешуванням prepared statements для сумісності з PgBouncer (Supabase)
engine = create_async_engine(
    get_database_url(),
    echo=settings.is_development,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    }
)

# Створюємо фабрику сесій
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# Dependency для FastAPI (Аналог AddScoped у .NET)
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session