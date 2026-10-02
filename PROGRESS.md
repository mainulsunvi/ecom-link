# Ecom-Link Progress

> Last updated: 2026-10-03
> Project: Framer plugin connecting Framer with eCommerce platforms (WooCommerce first)
> Current phase: **Spec 001 and 002 implemented. Next: spec 003 (product import and sync).**

## Project Status at a Glance

| Phase (INSTRUCTION.md) | Status |
|---|---|
| 1. Scaffold | Done (pre-existing Framer CLI scaffold, untouched) |
| 2. Preflight research and feature planning | Done (`docs/RESEARCH.md`, `docs/FEATURES.md`) |
| 3. Spec driven development | Done (8 MVP specs in `.specs/`, 11 future specs in `.specs/future/`) |
| 4. Help Guide | Specified (spec 005), not built |
| 5-9. Coding/UI/UX/forms/docs conventions | Binding rules captured in agent files and specs |
| 10. Sub-agents | Done (9 files in `.github/agents/`, verified complete) |
| API verification | Done (`docs/API-NOTES.md`) |
| Implementation | **Starting now** |

---

## What Was Done

### 1. Research and Discovery (`docs/RESEARCH.md`)
Covers every area required by INSTRUCTION.md section 2.1: product goals, use cases (UC-1 to UC-10), personas, pain points, functional/technical specs, error matrix, user flows, sync requirements, expected Woo data structure, Framer integration limits, auth flows, IA, security, scalability, rate limits, and future opportunities.

**Per-platform competitor research** (user-requested, done individually per platform):
- **WooCommerce → Framer**: FeCommerce (free, companion WP "CORS Bridge" plugin, on-page checkout) and FrameWoo (freemium, 15-product free tier, one-time pricing). Neither offers AI or binding-safe identity emphasis.
- **Shopify → Framer**: Framer Commerce (award winner, 40+ components), ShopifyConnect (FeCommerce, free), Shopify CMS Sync (100% free, no backend, direct Storefront API, product-ID identity). Most mature segment.
- **Wix → Framer**: no plugins exist. White space, but blocked by Wix OAuth (backend required).
- **Webflow → Framer**: no live sync; only a one-time CSV CMS migration tool. Webflow sunsetting native ecommerce (platform risk; validates Woo-first).
- **General commerce tools** catalogued (checkout/payments plugins, adjacent not competing).

**Key technical findings**:
- WooCommerce REST API sends no CORS headers; browser-direct calls fail. Writes (PUT/POST) additionally require an `OPTIONS` preflight the store won't answer. Strategy: optional companion WordPress plugin or future proxy (M5).
- Two-way sync verified feasible: `PUT /products/{id}` writes stock (with `manage_stock`), prices, SKU, name, descriptions, status, weight; `POST /products/batch` for bulk. Requires `read_write` keys.
- No researched competitor pushes Framer edits back to the store: two-way sync is a genuine differentiator.

### 2. Feature Planning (`docs/FEATURES.md`)
- **MVP (M1-M11)**: provider abstraction, store connection manager, product import with field mapping, incremental re-sync, CORS helper, first-run Help Guide, AI content assist, error handling/reliability, dashboard/settings, user help docs, two-way sync write-back.
- **Future (F1-F11)**: Shopify/Wix/Webflow providers, managed proxy and background syncs, storefront components, full variant sync, cart/checkout, AI expansions, multi-store, sync rules, web admin, analytics, advanced write-back.

### 3. Architecture (`architecture.md`)
Layered design: views → sync engine → providers → storage → Framer Plugin API. Folder structure for `src/`. Seven key decisions (D1-D7) including no backend in MVP, `woo_id` identity, field-scoped two-way sync, snapshot-based Framer-side change detection, per-project plugin data storage, provider capability flags, asset pipeline for images.

### 4. Sub-Agent Files (`.github/agents/`, 9 files)
`orchestrator`, `planner`, `architect`, `frontend`, `backend`, `security`, `tester`, `reviewer`, `documentation` — all adapted from the Shopify example to Framer plugin scope (e.g. webhooks → manual triggers, metafields → plugin data, scopes → Woo key scopes, app uninstall → plugin re-add). Model set to GLM-5.2 (architect updated by user to `GLM-5.2 (zai)`).

