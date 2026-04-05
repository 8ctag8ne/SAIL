import regex as re
from typing import List


class HeuristicService:
    def clean_markdown(self, text: str) -> str:
        text = self._fix_hyphenation(text)
        text = self._fix_line_breaks_inside_sentences(text)

        blocks = self._split_blocks(text)
        blocks = self._merge_blocks(blocks)

        return "\n\n".join(blocks).strip()

    def _fix_hyphenation(self, text: str) -> str:
        text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
        text = re.sub(r'(\w+)-\s+(\w+)', r'\1\2', text)
        return text

    def _fix_line_breaks_inside_sentences(self, text: str) -> str:
        return re.sub(
            r'([\p{Ll},])\n([\p{Ll}])',
            r'\1 \2',
            text
        )

    def _split_blocks(self, text: str) -> List[str]:
        return [b.strip() for b in text.split("\n\n") if b.strip()]

    def _merge_blocks(self, blocks: List[str]) -> List[str]:
        if not blocks:
            return blocks

        merged = [blocks[0]]

        for i in range(1, len(blocks)):
            prev = merged[-1]
            curr = blocks[i]

            if self._should_merge(prev, curr):
                merged[-1] = prev + " " + curr
            else:
                merged.append(curr)

        return merged

    def _should_merge(self, prev: str, curr: str) -> bool:
        return (
            not self._ends_with_sentence_end(prev)
            and not self._starts_with_new_sentence(curr)
            and not self._is_special_block(curr)
        )

    def _ends_with_sentence_end(self, text: str) -> bool:
        if re.search(r'[.!?:]\s*$', text):
            if re.search(r'(e\.g|i\.e|etc)\.$', text, re.IGNORECASE):
                return False
            return True
        return False

    def _starts_with_new_sentence(self, text: str) -> bool:
        return bool(re.match(r'^\s*[\p{Lu}0-9"\(]', text))

    def _is_special_block(self, text: str) -> bool:
        return (
            self._is_markdown_header(text)
            or self._is_list_item(text)
            or self._is_numbered_list(text)
        )

    def _is_markdown_header(self, text: str) -> bool:
        return bool(re.match(r'^\s*#', text))

    def _is_list_item(self, text: str) -> bool:
        return bool(re.match(r'^\s*[-*•]', text))

    def _is_numbered_list(self, text: str) -> bool:
        return bool(re.match(r'^\s*\d+\.', text))