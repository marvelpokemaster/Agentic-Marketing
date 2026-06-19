"""
Download remote images for email attachments.
"""

import os
import uuid
import urllib.error
import urllib.request

from src.shared.config import config

_ATTACH_DIR = os.path.join(config.outputs_dir, "attachments")


def download_image(url: str, *, prefix: str = "outreach") -> tuple[str, str]:
    """
    Download image to outputs/attachments. Returns (local_path, mime_type).
    """
    os.makedirs(_ATTACH_DIR, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": config.user_agent})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read(5_000_000)
        ctype = resp.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()

    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }.get(ctype, ".jpg")
    path = os.path.join(_ATTACH_DIR, f"{prefix}_{uuid.uuid4().hex[:10]}{ext}")
    with open(path, "wb") as f:
        f.write(data)
    return path, ctype
