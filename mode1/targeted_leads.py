"""
mode1/targeted_leads.py
────────────────────────
MODE 1 — Targeted Lead Discovery + Personalized Outreach

Flow:
  Company submits input
      → Scrape Google Maps, Justdial & IndiaMART in parallel
      → Normalize and merge results
      → Deduplicate leads
      → Score each lead based on company's criteria
      → Generate a personalized outreach message per lead
      → Save everything to results/leads_mode1.json
"""

import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from engine.scorer import score_lead as core_score_lead, score_leads
from engine.outreach import generate_outreach_message as core_generate_outreach_message, generate_outreach_messages
from tasks import run_local_campaign, run_celery_campaign

# ── Company Input ─────────────────────────────────────────────────────────────

COMPANY_INPUT = {
    "company_name":         "Artisan Loaf Bakery",
    "product":              "sourdough bread",
    "seller_location":      "Indiranagar, Bangalore",
    "delivery_radius_km":   15,

    "target_business_types": ["cafe", "restaurant", "hotel"],
    "max_results_per_type":  3,

    "scoring_weights": {
        "has_phone":        20,
        "has_website":      15,
        "rating":           25,
        "menu_alignment":   25,
        "open_status":      15,
    },

    "menu_alignment_keywords": [
        "breakfast", "brunch", "sandwich", "toast",
        "artisan", "continental", "bakery", "cafe", "restaurant", "hotel"
    ],

    "sender_email": "sales@artisanloaf.com",
    "sender_name":  "Priya",
}


def score_lead(lead: dict, company_input: dict) -> dict:
    return core_score_lead(lead, company_input)


def generate_outreach_message(lead: dict, company_input: dict) -> str:
    return core_generate_outreach_message(lead, company_input)


async def run_mode1():
    print("\n" + "="*50)
    print("  MODE 1 — Scalable Parallel Lead Discovery")
    print("="*50)

    print("\nSelect execution method:")
    print("  1. Local In-Process Parallel Scrape (asyncio.gather, no Redis required)")
    print("  2. Celery Distributed Parallel Scrape (requires running Redis + Celery worker)")

    choice = input("Enter choice [1/2] (default: 1): ").strip() or "1"

    leads = []

    if choice == "2":
        print("\n[Celery] Dispatching parallel scraper chord to Celery queue...")
        async_result = run_celery_campaign(COMPANY_INPUT)
        print(f"✓ Tasks successfully queued! Parent Task ID: {async_result.id}")
        print("Waiting for results from backend worker (timeout 120s)...")
        try:
            leads = async_result.get(timeout=120)
        except Exception as e:
            print(f"\n✗ Error fetching results from Celery/Redis backend: {e}")
            print("  Make sure a Celery worker is running: python main.py --worker")
            print("  Make sure Redis is active: redis-server")
            return []
    else:
        print("\n[Local Engine] Executing parallel Playwright scraping...")
        leads = await run_local_campaign(COMPANY_INPUT)

    print(f"\n{'─'*50}")
    print("  RANKED LEADS SUMMARY")
    print(f"{'─'*50}")
    for i, lead in enumerate(leads, 1):
        print(f"\n  #{i} [{lead['priority'].upper()}] {lead['name']}")
        print(f"      Score   : {lead['score']}/100")
        print(f"      Phone   : {lead['phone']}")
        print(f"      Address : {lead['address']}")
        print(f"      Website : {lead['website']}")
        print(f"      Sources : {lead['source']}")
        print(f"\n  --- Outreach Message ---")
        print(lead.get("outreach_message"))
        print(f"  {'─'*40}")

    return leads


if __name__ == "__main__":
    asyncio.run(run_mode1())