### 5. MVP Specs (`.specs/`, 8 files)
| Spec | Feature(s) | Status |
|---|---|---|
| `001-provider-architecture.md` | M1 provider contract, registry, capability flags | Ready for build |
| `002-store-connection-and-cors.md` | M2+M5 connection, masked credentials, typed errors, CORS/preflight detection | **Implemented 2026-10-03** (amended: CMS-collection storage) |
| `003-product-import-and-sync.md` | M3+M4 paged import, `woo_id` identity, watermark, safety cap, cancellation, reports, Woo adapter | Ready for build |
| `004-two-way-sync-write-back.md` | M11 snapshot change detection, preview gate, conflict resolution, batch writes, no-delete rail | Ready for build |
| `005-help-guide.md` | M6 first-run guide | Ready for build |
| `006-ai-content-assist.md` | M7 editable AI drafts for empty content | **Blocked: see open question** |
| `007-dashboard-settings-reliability.md` | M8+M9 dashboard, modal router, error sentence mapping | Ready for build |
| `008-help-documentation.md` | M10 six `docs/help/` pages with binding doc rules | Ready for build |

### 6. Future Specs (`.specs/future/`, 11 files)
| Spec | Feature(s) | Status |
|---|---|---|
| `F01-additional-platform-providers.md` | F1 Shopify, Wix, Webflow providers | Documented, not built |
| `F02-managed-proxy-and-background-syncs.md` | F2 Backend proxy, OAuth, background syncs | Documented, not built |
| `F03-storefront-component-library.md` | F3 Drag-and-drop product components | Documented, not built |
| `F04-full-variant-sync.md` | F4 Per-variant items, variation write-back | Documented, not built |
| `F05-cart-and-checkout-in-framer.md` | F5 Native cart and checkout | Documented, not built |
| `F06-ai-expansions.md` | F6 Bulk AI, tone presets, translation | Documented, not built |
| `F07-multi-store-support.md` | F7 Multiple connections per project | Documented, not built |
| `F08-sync-rules-and-scheduling.md` | F8 Conditional rules, automatic syncs | Documented, not built |
| `F09-web-admin-dashboard.md` | F9 Centralized dashboard for agencies | Documented, not built |
| `F10-analytics.md` | F10 Sync metrics, catalog health | Documented, not built |
| `F11-advanced-write-back.md` | F11 Image upload, platform-specific two-way | Documented, not built |

### 7. API Verification (2026-10-03)
Verified `@framer/plugin` v4.1.0 API surface:
- **CMS API**: Full CRUD for collections, items, fields (all field types supported)
- **Assets API**: `addImage()`, `addFile()` for asset management
- **Plugin data storage**: NOT AVAILABLE (no `getPluginData`/`setPluginData`)
- **AI capabilities**: NOT AVAILABLE (no AI/generation methods)
- **Selection & Canvas**: `subscribeToSelection()`, `showUI()`
- **Permissions**: `useIsAllowedTo()` for action checking

**Key findings**:
- No plugin-scoped storage → must use CMS collections for persistence
- No AI APIs → spec 006 (M7) blocked, reduce to stub or defer
- Image handling requires `addImage()` download (D7 in architecture)
- Batch operations available via `batchUpdateItems()`

**Open questions resolved**:
1. AI capability surface: NOT AVAILABLE in v4.1.0
2. Plugin data encryption: Store in CMS collection; document security limitations
3. CMS batch-write size: `batchUpdateItems()` available; test limits during implementation
4. Gallery images cap: Decision needed (recommend 10 images max)

### 8. Spec 002 Implementation (2026-10-03)

**Shipped**: connection CRUD in the internal CMS collection (`src/storage/connections.ts`), WooCommerce validation client with typed errors and retry/backoff (`src/providers/woocommerce/client.ts`), provider registration (`src/providers/woocommerce/index.ts`, product methods stubbed until spec 003), reusable UI (`Switch`, `HelpTooltip`, `Modal`, `Field`, `CredentialFields`), connection flow (`ConnectionModal`), dashboard shell (`Dashboard`, `App.tsx`), tests (`vitest`, mocked CMS + fetch), and two help pages.

**Spec amendment**: storage moved from plugin data (not available in v4) to a dedicated internal CMS collection "Ecom-Link Internal"; architecture D5 updated; spec 002 sections 2, 6, 7, and 8 amended; multi-connection storage with "Set active" recorded as a user-directed F7 slice inside M2.

