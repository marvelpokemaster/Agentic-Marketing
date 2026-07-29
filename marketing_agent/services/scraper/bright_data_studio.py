"""Bright Data Scraper Studio collector adapter.

The adapter invokes a user-owned, published Studio collector and converts its
structured rows into the application's portable Lead model. The collector's
input field is configurable because Studio collectors have custom schemas.
"""

import asyncio
from typing import Any

import httpx

from marketing_agent.configs.settings import get_settings
from marketing_agent.core.utils.normalize import to_lead
from marketing_agent.models.lead import Lead
from marketing_agent.models.research import SearchCriteria
from marketing_agent.services.scraper.base import BaseScraper, register_scraper

_API_BASE = "https://api.brightdata.com"


def _row_to_lead(row: dict[str, Any]) -> Lead | None:
    """Accept common Studio/Maps field names while retaining unknown data."""
    normalized = {
        **row,
        "name": row.get("name") or row.get("business_name") or row.get("title"),
        "category": row.get("category") or row.get("type") or row.get("business_type"),
        "address": row.get("address") or row.get("full_address") or row.get("location"),
        "phone": row.get("phone") or row.get("phone_number"),
        "email": row.get("email"),
        "website": row.get("website") or row.get("website_url") or row.get("url"),
        "rating": row.get("rating") or row.get("reviews_rating"),
        "reviews": row.get("reviews") or row.get("reviews_count"),
        "source": "bright_data_studio",
    }
    # The normalized aliases must win over an empty/missing source field in row.
    normalized["source"] = "bright_data_studio"
    return to_lead(normalized, source="bright_data_studio")


@register_scraper
class BrightDataStudioScraper(BaseScraper):
    name = "bright_data_studio"
    label = "Bright Data Scraper Studio"

    async def run(self, criteria: SearchCriteria) -> list[Lead]:
        settings = get_settings()
        if not settings.has_bright_data_studio:
            self.emit(
                "Bright Data Studio is not configured — set BRIGHT_DATA_API_TOKEN "
                "and BRIGHT_DATA_COLLECTOR_ID"
            )
            return []

        inputs = [
            {settings.bright_data_input_field: f"{target} {criteria.location}".strip()}
            for target in criteria.search_terms()
        ]
        if not inputs:
            self.emit("No search targets were available for Bright Data Studio")
            return []

        headers = {"Authorization": f"Bearer {settings.bright_data_api_token}"}
        timeout = httpx.Timeout(30.0, read=60.0)
        async with httpx.AsyncClient(base_url=_API_BASE, headers=headers, timeout=timeout) as client:
            self.emit(f"triggering collector for {len(inputs)} input(s)...")
            response = await client.post(
                "/dca/trigger",
                params={"collector": settings.bright_data_collector_id, "queue_next": 1},
                json=inputs,
            )
            response.raise_for_status()
            collection_id = response.json().get("collection_id")
            if not collection_id:
                raise RuntimeError("Bright Data trigger response did not include collection_id")

            self.emit(f"collector started (snapshot {collection_id}); waiting for results...")
            rows = await self._wait_for_rows(client, collection_id)

        leads = [lead for row in rows if isinstance(row, dict) if (lead := _row_to_lead(row))]
        self.emit(f"collector finished — {len(leads)} usable leads")
        return leads

    async def _wait_for_rows(self, client: httpx.AsyncClient, collection_id: str) -> list[dict[str, Any]]:
        settings = get_settings()
        attempts = max(1, int(settings.bright_data_max_wait_seconds / settings.bright_data_poll_interval_seconds))
        for _ in range(attempts):
            response = await client.get("/dca/dataset", params={"id": collection_id, "format": "json"})
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, list):
                return payload
            await asyncio.sleep(settings.bright_data_poll_interval_seconds)
        raise TimeoutError(
            f"Bright Data collector {collection_id} was not ready after "
            f"{settings.bright_data_max_wait_seconds} seconds"
        )
