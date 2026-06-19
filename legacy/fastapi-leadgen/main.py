"""
main.py
───────
Entry point for the Agentic Marketing app.

    python main.py            # start the web dashboard (default, port 8000)
    python main.py --ui       # same as above
    python main.py --port 9000
    python main.py --leads "I am ABC Bakers selling sourdough to cafes" --scrapers sample
    python main.py --ad "Handcrafted sourdough bread" --tone Premium

Two modules:
  • Lead Generation & Outreach  (src/lead_generation)
  • AI Marketing / Ad Generation (src/marketing)
"""

import argparse
import asyncio
import json


def _banner():
    print(
        "\n┌────────────────────────────────────────┐\n"
        "│  Agentic Marketing                     │\n"
        "│  Lead Generation · AI Marketing Studio │\n"
        "└────────────────────────────────────────┘\n"
    )


def run_ui(port: int):
    _banner()
    print(f"[UI] Dashboard → http://127.0.0.1:{port}  (Ctrl+C to stop)\n")
    import uvicorn

    uvicorn.run("src.api.app:app", host="0.0.0.0", port=port, reload=False)


def run_leads_cli(brief: str, scraper_ids: list[str], max_results: int):
    from src.lead_generation import pipeline

    _, leads = asyncio.run(pipeline.run(brief, scraper_ids, max_results_per_target=max_results))
    print(json.dumps([l.to_dict() for l in leads], indent=2))


def run_ad_cli(product: str, tone: str, platform: str):
    from src.marketing import pipeline

    ad = pipeline.generate_ad({"product": product, "tone": tone, "platform": platform})
    print(json.dumps(ad, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Agentic Marketing")
    parser.add_argument("--ui", action="store_true", help="Start web dashboard (default)")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--leads", metavar="BRIEF", help="Run lead generation from a brief (CLI)")
    parser.add_argument("--scrapers", default=None, help="Comma-separated scraper ids (default: serpapi_google if key set, else sample)")
    parser.add_argument("--max-results", type=int, default=5)
    parser.add_argument("--ad", metavar="PRODUCT", help="Generate an ad for a product (CLI)")
    parser.add_argument("--tone", default="Friendly")
    parser.add_argument("--platform", default="Instagram")
    args = parser.parse_args()

    if args.leads:
        from src.shared.config import config as _cfg
        default_scrapers = "serpapi_google" if _cfg.has_serpapi else "sample"
        scraper_arg = args.scrapers or default_scrapers
        run_leads_cli(args.leads, [s.strip() for s in scraper_arg.split(",") if s.strip()], args.max_results)
    elif args.ad:
        run_ad_cli(args.ad, args.tone, args.platform)
    else:
        run_ui(args.port)


if __name__ == "__main__":
    main()
