import asyncio
import functools
from typing import Callable, Any
import research.exceptions as exceptions

def with_timeout(seconds: float):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError as e:
                raise exceptions.TimeoutError(f"Execution timed out after {seconds} seconds") from e
        return wrapper
    return decorator
