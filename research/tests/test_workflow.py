import asyncio
import pytest
from research.models.context import ResearchContext
from research.orchestrator.registry import ProviderRegistry
from research.orchestrator.executor import ResearchExecutor
from research.orchestrator.aggregator import ResultAggregator
from research.orchestrator.workflow import ResearchWorkflow
from research.tests.fake_success_provider import FakeSuccessProvider
from research.tests.fake_failure_provider import FakeFailureProvider, FakeExceptionProvider
from research.tests.fake_timeout_provider import FakeTimeoutProvider
from research.tests.fake_partial_provider import FakePartialProvider

@pytest.mark.asyncio
async def test_workflow_fault_tolerance():
    registry = ProviderRegistry()
    registry.register(FakeSuccessProvider())
    registry.register(FakeFailureProvider())
    registry.register(FakeExceptionProvider())
    registry.register(FakePartialProvider())
    
    # We'll use a small timeout for the executor to catch the timeout provider if we added it.
    # We'll also test the executor specifically later.

    executor = ResearchExecutor(concurrency_limit=5)
    aggregator = ResultAggregator()
    workflow = ResearchWorkflow(registry, executor, aggregator)
    
    context = ResearchContext(product_description="Test Product")
    
    # Run the workflow
    report = await workflow.run(context)
    
    # Verify metadata
    metadata = report.metadata
    assert "FakeSuccess" in metadata.completed_providers
    assert "FakeFailure" in metadata.failed_providers
    assert "FakeException" in metadata.failed_providers
    assert "FakePartial" in metadata.partial_providers
    
    # Verify intelligence aggregated from success and partial providers
    intel = report.intelligence
    assert len(intel.competitors) == 1
    assert intel.competitors[0].name == "Fake Success Inc"
    assert len(intel.audience) == 1
    assert intel.audience[0].segment == "Developers"

if __name__ == "__main__":
    asyncio.run(test_workflow_fault_tolerance())
