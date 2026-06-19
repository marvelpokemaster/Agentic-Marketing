"""
src/shared/agentic.py
─────────────────────
Small deterministic "agent brain" for the internship MVP.

It does not send or mutate data. It explains the intended campaign steps and
turns current lead/analytics state into next-action recommendations.
"""

from collections import Counter
from typing import Any

from src.shared.models import Lead, SearchCriteria


def _lead_get(lead: Lead | dict, key: str, default: Any = None) -> Any:
    return lead.get(key, default) if isinstance(lead, dict) else getattr(lead, key, default)


def _top_source(summary: dict) -> tuple[str | None, dict]:
    sources = summary.get("by_source") or {}
    if not sources:
        return None, {}
    ranked = sorted(
        sources.items(),
        key=lambda item: (item[1].get("reply_rate", 0), item[1].get("sent", 0), item[1].get("leads", 0)),
        reverse=True,
    )
    return ranked[0]


def build_campaign_plan(
    *,
    brief: str,
    criteria: SearchCriteria | dict | None,
    scrapers: list[str],
    max_results_per_target: int,
) -> dict:
    """Create a visible plan before the user runs scraping."""
    crit = SearchCriteria.from_dict(criteria) if isinstance(criteria, dict) else criteria
    targets = (crit.search_terms() if crit else []) or ["relevant local businesses"]
    location = (crit.location if crit else "") or "the requested market"
    product = (crit.product if crit else "") or "your offer"
    company = (crit.company_name if crit else "") or "your business"

    steps = [
        {
            "title": "Understand the campaign goal",
            "detail": f"Position {company} and {product} for {', '.join(targets[:3])}.",
            "status": "ready" if brief.strip() else "needs_input",
        },
        {
            "title": "Search the selected sources",
            "detail": f"Use {', '.join(scrapers) if scrapers else 'selected lead sources'} in {location}, up to {max_results_per_target} results per target.",
            "status": "ready" if scrapers else "needs_input",
        },
        {
            "title": "Score and explain fit",
            "detail": "Rank leads by fit, contactability, website signals, missing data, and AI rationale.",
            "status": "ready",
        },
        {
            "title": "Triage into working memory",
            "detail": "Keep promising companies in Saved, discard weak matches, and clear temporary inbox results.",
            "status": "ready",
        },
        {
            "title": "Draft approved outreach",
            "detail": "Generate personalized email and WhatsApp drafts, then wait for human approval before sending.",
            "status": "guarded",
        },
        {
            "title": "Track and recommend next action",
            "detail": "Use source, score, open, reply, and conversion data to recommend the next campaign move.",
            "status": "learning",
        },
    ]

    return {
        "goal": f"Find and prioritize {', '.join(targets[:3])} for {company}.",
        "summary": "Human-in-the-loop agent plan: discover leads, score fit, draft outreach, require approval, then learn from responses.",
        "steps": steps,
        "guardrails": [
            "No outreach is sent without approval.",
            "WhatsApp requires opt-in confirmation.",
            "Discarded leads are hidden from the main workflow.",
        ],
    }


def build_agent_checklist(*, leads: list[Lead], summary: dict) -> list[dict]:
    counts = Counter((_lead_get(lead, "list_status") or "inbox") for lead in leads)
    totals = summary.get("totals") or {}
    has_scores = any(_lead_get(lead, "score") is not None for lead in leads)
    has_saved = counts.get("stored", 0) > 0
    has_outreach = any((_lead_get(lead, "outreach") or {}).get("email") for lead in leads)

    return [
        {
            "label": "Brief understood",
            "done": bool(leads) or bool(summary.get("campaign_id")),
            "hint": "Campaign criteria exists or a run has started.",
        },
        {"label": "Leads scored", "done": has_scores, "hint": "AI fit score and explanation are present."},
        {"label": "Leads triaged", "done": has_saved, "hint": f"{counts.get('stored', 0)} saved for outreach."},
        {"label": "Outreach drafted", "done": has_outreach, "hint": "At least one saved lead has generated copy."},
        {"label": "Sends tracked", "done": (totals.get("contacted") or 0) > 0, "hint": f"{totals.get('contacted', 0)} sends logged."},
        {"label": "Feedback captured", "done": (totals.get("replied") or 0) > 0, "hint": f"{totals.get('replied', 0)} replies recorded."},
    ]


