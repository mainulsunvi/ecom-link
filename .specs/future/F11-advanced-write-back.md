# Spec F11: Advanced Write-Back

Status: Future. Feature: `docs/FEATURES.md` F11.

## 1. Problem statement

The MVP's two-way sync (M11) covers basic fields (price, stock, SKU, name, description). Advanced write-back extends this to images (upload from Framer assets to platform media library), scheduled automatic syncs (no button press), and two-way sync for additional platforms (Shopify Admin API, Wix Catalog API, Webflow CMS API).

## 2. Data model decision

Advanced write-back reuses the existing two-way sync infrastructure (snapshots, conflict detection, preview) but extends the provider contract and adds new capabilities.

**Image write-back**:
- Framer asset ID → platform media upload → platform image ID
- Store mapping in snapshots: `{framerAssetId, platformImageId, url}`
- Upload via platform-specific media endpoints (Woo: `/wp-json/wp/v2/media`, Shopify: `filesCreateMutation`)

**Scheduled automatic syncs**:
- Requires backend (F2) or browser-based timer (limited)
- Schedule config: `{interval: "15m" | "1h" | "1d", lastRun, nextRun, enabled}`
- Timer triggers sync engine automatically

**Platform-specific two-way**:
- **Shopify Admin API**: Inventory levels, product fields (requires OAuth + `write_products` scope)
- **Wix Catalog API**: Product updates via `updateProduct` mutation
- **Webflow CMS API**: CMS item updates via `PATCH /collections/{id}/items/{id}`

Read path: Same as M11 (snapshots + platform data). Write path: Extended provider methods for images and platform-specific writes.

## 3. Platform API operations

**WooCommerce Media API** (for image upload):
- `POST /wp-json/wp/v2/media` (upload image with multipart/form-data)
- Requires `upload_files` capability (administrator role)

**Shopify Admin API** (for two-way):
- `inventoryBulkAdjustQuantityAtLocation` mutation (update stock)
- `productUpdate` mutation (update product fields)
- Requires OAuth + `write_products`, `write_inventory` scopes

**Wix Catalog API**:
- `mutation updateProduct($input: UpdateProductInput!)` (update product)
- Requires OAuth + Catalog API write scope

**Webflow CMS API**:
- `PATCH /collections/{id}/items/{id}` (update CMS item)
- Requires OAuth + CMS write scope

## 4. Credentials required

**Image write-back**: Same as MVP (WooCommerce REST API keys) plus `upload_files` capability.

**Shopify two-way**: OAuth access token with `write_products`, `write_inventory` scopes.

**Wix two-way**: OAuth access token with Catalog API write scope.

**Webflow two-way**: OAuth access token with CMS write scope.

## 5. Triggers consumed

None. All write-back is user-initiated or scheduled (F2).

## 6. File-by-file change list

- `src/providers/types.ts`: Add `uploadImage` method to provider contract, update
- `src/providers/woocommerce/client.ts`: Add media upload endpoint, update
- `src/providers/woocommerce/mapper.ts`: Add image ID mapping logic, update
- `src/providers/shopify/adminClient.ts`: Shopify Admin API client, new
- `src/providers/shopify/adminMapper.ts`: Shopify Admin API mapper, new
- `src/providers/wix/catalogClient.ts`: Wix Catalog API client, new
- `src/providers/wix/catalogMapper.ts`: Wix Catalog API mapper, new
- `src/providers/webflow/cmsClient.ts`: Webflow CMS API client, new
- `src/providers/webflow/cmsMapper.ts`: Webflow CMS API mapper, new
- `src/sync/imageSync.ts`: Image upload logic (Framer asset → platform), new
- `src/scheduler/autoSync.ts`: Automatic sync trigger logic, new
- `src/views/ImageSyncSettings.tsx`: Image sync configuration, new
- `src/views/AutoSyncSettings.tsx`: Automatic sync schedule UI, new
- `docs/help/Image Sync.md`: Guide for syncing images to platform, new
- `docs/help/Automatic Sync.md`: Guide for scheduled syncs, new

## 7. Acceptance criteria

1. Given a user edits a product's featured image in Framer, the two-way sync preview shows the image change and uploads the new image to WooCommerce.
2. Given a Framer asset is uploaded to WooCommerce, the platform returns an image ID that is stored in the snapshot.
3. Given a schedule of "every hour", the sync engine triggers automatically without user interaction.
4. Given a Shopify store with Admin API credentials, the two-way sync updates inventory levels in Shopify.
5. Given a Wix store with Catalog API credentials, the two-way sync updates product fields in Wix.
6. Given a Webflow site with CMS credentials, the two-way sync updates CMS items in Webflow.
7. Given an image upload failure, the sync report shows the error and skips the image (product still syncs).
8. Given a user disables automatic sync, the scheduler stops triggering syncs.

## 8. Open questions

1. **Image upload limits**: WooCommerce allows 10MB max upload. Should we compress/resize images before upload?
2. **Image format**: Should we convert images to WebP for platforms that support it?
3. **Automatic sync conflicts**: What happens if a user is editing in Framer while an automatic sync runs? Lock the UI, or queue the sync?
4. **Shopify OAuth flow**: Shopify requires a redirect-based OAuth flow. How do we handle this in a Framer plugin (no backend)?
5. **Wix/Webflow rate limits**: Both platforms have strict rate limits. Should we implement aggressive backoff?
6. **Image deletion**: If a user removes an image in Framer, should we delete it from the platform, or just unlink it?
7. **Backup before write**: Should we create a backup of platform data before writing (rollback on failure)?

## Always answer these four

- **Removed then re-added plugin**: Image mappings cleared; user re-syncs images.
- **Framer plan limit mid-sync**: Automatic syncs respect safety cap.
- **Partial sync failure and retry**: Image uploads are retried independently of product sync.
- **Unusually large catalog**: Image uploads are batched; automatic syncs paginate.
