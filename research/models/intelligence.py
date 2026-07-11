from typing import List, Optional, Any, Dict
from pydantic import BaseModel, HttpUrl
from research.models.metadata import ResearchMetadata

class BaseEntity(BaseModel):
    confidence: Optional[float] = None
    provider: Optional[str] = None
    source_url: Optional[str] = None

class CompetitorResult(BaseEntity):
    name: str
    domain: Optional[str] = None
    similarity_score: Optional[float] = None

class TrendResult(BaseEntity):
    keyword: str
    volume: Optional[int] = None
    region: Optional[str] = None

class AudienceResult(BaseEntity):
    segment: str
    size: Optional[int] = None

class NewsResult(BaseEntity):
    title: str
    url: str
    source: str
    published_at: Optional[str] = None

class TechnologyResult(BaseEntity):
    name: str
    category: Optional[str] = None
    maturity: Optional[str] = None

class ResearchIntelligence(BaseModel):
    competitors: List[CompetitorResult] = []
    audience: List[AudienceResult] = []
    trends: List[TrendResult] = []
    news: List[NewsResult] = []
    technologies: List[TechnologyResult] = []

class ResearchReport(BaseModel):
    metadata: ResearchMetadata
    intelligence: ResearchIntelligence
