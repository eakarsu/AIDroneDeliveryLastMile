# Audit Note — AIDroneDeliveryLastMile

Domain: drone delivery last-mile — flight planning, NOTAM checks, weather routing, payload mgmt, vertiport ops, FAA Part 135 compliance.

Pattern reference: `/Users/erolakarsu/projects/AISpaceDebrisTracker/_AUDIT_NOTE.md`.

## Inventory

- CRUD routes (22): `airspaceZones`, `attachments`, `auditLog`, `auth`, `batteries`, `customers`, `customViews`, `dashboard`, `depots`, `drones`, `flights`, `incidents`, `maintenanceLogs`, `missions`, `notifications`, `observers`, `packages`, `payloadSpecs`, `pilots`, `regulatoryApprovals`, `routeCorridors`, `vertiports`, `weatherBriefs`, `webhooks`.
- AI endpoints (16): `route-corridor-plan`, `weather-flight-window`, `mission-brief`, `anomaly-triage`, `executive-brief`, `payload-weight-optimize`, `battery-cycle-prognostic`, `regulatory-checklist`, `pilot-shift-schedule`, `ground-observer-plan`, `conflict-airspace-detect`, `customer-comms-draft`, `vertiport-capacity-plan`, `contingency-landing-plan`, `incident-post-mortem`, `vendor-quality-score`.
- Frontend pages: 16 AI pages + 22 CRUD pages + Dashboard/Login/Codex features.
- Services: `ai.js` (OpenRouter), `webhooks.js`, `uploadStore.js`.

## Gap Analysis

### Missing AI Counterparts
- **Customer ETA narrator** — natural-language delivery ETA updates tied to live flight progress (closest existing: `customer-comms-draft`, but that is order-level not in-flight ETA).
- **Weight/balance advisor** — CG calculation + load placement guidance for multi-package payloads (existing `payload-weight-optimize` covers total weight, not CG).
- **Delivery-window predictor** — probabilistic on-time arrival forecast across pending missions (no equivalent).
- **NOTAM-aware route re-optimizer** — re-route on live NOTAM ingestion (existing `route-corridor-plan` is static-input only).

### Missing Non-AI Features
- **FAA Part 135 records ledger** — pilot duty time, aircraft airworthiness, training records audit trail (partial coverage via `pilots`, `maintenanceLogs`, `regulatoryApprovals`; no consolidated Part 135 view).
- **Customer notification dispatch** — outbound SMS/email pipeline (model `notifications` exists; no provider integration).
- **NOTAM / TFR feed ingestion** — FAA SWIM or external feed (NEEDS-CREDS).
- **Live weather feed** — METAR/TAF/NWS pull (currently manual `weatherBriefs` records; NEEDS-CREDS).
- **Vertiport scheduling conflict detector (non-AI)** — deterministic slot-collision check.

### Custom Feature Suggestions
- **BVLOS planner** — beyond-visual-line-of-sight mission feasibility scoring (observers, comms relays, waiver state).
- **Geofence advisor** — recommend dynamic geofence polygons given airspace zones + population density + schools/hospitals.
- **Return-to-launch arbiter** — decision engine: continue / divert / RTL / contingency-land given battery, weather, comms loss.
- **Multi-drone swarm deconfliction** — 4D trajectory deconfliction across concurrent missions.
- **Energy budget optimizer** — battery swap vs charge scheduling across fleet/vertiports.
- **Delivery-density route bundling** — cluster orders into shared corridors.

## Implemented (this round)

None — audit-only.

## Status

- Routes: 22 CRUD + 1 AI router (16 AI endpoints) + auth.
- Frontend: 38 pages.
- AI gaps: 4 missing counterparts.
- Non-AI gaps: 5 (2 NEEDS-CREDS).
- Custom suggestions: 6.
- Status: AUDIT-ONLY. No code changes.

## Apply pass 7 (full backlog implementation)

Closes the full audit backlog. Append-only; no breaking changes; no new dependencies.

### MECHANICAL — implemented
- **4 missing AI counterparts** in `backend/services/ai.js` + `backend/routes/ai.js` + sample fills:
  - `POST /api/ai/customer-eta-narrate` — in-flight ETA narration tied to live progress.
  - `POST /api/ai/weight-balance-advise` — CG calculation + load placement for multi-package payloads.
  - `POST /api/ai/delivery-window-predict` — probabilistic on-time forecast across pending missions.
  - `POST /api/ai/notam-aware-reroute` — re-optimize a corridor against supplied NOTAMs / TFRs.
- Frontend pages: `AICustomerEtaNarratePage.js`, `AIWeightBalanceAdvisePage.js`, `AIDeliveryWindowPredictPage.js`, `AINotamAwareReroutePage.js`. Wired into `App.js` + `Sidebar.js`. API helpers added in `frontend/src/services/api.js`.

