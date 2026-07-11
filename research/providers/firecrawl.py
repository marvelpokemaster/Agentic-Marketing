from typing import List, Any
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult
from research.normalizers.firecrawl import FirecrawlNormalizer
from research.execution.retry import with_retry
from research.execution.timeout import with_timeout

class FirecrawlProvider(ResearchProvider):
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.normalizer = FirecrawlNormalizer()

    @property
    def name(self) -> str:
        return "Firecrawl"

    @property
    def capabilities(self) -> List[str]:
        return ["CRAWL"]

    @with_retry(max_retries=2)
    @with_timeout(seconds=15.0)
    async def fetch(self, context: ResearchContext) -> ProviderResult:
        if not self.api_key:
            return ProviderResult(
                provider_name=self.name,
                status="failed",
                error="API key missing"
            )
        raw_data = {"crawled": {"domain": "competitor-a.com", "content": "Sample content"}}
        normalized = self.normalizer.normalize(raw_data)
        return ProviderResult(
            provider_name=self.name, status="success", raw_data=raw_data, normalized_data=normalized
        )
