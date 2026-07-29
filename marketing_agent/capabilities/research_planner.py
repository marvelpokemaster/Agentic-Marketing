"""
ResearchPlannerCapability — Infers search queries, keywords, and competitor hypotheses using LLMs.
"""

import logging
from typing import List, Optional
from pydantic import BaseModel, Field

from marketing_agent.capabilities.base import Capability
from marketing_agent.services.llm.base import LLMService
from marketing_agent.services.llm.gemini import GeminiLLMService
from marketing_agent.state import CampaignState

logger = logging.getLogger(__name__)


class ResearchPlan(BaseModel):
    search_queries: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    competitor_hypotheses: List[str] = Field(default_factory=list)
    industry_summary: str = ""
    research_focus: str = ""


class ResearchPlannerCapability(Capability):
    name = "research_planner"

    def __init__(self, llm: Optional[LLMService] = None) -> None:
        self._llm = llm or GeminiLLMService()

    async def generate_plan(
        self,
        product_name: str,
        product_description: str,
        industry: Optional[str] = None,
        target_audience: Optional[str] = None,
    ) -> ResearchPlan:
        prompt = (
            "You are an expert market research planner for a digital marketing agency.\n"
            f"Analyze the following product details:\n"
            f"- Product Name: {product_name}\n"
            f"- Description: {product_description}\n"
            f"- Industry: {industry or 'General SaaS / Tech'}\n"
            f"- Target Audience: {target_audience or 'General audience'}\n\n"
            "Generate a strategic research plan for market discovery and competitor analysis.\n"
            "Return a JSON object with EXACTLY the following keys:\n"
            "1. 'search_queries': List of 3 to 5 realistic, specific search engine queries to find competitors, industry trends, and user discussions. DO NOT just repeat the raw product name. (e.g. ['top AI workflow automation tools', 'ClickUp alternatives for teams'])\n"
            "2. 'keywords': List of 5-8 relevant industry/product keywords\n"
            "3. 'competitor_hypotheses': List of 3 likely competitor types or known companies\n"
            "4. 'industry_summary': A 1-2 sentence overview of the market segment\n"
            "5. 'research_focus': A 1-sentence statement on what this research aims to uncover\n"
        )

        try:
            res = await self._llm.generate_json(prompt)
            if isinstance(res, dict) and res.get("search_queries"):
                queries = [str(q).strip() for q in res.get("search_queries", []) if q][:5]
                if queries:
                    return ResearchPlan(
                        search_queries=queries,
                        keywords=[str(k) for k in res.get("keywords", [])],
                        competitor_hypotheses=[str(c) for c in res.get("competitor_hypotheses", [])],
                        industry_summary=str(res.get("industry_summary", "")),
                        research_focus=str(res.get("research_focus", "")),
                    )
        except Exception as exc:
            logger.warning(f"[ResearchPlannerCapability] LLM plan generation failed: {exc}")

        # Heuristic fallback if LLM returns empty or fails
        fallback_queries = [
            f"{product_name} software alternatives",
            f"best {product_name} tools",
            f"top {industry or 'tech'} platforms 2026",
            f"{product_name} reviews pricing",
        ]
        return ResearchPlan(
            search_queries=fallback_queries[:5],
            keywords=[product_name, industry or "SaaS", "software", "tools"],
            competitor_hypotheses=["Direct SaaS competitors", "Alternative tools"],
            industry_summary=f"Market segment for {product_name} in {industry or 'technology'}.",
            research_focus=f"Analyze top competitors, target audience sentiment, and market trends for {product_name}.",
        )

    async def _execute(self, state: CampaignState) -> CampaignState:
        plan = await self.generate_plan(
            product_name=state.product_name,
            product_description=state.product_description,
            industry=state.industry,
            target_audience=state.target_audience,
        )
        state.planner = plan.model_dump()
        return state
