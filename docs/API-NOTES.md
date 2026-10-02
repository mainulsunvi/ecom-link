# Framer Plugin API v4.1.0 - Key Findings

> Verified: 2026-10-03

## CMS API (Collections)

**Available**: Full CMS CRUD operations

### Collections
- `framer.getCollections()` - list all collections
- `framer.getCollection(id)` - get single collection
- `framer.createCollection(data)` - create collection
- `framer.updateCollection(id, data)` - update collection metadata

### Collection Items
- `framer.getItems(collectionId, options?)` - list items (paginated)
- `framer.getItem(collectionId, itemId)` - get single item
- `framer.createItem(collectionId, itemData)` - create item
- `framer.updateItem(collectionId, itemId, itemData)` - update item
- `framer.deleteItem(collectionId, itemId)` - delete item
- `framer.batchUpdateItems(collectionId, items)` - batch update

### Collection Fields
- `framer.getFields(collectionId)` - list fields
- `framer.getField(collectionId, fieldId)` - get single field
- `framer.createField(collectionId, fieldData)` - create field
- `framer.updateField(collectionId, fieldId, fieldData)` - update field
- `framer.deleteField(collectionId, fieldId)` - delete field

### Field Types Supported
- `string` - text
- `number` - numeric
- `boolean` - true/false
- `date` - date/time
- `formattedText` - HTML/rich text
- `image` - image asset
- `file` - file asset
- `link` - URL
- `color` - color value
- `enum` - dropdown/select
- `collectionReference` - reference to other collection item
- `multiCollectionReference` - multiple references
- `array` - array of items

## Assets API

**Available**: Image and file asset management

- `framer.addImage(url, options?)` - add image from URL
- `framer.addFile(url, options?)` - add file from URL
- `framer.getAsset(id)` - get asset metadata
- `framer.deleteAsset(id)` - delete asset

**Image options**: `altText`, `preferredImageRendering`, `resolution`

## Plugin Data Storage

**NOT AVAILABLE** in public API. No `getPluginData` / `setPluginData` methods found.

**Workaround**: Store data in a dedicated CMS collection (e.g., "Ecom-Link Config") with items for:
- Connection credentials (encrypted at app level)
- Sync snapshots
- Sync history
- Settings

**Security note**: Plugin data stored in CMS is visible to users with CMS access. For MVP (free app), this is acceptable. Future: consider Framer's managed collection API if it adds plugin-scoped storage.

## AI Capabilities

**NOT AVAILABLE** in public API v4.1.0. No AI/generation methods found.

**Impact on spec 006**: AI content assist (M7) must be reduced to a stub or removed from MVP. The feature can be re-enabled when Framer adds AI APIs or via external API integration (out of scope for free MVP).

## Other APIs

### Selection & Canvas
- `framer.subscribeToSelection(callback)` - track selection changes
- `framer.getSelectedNodes()` - get current selection
- `framer.showUI(options)` - show plugin UI panel

### Permissions
- `framer.useIsAllowedTo(action)` - check if action is allowed
- Permission system for canvas operations

### Notifications
- `framer.notify(message, options?)` - show toast notifications

### UI
- `framer.showUI({ position, width, height })` - show plugin panel
- Positions: `"top right"`, `"top left"`, `"bottom right"`, `"bottom left"`

## Key Differences from Shopify

1. **No plugin-scoped storage** - must use CMS collections for persistence
2. **No AI APIs** - spec 006 blocked
3. **No webhooks** - manual sync triggers only (already in architecture)
4. **No metafields** - use CMS fields instead
5. **Asset pipeline** - images must be downloaded and added via `addImage()` (D7 in architecture)

## Recommendations

1. **Storage strategy**: Create a hidden CMS collection "Ecom-Link Internal" for plugin data
2. **AI feature**: Mark as blocked in PROGRESS.md; reduce to stub or defer to post-MVP
3. **Image handling**: Use `framer.addImage()` for all product images (D7)
4. **Batch operations**: Use `batchUpdateItems()` for efficient sync
5. **Pagination**: All list operations support pagination; implement in sync engine

## Open Questions (Resolved)

1. ~~AI capability surface~~: **NOT AVAILABLE** in v4.1.0. Spec 006 blocked.
2. ~~Plugin data encryption~~: Store in CMS collection; document security limitations
3. ~~CMS batch-write size~~: `batchUpdateItems()` available; test limits during implementation
4. ~~Gallery images cap~~: Decision needed (recommend 10 images max)

---

## CMS API Usage Patterns

### Reading Collections and Items

**List all collections**:
```typescript
const collections = await framer.getCollections()
// Returns: Collection[]
```

