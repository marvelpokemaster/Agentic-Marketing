import abc
import re
from playwright.async_api import async_playwright
import config

class BaseScraper(abc.ABC):
    """
    Abstract base class for all scrapers.
    Manages Playwright browser lifetime and common page utilities.
    """

    def __init__(self, headless: bool = True):
        self.headless = headless
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    async def __aenter__(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-infobars",
                "--disable-http2",
                "--disable-dev-shm-usage",
            ]
        )
        self.context = await self.browser.new_context(
            user_agent=config.DEFAULT_USER_AGENT,
            viewport={"width": 1280, "height": 800}
        )
        await self.context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        self.page = await self.context.new_page()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    @abc.abstractmethod
    async def scrape(self, business_type: str, location: str, max_results: int) -> list[dict]:
        pass

    @staticmethod
    def clean_text(text: str | None) -> str | None:
        if not text:
            return None
        text = text.strip().replace("\n", " ").replace("\r", " ")
        text = re.sub(r"\s+", " ", text)
        return text if text else None

    @staticmethod
    def extract_phone(text: str | None) -> str | None:
        if not text:
            return None
        match = re.search(r"[\+\d][\d\s\-\(\)]{7,}", text)
        if match:
            phone = match.group().strip()
            if sum(c.isdigit() for c in phone) >= 7:
                return phone
        return None
