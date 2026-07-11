from typing import List, Dict, Optional
from research.interfaces.provider import ResearchProvider

class ProviderRegistry:
    def __init__(self):
        self._providers: Dict[str, ResearchProvider] = {}

    def register(self, provider: ResearchProvider) -> None:
        """Register a new research provider."""
        self._providers[provider.name] = provider

    def unregister(self, provider_name: str) -> None:
        """Unregister a research provider."""
        if provider_name in self._providers:
            del self._providers[provider_name]

    def get_provider(self, name: str) -> Optional[ResearchProvider]:
        """Get a provider by name."""
        return self._providers.get(name)

    def get_providers_by_capability(self, capability: str) -> List[ResearchProvider]:
        """Return all providers that declare the given capability."""
        return [
            provider for provider in self._providers.values()
            if capability in provider.capabilities
        ]

    def get_all_providers(self) -> List[ResearchProvider]:
        """Return all registered providers."""
        return list(self._providers.values())
