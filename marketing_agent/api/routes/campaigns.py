"""Campaign resource routes — RESTful campaign state management."""

import logging
from typing import Optional, Any
import asyncio

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from google.cloud.firestore_v1.client import Client

from marketing_agent.api.dependencies import get_orchestrator, get_db
from marketing_agent.api.auth import get_current_user
from marketing_agent.orchestrator import MarketingOrchestrator
from marketing_agent.state import CampaignState
from marketing_agent.services.storage.campaign_repository import CampaignRepository
from marketing_agent.models import CampaignResponse, CampaignStatus

from research.orchestrator.workflow import ResearchWorkflow
from research.orchestrator import ProviderRegistry
from marketing_agent.services.llm.gemini import GeminiLLMService
from research.orchestrator.executor import ResearchExecutor
from research.orchestrator.aggregator import ResultAggregator
from research.providers.serpapi import SerpAPIProvider
from research.models.context import ResearchContext

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Request Schemas ───────────────────────────────────────────────────────────

class CreateCampaignRequest(BaseModel):
    id: str
    name: str
    workflow: str
    config: dict


class UpdateCampaignRequest(BaseModel):
    name: Optional[str] = None
    workflow: Optional[str] = None
    config: Optional[dict] = None


# ── Helper ────────────────────────────────────────────────────────────────────

def map_config_to_state(state: CampaignState, config: dict) -> None:
    """Map dynamic configuration parameters into the CampaignState model."""
    if "product_name" in config:
        state.product_name = config["product_name"]
    if "product_description" in config:
        state.product_description = config["product_description"]
    if "target_audience" in config:
        state.target_audience = config["target_audience"]
    if "industry" in config:
        state.industry = config["industry"]
    if "location" in config:
        state.location = config["location"]
    if "platforms" in config:
        state.platforms = config["platforms"]
    if "scrapers" in config:
        state.scrapers = config["scrapers"]
    if "image_mode" in config:
        state.image_mode = config["image_mode"]
    if "instructions" in config:
        state.instructions = config["instructions"]


async def execute_serp_research(product_name: str, target_audience: str) -> dict:
    """Helper to run the research subsystem standalone for the UI."""
    registry = ProviderRegistry()
    registry.register(SerpAPIProvider())
    
    executor = ResearchExecutor(concurrency_limit=5)
    aggregator = ResultAggregator()
    workflow = ResearchWorkflow(registry, executor, aggregator)
    
    context = ResearchContext(
        product_description=product_name,
        company_name=None,
        industry=None,
        country=None,
        language=None,
        deep_research=False,
        metadata={"target_audience": target_audience}
    )
    
    report = await workflow.run(context)
    return report.model_dump()


async def run_research_task(campaign_id: str):
    """Background task to run research and update the campaigns table."""
    from firebase_admin import firestore
    db = firestore.client(database_id="marketing")
    repo = CampaignRepository(db)
    try:
        campaign = repo.get_campaign(campaign_id)
        if not campaign:
            logger.error(f"Campaign {campaign_id} not found in background task")
            return

        # Build ResearchContext directly from the campaign and product relation
        product = repo.get_product(campaign.get("product_id"))
        product_name = campaign.get("product_name") or (product.get("name") if product else "")
        product_description = product.get("description") if product else ""
        
        config_data = campaign.get("config", {}).get("data", {}) if campaign.get("config") else {}
        target_audience = config_data.get("target_audience") or (product.get("target_audience") if product else "General audience")

        logger.info(f"Running SerpAPI research for campaign {campaign_id} ({product_name})")

        # Run research workflow
        report = await execute_serp_research(
            product_name=product_name,
            target_audience=target_audience
        )

        # Store research results
        results = {
            "research_report": report
        }
        repo.save_results(campaign_id, results)
        repo.update_campaign(campaign_id, status=CampaignStatus.DRAFT)
        logger.info(f"Research completed successfully for campaign {campaign_id}")
    except Exception as e:
        logger.error(f"Research failed for campaign {campaign_id}: {e}", exc_info=True)
        # Update status to failed
        repo.update_campaign(campaign_id, status=CampaignStatus.FAILED)
        # Store error in results JSON
        repo.save_results(campaign_id, {"errors": [str(e)]})