def build_recommendations(*, leads: list[Lead], summary: dict) -> dict:
    """Recommend analyst next-actions from current campaign state."""
    totals = summary.get("totals") or {}
    by_source = summary.get("by_source") or {}
    send_log = summary.get("send_log") or []
    counts = Counter((_lead_get(lead, "list_status") or "inbox") for lead in leads)

    saved = [lead for lead in leads if _lead_get(lead, "list_status") == "stored"]
    inbox = [lead for lead in leads if _lead_get(lead, "list_status") == "inbox"]
    high_score_saved = [lead for lead in saved if (_lead_get(lead, "score") or 0) >= 70]
    saved_without_outreach = [
        lead for lead in saved if not ((_lead_get(lead, "outreach") or {}).get("email"))
    ]
    ready_unsent = [
        lead
        for lead in saved
        if ((_lead_get(lead, "outreach") or {}).get("email"))
        and _lead_get(lead, "outreach_status") in (None, "draft", "failed")
    ]
    failed_sends = [row for row in send_log if row.get("status") == "failed"]
    opened_not_replied = [
        row for row in send_log if row.get("opened_at") and not row.get("replied_at") and row.get("channel") == "email"
    ]
    top_source, top_source_data = _top_source(summary)

    recommendations: list[dict] = []

    if inbox and not saved:
        recommendations.append(
            {
                "priority": "high",
                "action": "Triage new inbox leads",
                "reason": f"{len(inbox)} fresh leads are waiting, but none are saved for outreach yet.",
                "next_step": "Open the Inbox, save strong-fit companies, and discard weak matches.",
                "metric": f"{len(inbox)} inbox",
            }
        )

    if high_score_saved:
        recommendations.append(
            {
                "priority": "high",
                "action": "Prioritize high-fit saved leads",
                "reason": f"{len(high_score_saved)} saved leads have score 70+ and should get outreach first.",
                "next_step": "Generate outreach for these leads, review the drafts, then queue approved sends.",
                "metric": f"{len(high_score_saved)} high-fit",
            }
        )

    if saved_without_outreach:
        recommendations.append(
            {
                "priority": "high",
                "action": "Generate outreach drafts",
                "reason": f"{len(saved_without_outreach)} saved leads do not have email copy yet.",
                "next_step": "Open Saved leads and generate personalized outreach for the best matches.",
                "metric": f"{len(saved_without_outreach)} missing drafts",
            }
        )

    if ready_unsent:
        recommendations.append(
            {
                "priority": "medium",
                "action": "Queue reviewed outreach",
                "reason": f"{len(ready_unsent)} saved leads already have drafts but are not sent.",
                "next_step": "Queue SMTP sends and approve them from the Pending drawer after review.",
                "metric": f"{len(ready_unsent)} ready",
            }
        )

    if opened_not_replied:
        recommendations.append(
            {
                "priority": "medium",
                "action": "Follow up on warm opens",
                "reason": f"{len(opened_not_replied)} emails were opened but have no recorded reply.",
                "next_step": "Send a short follow-up or mark replies manually if they responded outside tracking.",
                "metric": f"{len(opened_not_replied)} warm opens",
            }
        )

    if failed_sends:
        recommendations.append(
            {
                "priority": "high",
                "action": "Fix failed sends",
                "reason": f"{len(failed_sends)} outreach attempts failed, which can hide good leads from the funnel.",
                "next_step": "Check SMTP/contact data, update recipients, then retry the affected leads.",
                "metric": f"{len(failed_sends)} failed",
            }
        )

    if top_source and (top_source_data.get("sent") or top_source_data.get("leads")):
        recommendations.append(
            {
                "priority": "medium",
                "action": f"Lean into {top_source}",
                "reason": f"{top_source} is currently the strongest source by reply rate, send volume, or lead count.",
                "next_step": "Use this source first in the next search and compare it against other channels.",
                "metric": f"{int((top_source_data.get('reply_rate') or 0) * 100)}% reply",
            }
        )

    if totals.get("contacted", 0) >= 3 and totals.get("reply_rate", 0) < 0.05:
        recommendations.append(
            {
                "priority": "medium",
                "action": "Revise the outreach angle",
                "reason": "Reply rate is low after multiple sends, so the current message may not be strong enough.",
                "next_step": "Regenerate copy with a sharper offer, clearer CTA, and more specific lead context.",
                "metric": f"{int((totals.get('reply_rate') or 0) * 100)}% reply",
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "priority": "low",
                "action": "Start with a small approved batch",
                "reason": "There is not enough campaign feedback yet for strong optimization.",
                "next_step": "Save 3-5 good leads, generate outreach, approve sends, then revisit recommendations.",
                "metric": "needs data",
            }
        )

    return {
        "checklist": build_agent_checklist(leads=leads, summary=summary),
        "recommendations": recommendations[:6],
        "state": {
            "inbox": counts.get("inbox", 0),
            "saved": counts.get("stored", 0),
            "discarded": counts.get("discarded", 0),
            "contacted": totals.get("contacted", 0),
            "replied": totals.get("replied", 0),
            "converted": totals.get("converted", 0),
            "top_source": top_source,
        },
    }