**Get collection by ID**:
```typescript
const collection = await framer.getCollection("collection-id")
// Returns: Collection | null
```

**List items in a collection**:
```typescript
const items = await framer.getItems("collection-id", {
  limit: 100,  // Max items per page
  offset: 0    // Pagination offset
})
// Returns: CollectionItem[]
```

**Get single item**:
```typescript
const item = await framer.getItem("collection-id", "item-id")
// Returns: CollectionItem | null
```

### Creating and Updating Items

**Create new item**:
```typescript
await framer.createItem("collection-id", {
  fieldData: {
    name: { type: "string", value: "Product Name" },
    price: { type: "number", value: 29.99 },
    featured: { type: "boolean", value: true },
    description: { type: "formattedText", value: "<p>HTML content</p>" },
    image: { type: "image", value: "asset-id" },
    status: { type: "enum", value: "publish" }
  }
})
```

**Update existing item**:
```typescript
await framer.updateItem("collection-id", "item-id", {
  fieldData: {
    price: { type: "number", value: 39.99 },
    stock_quantity: { type: "number", value: 50 }
  }
})
```

**Note**: The `updateItem` method signature in the types shows it takes `collectionId`, `itemId`, and `itemData`. The `itemData` structure follows the same pattern as `createItem` with a `fieldData` object containing typed field entries.

### Batch Operations

**`batchUpdateItems`** - Update multiple items in one call:
```typescript
framer.batchUpdateItems(collectionId, [
  { id: "item-1", fieldData: { name: { type: "string", value: "Updated" } } },
  { id: "item-2", fieldData: { price: { type: "number", value: 29.99 } } }
])
```

**Note**: Batch operations are more efficient than individual updates. Use for sync operations.

### Deletion

**`deleteItem`** - Remove an item:
```typescript
await framer.deleteItem(collectionId, itemId)
```

## Field Type Mapping

For WooCommerce → Framer CMS mapping:

| WooCommerce Field | Framer Field Type | Notes |
|-------------------|-------------------|-------|
| name | string | Product name |
| slug | string | URL slug |
| status | enum | draft/pending/private/publish |
| featured | boolean | Is featured product |
| description | formattedText | Full HTML description |
| short_description | formattedText | Excerpt |
| sku | string | Stock keeping unit |
| price | number | Current price |
| regular_price | number | Regular price |
| sale_price | number | Sale price |
| on_sale | boolean | Is on sale |
| stock_status | enum | instock/outofstock/onbackorder |
| manage_stock | boolean | Stock management enabled |
| stock_quantity | number | Stock count |
| weight | number | Product weight |
| categories | array | Category references |
| tags | array | Tag strings |
| images | image | Product images (featured + gallery) |
| date_modified | date | Last modified timestamp |

## Identity Strategy

**Decision (D2)**: Store WooCommerce product ID in a CMS field called `woo_id` (string type).

**Rationale**:
- Items update in place; canvas bindings never break
- Enables two-way sync with conflict detection
- Simple lookup: query items where `woo_id` matches

**Implementation**:
```typescript
// Create item with woo_id
await framer.createItem(collectionId, {
  fieldData: {
    woo_id: { type: "string", value: "123" },
    name: { type: "string", value: "Product Name" },
    // ... other fields
  }
})

// Find existing item by woo_id
const items = await framer.getItems(collectionId)
const existing = items.find(item => 
  item.fieldData.woo_id?.value === "123"
)
```

## Image Handling

**Decision (D7)**: Download images through asset pipeline into Framer assets.

**Rationale**:
- External URLs break on publish
- Framer assets are optimized and CDN-hosted
- Required for reliable product display

**Implementation**:
```typescript
// Download and add image
const imageAsset = await framer.addImage(
  "https://example.com/product.jpg",
  { altText: "Product Name" }
)

// Use in item field
await framer.createItem(collectionId, {
  fieldData: {
    image: { type: "image", value: imageAsset.id }
  }
})
```

**Gallery images**: Store as array of image IDs (max 10 recommended).

## Error Handling

Common errors and handling:

| Error | Cause | Handling |
|-------|-------|----------|
| Collection not found | Invalid collection ID | Show connection setup UI |
| Permission denied | Plugin lacks CMS access | Request permissions |
| Rate limit | Too many API calls | Implement retry with backoff |
| Invalid field type | Schema mismatch | Validate field types before write |
| Item not found | Deleted externally | Create new item or show error |

## Next Steps

1. Implement provider types (spec 001)
2. Build WooCommerce adapter using these APIs
3. Create sync engine with pagination and batching
4. Implement two-way sync with snapshot comparison
5. Build UI for connection setup and field mapping
