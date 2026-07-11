from typing import Any, Dict, Optional, Literal
from pydantic import BaseModel, Field

class ProviderResult(BaseModel):
    provider_name: str
    status: Literal["success", "partial", "failed"]
    raw_data: Optional[Any] = None
    normalized_data: Optional[Any] = None
    error: Optional[str] = None
    execution_time: float = 0.0
    retries: int = 0
