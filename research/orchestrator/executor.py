import asyncio
import time
from typing import List, Sequence
from research.interfaces.provider import ResearchProvider
from research.models.context import ResearchContext
from research.models.provider import ProviderResult
from research.exceptions import ProviderError

class ResearchExecutor:
    def __init__(self, concurrency_limit: int = 10):
        self.semaphore = asyncio.Semaphore(concurrency_limit)

    async def _execute_single(self, provider: ResearchProvider, context: ResearchContext) -> ProviderResult:
        start_time = time.time()
        try:
            async with self.semaphore:
                # Assuming the provider handles its own retries and timeouts
                # and returns a ProviderResult object.
                result = await provider.fetch(context)
                if not isinstance(result, ProviderResult):
                    # Wrap invalid response
                    result = ProviderResult(
                        provider_name=provider.name,
                        status="failed",
                        error=f"Invalid return type from provider: {type(result)}"
                    )
        except Exception as e:
            # Catch everything to ensure isolation
            result = ProviderResult(
                provider_name=provider.name,
                status="failed",
                error=str(e)
            )
        finally:
            end_time = time.time()
            if hasattr(result, "execution_time") and result.execution_time == 0.0:
                result.execution_time = end_time - start_time
                
        return result

    async def execute(self, providers: Sequence[ResearchProvider], context: ResearchContext) -> List[ProviderResult]:
        """Execute multiple providers concurrently and return their results."""
        if not providers:
            return []

        tasks = [
            asyncio.create_task(self._execute_single(provider, context))
            for provider in providers
        ]
        
        # return_exceptions=True is a safety net, although _execute_single catches all Exceptions.
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        final_results: List[ProviderResult] = []
        for provider, res in zip(providers, results):
            if isinstance(res, BaseException):
                final_results.append(ProviderResult(
                    provider_name=provider.name,
                    status="failed",
                    error=f"Uncaught async execution error: {str(res)}"
                ))
            else:
                # Tell mypy we know it is a ProviderResult if it's not a BaseException
                from typing import cast
                final_results.append(cast(ProviderResult, res))
                
        return final_results
