# Spec 003: Product Import and Incremental Sync

Status: MVP. Features: `docs/FEATURES.md` M3, M4, plus the WooCommerce provider adapter from M1.

## 1. Problem statement

The merchant needs their WooCommerce catalog in a Framer CMS collection: a first full import with field mapping, then repeatable incremental syncs that update only what changed, keep item identity stable so canvas bindings never break, and report every result clearly.

## 2. Data model decision

Three places, separate paths:

- **CMS fields** (write path engine → Framer CMS API, read path canvas bindings): `woo_id` (identity, never edited), plus mapped fields (title, slug, permalink, description, short description, SKU, prices, on sale Switch, stock status/quantity, categories, tags, featured image, gallery, attributes JSON, variants JSON, rating, rating count, last modified).
- **Plugin data** (read/write via storage):
  - `SyncSettings`: target collection id, mapping (`wooField -> cmsFieldId`, direction), default item status (draft/publish), statuses filter (default `publish`), safety cap, two-way enabled fields.
  - `Watermark`: ISO timestamp of the last successful pull (`date_modified` GMT basis).
  - `Snapshots`: per item id, last-synced values of two-way fields (used by spec 004; written here during pull).
- **Component state**: progress, cancellation flag, transient report.

Identity: match existing CMS items by `woo_id` field value. Matched items update in place; unmatched Woo products create items. Woo products absent from the fetched set are never auto-deleted; an explicit cleanup action lists them for confirmation.

## 3. Platform API operations

- `GET /wp-json/wc/v3/products?per_page=100&page=N&status={statuses}&dates_are_gmt=true&modified_after={watermark}`: paged fetch, `N` requests where `N = X-WP-TotalPages`.
- Incremental pass adds `modified_after`; first run omits it (full pass).
- `GET /wp-json/wc/v3/products/{id}/variations?per_page=100&page=N`: per variable product; cost is the N+1 loop, capped per product by the variations cap setting (default 30, configurable).
- Asset pipeline: featured image + gallery downloaded into Framer assets (1 request per image, sequential with yield).

## 4. Credentials required

`read` scope. Two-way fields exist in the mapping schema here but only write with spec 004 and `read_write` keys. No `framer.json` change.

## 5. Triggers consumed

User actions: "Start sync" (first import), "Sync now" (incremental), "Cancel", explicit "Remove deleted products" cleanup.

## 6. File-by-file change list

- `src/providers/woocommerce/client.ts`: paged `listProducts`, `listVariations`, retry/backoff, header parsing, extend.
- `src/providers/woocommerce/mapper.ts`: Woo JSON → `NormalizedProduct`, new.
- `src/providers/woocommerce/index.ts`: provider implementation, new.
- `src/sync/identity.ts`: match by `woo_id`, create vs update decision, new.
- `src/sync/watermark.ts`: get/set watermark, invalid-watermark fallback to full pass, new.
- `src/sync/engine.ts`: `runPull(settings, onPage, signal)` orchestration with cancellation and progress callbacks, new.
- `src/sync/report.ts`: run report model (created/updated/skipped/failed), last 5 runs in plugin data, new.
- `src/storage/snapshots.ts`: snapshot writes during pull, new.
- `src/storage/history.ts`: run history persistence, new.
- `src/views/MappingModal.tsx`: type-aware mapping suggestions, per-field direction Switch, pre-sync validation, new.
- `src/views/SyncReportModal.tsx`: counts, expandable failures, cleanup entry, new.
- `src/components/sync/SyncProgress.tsx`: progress with cancel, new.
- `docs/help/` pages: Sync Products, Connect Your WooCommerce Store updates (same run).

## 7. Acceptance criteria

1. Given a mock store of 250 products and `per_page=100`, the engine issues 3 paged requests and creates 250 CMS items with unique `woo_id` values.
2. Given a mapping where price maps to a number CMS field and description to rich text, validation passes; given a price-to-boolean mapping, sync is blocked before any request with "Prices must map to a number or text field."
3. Given a second run where 3 products changed since the watermark, exactly 3 items are updated, 0 created, and the report shows "3 items updated."
4. Given a re-run with no changes, the report shows "0 items updated" and no duplicate items exist (idempotency test).
5. Given cancellation mid-run at page 2 of 4, written items persist, the report marks the run "Canceled", and the watermark is NOT advanced.
6. Given a product whose image download fails, the item still syncs, the image field stays empty, and the failure appears once in the report.
7. Given a missing/invalid watermark, the engine falls back to a full pass and logs the fallback in the report.
8. Given 429 then success on retry, the client succeeds within 3 attempts; given 429 three times, the run pauses with the failure listed and a retry button resumes from the failed page.
9. Given a catalog larger than the safety cap, the run stops at the cap with "Sync stopped at the safety limit. Increase it in Settings to continue."
10. Given a mapped field manually edited in Framer CMS with direction one-way, the next sync overwrites it (documented behavior test).
11. Every report and progress string passes the UX writing rules test (pluralization, no enums, no em-dashes).

## 8. Open questions

- Framer CMS API rate/volume behavior for bulk item creation: batch size per write call needs measurement during implementation; engine yields between writes regardless.
- Should gallery images beyond a cap be skipped with a warning? Proposed default cap 10, flagged for decision.

## Always answer these four

- **Removed then re-added plugin**: plugin data (mapping, watermark) is lost; CMS items remain. Reconnect, re-map (the wizard re-detects the existing collection by `woo_id` field), and a full pass updates in place without duplicates.
- **Framer plan limit mid-sync**: the engine catches the CMS limit error, stops cleanly, keeps partial progress, and reports "The Framer plan limit for CMS items was reached. N items remain unsynced." The watermark is not advanced, so the next run resumes.
- **Partial sync failure and retry**: failures are per page and per item; the run pauses with an itemized list; retry resumes from the failed page. The watermark advances only on a fully successful pull.
- **Unusually large catalog**: paging (100/page), variations cap, safety cap, cancellable UI, and yields between writes keep the plugin responsive; a 5,000-product store completes across multiple resumed runs if needed.
