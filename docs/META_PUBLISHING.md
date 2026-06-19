# Meta Publishing & Ads — Free Testing Guide

How to test and publish to Instagram & Facebook from this MVP for **$0**, plus a
path to real paid ads later. Tailored to this codebase (`apps/web/lib/meta/`).

API version referenced: **v21.0** (current as of mid-2026; Meta ships a new
version quarterly, ~2-year support window).

## TL;DR

This app does **organic publishing** (Page/IG posts), NOT paid ads. That is the
easiest thing to test for free and it satisfies the MVP goal.

| Track | What it is | In this code | Free to test? |
|-------|-----------|--------------|---------------|
| Organic publishing | Posts on a Page / IG Business account | ✅ `lib/meta/publish.ts` | ✅ 100% free, real posts, no ad account |
| Paid ads (Marketing API) | Campaign → Ad Set → Ad with budget/targeting | ❌ not built | ✅ free via Sandbox Ad Account (never delivers/charges) |
| Boosting a post | "Boost" button = simplified paid ad | ❌ not built | ❌ requires real spend; skip for MVP |

Key facts:
- There is **no sandbox for organic publishing** — test posts are real. Put them
  on a **private/unpublished test Page** so nobody sees them.
- There **is** a sandbox for the **Marketing API** (paid side): a **Sandbox Ad
  Account** (one per app). Creates ad objects that never deliver, never spend,
  return no insights, and aren't visible in Ads Manager.
- You do **NOT** need App Review to publish to Pages/IG accounts **you
  administer** while the app is in Development mode.

## Testing tiers

### Tier 0 — Demo mode (no keys) — already working
- $0, no setup. Proves UI + AI copy + creative generation + publish guardrail.
- Nothing actually posts; uploaded images are data URLs.

### Tier 1 — Free organic publish (best next step)
- $0. Real posts on a Page you control. Tests `lib/meta/publish.ts` end-to-end.
- Keep the Page **Unpublished** so test posts aren't public.
- No App Review needed for your own assets in Development mode.

### Tier 2 — Free paid-ads API testing (Sandbox Ad Account)
- $0. Ads created but never delivered. Tests the Marketing API object graph.
- No insights, not in Ads Manager. Usable for App Review screencasts.

### Tier 3 — Production paid ads
- Real money. Requires App Review (`ads_management`), Business Verification,
  payment method, real ad account. Do this only with budget + a customer.

Recommendation for an intern MVP: ship **Tier 0 + Tier 1**. Add Tier 2 only if
evaluators want Marketing API code. Skip Tier 3.

## Setup — Tier 1 (organic, free)

Prerequisites (all free):
1. A Facebook account.
2. A Facebook **Page** (throwaway; set visibility to Unpublished).
3. An **Instagram Business/Creator** account linked to that Page.

Steps:
1. developers.facebook.com → My Apps → Create App → type **Business**.
2. Add products: **Facebook Login for Business** and **Instagram** (Graph API).
3. Graph API Explorer (developers.facebook.com/tools/explorer): select your app,
   choose **User Token**, add scopes:
   ```
   pages_show_list
   pages_read_engagement
   pages_manage_posts
   instagram_basic
   instagram_content_publish
   ```
   Generate token; grant access to your test Page.
