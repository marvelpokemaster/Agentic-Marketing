from typing import List
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult
from research.models.intelligence import AudienceResult

class FakePartialProvider(ResearchProvider):
    @property
    def name(self) -> str:
        return "FakePartial"

    @property
    def capabilities(self) -> List[str]:
        return ["SOCIAL"]

    async def fetch(self, context: ResearchContext) -> ProviderResult:
        normalized_data = {
            "audience": [
                AudienceResult(segment="Developers", provider=self.name)
            ]
        }
        return ProviderResult(
            provider_name=self.name,
            status="partial",
            raw_data={"partial": "data"},
            normalized_data=normalized_data,
            error="Pagination failed midway"
        )
