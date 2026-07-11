import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from research.models.context import ResearchContext
from research.providers.serpapi import SerpAPIProvider
from research.utils.http import HTTPClient
from research.exceptions import ProviderError, TimeoutError, RetryExhaustedError

@pytest.fixture
def mock_context():
    return ResearchContext(product_description="Test SaaS")

@pytest.fixture
def serpapi_provider():
    # Use low timeout and retries for faster tests
    return SerpAPIProvider(api_key="valid-key", timeout=1.0, max_results=2)

@pytest.mark.asyncio
async def test_missing_api_key(mock_context):
    provider = SerpAPIProvider(api_key="")
    result = await provider.fetch(mock_context)
    assert result.status == "failed"
    assert "API key missing" in result.error

@pytest.mark.asyncio
async def test_valid_response(serpapi_provider, mock_context):
    mock_data = {
        "organic_results": [
            {"position": 1, "title": "Comp 1", "link": "http://c1.com"},
            {"position": 4, "title": "Comp 2", "link": "http://c2.com"}
        ],
        "news_results": [
            {"title": "News 1", "link": "http://n1.com", "source": "News Network", "date": "1h"}
        ],
        "related_searches": [
            {"query": "saas meaning", "link": "http://search.com"}
        ],
        "people_also_ask": [
            {"question": "what is saas?", "link": "http://question.com"}
        ],
        "knowledge_graph": {
            "title": "Software as a service",
            "website": "http://saas.com"
        }
    }
    
    with patch.object(HTTPClient, 'get', new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_data
        result = await serpapi_provider.fetch(mock_context)
        
        assert result.status == "success"
        assert result.raw_data == mock_data
        
        normalized = result.normalized_data
        assert len(normalized["competitors"]) == 3 # 2 organic + 1 KG
        assert normalized["competitors"][0].confidence == 0.9
        assert normalized["competitors"][1].confidence == 0.7
        assert normalized["competitors"][2].confidence == 0.95
        
        assert len(normalized["news"]) == 1
        assert len(normalized["trends"]) == 1
        assert len(normalized["audience"]) == 1
        assert len(normalized["technologies"]) == 0

@pytest.mark.asyncio
async def test_invalid_api_key(serpapi_provider, mock_context):
    with patch.object(HTTPClient, 'get', new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = ProviderError("HTTP 401: Unauthorized")
        with pytest.raises(RetryExhaustedError) as exc:
            await serpapi_provider.fetch(mock_context)
        assert "401" in str(exc.value)

@pytest.mark.asyncio
async def test_timeout(serpapi_provider, mock_context):
    with patch.object(HTTPClient, 'get', new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = TimeoutError("Request timed out")
        with pytest.raises(RetryExhaustedError):
            await serpapi_provider.fetch(mock_context)

@pytest.mark.asyncio
async def test_malformed_json(serpapi_provider, mock_context):
    with patch.object(HTTPClient, 'get', new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = ProviderError("Invalid JSON response from provider.")
        with pytest.raises(RetryExhaustedError):
            await serpapi_provider.fetch(mock_context)

@pytest.mark.asyncio
async def test_empty_search_results(serpapi_provider, mock_context):
    with patch.object(HTTPClient, 'get', new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {}  # Empty JSON
        result = await serpapi_provider.fetch(mock_context)
        
        assert result.status == "success"
        assert result.normalized_data["competitors"] == []
        assert result.normalized_data["news"] == []
        assert result.normalized_data["trends"] == []
        assert result.normalized_data["audience"] == []

@pytest.mark.asyncio
async def test_rate_limiting(serpapi_provider, mock_context):
    with patch.object(HTTPClient, 'get', new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = ProviderError("HTTP 429: Too Many Requests")
        with pytest.raises(RetryExhaustedError) as exc:
            await serpapi_provider.fetch(mock_context)
        assert "429" in str(exc.value)
