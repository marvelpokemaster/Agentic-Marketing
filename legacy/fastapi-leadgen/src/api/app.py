"""
src/api/app.py
──────────────
FastAPI app — lead gen, AI marketing, send execution, tracking, analytics.
"""

import asyncio
import json
import os
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.lead_generation import pipeline as lead_pipeline
from src.lead_generation.export.exporter import leads_to_csv, push_crm_webhook
from src.lead_generation.llm import extract_criteria
from src.lead_generation.outreach import generate_outreach
from src.lead_generation.outreach.ab_test import assign_variant, generate_subject_variants, get_active_winner
from src.lead_generation.outreach.email_sender import execute_email_send, parse_email_content
from src.lead_generation.outreach.whatsapp_sender import execute_whatsapp_stub
from src.lead_generation.scrapers import available_scrapers
from src.lead_generation.test_cases import list_test_cases, get_test_case
from src.marketing import pipeline as marketing_pipeline
from src.marketing.publish.meta_publisher import execute_meta_stub
from src.marketing.test_cases import list_test_cases as list_ad_test_cases
from src.shared.gmail_compose import build_gmail_compose_url, effective_send_to
from src.shared import agentic, analytics, lead_attachments, storage
from src.shared.config import config
from src.shared.external_api import retry_worker
from src.shared.funnel import advance
from src.shared.models import Lead, SearchCriteria

_UI_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ui")
_LEADS_FILE = os.path.join(config.outputs_dir, "leads.json")

# 1×1 transparent GIF
_TRACKING_GIF = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01"
    b"\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)

app = FastAPI(title="Agentic Marketing")


# ── Store ──────────────────────────────────────────────────────────────────
class Store:
    def __init__(self):
        self.leads: dict[str, Lead] = {}
        self.criteria: SearchCriteria | None = None
        self.current_campaign_id: str | None = None
        self.campaign_ad: dict | None = None
        self.marketer_email: str | None = None
        self.jobs: dict[str, dict] = {}
        self._load()

    def _load(self):
        if os.path.exists(_LEADS_FILE):
            try:
                with open(_LEADS_FILE) as f:
                    data = json.load(f)
                for row in data.get("leads", []):
                    lead = Lead.from_dict(row)
                    self.leads[lead.id] = lead
                if data.get("criteria"):
                    self.criteria = SearchCriteria.from_dict(data["criteria"])
                self.current_campaign_id = data.get("campaign_id")
                self.campaign_ad = data.get("campaign_ad")
                self.marketer_email = data.get("marketer_email")
            except (json.JSONDecodeError, OSError):
                pass

    def save(self):
        with open(_LEADS_FILE, "w") as f:
            json.dump(
                {
                    "criteria": self.criteria.to_dict() if self.criteria else None,
                    "campaign_id": self.current_campaign_id,
                    "campaign_ad": self.campaign_ad,
                    "marketer_email": self.marketer_email,
                    "leads": [l.to_dict() for l in self.leads.values()],
                },
                f,
                indent=2,
            )

    def update_lead(self, lead_id: str, **fields) -> Lead | None:
        lead = self.leads.get(lead_id)
        if not lead:
            return None
        for k, v in fields.items():
            if hasattr(lead, k):
                if k == "funnel_status" and isinstance(v, str):
                    v = advance(getattr(lead, "funnel_status", "scraped"), v)
                setattr(lead, k, v)
        self.save()
        return lead

    def set_leads(self, criteria: SearchCriteria, leads: list[Lead], *, brief: str = ""):
        self.criteria = criteria
        campaign = storage.get_or_create_campaign(
            brief=brief, criteria=criteria.to_dict() if criteria else None
        )
        self.current_campaign_id = campaign["id"]

        kept: dict[str, Lead] = {}
        for lead in self.leads.values():
            if lead.list_status in ("stored", "discarded", "cleared"):
                kept[lead.id] = lead
            elif lead.list_status == "inbox":
                lead.list_status = "cleared"
                kept[lead.id] = lead

        for lead in leads:
            lead.campaign_id = campaign["id"]
            lead.funnel_status = advance(lead.funnel_status or "scraped", "scored")
            lead.outreach_status = lead.outreach_status or "draft"
            lead.list_status = "inbox"
            kept[lead.id] = lead

        self.leads = kept
        self.save()

    def leads_by_status(self, status: str | None) -> list[Lead]:
        if not status or status == "all":
            return list(self.leads.values())
        return [l for l in self.leads.values() if l.list_status == status]

    def count_by_status(self) -> dict[str, int]:
        counts = {"inbox": 0, "stored": 0, "discarded": 0, "cleared": 0}
        for lead in self.leads.values():
            key = lead.list_status if lead.list_status in counts else "inbox"
            counts[key] += 1
        return counts

    def clear_inbox(self) -> int:
        n = 0
        for lead in self.leads.values():
            if lead.list_status == "inbox":
                lead.list_status = "cleared"
                n += 1
        if n:
            self.save()
        return n

    def clear_leads(self) -> int:
        count = len(self.leads)
        self.leads = {}
        self.save()
        return count


