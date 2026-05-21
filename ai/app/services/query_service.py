#ai/app/services/query_service.py
import json
import logging
from pathlib import Path
import re

import pymorphy3

logger = logging.getLogger(__name__)

_GLOSSARY_PATH = Path(__file__).parent / "query" / "glossary.json"

# ---------------------------------------------------------------------------
# Unicode-aware word boundary helpers
# ---------------------------------------------------------------------------
# Python's \b is ASCII-only — it treats all Cyrillic characters as non-word
# characters, so \b never matches *between* two Cyrillic letters.
# We replace \b with look-around assertions that work for any Unicode letter:
#   (?<!\w)  – position NOT preceded by a Unicode word character
#   (?!\w)   – position NOT followed by a Unicode word character
# re.UNICODE is implicitly active for str patterns in Python 3, but the
# trick here is to pass re.UNICODE explicitly so \w covers Cyrillic too.
_WB_PREFIX = r"(?<!\w)"
_WB_SUFFIX = r"(?!\w)"


def _make_pattern(candidate: str) -> re.Pattern:
    """Return a compiled, Unicode-aware whole-word pattern for *candidate*."""
    return re.compile(
        _WB_PREFIX + re.escape(candidate) + _WB_SUFFIX,
        re.UNICODE | re.IGNORECASE,
    )


class QueryProcessor:
    """
    Domain Query Adapter for military literature search.

    Loads the military glossary once at startup and exposes:
      - find_matches()            → structured list of matched terms
      - extract_glossary_context() → formatted string for the LLM prompt

    Matching uses both direct substring and morphological (lemma) matching
    via pymorphy3 (Ukrainian). All patterns are pre-compiled at startup.

    Context format:
      - If matched by primary_term  → "Термін: <primary_term>\\nВизначення: <definition>"
      - If matched by a synonym      → "Синонім: <matched_synonym>\\nВизначення: <definition>"
    """

    def __init__(self) -> None:
        self._morph = pymorphy3.MorphAnalyzer(lang="uk")
        self._glossary: list[dict] = self._load_glossary()
        # Pre-compile patterns and pre-lemmatize candidates for every entry
        self._prepared = self._prepare_glossary()
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

    def _lemmatize(self, text: str) -> str:
        """
        Return a space-joined string of normal forms for every token in *text*.
        Input is expected to be already lowercased.

        Leading/trailing punctuation is stripped from each token before
        lemmatization so that words like "мопеда?" or "АГС." are correctly
        reduced to their normal forms ("мопед", "агс").
        Pure-punctuation tokens (e.g. a standalone "?!") are dropped.
        """
        tokens = text.split()
        lemmas: list[str] = []
        for token in tokens:
            # Strip leading/trailing non-word characters (punctuation, brackets…)
            clean = re.sub(r"^\W+|\W+$", "", token, flags=re.UNICODE)
            if not clean:
                continue  # was purely punctuation — skip
            parsed = self._morph.parse(clean)
            if parsed:
                lemmas.append(parsed[0].normal_form)
            else:
                lemmas.append(clean)
        return " ".join(lemmas)


    def _prepare_glossary(self) -> list[dict]:
        """
        For each glossary entry pre-compute a list of candidate descriptors.

        Each candidate descriptor is:
          {
            "original": str,        # original casing from JSON
            "is_primary": bool,     # True if it's the primary_term
            "patterns": [Pattern],  # surface + lemma patterns (deduped)
          }

        This is done once at startup so matching is O(1) compilation per request.
        """
        prepared: list[dict] = []
        for entry in self._glossary:
            primary_term: str = entry.get("primary_term", "")
            synonyms: list[str] = entry.get("synonyms", [])
            definition: str = entry.get("definition", "")

            candidates: list[dict] = []

            for i, raw in enumerate([primary_term] + synonyms):
                if not raw:
                    continue
                is_primary = (i == 0)
                cand_lower = raw.lower()
                cand_lemma = self._lemmatize(cand_lower)

                patterns: list[re.Pattern] = [_make_pattern(cand_lower)]
                if cand_lemma != cand_lower:
                    patterns.append(_make_pattern(cand_lemma))

                candidates.append({
                    "original": raw,
                    "is_primary": is_primary,
                    "patterns": patterns,
                })

            prepared.append({
                "primary_term": primary_term,
                "definition": definition,
                "candidates": candidates,
            })

        return prepared

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def find_matches(self, query: str) -> list[dict]:
        """
        Return a structured list of glossary matches for *query*.

        Each element:
          {
            "matched_text": str,   # the exact candidate (original casing) that matched
            "is_primary":  bool,   # True → matched by primary_term; False → by synonym
            "definition":  str,
          }

        Only the *first* matching candidate per glossary entry is returned
        (primary_term takes precedence over synonyms due to list ordering).
        """
        query_lower = query.lower()
        query_lemma = self._lemmatize(query_lower)

        results: list[dict] = []
        seen_terms: set[str] = set()

        for entry in self._prepared:
            primary_term = entry["primary_term"]
            if primary_term in seen_terms:
                continue

            for cand in entry["candidates"]:
                matched = any(
                    p.search(query_lower) or p.search(query_lemma)
                    for p in cand["patterns"]
                )
                if matched:
                    seen_terms.add(primary_term)
                    results.append({
                        "matched_text": cand["original"],
                        "is_primary": cand["is_primary"],
                        "definition": entry["definition"],
                    })
                    break  # first match per entry wins

        return results

    def extract_glossary_context(self, query: str) -> str:
        """
        Return a formatted string for the LLM query-rewrite prompt.

        Format per match:
          - primary_term match → "Термін: <term>\\nВизначення: <definition>"
          - synonym match      → "Синонім: <synonym>\\nВизначення: <definition>"
        """
        matches = self.find_matches(query)
        parts: list[str] = []
        for m in matches:
            label = "Термін" #if m["is_primary"] else "Синонім"
            parts.append(
                f"{label}: {m['matched_text']}\n"
                f"Визначення: {m['definition']}"
            )
        return "\n\n".join(parts)
