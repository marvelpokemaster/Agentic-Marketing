import asyncio
from celery_app import app

@app.task(name="tasks.scrape_indiamart_task")
def scrape_indiamart_task(business_type: str, location: str, max_results: int) -> list[dict]:
    from scrapers.indiamart import IndiaMartScraper

    async def run():
        async with IndiaMartScraper(headless=True) as scraper:
            return await scraper.scrape(business_type, location, max_results)

    return asyncio.run(run())
