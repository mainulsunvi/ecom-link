# Spec 007: Dashboard, Settings, and Sync Reliability

Status: MVP. Features: `docs/FEATURES.md` M8, M9.

## 1. Problem statement

The merchant needs one clear home in the plugin: connection status, sync controls, reports, AI entry, and settings. Underneath it, every failure mode from the research error matrix must surface as a full, actionable sentence with the right recovery path, and long syncs must stay cancellable with partial progress kept.

## 2. Data model decision

- `App.tsx` owns modal router state (which modal is open). Views receive props, call engine/storage hooks. No routes in the MVP (modals only per INSTRUCTION.md section 6).
- `SyncSettings` in plugin data (extends spec 003): default item status, statuses filter, safety cap, two-way toggle summary. Read path: settings modal loads once. Write path: Form Actions submit saves.
- Error model: typed error classes from the provider client (`AuthError`, `NotWooError`, `CorsError`, `RateLimitError`, `TransientError`) map through one `toUserSentence(error)` function so every surface (dashboard, modals, reports) shows identical wording.

## 3. Platform API operations

Indirect only, through the engine (specs 003/004). This spec adds no requests.

## 4. Credentials required

None new.

## 5. Triggers consumed

User actions: Sync now, View report, Cancel, Settings save.

## 6. File-by-file change list

- `src/views/Dashboard.tsx`: connection card, sync controls, last sync time, item counts, AI entry, help icon, complete.
- `src/views/SettingsModal.tsx`: default item status (draft/publish), statuses filter, safety cap, AI Switch, form via best hook + Form Actions, new.
- `src/sync/report.ts`: `toUserSentence(error)` mapping and report persistence (last 5 runs), extend.
- `src/components/sync/SyncProgress.tsx`: progress with cancel button wired to engine signal, extend.
- `src/views/SyncReportModal.tsx`: created/updated/skipped/failed counts, expandable failures, run history list, extend.
- `src/App.tsx`: modal router state, first-run guide hook (spec 005), complete.

## 7. Acceptance criteria

1. Given a valid connection, the dashboard shows store URL, validation state, last sync time, and item counts; given none, it shows the connect CTA only.
2. Given each typed error, `toUserSentence` returns the exact sentence from the research matrix (table-driven test with all 8 rows: 401/403, non-Woo URL, CORS, 429 recovered, 429 exhausted, partial page failure, image failure, field mismatch).
3. Given 429 then success, the client retries with exponential backoff, max 3 attempts, before surfacing anything.
4. Given a sync in progress, Cancel stops the run at the next yield point; the report marks it "Canceled" and partial progress persists (shared acceptance with spec 003, verified at the dashboard level).
5. Settings saves through Form Actions; invalid safety cap input (0 or non-number) is blocked with "Enter a number greater than zero."
6. Boolean settings use the Switch component exclusively (component tree test).
7. The dashboard renders with no modal routes; all flows open modals (structure test on App).
8. All strings pass the UX writing rules test.

## 8. Open questions

- Run history length: proposed 5 runs. Increase only if storage limits allow; needs a quick check of plugin data size behavior.

## Always answer these four

- **Removed then re-added plugin**: settings and run history are lost; engine state rebuilds from CMS + a fresh pull. Acceptable.
- **Framer plan limit mid-sync**: surfaced as the standard limit sentence from spec 003 with a link to the Framer plan page in docs.
- **Partial sync failure and retry**: the itemized report with per-item retry is the dashboard-level recovery path for every failure type.
- **Unusually large catalog**: progress reporting per page, safety cap notice, and cancellable runs are all surfaced here.
