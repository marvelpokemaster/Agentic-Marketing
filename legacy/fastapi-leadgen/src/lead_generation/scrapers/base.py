"""
src/lead_generation/scrapers/base.py
────────────────────────────────────
Common scraper interface + registry.

Every scraper implements the SAME contract:

    class MyScraper(BaseScraper):
        name = "my_source"
        label = "My Source"
        async def run(self, criteria: SearchCriteria) -> list[Lead]: ...

and registers itself with the @register_scraper decorator. The package
__init__ auto-imports every module here, so adding a scraper is literally
"drop a new file in this folder" — no business code changes required.

PlaywrightScraper is a convenience base for browser scrapers: it manages the
browser lifecycle and asks subclasses only for `scrape_target()`.
"""

import abc

from src.shared.config import config
from src.shared.models import Lead, SearchCriteria
from src.shared.utils.normalize import to_lead

SCRAPER_REGISTRY: dict[str, type["BaseScraper"]] = {}


def register_scraper(cls: type["BaseScraper"]) -> type["BaseScraper"]:
    SCRAPER_REGISTRY[cls.name] = cls
    return cls


class BaseScraper(abc.ABC):
    """The contract all scrapers share."""

    name: str = "base"
    label: str = "Base"

    # Optional callback the pipeline sets to stream progress to the UI/console.
    on_progress = None

    def emit(self, message: str) -> None:
        line = f"[{self.name}] {message}"
        print(line)
        if callable(self.on_progress):
            self.on_progress("scrape", line)

    @abc.abstractmethod
    async def run(self, criteria: SearchCriteria) -> list[Lead]:
        """Return leads matching the search criteria."""
        raise NotImplementedError


class PlaywrightScraper(BaseScraper):
    """Base for browser-driven scrapers. Subclasses implement scrape_target()."""

    async def run(self, criteria: SearchCriteria) -> list[Lead]:
        from playwright.async_api import async_playwright

        location = criteria.location or ""
        max_results = criteria.max_results_per_target or config.default_max_results
        targets = criteria.search_terms()
        leads: list[Lead] = []

        mode = "headless" if config.scraper_headless else "visible window"
        self.emit(f"launching browser ({mode})...")

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=config.scraper_headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-http2",
                ],
            )
            context = await browser.new_context(
                user_agent=config.user_agent,
                viewport={"width": 1280, "height": 800},
            )
            await context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            page = await context.new_page()
            try:
                for i, target in enumerate(targets, 1):
                    self.emit(f"searching '{target}' in {location or 'any location'} ({i}/{len(targets)})...")
                    try:
                        rows = await self.scrape_target(page, target, location, max_results)
                        found = 0
                        for row in rows:
                            row.setdefault("business_type", target)
                            lead = to_lead(row, source=self.name)
                            if lead:
                                leads.append(lead)
                                found += 1
                        self.emit(f"'{target}' → {found} leads")
                    except Exception as exc:  # one target failing must not kill the run
                        self.emit(f"target '{target}' failed: {exc}")
            finally:
                await context.close()
                await browser.close()
        self.emit(f"finished — {len(leads)} leads total")
        return leads

    @abc.abstractmethod
    async def scrape_target(self, page, target: str, location: str, max_results: int) -> list[dict]:
        """Scrape one business type and return raw dict rows."""
        raise NotImplementedError

    # ── helpers ────────────────────────────────────────────────────────────
    @staticmethod
    def clean_text(text: str | None) -> str | None:
        if not text:
            return None
        import re

        text = re.sub(r"\s+", " ", text.strip().replace("\n", " ").replace("\r", " "))
        return text or None

    @staticmethod
    def extract_phone(text: str | None) -> str | None:
        if not text:
            return None
        import re

        match = re.search(r"[\+\d][\d\s\-\(\)]{7,}", text)
        if match and sum(c.isdigit() for c in match.group()) >= 7:
            return match.group().strip()
        return None
