from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone

class ResearchMetadata(BaseModel):
    completed_providers: List[str] = []
    failed_providers: List[str] = []
    partial_providers: List[str] = []
    execution_time: float = 0.0
    generated_at: str = ""
    schema_version: str = "1.0.0"
    
    def __init__(self, **data):
        super().__init__(**data)
        if not self.generated_at:
            self.generated_at = datetime.now(timezone.utc).isoformat()