**Notes for the next run**:
- Run `pnpm install` before `pnpm test`; vitest, jsdom, and @testing-library/react were added as dev dependencies and the lockfile needs a refresh.
- `docs/help/Connections.md` was created per user request; spec 008 expects "Connect Your WooCommerce Store.md". Reconcile the name during spec 008 (rename the page or amend spec 008).
- Security review passed with one standing warning: credentials live in a CMS collection that anyone with CMS access can read, and CMS collections can be queried on published sites if bound to pages. Documented on the Connections help page; revisit if Framer ships plugin-scoped storage.
- The companion WordPress plugin (origin-locked CORS headers, OPTIONS preflight) is still to be scheduled as its own backend task.

---

## Open Questions (resolve before/during build)

1. ~~**BLOCKING (spec 006)**: Confirm the exact AI capability surface in `@framer/plugin` v4~~ **RESOLVED 2026-10-03**: AI APIs NOT AVAILABLE in v4.1.0. Spec 006 (M7) must be reduced to stub or deferred to post-MVP.
2. (spec 002) Plugin-data encryption for secrets: depends on what `@framer/plugin` v4 exposes; otherwise store in plugin data with masked reads and flag for Security review. **Status**: **RESOLVED 2026-10-03**. No plugin-scoped storage exists; connections are stored in the internal CMS collection with masked reads everywhere, Security-reviewed, and the limitation documented on the Connections help page.
3. (spec 003) Framer CMS API batch-write size: measure during implementation; engine yields between writes regardless. **Status**: `batchUpdateItems()` available; test limits during Task 4.
4. (spec 003) Gallery images cap (proposed 10) needs a decision. **Status**: Still open. Recommend 10 images max. Decide during Task 4.
5. (spec 004) Price decimal round-trip normalization (Woo returns strings like "21.99"); needs a fixture test. **Status**: Still open. Implement during Task 5.
6. (spec 008) Docs hosting location beyond the repo: release checklist item, not MVP code. **Status**: Deferred to release.

---

## Next Tasks (in order)

### Task 1: Verify `@framer/plugin` v4 API surface ✅ DONE
- Explored `node_modules/@framer/plugin` v4.1.0 type definitions
- Created `docs/API-NOTES.md` with full API surface documentation
- **Key findings**: CMS API fully available, Assets API available, NO plugin-scoped storage, NO AI APIs
- **Impact**: Spec 006 (M7 AI content assist) blocked; reduce to stub or defer
- **Storage strategy**: Use CMS collections for plugin data (connections, snapshots, history)

### Task 2: Implement spec 001 (foundation) ✅ DONE
- ✅ `src/providers/types.ts` (contracts, `NormalizedProduct`, error classes)
- ✅ `src/providers/registry.ts` (registerProvider, getProvider, listProviders, hasProvider, clearProviders)
- ✅ `src/providers/index.ts` (barrel export)
- ✅ Type-level enforcement: `EcommerceProvider<TSupportsTwoWay>` generic encodes two-way sync capability at compile time
- ✅ All acceptance criteria verified:
  1. Registry lookup with ProviderNotFoundError ✓
  2. Product mapping contract defined ✓
  3. TypeScript rejects updateProductFields on read-only providers ✓
  4. listProviders() returns registered providers ✓

### Task 3: Implement spec 002 (connection + UI foundations) ✅ DONE
- ✅ `src/storage/connections.ts` (CMS-backed CRUD, masked reads, active switching, revalidate, delete)
- ✅ `src/providers/woocommerce/client.ts` (validation probe, `AuthError`, `NotWooError`, `CorsError`, retry/backoff, OPTIONS preflight)
- ✅ `src/providers/woocommerce/index.ts` + registry wiring; product methods stubbed until spec 003
- ✅ Reusable UI: `src/components/ui/Switch.tsx`, `HelpTooltip.tsx`, `Modal.tsx`, `Field.tsx`, `src/components/connection/CredentialFields.tsx`
- ✅ `ConnectionModal`, `Dashboard` shell, `App.tsx` modal state, `App.css` design system
- ✅ Tests: `vitest.config.ts`, client + storage + component + string-rules suites (`pnpm install` then `pnpm test`)
- ✅ Docs shipped same run: `docs/help/Getting Started.md`, `docs/help/Connections.md`
- Form handling: no form library added (Orchestrator decision); native form submit with typed handlers, matching the Form Actions pattern within available dependencies.

