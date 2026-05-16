#ai/app/services/parser/heuristic_service.py
from typing import List, Dict, Any
import re

class HeuristicService:
    def _extract_cell_text(self, cell: Dict[str, Any]) -> str:
        """Витягує та нормалізує текст з комірки таблиці для Markdown.

        Делегує рекурсивний обхід вузла методу _extract_text_from_node,
        після чого застосовує:
          - нормалізацію маркованого списку: '• А;• Б;' → 'А; Б'
          - екранування символу '|'
          - видалення зайвих пробілів і переносів рядків
        """
        combined = self._extract_text_from_node(cell)

        # Нормалізуємо маркований список: '• А;• Б;' → 'А; Б'
        if "•" in combined:
            bullets = [b.strip().rstrip(";").strip() for b in combined.split("•") if b.strip()]
            combined = "; ".join(bullets)

        # Видаляємо переноси рядків та екрануємо «|»
        combined = combined.replace("\n", " ").replace("|", r"\|")
        # Стискаємо зайві пробіли
        combined = re.sub(r" {2,}", " ", combined).strip()
        return combined

    def _extract_text_from_node(self, node: Dict[str, Any]) -> str:
        """Допоміжний метод: рекурсивно дістає весь текст з вузла (потрібно для комірок таблиці)."""
        texts = []
        content = str(node.get("content", "")).strip()
        if content:
            texts.append(content)
            
        for key in ["kids", "children", "list items"]:
            if key in node and isinstance(node[key], list):
                for child in node[key]:
                    child_text = self._extract_text_from_node(child)
                    if child_text:
                        texts.append(child_text)
                        
        return " ".join(texts)

    def _convert_table_to_markdown(self, table_node: Dict[str, Any]) -> str:
        """Перетворює JSON-вузол таблиці на готову Markdown-таблицю.
        
        Підтримує різні способи зберігання рядків:
          - table_node["kids"] / table_node["children"] — масив рядків
          - table_node["rows"] — явне поле rows
        Перший рядок вважається заголовком і відділяється роздільником «---».
        """
        # Підтримуємо kids / children / rows як джерело рядків
        rows: list = []
        for key in ("kids", "children", "rows"):
            candidate = table_node.get(key, [])
            if candidate:
                rows = candidate
                break

        if not rows:
            return ""

        md_lines: list[str] = []
        row_index = 0  # лічильник лише для рядків типу «table row»

        for row in rows:
            if str(row.get("type", "")).lower() != "table row":
                continue

            # Отримуємо комірки: підтримуємо «cells» та «kids»/«children»
            cells = row.get("cells") or row.get("kids") or row.get("children") or []

            # Сортуємо комірки за номером стовпця, якщо є
            cells = sorted(
                cells,
                key=lambda c: int(c.get("column number", c.get("col", 0)))
            )

            cell_texts = [self._extract_cell_text(cell) for cell in cells]

            if not cell_texts:
                continue

            md_lines.append("| " + " | ".join(cell_texts) + " |")

            # Після першого рядка-заголовка додаємо роздільник
            if row_index == 0:
                md_lines.append("| " + " | ".join(["---"] * len(cell_texts)) + " |")

            row_index += 1

        return "\n".join(md_lines)
        
    def flatten_elements(self, elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Рекурсивно витягує всі вкладені елементи, ігнорує футери і збирає таблиці."""
        flat_list = []
        for item in elements:
            flat_item = dict(item) 
            item_type = str(flat_item.get("type", "")).lower()
            
            # 🔥 1. ІГНОРУЄМО СМІТТЯ: футери, хедери та вотермарки
            if item_type in ["footer", "header", "watermark"]:
                continue # Переходимо до наступного елемента, ігноруючи всіх його "дітей"
                
            # 🔥 2. ТАБЛИЦІ: Конвертуємо в Markdown і не йдемо глибше
            if item_type == "table":
                md_table = self._convert_table_to_markdown(flat_item)
                if md_table:
                    # Записуємо всю таблицю як один великий параграф
                    flat_list.append({
                        "type": "paragraph",
                        "content": md_table,
                        "page number": flat_item.get("page number", 1)
                    })
                continue # Ми вже обробили комірки, тому пропускаємо рекурсію для цієї таблиці

            # 3. Збираємо всіх можливих "дітей" (звичайна логіка)
            children = []
            for key in ["kids", "children", "list items"]:
                if key in flat_item and isinstance(flat_item[key], list):
                    children.extend(flat_item.pop(key))
            
            # Якщо вузол має власний текст, додаємо його в плоский список
            if str(flat_item.get("content", "")).strip():
                flat_list.append(flat_item)
                
            # Якщо знайшли вкладені елементи - рекурсивно обробляємо їх
            if children:
                flat_list.extend(self.flatten_elements(children))
                
        return flat_list

    def clean_json_elements(self, elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        flat_elements = self.flatten_elements(elements)
        
        cleaned = []
        page_count = 0
        
        # --- PASS 1: Очищення, багатомовна валідація та злиття ---
        for item in flat_elements:

            page_count = max(page_count, item.get("page number", 0))

            new_item = dict(item)
            content = str(new_item.get("content", "")).strip()
            item_type = new_item.get("type", "")

            # ЛІКУВАННЯ СПИСКІВ: Перетворюємо всі списки на параграфи
            if item_type in ["list", "list item", "list_item"]:
                item_type = "paragraph"
                new_item["type"] = "paragraph"

            # 1. ЖОРСТКА НОРМАЛІЗАЦІЯ СИМВОЛІВ (Лікуємо PDF-кодування)
            # Повертаємо літеру "ї", яку парсер ковтнув
            content = content.replace('\x00', 'ї')
            
            # Нормалізація всіх видів апострофів до одного стандартного
            content = re.sub(r"[’‘´`]", "'", content)
            
            # Лікуємо латинську "i" всередині кириличних слів
            # Якщо латинська 'i' стоїть між двома кириличними літерами - міняємо на українську 'і'
            content = re.sub(r'(?<=[А-Яа-яЄєЇїҐґ])i(?=[А-Яа-яЄєЇїҐґ])', 'і', content)
                
            # Markdown-таблиці мають власну структуру рядків — пропускаємо OCR-евристики
            is_md_table = content.startswith("|") and "\n|" in content

            if not is_md_table:
                # Евристика 1: Очищення артефактів OCR
                content = content.replace('\u00AD', '') # Видаляємо м'які перенесення
                content = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', content) # Склеюємо слова
                content = re.sub(r'(\w+)-\s+(\w+)', r'\1\2', content)
                
                # Евристика 2: Виправлення розрядки "С Е К Р Е Т Н О"
                if re.match(r'^([^\W\d_]\s+){2,}[^\W\d_]$', content, flags=re.UNICODE):
                    content = content.replace(' ', '')
                    
                # Склеюємо розірвані рядки всередині одного абзацу
                content = re.sub(r'(?<!\n)\n(?!\n)', ' ', content)
                content = re.sub(r'\s{2,}', ' ', content).strip()
            
            new_item["content"] = content
            
            # Евристика 3: Валідація заголовків (Більш обережна)
            if item_type == "heading":
                is_invalid = False
                
                # Заголовок на 200 символів - це абзац
                if len(content) > 200:
                    is_invalid = True
                # Заголовки рідко закінчуються комою чи питанням
                elif re.search(r'[?,]$', content):
                    is_invalid = True
                    
                if is_invalid:
                    item_type = "paragraph"
                    new_item["type"] = "paragraph"
                    
            # Евристика 4: Злиття абзаців та відірваних маркерів списків
            # Markdown-таблиці не зливаємо ні з чим — вони мають власну структуру
            if item_type == "paragraph" and cleaned and not is_md_table:
                prev_item = cleaned[-1]
                prev_content = str(prev_item.get("content", "")).strip()
                prev_is_md_table = prev_content.startswith("|") and "\n|" in prev_content

                if prev_item.get("type") == "paragraph" and not prev_is_md_table:
                    # Сценарій А: Попередній елемент - це відірваний маркер (напр. "1).", "-", "•")
                    if re.match(r'^(\d+[\.\)]+|\w[\.\)]+|[•\-\*])$', prev_content):
                        cleaned[-1]["content"] = prev_content + " " + content
                        continue
                        
                    # Сценарій Б: Звичайне злиття, якщо попереднє речення не закінчено.
                    # Не включаємо двокрапку (:), щоб такі речення як "Але є нюанси:" зливалися з наступними!
                    if prev_content and not re.search(r'[.!?:]$', prev_content):
                        cleaned[-1]["content"] = prev_content + " " + content
                        continue
                        
            # Евристика 5: Злиття розірваних заголовків однакового рівня
            if item_type == "heading" and cleaned:
                prev_item = cleaned[-1]
                if prev_item.get("type") == "heading" and prev_item.get("heading level") == new_item.get("heading level"):
                    prev_content = str(prev_item.get("content", "")).strip()
                    cleaned[-1]["content"] = prev_content + " " + content
                    continue
                        
            cleaned.append(new_item)
            
        # --- PASS 2: Нормалізація рівнів заголовків (Вирівнювання ієрархії) ---
        
        # 1. Перевіряємо, чи є на першій сторінці хоча б один заголовок 1-го рівня
        has_h1_on_first_page = any(
            item.get("heading level") == 1 
            for item in cleaned 
            if item.get("type") == "heading" and item.get("page number") == 1
        )
        has_h1_on_last_page = any(
            item.get("heading level") == 1 
            for item in cleaned 
            if item.get("type") == "heading" and item.get("page number") == page_count
        )
        
        # 2. Збираємо рівні заголовків для визначення мінімального
        valid_headings = []
        for item in cleaned:
            if item.get("type") == "heading":
                # Якщо на 1-й або останній сторінці є H1, ігноруємо всі заголовки 1-ї сторінки для розрахунку зсуву.
                # Якщо H1 немає - беремо заголовки з 1-ї сторінки до уваги.
                if item.get("page number") == 1 and has_h1_on_first_page:
                    continue
                if item.get("page number") == page_count and has_h1_on_last_page:
                    continue
                
                valid_headings.append(item["heading level"])
        
        # 3. Застосовуємо зсув до ВСІХ заголовків (включно з титульними)
        if valid_headings:
            min_level = min(valid_headings)
            offset = min_level - 1
            
            if offset > 0:
                for item in cleaned:
                    if item.get("type") == "heading":
                        item["heading level"] = max(1, item["heading level"] - offset)
                        
        return cleaned

    def build_hierarchical_structure(self, json_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        hierarchy = []
        active_headers = {}
        
        # --- ЕТАП 1: Побудова базового дерева ---
        for item in json_data:
            item_type = item.get("type")
            page_num = item.get("page number", 1)
            
            if item_type == "heading":
                level = item.get("heading level", 1)
                
                new_node = {
                    "type": "heading",
                    "level": level,
                    "text": item.get("content", ""),
                    "page_start": page_num,
                    "page_end": page_num,
                    "children": []
                }
                
                if level == 1:
                    hierarchy.append(new_node)
                else:
                    # Find the nearest parent
                    parent_level = level - 1
                    while parent_level > 0 and parent_level not in active_headers:
                        parent_level -= 1
                    
                    if parent_level > 0:
                        # 🔥 FIX HIERARCHY: Enforce making the level 1 greater than the parent.
                        # This ignores the crazy parser numbers (e.g., H8 after H2 becomes H3)
                        new_node["level"] = parent_level + 1
                        level = new_node["level"] # Update local variable for active_headers
                        
                        active_headers[parent_level]["children"].append(new_node)
                    else:
                        # If parent is not found, it is a root node
                        new_node["level"] = 1
                        level = 1
                        hierarchy.append(new_node)
                
                # Update page_end for all active ancestors
                for lvl in list(active_headers.keys()):
                    if lvl < level:
                        active_headers[lvl]["page_end"] = max(active_headers[lvl].get("page_end", 1), page_num)

                active_headers[level] = new_node
                
                # Clear deeper headers
                keys_to_clear = [k for k in active_headers.keys() if k > level]
                for k in keys_to_clear:
                    del active_headers[k]
                    
            else:
                new_node = {
                    "type": item_type,
                    "level": 5,
                    "text": item.get("content", ""),
                    "page_start": page_num,
                    "page_end": page_num,
                    "children": []
                }
                
                if active_headers:
                    max_active_level = max(active_headers.keys())
                    active_headers[max_active_level].setdefault("children", []).append(new_node)
                    
                    # Update page_end for all active ancestors
                    for lvl in active_headers.keys():
                        active_headers[lvl]["page_end"] = max(active_headers[lvl].get("page_end", 1), page_num)
                else:
                    hierarchy.append(new_node)
                    
        # --- ЕТАП 2: Злиття дублікатів заголовків (Презентації) ---
        def merge_duplicate_headings(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
            merged_nodes = []
            seen_headings = {}  # Зберігає { "текст_заголовка": посилання_на_вузол }
            
            for node in nodes:
                if node.get("type") == "heading":
                    # Використовуємо очищений текст як ключ, щоб ігнорувати зайві пробіли
                    text_key = node.get("text", "").strip()
                    
                    if text_key and text_key in seen_headings:
                        # Знайшли дублікат на цьому ж рівні!
                        existing_node = seen_headings[text_key]
                        # Переносимо всіх дітей від дубліката до оригіналу
                        existing_node["children"].extend(node.get("children", []))
                        # Оновлюємо кінець сторінки для оригінального вузла
                        existing_node["page_end"] = max(existing_node.get("page_end", 1), node.get("page_end", 1))
                    else:
                        # Це новий заголовок на цьому рівні
                        merged_nodes.append(node)
                        seen_headings[text_key] = node
                else:
                    # Параграфи та інші елементи просто додаємо
                    merged_nodes.append(node)
                    
            # Рекурсивно застосовуємо до дітей кожного злитого вузла
            for node in merged_nodes:
                if node.get("children"):
                    node["children"] = merge_duplicate_headings(node["children"])
                    
            return merged_nodes

        # --- ЕТАП 3: Очищення порожніх вузлів ---
        def filter_empty_nodes(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
            valid_nodes = []
            for node in nodes:
                node["children"] = filter_empty_nodes(node.get("children", []))
                if node.get("children") or node.get("text", "").strip():
                    valid_nodes.append(node)
            return valid_nodes

        # Викликаємо наші фільтри по черзі
        merged_hierarchy = merge_duplicate_headings(hierarchy)
        return filter_empty_nodes(merged_hierarchy)

    def extract_metadata_context(self, json_data: List[Dict[str, Any]]) -> str:
        if not json_data:
            return ""
            
        max_page = 0
        for item in json_data:
            page = item.get("page number")
            if isinstance(page, int) and page > max_page:
                max_page = page
                
        filtered_contents = []
        for item in json_data:
            page = item.get("page number")
            if isinstance(page, int):
                if page <= 10 or page >= max_page - 4:
                    content = item.get("content")
                    if content:
                        filtered_contents.append(str(content))
                        
        return "\n\n".join(filtered_contents)

    def convert_to_markdown(self, hierarchical_data: List[Dict[str, Any]]) -> str:
        markdown_blocks = []
        
        def _traverse(node: Dict[str, Any]):
            node_type = node.get("type")
            content = node.get("text", "")
            
            if node_type == "heading":
                level = node.get("level", 1)
                markdown_blocks.append(f"{'#' * level} {content}")
            else:
                if content:
                    markdown_blocks.append(content)
                
            for child in node.get("children", []):
                _traverse(child)
                
        for root_node in hierarchical_data:
            _traverse(root_node)
            
        return "\n\n".join(markdown_blocks)