store = Store()


def _store_lead_fn(lead_id: str, **fields):
    store.update_lead(lead_id, **fields)


# ── Send execution helpers ─────────────────────────────────────────────────
def _execute_pending_send(pending: dict) -> dict:
    channel = pending.get("channel")
    ctx = pending.get("context", {})
    log_id = uuid.uuid4().hex[:12]

    if channel == "email":
        row = execute_email_send(
            log_id=log_id,
            store_lead_fn=_store_lead_fn,
            **ctx,
        )
    elif channel == "whatsapp":
        row = execute_whatsapp_stub(
            log_id=log_id,
            store_lead_fn=_store_lead_fn,
            **ctx,
        )
    elif channel == "meta_ad":
        row = execute_meta_stub(log_id=log_id, **ctx)
    else:
        raise HTTPException(400, f"Unknown channel: {channel}")

    storage.update_pending_send(pending["id"], status="executed", executed_at=_now())
    return row


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _apply_test_emails(
    leads: list[Lead],
    *,
    test_case_id: str | None,
    test_client_email: str | None,
    marketer_email: str | None,
) -> None:
    client = (test_client_email or "").strip()
    marketer = (marketer_email or "").strip()
    if not client and test_case_id:
        tc = get_test_case(test_case_id)
        if tc:
            client = (tc.get("test_client_email") or "").strip()
            if not marketer:
                marketer = (tc.get("marketer_email") or "").strip()
    if marketer:
        store.marketer_email = marketer
    if client:
        for lead in leads:
            lead.send_to_email = client


def _lead_attachment_ids(lead: Lead) -> list[str]:
    return list((lead.outreach or {}).get("attachment_ids") or [])


def _attachment_public(row: dict) -> dict:
    base = config.public_base_url.rstrip("/")
    if row.get("kind") == "url":
        return {**row, "url": row.get("url")}
    return {**row, "url": f"{base}/api/files/{row['id']}"}


def _sync_lead_attachments(lead: Lead) -> list[dict]:
    ids = _lead_attachment_ids(lead)
    rows = []
    for fid in ids:
        row = lead_attachments.get_file(fid)
        if row:
            rows.append(_attachment_public(row))
    return rows


def _queue_send(*, channel: str, lead: Lead | None, context: dict, scheduled_at: str | None = None) -> dict:
    if lead:
        context = {**context, "lead_name": lead.name}
    row = storage.append_pending_send(
        {
            "channel": channel,
            "lead_id": lead.id if lead else None,
            "campaign_id": context.get("campaign_id") or store.current_campaign_id,
            "context": context,
            "scheduled_at": scheduled_at,
            "status": "pending",
        }
    )
    if lead:
        store.update_lead(lead.id, outreach_status="pending_approval")
    return row


# ── Request models ─────────────────────────────────────────────────────────
class LeadListStatusRequest(BaseModel):
    list_status: str  # inbox | stored | discarded | cleared


class AgentPlanRequest(BaseModel):
    text: str = ""
    criteria: dict | None = None
    scrapers: list[str] = []
    max_results_per_target: int = 5


