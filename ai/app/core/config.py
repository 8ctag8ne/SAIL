# core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL_LOCAL: str | None = None
    SUPABASE_SESSION_POOLER: str | None = None
    OPENROUTER_API_KEY: str | None = None
    OLLAMA_API_BASE: str | None = None  
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"

    # Вказуємо Pydantic шукати змінні у файлі .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Створюємо єдиний екземпляр на весь додаток
settings = Settings()