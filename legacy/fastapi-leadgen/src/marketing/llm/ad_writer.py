"""
src/marketing/llm/ad_writer.py
──────────────────────────────
Use Gemini to turn a product brief into ad creative: headline, copy, CTA,
design suggestions, and an image prompt (later fed to image generation).

Falls back to a simple template if Gemini is unavailable.
"""

from src.shared.gemini import generate_json

_PROMPT = """You are a senior ad creative director. Create one ad concept.

Product: {product}
Marketing objective: {objective}
Target audience: {audience}
Tone: {tone}
Platform: {platform}
Branding notes: {branding}

Return JSON only:
{{
  "headline": "<punchy headline>",
  "copy": "<2-4 sentence ad body>",
  "cta": "<short call to action>",
  "design_suggestions": ["<3-5 concise visual/layout tips>"],
  "image_prompt": "<a long, highly detailed prompt for an AI image generator to produce a FINISHED advertisement poster/creative>"
}}

For "image_prompt" be very detailed and DO include text rendered in the image. Cover:
- the hero subject/scene and how the product is shown
- composition & layout (where things sit: top/center/bottom)
- the exact HEADLINE text to render in large bold type, in quotes
- the exact CTA text to render on a button/banner, in quotes
- optional small brand/logo text placement
- art style, color palette, lighting, mood, camera/lens, and platform aspect ratio
- typography style (e.g. modern sans-serif, elegant serif)
Write it as one rich descriptive paragraph optimized for the Flux image model."""


def _short_name(product: str) -> str:
    """A short product name from a long description (for fallback headlines)."""
    first = product.split(",")[0].split(".")[0].strip()
    words = first.split()
    return " ".join(words[:5]) if words else "our product"


def _build_image_prompt(*, product, headline, cta, audience, tone, platform, branding) -> str:
    """A detailed, text-rich advertisement poster prompt for the image model."""
    aspect = "vertical 4:5 social media poster" if platform.lower() in ("instagram", "facebook") else "advertisement poster"
    branding_line = f" Brand styling: {branding}." if branding else ""
    return (
        f"A polished, professional {tone.lower()} advertisement {aspect} for {product}, "
        f"targeted at {audience}. Hero shot of the product as the centerpiece with clean, "
        f"appealing composition and depth of field. "
        f"Render bold large headline text \"{headline}\" across the top in a modern, "
        f"high-contrast typeface. "
        f"Render a clear call-to-action button near the bottom with the text \"{cta}\". "
        f"Studio-quality lighting, rich complementary color palette, balanced negative space "
        f"for the text, crisp legible typography, sharp focus, high detail, commercial-grade "
        f"marketing creative.{branding_line}"
    )


def _fallback(brief: dict) -> dict:
    product = brief.get("product", "our product")
    short = _short_name(product)
    audience = brief.get("audience", "customers")
    tone = brief.get("tone", "Friendly")
    platform = brief.get("platform", "Generic")
    branding = brief.get("branding", "")
    headline = f"Meet {short}"
    cta = "Learn more"
    return {
        "headline": headline,
        "copy": f"{short} made for {audience}. Discover why it stands out — designed to deliver real value, every day.",
        "cta": cta,
        "design_suggestions": [
            "Hero shot of the product, centered",
            "Bold headline across the top, generous whitespace",
            "High-contrast CTA button near the bottom",
        ],
        "image_prompt": _build_image_prompt(
            product=product, headline=headline, cta=cta, audience=audience,
            tone=tone, platform=platform, branding=branding,
        ),
        "ai_generated": False,
    }


def generate_ad_copy(brief: dict) -> dict:
    result = generate_json(_PROMPT.format(
        product=brief.get("product", ""),
        objective=brief.get("objective", ""),
        audience=brief.get("audience", ""),
        tone=brief.get("tone", ""),
        platform=brief.get("platform", ""),
        branding=brief.get("branding", "") or "(none)",
    ), temperature=0.9)

    if not result or not isinstance(result, dict) or not result.get("image_prompt"):
        return _fallback(brief)

    result.setdefault("design_suggestions", [])
    if isinstance(result["design_suggestions"], str):
        result["design_suggestions"] = [result["design_suggestions"]]
    result["ai_generated"] = True  # copy + image prompt came fully from Gemini
    return result
