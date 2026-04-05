# core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    UNSTRUCTURED_API_KEY: str
    OPENROUTER_API_KEY: str
    OLLAMA_API_BASE: str
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"

    # Вказуємо Pydantic шукати змінні у файлі .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Створюємо єдиний екземпляр на весь додаток
settings = Settings()