async def run_campaign_workflow_task(
    campaign_id: str,
    state: CampaignState,
    orchestrator: MarketingOrchestrator,
):
    from firebase_admin import firestore
    db = firestore.client(database_id="marketing")
    repo = CampaignRepository(db)
    try:
        result = await orchestrator.run(state.workflow_name, state)
        repo.save_results(campaign_id, result.model_dump(mode="json"))
        repo.update_campaign(campaign_id, status=CampaignStatus.READY)
    except ValueError as exc:
        state.fail(str(exc))
        repo.save_results(campaign_id, state.model_dump(mode="json"))
        repo.update_campaign(campaign_id, status=CampaignStatus.FAILED)
    except Exception as exc:
        state.fail(f"Unhandled error during execution: {str(exc)}")
        repo.save_results(campaign_id, state.model_dump(mode="json"))
        repo.update_campaign(campaign_id, status=CampaignStatus.FAILED)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("", response_model=CampaignResponse, status_code=201)
async def create_campaign(
    body: CreateCampaignRequest,
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Create or register a persistent campaign and store workflow and config parameters."""
    repo = CampaignRepository(db)
    campaign = repo.get_campaign(body.id)
    if not campaign:
        raise HTTPException(
            status_code=404,
            detail=f"Campaign {body.id} not found in the database. Please create it via the frontend first."
        )
    if campaign.get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to modify this campaign")

    # Update config and status to draft
    campaign = repo.update_campaign(
        body.id,
        workflow=body.workflow,
        config=body.config,
        status=CampaignStatus.DRAFT
    )
    product = repo.get_product(campaign.get("product_id"))
    return CampaignResponse.from_firestore_doc(campaign, product)


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Retrieve metadata, config, status, and results for a campaign."""
    repo = CampaignRepository(db)
    campaign = repo.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to access this campaign")
    product = repo.get_product(campaign.get("product_id"))
    return CampaignResponse.from_firestore_doc(campaign, product)


@router.patch("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    body: UpdateCampaignRequest,
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Update campaign metadata and configuration."""
    repo = CampaignRepository(db)
    campaign = repo.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to modify this campaign")

    update_data = {}
    if body.name is not None:
        update_data["product_name"] = body.name
    if body.workflow is not None:
        update_data["workflow"] = body.workflow
    if body.config is not None:
        # Merge config
        current_config = dict(campaign.get("config", {})) if campaign.get("config") else {}
        current_config.update(body.config)
        update_data["config"] = current_config

    campaign = repo.update_campaign(campaign_id, **update_data)
    product = repo.get_product(campaign.get("product_id"))
    return CampaignResponse.from_firestore_doc(campaign, product)


@router.post("/{campaign_id}/run", response_model=CampaignResponse)
async def run_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    orchestrator: MarketingOrchestrator = Depends(get_orchestrator),
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Execute the configured campaign workflow using stored inputs."""
    repo = CampaignRepository(db)
    campaign = repo.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to run this campaign")

    state = CampaignState(
        campaign_id=campaign_id,
        workflow_name=campaign.get("workflow") or "default",
        status="running",
        product_name=campaign.get("product_name") or "",
    )
    
    config_data = campaign.get("config", {}).get("data", {}) if campaign.get("config") else {}
    if config_data:
        map_config_to_state(state, config_data)
        
    state.add_log(f"Starting execution of workflow: {state.workflow_name}")
    
    campaign = repo.update_campaign(campaign_id, status=CampaignStatus.RUNNING)
    background_tasks.add_task(run_campaign_workflow_task, campaign_id, state, orchestrator)
    
    product = repo.get_product(campaign.get("product_id"))
    return CampaignResponse.from_firestore_doc(campaign, product)


@router.post("/{campaign_id}/research", response_model=CampaignResponse)
async def run_campaign_research(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Trigger the research phase for a campaign in the background."""
    repo = CampaignRepository(db)
    campaign = repo.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to research this campaign")
        
    repo.update_campaign(campaign_id, status=CampaignStatus.RESEARCHING)
    background_tasks.add_task(run_research_task, campaign_id)
    
    product = repo.get_product(campaign.get("product_id"))
    return CampaignResponse.from_firestore_doc(campaign, product)
