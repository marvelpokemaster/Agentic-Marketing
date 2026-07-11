from typing import Dict, Any
from research.models.intelligence import TrendResult

class TrendsNormalizer:
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw Google Trends response."""
        trends = []
        for item in raw_data.get("trends", []):
            trends.append(TrendResult(
                keyword=item.get("query", ""),
                volume=item.get("value", None),
                provider="GoogleTrends"
            ))
        return {"trends": trends}
