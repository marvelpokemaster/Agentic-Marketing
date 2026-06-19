"""
src/lead_generation/pipeline.py
───────────────────────────────
End-to-end lead generation orchestration.

    brief text ──▶ extract_criteria ──▶ run selected scrapers (parallel)
              ──▶ deduplicate ──▶ score (Gemini)

Outreach is generated on demand per lead (see api `/api/leads/{id}/outreach`)
to avoid burning the Gemini free-tier rate limit on leads you don't pursue.
Each stage is independently usable; this module just wires them together.
"""

import asyncio

from src.lead_generation.llm import extract_criteria
from src.lead_generation.scoring import score_leads
from src.lead_generation.scrapers import get_scraper
from src.shared.models import Lead, SearchCriteria
from src.shared.utils.normalize import deduplicate


async def scrape(criteria: SearchCriteria, scraper_ids: list[str], *, progress=None) -> list[Lead]:
    """Run the selected scrapers concurrently and merge + dedupe results."""
    scrapers = [s for s in (get_scraper(sid) for sid in scraper_ids) if s]
    if not scrapers:
        return []

    for s in scrapers:
        s.on_progress = progress  # stream each scraper's per-target progress

    results = await asyncio.gather(
        *(s.run(criteria) for s in scrapers), return_exceptions=True
    )
    collected: list[Lead] = []
    for s, res in zip(scrapers, results):
        if isinstance(res, Exception):
            msg = f"[pipeline] {s.name} error: {res}"
            print(msg)
            if progress:
                progress("scrape", msg)
        elif res:
            collected.extend(res)

    return deduplicate(collected)


async def run(
    brief: str,
    scraper_ids: list[str],
    *,
    criteria: SearchCriteria | None = None,
    max_results_per_target: int = 5,
    progress=None,
) -> tuple[SearchCriteria, list[Lead]]:
    """
    Full pipeline. `progress(stage, message)` is an optional callback for the UI.
    Returns (criteria, scored_leads). Outreach is generated later, per lead.
    """
    def emit(stage, message):
        if progress:
            progress(stage, message)
        print(f"[pipeline] {message}")

    if criteria is None:
        emit("extract", "Extracting search intent from brief...")
        criteria = extract_criteria(brief, max_results_per_target=max_results_per_target)

    emit("scrape", f"Scraping {len(scraper_ids)} source(s) for {len(criteria.search_terms())} target(s)...")
    leads = await scrape(criteria, scraper_ids, progress=progress)
    emit("scrape", f"Collected {len(leads)} unique leads after dedupe.")

    emit("score", "Scoring leads with AI...")
    leads = score_leads(leads, criteria)

    emit("done", f"Done — {len(leads)} leads ready. Open a lead to generate outreach.")
    return criteria, leads
