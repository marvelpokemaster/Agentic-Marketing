from datetime import datetime
from scrapers.base_scraper import BaseScraper

class IndiaMartScraper(BaseScraper):
    """Playwright-based IndiaMART Scraper (stub — implement selectors as needed)."""

    async def scrape(self, business_type: str, location: str, max_results: int) -> list[dict]:
        query = f"{business_type} in {location}"
        leads = []

        print(f"[IndiaMART Scraper] Searching for: '{query}'")
        try:
            await self.page.goto("https://dir.indiamart.com/search.mp", timeout=30000)
            await self.page.wait_for_timeout(2000)

            search_input = self.page.locator("input#search_string, input[name='ss']").first
            await search_input.fill(f"{business_type} {location}")
            await self.page.keyboard.press("Enter")
            await self.page.wait_for_timeout(5000)

            cards = self.page.locator(".prd-card, .lst-cl, .company-name")
            count = await cards.count()
            cap = min(count, max_results)

            print(f"[IndiaMART Scraper] Found {count} results, extracting up to {cap}")

            for i in range(cap):
                try:
                    card = cards.nth(i)
                    name = self.clean_text(await card.inner_text())
                    if not name:
                        continue
                    leads.append({
                        "name": name,
                        "phone": None,
                        "website": None,
                        "address": location,
                        "rating": None,
                        "open_status": None,
                        "category": business_type,
                        "business_type": business_type,
                        "search_query": query,
                        "scraped_at": datetime.utcnow().isoformat(),
                        "source": "indiamart",
                    })
                    print(f"  [{i+1}/{cap}] Scraped IndiaMART: {name}")
                except Exception as e:
                    print(f"  [IndiaMART Scraper] Error parsing item {i+1}: {e}")

        except Exception as e:
            print(f"[IndiaMART Scraper] Search failed: {e}")

        return leads
