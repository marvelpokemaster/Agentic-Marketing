"""
src/shared/analytics.py
───────────────────────
Aggregate KPIs, send log, responders, and source breakdown for analyst dashboard.
"""

from src.shared import storage


FUNNEL_STAGES = ("scraped", "scored", "outreached", "opened", "replied", "converted")


def _score_bucket(score) -> str:
    if score is None:
        return "unknown"
    s = int(score)
    if s >= 70:
        return "high"
    if s >= 45:
        return "medium"
    return "low"


def _lead_get(lead, key: str):
    if isinstance(lead, dict):
        return lead.get(key)
    return getattr(lead, key, None)


def _lead_id(lead) -> str | None:
    return _lead_get(lead, "id")


def _build_lead_index(leads: list) -> dict[str, object]:
    index: dict[str, object] = {}
    for lead in leads:
        lid = _lead_id(lead)
        if lid:
            index[lid] = lead
    return index


def _enrich_log(log: dict, lead_index: dict) -> dict:
    lead = lead_index.get(log.get("lead_id") or "")
    row = dict(log)
    if lead:
        row["lead_name"] = _lead_get(lead, "name") or "Unknown"
        row["lead_email"] = _lead_get(lead, "email")
        row["lead_phone"] = _lead_get(lead, "phone")
        row["funnel_status"] = _lead_get(lead, "funnel_status") or "scraped"
        row["outreach_status"] = _lead_get(lead, "outreach_status") or "draft"
        if row.get("score") is None:
            row["score"] = _lead_get(lead, "score")
        if not row.get("source"):
            row["source"] = _lead_get(lead, "source") or "unknown"
    else:
        row.setdefault("lead_name", log.get("lead_name") or "Unknown")
        row.setdefault("source", log.get("source") or "unknown")
        row.setdefault("funnel_status", "unknown")
    row["has_opened"] = bool(row.get("opened_at"))
    row["has_clicked"] = bool(row.get("clicked_at"))
    row["has_replied"] = bool(row.get("replied_at"))
    return row


