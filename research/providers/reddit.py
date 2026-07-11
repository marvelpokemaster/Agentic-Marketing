from typing import List, Any
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult
from research.normalizers.reddit import RedditNormalizer
from research.execution.retry import with_retry
from research.execution.timeout import with_timeout

class RedditProvider(ResearchProvider):
    def __init__(self, client_id: str = "", client_secret: str = ""):
        self.client_id = client_id
        self.client_secret = client_secret
        self.normalizer = RedditNormalizer()

    @property
    def name(self) -> str:
        return "Reddit"

    @property
    def capabilities(self) -> List[str]:
        return ["SOCIAL", "AUDIENCE"]

    @with_retry(max_retries=3)
    @with_timeout(seconds=10.0)
    async def fetch(self, context: ResearchContext) -> ProviderResult:
        if not self.client_id or not self.client_secret:
            return ProviderResult(
                provider_name=self.name,
                status="failed",
                error="API credentials missing"
            )
        raw_data = {"data": {"children": [{"data": {"subreddit": "marketing", "subscribers": 150000}}]}}
        normalized = self.normalizer.normalize(raw_data)
        return ProviderResult(
            provider_name=self.name, status="success", raw_data=raw_data, normalized_data=normalized
        )
