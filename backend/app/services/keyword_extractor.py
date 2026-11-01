import re
from typing import Dict, List, Set

COMMON_TECH_TAXONOMY: Dict[str, str] = {
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "react.js": "react",
    "reactjs": "react",
    "react": "react",
    "node.js": "nodejs",
    "nodejs": "nodejs",
    "node": "nodejs",
    "py": "python",
    "python": "python",
    "ts": "typescript",
    "typescript": "typescript",
    "js": "javascript",
    "javascript": "javascript",
    "golang": "go",
    "go": "go",
    "fastapi": "fastapi",
    "docker": "docker",
    "aws": "aws",
    "gcp": "gcp",
    "azure": "azure",
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "mongodb": "mongodb",
    "redis": "redis",
    "graphql": "graphql",
    "rest": "rest api",
    "restful": "rest api",
    "ci/cd": "ci/cd",
    "terraform": "terraform",
    "microservices": "microservices",
    "git": "git",
    "linux": "linux"
}


class KeywordExtractor:
    @classmethod
    def extract_keywords(cls, text: str) -> List[str]:
        cleaned_text = cls._sanitize_text(text)
        found_keywords: Set[str] = set()

        for token in cleaned_text.split():
            clean_token = token.strip(".,;:!?()[]{}")
            normalized = COMMON_TECH_TAXONOMY.get(clean_token)
            if normalized:
                found_keywords.add(normalized)

        for phrase, canonical in COMMON_TECH_TAXONOMY.items():
            if " " in phrase or "/" in phrase or "." in phrase:
                if phrase in cleaned_text:
                    found_keywords.add(canonical)

        return sorted(list(found_keywords))

    @classmethod
    def _sanitize_text(cls, text: str) -> str:
        lowered = text.lower()
        cleaned = re.sub(r"[^\w\s\/\.\-]", " ", lowered)
        return cleaned