### NEEDS-PRODUCT-DECISION — implemented
- **Part 135 records ledger** as CRUD: `POST/GET/PUT/DELETE /api/part135-records` (consolidates pilot duty time, aircraft airworthiness, training, medical, checkride). Backed by new table `part135_records` (migration `003_schema.sql`). Page: `Part135RecordsPage.js` (added under Regulatory).
- **Vertiport scheduling conflict detector** (deterministic, no AI):
  - New `vertiport_slots` table (slot reservations per vertiport + pad_index).
  - CRUD: `/api/vertiport-slots`.
  - Conflict logic: `GET /api/vertiport-slots/conflicts?vertiport_id=…` — O(n²) overlap scan keyed on `vertiport_id + pad_index`; severity = high (both confirmed) / medium (one confirmed) / low (both reserved).
  - Page: `VertiportSlotsPage.js` (added under Vertiports) with inline Conflict Panel.

### NEEDS-CREDS — 503 stubs
- `backend/routes/feeds.js` mounted at `/api/feeds`:
  - `GET /feeds/notam`, `POST /feeds/notam/refresh` — FAA SWIM NOTAM / TFR feed.
  - `GET /feeds/weather`, `POST /feeds/weather/refresh` — METAR / TAF feed.
  - `POST /feeds/notify/dispatch` — SMS / email / push dispatcher.
  - `GET /feeds/status` — returns which providers are configured (env presence only; never values).
- All four upstream endpoints return **HTTP 503** with `{ status: 'unconfigured', provider, required_env, hint }` until env vars are wired. Credentials are never wiped.
- Admin page `FeedsAdminPage.js` mounted at `/feeds-admin` (under Admin).

### TOO-RISKY autonomy — advisory only
- `backend/routes/autonomyAdvisory.js` mounted at `/api/autonomy`. Every response carries `advisory_only: true` and `operator_must_review: true`. **None of these endpoints command a drone or alter live tasking.**
  - `POST /autonomy/bvlos-feasibility` — deterministic BVLOS feasibility score (go / caution / no_go).
  - `POST /autonomy/rtl-arbiter` — recommends continue / divert / rth / land / parachute from battery / comms / wind / distance.
  - `POST /autonomy/swarm-deconflict` — coarse 4D proximity advisory across trajectories (1-min bucket, 200m / 30m).
  - `POST /autonomy/geofence-advise` — corridor half-width + school / hospital buffer recommendation.
  - `POST /autonomy/energy-budget` — swap-vs-charge throughput advisory.
  - `POST /autonomy/density-bundle` — greedy grid-cluster bundling of orders.
- Page: `AutonomyAdvisoryPage.js` mounted at `/autonomy-advisory` (under Autonomy (Advisory)). Page header carries a yellow warning banner reinforcing advisory-only status.

### Schema
- `backend/migrations/003_schema.sql` — adds `part135_records` and `vertiport_slots` tables with indexes. Applied in `backend/seed/seed.js` after migration 002 (additive, idempotent; tables added to seed drop list).

### Wiring (`backend/server.js`)
- Mounted four new routers BEFORE `app.listen` (no explicit 404 handler exists in this project, so this is the equivalent "before 404" position):
  - `/api/part135-records`, `/api/vertiport-slots`, `/api/feeds`, `/api/autonomy`.

### Syntax
- `node --check` PASS on every modified / new .js file:
  - `backend/server.js`, `backend/routes/ai.js`, `backend/services/ai.js`,
  - `backend/routes/part135Records.js`, `backend/routes/vertiportSlots.js`,
  - `backend/routes/feeds.js`, `backend/routes/autonomyAdvisory.js`,
  - `backend/seed/seed.js`,
  - `frontend/src/services/api.js`, `frontend/src/App.js`, `frontend/src/components/Sidebar.js`,
  - all eight new pages under `frontend/src/pages/`.
- Smoke: `node -e` loaded all four new routers via Express successfully (no runtime require errors).

### Skips
- No new npm dependencies added.
- No edits to existing CRUD page JSX bodies; new pages added alongside.
- AI calls still route through existing `services/ai.js` → OpenRouter; canonical credentials path unchanged.

### Status
- AI gaps: 0 remaining (16 → 20 endpoints).
- Non-AI gaps: 0 remaining (Part 135 ledger + vertiport conflict detector shipped; NOTAM / weather / notification feeds stubbed pending creds).
- Custom suggestions: 6 shipped as advisory-only.
- Status: BACKLOG-CLEAR. Mechanical + Product-decision items live; NEEDS-CREDS items return 503; TOO-RISKY items are advisory only.
