import os
from typing import Dict, Any

class Config:
    def __init__(self):
        self.settings: Dict[str, Any] = {
            "MAX_CONCURRENCY": int(os.environ.get("MAX_CONCURRENCY", 10)),
            "DEFAULT_TIMEOUT": float(os.environ.get("DEFAULT_TIMEOUT", 30.0)),
            "SERPAPI_API_KEY": os.environ.get("SERPAPI_API_KEY", ""),
            "SERPAPI_TIMEOUT": float(os.environ.get("SERPAPI_TIMEOUT", 15.0)),
            "SERPAPI_MAX_RESULTS": int(os.environ.get("SERPAPI_MAX_RESULTS", 5)),
        }

    def get(self, key: str, default: Any = None) -> Any:
        return self.settings.get(key, default)

config = Config()
