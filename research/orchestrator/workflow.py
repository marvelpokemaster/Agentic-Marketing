from typing import List, Optional
from research.models.context import ResearchContext
from research.models.intelligence import ResearchReport
from research.orchestrator.registry import ProviderRegistry
from research.orchestrator.executor import ResearchExecutor
from research.orchestrator.aggregator import ResultAggregator

class ResearchWorkflow:
    def __init__(self, registry: ProviderRegistry, executor: ResearchExecutor, aggregator: ResultAggregator):
        self.registry = registry
        self.executor = executor
        self.aggregator = aggregator

    async def run(self, context: ResearchContext, capabilities: Optional[List[str]] = None) -> ResearchReport:
        """Run the research workflow for the given context."""
        
        # 1. Select providers based on capabilities, or get all if none specified
        providers = []
        if capabilities:
            for cap in capabilities:
                providers.extend(self.registry.get_providers_by_capability(cap))
            # Deduplicate by name
            unique_providers = {p.name: p for p in providers}
            providers = list(unique_providers.values())
        else:
            providers = self.registry.get_all_providers()

        # 2. Execute providers concurrently
        results = await self.executor.execute(providers, context)

        # 3. Aggregate results
        report = self.aggregator.aggregate(results)
        
        # Calculate total execution time (since aggregator measures its own aggregation time)
        # Actually executor results have individual times, we can sum max execution time or measure workflow
        max_exec_time = max([res.execution_time for res in results] + [0.0])
        report.metadata.execution_time = max_exec_time

        return report

    async def close(self) -> None:
        """Close all registered providers to release resources."""
        providers = self.registry.get_all_providers()
        for provider in providers:
            if hasattr(provider, "close"):
                await provider.close()
