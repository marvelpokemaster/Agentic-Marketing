"""
src/lead_generation/outreach/whatsapp_sender.py
───────────────────────────────────────────────
WhatsApp outreach stub — logs intent without calling Meta API.
"""

import re
from datetime import datetime, timezone

from src.shared import storage, utm
from src.shared.external_api import run_with_retry
from src.shared.utils.phone import clean_phone, is_valid_phone


def execute_whatsapp_stub(
    *,
    lead_id: str,
    phone: str,
    message: str,
    campaign_id: str,
    log_id: str,
    whatsapp_opt_in: bool,
    lead_source: str = "",
    score: int | None = None,
    image_url: str | None = None,
    store_lead_fn=None,
) -> dict:
    if not whatsapp_opt_in:
        raise ValueError("WhatsApp opt-in not confirmed for this lead.")
    normalized = clean_phone(phone)
    if not normalized or not is_valid_phone(phone):
        raise ValueError("Invalid phone number for WhatsApp.")

    # Append UTM to URLs in message
    url_pattern = re.compile(r"(https?://[^\s]+)")

    def utm_url(m):
        return utm.append_utm(
            m.group(1), campaign_id=campaign_id, lead_id=lead_id, medium="whatsapp"
        )

    message = url_pattern.sub(utm_url, message or "")
    if image_url and image_url not in message:
        message = f"{message}\n\n[Image: {image_url}]"

    def do_stub():
        extra = f" + image {image_url[:60]}..." if image_url else ""
        print(f"[whatsapp_stub] Would send to {normalized}: {message[:120]}...{extra}")

    ok, err = run_with_retry(
        "whatsapp_stub",
        do_stub,
        context={"lead_id": lead_id, "phone": normalized},
    )
    now = datetime.now(timezone.utc).isoformat()
    row = storage.append_outreach_log(
        {
            "id": log_id,
            "lead_id": lead_id,
            "campaign_id": campaign_id,
            "channel": "whatsapp",
            "status": "stub_sent" if ok else "failed",
            "to": normalized,
            "body": message,
            "image_url": image_url,
            "source": lead_source,
            "score": score,
            "sent_at": now if ok else None,
            "error": err,
        }
    )
    if store_lead_fn and ok:
        store_lead_fn(lead_id, funnel_status="outreached", outreach_status="sent")
    elif store_lead_fn and not ok:
        store_lead_fn(lead_id, outreach_status="failed")
    return row
