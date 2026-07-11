from typing import Dict, Any
from research.models.intelligence import AudienceResult

class RedditNormalizer:
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw Reddit API response."""
        audience = []
        for item in raw_data.get("data", {}).get("children", []):
            data = item.get("data", {})
            audience.append(AudienceResult(
                segment=data.get("subreddit", ""),
                size=data.get("subscribers", None),
                provider="Reddit"
            ))
        return {"audience": audience}
