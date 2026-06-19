"""
src/shared/external_api.py
──────────────────────────
Rate limits, retry with backoff, and dead-letter queue for external services.
"""

import asyncio
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Callable

from src.shared import storage
from src.shared.config import config

_MAX_RETRIES = 3
_BACKOFF_BASE = 2  # seconds

# In-memory rate limit counters: service -> list of timestamps
_rate_buckets: dict[str, list[float]] = defaultdict(list)


def _rate_limits() -> dict[str, int]:
    return {
        "smtp": config.email_max_per_hour,
        "whatsapp_stub": 50,
        "meta_stub": 10,
        "serpapi": config.serpapi_rate_limit_per_min,
    }


def _hour_window() -> float:
    return time.time() - 3600


def check_rate_limit(service: str) -> bool:
    limits = _rate_limits()
    limit = limits.get(service, 100)
    now = time.time()
    bucket = _rate_buckets[service]
    _rate_buckets[service] = [t for t in bucket if t > _hour_window()]
    return len(_rate_buckets[service]) < limit


def record_rate(service: str) -> None:
    _rate_buckets[service].append(time.time())


def run_with_retry(
    service: str,
    fn: Callable[[], None],
    *,
    context: dict | None = None,
) -> tuple[bool, str | None]:
    """
    Execute fn with rate limit + exponential backoff.
    Returns (success, error_message).
    On final failure, dead-letters to send_queue.json.
    """
    if not check_rate_limit(service):
        limits = _rate_limits()
        return False, f"Rate limit exceeded for {service} (max {limits.get(service)}/hour)"

    last_err = None
    for attempt in range(_MAX_RETRIES):
        try:
            fn()
            record_rate(service)
            return True, None
        except Exception as exc:
            last_err = str(exc)
            if attempt < _MAX_RETRIES - 1:
                time.sleep(_BACKOFF_BASE ** attempt)
    storage.append_send_queue(
        {
            "service": service,
            "status": "dead_letter",
            "error": last_err,
            "context": context or {},
            "failed_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return False, last_err


async def retry_worker(interval_sec: int = 60) -> None:
    """Background task: retry queued sends that aren't dead-lettered."""
    while True:
        await asyncio.sleep(interval_sec)
        for item in storage.list_send_queue():
            if item.get("status") != "retry":
                continue
            retry_at = item.get("retry_at")
            if retry_at and retry_at > datetime.now(timezone.utc).isoformat():
                continue
            handler_name = item.get("handler")
            if handler_name == "email":
                from src.lead_generation.outreach.email_sender import execute_pending_email

                ok, err = await asyncio.to_thread(
                    execute_pending_email, item.get("context", {})
                )
                if ok:
                    storage.remove_send_queue(item["id"])
                else:
                    storage.update_send_queue(
                        item["id"],
                        attempts=item.get("attempts", 0) + 1,
                        last_error=err,
                        status="dead_letter" if item.get("attempts", 0) >= 2 else "retry",
                    )
