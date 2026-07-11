from typing import List
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult
from research.models.intelligence import CompetitorResult

class FakeSuccessProvider(ResearchProvider):
    @property
    def name(self) -> str:
        return "FakeSuccess"

    @property
    def capabilities(self) -> List[str]:
        return ["SEARCH"]

    async def fetch(self, context: ResearchContext) -> ProviderResult:
        normalized_data = {
            "competitors": [
                CompetitorResult(name="Fake Success Inc", provider=self.name)
            ]
        }
        return ProviderResult(
            provider_name=self.name,
            status="success",
            raw_data={"fake": "data"},
            normalized_data=normalized_data
        )
