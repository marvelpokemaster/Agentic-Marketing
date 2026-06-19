# Agentic Marketing

A social campaign generation product: upload product info and images, generate
ready-to-post content and creatives for Instagram, Facebook, and LinkedIn, then
publish or schedule to Meta platforms.

## Repository layout
```
apps/web/                 → Active MVP: Next.js + Supabase social campaign studio
legacy/fastapi-leadgen/   → Preserved previous app: FastAPI lead generation,
                            scoring, scraping, outreach, analytics (future modules)
AgenticMarketing_MVP Goal.pdf → Source spec for the current MVP
```

## Current MVP (apps/web)
See [`apps/web/README.md`](apps/web/README.md) for setup and usage.

```bash
cd apps/web
npm install
cp .env.example .env
npm run dev    # http://localhost:3000 (works in demo mode without keys)
```

Flow: **Add product → Select platforms → Generate campaign → Review/edit →
Publish or schedule** (Instagram/Facebook via Meta Graph API).

## Legacy app (legacy/fastapi-leadgen)
The earlier lead-generation/outreach system is intentionally preserved for future
agentic capabilities (lead discovery, scoring, outreach automation, analytics)
that the MVP spec defers. See [`legacy/fastapi-leadgen/LEGACY_NOTE.md`](legacy/fastapi-leadgen/LEGACY_NOTE.md).

## What this MVP intentionally does not include
Lead discovery, customer identification, automated DM outreach, lead scoring,
complex analytics, recommendation engines, ad budget optimization, and multi-agent
frameworks — these are out of scope per the MVP goal and live in the legacy app.
