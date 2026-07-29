# Agentic Autopilot implementation record

This document is updated as each major implementation phase is completed. The
Autopilot work is additive: existing campaign, organic, and lead-generation
workflows remain available and unchanged.

## Roadmap alignment — research stabilization — completed

- Research now returns a stored report on repeat runs instead of calling SerpAPI
  again; append `?force=true` to the research endpoint to refresh it.
- A campaign already in `researching` returns HTTP 409, preventing concurrent
  duplicate research calls.
- Completed research transitions to `researched`, and legacy organic campaigns
  are registered with the backend automatically on their first research run.

## Phase 1 — Additive foundation — completed

- Defined an Autopilot campaign contract: goal, monthly budget, daily spend cap,
  allowed platforms, approval mode, and autopublish preference.
- Added a shared campaign journey and decision log so every automated choice is
  visible in persisted campaign results.
- Kept existing workflow inputs and default behavior intact.

## Phase 2 — Bright Data Studio integration — completed

- Added `bright_data_studio`, a registered scraper that triggers a published
  Bright Data Scraper Studio collector, polls its collection snapshot, and
  normalizes common result schemas into existing `Lead` records.
- Added environment-based configuration for the API token, collector ID, custom
  collector input field, poll interval, and maximum wait time.
- Missing credentials safely produce no results and a clear campaign log entry;
  they do not break any existing scraper or workflow.

Required deployment configuration:

```text
BRIGHT_DATA_API_TOKEN=<Bright Data API token>
BRIGHT_DATA_COLLECTOR_ID=<published Studio collector ID, c_...>
# Optional: defaults to keyword; set this to the field your collector expects.
BRIGHT_DATA_INPUT_FIELD=keyword
```

## Phase 3 — Agentic planning and execution workflow — completed

- Added `autopilot_campaign` as a separate workflow: source selection → research
  → strategy → planning → content → policy-controlled publishing.
- Added visible decision records and an ordered journey so every agent action is
  persisted with the campaign result.
- Budget is handled deterministically: `0` creates an organic-only route; a
  positive budget creates a capped paid-media plan. No paid-media account is
  charged because no ads connector exists yet.
- Autopublish is opt-in. When disabled, generated content remains ready for
  review; when enabled, only configured/allowed publishing platforms are used.
- Completed runs mark creation complete and leave measurement ready for the next
  Autopilot cycle.
- Autopilot now attaches a Pollinations image URL to each generated asset before
  optional Meta publishing, completing the product → research → content → image
  → publish MVP chain.

## Phase 4 — API and web entry point — completed

- Added an **Autopilot** tab to the campaign form with just the necessary
  controls: goal, budget, optional daily cap, target platforms, and autopublish.
- Added a separate server route that creates and starts `autopilot_campaign` in
  the existing backend without changing the organic or lead-generation routes.
- Added result synchronization and polling for the Autopilot journey, decisions,
  research, paid-plan status, and generated assets.

## Phase 5 — Tests and verification — completed

- Passed 4 dependency-free backend tests covering zero-budget routing, capped
  paid-plan routing, publishing opt-in, and Bright Data row normalization.
- Passed Python bytecode compilation, workflow registration, and `npx tsc
  --noEmit`.
- `npm run lint` passes. The full `next build` reaches successful application
  compilation but then fails while linting pre-existing Playwright JavaScript
  under `apps/web/app/venv`; this is unrelated to Autopilot TypeScript and is
  outside the changed files.
