import asyncio
import functools
from typing import Callable, Any

def with_semaphore(semaphore: asyncio.Semaphore):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            async with semaphore:
                return await func(*args, **kwargs)
        return wrapper
    return decorator
