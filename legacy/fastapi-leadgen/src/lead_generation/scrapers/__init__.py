"""
Auto-discovers scraper modules and exposes the registry.
"""

import importlib
import pkgutil

from src.lead_generation.scrapers.base import (
    BaseScraper,
    PlaywrightScraper,
    SCRAPER_REGISTRY,
    register_scraper,
)
from src.shared.config import config

# Helper modules — not scrapers
_SKIP_MODULES = {
    "base",
    "serpapi_client",
    "serpapi_parser",
    "website_enricher",
    "site_analyzer",
    "test_serpapi_parser",
}

for _module in pkgutil.iter_modules(__path__):
    if _module.name not in _SKIP_MODULES:
        importlib.import_module(f"{__name__}.{_module.name}")


def available_scrapers() -> list[dict]:
    """Metadata for the UI checklist. SerpApi listed first when configured."""
    items = []
    for cls in SCRAPER_REGISTRY.values():
        is_serp = cls.name == "serpapi_google"
        items.append({
            "id": cls.name,
            "label": cls.label + (" (recommended)" if is_serp and config.has_serpapi else ""),
            "recommended": is_serp and config.has_serpapi,
            "enabled": True if not is_serp else config.has_serpapi,
            "disabled_reason": None if (not is_serp or config.has_serpapi) else "Set SERPAPI_API_KEY in .env",
        })
    items.sort(key=lambda x: (0 if x["id"] == "serpapi_google" else 1, x["label"]))
    return items


def get_scraper(name: str) -> BaseScraper | None:
    cls = SCRAPER_REGISTRY.get(name)
    return cls() if cls else None


__all__ = [
    "BaseScraper",
    "PlaywrightScraper",
    "register_scraper",
    "available_scrapers",
    "get_scraper",
    "SCRAPER_REGISTRY",
]
