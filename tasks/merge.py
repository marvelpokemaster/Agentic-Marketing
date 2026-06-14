import json
import os
from celery_app import app
from engine.normalizer import normalize_leads
from engine.deduplicator import deduplicate_leads
from engine.scorer import score_leads
from engine.outreach import generate_outreach_messages
import config

@app.task(name="tasks.process_scraped_leads_task")
def process_scraped_leads_task(results_list: list[list[dict]], company_input: dict) -> list[dict]:
    raw_leads = []
    for sublist in results_list:
        if sublist:
            raw_leads.extend(sublist)

    print(f"[Celery Pipeline] Received {len(raw_leads)} raw leads. Running processing engine...")

    normalized = normalize_leads(raw_leads)
    deduped = deduplicate_leads(normalized)
    scored = score_leads(deduped, company_input)
    final_leads = generate_outreach_messages(scored, company_input)

    os.makedirs(config.RESULTS_DIR, exist_ok=True)
    with open(config.LEADS_OUTPUT_FILE, "w") as f:
        json.dump(final_leads, f, indent=2)

    print(f"[Celery Pipeline] ✓ Saved {len(final_leads)} leads to {config.LEADS_OUTPUT_FILE}")
    return final_leads
