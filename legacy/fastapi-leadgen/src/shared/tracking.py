"""
src/shared/tracking.py
──────────────────────
Email open pixel + link wrapping for outreach tracking.
"""

import re
from html import escape
from urllib.parse import quote

from src.shared.config import config


def _base() -> str:
    return config.public_base_url.rstrip("/")


def inject_tracking(body: str, log_id: str, *, html: bool = False) -> str:
    pixel_url = f"{_base()}/track/open/{log_id}"
    if html or "<" in body:
        pixel = f'<img src="{pixel_url}" width="1" height="1" alt="" style="display:none" />'
        return body + pixel
    return body + f"\n\n[Track: {pixel_url}]"


def wrap_links(body: str, log_id: str, *, html: bool = False) -> str:
    if html or "<a " in body.lower():
        pattern = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)

        def repl(m):
            url = m.group(1)
            if url.startswith(f"{_base()}/track/") or url.startswith("mailto:"):
                return m.group(0)
            wrapped = f"{_base()}/track/click/{log_id}?url={quote(url, safe='')}"
            return f'href="{wrapped}"'

        return pattern.sub(repl, body)

    # Plain text: wrap bare URLs
    url_pattern = re.compile(r"(https?://[^\s<>\"]+)")

    def repl_text(m):
        url = m.group(1)
        return f"{_base()}/track/click/{log_id}?url={quote(url, safe='')}"

    return url_pattern.sub(repl_text, body)


def prepare_email_body(body: str, log_id: str) -> tuple[str, bool]:
    """Apply link wrap + pixel. Returns (body, is_html)."""
    is_html = "<" in body and ">" in body
    body = wrap_links(body, log_id, html=is_html)
    body = inject_tracking(body, log_id, html=is_html)
    return body, is_html


def plain_to_html(text: str) -> str:
    return "<pre style='font-family:sans-serif;white-space:pre-wrap'>" + escape(text) + "</pre>"
