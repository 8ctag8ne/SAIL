#ai/app/services/parser/heuristic_service.py
from typing import List, Dict, Any
import re

class HeuristicService:
    def clean_json_elements(self, elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned = []
        last_level = 0
        
        for item in elements:
            new_item = dict(item)
            content = str(new_item.get("content", "")).strip()
            item_type = new_item.get("type", "")
            
            # Step 1: Remove hyphenations
            content = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', content)
            content = re.sub(r'(\w+)-\s+(\w+)', r'\1\2', content)
            new_item["content"] = content
            
            # Step 2: Heading validation
            if item_type == "heading":
                is_invalid = False
                
                if len(content) > 150:
                    is_invalid = True
                elif re.search(r'[!?,]$', content):
                    is_invalid = True
                elif content.endswith('.'):
                    if not re.search(r'\d+\.$', content):
                        is_invalid = True
                        
                if is_invalid:
                    item_type = "paragraph"
                    new_item["type"] = "paragraph"
                else:
                    # Fix hierarchy jumps
                    curr_level = new_item.get("heading level", 1)
                    if curr_level > last_level + 1:
                        curr_level = last_level + 1
                        new_item["heading level"] = curr_level
                    last_level = curr_level
                    
            # Step 3: Paragraph merging
            if item_type == "paragraph" and cleaned:
                prev_item = cleaned[-1]
                if prev_item.get("type") == "paragraph":
                    prev_content = str(prev_item.get("content", "")).strip()
                    if prev_content and not re.search(r'[.!?]$', prev_content):
                        # Merge with previous block
                        cleaned[-1]["content"] = prev_content + " " + content
                        continue
                        
            # Step 4: Heading merging
            if item_type == "heading" and cleaned:
                prev_item = cleaned[-1]
                if prev_item.get("type") == "heading" and prev_item.get("heading level") == new_item.get("heading level"):
                    prev_content = str(prev_item.get("content", "")).strip()
                    cleaned[-1]["content"] = prev_content + " " + content
                    continue
                        
            cleaned.append(new_item)
            
        return cleaned
    def build_hierarchical_structure(self, json_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        hierarchy = []
        active_headers = {}
        
        for item in json_data:
            item_type = item.get("type")
            
            if item_type == "heading":
                level = item.get("heading level", 1)
                
                new_node = {
                    "type": "heading",
                    "heading level": level,
                    "content": item.get("content", ""),
                    "page number": item.get("page number"),
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
                        active_headers[parent_level]["children"].append(new_node)
                    else:
                        hierarchy.append(new_node)
                
                active_headers[level] = new_node
                
                # Clear deeper headers
                keys_to_clear = [k for k in active_headers.keys() if k > level]
                for k in keys_to_clear:
                    del active_headers[k]
                    
            else:
                new_node = {
                    "type": item_type,
                    "content": item.get("content", ""),
                    "page number": item.get("page number")
                }
                
                if active_headers:
                    max_active_level = max(active_headers.keys())
                    active_headers[max_active_level].setdefault("children", []).append(new_node)
                else:
                    hierarchy.append(new_node)
                    
        return hierarchy

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
                if page <= 5 or page >= max_page - 4:
                    content = item.get("content")
                    if content:
                        filtered_contents.append(str(content))
                        
        return "\n\n".join(filtered_contents)

    def convert_to_markdown(self, hierarchical_data: List[Dict[str, Any]]) -> str:
        markdown_blocks = []
        
        def _traverse(node: Dict[str, Any]):
            node_type = node.get("type")
            content = node.get("content", "")
            
            if node_type == "heading":
                level = node.get("heading level", 1)
                markdown_blocks.append(f"{'#' * level} {content}")
            else:
                if content:
                    markdown_blocks.append(content)
                
            for child in node.get("children", []):
                _traverse(child)
                
        for root_node in hierarchical_data:
            _traverse(root_node)
            
        return "\n\n".join(markdown_blocks)