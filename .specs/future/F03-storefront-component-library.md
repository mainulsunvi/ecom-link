# Spec F03: Storefront Component Library

Status: Future. Feature: `docs/FEATURES.md` F3.

## 1. Problem statement

After syncing products to Framer CMS, users must manually build product listings and pages using generic CMS bindings. A drag-and-drop component library provides pre-built, styled components (Product Listing, Product Page, Variant Selector, Price, Stock Badge, Add to Cart) that auto-bind to synced CMS data, reducing time-to-launch.

## 2. Data model decision

Components are Framer code components (React) that read from CMS collections via Framer's built-in CMS binding system. No new storage; components query CMS items filtered by collection ID.

- **Product Listing**: Grid/list layout, paginated, filterable by category/tag/price.
- **Product Page**: Full product display with images, description, variants, add-to-cart.
- **Variant Selector**: Dropdown or swatches for product options (color, size).
- **Price**: Displays current price, regular price (strikethrough if on sale), sale price.
- **Stock Badge**: Shows stock status (In Stock, Out of Stock, Low Stock).
- **Add to Cart**: Button that links to WooCommerce checkout with product ID and quantity.

Read path: Component reads CMS item fields via Framer's `useCollectionItem` hook. Write path: None (components are read-only; cart/checkout is F5).

## 3. Platform API operations

None directly. Components read from Framer CMS, not platform APIs. The sync engine (M3, M4) populates CMS; components consume it.

## 4. Credentials required

None. Components use Framer's CMS APIs, which are already authenticated via the plugin context.

## 5. Triggers consumed

None. Components are static React components; no triggers.

## 6. File-by-file change list

- `src/components/storefront/ProductListing.tsx`: Grid/list component, new
- `src/components/storefront/ProductPage.tsx`: Full product page, new
- `src/components/storefront/VariantSelector.tsx`: Variant dropdown/swatches, new
- `src/components/storefront/Price.tsx`: Price display with sale logic, new
- `src/components/storefront/StockBadge.tsx`: Stock status badge, new
- `src/components/storefront/AddToCart.tsx`: Cart button with link-out, new
- `src/components/storefront/ProductImageGallery.tsx`: Image gallery with thumbnails, new
- `src/components/storefront/ProductCard.tsx`: Card for listing grids, new
- `src/components/storefront/styles.ts`: Shared styles and theming, new
- `docs/help/Storefront Components.md`: Usage guide, new

## 7. Acceptance criteria

1. Given a synced CMS collection, the Product Listing component renders a grid of products with images, names, and prices.
2. Given a product with variants, the Variant Selector component displays all options and updates the displayed price/stock when a variant is selected.
3. Given a product on sale, the Price component shows the sale price and strikes through the regular price.
4. Given a product with stock quantity < 5, the Stock Badge shows "Low Stock" in yellow.
5. Given a product with stock quantity = 0, the Stock Badge shows "Out of Stock" in red and the Add to Cart button is disabled.
6. Given a user clicks Add to Cart, the button links to the WooCommerce checkout URL with the product ID and quantity as query parameters.
7. Given a CMS collection with 100+ products, the Product Listing component paginates (10/20/50 per page) and filters by category/tag.

## 8. Open questions

1. **Styling**: Should components use Framer's built-in styles (CSS-in-JS) or Tailwind? Should users be able to override styles via props?
2. **Theming**: Should we provide pre-built themes (minimal, bold, elegant) or let users style from scratch?
3. **Responsive design**: Should components auto-adapt to breakpoints, or require manual configuration?
4. **Image optimization**: Should components use Framer's image CDN (auto-resize, WebP) or load original URLs?
5. **Localization**: Should components support multi-language CMS collections (Framer's localization feature)?
6. **Performance**: Should Product Listing use virtualization (react-window) for large catalogs?

## Always answer these four

- **Removed then re-added plugin**: Components remain on canvas; they break if CMS collection is deleted. User must reconnect collection.
- **Framer plan limit mid-sync**: Components are unaffected; they read from CMS, not sync engine.
- **Partial sync failure and retry**: Components show stale data until sync completes. No error state in components.
- **Unusually large catalog**: Product Listing paginates; components handle 1000+ items via CMS query limits.
