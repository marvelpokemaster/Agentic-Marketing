"""
src/lead_generation/outreach/email_sender.py
──────────────────────────────────────────────
Real SMTP email sending with tracking injection and optional image attachment.
"""

import os
import re
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from src.shared import storage, utm
from src.shared.config import config
from src.shared.external_api import run_with_retry
from src.shared.funnel import advance
from src.shared.image_attach import download_image
from src.shared.tracking import plain_to_html, prepare_email_body


def parse_email_content(raw: str) -> tuple[str, str]:
    """Split outreach email into (subject, body)."""
    text = (raw or "").strip()
    if not text:
        return "Hello", ""
    m = re.match(r"^Subject:\s*(.+?)(?:\n|$)", text, re.IGNORECASE)
    if m:
        subject = m.group(1).strip()
        body = text[m.end() :].strip()
        return subject or "Hello", body
    parts = text.split("\n\n", 1)
    if len(parts) == 2 and len(parts[0]) < 120 and "\n" not in parts[0]:
        return parts[0].strip(), parts[1].strip()
    return "Partnership opportunity", text


def _send_smtp(
    to: str,
    subject: str,
    body: str,
    *,
    is_html: bool,
    attachment_path: str | None = None,
    attachment_mime: str = "image/jpeg",
) -> None:
    if not config.smtp_host:
        raise RuntimeError("SMTP_HOST not configured")

    if attachment_path:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"] = config.smtp_from or config.smtp_user
        msg["To"] = to

        alt = MIMEMultipart("alternative")
        alt.attach(MIMEText(body, "html" if is_html else "plain"))
        msg.attach(alt)

        with open(attachment_path, "rb") as f:
            img = MIMEImage(f.read(), _subtype=attachment_mime.split("/")[-1])
        filename = os.path.basename(attachment_path)
        img.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(img)
    else:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = config.smtp_from or config.smtp_user
        msg["To"] = to
        msg.attach(MIMEText(body, "html" if is_html else "plain"))

    with smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=30) as server:
        if config.smtp_use_tls:
            server.starttls()
        if config.smtp_user:
            server.login(config.smtp_user, config.smtp_password)
        server.sendmail(msg["From"], [to], msg.as_string())


def execute_email_send(
    *,
    lead_id: str,
    to_email: str,
    subject: str,
    body: str,
    campaign_id: str,
    log_id: str,
    variant: str | None = None,
    lead_source: str = "",
    score: int | None = None,
    image_url: str | None = None,
    store_lead_fn=None,
) -> dict:
    """Send one email and write outreach_log. Returns log row."""

    def _apply_utm_to_body(text: str) -> str:
        url_pattern = re.compile(r"(https?://[^\s<>\"']+)")
        return url_pattern.sub(
            lambda m: utm.append_utm(m.group(1), campaign_id=campaign_id, lead_id=lead_id),
            text,
        )

    body = _apply_utm_to_body(body)
    body, is_html = prepare_email_body(body, log_id)
    if not is_html:
        body = plain_to_html(body)
        is_html = True

    attachment_path = None
    attachment_mime = "image/jpeg"
    if image_url:
        try:
            attachment_path, attachment_mime = download_image(image_url, prefix=f"lead_{lead_id}")
            if "attached" not in body.lower():
                body += "<p><em>Product image attached.</em></p>"
        except (OSError, ValueError, TimeoutError):
            attachment_path = None

    def do_send():
        _send_smtp(
            to_email,
            subject,
            body,
            is_html=is_html,
            attachment_path=attachment_path,
            attachment_mime=attachment_mime,
        )

    ok, err = run_with_retry(
        "smtp",
        do_send,
        context={"lead_id": lead_id, "log_id": log_id, "to": to_email},
    )
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat()
    status = "sent" if ok else "failed"
    row = storage.append_outreach_log(
        {
            "id": log_id,
            "lead_id": lead_id,
            "campaign_id": campaign_id,
            "channel": "email",
            "status": status,
            "variant": variant,
            "to": to_email,
            "subject": subject,
            "source": lead_source,
            "score": score,
            "image_url": image_url,
            "sent_at": now if ok else None,
            "error": err,
        }
    )
    if store_lead_fn and ok:
        store_lead_fn(lead_id, funnel_status="outreached", outreach_status="sent")
    elif store_lead_fn and not ok:
        store_lead_fn(lead_id, outreach_status="failed")
    return row


def execute_pending_email(context: dict) -> tuple[bool, str | None]:
    """Retry handler for send queue."""
    try:
        execute_email_send(**context)
        return True, None
    except Exception as exc:
        return False, str(exc)
