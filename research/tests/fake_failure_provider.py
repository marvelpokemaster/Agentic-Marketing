from typing import List
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult

class FakeFailureProvider(ResearchProvider):
    @property
    def name(self) -> str:
        return "FakeFailure"

    @property
    def capabilities(self) -> List[str]:
        return ["NEWS"]

    async def fetch(self, context: ResearchContext) -> ProviderResult:
        # Simulate a handled failure that returns a failed ProviderResult
        return ProviderResult(
            provider_name=self.name,
            status="failed",
            error="Simulated failure"
        )

class FakeExceptionProvider(ResearchProvider):
    @property
    def name(self) -> str:
        return "FakeException"

    @property
    def capabilities(self) -> List[str]:
        return ["TRENDS"]

    async def fetch(self, context: ResearchContext) -> ProviderResult:
        # Simulate an uncaught exception that the executor must catch
        raise RuntimeError("Simulated uncaught exception")
