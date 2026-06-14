import re
from datetime import datetime
from scrapers.base_scraper import BaseScraper

class GoogleMapsScraper(BaseScraper):
    """Playwright-based Google Maps Scraper."""

    async def scrape(self, business_type: str, location: str, max_results: int) -> list[dict]:
        query = f"{business_type} in {location}"
        leads = []

        print(f"[Google Maps Scraper] Navigating to Google Maps for query: '{query}'")
        await self.page.goto("https://www.google.com/maps")

        try:
            consent_btn = self.page.locator("form[action*='consent'] button").first
            if await consent_btn.is_visible():
                await consent_btn.click()
                await self.page.wait_for_timeout(2000)
        except Exception:
            pass

        search_box = self.page.locator('input[name="q"]')
        await search_box.fill(query)
        await self.page.keyboard.press("Enter")
        await self.page.wait_for_timeout(5000)

        results = self.page.locator('a[href*="/place/"]')
        count = await results.count()
        cap = min(count, max_results)

        print(f"[Google Maps Scraper] Found {count} results, scraping up to {cap}")

        for i in range(cap):
            try:
                results = self.page.locator('a[href*="/place/"]')
                business = results.nth(i)
                quick_name = await business.get_attribute("aria-label")
                print(f"  [{i+1}/{cap}] Processing Google Maps: {quick_name}")

                await business.click()
                await self.page.wait_for_timeout(3000)

                detail = await self.scrape_listing_detail()
                if not detail.get("name") or detail["name"].lower() in ["results", "search results", "results for..."]:
                    detail["name"] = self.clean_text(quick_name)

                detail["business_type"] = business_type
                detail["search_query"] = query
                leads.append(detail)

                await self.page.go_back()
                await self.page.wait_for_timeout(3000)
            except Exception as e:
                print(f"  [Google Maps Scraper] Error scraping item {i+1}: {e}")
                try:
                    await self.page.goto("https://www.google.com/maps")
                    search_box = self.page.locator('input[name="q"]')
                    await search_box.fill(query)
                    await self.page.keyboard.press("Enter")
                    await self.page.wait_for_timeout(5000)
                except Exception:
                    pass

        return leads

    async def scrape_listing_detail(self) -> dict:
        detail = {}
        await self.page.wait_for_timeout(2000)

        try:
            name_el = self.page.get_by_role("heading", level=1)
            detail["name"] = self.clean_text(await name_el.first.inner_text())
        except Exception:
            detail["name"] = None

        try:
            rating_el = self.page.get_by_role("img", name=re.compile(r"star", re.I))
            aria = await rating_el.first.get_attribute("aria-label")
            detail["rating"] = self.clean_text(aria)
        except Exception:
            detail["rating"] = None

        try:
            addr_btn = self.page.get_by_role("button", name=re.compile(r"address", re.I))
            aria = await addr_btn.first.get_attribute("aria-label")
            detail["address"] = self.clean_text(aria.split(":", 1)[-1]) if aria else None
        except Exception:
            detail["address"] = None

        try:
            phone_btn = self.page.get_by_role("button", name=re.compile(r"phone", re.I))
            aria = await phone_btn.first.get_attribute("aria-label")
            detail["phone"] = self.extract_phone(aria) if aria else None
        except Exception:
            detail["phone"] = None

        try:
            open_el = self.page.get_by_text(re.compile(r"^(Open|Closed|Opens|Closes)", re.I))
            detail["open_status"] = self.clean_text(await open_el.first.inner_text())
        except Exception:
            detail["open_status"] = None

        try:
            cat_el = self.page.get_by_role("button", name=re.compile(r"(cafe|restaurant|bakery|hotel|bar|pub)", re.I))
            detail["category"] = self.clean_text(await cat_el.first.inner_text())
        except Exception:
            detail["category"] = None

        try:
            web_link = self.page.get_by_role("link", name=re.compile(r"website", re.I))
            detail["website"] = await web_link.first.get_attribute("href")
        except Exception:
            detail["website"] = None

        try:
            links = await self.page.locator("a[href]").evaluate_all(
                """
                els => els
                    .map(e => e.href)
                    .filter(href =>
                        href.startsWith("http") &&
                        !href.includes("google.")
                    )
                """
            )
            detail["external_links"] = list(set(links))
        except Exception:
            detail["external_links"] = []

        detail["scraped_at"] = datetime.utcnow().isoformat()
        detail["source"] = "google_maps"

        return detail
