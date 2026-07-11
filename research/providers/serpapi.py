from typing import List, Any
import urllib.parse
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult
from research.normalizers.serpapi import SerpAPINormalizer
from research.execution.retry import with_retry
from research.execution.timeout import with_timeout
from research.utils.http import HTTPClient
from research.utils.config import config
from research.exceptions import ProviderError

class SerpAPIProvider(ResearchProvider):
    def __init__(self, api_key: str = "", timeout: float = 15.0, max_results: int = 5):
        self.api_key = api_key or config.get("SERPAPI_API_KEY", "")
        self.timeout = timeout or config.get("SERPAPI_TIMEOUT", 15.0)
        self.max_results = max_results or config.get("SERPAPI_MAX_RESULTS", 5)
        self.normalizer = SerpAPINormalizer()
        self.http = HTTPClient(timeout=self.timeout)

    @property
    def name(self) -> str:
        return "SerpAPI"

    @property
    def capabilities(self) -> List[str]:
        return ["SEARCH", "COMPETITORS", "NEWS", "TRENDS", "AUDIENCE"]

    @with_retry(max_retries=3)
    @with_timeout(seconds=20.0)
    async def fetch(self, context: ResearchContext) -> ProviderResult:
        if not self.api_key:
            return ProviderResult(
                provider_name=self.name,
                status="failed",
                error="API key missing"
            )
        
        query = context.product_description
        if context.company_name:
            query = f"{context.company_name} {query}"
            
        url = f"https://serpapi.com/search.json?q={urllib.parse.quote(query)}&api_key={self.api_key}&num={self.max_results}"
        
        raw_data = await self.http.get(url)
            
        normalized = self.normalizer.normalize(raw_data)
        
        return ProviderResult(
            provider_name=self.name,
            status="success",
            raw_data=raw_data,
            normalized_data=normalized
        )

    async def close(self) -> None:
        await self.http.close()
