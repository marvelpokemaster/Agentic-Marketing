from typing import List, Any
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult
from research.normalizers.wappalyzer import WappalyzerNormalizer
from research.execution.retry import with_retry
from research.execution.timeout import with_timeout

class WappalyzerProvider(ResearchProvider):
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.normalizer = WappalyzerNormalizer()

    @property
    def name(self) -> str:
        return "Wappalyzer"

    @property
    def capabilities(self) -> List[str]:
        return ["TECH_STACK"]

    @with_retry(max_retries=3)
    @with_timeout(seconds=10.0)
    async def fetch(self, context: ResearchContext) -> ProviderResult:
        if not self.api_key:
            return ProviderResult(
                provider_name=self.name,
                status="failed",
                error="API key missing"
            )
        raw_data = [{"name": "React", "categories": [{"name": "Web Frameworks"}]}]
        normalized = self.normalizer.normalize(raw_data)
        return ProviderResult(
            provider_name=self.name, status="success", raw_data=raw_data, normalized_data=normalized
        )
