from abc import ABC, abstractmethod
from typing import Optional
from research.models.intelligence import ResearchReport

class ResearchStore(ABC):
    @abstractmethod
    async def save(self, run_id: str, report: ResearchReport) -> None:
        """Save a research report"""
        pass

    @abstractmethod
    async def load(self, run_id: str) -> Optional[ResearchReport]:
        """Load a research report by ID"""
        pass
