"""
src/shared/models/lead.py
─────────────────────────
The unified lead object returned by every scraper and enriched by the
scoring and outreach stages.
"""

import uuid
from dataclasses import dataclass, field, asdict


@dataclass
class Lead:
    name: str
    category: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    send_to_email: str | None = None  # override recipient for outreach / Gmail
    rating: float | None = None
    reviews: int | None = None
    source: str = "unknown"
    metadata: dict = field(default_factory=dict)

    # ── Added by AI stages ─────────────────────────────────────────────────
    score: int | None = None
    score_reason: str | None = None
    score_breakdown: dict = field(default_factory=dict)  # factors, missing, strengths
    priority: str | None = None
    outreach: dict = field(default_factory=dict)   # {"email": ..., "whatsapp": ...}

    # ── Phase 2/3: campaign + funnel ─────────────────────────────────────
    campaign_id: str | None = None
    funnel_status: str = "scraped"       # scraped | scored | outreached | opened | replied | converted
    whatsapp_opt_in: bool = False
    outreach_status: str = "draft"       # draft | pending_approval | sent | failed

    # ── Lead list triage ───────────────────────────────────────────────────
    list_status: str = "inbox"           # inbox | stored | discarded | cleared

    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "Lead":
        allowed = {f for f in cls.__dataclass_fields__}
        return cls(**{k: v for k, v in (data or {}).items() if k in allowed})
