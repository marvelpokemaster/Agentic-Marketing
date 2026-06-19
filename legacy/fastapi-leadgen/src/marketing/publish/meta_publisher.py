"""
src/marketing/publish/meta_publisher.py
───────────────────────────────────────
Meta ad publish stub — logs intended publish payload without Graph API calls.
"""

from datetime import datetime, timezone

from src.shared import storage, utm
from src.shared.external_api import run_with_retry


def execute_meta_stub(
    *,
    campaign_id: str,
    ad: dict,
    platform: str,
    scheduled_at: str | None,
    log_id: str,
    pending_id: str | None = None,
) -> dict:
    cta_url = ad.get("cta_url") or ad.get("image_url") or "https://example.com"
    cta_with_utm = utm.append_utm(
        cta_url, campaign_id=campaign_id, lead_id=None, medium="social", source="meta"
    )
    payload = {
        "headline": ad.get("headline"),
        "copy": ad.get("copy"),
        "cta": ad.get("cta"),
        "cta_url": cta_with_utm,
        "image_url": ad.get("image_url"),
        "platform": platform,
        "scheduled_at": scheduled_at,
    }

    def do_stub():
        print(f"[meta_stub] Would publish to {platform}: {payload.get('headline')}")

    ok, err = run_with_retry("meta_stub", do_stub, context={"pending_id": pending_id})
    now = datetime.now(timezone.utc).isoformat()
    row = storage.append_outreach_log(
        {
            "id": log_id,
            "lead_id": None,
            "campaign_id": campaign_id,
            "channel": "meta_ad",
            "status": "stub_published" if ok else "failed",
            "payload": payload,
            "sent_at": now if ok else None,
            "scheduled_at": scheduled_at,
            "error": err,
        }
    )
    return row
