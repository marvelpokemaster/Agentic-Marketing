# Legacy: FastAPI Lead Generation App

This folder holds the **previous** Agentic Marketing product: a Python FastAPI app
focused on lead generation, AI lead scoring, website scraping/enrichment, outreach
drafting, send execution, tracking, and analytics.

It has been **preserved intentionally**. The current MVP (see the repo root /
`apps/web`) is a Next.js + Supabase social campaign generator built from
`AgenticMarketing_MVP Goal.pdf`. The capabilities here are valuable for **future**
agentic features (lead discovery, scoring, outreach automation, analytics) that the
PDF explicitly defers past the initial MVP.

## What's here
- `src/` — FastAPI app, lead gen + marketing pipelines, shared infra
- `main.py` — entry point (web UI + CLI)
- `requirements.txt` — Python dependencies
- `scripts/run.sh` — venv runner
- `outputs/` — JSON persistence from prior runs
- `.env` / `.env.example` — Python app config (Gemini, SerpApi, SMTP, etc.)
- `README.md` — original project README

## Running the legacy app
```bash
cd legacy/fastapi-leadgen
python -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # set keys
python main.py         # http://127.0.0.1:8000
```

Nothing in this folder is imported by the new MVP app.
