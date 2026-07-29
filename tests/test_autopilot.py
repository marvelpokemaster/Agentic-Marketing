import unittest

from marketing_agent.capabilities.autopilot import (
    AutopilotPublishingCapability,
    AutopilotStrategyCapability,
)
from marketing_agent.capabilities.creative import CreativeCapability
from marketing_agent.models.content import ContentAsset
from marketing_agent.services.scraper.bright_data_studio import _row_to_lead
from marketing_agent.state import CampaignState


class AutopilotTests(unittest.IsolatedAsyncioTestCase):
    async def test_zero_budget_creates_organic_only_plan(self):
        state = CampaignState(platforms=["instagram"], monthly_budget=0)

        result = await AutopilotStrategyCapability().execute(state)

        self.assertEqual(result.paid_campaign_plan["status"], "not_requested")
        self.assertEqual(result.platforms, ["instagram"])
        self.assertTrue(any(item["decision"] == "budget_route" for item in result.decisions))

    async def test_paid_budget_is_capped_and_never_charged(self):
        state = CampaignState(
            platforms=["facebook"],
            monthly_budget=3000,
            daily_spend_cap=120,
            approval_mode="approve_spend",
        )

        result = await AutopilotStrategyCapability().execute(state)

        self.assertEqual(result.paid_campaign_plan["status"], "awaiting_approval")
        self.assertEqual(result.paid_campaign_plan["daily_spend_cap"], 120)
        self.assertIn("never charges", result.paid_campaign_plan["note"])

    async def test_autopublish_disabled_skips_publishers(self):
        state = CampaignState(autopublish=False)
        state.journey = [{"step": "publish", "status": "pending", "owner": "publishing_agent"}]

        result = await AutopilotPublishingCapability({}).execute(state)

        self.assertEqual(result.publish_results, [])
        self.assertEqual(result.journey[0]["status"], "awaiting_approval")

    async def test_creative_capability_attaches_an_image_url(self):
        state = CampaignState(product_name="Northstar Coffee")
        state.assets = [ContentAsset(campaign_id=state.campaign_id, platform="instagram", creative_prompt="Coffee launch")]

        result = await CreativeCapability().execute(state)

        self.assertIn("image.pollinations.ai", result.assets[0].creative_url or "")

    def test_bright_data_row_is_normalized_to_lead(self):
        lead = _row_to_lead(
            {
                "business_name": "Northstar Coffee",
                "full_address": "Bengaluru",
                "phone_number": "+91 98765 43210",
                "website_url": "northstar.example",
                "reviews_rating": "4.6",
            }
        )

        self.assertIsNotNone(lead)
        assert lead is not None
        self.assertEqual(lead.name, "Northstar Coffee")
        self.assertEqual(lead.address, "Bengaluru")
        self.assertEqual(lead.rating, 4.6)
        self.assertEqual(lead.source, "bright_data_studio")
