from enum import Enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    RESEARCHING = "researching"
    READY = "ready"
    RUNNING = "running"
    FAILED = "failed"



class CampaignResponse(BaseModel):
    campaign_id: str
    workflow_name: str
    created_at: datetime
    product_name: str
    product_description: str
    target_audience: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    platforms: List[str] = []
    scrapers: List[str] = []
    image_mode: str = "none"
    instructions: str = ""
    leads: List[Any] = []
    assets: List[Any] = []
    research_summary: Optional[str] = None
    research_report: Optional[Dict[str, Any]] = None
    status: str
    errors: List[str] = []
    log: List[str] = []

    @classmethod
    def from_firestore_doc(cls, campaign: Dict[str, Any], product: Optional[Dict[str, Any]] = None) -> "CampaignResponse":
        config_data = campaign.get("config", {}).get("data", {}) if campaign.get("config") else {}
        results_data = campaign.get("results", {}) if campaign.get("results") else {}
        
        product_desc = ""
        product_ind = ""
        product_target = None
        if product:
            product_desc = product.get("description", "")
            product_ind = product.get("industry", "")
            product_target = product.get("target_audience")
            
        target_audience = config_data.get("target_audience") or product_target
        
        created_at = campaign.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except:
                created_at = datetime.now(timezone.utc)
        elif not created_at:
            created_at = datetime.now(timezone.utc)

        return cls(
            campaign_id=campaign.get("id", ""),
            workflow_name=campaign.get("workflow", ""),
            created_at=created_at,
            product_name=campaign.get("product_name") or (product.get("name") if product else ""),
            product_description=product_desc,
            target_audience=target_audience,
            industry=product_ind,
            location=config_data.get("location"),
            platforms=campaign.get("platforms", []),
            scrapers=config_data.get("scrapers", []),
            image_mode=config_data.get("image_mode", "none"),
            instructions=config_data.get("instructions", ""),
            leads=results_data.get("leads", []),
            assets=results_data.get("assets", []),
            research_summary=results_data.get("research_summary"),
            research_report=results_data.get("research_report"),
            status=campaign.get("status", "draft"),
            errors=results_data.get("errors", []),
            log=results_data.get("log", []),
        )
