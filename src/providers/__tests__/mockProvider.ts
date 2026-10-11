/**
 * Mock provider for spec 001 tests.
 *
 * Implements the EcommerceProvider contract against in-memory stores so the
 * registry, mapping, and write-path tests run without any network. The raw
 * fixtures are Woo shaped (numeric ids, string prices, nested image and
 * attribute objects) so mapProduct has to perform real normalization work.
 * The read-only variant demonstrates the compile-time gate verified in
 * providers.test-d.ts.
 */

import type {
  CredentialField,
  Credentials,
  EcommerceProvider,
  ListProductsQuery,
  ListProductsResult,
  NormalizedProduct,
  ProductImage,
  ProductUpdateFields,
} from "../types"
import { InvalidCredentialsError, ProductNotFoundError } from "../types"

// ============================================================================
// Section 9 Field List
// ============================================================================

/**
 * Every NormalizedProduct field from docs/RESEARCH.md section 9. Typed as
 * keys of the model so this list can never drift from types.ts.
 */
export const SECTION_9_FIELDS: readonly (keyof NormalizedProduct)[] = [
  "id",
  "name",
  "slug",
  "permalink",
  "type",
  "status",
  "description",
  "shortDescription",
  "sku",
  "price",
  "regularPrice",
  "salePrice",
  "onSale",
  "stockStatus",
  "stockQuantity",
  "categories",
  "tags",
  "featuredImage",
  "gallery",
  "attributes",
  "variantIds",
  "rating",
  "ratingCount",
  "lastModified",
]

// ============================================================================
// Raw Fixtures
// ============================================================================

/**
 * Raw platform payload shaped like a WooCommerce product JSON response.
 * Field names and value types intentionally match the Woo REST API so the
 * mapper exercises the same normalization the real adapter will need.
 */
export interface RawMockProduct {
  id: number
  name: string
  slug: string
  permalink: string
  type: string
  status: string
  description: string
  short_description: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  stock_status: string
  manage_stock: boolean
  stock_quantity: number | null
  categories: Array<{ id: number; name: string; slug: string }>
  tags: Array<{ id: number; name: string; slug: string }>
  images: Array<{ id: number; src: string; alt: string; position: number }>
  attributes: Array<{
    id: number
    name: string
    options: string[]
    variation: boolean
  }>
  variations: number[]
  average_rating: string
  rating_count: number
  date_modified: string
}

/**
 * The fixed fixture for the spec 001 AC2 property test. Every section 9
 * field has data on the platform side: sale pricing, managed stock, one
 * category, two tags, three images (position 0 is the featured one), one
 * attribute, three variants, and reviews.
 */
export const rawMockProduct: RawMockProduct = {
  id: 101,
  name: "Mock Canvas Tote",
  slug: "mock-canvas-tote",
  permalink: "https://store.example.com/product/mock-canvas-tote/",
  type: "variable",
  status: "publish",
  description: "<p>A sturdy canvas tote for everyday carry.</p>",
  short_description: "<p>Sturdy canvas tote.</p>",
  sku: "MCT-001",
  price: "16.99",
  regular_price: "21.99",
  sale_price: "16.99",
  on_sale: true,
  stock_status: "instock",
  manage_stock: true,
  stock_quantity: 14,
  categories: [{ id: 9, name: "Bags", slug: "bags" }],
  tags: [
    { id: 31, name: "canvas", slug: "canvas" },
    { id: 32, name: "summer", slug: "summer" },
  ],
  images: [
    {
      id: 501,
      src: "https://store.example.com/wp-content/tote.jpg",
      alt: "Canvas tote front",
      position: 0,
    },
    {
      id: 502,
      src: "https://store.example.com/wp-content/tote-back.jpg",
      alt: "Canvas tote back",
      position: 1,
    },
    {
      id: 503,
      src: "https://store.example.com/wp-content/tote-side.jpg",
      alt: "Canvas tote side",
      position: 2,
    },
  ],
  attributes: [
    { id: 1, name: "Color", options: ["Natural", "Black"], variation: false },
  ],
  variations: [201, 202, 203],
  average_rating: "4.5",
  rating_count: 27,
  date_modified: "2026-10-01T12:30:00",
}