class ExtractRequest(BaseModel):
    text: str


class RunRequest(BaseModel):
    text: str = ""
    criteria: dict | None = None
    scrapers: list[str] = []
    max_results_per_target: int = 5
    test_case_id: str | None = None
    test_client_email: str | None = None
    marketer_email: str | None = None


class AdRequest(BaseModel):
    product: str
    objective: str = ""
    audience: str = ""
    tone: str = ""
    platform: str = ""
    branding: str = ""
    seed: int | None = None
    image_prompt: str | None = None


class ImageRequest(BaseModel):
    image_prompt: str
    seed: int | None = None


class OutreachGenerateRequest(BaseModel):
    instructions: str = ""
    image_mode: str = "none"  # none | campaign | per_lead


class OutreachUpdateRequest(BaseModel):
    email: str = ""
    whatsapp: str = ""
    image_url: str | None = None
    image_mode: str | None = None
    send_to_email: str | None = None


class SendToRequest(BaseModel):
    send_to_email: str = ""


class AttachmentUrlRequest(BaseModel):
    url: str
    filename: str | None = None


class PendingSendUpdateRequest(BaseModel):
    email: str | None = None
    subject: str | None = None
    body: str | None = None
    message: str | None = None
    ad: dict | None = None
    image_url: str | None = None
    send_to_email: str | None = None


class OptInRequest(BaseModel):
    whatsapp_opt_in: bool = False


class BatchSendRequest(BaseModel):
    lead_ids: list[str] = []
    use_ab: bool = True


class PublishRequest(BaseModel):
    ad: dict
    platform: str = "Instagram"
    scheduled_at: str | None = None


class WhatsAppWebhookRequest(BaseModel):
    log_id: str
    event: str = "reply"


# ── Startup / background ───────────────────────────────────────────────────
@app.on_event("startup")
async def _startup():
    asyncio.create_task(retry_worker())
    asyncio.create_task(_scheduled_publish_worker())


async def _scheduled_publish_worker():
    while True:
        await asyncio.sleep(30)
        now = _now()
        for pending in storage.list_pending_sends(status="pending"):
            sched = pending.get("scheduled_at")
            if not sched or sched > now:
                continue
            try:
                await asyncio.to_thread(_execute_pending_send, pending)
            except Exception as exc:
                storage.update_pending_send(pending["id"], status="failed", error=str(exc))


# ── Lead generation routes ─────────────────────────────────────────────────
@app.get("/api/scrapers")
def get_scrapers():
    return {"scrapers": available_scrapers()}


@app.post("/api/agent/plan")
def agent_plan(req: AgentPlanRequest):
    plan = agentic.build_campaign_plan(
        brief=req.text,
        criteria=req.criteria,
        scrapers=req.scrapers,
        max_results_per_target=req.max_results_per_target,
    )
    return {"plan": plan}


@app.get("/api/leads/test-cases")
def get_test_cases():
    return {"test_cases": list_test_cases()}


@app.post("/api/leads/extract")
def extract(req: ExtractRequest):
    criteria = extract_criteria(req.text)
    return {"criteria": criteria.to_dict()}


@app.post("/api/leads/run")
async def run_leads(req: RunRequest):
    if not req.scrapers:
        raise HTTPException(400, "Select at least one data source.")

    job_id = uuid.uuid4().hex[:12]
    store.jobs[job_id] = {"status": "running", "stage": "queued", "message": "Starting...", "log": [], "leads": []}

    criteria = SearchCriteria.from_dict(req.criteria) if req.criteria else None
    if criteria:
        criteria.max_results_per_target = req.max_results_per_target

    def progress(stage, message):
        job = store.jobs[job_id]
        job.update(stage=stage, message=message)
        job["log"].append({"stage": stage, "message": message})

    async def worker():
        try:
            crit, leads = await lead_pipeline.run(
                req.text,
                req.scrapers,
                criteria=criteria,
                max_results_per_target=req.max_results_per_target,
                progress=progress,
            )
            store.set_leads(crit, leads, brief=req.text)
            _apply_test_emails(
                list(store.leads.values()),
                test_case_id=req.test_case_id,
                test_client_email=req.test_client_email,
                marketer_email=req.marketer_email,
            )
            store.save()
            store.jobs[job_id].update(
                status="done",
                stage="done",
                criteria=crit.to_dict(),
                leads=[l.to_dict() for l in leads],
            )
        except Exception as exc:
            store.jobs[job_id].update(status="error", message=str(exc))
            store.jobs[job_id]["log"].append({"stage": "error", "message": str(exc)})

    asyncio.create_task(worker())
    return {"job_id": job_id}


