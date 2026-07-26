# Agentic Marketing — Social Campaign Studio (MVP)

Upload a product, generate ready-to-post content and creatives for Instagram,
Facebook, and LinkedIn, then review and publish or schedule to Instagram and
Facebook via the Meta Graph API.

This is the active MVP, built from `AgenticMarketing_MVP Goal.pdf`.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Firebase (Authentication, Data Connect, Cloud SQL, Storage)
- AI content: Gemini / OpenAI / Anthropic (pluggable, with deterministic fallback)
- Creatives: Pollinations (default, keyless) / OpenAI Images / Stability
- Publishing: Meta Graph API (Facebook Pages + Instagram Business)

## Quick start
```bash
cd apps/web
npm install
cp .env.example .env       # fill in keys (optional — demo mode works without them)
npm run dev                # http://localhost:3000
```

### Demo mode (no setup)
With no Firebase keys, the app runs in demo mode:
- A fixed demo user is used (no login).
- Products and campaigns are stored in memory for the server session.
- AI falls back to deterministic copy if no AI key is set.
- Creatives use Pollinations (free, no key).

This lets you click through Add product → Generate campaign → Review immediately.

## Full setup
1. Set up a Firebase project with Authentication (Email/Password), Data Connect, and Storage.
2. Deploy the Data Connect schema: `firebase deploy --only dataconnect`.
3. Set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` in `.env`.
4. Set an AI provider key (`AI_PROVIDER`, `AI_PROVIDER_API_KEY`).
5. For publishing, set `META_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID`.

## Flow
```
Add product → Select platforms → Generate campaign → Review/edit → Publish or schedule
```

## Notes on publishing
- Facebook Page photo posts support native scheduling (`scheduled_publish_time`).
- Instagram publishes immediately (Graph API has no native scheduling); schedule
  IG via your own cron/worker calling the publish route at the target time.
- LinkedIn is generate-only in this MVP (no publish API wired).
- Meta requires public image URLs. Generated Pollinations creatives are public;
  user-uploaded images in demo mode are inline data URLs and are not publishable.

## Scripts
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
