# Ecom-Link Progress

> Last updated: 2026-10-02
> Project: Framer plugin connecting Framer with eCommerce platforms (WooCommerce first)
> Current phase: **Preflight and specs complete. Implementation not started.**

## Project Status at a Glance

| Phase (INSTRUCTION.md) | Status |
|---|---|
| 1. Scaffold | Done (pre-existing Framer CLI scaffold, untouched) |
| 2. Preflight research and feature planning | Done (`docs/RESEARCH.md`, `docs/FEATURES.md`) |
| 3. Spec driven development | Done (8 MVP specs in `.specs/`) |
| 4. Help Guide | Specified (spec 005), not built |
| 5-9. Coding/UI/UX/forms/docs conventions | Binding rules captured in agent files and specs |
| 10. Sub-agents | Done (9 files in `.github/agents/`) |
| Implementation | **Not started** |

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
| `002-store-connection-and-cors.md` | M2+M5 connection, masked credentials, typed errors, CORS/preflight detection | Ready for build |
| `003-product-import-and-sync.md` | M3+M4 paged import, `woo_id` identity, watermark, safety cap, cancellation, reports, Woo adapter | Ready for build |
| `004-two-way-sync-write-back.md` | M11 snapshot change detection, preview gate, conflict resolution, batch writes, no-delete rail | Ready for build |
| `005-help-guide.md` | M6 first-run guide | Ready for build |
| `006-ai-content-assist.md` | M7 editable AI drafts for empty content | **Blocked: see open question** |
| `007-dashboard-settings-reliability.md` | M8+M9 dashboard, modal router, error sentence mapping | Ready for build |
| `008-help-documentation.md` | M10 six `docs/help/` pages with binding doc rules | Ready for build |

---

## Open Questions (resolve before/during build)

1. **BLOCKING (spec 006)**: Confirm the exact AI capability surface in `@framer/plugin` v4 (API availability, quotas, model transparency requirements). If absent, AI assist reduces to a stub and the Orchestrator agent must decide before build. Check the installed package in `node_modules/@framer/plugin` type definitions.
2. (spec 002) Plugin-data encryption for secrets: depends on what `@framer/plugin` v4 exposes; otherwise store in plugin data with masked reads and flag for Security review.
3. (spec 003) Framer CMS API batch-write size: measure during implementation; engine yields between writes regardless.
4. (spec 003) Gallery images cap (proposed 10) needs a decision.
5. (spec 004) Price decimal round-trip normalization (Woo returns strings like "21.99"); needs a fixture test.
6. (spec 008) Docs hosting location beyond the repo: release checklist item, not MVP code.

---

## Next Tasks (in order)

### Task 1: Verify `@framer/plugin` v4 API surface
Explore `node_modules/@framer/plugin` (type definitions, README) to confirm: CMS API methods (collections, fields, items), Assets API, plugin data storage, AI capabilities (unblocks spec 006), form utilities. Record findings in `architecture.md` or a short `docs/API-NOTES.md`.

### Task 2: Implement spec 001 (foundation)
- `src/providers/types.ts` (contracts, `NormalizedProduct`)
- `src/providers/registry.ts` + `src/providers/index.ts`
- Test with a mock provider fixture.

### Task 3: Implement spec 002 (connection + UI foundations)
- `src/storage/connections.ts`, Woo client validation with typed errors
- Reusable UI: `src/components/ui/Switch.tsx`, `HelpTooltip.tsx`, `Modal.tsx`, `Field.tsx`
- `ConnectionModal`, `Dashboard` shell
- Set up the form hook approach (INSTRUCTION.md section 8: best hook + Form Actions).

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

## File Map

```
INSTRUCTION.md                 # binding project instructions
architecture.md                # layered design, decisions D1-D7
docs/RESEARCH.md               # all research incl. per-platform competitors
docs/FEATURES.md               # MVP (M1-M11) vs Future (F1-F11)
.specs/001..008                # MVP specs
.github/agents/*.agent.md      # 9 sub-agent definitions
src/                           # untouched scaffold (App.tsx, main.tsx)
```
