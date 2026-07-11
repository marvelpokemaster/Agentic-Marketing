import asyncio
import os
import json
from research.models.context import ResearchContext
from research.orchestrator.registry import ProviderRegistry
from research.orchestrator.executor import ResearchExecutor
from research.orchestrator.aggregator import ResultAggregator
from research.orchestrator.workflow import ResearchWorkflow
from research.providers.serpapi import SerpAPIProvider

async def main():
    api_key = os.environ.get("SERPAPI_API_KEY", "")
    if not api_key:
        print("WARN: SERPAPI_API_KEY not set. The provider will fail gracefully.")
        
    print(f"Setting up ResearchWorkflow with SerpAPI...")

    # Set up orchestration components
    registry = ProviderRegistry()
    registry.register(SerpAPIProvider())

    executor = ResearchExecutor(concurrency_limit=5)
    aggregator = ResultAggregator()
    workflow = ResearchWorkflow(registry, executor, aggregator)

    # Set up context
    context = ResearchContext(
        product_description="agentic marketing software for smb",
        company_name="Agentic Marketing"
    )

    print("Running research... (this may take a few seconds)")
    
    try:
        # Run the workflow filtering by SEARCH capability
        report = await workflow.run(context, capabilities=["SEARCH", "NEWS", "TRENDS", "AUDIENCE"])

        # Output results
        print("\n" + "="*50)
        print("RESEARCH REPORT METADATA")
        print("="*50)
        print(json.dumps(report.metadata.model_dump(), indent=2))
        
        print("\n" + "="*50)
        print("RESEARCH INTELLIGENCE")
        print("="*50)
        print(json.dumps(report.intelligence.model_dump(exclude_none=True), indent=2))
    finally:
        await workflow.close()

if __name__ == "__main__":
    asyncio.run(main())
