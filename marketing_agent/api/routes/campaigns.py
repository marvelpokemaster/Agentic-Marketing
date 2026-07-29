"""Campaign resource routes — RESTful campaign state management & multi-agent orchestration."""

import logging
import hashlib
import time
from typing import Optional, Any, Dict, List
import asyncio
from datetime import datetime, timezone

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
from marketing_agent.capabilities.research_planner import ResearchPlannerCapability
from marketing_agent.capabilities.strategy import StrategyCapability
from marketing_agent.capabilities.analyst import ResearchAnalystCapability
from marketing_agent.capabilities.content import ContentCapability

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


class RunCampaignRequest(BaseModel):
    refresh_type: Optional[str] = "none"  # "none" | "research" | "strategy" | "everything"
    resume: Optional[bool] = False


# ── Helper ────────────────────────────────────────────────────────────────────

def calculate_product_hash(product_name: str, product_description: str, industry: str, target_audience: str) -> str:
    raw = f"{product_name}|{product_description}|{industry}|{target_audience}".strip().lower()
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


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


# ── Multi-Agent Orchestrator Worker ─────────────────────────────────────────

async def run_full_campaign_task(campaign_id: str, refresh_type: str = "none", resume: bool = False):
    """
    Unified multi-agent campaign orchestrator background task:
    1. 🧠 Planner Agent (ResearchPlannerCapability)
    2. 🔍 Research Agent (SerpAPI max 5 queries x 10 organic results)
    3. 📊 Intelligence Agent (ResearchAnalystCapability)
    4. 🎯 Strategy Agent (StrategyCapability)
    5. ✍️ Content Agent (ContentCapability)
    6. 🎨 Creative Agent (Visuals / mock URLs)
    7. 🏁 Ready
    """
    from firebase_admin import firestore
    db = firestore.client(database_id="marketing")
    repo = CampaignRepository(db)
    
    campaign = repo.get_campaign(campaign_id)
    if not campaign:
        logger.error(f"Campaign {campaign_id} not found")
        return

    # Fetch product and campaign config context
    product = repo.get_product(campaign.get("product_id"))
    product_name = campaign.get("product_name") or (product.get("name") if product else "")
    product_description = product.get("description") if product else ""
    
    config_data = campaign.get("config", {}).get("data", {}) if campaign.get("config") else {}
    target_audience = config_data.get("target_audience") or (product.get("target_audience") if product else "General audience")
    industry = config_data.get("industry") or (product.get("industry") if product else "")
    platforms = config_data.get("platforms") or campaign.get("platforms") or ["instagram", "facebook", "linkedin"]

    current_product_hash = calculate_product_hash(product_name, product_description, industry, target_audience)

    results = dict(campaign.get("results", {})) if campaign.get("results") else {}
    cache_meta = dict(results.get("cache_metadata", {})) if results.get("cache_metadata") else {}
    
    execution = dict(campaign.get("execution", {})) if campaign.get("execution") else {}
    stages_info = dict(execution.get("stages", {}))

    def update_execution(agent_name: str, message: str, stage_key: str, status: str, duration: Optional[float] = None, query_progress: Optional[str] = None):
        nonlocal execution, stages_info
        now_iso = datetime.now(timezone.utc).isoformat()
        
        st = stages_info.get(stage_key, {})
        st["status"] = status
        if status == "running":
            st["started_at"] = now_iso
        elif status in ["completed", "failed"]:
            st["finished_at"] = now_iso
            if duration is not None:
                st["duration"] = round(duration, 2)
        if query_progress:
            st["query_progress"] = query_progress
            
        stages_info[stage_key] = st
        execution["current_agent"] = agent_name
        execution["current_message"] = message
        execution["stage"] = stage_key
        execution["stages"] = stages_info
        
        status_val = CampaignStatus.RUNNING if stage_key != "ready" else CampaignStatus.DRAFT
        repo.update_campaign(campaign_id, status=status_val, execution=execution)

    current_stage = "planning"
    try:
        # STAGE 1: 🧠 Planner Agent
        current_stage = "planning"
        if resume and stages_info.get("planning", {}).get("status") == "completed" and "planner" in results:
            logger.info(f"Resuming: Skipping planning for campaign {campaign_id}")
            plan = results["planner"]
        elif (
            "planner" in results
            and cache_meta.get("product_hash") == current_product_hash
            and refresh_type not in ["everything"]
        ):
            logger.info(f"Cache hit: Reusing planner for campaign {campaign_id}")
            plan = results["planner"]
            update_execution("🧠 Planner Agent", "Reused existing product plan", "planning", "completed", duration=0.1)
        else:
            t0 = time.time()
            update_execution("🧠 Planner Agent", "Understanding your product & audience...", "planning", "running")
            planner_agent = ResearchPlannerCapability()
            planner_res = await planner_agent.generate_plan(
                product_name=product_name,
                product_description=product_description,
                industry=industry,
                target_audience=target_audience,
            )
            plan = planner_res.model_dump()
            results["planner"] = plan
            repo.save_results(campaign_id, {"planner": plan})
            update_execution("🧠 Planner Agent", "Understood product context & search goals", "planning", "completed", duration=time.time() - t0)

        search_queries = plan.get("search_queries", []) if isinstance(plan, dict) else getattr(plan, "search_queries", [])
        search_queries = search_queries[:5] if search_queries else ["market overview"]

        # STAGE 2: 🔍 Research Agent
        current_stage = "researching"
        serp_cache_valid = (
            ("raw_research" in results or "research_report" in results)
            and cache_meta.get("product_hash") == current_product_hash
            and refresh_type not in ["research", "everything"]
        )
        
        if resume and stages_info.get("researching", {}).get("status") == "completed" and ("raw_research" in results or "research_report" in results):
            logger.info(f"Resuming: Skipping research execution for campaign {campaign_id}")
            raw_report = results.get("raw_research", results.get("research_report"))
        elif serp_cache_valid:
            logger.info(f"Cache hit: Reusing SerpAPI search results for campaign {campaign_id}")
            raw_report = results.get("raw_research", results.get("research_report"))
            cache_meta["cache_hit"] = True
            update_execution("🔍 Research Agent", "Reused cached market search data", "researching", "completed", duration=0.1)
        else:
            t0 = time.time()
            update_execution("🔍 Research Agent", f"Searching competitors & market trends (0/{len(search_queries)})...", "researching", "running")
            
            provider = SerpAPIProvider()
            aggregator = ResultAggregator()
            provider_results = []
            
            for idx, q in enumerate(search_queries, 1):
                update_execution(
                    "🔍 Research Agent",
                    f"Searching query {idx}/{len(search_queries)}: '{q}'",
                    "researching",
                    "running",
                    query_progress=f"{idx}/{len(search_queries)}"
                )
                context = ResearchContext(
                    product_description=q,
                    company_name=None,
                    industry=None,
                    country=None,
                    language=None,
                    deep_research=False,
                    metadata={"target_audience": target_audience}
                )
                try:
                    res = await provider.fetch(context)
                    provider_results.append(res)
                except Exception as exc:
                    logger.warning(f"SerpAPI search failed for query '{q}': {exc}")
            
            await provider.close()
            aggregated = aggregator.aggregate(provider_results)
            raw_report = aggregated.model_dump()
            
            results["raw_research"] = raw_report
            cache_meta.update({
                "product_hash": current_product_hash,
                "serp_query_count": len(search_queries),
                "cache_hit": False,
                "generated_at": datetime.now(timezone.utc).isoformat()
            })
            results["cache_metadata"] = cache_meta
            repo.save_results(campaign_id, {"raw_research": raw_report, "cache_metadata": cache_meta})
            update_execution("🔍 Research Agent", f"Completed {len(search_queries)} market searches", "researching", "completed", duration=time.time() - t0)

        # STAGE 3: 📊 Intelligence Agent
        current_stage = "analyzing"
        if resume and stages_info.get("analyzing", {}).get("status") == "completed" and "research_report" in results:
            logger.info(f"Resuming: Skipping intelligence analysis for campaign {campaign_id}")
            report_dict = results["research_report"]
        elif (
            "research_report" in results
            and cache_meta.get("product_hash") == current_product_hash
            and refresh_type not in ["research", "everything"]
        ):
            logger.info(f"Cache hit: Reusing intelligence report for campaign {campaign_id}")
            report_dict = results["research_report"]
            update_execution("📊 Intelligence Agent", "Reused curated intelligence brief", "analyzing", "completed", duration=0.1)
        else:
            t0 = time.time()
            update_execution("📊 Intelligence Agent", "Filtering raw results & inferring top competitors...", "analyzing", "running")
            analyst_agent = ResearchAnalystCapability()
            curated_report = await analyst_agent.analyze_raw_research(
                product_name=product_name,
                product_description=product_description,
                raw_report=raw_report,
                industry=industry,
                target_audience=target_audience,
            )
            report_dict = curated_report.model_dump()
            results["research_report"] = report_dict
            repo.save_results(campaign_id, {"research_report": report_dict})
            update_execution("📊 Intelligence Agent", "Curated high-relevance executive brief", "analyzing", "completed", duration=time.time() - t0)

        # STAGE 4: 🎯 Strategy Agent
        current_stage = "strategizing"
        if resume and stages_info.get("strategizing", {}).get("status") == "completed" and "strategy" in results:
            logger.info(f"Resuming: Skipping strategy generation for campaign {campaign_id}")
            strategy_dict = results["strategy"]
        elif (
            "strategy" in results
            and cache_meta.get("product_hash") == current_product_hash
            and refresh_type not in ["strategy", "everything"]
        ):
            logger.info(f"Cache hit: Reusing marketing strategy for campaign {campaign_id}")
            strategy_dict = results["strategy"]
            update_execution("🎯 Strategy Agent", "Reused existing GTM strategy", "strategizing", "completed", duration=0.1)
        else:
            t0 = time.time()
            update_execution("🎯 Strategy Agent", "Building go-to-market positioning & content pillars...", "strategizing", "running")
            strategy_agent = StrategyCapability()
            strategy_res = await strategy_agent.generate_strategy(
                product_name=product_name,
                product_description=product_description,
                research_report=report_dict,
                planner_output=plan,
                target_audience=target_audience,
                platforms=platforms,
            )
            strategy_dict = strategy_res.model_dump()
            results["strategy"] = strategy_dict
            repo.save_results(campaign_id, {"strategy": strategy_dict})
            update_execution("🎯 Strategy Agent", "Formulated GTM strategy", "strategizing", "completed", duration=time.time() - t0)

        # STAGE 5: ✍️ Content Agent
        current_stage = "generating_content"
        if resume and stages_info.get("generating_content", {}).get("status") == "completed" and "assets" in results and len(results["assets"]) > 0:
            logger.info(f"Resuming: Skipping content generation for campaign {campaign_id}")
            assets_list = results["assets"]
        elif "assets" in results and len(results["assets"]) > 0 and refresh_type not in ["everything"]:
            logger.info(f"Cache hit: Reusing content assets for campaign {campaign_id}")
            assets_list = results["assets"]
            update_execution("✍️ Content Agent", "Reused generated platform posts", "generating_content", "completed", duration=0.1)
        else:
            t0 = time.time()
            update_execution("✍️ Content Agent", f"Writing copy for {len(platforms)} platforms...", "generating_content", "running")
            llm_service = GeminiLLMService()
            content_capability = ContentCapability(llm=llm_service)
            
            c_state = CampaignState(
                campaign_id=campaign_id,
                workflow_name=campaign.get("workflow", "default"),
                product_name=product_name,
                product_description=product_description,
                target_audience=target_audience,
                platforms=platforms,
                strategy=strategy_dict
            )
            res_state = await content_capability._execute(c_state)
            assets_list = [a.model_dump() for a in res_state.assets]
            results["assets"] = assets_list
            repo.save_results(campaign_id, {"assets": assets_list})
            update_execution("✍️ Content Agent", f"Generated copy for {len(assets_list)} platforms", "generating_content", "completed", duration=time.time() - t0)

        # STAGE 6: 🎨 Creative Agent
        current_stage = "generating_images"
        t0 = time.time()
        update_execution("🎨 Creative Agent", "Generating visuals for campaign creatives...", "generating_images", "running")
        
        updated_assets = []
        for asset in assets_list:
            asset_dict = dict(asset) if isinstance(asset, dict) else asset.model_dump()
            if not asset_dict.get("creative_url"):
                platform = asset_dict.get("platform", "social")
                headline = asset_dict.get("headline", "Creative")
                bg_color = "6366f1" if platform == "instagram" else ("0866ff" if platform == "facebook" else "0a66c2")
                text_clean = headline[:30].replace(" ", "+") or platform.capitalize()
                asset_dict["creative_url"] = f"https://placehold.co/1080x1080/{bg_color}/ffffff?text={platform.capitalize()}%3A+{text_clean}"
            updated_assets.append(asset_dict)
            
        results["assets"] = updated_assets
        repo.save_results(campaign_id, {"assets": updated_assets})
        update_execution("🎨 Creative Agent", f"Generated visuals for {len(updated_assets)} posts", "generating_images", "completed", duration=time.time() - t0)

        # STAGE 7: 🏁 Ready
        current_stage = "ready"
        update_execution("🏁 Campaign Ready", "Campaign assets are ready for review.", "ready", "completed")
        repo.update_campaign(campaign_id, status=CampaignStatus.DRAFT, last_research_at=datetime.now(timezone.utc).isoformat())
        logger.info(f"Multi-Agent Campaign Pipeline finished successfully for campaign {campaign_id}")

    except Exception as exc:
        logger.error(f"Campaign pipeline failed at stage '{current_stage}' for campaign {campaign_id}: {exc}", exc_info=True)
        update_execution("✕ System Alert", f"Execution failed at {current_stage}: {str(exc)}", current_stage, "failed")
        repo.update_campaign(
            campaign_id,
            status=CampaignStatus.FAILED,
            execution={
                **execution,
                "stage": "failed",
                "failed_stage": current_stage,
                "error_message": str(exc),
                "current_agent": "✕ System Alert",
                "current_message": f"Failed at stage '{current_stage}': {str(exc)}"
            }
        )
        repo.save_results(campaign_id, {"errors": [str(exc)]})


