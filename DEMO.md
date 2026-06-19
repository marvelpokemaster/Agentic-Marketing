# Demo Guide — Social Campaign MVP

A step-by-step walkthrough for demoing the app at http://localhost:3000.
Works fully in **demo mode** (no API keys required).

## Directory layout (what matters for the demo)

```text
Agentic-Marketing/
├── AgenticMarketing_MVP Goal.pdf     # spec (optional to mention)
├── legacy/fastapi-leadgen/           # old app — NOT part of this demo
└── apps/web/                         # ← the live MVP
    ├── app/                          # pages + API routes
    ├── test-fixtures/                # ← demo client data + images
    │   ├── download-assets.sh
    │   ├── print-client.sh
    │   ├── assets/                   # logos + product photos
    │   └── clients/*.json
    ├── .env.example
    └── package.json
```

For the demo you only touch `apps/web` and `apps/web/test-fixtures`.

## Terminal setup (use 2 terminals)

### Terminal A — dev server (keep running)

```bash
cd ~/Documents/Agentic-Marketing/apps/web

# First time only:
npm install
cp .env.example .env    # optional — demo works with empty .env

npm run dev
```

Expected:

```text
▲ Next.js 14.2.15
- Local: http://localhost:3000
✓ Ready
```

Leave this open. Do NOT restart during the demo — demo mode stores data in
memory and resets on restart.

### Terminal B — test fixtures (copy-paste values + file paths)

```bash
cd ~/Documents/Agentic-Marketing/apps/web/test-fixtures

# First time only:
chmod +x download-assets.sh print-client.sh
./download-assets.sh

# Before each client demo:
./print-client.sh nexresume
```

List all clients: `./print-client.sh`

## Before you present (2-minute prep)

1. Dev server running → http://localhost:3000 loads
2. Assets downloaded → `ls test-fixtures/assets/` shows ~12 images
3. Browser open to http://localhost:3000
4. Optional: open a file manager at
   `~/Documents/Agentic-Marketing/apps/web/test-fixtures/assets/`
   so you can drag images into the upload form

Say upfront:

> "This runs in demo mode — no Supabase or Meta keys needed. Products and
> campaigns persist for this session. AI uses fallback copy if no API key;
> creatives come from Pollinations (free)."

On the home page, point at the status chips:
- Supabase: demo mode
- Meta publishing: not configured

## Main demo script (~8–10 min) — client: NexResume

### Step 1 — Home (30 sec)

URL: http://localhost:3000

> "Upload product info → pick platforms → AI generates captions, hashtags,
> creatives → review and publish."

Click **Add a product**.

### Step 2 — Create product (2 min)

URL: http://localhost:3000/products/new

In Terminal B: `./print-client.sh nexresume`

Copy from terminal into the form:

| Form field | Value source |
|------------|--------------|
| Product name | NexResume |
| Description | (full paragraph from script) |
| Features | one per line (4 lines) |
| Target audience | Final-year students… |
| Industry | EdTech / Career SaaS |

Upload files (paths printed by the script):

```text
Logo:   test-fixtures/assets/nexresume-logo.png
Images: test-fixtures/assets/nexresume-product-1.jpg
        test-fixtures/assets/nexresume-product-2.jpg
```

Click **Save & continue** → redirects to generate page.

> "Product knowledge is stored — this drives all generated copy."

### Step 3 — Generate campaign (1–2 min)

URL: `/products/<id>/generate`

- Keep all three selected: Instagram, Facebook, LinkedIn
- Click **Generate campaign**

Wait ~5–15 seconds (copy + Pollinations creatives).

> "One brief, three platform-specific posts plus matching creatives."

### Step 4 — Review dashboard (3 min)

URL: `/campaigns/<id>`

| Platform | What to highlight |
|----------|-------------------|
| Instagram | More hashtags, emoji-friendly caption |
| Facebook | Longer, conversational post |
| LinkedIn | Professional tone, Generate-only badge |

Live edit (Instagram):
1. Append to post copy: `🚀 Limited launch offer — first 100 users free`
2. Click **Save edits** → "Saved."
3. Click **Regenerate creative** → new image loads

> "Human-in-the-loop: edit before anything goes live. LinkedIn is generate-only
> in this MVP; Meta publish is wired for IG + FB when keys are added."

### Step 5 — Publish guardrail (30 sec)

Click **Publish now** on Facebook or Instagram.

Expected without Meta keys: button disabled or error like
*Meta publishing is not configured*.

> "Publishing is guarded — nothing goes out without Meta credentials."

### Step 6 — Campaign list (30 sec)

URL: http://localhost:3000/campaigns

> "All generated campaigns in one place — one product per client brief."

## Optional quick hits (extra clients)

Run in Terminal B, then repeat Steps 2–4 with different platform selections:

```bash
./print-client.sh glowroot    # IG + FB only → 2 cards
./print-client.sh ironpulse   # IG only → regenerate creative twice
./print-client.sh cloudnest   # LinkedIn only → professional tone
./print-client.sh quickbite   # no images → fallback still works
```

| Client | Platforms to select | Wow moment |
|--------|---------------------|------------|
| glowroot | Instagram + Facebook | Beauty copy, 2 cards only |
| ironpulse | Instagram only | Regenerate creative twice |
| cloudnest | LinkedIn only | B2B tone, no publish button |
| quickbite | All three | Name only, no crash (fallback copy) |

## 5-minute version (demo arc)

```bash
# Terminal A
cd ~/Documents/Agentic-Marketing/apps/web && npm run dev

# Terminal B
cd ~/Documents/Agentic-Marketing/apps/web/test-fixtures
./print-client.sh nexresume
```

Browser:
1. `/products/new` → paste + upload nexresume assets
2. Generate → all 3 platforms
3. Edit caption + regenerate creative
4. Show publish guardrail
5. `/campaigns` → list view

## "Real client" demo (keys required)

Edit `apps/web/.env`:

```env
AI_PROVIDER=gemini
AI_PROVIDER_API_KEY=your_key

META_ACCESS_TOKEN=...
META_PAGE_ID=...
META_IG_USER_ID=...
```

Restart dev server (Ctrl+C → `npm run dev`).

> "With Gemini, copy is LLM-generated. With Meta tokens, Publish now posts to the
> Page/IG account. Pollinations creatives are public URLs and work for Meta;
> uploaded images need Supabase storage for real publish."

See `docs/META_PUBLISHING.md` for the full free Meta setup.

## Common demo pitfalls

| Issue | Fix |
|-------|-----|
| Data disappeared | Dev server was restarted — demo mode is in-memory |
| Generate is slow | Normal — Pollinations + optional AI call |
| Publish fails | Expected without Meta; or creative must be a public URL |
| Can't find images | `cd apps/web/test-fixtures && ./download-assets.sh` |
| `print-client.sh` fails | Install jq: `sudo pacman -S jq` |

## Cheat sheet

```bash
# Start app
cd ~/Documents/Agentic-Marketing/apps/web
npm run dev

# Prep demo client
cd ~/Documents/Agentic-Marketing/apps/web/test-fixtures
./print-client.sh nexresume

# Browser flow
# http://localhost:3000/products/new
# → Save & continue
# → Generate (IG + FB + LinkedIn)
# → Edit + Regenerate creative
# → http://localhost:3000/campaigns
```
