# Spec F01: Additional Platform Providers

Status: Future. Feature: `docs/FEATURES.md` F1.

## 1. Problem statement

The plugin launches with WooCommerce only, but the provider architecture was designed to support multiple platforms. Adding Shopify, Wix, and Webflow providers will expand the addressable market and validate the abstraction layer.

## 2. Data model decision

Each provider implements the `EcommerceProvider` contract from `src/providers/types.ts`. No new storage structures needed; each provider uses the same connection/snapshot/history storage with provider-specific credential schemas.

- **Shopify**: Storefront API (read-only initially), Admin API for two-way sync (requires OAuth backend). Product mapping follows the same `NormalizedProduct` structure.
- **Wix**: Requires OAuth backend. Catalog API for products. Mapping similar to Woo but with Wix-specific fields.
- **Webflow**: CMS API for products (treated as CMS items). Platform risk noted in research.

Read path: provider's `listProducts` returns `NormalizedProduct[]`. Write path: provider's `updateProductFields` (if `supportsTwoWaySync: true`).

## 3. Platform API operations

**Shopify Storefront API**:
- `products` query (paginated, cursor-based)
- `productByHandle` query
- Cost: ~10-50 nodes per query

**Shopify Admin API** (for two-way):
- `products` query/mutation
- `inventoryBulkAdjustQuantityAtLocation` mutation
- Requires OAuth + `read_products`, `write_products` scopes

**Wix Catalog API**:
- `queryProducts` (paginated)
- `getProduct` 
- Requires OAuth + Catalog API scope

**Webflow CMS API**:
- `GET /collections/{id}/items` (paginated)
- `PATCH /collections/{id}/items/{id}`
- Requires OAuth + CMS write scope

## 4. Credentials required

**Shopify**: Storefront API token (public, read-only) or Admin API OAuth token (two-way). Store domain (e.g., `mystore.myshopify.com`).

**Wix**: OAuth access token. Site ID.

**Webflow**: OAuth access token. Site ID.

Each provider adds a `credentialSchema` to its registration. No `framer.json` changes unless new permissions are required.

## 5. Triggers consumed

None. All platforms use manual sync triggers (no webhooks in MVP or future without backend).

## 6. File-by-file change list

- `src/providers/shopify/client.ts`: Shopify Storefront API client, new
- `src/providers/shopify/mapper.ts`: Shopify product → NormalizedProduct, new
- `src/providers/shopify/index.ts`: Shopify provider implementation, new
- `src/providers/wix/client.ts`: Wix Catalog API client, new
- `src/providers/wix/mapper.ts`: Wix product → NormalizedProduct, new
- `src/providers/wix/index.ts`: Wix provider implementation, new
- `src/providers/webflow/client.ts`: Webflow CMS API client, new
- `src/providers/webflow/mapper.ts`: Webflow item → NormalizedProduct, new
- `src/providers/webflow/index.ts`: Webflow provider implementation, new
- `src/providers/registry.ts`: Register new providers, update
- `src/views/ConnectionModal.tsx`: Provider selection UI, update
- `docs/help/Connect Your Store.md`: Add Shopify/Wix/Webflow instructions, update

## 7. Acceptance criteria

1. Given a Shopify store domain and Storefront API token, `validateConnection` succeeds and `listProducts` returns normalized products with all fields populated.
2. Given a Wix site with OAuth token, `listProducts` returns normalized products.
3. Given a Webflow site with OAuth token, `listProducts` returns normalized products from a CMS collection.
4. Provider registry returns all four providers (WooCommerce, Shopify, Wix, Webflow) via `listProviders()`.
5. Connection modal shows provider selection dropdown with all four options.
6. Each provider's credential schema renders the correct fields (Shopify: domain + token; Wix: OAuth + site ID; Webflow: OAuth + site ID).
7. Sync engine works identically with all four providers (no provider-specific logic in engine).

## 8. Open questions

1. **Shopify two-way sync**: Requires OAuth backend (F2). Should we ship Shopify read-only first, or wait for backend?
2. **Wix OAuth flow**: Wix requires a redirect-based OAuth flow. How do we handle this in a Framer plugin (no backend)?
3. **Webflow CMS structure**: Webflow treats products as CMS items, not a dedicated product type. Should we require a specific CMS collection structure, or auto-detect?
4. **Provider-specific fields**: Each platform has unique fields (e.g., Shopify's `vendor`, Wix's `ribbon`). Should we extend `NormalizedProduct` or store as metadata?
5. **Image handling**: Shopify images are CDN-hosted (stable URLs). Wix/Webflow may require download like Woo. Provider-specific image handling?

## Always answer these four

- **Removed then re-added plugin**: Credentials cleared; user reconnects. Same as Woo.
- **Framer plan limit mid-sync**: Same safety cap applies per provider.
- **Partial sync failure and retry**: Same retry logic; provider-agnostic.
- **Unusually large catalog**: Same pagination; each provider's `maxPageSize` capability flag controls page size.
