# Agentic Marketing

Two focused, independent modules behind one clean dashboard:

1. **Lead Generation & Outreach** — describe your business in plain text, pick
   data sources, and get AI-scored leads with personalized email + WhatsApp previews.
2. **AI Marketing / Ad Generation** — describe a product and get ad copy plus a
   generated advertisement image preview.

All AI runs on the **free Gemini API** (with deterministic fallbacks if no key is
set). Images use the free **Pollinations** endpoint. No paid SDKs required.

---

## Project structure

```
src/
  shared/                  # used by both modules
    config.py              # single Config object (env-driven)
    gemini.py              # one Gemini client (generate_text / generate_json)
    models/                # Lead, SearchCriteria
    utils/                 # phone cleaning, normalize + dedupe

  lead_generation/
    llm/                   # requirement_extractor: brief text -> SearchCriteria
    scrapers/              # base + registry + serpapi_google / google_maps / justdial / indiamart / sample
    scoring/               # AI lead scoring (0-100 + reason)
    outreach/              # AI email + WhatsApp generation
    pipeline.py            # extract -> scrape -> dedupe -> score -> outreach

  marketing/
    llm/                   # ad_writer: brief -> headline/copy/cta/design/image_prompt
    image_generation/      # Pollinations image URL
    pipeline.py            # copy -> image

  api/app.py               # FastAPI: routes for both modules + serves the UI
  ui/                      # index.html, app.js, theme.css (two-tab SPA)

main.py                    # entry point (web UI by default; also CLI)
```

---

## Install & run

```bash
python -m venv .crawlvenv
.crawlvenv/bin/pip install -r requirements.txt
.crawlvenv/bin/playwright install chromium   # only needed for live scraping

# optional: enable AI + SerpApi lead discovery
cp .env.example .env   # then set GEMINI_API_KEY and SERPAPI_API_KEY

# start the dashboard
python main.py            # http://127.0.0.1:8000
```

CLI shortcuts:

```bash
python main.py --leads "ABC Bakers selling sourdough to nearby premium cafes" --scrapers serpapi_google
python main.py --leads "..." --scrapers serpapi_google,google_maps   # combine sources
python main.py --ad "Handcrafted sourdough bread" --tone Premium --platform Instagram
```

---

## How it works

**Lead generation:** the brief is sent to Gemini, which infers `SearchCriteria`
(product, target business types, location, desired attributes). The selected
scrapers each run the same `run(criteria) -> list[Lead]` contract; results are
normalized and de-duplicated, scored by Gemini (relevance, buying potential,
location/industry fit, size → `score` + `reason`), then each lead gets a
personalized email + WhatsApp message. Preview only — nothing is sent.

**Ad generation:** the product brief goes to Gemini, which returns headline,
copy, CTA, design suggestions, and an image prompt. The prompt is rendered by
Pollinations into a preview image. Regenerate produces a fresh image.

---

## Data sources

| Source | ID | Notes |
|--------|-----|-------|
| **Google Search (SerpApi)** | `serpapi_google` | **Recommended primary source.** Paginated Google search via [SerpApi](https://serpapi.com/); visits result websites for contact info. Requires `SERPAPI_API_KEY`. Raw responses logged to `outputs/serpapi_logs/`. |
| Google Maps | `google_maps` | Playwright browser scraper |
| JustDial | `justdial` | Playwright browser scraper |
| IndiaMART | `indiamart` | Playwright browser scraper |
| Sample Data | `sample` | Canned demo leads (no network) |

---

## Adding a new scraper

Drop a file in `src/lead_generation/scrapers/`:

```python
from src.lead_generation.scrapers.base import BaseScraper, register_scraper
from src.shared.models import Lead, SearchCriteria

@register_scraper
class YellowPagesScraper(BaseScraper):
    name = "yellow_pages"
    label = "Yellow Pages"

    async def run(self, criteria: SearchCriteria) -> list[Lead]:
        ...
        return leads
```

It is auto-discovered and appears in the UI checklist automatically — no other
code changes needed. (For browser scrapers, subclass `PlaywrightScraper` and
implement `scrape_target` instead; see `sample.py` and `google_maps.py`.)

---

## Intentionally deferred

- Actually **sending** outreach (SMTP / WhatsApp API) — previews only for now.
- **Publishing / scheduling** generated ads to social platforms.
- Persistent database (uses a simple JSON store in `outputs/`).
