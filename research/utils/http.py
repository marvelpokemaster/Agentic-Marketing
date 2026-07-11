import httpx
import asyncio
from typing import Optional, Dict, Any
from research.exceptions import ProviderError, TimeoutError, RetryExhaustedError
from research.utils.logging import get_logger

logger = get_logger(__name__)

class HTTPClient:
    def __init__(self, timeout: float = 10.0, max_retries: int = 3, backoff_factor: float = 2.0):
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        client = await self._get_client()
        backoff = 1.0
        
        for attempt in range(1, self.max_retries + 1):
            try:
                response = await client.request(method, url, **kwargs)
                response.raise_for_status()
                return response.json()
            except httpx.TimeoutException as e:
                logger.warning(f"Timeout on {method} {url}, attempt {attempt}/{self.max_retries}")
                if attempt == self.max_retries:
                    raise TimeoutError(f"Request to {url} timed out after {self.max_retries} attempts.") from e
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                logger.warning(f"HTTP {status_code} on {method} {url}, attempt {attempt}/{self.max_retries}")
                if status_code in (401, 403, 404):
                    # Do not retry client errors that are definitive
                    raise ProviderError(f"HTTP {status_code}: {e.response.text}") from e
                if attempt == self.max_retries:
                    raise ProviderError(f"HTTP {status_code} after {self.max_retries} attempts: {e.response.text}") from e
            except httpx.RequestError as e:
                logger.warning(f"Request error on {method} {url}, attempt {attempt}/{self.max_retries}: {e}")
                if attempt == self.max_retries:
                    raise ProviderError(f"Request failed: {str(e)}") from e
            except ValueError as e:
                # JSON parsing error
                raise ProviderError("Invalid JSON response from provider.") from e
                
            await asyncio.sleep(backoff)
            backoff *= self.backoff_factor
            
        raise RetryExhaustedError(f"Failed to fetch {url} after {self.max_retries} attempts.")

    async def get(self, url: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return await self._request("GET", url, params=params, headers=headers)

    async def post(self, url: str, json_data: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return await self._request("POST", url, json=json_data, headers=headers)
