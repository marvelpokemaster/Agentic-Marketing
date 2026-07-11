from abc import ABC, abstractmethod
from typing import Optional, Any

class CacheBackend(ABC):
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Retrieve value from cache"""
        pass

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int = 86400) -> None:
        """Set value in cache with time-to-live in seconds"""
        pass