# ── Route Handlers ────────────────────────────────────────────────────────────

@router.post("", response_model=CampaignResponse)
async def create_campaign(
    body: CreateCampaignRequest,
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Create a new campaign resource."""
    repo = CampaignRepository(db)
    
    product_id = body.config.get("product_id")
    product = repo.get_product(product_id)
    if not product:
        raise HTTPException(status_code=400, detail="Associated product not found")
        
    doc_data = {
        "user_id": uid,
        "name": body.name,
        "product_id": product_id,
        "product_name": product.get("name"),
        "workflow": body.workflow,
        "status": CampaignStatus.DRAFT,
        "config": body.config,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    doc_ref = db.collection('campaigns').document(body.id)
    doc_ref.set(doc_data)
    
    saved = repo.get_campaign(body.id)
    return CampaignResponse.from_firestore_doc(saved, product)


@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> List[CampaignResponse]:
    """List all campaigns for the current authenticated user."""
    repo = CampaignRepository(db)
    docs = db.collection('campaigns').where('user_id', '==', uid).stream()
    campaigns = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        product = repo.get_product(data.get("product_id"))
        campaigns.append(CampaignResponse.from_firestore_doc(data, product))
    return campaigns


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Get details of a single campaign."""
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
    body: Optional[RunCampaignRequest] = None,
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Execute the multi-agent campaign pipeline."""
    repo = CampaignRepository(db)
    campaign = repo.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to run this campaign")

    refresh_type = body.refresh_type if body and body.refresh_type else "none"
    resume = body.resume if body and body.resume else False

    execution = campaign.get("execution", {})
    current_stage = execution.get("stage")
    
    # Check if execution is currently running
    if current_stage in ["planning", "researching", "analyzing", "strategizing", "generating_content", "generating_images"] and not resume:
        raise HTTPException(status_code=409, detail="Campaign execution already in progress")

    campaign = repo.update_campaign(campaign_id, status=CampaignStatus.RUNNING)
    background_tasks.add_task(run_full_campaign_task, campaign_id, refresh_type, resume)
    
    product = repo.get_product(campaign.get("product_id"))
    return CampaignResponse.from_firestore_doc(campaign, product)


@router.post("/{campaign_id}/research", response_model=CampaignResponse)
async def run_campaign_research(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    force_refresh: bool = False,
    db: Client = Depends(get_db),
    uid: str = Depends(get_current_user),
) -> CampaignResponse:
    """Trigger research phase for a campaign (backward-compatible wrapper around orchestrator)."""
    repo = CampaignRepository(db)
    campaign = repo.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to research this campaign")
        
    execution = campaign.get("execution", {})
    if execution.get("stage") in ["planning", "researching", "analyzing"]:
        raise HTTPException(status_code=409, detail="Research already in progress")
        
    refresh_type = "research" if force_refresh else "none"
    campaign = repo.update_campaign(campaign_id, status=CampaignStatus.RESEARCHING)
    background_tasks.add_task(run_full_campaign_task, campaign_id, refresh_type, False)
    
    product = repo.get_product(campaign.get("product_id"))
    return CampaignResponse.from_firestore_doc(campaign, product)
