#ai/app/services/query_service.py
import json
import logging
from pathlib import Path

import pymorphy3

logger = logging.getLogger(__name__)

_GLOSSARY_PATH = Path(__file__).parent / "query" / "glossary.json"


class QueryProcessor:
    """
    Domain Query Adapter for military literature search.

    Loads the military glossary once at startup and exposes
    `extract_glossary_context` to find relevant terms in a user query
    using both direct substring matching and morphological (lemma) matching
    via pymorphy3 (Ukrainian).
    """

    def __init__(self) -> None:
        self._morph = pymorphy3.MorphAnalyzer(lang="uk")
        self._glossary: list[dict] = self._load_glossary()
        logger.info(
            "QueryProcessor initialised with %d glossary terms.", len(self._glossary)
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _load_glossary() -> list[dict]:
        try:
            with _GLOSSARY_PATH.open(encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, list):
                raise ValueError("Glossary JSON must be a top-level array.")
            return data
        except Exception as exc:
            logger.error("Failed to load glossary from %s: %s", _GLOSSARY_PATH, exc)
            return []

    def _lemmatize_query(self, query: str) -> str:
        """
        Return a space-joined string of normal forms for every token in *query*.
        Non-alphabetic tokens (numbers, punctuation) are kept as-is.
        """
        tokens = query.split()
        lemmas: list[str] = []
        for token in tokens:
            parsed = self._morph.parse(token)
            if parsed:
                lemmas.append(parsed[0].normal_form)
            else:
                lemmas.append(token)
        return " ".join(lemmas)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract_glossary_context(self, query: str) -> str:
        """
        Find glossary entries whose *primary_term* or any *synonym* appears
        as a substring inside:
          - the lowercased original query, OR
          - the lemmatized (lowercased) query.

        Returns a formatted string with definitions and synonyms of all
        matched terms, or an empty string if nothing matched.
        """
        query_lower = query.lower()
        lemmatized_query = self._lemmatize_query(query_lower)

        matched_parts: list[str] = []
        seen_terms: set[str] = set()

        for entry in self._glossary:
            primary_term: str = entry.get("primary_term", "")
            synonyms: list[str] = entry.get("synonyms", [])
            definition: str = entry.get("definition", "")

            # Build the candidate list: primary term + all synonyms (lowercased)
            candidates = [primary_term.lower()] + [s.lower() for s in synonyms]

            matched = any(
                candidate and (
                    candidate in query_lower or candidate in lemmatized_query
                )
                for candidate in candidates
            )

            if matched and primary_term not in seen_terms:
                seen_terms.add(primary_term)
                synonyms_str = (
                    ", ".join(synonyms) if synonyms else "відсутні"
                )
                matched_parts.append(
                    f"Термін: {primary_term}\n"
                    f"Визначення: {definition}\n"
                    f"Синоніми: {synonyms_str}"
                )

        return "\n\n".join(matched_parts)
