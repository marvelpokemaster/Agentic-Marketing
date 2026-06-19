"""
src/shared/storage.py
─────────────────────
JSON-backed persistence for campaigns, outreach logs, pending sends, and retry queue.
"""

import json
import os
import re
import uuid
from datetime import datetime, timezone

from src.shared.config import config

_CAMPAIGNS = os.path.join(config.outputs_dir, "campaigns.json")
_OUTREACH_LOG = os.path.join(config.outputs_dir, "outreach_log.json")
_PENDING_SENDS = os.path.join(config.outputs_dir, "pending_sends.json")
_SEND_QUEUE = os.path.join(config.outputs_dir, "send_queue.json")
_AB_DECISIONS = os.path.join(config.outputs_dir, "ab_decisions.json")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load(path: str) -> list[dict]:
    if os.path.exists(path):
        try:
            with open(path) as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return []
    return []


def _save(path: str, rows: list[dict]) -> None:
    with open(path, "w") as f:
        json.dump(rows, f, indent=2)


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "campaign").lower()).strip("-")
    return s[:40] or "campaign"


# ── Campaigns ──────────────────────────────────────────────────────────────
def list_campaigns() -> list[dict]:
    return _load(_CAMPAIGNS)


def get_campaign(campaign_id: str) -> dict | None:
    return next((c for c in list_campaigns() if c["id"] == campaign_id), None)


def create_campaign(*, name: str, brief: str, criteria: dict | None = None) -> dict:
    cid = uuid.uuid4().hex[:12]
    row = {
        "id": cid,
        "name": name or "Campaign",
        "brief": brief,
        "criteria": criteria,
        "utm_campaign": f"{_slug(name)}-{cid[:6]}",
        "created_at": _now(),
    }
    rows = list_campaigns()
    rows.append(row)
    _save(_CAMPAIGNS, rows)
    return row


def get_or_create_campaign(*, brief: str, criteria: dict | None = None) -> dict:
    """Reuse the latest campaign with the same brief, or create one."""
    rows = list_campaigns()
    for c in reversed(rows):
        if c.get("brief") == brief:
            return c
    name = (criteria or {}).get("company_name") or brief[:60] or "Campaign"
    return create_campaign(name=name, brief=brief, criteria=criteria)


# ── Outreach log ───────────────────────────────────────────────────────────
def list_outreach_log() -> list[dict]:
    return _load(_OUTREACH_LOG)


def get_outreach_log(log_id: str) -> dict | None:
    return next((r for r in list_outreach_log() if r["id"] == log_id), None)


def append_outreach_log(row: dict) -> dict:
    rows = list_outreach_log()
    if "id" not in row:
        row["id"] = uuid.uuid4().hex[:12]
    if "created_at" not in row:
        row["created_at"] = _now()
    rows.append(row)
    _save(_OUTREACH_LOG, rows)
    return row


def update_outreach_log(log_id: str, **fields) -> dict | None:
    rows = list_outreach_log()
    for r in rows:
        if r["id"] == log_id:
            r.update(fields)
            _save(_OUTREACH_LOG, rows)
            return r
    return None


# ── Pending sends (approval queue) ─────────────────────────────────────────
def list_pending_sends(status: str | None = "pending") -> list[dict]:
    rows = _load(_PENDING_SENDS)
    if status:
        return [r for r in rows if r.get("status") == status]
    return rows


def get_pending_send(send_id: str) -> dict | None:
    return next((r for r in _load(_PENDING_SENDS) if r["id"] == send_id), None)


def append_pending_send(row: dict) -> dict:
    rows = _load(_PENDING_SENDS)
    if "id" not in row:
        row["id"] = uuid.uuid4().hex[:12]
    row.setdefault("status", "pending")
    row.setdefault("created_at", _now())
    rows.append(row)
    _save(_PENDING_SENDS, rows)
    return row


def update_pending_send(send_id: str, **fields) -> dict | None:
    rows = _load(_PENDING_SENDS)
    for r in rows:
        if r["id"] == send_id:
            r.update(fields)
            _save(_PENDING_SENDS, rows)
            return r
    return None


# ── Send retry queue ───────────────────────────────────────────────────────
def list_send_queue() -> list[dict]:
    return _load(_SEND_QUEUE)


def append_send_queue(row: dict) -> dict:
    rows = list_send_queue()
    if "id" not in row:
        row["id"] = uuid.uuid4().hex[:12]
    row.setdefault("created_at", _now())
    rows.append(row)
    _save(_SEND_QUEUE, rows)
    return row


def remove_send_queue(item_id: str) -> None:
    rows = [r for r in list_send_queue() if r["id"] != item_id]
    _save(_SEND_QUEUE, rows)


def update_send_queue(item_id: str, **fields) -> dict | None:
    rows = list_send_queue()
    for r in rows:
        if r["id"] == item_id:
            r.update(fields)
            _save(_SEND_QUEUE, rows)
            return r
    return None


# ── A/B decisions ──────────────────────────────────────────────────────────
def list_ab_decisions() -> list[dict]:
    return _load(_AB_DECISIONS)


def append_ab_decision(row: dict) -> dict:
    rows = list_ab_decisions()
    row.setdefault("id", uuid.uuid4().hex[:12])
    row.setdefault("created_at", _now())
    rows.append(row)
    _save(_AB_DECISIONS, rows)
    return row
