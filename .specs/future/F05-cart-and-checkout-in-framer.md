# Spec F05: Cart and Checkout in Framer

Status: Future. Feature: `docs/FEATURES.md` F5.

## 1. Problem statement

The MVP links out to WooCommerce for checkout. A native cart and checkout experience in Framer (using the WooCommerce Store API) keeps users on the Framer site, improving conversion rates and brand consistency. This requires a heavy security review due to payment handling.

## 2. Data model decision

Cart state is stored in the browser (localStorage or IndexedDB), not in Framer CMS or the backend. The cart is session-based and tied to the user's browser.

- **Cart**: Array of `{productId, variationId, quantity, price}` objects.
- **Checkout**: Multi-step form (shipping, billing, payment) that submits to WooCommerce Store API.
- **Payment**: Integration with WooCommerce payment gateways (Stripe, PayPal, COD) via Store API.

Read path: Cart reads from localStorage; checkout reads cart state and submits to Store API. Write path: Cart updates localStorage; checkout creates Woo order via Store API.

## 3. Platform API operations

**WooCommerce Store API** (requires WooCommerce 3.5+):
- `POST /wp-json/wc/store/v1/cart/add-item` (add to cart)
- `POST /wp-json/wc/store/v1/cart/update-item` (update quantity)
- `POST /wp-json/wc/store/v1/cart/remove-item` (remove from cart)
- `GET /wp-json/wc/store/v1/cart` (get cart contents)
- `POST /wp-json/wc/store/v1/checkout` (place order)
- `GET /wp-json/wc/store/v1/checkout/payment-methods` (list payment gateways)

Authentication: Nonce-based (Store API uses WordPress cookies) or JWT (for headless). Requires a backend proxy or custom authentication layer.

## 4. Credentials required

Same as MVP (WooCommerce REST API keys) plus Store API access. If using a backend proxy (F2), the backend handles authentication.

## 5. Triggers consumed

None. Cart is client-side; checkout is user-initiated.

## 6. File-by-file change list

- `src/components/storefront/Cart.tsx`: Cart drawer/modal, new
- `src/components/storefront/CartItem.tsx`: Individual cart item row, new
- `src/components/storefront/Checkout.tsx`: Multi-step checkout form, new
- `src/components/storefront/ShippingForm.tsx`: Shipping address form, new
- `src/components/storefront/BillingForm.tsx`: Billing address form, new
- `src/components/storefront/PaymentSelector.tsx`: Payment method selection, new
- `src/components/storefront/OrderSummary.tsx`: Order total breakdown, new
- `src/store/cart.ts`: Cart state management (localStorage/IndexedDB), new
- `src/store/checkout.ts`: Checkout state and validation, new
- `src/api/storeApi.ts`: WooCommerce Store API client, new
- `src/api/payments/stripe.ts`: Stripe integration (if direct), new
- `src/api/payments/paypal.ts`: PayPal integration (if direct), new
- `src/views/CartSettings.tsx`: Cart configuration modal, new
- `docs/help/Cart and Checkout.md`: Setup and usage guide, new
- `docs/help/Payment Gateways.md`: Payment configuration guide, new

## 7. Acceptance criteria

1. Given a user clicks "Add to Cart" on a product, the cart drawer opens and displays the item with correct price and quantity.
2. Given a user updates quantity in the cart, the total recalculates immediately.
3. Given a user proceeds to checkout, the form validates shipping/billing addresses and displays payment methods.
4. Given a user selects "Credit Card" and enters valid details, the order is placed and a confirmation page displays.
5. Given a WooCommerce store with Stripe enabled, the checkout processes a real payment and creates an order in Woo.
6. Given a cart with 10 items, the checkout calculates shipping, tax, and total correctly.
7. Given a payment failure, the checkout displays a clear error message and allows retry.
8. Given a user abandons checkout, the cart persists in localStorage for 7 days.

## 8. Open questions

1. **Security review**: Handling payment data requires PCI compliance. Should we use WooCommerce's hosted checkout (iframe) or build a custom form (higher risk)?
2. **Backend requirement**: Store API requires authentication. Should we require the managed proxy (F2), or allow direct Store API calls with custom auth?
3. **Payment gateways**: Which gateways to support first? Stripe (most popular), PayPal (ubiquitous), or COD (simple)?
4. **Tax calculation**: Should we use WooCommerce's tax settings, or integrate a third-party service (TaxJar, Avalara)?
5. **Shipping rates**: Should we calculate shipping in Framer (complex) or defer to WooCommerce's shipping methods?
6. **Guest checkout**: Should we support guest checkout, or require user accounts?
7. **Order status**: Should we sync order status back to Framer (e.g., "Order Placed", "Shipped")?

## Always answer these four

- **Removed then re-added plugin**: Cart state cleared; user starts fresh. Orders placed before removal remain in Woo.
- **Framer plan limit mid-sync**: Cart is client-side; unaffected by Framer limits.
- **Partial sync failure and retry**: Cart operations are idempotent; retry on failure.
- **Unusually large catalog**: Cart handles 100+ items; checkout paginates order review.
