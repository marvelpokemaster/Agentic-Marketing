import asyncio
import json
import os
from celery import chord

from celery_app import app as celery_app
from tasks.google_maps import scrape_google_maps_task
from tasks.justdial import scrape_justdial_task
from tasks.indiamart import scrape_indiamart_task
from tasks.merge import process_scraped_leads_task
from engine.normalizer import normalize_leads
from engine.deduplicator import deduplicate_leads
from engine.scorer import score_leads
from engine.outreach import generate_outreach_messages
import config


def run_celery_campaign(company_input: dict):
    types = company_input.get("target_business_types", ["cafe"])
    location = company_input.get("seller_location", "Bangalore")
    max_res = company_input.get("max_results_per_type", 5)

    header = []
    for btype in types:
        header.append(scrape_google_maps_task.s(btype, location, max_res))
        header.append(scrape_justdial_task.s(btype, location, max_res))
        header.append(scrape_indiamart_task.s(btype, location, max_res))

    print(f"[Celery Orchestrator] Dispatching {len(header)} tasks in parallel via chord...")
    callback = process_scraped_leads_task.s(company_input)
    result = chord(header)(callback)

    return result


async def run_local_campaign(company_input: dict) -> list[dict]:
    from scrapers.google import GoogleMapsScraper
    from scrapers.justdial import JustdialScraper
    from scrapers.indiamart import IndiaMartScraper

    types = company_input.get("target_business_types", ["cafe"])
    location = company_input.get("seller_location", "Bangalore")
    max_res = company_input.get("max_results_per_type", 5)

    async def run_maps(btype):
        async with GoogleMapsScraper(headless=False) as scraper:
            return await scraper.scrape(btype, location, max_res)

    async def run_jd(btype):
        async with JustdialScraper(headless=False) as scraper:
            return await scraper.scrape(btype, location, max_res)

    async def run_im(btype):
        async with IndiaMartScraper(headless=False) as scraper:
            return await scraper.scrape(btype, location, max_res)

    tasks = []
    for btype in types:
        tasks.append(run_maps(btype))
        tasks.append(run_jd(btype))
        tasks.append(run_im(btype))

    print(f"[Local Orchestrator] Spawning {len(tasks)} parallel scraping tasks in-process...")
    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    raw_leads = []
    for res in all_results:
        if isinstance(res, Exception):
            print(f"[Local Orchestrator] Scraper task failed: {res}")
        elif res:
            raw_leads.extend(res)

    print(f"[Local Orchestrator] Scraped {len(raw_leads)} raw leads. Running processing engine...")

    normalized = normalize_leads(raw_leads)
    deduped = deduplicate_leads(normalized)
    scored = score_leads(deduped, company_input)
    final_leads = generate_outreach_messages(scored, company_input)

    os.makedirs(config.RESULTS_DIR, exist_ok=True)
    with open(config.LEADS_OUTPUT_FILE, "w") as f:
        json.dump(final_leads, f, indent=2)

    print(f"[Local Orchestrator] ✓ Saved {len(final_leads)} leads to {config.LEADS_OUTPUT_FILE}")
    return final_leads


__all__ = [
    "celery_app",
    "scrape_google_maps_task",
    "scrape_justdial_task",
    "scrape_indiamart_task",
    "process_scraped_leads_task",
    "run_celery_campaign",
    "run_local_campaign",
]