def build_summary(*, campaign_id: str | None = None, leads: list | None = None) -> dict:
    """Full analyst dashboard payload."""
    all_logs = storage.list_outreach_log()
    lead_list = list(leads or [])
    lead_index = _build_lead_index(lead_list)

    if campaign_id and campaign_id != "all":
        logs = [r for r in all_logs if r.get("campaign_id") == campaign_id]
        lead_list = [
            l
            for l in lead_list
            if _lead_get(l, "campaign_id") == campaign_id
        ]
        lead_index = _build_lead_index(lead_list)
    else:
        logs = all_logs

    email_logs = [r for r in logs if r.get("channel") == "email"]
    email_sent = [r for r in email_logs if r.get("status") == "sent"]
    wa_logs = [r for r in logs if r.get("channel") == "whatsapp"]
    wa_sent = [r for r in wa_logs if r.get("status") == "stub_sent"]
    meta_logs = [r for r in logs if r.get("channel") == "meta_ad"]

    opened = len([r for r in email_sent if r.get("opened_at")])
    clicked = len([r for r in logs if r.get("clicked_at")])
    replied_logs = [r for r in logs if r.get("replied_at")]
    replied = len(replied_logs)
    failed = len([r for r in logs if r.get("status") == "failed"])

    converted = len([l for l in lead_list if _lead_get(l, "funnel_status") == "converted"])
    total_leads = len(lead_list)
    contacted = len(email_sent) + len(wa_sent)

    funnel: dict[str, int] = {s: 0 for s in FUNNEL_STAGES}
    for lead in lead_list:
        st = _lead_get(lead, "funnel_status") or "scraped"
        if st in funnel:
            funnel[st] += 1
        else:
            funnel["scraped"] += 1

    by_source: dict[str, dict] = {}
    for lead in lead_list:
        src = _lead_get(lead, "source") or "unknown"
        by_source.setdefault(
            src,
            {"leads": 0, "sent": 0, "opened": 0, "clicked": 0, "replied": 0, "converted": 0},
        )
        by_source[src]["leads"] += 1
        fs = _lead_get(lead, "funnel_status")
        if fs == "converted":
            by_source[src]["converted"] += 1

    send_log = [_enrich_log(r, lead_index) for r in logs if r.get("channel") in ("email", "whatsapp")]
    send_log.sort(key=lambda r: r.get("sent_at") or r.get("created_at") or "", reverse=True)

    for row in send_log:
        src = row.get("source") or "unknown"
        by_source.setdefault(
            src,
            {"leads": 0, "sent": 0, "opened": 0, "clicked": 0, "replied": 0, "converted": 0},
        )
        if row.get("status") in ("sent", "stub_sent"):
            by_source[src]["sent"] += 1
        if row.get("opened_at"):
            by_source[src]["opened"] += 1
        if row.get("clicked_at"):
            by_source[src]["clicked"] += 1
        if row.get("replied_at"):
            by_source[src]["replied"] += 1

    for src, bucket in by_source.items():
        sent_n = bucket["sent"]
        bucket["open_rate"] = round(bucket["opened"] / max(sent_n, 1), 4)
        bucket["reply_rate"] = round(bucket["replied"] / max(sent_n, 1), 4)
        bucket["conversion_rate"] = round(bucket["converted"] / max(bucket["leads"], 1), 4)

    by_bucket: dict[str, dict] = {}
    for lead in lead_list:
        b = _score_bucket(_lead_get(lead, "score"))
        by_bucket.setdefault(b, {"leads": 0, "converted": 0})
        by_bucket[b]["leads"] += 1
        if _lead_get(lead, "funnel_status") == "converted":
            by_bucket[b]["converted"] += 1

    responders: list[dict] = []
    seen_leads: set[str] = set()
    for row in send_log:
        if not row.get("replied_at"):
            continue
        lid = row.get("lead_id")
        if lid and lid in seen_leads:
            continue
        if lid:
            seen_leads.add(lid)
        responders.append(
            {
                "lead_id": lid,
                "lead_name": row.get("lead_name"),
                "source": row.get("source"),
                "channel": row.get("channel"),
                "to": row.get("to"),
                "replied_at": row.get("replied_at"),
                "sent_at": row.get("sent_at"),
                "log_id": row.get("id"),
                "funnel_status": row.get("funnel_status"),
                "score": row.get("score"),
            }
        )

    for lead in lead_list:
        lid = _lead_id(lead)
        fs = _lead_get(lead, "funnel_status")
        if fs not in ("replied", "converted") or not lid or lid in seen_leads:
            continue
        seen_leads.add(lid)
        latest = next((r for r in send_log if r.get("lead_id") == lid), None)
        responders.append(
            {
                "lead_id": lid,
                "lead_name": _lead_get(lead, "name"),
                "source": _lead_get(lead, "source") or "unknown",
                "channel": latest.get("channel") if latest else None,
                "to": latest.get("to") if latest else (_lead_get(lead, "email") or _lead_get(lead, "phone")),
                "replied_at": latest.get("replied_at") if latest else None,
                "sent_at": latest.get("sent_at") if latest else None,
                "log_id": latest.get("id") if latest else None,
                "funnel_status": fs,
                "score": _lead_get(lead, "score"),
                "manual": not (latest and latest.get("replied_at")),
            }
        )

    responders.sort(key=lambda r: r.get("replied_at") or r.get("sent_at") or "", reverse=True)

    ab_decisions = storage.list_ab_decisions()
    if campaign_id and campaign_id != "all":
        ab_decisions = [d for d in ab_decisions if d.get("campaign_id") == campaign_id]

    sources = sorted(by_source.keys())

    return {
        "totals": {
            "leads": total_leads,
            "contacted": contacted,
            "email_sent": len(email_sent),
            "whatsapp_sent": len(wa_sent),
            "failed": failed,
            "open_rate": round(opened / max(len(email_sent), 1), 4),
            "click_rate": round(clicked / max(len(email_sent), 1), 4),
            "reply_rate": round(replied / max(contacted, 1), 4),
            "conversion_rate": round(converted / max(total_leads, 1), 4),
            "opened": opened,
            "clicked": clicked,
            "replied": replied,
            "converted": converted,
        },
        "funnel": funnel,
        "by_channel": {
            "email": {
                "sent": len(email_sent),
                "failed": len([r for r in email_logs if r.get("status") == "failed"]),
                "opened": opened,
                "clicked": clicked,
                "replied": len([r for r in email_logs if r.get("replied_at")]),
            },
            "whatsapp": {
                "sent": len(wa_sent),
                "failed": len([r for r in wa_logs if r.get("status") == "failed"]),
                "replied": len([r for r in wa_logs if r.get("replied_at")]),
            },
        },
        "by_source": by_source,
        "sources": sources,
        "by_score_bucket": by_bucket,
        "meta_ads": {
            "published": len([r for r in meta_logs if r.get("status") == "stub_published"]),
            "scheduled": len([r for r in meta_logs if r.get("scheduled_at") and not r.get("sent_at")]),
        },
        "ab_decisions": ab_decisions[-5:],
        "send_log": send_log,
        "responders": responders,
    }


SEND_LOG_FIELDS = (
    "id",
    "lead_id",
    "lead_name",
    "source",
    "channel",
    "status",
    "to",
    "subject",
    "sent_at",
    "opened_at",
    "clicked_at",
    "replied_at",
    "funnel_status",
    "score",
    "variant",
    "campaign_id",
)


def send_log_to_csv(send_log: list[dict]) -> str:
    import csv
    import io

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=SEND_LOG_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for row in send_log:
        writer.writerow({k: row.get(k, "") for k in SEND_LOG_FIELDS})
    return buf.getvalue()
