/**
 * WooCommerce Provider (connection scope)
 *
 * Registers the WooCommerce implementation of the EcommerceProvider contract.
 * Spec 002 ships connection validation and the CORS helper only. Product
 * listing, mapping, and write-back arrive with specs 003 and 004, so those
 * methods throw a clear error for now instead of pretending to work.
 */

import type { EcommerceProvider } from "../types"
import { ProviderError } from "../types"
import { hasProvider, registerProvider } from "../registry"
import {
  validateConnection,
  checkWriteAccess,
  AuthError,
  NotWooError,
  CorsError,
  TransientError,
} from "./client"

// Re-export the typed connection errors so consumers can import them from
// the provider barrel without reaching into the client module.
export { AuthError, NotWooError, CorsError, TransientError }

/**
 * Shared stub for the product methods that ship with spec 003 and 004.
 * The message is a full sentence so it stays presentable if it ever surfaces.
 */
async function notAvailableYet(): Promise<never> {
  throw new ProviderError(
    "Product syncing is not available yet. It arrives with the next update.",
    "NOT_AVAILABLE_YET",
    "woocommerce"
  )
}

/** Sync stub matching the mapProduct signature until spec 003 lands. */
function mapProductStub(): never {
  throw new ProviderError(
    "Product syncing is not available yet. It arrives with the next update.",
    "NOT_AVAILABLE_YET",
    "woocommerce"
  )
}

/**
 * The WooCommerce provider instance. Capabilities describe what the platform
 * supports (architecture D6); write-back itself stays gated behind preview
 * confirmation in spec 004.
 */
export const wooCommerceProvider: EcommerceProvider<true> = {
  id: "woocommerce",
  displayName: "WooCommerce",
  capabilities: {
    supportsTwoWaySync: true,
    // Writable set from FEATURES.md M11, limited to fields the normalized
    // model already carries. Weight joins when the model grows in spec 004.
    writableFields: [
      "name",
      "slug",
      "status",
      "description",
      "shortDescription",
      "sku",
      "regularPrice",
      "salePrice",
      "stockStatus",
      "stockQuantity",
    ],
    supportsVariants: true,
    supportsCategories: true,
    supportsTags: true,
    supportsImages: true,
    maxPageSize: 100,
  },
  credentialSchema: [
    {
      key: "storeUrl",
      label: "Store URL",
      type: "url",
      placeholder: "https://store.example.com",
      helpText: "The address of your WooCommerce store, starting with https://.",
      required: true,
    },
    {
      key: "consumerKey",
      label: "Consumer key",
      type: "password",
      placeholder: "ck_1234567890abcdef",
      helpText:
        "Create API keys in WooCommerce under Settings, Advanced, REST API.",
      required: true,
    },
    {
      key: "consumerSecret",
      label: "Consumer secret",
      type: "password",
      placeholder: "cs_1234567890abcdef",
      helpText: "The secret shown next to your consumer key.",
      required: true,
    },
  ],
  validateConnection,
  listProducts: notAvailableYet,
  getProduct: notAvailableYet,
  updateProductFields: notAvailableYet,
  mapProduct: mapProductStub,
  checkWriteAccess,
}

// Self-register once, so importing the provider barrel is all callers need.
// The guard keeps hot reloads and test setups from double-registering.
if (!hasProvider(wooCommerceProvider.id)) {
  registerProvider(wooCommerceProvider)
}
