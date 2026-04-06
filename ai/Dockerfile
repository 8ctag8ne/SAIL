FROM python:3.11-slim
WORKDIR /app

# 1. Встановлюємо curl, а потім Node.js v20 (LiteParse вимагає Node 18+)
RUN apt-get update \
    && apt-get install -y curl \
    && apt-get clean \
    && apt-get install -y default-jre \
    && rm -rf /var/lib/apt/lists/*

# 3. Встановлюємо Python-залежності (в requirements.txt має бути liteparse)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Запускаємо FastAPI
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]