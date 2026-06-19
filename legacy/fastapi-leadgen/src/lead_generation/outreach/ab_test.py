"""
src/lead_generation/outreach/ab_test.py
───────────────────────────────────────
A/B subject-line variants for batch email sends.
"""

import json

from src.shared import storage
from src.shared.config import config
from src.shared.gemini import generate_json


def generate_subject_variants(base_subject: str, product: str = "") -> tuple[str, str]:
    prompt = f"""Generate two different email subject lines for outreach.
Product/context: {product or base_subject}
Base subject: {base_subject}

Return JSON: {{"variant_a": "...", "variant_b": "..."}}
Keep each under 80 characters. Make them distinct approaches."""
    data = generate_json(prompt, temperature=0.8)
    if data and data.get("variant_a") and data.get("variant_b"):
        return data["variant_a"], data["variant_b"]
    return (
        f"{base_subject} — quick question",
        f"Partnership idea: {product or base_subject}"[:80],
    )


def assign_variant(index: int, winner: str | None = None) -> str:
    if winner:
        return winner
    return "A" if index % 2 == 0 else "B"


def pick_winner(campaign_id: str, min_sends: int | None = None) -> str | None:
    """Compare open rates for variants A/B; return winner if enough sends."""
    min_sends = min_sends or config.ab_min_sends
    logs = [r for r in storage.list_outreach_log() if r.get("campaign_id") == campaign_id and r.get("channel") == "email"]
    stats = {"A": {"sent": 0, "opened": 0}, "B": {"sent": 0, "opened": 0}}
    for r in logs:
        v = r.get("variant")
        if v not in stats:
            continue
        if r.get("status") == "sent":
            stats[v]["sent"] += 1
        if r.get("opened_at"):
            stats[v]["opened"] += 1
    if stats["A"]["sent"] < min_sends or stats["B"]["sent"] < min_sends:
        return None
    rate_a = stats["A"]["opened"] / max(stats["A"]["sent"], 1)
    rate_b = stats["B"]["opened"] / max(stats["B"]["sent"], 1)
    winner = "A" if rate_a >= rate_b else "B"
    storage.append_ab_decision(
        {
            "campaign_id": campaign_id,
            "variant_a_rate": round(rate_a, 4),
            "variant_b_rate": round(rate_b, 4),
            "winner": winner,
            "stats": stats,
            "reason": f"variant {winner}: {max(rate_a, rate_b):.0%} open vs {min(rate_a, rate_b):.0%}",
        }
    )
    return winner


def get_active_winner(campaign_id: str) -> str | None:
    decisions = [d for d in storage.list_ab_decisions() if d.get("campaign_id") == campaign_id]
    if decisions:
        return decisions[-1].get("winner")
    return pick_winner(campaign_id)