4. Get a long-lived Page token (doesn't expire while you stay admin):
   ```bash
   # 1) short user token -> long-lived user token
   curl -s "https://graph.facebook.com/v21.0/oauth/access_token\
   ?grant_type=fb_exchange_token\
   &client_id=APP_ID\
   &client_secret=APP_SECRET\
   &fb_exchange_token=SHORT_USER_TOKEN"

   # 2) Page ID + Page token
   curl -s "https://graph.facebook.com/v21.0/me/accounts?access_token=LONG_USER_TOKEN"

   # 3) IG Business user ID from the Page
   curl -s "https://graph.facebook.com/v21.0/PAGE_ID\
   ?fields=instagram_business_account\
   &access_token=PAGE_ACCESS_TOKEN"
   ```
5. Fill `apps/web/.env`:
   ```env
   META_GRAPH_VERSION=v21.0
   META_ACCESS_TOKEN=<PAGE_ACCESS_TOKEN>
   META_PAGE_ID=<PAGE_ID>
   META_IG_USER_ID=<IG_BUSINESS_ACCOUNT_ID>
   ```
6. Restart `npm run dev`, generate a campaign with a Pollinations creative
   (public URL), and click **Publish now**.

Gotchas:
- **Page Publishing Authorization (PPA):** some Pages require PPA + 2FA before
  publishing works. Finish the prompt in Page settings if you hit a PPA error.
- **IG `image_url` must be public HTTPS.** Pollinations ✅. Demo-mode data URLs ❌.
  For uploaded images, configure Supabase Storage (public bucket) first.

## Setup — Tier 2 (Sandbox Ad Account, free)

1. App dashboard → add the **Marketing API** product.
2. Marketing API → Tools → **Sandbox Ad Account Management** → create one
   (limit: one per app).
3. Use `act_<AD_ACCOUNT_ID>` + your token in Graph API Explorer to create objects.
4. Remember: no delivery, no insights, not in Ads Manager.

## Code examples (fetch style, matches `lib/meta/`)

### Organic (already implemented)

```ts
// Facebook Page photo (publishFacebook)
const body = new URLSearchParams({ url: creativeUrl, caption, access_token: TOKEN });
await fetch(`https://graph.facebook.com/v21.0/${PAGE_ID}/photos`, { method: "POST", body });

// Instagram: create container then publish (publishInstagram)
// POST /{IG_USER_ID}/media { image_url, caption }
// POST /{IG_USER_ID}/media_publish { creation_id }
```

### Marketing API — minimal Campaign → AdSet → Creative → Ad (NEW, Tier 2)

All objects PAUSED so nothing can ever deliver.

```ts
const V = "v21.0";
const ACT = `act_${AD_ACCOUNT_ID}`;
const token = META_ACCESS_TOKEN;

async function mApi(path: string, params: Record<string, string>) {
  const res = await fetch(`https://graph.facebook.com/${V}/${path}`, {
    method: "POST",
    body: new URLSearchParams({ ...params, access_token: token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  return data;
}

const campaign = await mApi(`${ACT}/campaigns`, {
  name: "MVP Test Campaign",
  objective: "OUTCOME_TRAFFIC",
  status: "PAUSED",
  special_ad_categories: "[]",
});

const adset = await mApi(`${ACT}/adsets`, {
  name: "MVP Test AdSet",
  campaign_id: campaign.id,
  daily_budget: "10000",           // minor units; never spent in sandbox
  billing_event: "IMPRESSIONS",
  optimization_goal: "LINK_CLICKS",
  bid_amount: "100",
  status: "PAUSED",
  targeting: JSON.stringify({
    geo_locations: { countries: ["IN"] },
    age_min: 18,
    age_max: 35,
    publisher_platforms: ["facebook", "instagram"],
  }),
});

const creative = await mApi(`${ACT}/adcreatives`, {
  name: "MVP Creative",
  object_story_spec: JSON.stringify({
    page_id: PAGE_ID,
    instagram_actor_id: IG_USER_ID,
    link_data: { message: caption, link: "https://example.com", picture: creativeUrl },
  }),
});

const ad = await mApi(`${ACT}/ads`, {
  name: "MVP Ad",
  adset_id: adset.id,
  creative: JSON.stringify({ creative_id: creative.id }),
  status: "PAUSED",
});

// review/delivery status
// GET /{ad.id}?fields=effective_status,configured_status
```

### Image as a creative hash (avoids public-URL requirement for ads)

```ts
const form = new FormData();
form.append("bytes", base64ImageString);
form.append("access_token", token);
const img = await fetch(`https://graph.facebook.com/${V}/${ACT}/adimages`, {
  method: "POST",
  body: form,
}).then((r) => r.json());
// img.images.<key>.hash -> use in link_data.image_hash
```

Note: `image_hash` works for **ads** only. Organic IG requires a public
`image_url` (no hash option) — that's why uploaded images need Supabase Storage.

### Insights

```text
# Organic post insights (free, real once the post has views)
GET /v21.0/{page-post-id}/insights?metric=post_impressions,post_engaged_users

# Ad insights — only after real delivery (sandbox returns none)
GET /v21.0/{ad-id}/insights?fields=impressions,reach,clicks,spend
```

## Limitations table

| Capability | Demo (T0) | Dev organic (T1) | Sandbox ads (T2) | Production (T3) |
|---|---|---|---|---|
| Real Page/IG post | ❌ | ✅ | ❌ | ✅ |
| Create ad objects | ❌ | ❌ | ✅ | ✅ |
| Ad delivery / impressions | ❌ | n/a | ❌ | ✅ |
| Spend money | ❌ | ❌ | ❌ | ✅ |
| Insights data | ❌ | ✅ organic | ❌ | ✅ full |
| Visible in Ads Manager | ❌ | n/a | ❌ | ✅ |
| App Review required | ❌ | ❌ (own assets) | ❌ | ✅ |
| Business Verification | ❌ | ❌ | ❌ | ✅ |
| Schedule posts | ❌ | ✅ FB native; IG via worker | n/a | ✅ |

## Migration checklist: organic → Marketing API

Code:
- [ ] `Publisher` interface; `OrganicPublisher` (current) + `MarketingApiPublisher` (new).
- [ ] `publish_type: "organic" | "paid"` discriminator per campaign/asset.
- [ ] Promote `graphPost` into a shared `metaApi()` used by both.
- [ ] `META_AD_ACCOUNT_ID` env + `isMarketingConfigured()` alongside `isMetaConfigured()`.
- [ ] Object-graph helpers (campaign/adset/creative/ad) returning IDs.
- [ ] Status polling (`effective_status`) — ads don't publish instantly like posts.

DB schema (add now to avoid pain — `campaign_assets`):
```sql
alter table campaign_assets
  add column publish_type text default 'organic',
  add column meta_ad_account_id text,
  add column meta_campaign_id text,
  add column meta_ad_set_id text,
  add column meta_ad_id text,
  add column meta_creative_id text,
  add column delivery_status text,
  add column review_status text;
```

Process:
- [ ] App Review for `ads_management` + `ads_read` before any real account.
- [ ] Business Verification in Business Manager.
- [ ] Move from a single Page token → **System User token** for ad ops.
- [ ] Add a payment method to the real ad account.

## What NOT to build yet

- ❌ Paid ads / Marketing API (unless requested → Tier 2 sandbox only)
- ❌ Meta Pixel & Conversions API (paid conversion campaigns only)
- ❌ Boosting posts (requires spend)
- ❌ Multi-tenant OAuth login (use one long-lived Page token for now)
- ❌ Attribution / ROAS / budget optimization
- ❌ Ad insights dashboards (no delivery data without spend)

Do build/polish instead:
- ✅ Tier 1 organic publishing on a real test Page
- ✅ Supabase public Storage so uploaded images get public URLs (unblocks IG)
- ✅ FB native scheduling (done) + a simple worker for IG scheduled posts
- ✅ Organic post insights fetch (free; makes the feedback loop real)

## Permissions quick reference

| Permission | Purpose | App Review for others' accounts |
|---|---|---|
| `pages_show_list` | list Pages the user manages | Yes |
| `pages_read_engagement` | read Page metadata / find linked IG | Yes |
| `pages_manage_posts` | publish Page posts | Yes |
| `instagram_basic` | read IG profile/media | Yes |
| `instagram_content_publish` | publish IG photos/carousels/Reels | Yes |
| `ads_management` / `ads_read` | create/read ads | Yes (real accounts) |
| `business_management` | manage assets via Business Manager | Yes (optional) |

Development mode on your own assets needs no review.

## Official docs

- Graph API: https://developers.facebook.com/docs/graph-api
- Instagram Content Publishing: https://developers.facebook.com/docs/instagram-platform/content-publishing
- Pages posts API: https://developers.facebook.com/docs/pages-api/posts
- Permissions reference: https://developers.facebook.com/docs/permissions
- Marketing API get started: https://developers.facebook.com/docs/marketing-apis/get-started
- Sandbox Ad Accounts: https://developers.facebook.com/docs/marketing-api/best-practices/sandbox-ad-account
- Ad objects reference: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group
- System User tokens: https://developers.facebook.com/docs/marketing-api/system-users
- App Review: https://developers.facebook.com/docs/app-review
