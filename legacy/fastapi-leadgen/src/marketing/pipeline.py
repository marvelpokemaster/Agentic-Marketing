"""
src/marketing/pipeline.py
─────────────────────────
Ad generation orchestration:

    product brief ──▶ generate_ad_copy (Gemini) ──▶ generate_ad_image (Pollinations)

Returns a single ad object: copy fields + an image preview URL.
Regenerating just calls this again (a new seed yields a new image).
"""

from src.marketing.image_generation import generate_ad_image
from src.marketing.llm import generate_ad_copy


def generate_ad(brief: dict, *, seed: int | None = None, image_prompt: str | None = None) -> dict:
    copy = generate_ad_copy(brief)
    prompt = (image_prompt or "").strip() or copy.get("image_prompt", "")
    image = generate_ad_image(prompt, seed=seed)
    return {
        "headline": copy.get("headline", ""),
        "copy": copy.get("copy", ""),
        "cta": copy.get("cta", ""),
        "design_suggestions": copy.get("design_suggestions", []),
        "image_prompt": prompt,
        "ai_generated": copy.get("ai_generated", False),
        "image_url": image["image_url"],
        "seed": image["seed"],
        "brief": brief,
    }


def regenerate_image(image_prompt: str, *, seed: int | None = None) -> dict:
    """Re-render the ad image from a user-edited prompt (no new Gemini call)."""
    image = generate_ad_image(image_prompt.strip(), seed=seed)
    return {
        "image_prompt": image_prompt.strip(),
        "image_url": image["image_url"],
        "seed": image["seed"],
    }
