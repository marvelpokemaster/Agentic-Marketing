"""Gmail compose URL builder and send-to helpers."""

from urllib.parse import quote


def effective_send_to(lead) -> str | None:
    return (getattr(lead, "send_to_email", None) or lead.email or "").strip() or None


def build_gmail_compose_url(
    *,
    to_email: str,
    subject: str,
    body: str,
    public_base: str,
    attachments: list[dict] | None = None,
) -> dict:
    """Return Gmail compose URL plus attachment download links (manual attach in Gmail)."""
    attachments = attachments or []
    download_links = []
    for item in attachments:
        fid = item.get("id")
        name = item.get("filename") or "file"
        if fid:
            link = f"{public_base.rstrip('/')}/api/files/{fid}"
        elif item.get("url"):
            link = item["url"]
            name = name if name != "file" else link.split("/")[-1][:40]
        else:
            continue
        download_links.append({"id": fid, "filename": name, "url": link})

    attach_note = ""
    if download_links:
        attach_note = (
            "\n\n--- Attach these files manually in Gmail (download first) ---\n"
            + "\n".join(f"- {d['filename']}: {d['url']}" for d in download_links)
        )

    full_body = (body or "") + attach_note
    url = (
        "https://mail.google.com/mail/?view=cm&fs=1"
        f"&to={quote(to_email)}"
        f"&su={quote(subject or 'Hello')}"
        f"&body={quote(full_body)}"
    )
    return {
        "url": url,
        "to": to_email,
        "subject": subject,
        "attachments": download_links,
        "note": "Gmail cannot auto-attach files in the browser. Download attachments below and add them in compose.",
    }
