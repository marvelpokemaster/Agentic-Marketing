"""Publishing routes — POST /publish/{platform}."""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from marketing_agent.models.content import ContentAsset
from marketing_agent.models.publishing import PublishRequest, PublishResult
from marketing_agent.services.publishing import MetaFacebookPublisher, MetaInstagramPublisher

logger = logging.getLogger(__name__)

router = APIRouter()


class PublishBody(BaseModel):
    """Request body for the publish endpoint."""
    platform: str
    headline: str = ""
    body: str = ""
    hashtags: list[str] = []
    cta: str = ""
    creative_prompt: str = ""
    creative_url: Optional[str] = None
    campaign_id: str = ""
    scheduled_time: Optional[str] = None


_publishers = {
    "facebook": MetaFacebookPublisher,
    "instagram": MetaInstagramPublisher,
}


@router.post("/{platform}")
async def publish_asset(platform: str, req: PublishBody) -> dict:
    """Publish a single asset to the specified platform."""
    if platform not in _publishers:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platform: {platform}. Supported: {list(_publishers.keys())}",
        )

    asset = ContentAsset(
        campaign_id=req.campaign_id,
        platform=platform,
        headline=req.headline,
        body=req.body,
        hashtags=req.hashtags,
        cta=req.cta,
        creative_prompt=req.creative_prompt,
        creative_url=req.creative_url,
    )

    publisher = _publishers[platform]()
    publish_request = PublishRequest(asset=asset, scheduled_time=req.scheduled_time)

    try:
        result: PublishResult = await publisher.publish(publish_request)
    except (RuntimeError, ValueError) as exc:
        logger.error("[publish] %s failed: %s", platform, exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "external_id": result.external_id,
        "platform": result.platform,
        "scheduled": result.scheduled,
    }


@router.get("/status")
async def publish_status() -> dict:
    """Check whether Meta publishing credentials are configured."""
    from marketing_agent.configs.settings import get_settings
    s = get_settings()
    has_fb = bool(s.meta_access_token and s.meta_page_id)
    has_ig = bool((s.instagram_access_token or s.meta_access_token) and s.meta_ig_user_id)
    return {
        "configured": has_fb or has_ig,
        "facebook": has_fb,
        "instagram": has_ig,
    }
