"""
src/shared/models/search_criteria.py
────────────────────────────────────
Structured search intent extracted from a company's free-text brief.

Produced by lead_generation/llm/requirement_extractor.py and consumed by
every scraper, the scorer, and the outreach generator.
"""

from dataclasses import dataclass, field, asdict


@dataclass
class SearchCriteria:
    raw_text: str = ""
    company_name: str = ""
    what_they_do: str = ""
    product: str = ""
    targets: list[str] = field(default_factory=list)        # business types to search
    location: str = ""
    attributes: list[str] = field(default_factory=list)     # desired lead qualities
    additional_requirements: str = ""
    max_results_per_target: int = 5

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "SearchCriteria":
        allowed = {f for f in cls.__dataclass_fields__}
        return cls(**{k: v for k, v in (data or {}).items() if k in allowed})

    def search_terms(self) -> list[str]:
        """Targets to iterate over; falls back to the product if none inferred."""
        return self.targets or ([self.product] if self.product else [])
