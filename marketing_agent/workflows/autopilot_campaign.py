"""AutopilotCampaignWorkflow — research → decide → create → optional publish."""

from marketing_agent.capabilities.autopilot import (
    AutopilotPublishingCapability,
    AutopilotCompletionCapability,
    AutopilotResearchSelectionCapability,
    AutopilotStrategyCapability,
)
from marketing_agent.capabilities.content import ContentCapability
from marketing_agent.capabilities.creative import CreativeCapability
from marketing_agent.capabilities.planning import PlanningCapability
from marketing_agent.capabilities.research import ResearchCapability
from marketing_agent.services.llm.gemini import GeminiLLMService
from marketing_agent.services.publishing.meta_facebook import MetaFacebookPublisher
from marketing_agent.services.publishing.meta_instagram import MetaInstagramPublisher
from marketing_agent.workflows.base import Workflow


class AutopilotCampaignWorkflow(Workflow):
    name = "autopilot_campaign"

    def __init__(self) -> None:
        super().__init__()
        llm = GeminiLLMService()
        self.capabilities = [
            AutopilotResearchSelectionCapability(),
            ResearchCapability(llm=llm),
            AutopilotStrategyCapability(),
            PlanningCapability(llm),
            ContentCapability(llm),
            CreativeCapability(),
            AutopilotPublishingCapability(
                {"facebook": MetaFacebookPublisher(), "instagram": MetaInstagramPublisher()}
            ),
            AutopilotCompletionCapability(),
        ]
