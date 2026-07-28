import os
import sys
import json
import urllib.request
import urllib.error
import urllib.parse
from marketing_agent.configs.settings import get_settings

def test_serpapi():
    settings = get_settings()
    api_key = settings.serpapi_api_key

    print("=== Environment Verification ===")
    print(f"SERPAPI_API_KEY loaded: {bool(api_key)}")
    if api_key:
        print(f"Length: {len(api_key)}")
        print(f"Prefix: {api_key[:4]}")
        print(f"Suffix: {api_key[-4:]}")
    else:
        print("API Key is missing or empty.")
        return

    print("\n=== Performing Search ===")
    query = "OpenAI"
    num = 3
    params = {
        "engine": "google",
        "api_key": api_key,
        "q": query,
        "num": str(num),
        "output": "json",
    }
    
    url = f"{settings.serpapi_base_url}?{urllib.parse.urlencode(params)}"
    
    # Hide the API key in the printed URL
    safe_params = params.copy()
    safe_params["api_key"] = "***"
    safe_url = f"{settings.serpapi_base_url}?{urllib.parse.urlencode(safe_params)}"
    
    print(f"Request URL: {safe_url}")

    try:
        req = urllib.request.Request(url, headers={"User-Agent": settings.user_agent})
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"Response status: {resp.status}")
            print("Response headers:")
            for k, v in resp.getheaders():
                print(f"  {k}: {v}")
            body = resp.read().decode()
            print("\nResponse body (parsed):")
            print(json.dumps(json.loads(body), indent=2))
    except urllib.error.HTTPError as exc:
        print(f"Response status: {exc.code}")
        print("Response headers:")
        for k, v in exc.headers.items():
            print(f"  {k}: {v}")
        print("\nResponse body (Raw Error):")
        print(exc.read().decode())
    except Exception as exc:
        print(f"Unexpected error: {exc}")

if __name__ == "__main__":
    test_serpapi()
