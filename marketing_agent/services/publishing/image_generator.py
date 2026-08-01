"""
Generate an advertisement preview image from a text prompt using
Pollinations.ai (free, no API key).
"""

import uuid
from urllib.parse import quote, urlencode

from marketing_agent.configs.settings import get_settings


import asyncio
import logging
import uuid
from urllib.parse import quote, urlencode

import httpx

from marketing_agent.configs.settings import get_settings

logger = logging.getLogger(__name__)


def build_image_url(prompt: str, *, seed: int | None = None, width: int | None = None, height: int | None = None) -> str:
    settings = get_settings()
    w = width or settings.pollinations_width
    h = height or settings.pollinations_height
    params = {
        "model": settings.pollinations_model,
        "width": w,
        "height": h,
        "nologo": "true",
    }
    if seed is not None:
        params["seed"] = seed
    return f"{settings.pollinations_base_url}/{quote(prompt[:480])}?{urlencode(params)}"


def generate_ad_image(prompt: str, *, seed: int | None = None, width: int | None = None, height: int | None = None) -> dict:
    """Return a renderable image URL for the given prompt."""
    settings = get_settings()
    seed = seed if seed is not None else uuid.uuid4().int % (2**31)
    w = width or settings.pollinations_width
    h = height or settings.pollinations_height
    return {
        "image_url": build_image_url(prompt, seed=seed, width=w, height=h),
        "prompt": prompt,
        "seed": seed,
        "width": w,
        "height": h,
    }


async def verify_and_prepare_image(url: str, retries: int = 3, backoff_sec: float = 2.0) -> str:
    """Verify Pollinations image availability via bounded retries/backoff."""
    for attempt in range(1, retries + 1):
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    content_type = res.headers.get("content-type", "")
                    if "image" in content_type or "octet-stream" in content_type or len(res.content) > 500:
                        logger.info("[image_generator] verified image availability (bytes=%d)", len(res.content))
                        return url
        except Exception as exc:
            logger.warning("[image_generator] readiness check attempt %d/%d failed: %s", attempt, retries, exc)

        if attempt < retries:
            await asyncio.sleep(backoff_sec)

    raise RuntimeError("Generated image is unavailable or non-responsive from Pollinations provider after retries.")