@app.get("/api/leads/jobs/{job_id}")
def job_status(job_id: str):
    job = store.jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    return job


@app.get("/api/leads")
def list_leads(view: str = Query("inbox", pattern="^(inbox|stored|discarded|cleared|all)$")):
    leads = store.leads_by_status(view)
    leads.sort(key=lambda x: x.score or 0, reverse=True)
    return {
        "criteria": store.criteria.to_dict() if store.criteria else None,
        "campaign_id": store.current_campaign_id,
        "marketer_email": store.marketer_email,
        "view": view,
        "counts": store.count_by_status(),
        "leads": [l.to_dict() for l in leads],
    }


@app.post("/api/leads/clear-inbox")
def clear_inbox():
    count = store.clear_inbox()
    return {"cleared": count, "counts": store.count_by_status()}


@app.patch("/api/leads/{lead_id}/list-status")
def update_lead_list_status(lead_id: str, req: LeadListStatusRequest):
    status = req.list_status
    if status not in ("inbox", "stored", "discarded", "cleared"):
        raise HTTPException(400, "Invalid list_status.")
    lead = store.update_lead(lead_id, list_status=status)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    return {"lead": lead.to_dict(), "counts": store.count_by_status()}


@app.post("/api/leads/reset")
def reset_leads():
    count = store.clear_leads()
    return {"cleared": count, "counts": store.count_by_status()}


@app.get("/api/leads/export.csv")
def export_leads_csv():
    csv_data = leads_to_csv(list(store.leads.values()))
    push_crm_webhook(list(store.leads.values()))
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@app.post("/api/leads/{lead_id}/outreach")
def regenerate_outreach(lead_id: str, req: OutreachGenerateRequest | None = None):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    instructions = req.instructions if req else ""
    image_mode = (req.image_mode if req else "none") or "none"
    outreach = generate_outreach(
        lead,
        store.criteria or SearchCriteria(),
        instructions=instructions,
        image_mode=image_mode,
        campaign_ad=store.campaign_ad,
    )
    store.save()
    return {"outreach": outreach}


@app.put("/api/leads/{lead_id}/outreach")
def save_outreach(lead_id: str, req: OutreachUpdateRequest):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    outreach = dict(lead.outreach or {})
    outreach["email"] = req.email
    outreach["whatsapp"] = req.whatsapp
    if req.image_url is not None:
        outreach["image_url"] = req.image_url
    if req.image_mode is not None:
        outreach["image_mode"] = req.image_mode
    if req.send_to_email is not None:
        lead.send_to_email = req.send_to_email.strip() or None
    lead.outreach = outreach
    store.save()
    return {"outreach": lead.outreach, "send_to_email": lead.send_to_email}


@app.patch("/api/leads/{lead_id}/send-to")
def update_send_to(lead_id: str, req: SendToRequest):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    lead.send_to_email = req.send_to_email.strip() or None
    store.save()
    return {"send_to_email": lead.send_to_email, "scraped_email": lead.email}


@app.get("/api/leads/{lead_id}/attachments")
def list_lead_attachments(lead_id: str):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    return {"attachments": _sync_lead_attachments(lead)}


@app.post("/api/leads/{lead_id}/attachments")
async def upload_lead_attachment(lead_id: str, file: UploadFile = File(...)):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    data = await file.read()
    if len(data) > 10_000_000:
        raise HTTPException(400, "File too large (max 10MB).")
    row = lead_attachments.save_upload(lead_id, file.filename or "file", data)
    outreach = dict(lead.outreach or {})
    ids = list(outreach.get("attachment_ids") or [])
    ids.append(row["id"])
    outreach["attachment_ids"] = ids
    lead.outreach = outreach
    store.save()
    return {"attachment": row, "attachments": _sync_lead_attachments(lead)}


