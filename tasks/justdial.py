import asyncio
from celery_app import app

@app.task(name="tasks.scrape_justdial_task")
def scrape_justdial_task(business_type: str, location: str, max_results: int) -> list[dict]:
    from scrapers.justdial import JustdialScraper

    async def run():
        async with JustdialScraper(headless=True) as scraper:
            return await scraper.scrape(business_type, location, max_results)

    return asyncio.run(run())
