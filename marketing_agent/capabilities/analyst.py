"""
ResearchAnalystCapability — Senior Marketing Research Analyst Agent that converts raw search outputs into clean, high-quality competitive intelligence.
"""

import logging
import json
from typing import List, Optional, Dict, Any

from marketing_agent.capabilities.base import Capability
from marketing_agent.services.llm.base import LLMService
from marketing_agent.services.llm.gemini import GeminiLLMService
from marketing_agent.state import CampaignState
from research.models.intelligence import (
    ResearchReport,
    ResearchIntelligence,
    CompetitorResult,
    AudienceResult,
    TrendResult,
    NewsResult,
    TechnologyResult,
    OpportunityResult,
    RiskResult,
)
from research.models.metadata import ResearchMetadata

logger = logging.getLogger(__name__)


class ResearchAnalystCapability(Capability):
    name = "research_analyst"

    def __init__(self, llm: Optional[LLMService] = None) -> None:
        self._llm = llm or GeminiLLMService()

    async def analyze_raw_research(
        self,
        product_name: str,
        product_description: str,
        raw_report: Dict[str, Any],
        industry: Optional[str] = None,
        target_audience: Optional[str] = None,
    ) -> ResearchReport:
        
        # Extract raw items to supply to LLM context
        raw_intel = raw_report.get("intelligence", {})
        raw_comps = raw_intel.get("competitors", [])
        raw_trends = raw_intel.get("trends", [])
        raw_news = raw_intel.get("news", [])
        raw_audience = raw_intel.get("audience", [])
        raw_tech = raw_intel.get("technologies", [])

        prompt = (
            "You are a Senior Marketing Research Analyst working at a global digital marketing agency.\n"
            "You are NOT a search engine or simple summarizer. Your goal is to convert noisy search engine output into an executive research brief that a marketing strategist will use.\n\n"
            f"PRODUCT CONTEXT:\n"
            f"- Name: {product_name}\n"
            f"- Description: {product_description}\n"
            f"- Industry: {industry or 'General Tech/SaaS'}\n"
            f"- Target Audience: {target_audience or 'General Audience'}\n\n"
            f"RAW UNFILTERED SEARCH RESULTS:\n"
            f"- Competitor Candidates: {json.dumps(raw_comps[:15])}\n"
            f"- Trend Candidates: {json.dumps(raw_trends[:15])}\n"
            f"- News Items: {json.dumps(raw_news[:10])}\n"
            f"- Audience Candidates: {json.dumps(raw_audience[:10])}\n"
            f"- Tech Items: {json.dumps(raw_tech[:10])}\n\n"
            "SELECTION & ANALYST RULES:\n"
            "1. Search Result != Competitor: PCMag, Reddit, G2, Medium, Capterra, Wikipedia, comparison blogs, and Top 10 lists are INFORMATION SOURCES, NOT competitors. REJECT them as competitors. Infer real product companies selling competing solutions (e.g. ClickUp, Notion, Monday.com, Slack).\n"
            "2. Quality over Quantity: Select ONLY high-relevance entries.\n"
            "3. Deduplicate: Merge multiple mentions of the same brand or trend.\n"
            "4. Reason Required: Every single item MUST contain a concise 1-2 sentence analyst justification ('reason').\n"
            "5. Limits: Max 5 competitors, Max 5 market_trends, Max 3 industry_news, Max 5 audience_segments, Max 5 technologies, Max 3 opportunities, Max 3 risks.\n\n"
            "RETURN ONLY VALID JSON WITH THIS EXACT STRUCTURE:\n"
            "{\n"
            '  "competitors": [{"name": "...", "website": "...", "reason": "...", "confidence": 0.94}],\n'
            '  "market_trends": [{"title": "...", "reason": "...", "confidence": 0.90}],\n'
            '  "industry_news": [{"title": "...", "summary": "...", "source": "...", "reason": "..."}],\n'
            '  "audience_segments": [{"segment": "...", "reason": "..."}],\n'
            '  "technologies": [{"name": "...", "reason": "..."}],\n'
            '  "opportunities": [{"opportunity": "...", "reason": "..."}],\n'
            '  "risks": [{"risk": "...", "reason": "..."}]\n'
            "}"
        )

        metadata_obj = ResearchMetadata(
            completed_providers=raw_report.get("metadata", {}).get("completed_providers", ["SerpAPI Analyst"]),
            failed_providers=raw_report.get("metadata", {}).get("failed_providers", []),
            partial_providers=raw_report.get("metadata", {}).get("partial_providers", []),
            execution_time=raw_report.get("metadata", {}).get("execution_time", 0.0),
            schema_version="2.0.0"
        )

        try:
            res = await self._llm.generate_json(prompt)
            if isinstance(res, dict) and (res.get("competitors") or res.get("market_trends")):
                intel = ResearchIntelligence()
                
                # Competitors
                for c in res.get("competitors", [])[:5]:
                    if isinstance(c, dict) and c.get("name"):
                        intel.competitors.append(CompetitorResult(
                            name=str(c.get("name")),
                            domain=str(c.get("website", "")) if c.get("website") else None,
                            reason=str(c.get("reason", "")),
                            confidence=float(c.get("confidence", 0.9)),
                            provider="SerpAPI Senior Analyst"
                        ))

                # Trends
                for t in res.get("market_trends", [])[:5]:
                    if isinstance(t, dict) and t.get("title"):
                        intel.trends.append(TrendResult(
                            keyword=str(t.get("title")),
                            reason=str(t.get("reason", "")),
                            confidence=float(t.get("confidence", 0.9)),
                            provider="SerpAPI Senior Analyst"
                        ))

                # News
                for n in res.get("industry_news", [])[:3]:
                    if isinstance(n, dict) and n.get("title"):
                        intel.news.append(NewsResult(
                            title=str(n.get("title")),
                            summary=str(n.get("summary", "")),
                            source=str(n.get("source", "Industry News")),
                            reason=str(n.get("reason", "")),
                            provider="SerpAPI Senior Analyst"
                        ))

                # Audience Segments
                for a in res.get("audience_segments", [])[:5]:
                    if isinstance(a, dict) and a.get("segment"):
                        intel.audience.append(AudienceResult(
                            segment=str(a.get("segment")),
                            reason=str(a.get("reason", "")),
                            provider="SerpAPI Senior Analyst"
                        ))

                # Technologies
                for tech in res.get("technologies", [])[:5]:
                    if isinstance(tech, dict) and tech.get("name"):
                        intel.technologies.append(TechnologyResult(
                            name=str(tech.get("name")),
                            reason=str(tech.get("reason", "")),
                            provider="SerpAPI Senior Analyst"
                        ))

                # Opportunities
                for opp in res.get("opportunities", [])[:3]:
                    if isinstance(opp, dict) and opp.get("opportunity"):
                        intel.opportunities.append(OpportunityResult(
                            opportunity=str(opp.get("opportunity")),
                            reason=str(opp.get("reason", "")),
                            provider="SerpAPI Senior Analyst"
                        ))

                # Risks
                for r in res.get("risks", [])[:3]:
                    if isinstance(r, dict) and r.get("risk"):
                        intel.risks.append(RiskResult(
                            risk=str(r.get("risk")),
                            reason=str(r.get("reason", "")),
                            provider="SerpAPI Senior Analyst"
                        ))

                return ResearchReport(metadata=metadata_obj, intelligence=intel)
        except Exception as exc:
            logger.warning(f"[ResearchAnalystCapability] Analyst processing failed: {exc}")

        # Fallback if LLM fails or is unconfigured: clean raw input
        intel = ResearchIntelligence()
        for c in raw_comps[:5]:
            name = c.get("name") if isinstance(c, dict) else getattr(c, "name", "")
            domain = c.get("domain") if isinstance(c, dict) else getattr(c, "domain", "")
            if name and not any(bad in name.lower() for bad in ["pcmag", "reddit", "g2", "medium", "capterra", "wikipedia", "top 10"]):
                intel.competitors.append(CompetitorResult(
                    name=name,
                    domain=domain,
                    reason=f"Direct market competitor for {product_name}.",
                    confidence=0.85,
                    provider="SerpAPI Analyst"
                ))

        for t in raw_trends[:5]:
            kw = t.get("keyword") if isinstance(t, dict) else getattr(t, "keyword", "")
            if kw:
                intel.trends.append(TrendResult(
                    keyword=kw,
                    reason=f"Emerging industry trend in {product_name} category.",
                    confidence=0.85,
                    provider="SerpAPI Analyst"
                ))

        for n in raw_news[:3]:
            title = n.get("title") if isinstance(n, dict) else getattr(n, "title", "")
            if title:
                intel.news.append(NewsResult(
                    title=title,
                    source=n.get("source", "Market News") if isinstance(n, dict) else getattr(n, "source", "Market News"),
                    summary="Key industry announcement.",
                    reason="Relevant news event impacting market dynamics.",
                    provider="SerpAPI Analyst"
                ))

        for a in raw_audience[:5]:
            seg = a.get("segment") if isinstance(a, dict) else getattr(a, "segment", "")
            if seg:
                intel.audience.append(AudienceResult(
                    segment=seg,
                    reason=f"Key buyer persona for {product_name}.",
                    provider="SerpAPI Analyst"
                ))

        for tech in raw_tech[:5]:
            name = tech.get("name") if isinstance(tech, dict) else getattr(tech, "name", "")
            if name:
                intel.technologies.append(TechnologyResult(
                    name=name,
                    reason=f"Core technology stack element for {product_name}.",
                    provider="SerpAPI Analyst"
                ))

        intel.opportunities = [
            OpportunityResult(
                opportunity="AI-driven workflow automation",
                reason=f"Unmet user demand for rapid task execution in {product_name} domain.",
                provider="SerpAPI Analyst"
            )
        ]
        intel.risks = [
            RiskResult(
                risk="Rapid market entry by incumbent SaaS platforms",
                reason="Incumbents bundling competing features into existing subscriptions.",
                provider="SerpAPI Analyst"
            )
        ]

        return ResearchReport(metadata=metadata_obj, intelligence=intel)

    async def _execute(self, state: CampaignState) -> CampaignState:
        if state.research_report:
            report = await self.analyze_raw_research(
                product_name=state.product_name,
                product_description=state.product_description,
                raw_report=state.research_report,
                industry=state.industry,
                target_audience=state.target_audience,
            )
            state.research_report = report.model_dump()
        return state