@app.post("/api/leads/{lead_id}/attachments/url")
def add_lead_attachment_url(lead_id: str, req: AttachmentUrlRequest):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(400, "Invalid URL.")
    row = lead_attachments.add_url_attachment(lead_id, url, req.filename)
    outreach = dict(lead.outreach or {})
    ids = list(outreach.get("attachment_ids") or [])
    ids.append(row["id"])
    outreach["attachment_ids"] = ids
    if not outreach.get("image_url"):
        outreach["image_url"] = url
    lead.outreach = outreach
    store.save()
    return {"attachment": row, "attachments": _sync_lead_attachments(lead)}


@app.delete("/api/leads/{lead_id}/attachments/{file_id}")
def delete_lead_attachment(lead_id: str, file_id: str):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    lead_attachments.delete_file(file_id)
    outreach = dict(lead.outreach or {})
    ids = [i for i in (outreach.get("attachment_ids") or []) if i != file_id]
    outreach["attachment_ids"] = ids
    lead.outreach = outreach
    store.save()
    return {"attachments": _sync_lead_attachments(lead)}


@app.get("/api/files/{file_id}")
def download_attachment(file_id: str):
    row = lead_attachments.get_file(file_id)
    if not row:
        raise HTTPException(404, "File not found.")
    if row.get("kind") == "url":
        return Response(status_code=302, headers={"Location": row["url"]})
    path = row.get("path")
    if not path or not os.path.isfile(path):
        raise HTTPException(404, "File not found on disk.")
    return FileResponse(path, filename=row.get("filename") or "attachment")


@app.get("/api/leads/{lead_id}/gmail-compose")
def gmail_compose(lead_id: str):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    to = effective_send_to(lead)
    if not to:
        raise HTTPException(400, "Set a send-to email address first.")
    outreach = lead.outreach or {}
    if not outreach.get("email"):
        raise HTTPException(400, "Generate or save outreach email first.")
    subject, body = parse_email_content(outreach["email"])
    files = _sync_lead_attachments(lead)
    if outreach.get("image_url"):
        has_img = any(f.get("url") == outreach["image_url"] for f in files if f.get("kind") == "url")
        if not has_img:
            files.append({
                "id": None,
                "filename": "generated-image",
                "url": outreach["image_url"],
                "kind": "url",
            })
    payload = build_gmail_compose_url(
        to_email=to,
        subject=subject,
        body=body,
        public_base=config.public_base_url,
        attachments=[f for f in files if f.get("id") or f.get("url")],
    )
    payload["marketer_email"] = store.marketer_email
    return payload


@app.patch("/api/leads/{lead_id}/opt-in")
def set_opt_in(lead_id: str, req: OptInRequest):
    lead = store.update_lead(lead_id, whatsapp_opt_in=req.whatsapp_opt_in)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    return {"whatsapp_opt_in": lead.whatsapp_opt_in}


@app.post("/api/leads/{lead_id}/convert")
def mark_converted(lead_id: str):
    lead = store.update_lead(lead_id, funnel_status="converted")
    if not lead:
        raise HTTPException(404, "Lead not found.")
    return {"funnel_status": lead.funnel_status}


# ── Send queue (Phase 2) ───────────────────────────────────────────────────
@app.post("/api/leads/{lead_id}/send/email")
def queue_email_send(lead_id: str):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    to = effective_send_to(lead)
    if not to:
        raise HTTPException(400, "Set a send-to email address first.")
    outreach = lead.outreach or {}
    if not outreach.get("email"):
        raise HTTPException(400, "Generate or save outreach email first.")
    subject, body = parse_email_content(outreach["email"])
    campaign_id = lead.campaign_id or store.current_campaign_id or ""
    pending = _queue_send(
        channel="email",
        lead=lead,
        context={
            "lead_id": lead.id,
            "to_email": to,
            "send_to_email": to,
            "subject": subject,
            "body": body,
            "campaign_id": campaign_id,
            "variant": None,
            "lead_source": lead.source,
            "score": lead.score,
            "image_url": outreach.get("image_url"),
            "attachment_ids": outreach.get("attachment_ids") or [],
        },
    )
    return {"pending": pending}


