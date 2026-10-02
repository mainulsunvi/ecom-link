# Spec F04: Full Variant Sync

Status: Future. Feature: `docs/FEATURES.md` F4.

## 1. Problem statement

The MVP syncs variable products as a single item with a `variants` JSON field containing all variation data. This prevents per-variant stock and price management in Framer CMS. Full variant sync creates separate CMS items for each variation (or a structured variant model), enabling granular control and write-back.

## 2. Data model decision

Two approaches:

**Option A: Per-variant items**
Each variation becomes a separate CMS item with a `parent_id` field linking to the parent product. Fields: `woo_id` (variation ID), `parent_id` (parent product ID), `name` (e.g., "T-Shirt - Red, Large"), `sku`, `price`, `stock_quantity`, `attributes` (JSON: {"Color": "Red", "Size": "Large"}).

**Option B: Structured variant model**
Parent product item contains an `array` field with variant objects. Each object: `{id, sku, price, stock_quantity, attributes}`. Framer's array field type supports this.

Decision: **Option A** (per-variant items) for simplicity and CMS compatibility. Option B requires complex array field editing UI.

Read path: Parent product + child variants (filtered by `parent_id`). Write path: Update variant item fields; sync engine writes to Woo variation endpoint.

## 3. Platform API operations

**WooCommerce Variations API**:
- `GET /products/{id}/variations` (paginated, list all variations)
- `GET /products/{id}/variations/{variation_id}` (single variation)
- `PUT /products/{id}/variations/{variation_id}` (update variation)
- `POST /products/{id}/variations/batch` (bulk update)

Cost: N+1 queries for variable products (1 parent + N variations). Batch endpoint reduces writes.

## 4. Credentials required

Same as MVP (WooCommerce REST API keys). No changes.

## 5. Triggers consumed

None. Manual sync triggers only.

## 6. File-by-file change list

- `src/providers/woocommerce/client.ts`: Add `listVariations`, `getVariation`, `updateVariation` methods, update
- `src/providers/woocommerce/mapper.ts`: Add `mapVariation` method, update
- `src/providers/types.ts`: Add `NormalizedVariation` interface, update
- `src/sync/engine.ts`: Add variant sync logic (parent → children), update
- `src/sync/identity.ts`: Add variant identity matching (by `woo_id` + `parent_id`), update
- `src/views/MappingModal.tsx`: Add "Sync variants as separate items" toggle, update
- `src/views/VariantSyncSettings.tsx`: New modal for variant sync options, new
- `docs/help/Sync Variants.md`: New page explaining variant sync, new

## 7. Acceptance criteria

1. Given a variable product with 3 variations, the sync creates 1 parent item + 3 child items in CMS (4 total).
2. Given a parent item, its child items are queryable via `parent_id` field filter.
3. Given a variation's stock quantity changes in Woo, the incremental sync updates the corresponding CMS item's `stock_quantity` field.
4. Given a user edits a variant's price in Framer CMS, the two-way sync preview shows the change and writes it to the Woo variation endpoint.
5. Given a variable product with 50 variations, the sync uses pagination (100 per page) and completes without timeout.
6. Given a variant is deleted in Woo, the sync marks the CMS item as orphaned (cleanup action removes it).
7. Given a user disables variant sync, variable products sync as a single item with `variants` JSON field (MVP behavior).

## 8. Open questions

1. **CMS collection structure**: Should variants live in the same collection as products (with `parent_id`), or a separate "Variants" collection?
2. **Variant limits**: WooCommerce allows 100 variations per product, 50 attributes. Should we enforce a lower cap (e.g., 50 variations)?
3. **Attribute mapping**: Should variant attributes (Color, Size) become Framer CMS enum fields, or stay as JSON?
4. **Image per variant**: WooCommerce allows per-variation images. Should we sync these as separate image fields?
5. **Performance**: N+1 queries for variable products. Should we batch variation fetches, or accept the latency?

## Always answer these four

- **Removed then re-added plugin**: Variant items cleared; user reconnects and re-syncs.
- **Framer plan limit mid-sync**: Safety cap applies to total items (parents + variants).
- **Partial sync failure and retry**: Variant sync is idempotent; retry updates only failed variations.
- **Unusually large catalog**: Variable products with 100 variations each → 101 items per product. Pagination + batching required.
