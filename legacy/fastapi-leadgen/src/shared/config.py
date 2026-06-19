"""
src/shared/config.py
────────────────────
Single, minimal configuration object loaded from environment / .env.

Replaces the old sprawling top-level config.py. Only the settings the two
active modules need are kept here.
"""

import os
from dataclasses import dataclass, field

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(_BASE_DIR, ".env"))
except ImportError:  # dotenv is optional
    pass


@dataclass
class Config:
    # ── Gemini (free API) ──────────────────────────────────────────────────
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # ── Pollinations image generation (free, no key required) ──────────────
    pollinations_base_url: str = os.getenv("POLLINATIONS_BASE_URL", "https://image.pollinations.ai/prompt")
    pollinations_model: str = os.getenv("POLLINATIONS_MODEL", "flux")
    pollinations_width: int = int(os.getenv("POLLINATIONS_WIDTH", "1024"))
    pollinations_height: int = int(os.getenv("POLLINATIONS_HEIGHT", "1024"))
    pollinations_timeout: int = int(os.getenv("POLLINATIONS_TIMEOUT_SEC", "120"))

    # ── Scrapers ───────────────────────────────────────────────────────────
    # Default to HEADED (visible browser) so you can watch scraping happen.
    # Set SCRAPER_HEADLESS=true in .env for servers / CI.
    scraper_headless: bool = os.getenv("SCRAPER_HEADLESS", "false").lower() == "true"
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    default_max_results: int = int(os.getenv("MAX_RESULTS_PER_TARGET", "5"))

    # ── Output ─────────────────────────────────────────────────────────────
    outputs_dir: str = field(default_factory=lambda: os.path.join(_BASE_DIR, "outputs"))

    # ── SMTP (Phase 2) ─────────────────────────────────────────────────────
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from: str = os.getenv("SMTP_FROM", "")
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    email_max_per_hour: int = int(os.getenv("EMAIL_MAX_PER_HOUR", "20"))

    # ── CRM + tracking (Phase 2/3) ─────────────────────────────────────────
    crm_webhook_url: str = os.getenv("CRM_WEBHOOK_URL", "")
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")

    # ── A/B testing ────────────────────────────────────────────────────────
    ab_min_sends: int = int(os.getenv("AB_MIN_SENDS", "10"))

    # ── Stub modes (WhatsApp / Meta) ───────────────────────────────────────
    whatsapp_stub_mode: bool = os.getenv("WHATSAPP_STUB_MODE", "true").lower() == "true"
    meta_stub_mode: bool = os.getenv("META_STUB_MODE", "true").lower() == "true"

    # ── SerpApi (Google Search lead discovery) ─────────────────────────────
    serpapi_api_key: str = os.getenv("SERPAPI_API_KEY", "")
    serpapi_base_url: str = os.getenv("SERPAPI_BASE_URL", "https://serpapi.com/search")
    serpapi_rate_limit_per_min: int = int(os.getenv("SERPAPI_RATE_LIMIT_PER_MIN", "30"))
    serpapi_max_pages: int = int(os.getenv("SERPAPI_MAX_PAGES", "5"))
    serpapi_log_raw: bool = os.getenv("SERPAPI_LOG_RAW", "true").lower() == "true"
    serpapi_website_timeout: int = int(os.getenv("SERPAPI_WEBSITE_TIMEOUT", "15"))
    serpapi_website_concurrency: int = int(os.getenv("SERPAPI_WEBSITE_CONCURRENCY", "5"))

    @property
    def has_gemini(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def has_smtp(self) -> bool:
        return bool(self.smtp_host)

    @property
    def has_serpapi(self) -> bool:
        return bool(self.serpapi_api_key)


config = Config()
os.makedirs(config.outputs_dir, exist_ok=True)
os.makedirs(os.path.join(config.outputs_dir, "serpapi_logs"), exist_ok=True)
