"""Decision and policy capabilities for the additive Autopilot workflow."""

from marketing_agent.capabilities.base import Capability
from marketing_agent.capabilities.publishing import PublishingCapability
from marketing_agent.configs.settings import get_settings
from marketing_agent.state import CampaignState


class AutopilotResearchSelectionCapability(Capability):
    """Select the strongest configured research source without changing defaults."""

    name = "autopilot_research_selection"

    async def _execute(self, state: CampaignState) -> CampaignState:
        if state.scrapers:
            state.add_decision("research_source", "User selected scraper sources", scrapers=state.scrapers)
            return state
        settings = get_settings()
        if settings.has_bright_data_studio:
            state.scrapers = ["bright_data_studio"]
            reason = "Bright Data Studio collector is configured"
        elif settings.has_serpapi:
            state.scrapers = ["serpapi_google"]
            reason = "SerpApi is configured"
        else:
            state.scrapers = ["google_maps"]
            reason = "No managed research provider is configured"
        state.add_decision("research_source", reason, scrapers=state.scrapers)
        return state


class AutopilotStrategyCapability(Capability):
    """Make budget and autonomy choices visible before content is generated."""

    name = "autopilot_strategy"

    async def _execute(self, state: CampaignState) -> CampaignState:
        platforms = state.allowed_platforms or state.platforms or ["instagram", "facebook"]
        state.platforms = list(dict.fromkeys(platforms))
        state.journey = [
            {"step": "research", "status": "completed", "owner": "research_agent"},
            {"step": "strategy", "status": "completed", "owner": "strategy_agent"},
            {"step": "create", "status": "pending", "owner": "content_agent"},
            {"step": "publish", "status": "pending", "owner": "publishing_agent"},
            {"step": "measure", "status": "pending", "owner": "analytics_agent"},
        ]
        state.add_decision(
            "channel_mix",
            "Selected allowed platforms for the campaign",
            platforms=state.platforms,
            goal=state.goal,
        )

        if state.monthly_budget <= 0:
            state.paid_campaign_plan = {
                "status": "not_requested",
                "reason": "Monthly budget is zero; Autopilot will run organic work only.",
            }
            state.add_decision("budget_route", "No budget: organic-only execution", monthly_budget=0)
            return state

        daily_cap = state.daily_spend_cap or round(state.monthly_budget / 30, 2)
        status = "ready_for_execution" if state.approval_mode == "fully_automatic" else "awaiting_approval"
        state.paid_campaign_plan = {
            "status": status,
            "monthly_budget": state.monthly_budget,
            "daily_spend_cap": daily_cap,
            "goal": state.goal,
            "platforms": state.platforms,
            "note": (
                "A paid-media connector is required to create spend. This plan never charges "
                "an account by itself."
            ),
        }
        state.add_decision(
            "budget_route",
            "Budget available: prepared a capped paid-media plan",
            monthly_budget=state.monthly_budget,
            daily_spend_cap=daily_cap,
            approval_mode=state.approval_mode,
        )
        return state


class AutopilotPublishingCapability(PublishingCapability):
    """Publish only when Autopilot is explicitly authorized to do so."""

    name = "autopilot_publishing"

    async def _execute(self, state: CampaignState) -> CampaignState:
        publish_step = next((item for item in state.journey if item["step"] == "publish"), None)
        if not state.autopublish:
            if publish_step:
                publish_step["status"] = "awaiting_approval"
            state.add_decision("publishing", "Autopublish is disabled; assets are ready for review")
            state.add_log("autopilot: publishing skipped because autopublish is disabled")
            return state

        allowed = set(state.allowed_platforms or state.platforms)
        original_assets = state.assets
        state.assets = [asset for asset in original_assets if asset.platform in allowed]
        try:
            result = await super()._execute(state)
        finally:
            state.assets = original_assets
        if publish_step:
            publish_step["status"] = "completed"
        state.add_decision("publishing", "Published assets to allowed connected platforms", platforms=sorted(allowed))
        return result


class AutopilotCompletionCapability(Capability):
    """Close the current run while leaving measurement ready for the next cycle."""

    name = "autopilot_completion"

    async def _execute(self, state: CampaignState) -> CampaignState:
        for item in state.journey:
            if item["step"] == "create":
                item["status"] = "completed" if state.assets else "skipped"
            elif item["step"] == "measure":
                item["status"] = "ready_for_next_cycle"
        state.add_decision("next_action", "Campaign is ready for measurement and the next Autopilot cycle")
        return state
