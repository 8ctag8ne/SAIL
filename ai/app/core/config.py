# core/config.py
from __future__ import annotations
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: Optional[str] = None
    SUPABASE_SESSION_POOLER: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OLLAMA_API_BASE: Optional[str] = None  
    MAIN_API_URL: str = "http://localhost:8080"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"

    # Вказуємо Pydantic шукати змінні у файлі .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Створюємо єдиний екземпляр на весь додаток
settings = Settings()