from typing import List
from datetime import datetime, timezone
from research.models.provider import ProviderResult
from research.models.intelligence import ResearchReport, ResearchIntelligence
from research.models.metadata import ResearchMetadata

class ResultAggregator:
    def __init__(self):
        pass

    def aggregate(self, results: List[ProviderResult]) -> ResearchReport:
        intelligence = ResearchIntelligence()
        metadata = ResearchMetadata(
            completed_providers=[],
            failed_providers=[],
            partial_providers=[],
            execution_time=0.0
        )
        
        start_time = datetime.now(timezone.utc)

        for result in results:
            if result.status == "success":
                metadata.completed_providers.append(result.provider_name)
            elif result.status == "partial":
                metadata.partial_providers.append(result.provider_name)
            elif result.status == "failed":
                metadata.failed_providers.append(result.provider_name)

            if result.status in ("success", "partial") and result.normalized_data:
                # Merge lists from normalized data if present
                # Providers should return dicts or objects compatible with ResearchIntelligence
                data = result.normalized_data
                if isinstance(data, dict):
                    if "competitors" in data:
                        intelligence.competitors.extend(data["competitors"])
                    if "audience" in data:
                        intelligence.audience.extend(data["audience"])
                    if "trends" in data:
                        intelligence.trends.extend(data["trends"])
                    if "news" in data:
                        intelligence.news.extend(data["news"])
                    if "technologies" in data:
                        intelligence.technologies.extend(data["technologies"])
                        
        end_time = datetime.now(timezone.utc)
        metadata.execution_time = (end_time - start_time).total_seconds()
        
        # In a real implementation, deduplication hooks would run here
        
        return ResearchReport(metadata=metadata, intelligence=intelligence)
