# Test fixtures — Social Campaign MVP

Realistic client briefs for manual QA at http://localhost:3000.

## Quick start

```bash
cd apps/web/test-fixtures
chmod +x download-assets.sh print-client.sh
./download-assets.sh
./print-client.sh nexresume
```

Then open **Products → New product**, copy values from the printed output, and upload files from `assets/`.

## Clients

| ID | Client | Platforms | Notes |
|----|--------|-----------|-------|
| `nexresume` | NexResume (EdTech SaaS) | IG + FB + LinkedIn | Full flow; edit IG caption, regenerate creative |
| `glowroot` | GlowRoot (skincare D2C) | IG + FB | Visual brand; test publish error without Meta |
| `ironpulse` | IronPulse (local gym) | IG only | Regenerate creative twice |
| `cloudnest` | CloudNest (B2B cloud) | LinkedIn only | Professional tone; generate-only |
| `quickbite` | QuickBite (minimal) | All three | No images; tests fallback copy |

List all: `./print-client.sh`

## Manual test flow (each client)

1. `./print-client.sh <id>` — copy form fields
2. `/products/new` — paste fields, upload logo + images from `assets/`
3. Select platforms shown in fixture → **Generate campaign**
4. Verify `expected` block in `clients/<id>.json`
5. Apply `suggested_edits` on the campaign dashboard if present

## QA checklist (once per session)

```
[ ] download-assets.sh completed
[ ] nexresume — 3 cards, platform-specific copy
[ ] glowroot — 2 cards only
[ ] ironpulse — 1 card, regenerate creative works
[ ] cloudnest — LinkedIn generate-only badge
[ ] quickbite — no crash, fallback copy, letter avatar "Q"
[ ] Edit + save caption persists (same dev session)
[ ] /campaigns lists all generated campaigns
```

## Meta publish (optional)

Requires `.env` with `META_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID`.

Use **glowroot** or **nexresume** with Pollinations creatives (public URLs). Uploaded fixture images in demo mode are data URLs and will **not** publish to Meta until Supabase storage is configured.

## File layout

```
test-fixtures/
  index.json           # manifest of all clients
  download-assets.sh   # fetch picsum placeholder images
  print-client.sh      # print copy-paste values for the UI
  assets/              # downloaded images (gitignored)
  clients/
    nexresume.json
    glowroot.json
    ironpulse.json
    cloudnest.json
    quickbite.json
```
