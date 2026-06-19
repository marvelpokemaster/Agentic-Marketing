"""Lead outreach file attachments on disk."""

import os
import uuid

from src.shared.config import config

_UPLOAD_ROOT = os.path.join(config.outputs_dir, "uploads")
_FILE_INDEX: dict[str, dict] = {}


def _index_path() -> str:
    return os.path.join(_UPLOAD_ROOT, "index.json")


def _load_index() -> dict:
    global _FILE_INDEX
    if _FILE_INDEX:
        return _FILE_INDEX
    path = _index_path()
    if os.path.exists(path):
        import json

        try:
            with open(path) as f:
                _FILE_INDEX = json.load(f)
        except (json.JSONDecodeError, OSError):
            _FILE_INDEX = {}
    return _FILE_INDEX


def _save_index() -> None:
    import json

    os.makedirs(_UPLOAD_ROOT, exist_ok=True)
    with open(_index_path(), "w") as f:
        json.dump(_FILE_INDEX, f, indent=2)


def lead_upload_dir(lead_id: str) -> str:
    path = os.path.join(_UPLOAD_ROOT, lead_id)
    os.makedirs(path, exist_ok=True)
    return path


def save_upload(lead_id: str, filename: str, data: bytes) -> dict:
    _load_index()
    fid = uuid.uuid4().hex[:12]
    safe_name = os.path.basename(filename.replace("\\", "/")) or "file"
    path = os.path.join(lead_upload_dir(lead_id), f"{fid}_{safe_name}")
    with open(path, "wb") as f:
        f.write(data)
    row = {
        "id": fid,
        "lead_id": lead_id,
        "filename": safe_name,
        "path": path,
        "kind": "file",
        "size": len(data),
    }
    _FILE_INDEX[fid] = row
    _save_index()
    return row


def add_url_attachment(lead_id: str, url: str, filename: str | None = None) -> dict:
    _load_index()
    fid = uuid.uuid4().hex[:12]
    name = filename or url.split("/")[-1].split("?")[0] or "linked-file"
    row = {
        "id": fid,
        "lead_id": lead_id,
        "filename": name,
        "url": url,
        "kind": "url",
    }
    _FILE_INDEX[fid] = row
    _save_index()
    return row


def get_file(file_id: str) -> dict | None:
    return _load_index().get(file_id)


def delete_file(file_id: str) -> bool:
    _load_index()
    row = _FILE_INDEX.pop(file_id, None)
    if not row:
        return False
    path = row.get("path")
    if path and os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            pass
    _save_index()
    return True


def list_for_lead(lead_id: str) -> list[dict]:
    return [v for v in _load_index().values() if v.get("lead_id") == lead_id]