/**
 * A second fixture without sale pricing and without managed stock, so the
 * mapper's null handling for salePrice, onSale, and stockQuantity is
 * covered by the opposite shape.
 */
export const rawSecondMockProduct: RawMockProduct = {
  ...rawMockProduct,
  id: 102,
  name: "Mock Canvas Tote, large",
  slug: "mock-canvas-tote-large",
  permalink: "https://store.example.com/product/mock-canvas-tote-large/",
  sku: "MCT-002",
  price: "24.99",
  regular_price: "24.99",
  sale_price: "",
  on_sale: false,
  stock_status: "outofstock",
  manage_stock: false,
  stock_quantity: null,
}

/**
 * Third store entry used only for pagination. A mini variant of the fixture
 * so the two-way provider's store holds three products across two pages.
 */
const rawThirdMockProduct: RawMockProduct = {
  ...rawMockProduct,
  id: 103,
  name: "Mock Canvas Tote, mini",
  slug: "mock-canvas-tote-mini",
  permalink: "https://store.example.com/product/mock-canvas-tote-mini/",
  sku: "MCT-003",
}

// ============================================================================
// Mapping Helpers
// ============================================================================

const PRODUCT_STATUSES = ["draft", "pending", "private", "publish"] as const
type ProductStatus = (typeof PRODUCT_STATUSES)[number]

const STOCK_STATUSES = ["instock", "outofstock", "onbackorder"] as const
type StockStatus = (typeof STOCK_STATUSES)[number]

/** Smallest page size the mock provider allows, exercising the clamp path. */
const MOCK_MAX_PAGE_SIZE = 2

const MOCK_CREDENTIAL_FIELDS: CredentialField[] = [
  {
    key: "mockToken",
    label: "Mock API token",
    type: "password",
    placeholder: "mock-token",
    helpText: "Any non-empty value passes validation in tests.",
    required: true,
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value)
}

function isStockStatus(value: string): value is StockStatus {
  return (STOCK_STATUSES as readonly string[]).includes(value)
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/**
 * Parse a platform money string into a number. Empty and missing values map
 * to null because the normalized model treats them as absent.
 */
function toMoneyOrNull(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Parse a platform numeric value that must end up as a plain number. */
function toNumberOrZero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  const parsed = toMoneyOrNull(value)
  if (parsed !== null) {
    return parsed
  }
  return 0
}

function toNormalizedImage(
  raw: unknown
): NormalizedProduct["featuredImage"] {
  if (!isRecord(raw)) {
    return null
  }
  return {
    id: String(raw.id ?? ""),
    url: toStringOrEmpty(raw.src),
    alt: toStringOrEmpty(raw.alt),
    position: toNumberOrZero(raw.position),
  }
}

/** Type guard so the gallery narrows to images only, never null holes. */
function isPresentImage(
  image: NormalizedProduct["featuredImage"]
): image is ProductImage {
  return image !== null
}

function toCategories(raw: unknown): NormalizedProduct["categories"] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.flatMap(function toCategory(candidate) {
    if (!isRecord(candidate)) {
      return []
    }
    return [
      {
        id: String(candidate.id ?? ""),
        name: toStringOrEmpty(candidate.name),
        slug: toStringOrEmpty(candidate.slug),
      },
    ]
  })
}

function toTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.flatMap(function toTagName(candidate) {
    if (!isRecord(candidate)) {
      return []
    }
    return [toStringOrEmpty(candidate.name)]
  })
}

function toAttributes(raw: unknown): NormalizedProduct["attributes"] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.flatMap(function toAttribute(candidate) {
    if (!isRecord(candidate)) {
      return []
    }
    return [
      {
        id: String(candidate.id ?? ""),
        name: toStringOrEmpty(candidate.name),
        options: Array.isArray(candidate.options)
          ? candidate.options.filter(function isString(option) {
              return typeof option === "string"
            })
          : [],
        isVariation: candidate.variation === true,
      },
    ]
  })
}

function toIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .filter(function isPresent(candidate) {
      return candidate !== undefined && candidate !== null
    })
    .map(function toId(candidate) {
      return String(candidate)
    })
}

// ============================================================================
// mapProduct
// ============================================================================

