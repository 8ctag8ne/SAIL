FROM python:3.11-slim
WORKDIR /app

# 1. Встановлюємо curl, а потім Node.js v20 (LiteParse вимагає Node 18+)
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Встановлюємо сам рушій LiteParse глобально
RUN npm i -g @llamaindex/liteparse

# 3. Встановлюємо Python-залежності (в requirements.txt має бути liteparse)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Запускаємо FastAPI
CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]