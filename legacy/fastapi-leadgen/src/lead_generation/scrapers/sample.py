"""
Sample data source — returns canned leads (no network/browser).

Doubles as the reference implementation for new scrapers: copy this file,
rename the class, set name/label, and implement `run`.
"""

from src.lead_generation.scrapers.base import BaseScraper, register_scraper
from src.shared.models import Lead, SearchCriteria

_SAMPLE = [
    {"name": "Toit Brewpub", "category": "brewpub", "address": "Indiranagar, Bangalore",
     "phone": "+91 98860 12345", "website": "http://toit.in", "rating": 4.5, "reviews": 1820},
    {"name": "Casa Fresco Cafe", "category": "cafe", "address": "Koramangala, Bangalore",
     "phone": "+91 99000 23456", "website": "http://casafresco.in", "rating": 4.3, "reviews": 640},
    {"name": "The Hole in the Wall Cafe", "category": "cafe", "address": "Indiranagar, Bangalore",
     "phone": "+91 90080 34567", "website": "http://holeinthewall.in", "rating": 4.4, "reviews": 2100},
    {"name": "Glen's Bakehouse", "category": "bakery cafe", "address": "Indiranagar, Bangalore",
     "phone": "+91 80470 45678", "website": "http://glensbakehouse.com", "rating": 4.4, "reviews": 1500},
    {"name": "Sublime Restaurant", "category": "restaurant", "address": "HSR Layout, Bangalore",
     "phone": "+91 73380 56789", "website": None, "rating": 4.1, "reviews": 320},
]


@register_scraper
class SampleScraper(BaseScraper):
    name = "sample"
    label = "Sample Data (demo)"

    async def run(self, criteria: SearchCriteria) -> list[Lead]:
        cap = criteria.max_results_per_target or len(_SAMPLE)
        return [Lead.from_dict({**row, "source": self.name}) for row in _SAMPLE[:cap]]