/**
 * Map a raw platform payload to the normalized model, the same contract
 * method every real provider must expose (spec 001 AC2).
 */
export function mapMockProduct(raw: unknown): NormalizedProduct {
  if (!isRecord(raw)) {
    throw new Error("The raw product payload must be an object.")
  }

  const regularPrice = toNumberOrZero(raw.regular_price)
  const salePrice = toMoneyOrNull(raw.sale_price)
  const price = toMoneyOrNull(raw.price) ?? regularPrice
  const images = Array.isArray(raw.images) ? raw.images : []

  const featuredImage = toNormalizedImage(
    images.find(function isFeatured(candidate) {
      return isRecord(candidate) && candidate.position === 0
    })
  )
  const gallery = images
    .filter(function isNotFeatured(candidate) {
      return isRecord(candidate) && candidate.position !== 0
    })
    .map(toNormalizedImage)
    .filter(isPresentImage)

  const rawStatus = toStringOrEmpty(raw.status)
  const status = isProductStatus(rawStatus) ? rawStatus : "draft"
  const rawStockStatus = toStringOrEmpty(raw.stock_status)
  const stockStatus = isStockStatus(rawStockStatus) ? rawStockStatus : "instock"

  return {
    id: String(raw.id ?? ""),
    name: toStringOrEmpty(raw.name),
    slug: toStringOrEmpty(raw.slug),
    permalink: toStringOrEmpty(raw.permalink),
    type: toStringOrEmpty(raw.type),
    status,
    description: toStringOrEmpty(raw.description),
    shortDescription: toStringOrEmpty(raw.short_description),
    sku: toStringOrEmpty(raw.sku),
    price,
    regularPrice,
    salePrice,
    onSale:
      raw.on_sale === true ||
      (salePrice !== null && salePrice < regularPrice),
    stockStatus,
    stockQuantity:
      raw.manage_stock === true && typeof raw.stock_quantity === "number"
        ? raw.stock_quantity
        : null,
    categories: toCategories(raw.categories),
    tags: toTags(raw.tags),
    featuredImage,
    gallery,
    attributes: toAttributes(raw.attributes),
    variantIds: toIdList(raw.variations),
    rating: toNumberOrZero(raw.average_rating),
    ratingCount: toNumberOrZero(raw.rating_count),
    lastModified: toStringOrEmpty(raw.date_modified),
  }
}

// ============================================================================
// Shared Contract Behavior
// ============================================================================

/** Both mock providers authenticate with a single token field. */
async function validateMockToken(
  providerId: string,
  credentials: Credentials
): Promise<void> {
  if (!credentials.mockToken) {
    throw new InvalidCredentialsError(providerId, "The mock token is missing.")
  }
}

/**
 * Shared paging logic so listProducts honors the resumable-by-page contract
 * (spec 001 "always answer these four"). Page size is clamped to the
 * provider maximum, exactly like the real WooCommerce per_page behavior.
 */
async function listFromStore(
  store: Map<string, NormalizedProduct>,
  providerId: string,
  credentials: Credentials,
  query?: ListProductsQuery
): Promise<ListProductsResult> {
  await validateMockToken(providerId, credentials)
  const all = Array.from(store.values())
  const perPage = Math.max(
    1,
    Math.min(query?.perPage ?? MOCK_MAX_PAGE_SIZE, MOCK_MAX_PAGE_SIZE)
  )
  const page = Math.max(1, query?.page ?? 1)
  const startIndex = (page - 1) * perPage
  return {
    products: all.slice(startIndex, startIndex + perPage).map(function copy(
      product
    ) {
      return { ...product }
    }),
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(all.length / perPage)),
    totalItems: all.length,
  }
}

/** Shared single-product read with the contract's typed not-found error. */
async function getProductFromStore(
  store: Map<string, NormalizedProduct>,
  providerId: string,
  credentials: Credentials,
  id: string
): Promise<NormalizedProduct> {
  await validateMockToken(providerId, credentials)
  const found = store.get(id)
  if (!found) {
    throw new ProductNotFoundError(providerId, id)
  }
  return { ...found }
}

// ============================================================================
// Two-Way Mock Provider
// ============================================================================

