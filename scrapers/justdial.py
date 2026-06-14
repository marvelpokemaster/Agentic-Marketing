import urllib.parse
from datetime import datetime
from scrapers.base_scraper import BaseScraper

class JustdialScraper(BaseScraper):
    """Playwright-based Justdial Scraper."""

    async def scrape(self, business_type: str, location: str, max_results: int) -> list[dict]:
        search_query = f"{business_type} in {location}"
        leads = []

        print(f"[Justdial Scraper] Opening Justdial homepage...")
        try:
            await self.page.goto("https://www.justdial.com", timeout=30000)
            await self.page.wait_for_timeout(3000)
            await self.dismiss_popups()

            print(f"[Justdial Scraper] Setting location: '{location}'")
            location_input = self.page.locator("input#city-auto-sug").first
            await location_input.wait_for(state="visible", timeout=10000)
            await location_input.click()
            await location_input.fill("")
            await self.page.wait_for_timeout(500)

            city_name = location.split(",")[-1].strip()
            await location_input.type(city_name, delay=100)
            await self.page.wait_for_timeout(2000)
            await location_input.press("Enter")
            await self.page.wait_for_timeout(2000)

            print(f"[Justdial Scraper] Searching for category: '{business_type}'")
            search_input = self.page.locator("input#main-auto").first
            await search_input.wait_for(state="visible", timeout=10000)
            await search_input.click()
            await search_input.fill(business_type)
            await self.page.wait_for_timeout(1000)
            await search_input.press("Enter")
            await self.page.wait_for_timeout(5000)

            await self.dismiss_popups()
            await self.scroll_for_results(max_results)

        except Exception as e:
            print(f"[Justdial Scraper] Interactive search flow failed: {e}. Trying direct URL fallback.")
            try:
                parts = [p.strip() for p in location.split(",")]
                if len(parts) >= 2:
                    city = urllib.parse.quote(parts[-1].replace(" ", "-"))
                    area = urllib.parse.quote(parts[-2].replace(" ", "-"))
                    search_url = f"https://www.justdial.com/{city}/{business_type}-in-{area}"
                else:
                    city = urllib.parse.quote(parts[0].replace(" ", "-"))
                    search_url = f"https://www.justdial.com/{city}/{business_type}"

                print(f"[Justdial Scraper] Navigating directly to URL: {search_url}")
                await self.page.goto(search_url, timeout=30000)
                await self.page.wait_for_timeout(3000)
                await self.dismiss_popups()
                await self.scroll_for_results(max_results)
            except Exception as e2:
                print(f"[Justdial Scraper] Fallback search also failed: {e2}")
                return []

        result_cards = self.page.locator("div.resultbox")
        count = await result_cards.count()
        cap = min(count, max_results)

        print(f"[Justdial Scraper] Found {count} result cards, extracting up to {cap}")

        for i in range(cap):
            try:
                card = result_cards.nth(i)
                detail = await self.parse_card(card)
                detail["business_type"] = business_type
                detail["search_query"] = search_query
                leads.append(detail)

                print(f"  [{i+1}/{cap}] Scraped Justdial: {detail['name']}")
                print(f"    Phone   : {detail['phone']}")
                print(f"    Rating  : {detail['rating']}")
                print(f"    Address : {detail['address']}")
                print(f"    Website : {detail['website']}")
            except Exception as e_card:
                print(f"  [Justdial Scraper] Error parsing card {i+1}: {e_card}")

        return leads

    async def parse_card(self, card) -> dict:
        detail = {}

        try:
            name_el = card.locator(".resultbox_title_anchor")
            detail["name"] = self.clean_text(await name_el.inner_text())
        except Exception:
            detail["name"] = None

        try:
            rating_el = card.locator(".resultbox_totalrate")
            detail["rating"] = self.clean_text(await rating_el.inner_text())
        except Exception:
            detail["rating"] = None

        try:
            address_el = card.locator(".locatcity")
            detail["address"] = self.clean_text(await address_el.inner_text())
        except Exception:
            detail["address"] = None

        try:
            phone_el = card.locator(".callcontent")
            detail["phone"] = self.extract_phone(await phone_el.inner_text())
        except Exception:
            detail["phone"] = None

        try:
            link_el = card.locator("a.resultbox_title_anchorbox").first
            href = await link_el.get_attribute("href")
            if href and href.startswith("/"):
                detail["website"] = "https://www.justdial.com" + href
            else:
                detail["website"] = href
        except Exception:
            detail["website"] = None

        detail["scraped_at"] = datetime.utcnow().isoformat()
        detail["source"] = "justdial"

        return detail

    async def dismiss_popups(self):
        try:
            await self.page.keyboard.press("Escape")
            close_buttons = [
                "span.close", "div.close_btn", "span.close_btn",
                "button.close", "a.close", "div.modal-close"
            ]
            for btn_selector in close_buttons:
                btn = self.page.locator(btn_selector).first
                if await btn.is_visible():
                    await btn.click()
                    await self.page.wait_for_timeout(500)
        except Exception:
            pass

    async def scroll_for_results(self, max_results: int):
        for _ in range(5):
            cards = self.page.locator("div.resultbox")
            count = await cards.count()
            if count >= max_results:
                break
            await self.page.mouse.wheel(0, 2000)
            await self.page.wait_for_timeout(1500)
