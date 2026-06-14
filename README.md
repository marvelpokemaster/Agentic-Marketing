# Lead Engine — Group 2
**Adarsh Binu · Yadhu Vipin**  
Stack: Playwright · FastAPI · Celery · PostgreSQL · OpenAI/Claude

---

## Project Structure

```
lead_engine/
│
├── main.py                    ← Entry point, choose mode 1 or 2
│
├── core/
│   └── scraper.py             ← Shared Google Maps scraper (both modes use this)
│
├── mode1/
│   └── targeted_leads.py      ← Mode 1: find specific clients + outreach messages
│
└── mode2/
    └── broadcast_ad.py        ← Mode 2: generate ad copy + post to Instagram
```

---

## Mode 1 — Targeted Lead Discovery

**What it does:**
- Takes company input (product, location, target types)
- Scrapes Google Maps for matching businesses
- Scores each lead out of 100 using hardcoded rules
- Generates a personalized outreach message per lead
- Saves ranked leads to `leads_mode1.json`

**Run:**
```bash
python main.py --mode 1
```

**Scoring factors (hardcoded):**
| Factor | Weight |
|---|---|
| Has phone number | 20 |
| Has website | 15 |
| Star rating | 25 |
| Menu alignment keywords | 25 |
| Currently open | 15 |

---

## Mode 2 — Broadcast Ad Campaign

**What it does:**
- Takes company info (product, tone, contact)
- Generates ad caption, hashtags, and image prompt
- Posts to Instagram Business via Facebook Graph API
- Saves campaign record to `campaign_mode2.json`

**Run:**
```bash
python main.py --mode 2
```

**To post live on Instagram, you need:**
1. A Facebook Developer account → https://developers.facebook.com
2. Create an App → get a Page Access Token
3. Connect your Instagram Business account to a Facebook Page
4. Fill in `COMPANY_INPUT` in `mode2/broadcast_ad.py`:
   - `instagram_business_account_id`
   - `facebook_page_access_token`
   - `image_url` (must be a public URL)

---

## Install

```bash
pip install playwright requests
playwright install chromium
```

---

## What's Hardcoded (your 60%)

- Which sites to scrape (Google Maps only for now)
- Scoring weights and rules
- Outreach message templates per tone
- Hashtag lists
- Ad caption templates per tone

## What's Dynamic

- Actual business data from scraping
- Score values per lead (calculated from rules)
- Message personalization (filled from scraped data)
- Publish result from Instagram API