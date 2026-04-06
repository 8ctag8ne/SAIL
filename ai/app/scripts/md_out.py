import uuid
from pathlib import Path

# === CONFIG ===
BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = BASE_DIR / "input_local.txt"
OUTPUT_DIR = (BASE_DIR / "../artifacts").resolve()

def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_FILE}")

    # Читаємо всі рядки
    with INPUT_FILE.open("r", encoding="utf-8") as f:
        lines = f.readlines()

    # Склеюємо в один рядок
    # strip() щоб прибрати зайві \n, але залишити \n\n всередині тексту
    content = "".join(line.strip() for line in lines)
    content = content.replace("\\n", "\n")

    # Генеруємо ім'я файлу
    original_name = INPUT_FILE.stem
    unique_id = uuid.uuid4().hex
    output_filename = f"{original_name}_{unique_id}.md"

    # Створюємо директорію, якщо не існує
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    output_path = OUTPUT_DIR / output_filename

    # Записуємо результат
    with output_path.open("w", encoding="utf-8") as f:
        f.write(content)

    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()