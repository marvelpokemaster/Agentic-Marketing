import os

# Redis and Celery Configurations
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

# Playwright Scraper Defaults
DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
PAGE_TIMEOUT_MS = 30000

# Default Scoring Weights & Parameters (Total weight must equal 100)
DEFAULT_SCORING_WEIGHTS = {
    "has_phone": 20,
    "has_website": 15,
    "rating": 25,
    "menu_alignment": 25,
    "open_status": 15,
}

DEFAULT_MENU_ALIGNMENT_KEYWORDS = [
    "breakfast", "brunch", "sandwich", "toast",
    "artisan", "continental", "bakery", "cafe", "restaurant",
    "hotel", "bar", "pub", "sourdough", "food"
]

# Output paths
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
LEADS_OUTPUT_FILE = os.path.join(RESULTS_DIR, "leads_mode1.json")
