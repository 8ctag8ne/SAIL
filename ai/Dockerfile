FROM python:3.11-slim
WORKDIR /app

# Встановлюємо Java JRE для OpenDataLoader
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jre curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Обмежуємо споживання RAM для JVM в контейнері
ENV _JAVA_OPTIONS="-Xms64m -Xmx384m -XX:+UseSerialGC"

# Встановлюємо Python-залежності
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Запускаємо FastAPI
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

