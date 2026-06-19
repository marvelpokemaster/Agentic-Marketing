"""
src/lead_generation/export/exporter.py
──────────────────────────────────────
CSV export and optional CRM webhook push.
"""

import csv
import io
import json
import urllib.error
import urllib.request

from src.shared.config import config
from src.shared.models import Lead

EXPORT_FIELDS = (
    "name",
    "email",
    "phone",
    "source",
    "score",
    "score_reason",
    "score_breakdown",
    "campaign_id",
    "funnel_status",
    "outreach_status",
    "list_status",
)


def lead_to_export_row(lead: Lead) -> dict:
    d = lead.to_dict()
    return {k: d.get(k, "") for k in EXPORT_FIELDS}


def leads_to_csv(leads: list[Lead]) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=EXPORT_FIELDS)
    writer.writeheader()
    for lead in leads:
        writer.writerow(lead_to_export_row(lead))
    return buf.getvalue()


def push_crm_webhook(leads: list[Lead]) -> bool:
    url = config.crm_webhook_url
    if not url:
        return False
    payload = json.dumps({"leads": [lead_to_export_row(l) for l in leads]}).encode()
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10):
            return True
    except (urllib.error.URLError, OSError) as exc:
        print(f"[crm_webhook] failed: {exc}")
        return False
