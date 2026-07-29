"""Attach a renderable Pollinations creative to each generated content asset."""

from marketing_agent.capabilities.base import Capability
from marketing_agent.services.publishing.image_generator import generate_ad_image
from marketing_agent.state import CampaignState


class CreativeCapability(Capability):
    name = "creative"

    async def _execute(self, state: CampaignState) -> CampaignState:
        for asset in state.assets:
            if asset.creative_url:
                continue
            prompt = asset.creative_prompt or f"Marketing image for {state.product_name}"
            asset.creative_url = generate_ad_image(prompt)["image_url"]
        state.add_log(f"creative: attached images to {len(state.assets)} asset(s)")
        return state
