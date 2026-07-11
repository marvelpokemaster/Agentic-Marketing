from typing import List, Any
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult
from research.normalizers.trends import TrendsNormalizer
from research.execution.retry import with_retry
from research.execution.timeout import with_timeout

class GoogleTrendsProvider(ResearchProvider):
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.normalizer = TrendsNormalizer()

    @property
    def name(self) -> str:
        return "GoogleTrends"

    @property
    def capabilities(self) -> List[str]:
        return ["TRENDS"]

    @with_retry(max_retries=3)
    @with_timeout(seconds=10.0)
    async def fetch(self, context: ResearchContext) -> ProviderResult:
        raw_data = {"trends": [{"query": context.product_description, "value": 100}]}
        normalized = self.normalizer.normalize(raw_data)
        return ProviderResult(
            provider_name=self.name, status="success", raw_data=raw_data, normalized_data=normalized
        )
