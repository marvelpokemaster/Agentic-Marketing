"""
src/shared/utm.py
─────────────────
UTM parameter builder for campaign attribution.
"""

from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from src.shared import storage


def append_utm(
    url: str,
    *,
    campaign_id: str,
    lead_id: str | None = None,
    medium: str = "email",
    source: str = "agentic_marketing",
) -> str:
    if not url or url.startswith("#") or url.startswith("mailto:"):
        return url
    campaign = storage.get_campaign(campaign_id)
    utm_campaign = (campaign or {}).get("utm_campaign", campaign_id)
    parsed = urlparse(url)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    qs["utm_source"] = [source]
    qs["utm_medium"] = [medium]
    qs["utm_campaign"] = [utm_campaign]
    if lead_id:
        qs["utm_content"] = [lead_id]
    new_query = urlencode(qs, doseq=True)
    return urlunparse(parsed._replace(query=new_query))
