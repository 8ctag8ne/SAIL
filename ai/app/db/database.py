# db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Створюємо движок
engine = create_async_engine(settings.DATABASE_URL_LOCAL, echo=settings.is_development)

# Створюємо фабрику сесій
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# Dependency для FastAPI (Аналог AddScoped у .NET)
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session