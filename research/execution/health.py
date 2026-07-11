from research.interfaces.provider import ResearchProvider

class HealthChecker:
    @staticmethod
    async def check(provider: ResearchProvider) -> bool:
        """
        Check if a provider is healthy.
        In a real scenario, this might ping an endpoint or check API quotas.
        """
        # Stub
        return True
