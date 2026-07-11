import asyncio
import functools
from typing import Callable, Any
from research.exceptions import RetryExhaustedError

def with_retry(max_retries: int = 3, initial_backoff: float = 1.0, factor: float = 2.0):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            backoff = initial_backoff
            for attempt in range(1, max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries:
                        raise RetryExhaustedError(f"Failed after {max_retries} attempts. Last error: {e}") from e
                    await asyncio.sleep(backoff)
                    backoff *= factor
            raise RetryExhaustedError("Retry limit exhausted")
        return wrapper
    return decorator
