# Ecom-Link Research and Discovery

> Status: complete. This document records the research required by `INSTRUCTION.md` section 2.1 and is the foundation for `docs/FEATURES.md`.

---

## 1. Product Goals and Core Use Cases

**Goal**: Let a store owner connect an eCommerce platform (starting with WooCommerce) to Framer and turn their catalog into a live Framer CMS, so they can design and publish a storefront in Framer while the eCommerce platform remains the system of record for products, orders, and checkout.

**Core use cases**:

| # | Use case | Actor |
|---|----------|-------|
| UC-1 | Connect a WooCommerce store with REST API credentials in under 5 minutes | Store owner |
| UC-2 | Import products (title, price, images, stock, categories, variants) into a Framer CMS collection | Store owner |
| UC-3 | Re-sync after editing products in WooCommerce, updating only what changed, without breaking canvas bindings | Store owner |
| UC-4 | Create or reuse a target CMS collection and map WooCommerce fields to CMS fields | Store owner |
| UC-5 | Receive help the first time the plugin opens (Help Guide) | Store owner (first run) |
| UC-6 | Diagnose failed syncs with actionable error messages | Store owner |
| UC-7 | Use AI to generate missing marketing copy (short description, SEO title, SEO description) for synced products | Store owner |
| UC-8 | Agency/designer sets up the store connection for a client and hands it over | Designer/Agency |
| UC-9 | Edit stock levels (and other two-way fields) in Framer CMS and push the changes back to WooCommerce | Store owner |
| UC-10 | Review and resolve conflicts when the same product changed in both WooCommerce and Framer since the last sync | Store owner |

**Non-goals for MVP**: checkout, cart, orders, payments inside Framer. Checkout stays on WooCommerce. Ecom-Link is a catalog sync tool first, with two-way sync limited to inventory, pricing, and basic content fields. This matches the "free, reliable, simple" positioning in `INSTRUCTION.md` 2.3.

---

## 2. Target Users and Personas

### P1. The WooCommerce store owner moving to Framer
- Runs a Woo store on WordPress hosting. Not technical. Wants a modern Framer storefront without paying an agency to rebuild the catalog by hand.
- Pain: manually re-entering 50-500 products into Framer CMS; product data going stale after edits in Woo.
- Success: connects in minutes, catalog appears in Framer CMS, re-sync keeps it fresh.

### P2. The Framer freelancer/agency
- Builds client sites in Framer. Client runs WooCommerce.
- Pain: CSV export/import is lossy (images, variants, HTML descriptions break); no repeatable sync; billing clients for manual data entry.
- Success: read-only connection, repeatable syncs, clean field mapping, handoff that the client can re-run themselves.

### P3. The Framer designer with a client on Shopify/Wix/Webflow (future)
- Same job-to-be-done as P2 but on a different platform. Validated by demand for existing Shopify plugins.
- Success: same plugin, different provider. Provider-based architecture must make adding a platform cheap (see section 13).

### Anti-persona for MVP
- Store owners who need full headless checkout (cart, orders, payments) inside Framer. FeCommerce and Framer Commerce already serve this. Ecom-Link MVP is catalog sync, not headless commerce.

---

## 3. Customer Problems and Pain Points

