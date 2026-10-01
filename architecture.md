# Ecom-Link Architecture

> Living document. The Architect agent updates it when a decision changes it. Specs in `.specs/` must stay consistent with this file.

## 1. What this is
A Framer plugin (React + TypeScript + Vite, `@framer/plugin` v4) that syncs product data between eCommerce platforms (WooCommerce first) and Framer CMS. Free app, MVP scope = `docs/FEATURES.md` M1–M11 only.

## 2. Layered, provider-based design

```
┌──────────────────────────────────────────────────┐
│ Views (src/views/*) + reusable UI (src/components/*)│  React, modals, Framer best practices
├──────────────────────────────────────────────────┤
│ Sync engine (src/sync/*)                          │  pull, push, identity, watermark,
│                                                   │  conflicts, reports, cancellation
├──────────────────────────────────────────────────┤
│ Provider layer (src/providers/*)                  │  EcommerceProvider contract;
│                                                   │  woocommerce is the only v1 impl
├──────────────────────────────────────────────────┤
│ Storage (src/storage/*)                           │  connections, snapshots, sync
│                                                   │  history in plugin data (per project)
├──────────────────────────────────────────────────┤
│ Framer Plugin API (@framer/plugin)                │  CMS, Assets, plugin data
└──────────────────────────────────────────────────┘
```

Dependency rule: views → sync → providers → platform APIs. Views never call platform APIs directly. The sync engine never imports a provider by name; it consumes the `EcommerceProvider` contract from `src/providers/types.ts`.

## 3. Folder structure

```
src/
  App.tsx                 # shell: dashboard + modal router state
  main.tsx
  components/
    ui/                   # Switch, HelpTooltip, Field, Button, Modal, etc.
    connection/           # ConnectionCard, CredentialFields
    mapping/              # FieldMappingRow, DirectionSwitch
    sync/                 # SyncProgress, SyncReportView, WriteBackDiff
  providers/
    types.ts              # EcommerceProvider, NormalizedProduct, capability flags
    registry.ts           # register/get providers by id
    woocommerce/
      client.ts           # REST client: pagination, retry, backoff, CORS errors
      mapper.ts           # Woo product JSON -> NormalizedProduct
      index.ts            # provider implementation
  sync/
    engine.ts             # runPull, runPush, orchestration, cancel
    identity.ts           # woo_id matching, create-vs-update
    watermark.ts          # last-sync watermark handling
    conflict.ts           # both-sides-changed detection + resolution results
    report.ts             # per-run report model, last N runs
  storage/
    connections.ts        # credentials (masked on read), connection settings
    snapshots.ts          # per-item two-way field snapshots
    history.ts            # sync run history
  ai/
    contentAssist.ts      # missing-content detection, draft generation, apply
  views/
    Dashboard.tsx
    HelpGuide.tsx
    ConnectionModal.tsx
    MappingModal.tsx
    SyncReportModal.tsx
    WriteBackReviewModal.tsx
    ConflictResolutionModal.tsx
    SettingsModal.tsx
```

## 4. Key decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | No backend in MVP. Direct plugin → WooCommerce REST calls. | Free app, simple, honest. CORS handled via companion WP plugin guidance (spec 002). |
| D2 | Identity = platform product id stored in a CMS field (`woo_id`). | Items update in place; canvas bindings never break. |
| D3 | Two-way sync is field-scoped, opt-in per field, preview-before-write. | Safety rails from `docs/RESEARCH.md` 8.1. |
| D4 | Change detection: Woo side = `date_modified` watermark; Framer side = value snapshots per two-way field. | Verified feasible in research section 8.1. |
| D5 | Plugin data (connections, snapshots, history) is per-project, never leaves Framer. | Security; least privilege. |
| D6 | Provider contract has capability flags (`supportsTwoWaySync`, writable fields list). | Shopify/Wix/Webflow slot in without engine changes. |
| D7 | Images downloaded through the asset pipeline into Framer assets. | External URLs break on publish (research 10.2). |

## 5. Conventions (binding)
- Function declarations only (`function name() {}`); arrow functions only where `this` or inline callbacks demand it (INSTRUCTION.md §5).
- Reusable UI in `src/components/`; boolean toggles always `components/ui/Switch.tsx` (§6).
- Modals over routes in the MVP (§6); rules-on-routes applies only to future sync rules (F8).
- UX writing rules §7 and help doc rules §9 apply to every user-facing string and page.
- Specs: one numbered file per feature in `.specs/`, MVP first (§3).
