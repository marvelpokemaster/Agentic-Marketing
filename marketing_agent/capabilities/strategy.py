"""
MarketingStrategyCapability — Synthesizes Product details, ResearchReport, and ResearchPlan into a comprehensive MarketingStrategy.
"""

import logging
import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from marketing_agent.capabilities.base import Capability
from marketing_agent.services.llm.base import LLMService
from marketing_agent.services.llm.gemini import GeminiLLMService
from marketing_agent.state import CampaignState

logger = logging.getLogger(__name__)


class MarketingStrategy(BaseModel):
    campaign_objective: str = ""
    target_audience: str = ""
    value_proposition: str = ""
    positioning: str = ""
    messaging_angle: str = ""
    tone: str = ""
    content_pillars: List[str] = Field(default_factory=list)
    recommended_platforms: List[str] = Field(default_factory=list)
    organic_vs_paid: str = ""
    recommended_budget: str = ""
    cta_strategy: str = ""


class StrategyCapability(Capability):
    name = "strategy"

    def __init__(self, llm: Optional[LLMService] = None) -> None:
        self._llm = llm or GeminiLLMService()

    async def generate_strategy(
        self,
        product_name: str,
        product_description: str,
        research_report: Optional[Dict[str, Any]] = None,
        planner_output: Optional[Dict[str, Any]] = None,
        target_audience: Optional[str] = None,
        platforms: Optional[List[str]] = None,
    ) -> MarketingStrategy:
        
        # Prepare context summaries
        report_summary = ""
        if research_report and "intelligence" in research_report:
            intel = research_report["intelligence"]
            comps = [c.get("name") for c in intel.get("competitors", []) if c.get("name")]
            trends = [t.get("keyword") for t in intel.get("trends", []) if t.get("keyword")]
            news = [n.get("title") for n in intel.get("news", []) if n.get("title")]
            report_summary = f"Competitors: {', '.join(comps[:5])}; Trends: {', '.join(trends[:5])}; News: {', '.join(news[:3])}"

        planner_summary = ""
        if planner_output:
            planner_summary = f"Focus: {planner_output.get('research_focus')}; Industry Summary: {planner_output.get('industry_summary')}"

        prompt = (
            "You are a Chief Marketing Officer formulating a comprehensive B2B/B2C Go-To-Market strategy.\n"
            "Analyze the product details, competitive research, and research planner insights:\n"
            f"- Product Name: {product_name}\n"
            f"- Description: {product_description}\n"
            f"- Target Audience: {target_audience or 'General Audience'}\n"
            f"- Preferred Platforms: {', '.join(platforms) if platforms else 'Instagram, LinkedIn, Twitter'}\n"
            f"- Research Intelligence: {report_summary or 'Standard market analysis'}\n"
            f"- Planner Direction: {planner_summary or 'General market entry'}\n\n"
            "Generate a complete Marketing Strategy. Return a JSON object with EXACTLY the following keys:\n"
            "1. 'campaign_objective': Primary goal of this marketing push (1-2 sentences)\n"
            "2. 'target_audience': Synthesized target buyer persona description\n"
            "3. 'value_proposition': Core value proposition statement\n"
            "4. 'positioning': Strategic market positioning statement\n"
            "5. 'messaging_angle': Primary emotional or value hook for creative copy\n"
            "6. 'tone': Brand voice and tone (e.g., Authoritative, Conversational, Premium)\n"
            "7. 'content_pillars': List of 3-5 core strategic topic pillars for content generation\n"
            "8. 'recommended_platforms': List of recommended channels (e.g. ['LinkedIn', 'Instagram', 'X/Twitter'])\n"
            "9. 'organic_vs_paid': Recommendation on organic content vs paid ads balance\n"
            "10. 'recommended_budget': Estimated monthly budget allocation recommendation\n"
            "11. 'cta_strategy': Primary Call To Action strategy (e.g., 'Book a Demo', 'Start Free Trial')\n"
        )

        try:
            res = await self._llm.generate_json(prompt)
            if isinstance(res, dict) and res.get("value_proposition"):
                return MarketingStrategy(
                    campaign_objective=str(res.get("campaign_objective", "")),
                    target_audience=str(res.get("target_audience", "")),
                    value_proposition=str(res.get("value_proposition", "")),
                    positioning=str(res.get("positioning", "")),
                    messaging_angle=str(res.get("messaging_angle", "")),
                    tone=str(res.get("tone", "")),
                    content_pillars=[str(p) for p in res.get("content_pillars", [])],
                    recommended_platforms=[str(p) for p in res.get("recommended_platforms", [])],
                    organic_vs_paid=str(res.get("organic_vs_paid", "")),
                    recommended_budget=str(res.get("recommended_budget", "")),
                    cta_strategy=str(res.get("cta_strategy", "")),
                )
        except Exception as exc:
            logger.warning(f"[StrategyCapability] LLM strategy generation failed: {exc}")

        # Fallback strategy if LLM fails or is unavailable
        return MarketingStrategy(
            campaign_objective=f"Drive brand awareness and high-intent user acquisition for {product_name}.",
            target_audience=target_audience or "Tech-savvy professionals and decision makers.",
            value_proposition=f"Transform efficiency with {product_name}.",
            positioning=f"The premier solution for modern teams in {product_name}.",
            messaging_angle="Save time, cut costs, and unlock productivity.",
            tone="Professional, innovative, and results-oriented",
            content_pillars=["Product Highlights", "Industry Insights", "Customer Success", "Feature Tutorials"],
            recommended_platforms=platforms or ["LinkedIn", "Instagram", "Twitter/X"],
            organic_vs_paid="70% Organic Content for Trust, 30% Paid Ads for Conversion",
            recommended_budget="$1,500 - $3,000 / month initial testing budget",
            cta_strategy="Direct call to action to visit product landing page and sign up.",
        )

    async def _execute(self, state: CampaignState) -> CampaignState:
        strat = await self.generate_strategy(
            product_name=state.product_name,
            product_description=state.product_description,
            research_report=state.research_report,
            planner_output=getattr(state, "planner", None),
            target_audience=state.target_audience,
            platforms=state.platforms,
        )
        state.strategy = strat.model_dump()
        return state
