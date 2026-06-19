"""
SerpApi Google Search scraper — primary lead discovery source.
"""

import asyncio

from src.lead_generation.scrapers.base import BaseScraper, register_scraper
from src.lead_generation.scrapers import serpapi_client, serpapi_parser, website_enricher
from src.shared.config import config
from src.shared.models import Lead, SearchCriteria
from src.shared.utils.normalize import to_lead


@register_scraper
class SerpApiGoogleScraper(BaseScraper):
    name = "serpapi_google"
    label = "Google Search (SerpApi)"

    async def run(self, criteria: SearchCriteria) -> list[Lead]:
        if not config.has_serpapi:
            self.emit("SERPAPI_API_KEY not set — add it to .env to use this source")
            return []

        max_results = criteria.max_results_per_target or config.default_max_results
        location = criteria.location or ""
        targets = criteria.search_terms()
        all_leads: list[Lead] = []

        for i, target in enumerate(targets, 1):
            query = f"{target} {location}".strip()
            self.emit(f"SerpApi search ({i}/{len(targets)}): '{query}'")

            try:
                def on_page(start, count):
                    self.emit(f"  page start={start} → {count} organic results")

                pages = await asyncio.to_thread(
                    serpapi_client.fetch_all,
                    query,
                    max_results,
                    on_page=on_page,
                )
                parsed = serpapi_parser.parse_pages(pages)
                self.emit(
                    f"  parsed: {len(parsed.organic_candidates)} organic, "
                    f"{len(parsed.direct_leads)} direct (local/kg)"
                )

                direct_no_website = [r for r in parsed.direct_leads if not r.get("website")]
                direct_with_website = [r for r in parsed.direct_leads if r.get("website")]

                for row in direct_no_website:
                    lead = to_lead(row, source=self.name)
                    if lead:
                        lead.metadata.setdefault("serpapi_query", query)
                        all_leads.append(lead)

                organic = serpapi_parser.dedupe_by_domain(parsed.organic_candidates)[
                    :max_results
                ]
                to_enrich = serpapi_parser.dedupe_by_domain(organic + direct_with_website)
                if to_enrich:
                    self.emit(f"  enriching {len(to_enrich)} websites...")

                    def on_enrich(n, total, url):
                        self.emit(f"  enrich {n}/{total}: {url or '?'}")

                    enriched = await website_enricher.enrich_all(
                        to_enrich, on_progress=on_enrich
                    )
                    for row in enriched:
                        lead = to_lead(row, source=self.name)
                        if lead:
                            lead.metadata.setdefault("serpapi_query", query)
                            all_leads.append(lead)

            except Exception as exc:
                self.emit(f"  query failed: {exc}")

        self.emit(f"SerpApi finished — {len(all_leads)} leads")
        return all_leads