1. **No native integration.** Framer has no built-in WooCommerce support and no native ecommerce (confirmed by FeCommerce's own marketplace copy).
2. **Manual CSV workflows are lossy.** Images end up as URLs instead of assets, variants and galleries do not map, HTML descriptions come across broken.
3. **Stale data.** After a price change or stock update in Woo, the Framer site drifts out of date until someone re-imports by hand.
4. **Binding breakage.** Naive syncs that delete/recreate CMS items break canvas bindings. Item identity must be stable (match by Woo product ID, not name).
5. **CORS blocks direct browser calls.** WooCommerce REST API does not send CORS headers, so a Framer plugin cannot call it directly from the browser (section 10.2). This is the single biggest technical pain point and the reason the main competitor ships a companion WordPress plugin.
6. **Credential fear.** Store owners are rightly nervous pasting API keys into third-party tools. Read-only keys, local storage, and clear explanations reduce this.
7. **Rate limits and big catalogs.** Large stores hit pagination and request budgets; naive importers time out or silently skip items.
8. **Content gaps.** Woo products often have thin or missing short descriptions and SEO fields, which makes the synced Framer pages look unfinished.

---

## 4. Competitor Research by Platform

### 4.1 WooCommerce → Framer

#### FeCommerce (fecommerce.co) - the benchmark competitor
- **Model**: Free plugin. CMS mode (sync into Framer CMS) + API mode (live fetch by handle).
- **Sync**: one-click sync of titles, prices, images, variants, stock, categories.
- **Components**: Product Page, Variant Selector, Add to Cart, Buy Now, Cart Drawer, Cart Page, Checkout, Mobile Sticky Cart, Price, SKU, Rating, Reviews.
- **Checkout**: on-page with Cash on Delivery native, optional inline Stripe, optional Paystack redirect, live shipping rates and coupons.
- **CORS strategy**: companion WordPress plugin "Fecommerce CORS Bridge" (wordpress.org, <10 active installs) that lets Framer sites fetch WooCommerce REST API data with controlled CORS.
- **Weaknesses we can exploit**: WordPress companion plugin is an extra install step; <10 installs suggests early/traction-lite; on-page checkout introduces security surface; agency handoff and field-level mapping are not headline features; no AI capabilities.

#### FrameWoo (framerwoo.com, by FramerHub.io)
- **Model**: Free for 1 store / 15 products; paid plans are one-time per published store, lifetime updates.
- **Sync**: read-only WooCommerce REST API key. Syncs prices, stock, categories, tags, attributes, variations, ratings, images, galleries. Re-run updates only what changed. Maps Woo meta keys into CMS fields.
- **Components**: 100+ components, including customer accounts (login, registration, profiles, addresses, order history, refund requests, persistent wishlists).
- **Checkout**: stays native WooCommerce. Framer serves the front end.
- **Weaknesses**: product limits on free tier; one-time purchase model; 100+ components is heavy for users who just want sync; meta key mapping requires technical knowledge of Woo.

#### Opportunity in the Woo segment
- Both competitors either require a WordPress companion plugin (FeCommerce) or are paid past a tiny free tier (FrameWoo). A genuinely free, no-companion-plugin sync with AI content assist, guided first-run Help Guide, and stable item identity is a defensible "simple and reliable" position, exactly the free-app positioning in `INSTRUCTION.md` 2.3.

### 4.2 Shopify → Framer

#### Framer Commerce (framercommerce.com) - category leader
- Winner of Framer's Best Plugin Award. 40+ Shopify components.
- One-click sync: products, variants, prices, descriptions, tags, collections, SEO data, custom text metafields.
- Commerce depth: purchase buttons, subscriptions (selling plans), variant selectors, quantity, stock messaging, discount badges, product attribute fields, filters, search, favorites, cart upsells, Shopify Markets localization, Meta Pixel/GA analytics.
- **Pricing**: free tier with Framer Commerce badge and Framer domain; paid unlock custom domains, templates, higher product limits.

#### ShopifyConnect (by FeCommerce)
- Free. CMS mode + API mode. Storefront components auto-wire to the store. Storefront token stored locally, used server-side via secure proxy; PCI handled by Shopify checkout.

#### Shopify CMS Sync (by Grids & Giggles)
- 100% free, no account. No third-party backend: plugin talks directly from Framer to Shopify Storefront API with a read-only token stored inside the Framer project. Sync on button press. Items matched by product ID so bindings do not break; deleted products cleaned up automatically.
- Syncs: title, handle, rich-text description, URL, price min/max, currency, compare-at, featured image, gallery as JSON, variants/options as JSON, vendor, type, tags, category, collections, rating/review metafields, and any custom metafield as its own CMS field.
- **Lesson**: this is the closest model to what Ecom-Link MVP should be for WooCommerce. Direct, free, read-only, stable identity. Its key advantage (direct API calls, no backend) exists because **Shopify's Storefront API is CORS-enabled**, unlike WooCommerce.

#### Others
- Shopify Link, Shopiframe, Shopify Sellflow (paid, KDX Studios), Butter Commerce (private beta by Framer Commerce).

### 4.3 Wix → Framer
- **No sync plugins found** on the Framer marketplace (searched). White space, but with cause: Wix catalog access requires a Wix OAuth app (client id/secret, OAuth 2.0 flow with refresh tokens), which cannot run browser-only inside a plugin. A Wix provider would require the future backend or a companion Wix app.
- Wix REST Catalog API exists (query products, variants, media, collections) behind OAuth.

### 4.4 Webflow → Framer
- **No live sync plugins.** Closest: "Webflow Import" by Adam Kansky (CSV-based one-time CMS migration; free 25 items/collection, $49/$99 one-time). Not ecommerce-aware.
- **Important market signal**: Webflow has been sunsetting native ecommerce in favor of a Shopify partnership. Investing in Webflow commerce sync has platform risk; keep it low priority (matches `INSTRUCTION.md` 2.3 ordering).

### 4.5 General Framer commerce tools (adjacent competition)
- Checkout Page (Sander Visser, free), Frameshop, FramerCart, Polar, LemonSqueezy Checkout (paid), Stripe Payment Gateway and PayPal Checkout (KDX Studios, paid), Commerce Toolkit (Orix, free), FramerFlo, Mercado Framer, Connectfic, Shop Canvas, FramerConfigurator, Multi-Currency Display, Geo Pricing.
- These solve checkout/payments, not catalog sync from external platforms. Ecom-Link MVP does not compete with them directly, but a future "checkout" phase would.

### 4.6 Competitive summary

| Solution | Platform | Live sync | CMS mode | Free tier | Backend needed | AI | Checkout in Framer |
|----------|----------|-----------|----------|-----------|----------------|----|--------------------|
| FeCommerce | WooCommerce | Yes | Yes | Yes | Companion WP plugin | No | Yes (COD/Stripe/Paystack) |
| FrameWoo | WooCommerce | Yes | Yes | 15 products | No | No | No (native Woo) |
| Framer Commerce | Shopify | Yes | Yes | Badge + limits | Proxy | No | Yes (Shopify) |
| ShopifyConnect | Shopify | Yes | Yes | Yes | Secure proxy | No | Yes (Shopify) |
| Shopify CMS Sync | Shopify | Yes (manual) | Yes | 100% | None (direct API) | No | No |
| Webflow Import | Webflow | No (CSV) | Yes | 25 items | No | No | No |
| **Ecom-Link (planned)** | **WooCommerce first** | **Yes, two-way for enabled fields** | **Yes** | **Free** | **None for MVP (proxy optional)** | **Yes** | **No (MVP)** |

**Differentiators to pursue**: multi-platform provider architecture from day one, AI content assist, two-way sync (no researched competitor pushes Framer edits back to the store), first-run Help Guide, stable binding-safe sync identity, and no mandatory WordPress companion plugin for the core flow.

---

## 5. Core Product Features (research conclusion)

Derived from goals, pains, and the competitive gap:

1. Store connection manager (URL + REST API key/secret, read-only recommended).
2. Product import into Framer CMS with field mapping and stable item identity.
3. Incremental re-sync (only changed items), with publish/draft behavior control.
4. Connection health check and actionable error reporting.
5. First-run Help Guide (INSTRUCTION.md section 4).
6. AI content assist (short description, SEO title, SEO description) for synced products.
7. Two-way sync: push Framer CMS edits (inventory, pricing, basic content) back to WooCommerce with change detection, review, and conflict resolution.
8. Provider abstraction so Shopify/Wix/Webflow can be added without rework.

Full breakdown with priorities is in `docs/FEATURES.md`.

---

## 6. Functional and Technical Specifications

### 6.1 Runtime shape
- Framer plugin (React + TypeScript + Vite scaffold, `@framer/plugin` v4), floating plugin window on canvas.
- UI follows Framer best practices; reusable components in `/components/`; modals preferred over routes except rule editors (per INSTRUCTION.md; rules are not part of the MVP feature set).
- Boolean toggles use a Switch component (`plugin/components/ui/Switch.tsx` path convention adapted to this scaffold's `src/components/ui/Switch.tsx`).

### 6.2 Data flow (MVP)
```
WooCommerce store (wp-json/wc/v3)
        │  HTTPS + Basic auth (ck_/cs_ keys; read_write for two-way sync)
        ▼
[Ecom-Link plugin in Framer]──fetch pages of products──► GET /products?per_page=100&page=N
        │        GET /products/{id}/variations (paged)      (pull: Woo → Framer)
        │        GET /products/categories (paged)
        │
        │        PUT /products/{id}                          (push: Framer → Woo,
        │        POST /products/batch                         two-way fields only,
        ▼                                                 after user review)
Framer Plugin CMS API (get/set collection fields and items)
        ▼
Framer CMS collection ("Products") ── bound on canvas ──► published site
```

### 6.3 Sync engine requirements
- Paginate all list endpoints (`page`, `per_page` up to 100, honor `X-WP-TotalPages`).
- Respect `modified_after` / `dates_are_gmt=true` filters for incremental syncs after the first full import.
- Stable external ID = Woo product ID, stored in a CMS field (e.g. `woo_id`) plus `last_modified` for change detection.
- Never delete/recreate matched items (protects canvas bindings); offer explicit "remove items deleted in Woo" as an opt-in cleanup pass.
- Idempotent: re-running a sync produces no duplicate items.
- Cancellation-safe: user can cancel mid-sync; partial progress persists.

### 6.4 Error handling matrix

| Scenario | Detection | User-facing behavior |
|----------|-----------|----------------------|
| Invalid credentials (401/403) | HTTP status from Woo | "The connection failed. Check that your consumer key and secret are correct and have read access." |
| Store URL wrong / not WooCommerce | Network error or non-Woo response | "This does not look like a WooCommerce REST API endpoint. Check the store URL." |
| CORS rejection (direct mode) | TypeError on fetch | Explain CORS, offer companion plugin or proxy options |
| Rate limited (429) / transient 5xx | HTTP status | Automatic retry with exponential backoff (max 3), then surfaced as full sentence |
| Partial page failure mid-sync | Per-request try/catch | Sync pauses, progress kept, itemized failure list with retry button |
| Product image download fails | Asset pipeline error | Item still syncs; image field left empty; warning listed in sync report |
| Field type mismatch (e.g. price into a text field) | Mapping validation pre-sync | Blocking validation message before sync starts |
| Collection schema changed after mapping | Field presence check | Re-map prompt instead of silent data loss |

---

## 7. User Flows

### 7.1 First run (Help Guide + connect)
1. User opens Ecom-Link from Framer plugins menu.
2. Help Guide modal appears (first install only): what the plugin does, what you need (store URL, REST API keys with read scope, HTTPS), where to generate keys (WooCommerce → Settings → Advanced → REST API), security note (keys stored in this project only), link to full docs.
3. User clicks "Connect store".
4. Enter store URL → plugin normalizes and pings `/wp-json/wc/v3/system_status` or `/products?per_page=1`.
5. Enter consumer key/secret → validation call.
6. Success → dashboard view with "Import products" CTA.

### 7.2 Import products (first sync)
1. Choose target: create new collection or select existing.
2. Plugin proposes field mapping (Woo field → CMS field, with type-aware suggestions); user adjusts.
3. Options: product statuses to include (default publish), items per sync limit (safety cap), draft vs publish for imported items (default draft).
4. User clicks "Start sync" → progress (items fetched, items written, page x of y) with cancel.
5. Sync report: created/updated/skipped/failed counts, expandable failure list.

### 7.3 Re-sync (subsequent)
1. Dashboard shows last sync time and item counts.
2. "Sync now" runs incremental pass using stored `last_modified` watermark; falls back to full pass if watermark invalid.
3. Report highlights what changed.

### 7.4 AI content assist (per item or batch)
1. From sync report or item list: "Generate missing descriptions" for items with empty short description / SEO fields.
2. User reviews AI drafts in a modal (editable before applying).
3. Apply writes to CMS fields; originals (Woo data) are never overwritten, only AI-target fields.

---

## 8. Data Synchronization Requirements

- **Direction (MVP)**: two-way, field-scoped. WooCommerce → Framer pulls every mapped field; Framer → WooCommerce write-back applies only to fields the user explicitly marked as two-way (inventory, pricing, and basic content). See section 8.1 for feasibility and conflict rules.
- **Trigger**: manual ("Sync now"). No background sync in MVP (plugin runs only while open).
- **Change detection**: `date_modified` per product; watermark per connection.
- **Identity**: `woo_id` CMS field; matched items are updated in place.
- **Deletion**: Woo-deleted products are never auto-removed; optional cleanup action lists them for explicit user confirmation.
- **Images**: featured image and gallery downloaded through the plugin's asset pipeline into Framer assets, not left as external URLs (external URLs can break on publish; competitors like Shopify CMS Sync leave gallery as JSON, which is weaker).
- **Variants**: flattened into structured fields (JSON) for MVP plus first-variant price/stock as discrete fields, because Framer CMS has no variant type. Full variant modeling is a future feature.
- **Conflict policy**: field-level, never silent. For one-way fields Woo wins and Framer edits are overwritten (stated in UI and docs). For two-way fields, if both sides changed since the last sync the conflict is surfaced for resolution; unresolved conflicts default to the Woo value and are listed in the sync report. AI-assisted fields are excluded from overwrite.

### 8.1 Two-Way Sync Feasibility (Framer → WooCommerce write-back)

Verified against the WooCommerce REST API (wp-api-v3) docs:

- **Write endpoints**: `PUT /wp-json/wc/v3/products/{id}` updates `stock_quantity`, `manage_stock`, `regular_price`, `sale_price`, `sku`, `name`, `description`, `short_description`, `status`, `weight`, and more in a single request. `POST /wp-json/wc/v3/products/batch` accepts an `update: [{id, ...fields}]` array for bulk write-back, and `POST /products/{id}/variations/batch` exists for variation-level updates (future feature).
- **Credential requirement**: API key permission must be `read_write`. Read-only keys keep working for one-way sync; permission failures on write (401/403 on PUT) must be detected and explained with the key upgrade path.
- **Inventory semantics**: writing `stock_quantity` requires `manage_stock: true` on the product. Orders still decrement stock natively inside WooCommerce; Framer-side edits are treated as manual adjustments pushed on the next sync.
- **Framer-side change detection**: the plugin stores a snapshot of the last-synced value of every two-way field per item (in plugin data). On sync, current CMS values are compared with the snapshot: changed values are queued for write-back, unchanged values are skipped, and snapshots are refreshed after a successful write.
- **Woo-side change detection**: the existing `modified_after` watermark logic (section 6.3) applies unchanged.
- **Write batching**: changed fields grouped per product (one `PUT` per product), or one `POST /products/batch` for large change sets. Writes run after the pull phase and only after the user reviews the outgoing changes.
- **Safety rails (MVP)**: outgoing changes are always previewed (field, old value, new value) before applying; nothing is ever deleted in Woo from Framer; images are never written back in MVP; variations are never written back in MVP (batch endpoints documented above make this a clean future extension).
- **CORS for writes**: a browser `PUT`/`POST` with `Authorization` and `Content-Type` headers triggers a CORS preflight (`OPTIONS`), which plain WooCommerce will not answer. Write-back therefore requires either the companion WordPress plugin (extended to answer preflight with `Access-Control-Allow-Methods: GET, PUT, POST, OPTIONS` and `Access-Control-Allow-Headers: Authorization, Content-Type`) or the managed proxy (future). Detection and guidance mirror section 10.2.

---

## 9. Expected eCommerce Data Structure (WooCommerce product, distilled)
From `GET /wp-json/wc/v3/products` (wp-api-v3 docs):

| Woo field | Type | Maps to CMS |
|-----------|------|-------------|
| `id` | number | `woo_id` (identity, never edited) |
| `name` | string | Title / text |
| `slug` | string | text (slug) |
| `permalink` | string | URL |
| `type` | enum simple/grouped/external/variable | text or option |
| `status` | enum publish/draft/pending/private/trash | filter, option |
| `catalog_visibility` | enum | option |
| `description` | HTML string | rich text |
| `short_description` | HTML string | rich/text; **AI target** |
| `sku` | string | text |
| `price`, `regular_price`, `sale_price` | string decimal | text (formatted) or number |
| `on_sale` | boolean | boolean/Switch |
| `total_sales` | number | number |
| `stock_status` | enum instock/outofstock/onbackorder | option |

Writable fields: `sku`, `name`, `description`, `short_description`, `regular_price`, `sale_price`, `stock_quantity` (with `manage_stock`), `status`, and `weight` can be pushed back through `PUT /products/{id}` when the connection uses `read_write` keys and the field is marked two-way in the mapping (section 8.1). Images and variations are read-only in the MVP.
| `stock_quantity` | number or null | number |
| `weight`, `dimensions` | string/object | text |
| `categories[]` | id/name/slug | multi-link or tags/text |
| `tags[]` | id/name/slug | tags |
| `images[]` | id/src/alt | image + gallery |
| `attributes[]` | id/name/options/variation | JSON text |
| `variations[]` | array of ids | JSON text (MVP) |
| `date_modified` (GMT) | date-time | watermark + date field |
| `average_rating`, `rating_count`, `reviews_allowed` | string/number/bool | text/number/boolean |

Useful list filters: `status`, `type`, `category`, `tag`, `on_sale`, `stock_status`, `min_price`/`max_price`, `search`, ` orderby`/`order`, `modified_after` (with `dates_are_gmt=true`).

Variations require `GET /products/{id}/variations` per product (paged), which is the expensive loop for variable products (see rate limits).

---

## 10. Framer Integration Requirements and Limitations

### 10.1 What the Plugin API offers
- **CMS**: programmatically get/create collections, set fields, and set item values. This is the core surface Ecom-Link uses.
- **Assets**: insert images (and SVGs), needed to materialize Woo image URLs into real assets.
- **Nodes/Components**: insert and configure components on canvas (future storefront component library).
- **Sites**: info about the published site.
- **UI**: plugin window is a floating panel; any React UI works inside it.

### 10.2 Constraints and risks
1. **CORS**: WooCommerce REST API sends no CORS headers. Direct browser fetch from the plugin to `store.com/wp-json` will fail on most hosts. Mitigations (in order of preference for MVP):
   a. **Documented manual CORS fix** where hosts allow it (rare).
   b. **Companion WordPress plugin** by us (like FeCommerce's CORS Bridge) that adds `Access-Control-Allow-Origin` for the Framer plugin origin, and answers `OPTIONS` preflight with `PUT`/`POST` allowed so write-back works too. Optional for read-only sync; required for two-way write-back in direct mode.
   c. **Managed proxy** (free tier) run by us: `plugin → proxy → store`. Keeps MVP backend-light but introduces infrastructure.
   - **Decision for FEATURES.md**: MVP ships direct-connect as primary path with a built-in CORS detector and clear guidance, plus optional companion WP plugin path. A managed proxy is a future feature. This keeps the free app honest: no forced backend.
   - Note: Framer plugin dev toolbar can mask CORS in development; production behavior must be tested against a real Woo store.
2. **Plugin lifecycle**: plugins run while open; there is no background daemon, so "sync" is always user-triggered in MVP.
3. **Storage**: connection settings persist in the plugin/plugin-data scope (per project). Never assume cross-project sharing.
4. **Performance**: very large catalogs need batching and progress UI; avoid blocking the Framer main thread with huge loops; yield between writes.
5. **CMS field types**: map Woo types to the supported CMS field types (text, rich text, number, image, gallery, date, boolean, option, link, tags). No variant/relational product type exists; JSON fields carry structure.
6. **Publishing**: CMS changes may require publish to appear on the live site; the UI should remind users (draft vs publish semantics of items).

---

## 11. Authentication and Connection Flow

### 11.1 WooCommerce REST API auth (verified from docs)
- **HTTPS (required)**: HTTP Basic auth with consumer key as username, consumer secret as password. Query-string auth (`?consumer_key=...&consumer_secret=...`) only as fallback for broken hosts; avoid because it leaks secrets into URLs/logs.
- **API keys**: generated in WooCommerce → Settings → Advanced → REST API. Key permissions: `read`, `write`, `read_write`. **One-way sync needs only `read`**; two-way write-back (section 8.1) needs `read_write`. The UI should ask for the least permission the enabled features require and say so plainly.
- **Application Authentication Endpoint** (`/wc-auth/v1/authorize`) can auto-generate keys, but it requires a `callback_url` backend to receive the secret, so it is a future feature tied to the proxy/backend phase.

### 11.2 Connection flow (MVP)
1. User enters store URL (normalized to `https://store.com`).
2. User pastes consumer key + consumer secret.
3. Plugin performs validation request (cheap endpoint, e.g. `GET /products?per_page=1`).
4. On success, credentials are stored in plugin data with the connection record; never logged, never sent anywhere except the store's own endpoint.
5. Optional: enable two-way sync, which prompts for `read_write` keys with a plain security explanation of what the plugin will be allowed to change.
6. "Disconnect" clears credentials and offers optional collection cleanup.

### 11.3 Security notes
- Read-only keys; warn if a write key is detected (keys starting `cs_` vs read hints) and recommend read scope.
- Never render full secrets after saving (mask like `ck_••••1234`).
- All traffic over HTTPS; refuse `http://` store URLs except an explicit localhost dev exception.
- If the future proxy is built: secrets stay client-side; proxy forwards without persisting; store-scoped rate limiting; audit logging.

---

## 12. Error Handling and Sync Failure Scenarios
Covered in the matrix in section 6.4. Additional policies:
- Every user-visible error is a full, actionable sentence (UX writing rule 4).
- Sync report persists per run (last N runs) so users can inspect failures after the fact.
- Retry policy: automatic for 429/5xx only; manual for 4xx and field mismatches.

---

## 13. Information Architecture (plugin UI)

```
Ecom-Link plugin window
├── Help Guide (first-run modal; re-openable via help icon)
├── Dashboard
│   ├── Connection card (status, store URL, last sync, item counts)
│   ├── Sync controls (Sync now, View report, Cancel)
│   └── AI assist entry point
├── Connection setup (modal flow)
│   ├── Store details (URL)
│   ├── Credentials (key/secret)
│   └── Validation feedb, with per-field two-way direction)
├── Sync progress + report (modal or inline panel)
├── Write-back review (outgoing changes before they are pushed to Woo)
├── Conflict resolution (modal, when both sides changed)
└── Settings
    ├── Default item status (draft/publish)
    ├── Product statuses to sync
    ├── Two-way sync (enable/disable, writable fields)ft/publish)
    ├── Product statuses to sync
    └── AI settings (enable/disable, model transparency note)
```
Modals are preferred per INSTRUCTION.md section 6. Routes only if rule editors are added later (not in MVP).

---

## 14. Admin/Dashboard Requirements
The plugin's dashboard (above) is the admin surface for MVP. There is no external web admin in MVP. A future web dashboard (connections across projects, sync history) is documented as a future feature.

---

## 15. Security Considerations
- Least privilege: read-only API keys for one-way sync; `read_write` keys requested only when the user enables two-way sync, with the extra risk explained in plain language.
- Secret storage scope: plugin data within the project; masking in UI; no telemetry of secrets.
- Transport: HTTPS-only; CORS mitigations must not downgrade security (companion plugin must whitelist only the Framer origin, never `*`).
- AI calls (MVP): AI assist uses Framer's plugin AI capabilities where available, so no third-party key handling in v1. If external AI APIs are used later, keys are user-provided and stored locally.
- Input validation: store URL normalization; key format checks (`ck_`/`cs_` prefixes); payload size caps.
- Write-back safety: outgoing changes are always previewed and explicitly applied; writes are limited to the two-way fields the user enabled; the plugin never deletes products and never writes to unrelated store data.
- Supply chain: plugin ships via Framer marketplace; dependencies kept minimal (current scaffold deps only for MVP).

---

## 16. Scalability Considerations
- **Catalog size**: paged fetching (100/page), incremental `modified_after` syncs, per-page progress, cancellable operations. Target: 5,000 products without timeout by chunking writes and yielding to the event loop.
- **Variable products**: variations are the expensive N+1 loop. MVP caps variations per product (configurable) and documents the cap; full variant sync is a future feature.
- **Provider extensibility**: provider interface (section 18) isolates platform specifics; adding Shopify means implementing `listProducts`, `mapProduct`, `auth*`, not touching sync/CMS/UI layers.
- **Rate limits**: Woo has no hard documented limit on REST reads (host-dependent); the engine treats 429/5xx with backoff regardless.

---

## 17. Platform API Limitations, Rate Limits, and Auth Summary

| Platform | Auth for read | CORS from browser | Rate limits | Notes |
|----------|---------------|-------------------|-------------|-------|
| WooCommerce | REST API key (Basic auth; `read` for one-way, `read_write` for two-way) | **No (blocked)** | None documented; host/hosting dependent | Reads and writes (`PUT /products/{id}`, `POST /products/batch`); companion plugin or proxy needed for direct browser calls |
| Shopify | Storefront API access token (read-only) | Yes | Bucketed (leaky bucket, ~2 rps sustained per token class) | The reason competitors can be backend-free |
| Wix | OAuth 2.0 app (client id/secret + refresh token) | No | Rate limited per app/instance | Needs backend; no Framer plugin ecosystem precedent |
| Webflow | API token (per site) | Limited | 60 req/min per token class | Webflow sunsetting native ecommerce; platform risk |

---

## 18. Future Integrations and Expansion Opportunities
1. **Shopify provider** (first port after Woo): Storefront API read-only, direct calls, learned from Shopify CMS Sync's model. Two-way sync for Shopify additionally needs the Admin API (inventory adjustment, product updates) behind the OAuth backend in item 2.
2. **Managed sync proxy/backend**: unlocks Woo Application Authentication Endpoint (one-click key generation), Wix OAuth, scheduled background syncs, webhooks, and an authenticated write path for two-way sync on all platforms.
3. **Storefront component library**: Product Listing, Product Page, Variant Selector, Price/Stock badges, wired to synced CMS data (competes with FeCommerce/FrameWoo components).
4. **AI expansions**: category-aware copy tone, bulk AI pass, alt-text generation for product images, translation.
5. **Cart/checkout phase**: on-page checkout via Woo Store API (requires write keys and heavy security review).
6. **Wix and Webflow providers** (with backend).
7. **Multi-store support**: multiple connections per project (agencies).
8. **Sync rules**: scheduled/push-based sync rules on dedicated routes (fits INSTRUCTION.md's rules-on-routes exception).
9. **Advanced write-back**: image and gallery upload through the WooCommerce media endpoint, variation-level stock write-back (`POST /products/{id}/variations/batch`), and scheduled automatic two-way sync.
10. **Two-way sync on other platforms**: Shopify (Admin API inventory), Wix (Catalog API write), and Webflow, each gated on that platform's provider and OAuth backend landing first.

---

## Appendix A. Sources
- Framer Developers: Plugins introduction, core features (nodes, components, CMS, sites, assets): framer.com/developers/plugins
- Framer Marketplace: Ecommerce category, FeCommerce, FrameWoo, ShopifyConnect, Framer Commerce, Shopify CMS Sync, Butter Commerce, Webflow Import pages: framer.com/marketplace/plugins/*
- WooCommerce REST API docs (wp-api-v3): authentication (Basic/query-string, Application Authentication Endpoint), products list parameters (status, type, stock_status, on_sale, price filters, pagination), product categories, product reviews: woocommerce.github.io/woocommerce-rest-api-docs
- WordPress.org plugin directory: "Fecommerce CORS Bridge": wordpress.org/plugins/fecommerce-cors-bridge/
- Snipcart (adjacent, cart-for-any-site model): snipcart.com
