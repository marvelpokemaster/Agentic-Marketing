from typing import Dict, Any, List
from research.models.intelligence import (
    CompetitorResult,
    NewsResult,
    TrendResult,
    AudienceResult,
    TechnologyResult
)

class SerpAPINormalizer:
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw SerpAPI Search JSON response."""
        competitors: List[CompetitorResult] = []
        news: List[NewsResult] = []
        trends: List[TrendResult] = []
        audience: List[AudienceResult] = []
        technologies: List[TechnologyResult] = []
        
        provider_name = "SerpAPI"

        # 1. organic_results -> CompetitorResult
        for result in raw_data.get("organic_results", []):
            position = result.get("position", 10)
            confidence = 0.9 if position <= 3 else 0.7
            
            competitors.append(CompetitorResult(
                name=result.get("title", "Unknown"),
                domain=result.get("link", ""),
                provider=provider_name,
                confidence=confidence,
                source_url=result.get("link", "")
            ))
            
        # 2. news_results -> NewsResult
        for article in raw_data.get("news_results", []):
            news.append(NewsResult(
                title=article.get("title", ""),
                url=article.get("link", ""),
                source=article.get("source", "Unknown Source"),
                published_at=article.get("date", ""),
                provider=provider_name,
                confidence=0.9,
                source_url=article.get("link", "")
            ))

        # 3. related_searches -> TrendResult
        for related in raw_data.get("related_searches", []):
            trends.append(TrendResult(
                keyword=related.get("query", ""),
                volume=None,
                provider=provider_name,
                confidence=0.8,
                source_url=related.get("link", "")
            ))

        # 4. people_also_ask -> AudienceResult
        for question in raw_data.get("people_also_ask", []):
            audience.append(AudienceResult(
                segment=question.get("question", "Unknown Interest"),
                provider=provider_name,
                confidence=0.7,
                source_url=question.get("link", "")
            ))

        # 5. knowledge_graph -> TechnologyResult or CompetitorResult
        kg = raw_data.get("knowledge_graph", {})
        if kg:
            title = kg.get("title", "")
            if title:
                # We'll map the primary knowledge graph entity to a high-confidence CompetitorResult
                competitors.append(CompetitorResult(
                    name=title,
                    domain=kg.get("website", ""),
                    provider=provider_name,
                    confidence=0.95,
                    source_url=kg.get("website", "")
                ))

        return {
            "competitors": competitors,
            "news": news,
            "trends": trends,
            "audience": audience,
            "technologies": technologies
        }
