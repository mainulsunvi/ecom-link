# Spec 001: Platform Provider Abstraction

Status: MVP. Feature: `docs/FEATURES.md` M1.

## 1. Problem statement

The plugin must sync Framer with several eCommerce platforms over time, but WooCommerce is the only one shipping in v1. Building Woo-specific logic into the engine and UI would force a rewrite when Shopify or Wix arrive. We need a provider contract that the whole app depends on instead.

## 2. Data model decision

All types live in `src/providers/types.ts` as TypeScript interfaces. No storage in this spec.

- `NormalizedProduct`: the platform-neutral product model covering `docs/RESEARCH.md` section 9 (`id`, `name`, `slug`, `permalink`, `type`, `status`, `description`, `shortDescription`, `sku`, `price`, `regularPrice`, `salePrice`, `onSale`, `stockStatus`, `stockQuantity`, `categories`, `tags`, `featuredImage`, `gallery`, `attributes`, `variantIds`, `rating`, `ratingCount`, `lastModified`).
- `EcommerceProvider`: `id`, `displayName`, `capabilities` (`supportsTwoWaySync: boolean`, `writableFields: NormalizedProductField[]`), `credentialSchema`, `validateConnection(credentials)`, `listProducts(credentials, query)`, `getProduct(credentials, id)`, `updateProductFields(credentials, id, fields)`, `mapProduct(raw)`.
- Read path: engine calls `listProducts`, gets `NormalizedProduct[]`. Write path: engine calls `updateProductFields` with only enabled fields, only after user preview.
- Decision: capability flags instead of subclass sniffing, so the UI can disable two-way controls per provider without knowing provider internals.

## 3. Platform API operations

None directly. This spec is the boundary that keeps platform calls inside adapters. The first implementation (WooCommerce) lands in spec 003.

## 4. Credentials required

The contract carries a `credentialSchema`; no concrete keys. No `framer.json` change.

## 5. Triggers consumed

None. Pure type and registry layer.

## 6. File-by-file change list

- `src/providers/types.ts`: all contracts and models, new.
- `src/providers/registry.ts`: `registerProvider`, `getProvider`, `listProviders`, new.
- `src/providers/index.ts`: barrel export, new.

## 7. Acceptance criteria

1. Given the registry with a registered mock provider, `getProvider(id)` returns it and `getProvider("unknown")` throws a typed `ProviderNotFoundError`.
2. Given a mock raw Woo product fixture, a provider `mapProduct` implementing the contract returns a `NormalizedProduct` with every section-9 field populated (property test over a fixed fixture).
3. Given a provider with `supportsTwoWaySync: false`, TypeScript rejects an engine call to `updateProductFields` at compile time (type-level test).
4. `listProviders()` returns exactly one entry ("WooCommerce") in v1 without engine changes when a second provider registers.

## 8. Open questions

- Should `credentialSchema` be declarative (rendered generically by the connection UI) or typed per provider? Declarative is assumed for v1.

## Always answer these four

- **Removed then re-added plugin**: types are stateless; no impact.
- **Framer plan limit mid-sync**: out of scope here; the contract exposes item counts so the engine can check.
- **Partial sync failure and retry**: `listProducts` must be resumable by page; the query type carries `page` and returns `totalPages`.
- **Unusually large catalog**: pagination is part of the contract (`page`, `per_page` up to 100, `totalPages` from `X-WP-TotalPages`), so engines page generically.
