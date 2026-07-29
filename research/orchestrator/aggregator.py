from typing import List, Dict, Any, Set
from datetime import datetime, timezone
from research.models.provider import ProviderResult
from research.models.intelligence import (
    ResearchReport,
    ResearchIntelligence,
    CompetitorResult,
    AudienceResult,
    TrendResult,
    NewsResult,
    TechnologyResult,
)
from research.models.metadata import ResearchMetadata


class ResultAggregator:
    def __init__(self):
        pass

    def _deduplicate_competitors(self, competitors: List[Any]) -> List[Any]:
        seen: Set[str] = set()
        deduped = []
        for c in competitors:
            key = ""
            if isinstance(c, dict):
                key = (c.get("domain") or c.get("name") or "").strip().lower()
            else:
                key = (getattr(c, "domain", None) or getattr(c, "name", "")).strip().lower()
            if key and key not in seen:
                seen.add(key)
                deduped.append(c)
        return deduped

    def _deduplicate_trends(self, trends: List[Any]) -> List[Any]:
        seen: Set[str] = set()
        deduped = []
        for t in trends:
            key = ""
            if isinstance(t, dict):
                key = (t.get("keyword") or "").strip().lower()
            else:
                key = (getattr(t, "keyword", "")).strip().lower()
            if key and key not in seen:
                seen.add(key)
                deduped.append(t)
        return deduped

    def _deduplicate_news(self, news: List[Any]) -> List[Any]:
        seen: Set[str] = set()
        deduped = []
        for n in news:
            key = ""
            if isinstance(n, dict):
                key = (n.get("url") or n.get("title") or "").strip().lower()
            else:
                key = (getattr(n, "url", None) or getattr(n, "title", "")).strip().lower()
            if key and key not in seen:
                seen.add(key)
                deduped.append(n)
        return deduped

    def _deduplicate_audience(self, audience: List[Any]) -> List[Any]:
        seen: Set[str] = set()
        deduped = []
        for a in audience:
            key = ""
            if isinstance(a, dict):
                key = (a.get("segment") or "").strip().lower()
            else:
                key = (getattr(a, "segment", "")).strip().lower()
            if key and key not in seen:
                seen.add(key)
                deduped.append(a)
        return deduped

    def _deduplicate_technologies(self, technologies: List[Any]) -> List[Any]:
        seen: Set[str] = set()
        deduped = []
        for tech in technologies:
            key = ""
            if isinstance(tech, dict):
                key = (tech.get("name") or "").strip().lower()
            else:
                key = (getattr(tech, "name", "")).strip().lower()
            if key and key not in seen:
                seen.add(key)
                deduped.append(tech)
        return deduped

    def aggregate(self, results: List[ProviderResult]) -> ResearchReport:
        intelligence = ResearchIntelligence()
        metadata = ResearchMetadata(
            completed_providers=[],
            failed_providers=[],
            partial_providers=[],
            execution_time=0.0
        )
        
        start_time = datetime.now(timezone.utc)

        raw_competitors = []
        raw_audience = []
        raw_trends = []
        raw_news = []
        raw_technologies = []

        for result in results:
            if result.status == "success":
                metadata.completed_providers.append(result.provider_name)
            elif result.status == "partial":
                metadata.partial_providers.append(result.provider_name)
            elif result.status == "failed":
                metadata.failed_providers.append(result.provider_name)

            if result.status in ("success", "partial") and result.normalized_data:
                data = result.normalized_data
                if isinstance(data, dict):
                    if "competitors" in data:
                        raw_competitors.extend(data["competitors"])
                    if "audience" in data:
                        raw_audience.extend(data["audience"])
                    if "trends" in data:
                        raw_trends.extend(data["trends"])
                    if "news" in data:
                        raw_news.extend(data["news"])
                    if "technologies" in data:
                        raw_technologies.extend(data["technologies"])

        # Run deduplication
        intelligence.competitors = self._deduplicate_competitors(raw_competitors)
        intelligence.audience = self._deduplicate_audience(raw_audience)
        intelligence.trends = self._deduplicate_trends(raw_trends)
        intelligence.news = self._deduplicate_news(raw_news)
        intelligence.technologies = self._deduplicate_technologies(raw_technologies)

        end_time = datetime.now(timezone.utc)
        metadata.execution_time = (end_time - start_time).total_seconds()
        
        return ResearchReport(metadata=metadata, intelligence=intelligence)
