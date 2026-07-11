from typing import List, Any, Dict
from research.models.intelligence import TechnologyResult

class WappalyzerNormalizer:
    def normalize(self, raw_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Normalize raw Wappalyzer response."""
        technologies = []
        for item in raw_data:
            category = ""
            if item.get("categories"):
                category = item["categories"][0].get("name", "")
                
            technologies.append(TechnologyResult(
                name=item.get("name", ""),
                category=category,
                provider="Wappalyzer"
            ))
        return {"technologies": technologies}
