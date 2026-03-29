FROM python:3.11-slim

WORKDIR /app

# 1. Встановлюємо системні залежності для OpenCV (libxcb) та Tesseract OCR
# tesseract-ocr-ukr додасть підтримку української мови "з коробки"
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libx11-xcb1 \
    libsm6 \
    libxext6 \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-ukr \
    tesseract-ocr-rus \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 2. Копіюємо та встановлюємо Python-залежності
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Кешуємо моделі Docling (щоб сервіс стартував миттєво)
RUN python -c "from docling.document_converter import DocumentConverter; DocumentConverter()"

# 4. Копіюємо весь інший код
COPY . .

# Запускаємо FastAPI
CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]