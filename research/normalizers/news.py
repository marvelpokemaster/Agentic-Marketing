from typing import Dict, Any
from research.models.intelligence import NewsResult

class NewsNormalizer:
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw NewsAPI response."""
        news = []
        for article in raw_data.get("articles", []):
            news.append(NewsResult(
                title=article.get("title", ""),
                url=article.get("url", ""),
                source=article.get("source", {}).get("name", ""),
                provider="NewsAPI"
            ))
        return {"news": news}
