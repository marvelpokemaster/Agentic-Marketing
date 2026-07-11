from abc import ABC, abstractmethod
from typing import List
from research.models.context import ResearchContext
from research.models.provider import ProviderResult

class ResearchProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the provider, e.g., 'BraveSearch'"""
        pass

    @property
    @abstractmethod
    def capabilities(self) -> List[str]:
        """List of capabilities, e.g., ['SEARCH', 'NEWS']"""
        pass

    @abstractmethod
    async def fetch(self, context: ResearchContext) -> ProviderResult:
        """Fetches raw data from the provider"""
        pass

    async def close(self) -> None:
        """Optional cleanup method for releasing resources."""
        pass