@app.post("/api/leads/batch-send/email")
def batch_queue_email(req: BatchSendRequest):
    if not req.lead_ids:
        raise HTTPException(400, "No lead IDs provided.")
    campaign_id = store.current_campaign_id or ""
    winner = get_active_winner(campaign_id) if req.use_ab else None
    variant_a, variant_b = None, None
    if req.use_ab and not winner:
        first = store.leads.get(req.lead_ids[0])
        base_subj, _ = parse_email_content((first.outreach or {}).get("email", "Hello"))
        product = (store.criteria.product if store.criteria else "") or base_subj
        variant_a, variant_b = generate_subject_variants(base_subj, product)

    queued = []
    for i, lid in enumerate(req.lead_ids):
        lead = store.leads.get(lid)
        if not lead or not (lead.outreach or {}).get("email"):
            continue
        to = effective_send_to(lead)
        if not to:
            continue
        subject, body = parse_email_content(lead.outreach["email"])
        variant = assign_variant(i, winner)
        if variant == "A" and variant_a:
            subject = variant_a
        elif variant == "B" and variant_b:
            subject = variant_b
        pending = _queue_send(
            channel="email",
            lead=lead,
            context={
                "lead_id": lead.id,
                "to_email": to,
                "send_to_email": to,
                "subject": subject,
                "body": body,
                "campaign_id": lead.campaign_id or campaign_id,
                "variant": variant,
                "lead_source": lead.source,
                "score": lead.score,
                "image_url": (lead.outreach or {}).get("image_url"),
            },
        )
        queued.append(pending)
    return {"queued": queued, "count": len(queued)}


