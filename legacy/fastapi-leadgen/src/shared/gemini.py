"""
src/shared/gemini.py
────────────────────
Thin Gemini (Google Generative Language API) client.

The single integration point for every LLM call in the app: requirement
extraction, lead scoring, outreach copy, and ad copy.

Uses only the standard library (urllib) so there is no extra dependency.
Every helper degrades gracefully: if no API key is set or the call fails,
`generate_json` / `generate_text` return None and callers fall back to
deterministic logic.
"""

import json
import time
import urllib.error
import urllib.request

from src.shared.config import config

_MAX_RETRIES = 2       # one quick retry for transient bursts, then fall back
_BACKOFF_SEC = 3       # base backoff for the single retry


def _endpoint() -> str:
    return (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{config.gemini_model}:generateContent?key={config.gemini_api_key}"
    )


def _call(prompt: str, *, json_mode: bool, temperature: float) -> str | None:
    if not config.has_gemini:
        return None

    generation_config: dict = {"temperature": temperature}
    if json_mode:
        generation_config["responseMimeType"] = "application/json"

    payload = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": generation_config,
        }
    ).encode()

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(
                _endpoint(),
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                body = json.loads(resp.read())
            return body["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as exc:
            err_body = ""
            try:
                err_body = exc.read().decode()[:500]
            except Exception:
                pass
            if exc.code in (429, 500, 503) and attempt < _MAX_RETRIES:
                wait = _BACKOFF_SEC * attempt
                print(f"[Gemini] {exc.code} (attempt {attempt}/{_MAX_RETRIES}) — retrying in {wait}s")
                time.sleep(wait)
                continue
            print(f"[Gemini] call failed: HTTP {exc.code}")
            if exc.code == 429 and "quota" in err_body.lower():
                print(
                    f"[Gemini] Free-tier quota exhausted for model '{config.gemini_model}'. "
                    "Try GEMINI_MODEL=gemini-2.5-flash in .env or wait for quota reset."
                )
            return None
        except (urllib.error.URLError, KeyError, IndexError, ValueError, TimeoutError) as exc:
            print(f"[Gemini] call failed: {exc}")
            return None
    return None


def generate_text(prompt: str, *, temperature: float = 0.7) -> str | None:
    """Return free-form text, or None if Gemini is unavailable."""
    return _call(prompt, json_mode=False, temperature=temperature)


def generate_json(prompt: str, *, temperature: float = 0.2) -> dict | list | None:
    """Return parsed JSON from Gemini, or None on any failure."""
    text = _call(prompt, json_mode=True, temperature=temperature)
    if not text:
        return None
    cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print("[Gemini] response was not valid JSON")
        return None
