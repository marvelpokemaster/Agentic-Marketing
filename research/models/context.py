from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class ResearchContext(BaseModel):
    product_description: str = Field(description="Description of the product or service")
    company_name: Optional[str] = Field(None, description="Name of the company")
    industry: Optional[str] = Field(None, description="Industry category")
    country: Optional[str] = Field(None, description="Target country")
    language: Optional[str] = Field(None, description="Target language")
    deep_research: bool = Field(False, description="Whether to perform extensive deep research")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional context metadata")