@app.post("/api/leads/{lead_id}/send/whatsapp")
def queue_whatsapp_send(lead_id: str):
    lead = store.leads.get(lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found.")
    if not lead.whatsapp_opt_in:
        raise HTTPException(400, "WhatsApp opt-in not confirmed.")
    if not lead.phone:
        raise HTTPException(400, "Lead has no phone number.")
    message = (lead.outreach or {}).get("whatsapp", "")
    if not message:
        raise HTTPException(400, "Generate or save WhatsApp outreach first.")
    pending = _queue_send(
        channel="whatsapp",
        lead=lead,
        context={
            "lead_id": lead.id,
            "phone": lead.phone,
            "message": message,
            "campaign_id": lead.campaign_id or store.current_campaign_id or "",
            "whatsapp_opt_in": lead.whatsapp_opt_in,
            "lead_source": lead.source,
            "score": lead.score,
            "image_url": (lead.outreach or {}).get("image_url"),
        },
    )
    return {"pending": pending}


@app.get("/api/sends/pending")
def list_pending_sends():
    rows = storage.list_pending_sends(status="pending")
    enriched = []
    for p in rows:
        item = dict(p)
        name = (p.get("context") or {}).get("lead_name")
        lid = p.get("lead_id")
        if lid and lid in store.leads:
            name = store.leads[lid].name
        if name:
            item["lead_name"] = name
        enriched.append(item)
    return {"pending": enriched}


@app.put("/api/sends/{send_id}")
def update_pending_send_route(send_id: str, req: PendingSendUpdateRequest):
    pending = storage.get_pending_send(send_id)
    if not pending or pending.get("status") != "pending":
        raise HTTPException(404, "Pending send not found.")
    ctx = dict(pending.get("context") or {})
    channel = pending.get("channel")

    if channel == "email":
        if req.email is not None:
            subject, body = parse_email_content(req.email)
            ctx["subject"] = subject
            ctx["body"] = body
            ctx["email_raw"] = req.email
        if req.subject is not None:
            ctx["subject"] = req.subject
        if req.body is not None:
            ctx["body"] = req.body
        if req.image_url is not None:
            ctx["image_url"] = req.image_url or None
        if req.send_to_email is not None:
            ctx["send_to_email"] = req.send_to_email.strip() or None
            ctx["to_email"] = ctx["send_to_email"] or ctx.get("to_email")
        if req.message is not None:
            ctx["message"] = req.message
        if req.image_url is not None:
            ctx["image_url"] = req.image_url or None
    elif channel == "meta_ad":
        if req.ad is not None:
            ctx["ad"] = req.ad
    else:
        raise HTTPException(400, f"Cannot edit channel: {channel}")

    updated = storage.update_pending_send(send_id, context=ctx)
    lead_id = pending.get("lead_id")
    if lead_id and channel in ("email", "whatsapp"):
        lead = store.leads.get(lead_id)
        if lead:
            outreach = dict(lead.outreach or {})
            if channel == "email" and req.email is not None:
                outreach["email"] = req.email
            if channel == "whatsapp" and req.message is not None:
                outreach["whatsapp"] = req.message
            if req.image_url is not None:
                outreach["image_url"] = req.image_url
            if req.send_to_email is not None:
                lead.send_to_email = req.send_to_email.strip() or None
            lead.outreach = outreach
            store.save()
    return {"pending": updated}


@app.post("/api/sends/{send_id}/approve")
def approve_send(send_id: str):
    pending = storage.get_pending_send(send_id)
    if not pending or pending.get("status") != "pending":
        raise HTTPException(404, "Pending send not found.")
    sched = pending.get("scheduled_at")
    if sched and sched > _now():
        return {"pending": pending, "message": "Scheduled for future execution."}
    row = _execute_pending_send(pending)
    return {"log": row, "status": "executed"}


@app.post("/api/sends/{send_id}/reject")
def reject_send(send_id: str):
    pending = storage.update_pending_send(send_id, status="rejected")
    if not pending:
        raise HTTPException(404, "Pending send not found.")
    if pending.get("lead_id"):
        store.update_lead(pending["lead_id"], outreach_status="draft")
    return {"pending": pending}


# ── AI marketing routes ────────────────────────────────────────────────────
@app.get("/api/marketing/test-cases")
def get_ad_test_cases():
    return {"test_cases": list_ad_test_cases()}


@app.post("/api/marketing/generate")
async def generate_ad(req: AdRequest):
    ad = await asyncio.to_thread(
        marketing_pipeline.generate_ad,
        req.model_dump(exclude={"seed", "image_prompt"}),
        seed=req.seed,
        image_prompt=req.image_prompt,
    )
    store.campaign_ad = ad
    store.save()
    return {"ad": ad}


@app.get("/api/marketing/campaign-ad")
def get_campaign_ad():
    return {"ad": store.campaign_ad}


@app.post("/api/marketing/regenerate-image")
async def regenerate_image(req: ImageRequest):
    result = await asyncio.to_thread(
        marketing_pipeline.regenerate_image, req.image_prompt, seed=req.seed
    )
    if store.campaign_ad:
        store.campaign_ad = {**store.campaign_ad, **result}
        store.save()
    return result


@app.post("/api/marketing/publish")
def queue_meta_publish(req: PublishRequest):
    campaign_id = store.current_campaign_id
    if not campaign_id:
        campaign = storage.create_campaign(name=req.ad.get("headline", "Ad"), brief=req.ad.get("copy", ""))
        campaign_id = campaign["id"]
    pending = _queue_send(
        channel="meta_ad",
        lead=None,
        context={
            "campaign_id": campaign_id,
            "ad": req.ad,
            "platform": req.platform,
            "scheduled_at": req.scheduled_at,
            "pending_id": None,
        },
        scheduled_at=req.scheduled_at,
    )
    if pending.get("id"):
        storage.update_pending_send(pending["id"], context={**pending["context"], "pending_id": pending["id"]})
    return {"pending": pending}


@app.post("/api/marketing/publish/{send_id}/approve")
def approve_meta_publish(send_id: str):
    return approve_send(send_id)


# ── Tracking (Phase 3 — public, no auth) ───────────────────────────────────
@app.get("/track/open/{log_id}")
def track_open(log_id: str):
    row = storage.update_outreach_log(log_id, opened_at=_now())
    if row and row.get("lead_id"):
        store.update_lead(row["lead_id"], funnel_status="opened")
    return Response(content=_TRACKING_GIF, media_type="image/gif")


@app.get("/track/click/{log_id}")
def track_click(log_id: str, url: str = Query(...)):
    storage.update_outreach_log(log_id, clicked_at=_now())
    from urllib.parse import unquote

    return Response(status_code=302, headers={"Location": unquote(url)})


@app.post("/webhooks/whatsapp")
def whatsapp_webhook(req: WhatsAppWebhookRequest):
    if req.event != "reply":
        raise HTTPException(400, "Unsupported event.")
    row = storage.update_outreach_log(req.log_id, replied_at=_now())
    if not row:
        raise HTTPException(404, "Log entry not found.")
    if row.get("lead_id"):
        store.update_lead(row["lead_id"], funnel_status="replied")
    return {"ok": True}


# ── Analytics (Phase 3) ────────────────────────────────────────────────────
@app.get("/api/analytics/summary")
def analytics_summary(campaign_id: str | None = None):
    cid = campaign_id if campaign_id else (store.current_campaign_id or "all")
    if cid == "all":
        summary = analytics.build_summary(campaign_id="all", leads=list(store.leads.values()))
    else:
        summary = analytics.build_summary(campaign_id=cid, leads=list(store.leads.values()))
    summary["campaign_id"] = cid
    summary["campaigns"] = storage.list_campaigns()
    return summary


@app.get("/api/agent/recommendations")
def agent_recommendations(campaign_id: str | None = None):
    cid = campaign_id if campaign_id else (store.current_campaign_id or "all")
    leads = list(store.leads.values())
    if cid != "all":
        leads = [lead for lead in leads if lead.campaign_id == cid]
    summary = analytics.build_summary(campaign_id=cid, leads=list(store.leads.values()))
    payload = agentic.build_recommendations(leads=leads, summary=summary)
    payload["campaign_id"] = cid
    return payload


@app.post("/api/analytics/outreach/{log_id}/mark-replied")
def mark_outreach_replied(log_id: str):
    row = storage.update_outreach_log(log_id, replied_at=_now())
    if not row:
        raise HTTPException(404, "Outreach log not found.")
    if row.get("lead_id"):
        store.update_lead(row["lead_id"], funnel_status="replied")
    return {"log": row, "counts": store.count_by_status()}


@app.post("/api/analytics/outreach/{log_id}/mark-converted")
def mark_outreach_converted(log_id: str):
    row = storage.get_outreach_log(log_id)
    if not row:
        raise HTTPException(404, "Outreach log not found.")
    if row.get("lead_id"):
        lead = store.update_lead(row["lead_id"], funnel_status="converted")
        if not lead:
            raise HTTPException(404, "Lead not found.")
    return {"log": row, "funnel_status": "converted"}


@app.get("/api/analytics/send-log.csv")
def export_send_log_csv(campaign_id: str | None = None):
    cid = campaign_id if campaign_id else (store.current_campaign_id or "all")
    summary = analytics.build_summary(campaign_id=cid, leads=list(store.leads.values()))
    csv_data = analytics.send_log_to_csv(summary.get("send_log") or [])
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=outreach_send_log.csv"},
    )


@app.get("/api/campaigns")
def list_campaigns_route():
    return {"campaigns": storage.list_campaigns()}


# ── UI ─────────────────────────────────────────────────────────────────────
@app.get("/")
def index():
    return FileResponse(os.path.join(_UI_DIR, "index.html"))


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "gemini": config.has_gemini,
        "serpapi": config.has_serpapi,
        "smtp": config.has_smtp,
        "whatsapp_stub": config.whatsapp_stub_mode,
        "meta_stub": config.meta_stub_mode,
        "scrapers": [s["id"] for s in available_scrapers()],
    }


app.mount("/static", StaticFiles(directory=_UI_DIR), name="static")
