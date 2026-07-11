import asyncio
from typing import List
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult

class FakeTimeoutProvider(ResearchProvider):
    @property
    def name(self) -> str:
        return "FakeTimeout"

    @property
    def capabilities(self) -> List[str]:
        return ["TECH_STACK"]

    async def fetch(self, context: ResearchContext) -> ProviderResult:
        # Sleep a long time to trigger timeout externally, or simulate timeout
        await asyncio.sleep(10)
        return ProviderResult(
            provider_name=self.name,
            status="success"
        )
