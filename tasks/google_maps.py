import asyncio
from celery_app import app

@app.task(name="tasks.scrape_google_maps_task")
def scrape_google_maps_task(business_type: str, location: str, max_results: int) -> list[dict]:
    from scrapers.google import GoogleMapsScraper

    async def run():
        async with GoogleMapsScraper(headless=True) as scraper:
            return await scraper.scrape(business_type, location, max_results)

    return asyncio.run(run())