### Task 4: Implement spec 003 (Woo adapter + sync engine)
- `src/providers/woocommerce/` (client, mapper, provider)
- `src/sync/` (engine, identity, watermark, report), `src/storage/` (snapshots, history)
- MappingModal, SyncReportModal, SyncProgress
- Companion WordPress plugin source (CORS helper) can follow after.

### Task 5: Implement spec 004 (two-way sync)
- `src/sync/conflict.ts`, push phase, WriteBackReviewModal, ConflictResolutionModal, key upgrade flow.

### Task 6: Implement specs 005 + 006 (Help Guide + AI)
- HelpGuide modal + first-run detection (005)
- AI content assist once Task 1 resolves the blocking question (006).

### Task 7: Implement spec 007 (dashboard complete, settings, reliability)
- `toUserSentence` error mapping, settings form, run history.

### Task 8: Write spec 008 docs
- Six `docs/help/` pages, shipped alongside their features (rule: docs ship with code; ideally each task above includes its doc page rather than leaving them all to the end).

### Task 9: Testing and review passes
- Tester agent: acceptance criteria → tests (error matrix, idempotency, write rails)
- Reviewer + Security agents: conventions, UX writing rules, credential handling.

### Task 10: Companion WordPress plugin + packaging
- CORS companion plugin source and its docs page
- `pnpm pack` (framer-plugin-tools), manual test against a real WooCommerce store (production CORS behavior must be verified outside the dev toolbar).

---

## Conventions Cheat Sheet (binding, from INSTRUCTION.md)

- Function declarations only; avoid arrow functions (section 5)
- Reusable components in `src/components/`; boolean toggles always `Switch.tsx`, never Checkbox (section 6)
- Modals over routes; rules are the only future exception (section 6)
- UX writing: Title Case headings, sentence case buttons/labels, no em/en-dashes in UI strings, friendly labels not enums, proper pluralization, sentences capitalized and end with a period (section 7)
- Forms: best hook + Form Actions (section 8)
- Help docs: you/your POV, visible `[Screenshot]` placeholders, Video tutorial section per page, future-tense outcomes, no "we/us/our", no em-dashes, docs ship with code (section 9)
- MVP scope only: M1-M11. F1-F11 are documented, not built (section 2.2)

## Current Work (2026-10-03)

### Just Completed
- ✅ Verified `@framer/plugin` v4.1.0 API surface → `docs/API-NOTES.md`
- ✅ Created 11 future specs (F01-F11) in `.specs/future/`
- ✅ Updated PROGRESS.md with current status and resolved open questions
- ✅ Verified sub-agent setup (9 agents, all present and correct)

### Next Up
- 🔄 **Task 2: Implement spec 001 (provider architecture foundation)**
  - Create `src/providers/types.ts` (contracts, `NormalizedProduct`)
  - Create `src/providers/registry.ts` + `src/providers/index.ts`
  - Test with a mock provider fixture

### In Progress
- None (starting Task 2 now)

---

## File Map

```
INSTRUCTION.md                 # binding project instructions
architecture.md                # layered design, decisions D1-D7
PROGRESS.md                    # this file
README.md                      # project overview
docs/
  RESEARCH.md                  # all research incl. per-platform competitors
  FEATURES.md                  # MVP (M1-M11) vs Future (F1-F11)
  API-NOTES.md                 # Framer plugin API v4.1.0 findings (NEW 2026-10-03)
.specs/
  001..008                     # MVP specs (ready for build)
  future/                      # Future specs (documented, not built)
    F01-additional-platform-providers.md
    F02-managed-proxy-and-background-syncs.md
    F03-storefront-component-library.md
    F04-full-variant-sync.md
    F05-cart-and-checkout-in-framer.md
    F06-ai-expansions.md
    F07-multi-store-support.md
    F08-sync-rules-and-scheduling.md
    F09-web-admin-dashboard.md
    F10-analytics.md
    F11-advanced-write-back.md
.github/agents/*.agent.md      # 9 sub-agent definitions (verified complete)
src/                           # untouched scaffold (App.tsx, main.tsx)
```
