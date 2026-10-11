/**
 * Tests for spec 001 (Platform Provider Abstraction) acceptance criteria.
 *
 * Covers the registry contract (AC1: lookup plus typed ProviderNotFoundError),
 * complete normalized mapping over a fixed fixture (AC2), and the v1
 * single-provider registry that also accepts a second provider with no
 * engine change (AC4). The compile-time half of AC3 lives in
 * providers.test-d.ts, which vitest typechecks in the same run.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  clearProviders,
  getProvider,
  hasProvider,
  listProviders,
  registerProvider,
} from "../registry"
import {
  InvalidCredentialsError,
  ProductNotFoundError,
  ProviderError,
  ProviderNotFoundError,
} from "../types"
import { wooCommerceProvider } from "../woocommerce"
import {
  SECTION_9_FIELDS,
  createMockTwoWayProvider,
  mapMockProduct,
  mockReadOnlyProvider,
  mockTwoWayProvider,
  rawMockProduct,
  rawSecondMockProduct,
} from "./mockProvider"

// Field groups used by the AC2 populated-property checks. Typed as const
// tuples so indexing the mapped product resolves to the right value type.
const NON_EMPTY_STRING_FIELDS = [
  "id",
  "name",
  "slug",
  "permalink",
  "type",
  "status",
  "description",
  "shortDescription",
  "sku",
  "stockStatus",
  "lastModified",
] as const

const NUMBER_FIELDS = [
  "price",
  "regularPrice",
  "rating",
  "ratingCount",
] as const

const NON_EMPTY_COLLECTION_FIELDS = [
  "categories",
  "tags",
  "gallery",
  "attributes",
  "variantIds",
] as const

describe("registry and getProvider (spec 001 AC1)", () => {
  beforeEach(function resetRegistry() {
    clearProviders()
    registerProvider(wooCommerceProvider)
    registerProvider(mockTwoWayProvider)
  })

  it("returns the provider registered under an id", () => {
    const provider = getProvider("mock-commerce")
    expect(provider).toBe(mockTwoWayProvider)
    expect(provider.displayName).toBe("Mock Commerce")
    expect(provider.capabilities.supportsTwoWaySync).toBe(true)
  })

  it("returns the WooCommerce provider registered under its id", () => {
    const provider = getProvider("woocommerce")
    expect(provider).toBe(wooCommerceProvider)
    expect(provider.displayName).toBe("WooCommerce")
  })

  it("throws the typed ProviderNotFoundError for an unknown id", () => {
    let thrown: unknown
    try {
      getProvider("unknown")
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ProviderNotFoundError)
    expect(thrown).toBeInstanceOf(ProviderError)
    expect(function lookupAgain() {
      getProvider("unknown")
    }).toThrow(ProviderNotFoundError)

    const typed = thrown as ProviderNotFoundError
    expect(typed.code).toBe("PROVIDER_NOT_FOUND")
    expect(typed.providerId).toBe("unknown")
    expect(typed.message).toContain('Provider "unknown" not found')
  })

  it("answers hasProvider without throwing for unknown ids", () => {
    expect(hasProvider("woocommerce")).toBe(true)
    expect(hasProvider("mock-commerce")).toBe(true)
    expect(hasProvider("unknown")).toBe(false)
  })

  it("rejects a second registration with the same id", () => {
    expect(function registerAgain() {
      registerProvider(wooCommerceProvider)
    }).toThrow('Provider "woocommerce" is already registered.')
  })
})

describe("mapProduct over the fixed fixture (spec 001 AC2)", () => {
  const product = mapMockProduct(rawMockProduct)

  it("returns an object carrying exactly the section 9 field set", () => {
    expect(Object.keys(product).sort()).toEqual([...SECTION_9_FIELDS].sort())
    expect(Object.keys(product)).toHaveLength(SECTION_9_FIELDS.length)
  })

  it("leaves no section 9 field undefined or null", () => {
    for (const field of SECTION_9_FIELDS) {
      expect(product[field], `${field} must be populated`).toBeDefined()
      expect(product[field], `${field} must be populated`).not.toBeNull()
    }
  })

  it("fills every string field with a non-empty value", () => {
    for (const field of NON_EMPTY_STRING_FIELDS) {
      expect(
        product[field].length,
        `${field} must be a non-empty string`
      ).toBeGreaterThan(0)
    }
  })

  it("fills every number field with a finite value", () => {
    for (const field of NUMBER_FIELDS) {
      expect(
        Number.isFinite(product[field]),
        `${field} must be a finite number`
      ).toBe(true)
    }
  })

  it("fills every collection field with at least one entry", () => {
    for (const field of NON_EMPTY_COLLECTION_FIELDS) {
      expect(product[field].length, `${field} must not be empty`).toBeGreaterThan(0)
    }
    expect(product.featuredImage).not.toBeNull()
    expect(product.featuredImage?.url.length ?? 0).toBeGreaterThan(0)
    expect(product.onSale).toBe(true)
    expect(product.stockQuantity).toBe(14)
    expect(product.salePrice).toBe(16.99)
  })

  it("normalizes platform value types into the model types", () => {
    expect(product.id).toBe("101")
    expect(product.regularPrice).toBe(21.99)
    expect(product.price).toBe(16.99)
    expect(product.rating).toBe(4.5)
    expect(product.ratingCount).toBe(27)
    expect(product.variantIds).toEqual(["201", "202", "203"])
    expect(product.categories).toEqual([{ id: "9", name: "Bags", slug: "bags" }])
    expect(product.tags).toEqual(["canvas", "summer"])
    expect(product.featuredImage?.id).toBe("501")
    expect(
      product.gallery.map(function idOf(image) {
        return image.id
      })
    ).toEqual(["502", "503"])
    expect(product.attributes[0]?.name).toBe("Color")
    expect(product.attributes[0]?.options).toEqual(["Natural", "Black"])
    expect(product.attributes[0]?.isVariation).toBe(false)
    expect(Number.isNaN(Date.parse(product.lastModified))).toBe(false)
  })

  it("maps absent sale pricing and unmanaged stock to null", () => {
    const second = mapMockProduct(rawSecondMockProduct)
    expect(second.id).toBe("102")
    expect(second.salePrice).toBeNull()
    expect(second.onSale).toBe(false)
    expect(second.price).toBe(24.99)
    expect(second.regularPrice).toBe(24.99)
    expect(second.stockQuantity).toBeNull()
    expect(second.stockStatus).toBe("outofstock")
  })

  it("is exposed through the provider contract itself", () => {
    const provider = createMockTwoWayProvider()
    expect(provider.mapProduct(rawMockProduct)).toEqual(product)
  })
})

describe("listProviders registry contents (spec 001 AC4)", () => {
  beforeEach(function resetRegistry() {
    clearProviders()
    registerProvider(wooCommerceProvider)
  })

  it("registers exactly one provider, WooCommerce, when the barrel loads", async () => {
    // Re-import the production entry with a fresh module graph so the
    // self-registration side effect runs again from scratch.
    vi.resetModules()
    const providersModule = await import("../index")

    const registered = providersModule.listProviders()
    expect(registered).toHaveLength(1)
    expect(registered[0]?.id).toBe("woocommerce")
    expect(registered[0]?.displayName).toBe("WooCommerce")
  })

  it("reports a second provider once it registers, with no engine change", () => {
    registerProvider(mockTwoWayProvider)

    const registered = listProviders()
    expect(registered).toHaveLength(2)
    expect(
      registered
        .map(function nameOf(provider) {
          return provider.displayName
        })
        .sort()
    ).toEqual(["Mock Commerce", "WooCommerce"])

    // The engine path (getProvider) serves both providers unchanged.
    expect(getProvider("woocommerce").displayName).toBe("WooCommerce")
    expect(getProvider("mock-commerce").displayName).toBe("Mock Commerce")
    expect(hasProvider("mock-commerce")).toBe(true)
  })

  it("accepts a read-only provider alongside WooCommerce", () => {
    registerProvider(mockReadOnlyProvider)

    expect(listProviders()).toHaveLength(2)
    const readOnly = getProvider("mock-readonly")
    expect(readOnly.displayName).toBe("Mock Read Only Commerce")
    expect(readOnly.capabilities.supportsTwoWaySync).toBe(false)
    expect(readOnly.capabilities.writableFields).toEqual([])
  })
})

describe("two-way contract behavior (spec 001 AC3 runtime half)", () => {
  const credentials = { mockToken: "mock-token" }

  it("reports the capability flag the engine guards on", () => {
    expect(createMockTwoWayProvider().capabilities.supportsTwoWaySync).toBe(
      true
    )
    expect(mockReadOnlyProvider.capabilities.supportsTwoWaySync).toBe(false)
    expect(mockReadOnlyProvider.capabilities.writableFields).toEqual([])
  })

  it("validates credentials through the contract", async () => {
    const provider = createMockTwoWayProvider()
    await expect(provider.validateConnection(credentials)).resolves.toBeUndefined()
    await expect(provider.validateConnection({})).rejects.toBeInstanceOf(
      InvalidCredentialsError
    )
  })

  it("applies only the requested fields and persists them", async () => {
    const provider = createMockTwoWayProvider()
    const updated = await provider.updateProductFields(credentials, "101", {
      regularPrice: 19.99,
      stockQuantity: 3,
    })

    expect(updated.regularPrice).toBe(19.99)
    expect(updated.stockQuantity).toBe(3)
    expect(updated.name).toBe("Mock Canvas Tote")

    const stored = await provider.getProduct(credentials, "101")
    expect(stored.regularPrice).toBe(19.99)
    expect(stored.stockQuantity).toBe(3)
  })

  it("rejects writes for unknown products with ProductNotFoundError", async () => {
    const provider = createMockTwoWayProvider()
    await expect(
      provider.updateProductFields(credentials, "999", {})
    ).rejects.toBeInstanceOf(ProductNotFoundError)
  })

  it("pages products so the engine can resume by page", async () => {
    const provider = createMockTwoWayProvider()

    const firstPage = await provider.listProducts(credentials, {
      page: 1,
      perPage: 10,
    })
    expect(firstPage.products).toHaveLength(2)
    expect(firstPage.page).toBe(1)
    expect(firstPage.perPage).toBe(2)
    expect(firstPage.totalPages).toBe(2)
    expect(firstPage.totalItems).toBe(3)

    const secondPage = await provider.listProducts(credentials, {
      page: 2,
      perPage: 10,
    })
    expect(secondPage.products).toHaveLength(1)
    expect(secondPage.page).toBe(2)

    const resumed = [...firstPage.products, ...secondPage.products]
    expect(
      resumed.map(function idOf(item) {
        return item.id
      })
    ).toEqual(["101", "102", "103"])
  })
})
