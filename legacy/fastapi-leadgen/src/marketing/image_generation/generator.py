"""
src/marketing/image_generation/generator.py
────────────────────────────────────────────
Generate an advertisement preview image from a text prompt using
Pollinations.ai (free, no API key). Returns a public URL the browser can
render directly in an <img> tag — ideal for instant preview/regenerate.
"""

import uuid
from urllib.parse import quote, urlencode

from src.shared.config import config


def build_image_url(prompt: str, *, seed: int | None = None) -> str:
    params = {
        "model": config.pollinations_model,
        "width": config.pollinations_width,
        "height": config.pollinations_height,
        "nologo": "true",
    }
    if seed is not None:
        params["seed"] = seed
    return f"{config.pollinations_base_url}/{quote(prompt)}?{urlencode(params)}"


def generate_ad_image(prompt: str, *, seed: int | None = None) -> dict:
    """Return a renderable image URL for the given prompt."""
    seed = seed if seed is not None else uuid.uuid4().int % (2**31)
    return {
        "image_url": build_image_url(prompt, seed=seed),
        "prompt": prompt,
        "seed": seed,
        "width": config.pollinations_width,
        "height": config.pollinations_height,
    }