/**
 * Build a fresh two-way provider backed by its own in-memory store seeded
 * with three products (one per fixture). Each call returns an isolated
 * instance so write-path tests never share state.
 */
export function createMockTwoWayProvider(): EcommerceProvider<true> {
  const store = new Map<string, NormalizedProduct>()
  store.set("101", mapMockProduct(rawMockProduct))
  store.set("102", mapMockProduct(rawSecondMockProduct))
  store.set("103", mapMockProduct(rawThirdMockProduct))

  async function listProducts(
    credentials: Credentials,
    query?: ListProductsQuery
  ): Promise<ListProductsResult> {
    return listFromStore(store, "mock-commerce", credentials, query)
  }

  async function getProduct(
    credentials: Credentials,
    id: string
  ): Promise<NormalizedProduct> {
    return getProductFromStore(store, "mock-commerce", credentials, id)
  }

  /**
   * Apply only the requested fields and return the updated product. Copying
   * before writing means the store never exposes a partial object, which is
   * the same rail the real write path in spec 004 must follow.
   */
  async function updateProductFields(
    credentials: Credentials,
    id: string,
    fields: ProductUpdateFields
  ): Promise<NormalizedProduct> {
    await validateMockToken("mock-commerce", credentials)
    const current = store.get(id)
    if (!current) {
      throw new ProductNotFoundError("mock-commerce", id)
    }
    const updated: NormalizedProduct = { ...current, ...fields }
    store.set(id, updated)
    return { ...updated }
  }

  async function checkWriteAccess(): Promise<boolean> {
    return true
  }

  return {
    id: "mock-commerce",
    displayName: "Mock Commerce",
    capabilities: {
      supportsTwoWaySync: true,
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
      maxPageSize: MOCK_MAX_PAGE_SIZE,
    },
    credentialSchema: MOCK_CREDENTIAL_FIELDS,
    validateConnection: async function validateConnection(
      credentials: Credentials
    ): Promise<void> {
      await validateMockToken("mock-commerce", credentials)
    },
    listProducts,
    getProduct,
    updateProductFields,
    checkWriteAccess,
    mapProduct: mapMockProduct,
  }
}

/** Stable singleton for registry tests that do not write. */
export const mockTwoWayProvider = createMockTwoWayProvider()

// ============================================================================
// Read-Only Mock Provider
// ============================================================================

const readOnlyStore = new Map<string, NormalizedProduct>()
readOnlyStore.set("101", mapMockProduct(rawMockProduct))

/**
 * A provider that cannot write back: no updateProductFields method at all
 * and an empty writable field set. EcommerceProvider<false> declares
 * updateProductFields with type never, and no runtime value can satisfy a
 * required never property, so the object is built without the method and
 * then asserted to the final type. That assertion is the only way to
 * author a read-only provider under the current contract; the engine-side
 * compile-time gate is proven in providers.test-d.ts.
 */
const mockReadOnlyProviderBase: Omit<
  EcommerceProvider<false>,
  "updateProductFields"
> = {
  id: "mock-readonly",
  displayName: "Mock Read Only Commerce",
  capabilities: {
    supportsTwoWaySync: false,
    writableFields: [],
    supportsVariants: true,
    supportsCategories: true,
    supportsTags: true,
    supportsImages: true,
    maxPageSize: MOCK_MAX_PAGE_SIZE,
  },
  credentialSchema: MOCK_CREDENTIAL_FIELDS,
  validateConnection: async function validateConnection(
    credentials: Credentials
  ): Promise<void> {
    await validateMockToken("mock-readonly", credentials)
  },
  listProducts: async function listProducts(
    credentials: Credentials,
    query?: ListProductsQuery
  ): Promise<ListProductsResult> {
    return listFromStore(readOnlyStore, "mock-readonly", credentials, query)
  },
  getProduct: async function getProduct(
    credentials: Credentials,
    id: string
  ): Promise<NormalizedProduct> {
    return getProductFromStore(readOnlyStore, "mock-readonly", credentials, id)
  },
  mapProduct: mapMockProduct,
}

export const mockReadOnlyProvider: EcommerceProvider<false> =
  mockReadOnlyProviderBase as EcommerceProvider<false>
