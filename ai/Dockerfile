FROM python:3.11-slim

WORKDIR /app

# Копіюємо список ліб
COPY requirements.txt .

# Встановлюємо їх (Docker закешує цей крок)
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо весь код сервісу
COPY . .

# Запускаємо FastAPI
CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]