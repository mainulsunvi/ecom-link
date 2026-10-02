/**
 * Tests for connection storage: URL normalization, masking, key format
 * checks, CMS-backed CRUD, validation gating, active switching, and
 * disconnect cleanup (spec 002 acceptance criteria 1, 2, 4, 5, 6, and 9).
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

// The Framer CMS API is faked in memory so storage tests run anywhere.
const { fakeCms, resetFakeCms } = vi.hoisted(() => {
  interface FakeCollection {
    id: string
    name: string
  }
  interface FakeItem {
    id: string
    fieldData: Record<string, { type: string; value: unknown }>
  }

  function createState() {
    return {
      collections: [] as FakeCollection[],
      fields: new Map<string, Array<{ id: string; name: string; type: string }>>(),
      items: new Map<string, FakeItem[]>(),
      nextCollectionId: 1,
      nextFieldId: 1,
      nextItemId: 1,
    }
  }

  let state = createState()

  function reset() {
    state = createState()
  }

  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
  }

  const fakeCms = {
    async getCollections() {
      return clone(state.collections)
    },
    async createCollection(data: { name: string }) {
      const collection = {
        id: `col-${state.nextCollectionId}`,
        name: data.name,
      }
      state.nextCollectionId += 1
      state.collections.push(collection)
      state.fields.set(collection.id, [])
      state.items.set(collection.id, [])
      return clone(collection)
    },
    async getFields(collectionId: string) {
      return clone(state.fields.get(collectionId) ?? [])
    },
    async createField(
      collectionId: string,
      data: { name: string; type: string }
    ) {
      const field = {
        id: `field-${state.nextFieldId}`,
        name: data.name,
        type: data.type,
      }
      state.nextFieldId += 1
      state.fields.get(collectionId)?.push(field)
      return clone(field)
    },
    async getItems(collectionId: string) {
      return clone(state.items.get(collectionId) ?? [])
    },
    async createItem(
      collectionId: string,
      data: { fieldData: FakeItem["fieldData"] }
    ) {
      const item = {
        id: `item-${state.nextItemId}`,
        fieldData: clone(data.fieldData),
      }
      state.nextItemId += 1
      state.items.get(collectionId)?.push(item)
      return clone(item)
    },
    async updateItem(
      collectionId: string,
      itemId: string,
      data: { fieldData: FakeItem["fieldData"] }
    ) {
      const list = state.items.get(collectionId) ?? []
      const item = list.find(function hasId(entry) {
        return entry.id === itemId
      })
      if (!item) {
        throw new Error(`Item ${itemId} not found`)
      }
      for (const [name, entry] of Object.entries(data.fieldData)) {
        item.fieldData[name] = clone(entry)
      }
      return clone(item)
    },
    async deleteItem(collectionId: string, itemId: string) {
      const list = state.items.get(collectionId)
      if (!list) {
        return
      }
      const index = list.findIndex(function hasId(entry) {
        return entry.id === itemId
      })
      if (index >= 0) {
        list.splice(index, 1)
      }
    },
  }

  return { fakeCms, resetFakeCms: reset }
})

vi.mock("@framer/plugin", () => ({ framer: fakeCms }))

import { clearProviders, registerProvider } from "../../providers"
import { AuthError } from "../../providers"
import type { EcommerceProvider } from "../../providers"
import {
  ConnectionValidationError,
  deleteConnection,
  getActiveConnection,
  listConnections,
  maskSecret,
  normalizeStoreUrl,
  revalidateConnection,
  saveConnection,
  setActiveConnection,
  validateKeyFormat,
  type SaveConnectionInput,
} from "../connections"

// Fake provider behavior, controlled per test.
const providerState = {
  fail: null as Error | null,
  writeAccess: true,
}
let lastCredentials: Record<string, string> | null = null

const fakeProvider: EcommerceProvider<true> = {
  id: "woocommerce",
  displayName: "WooCommerce (test)",
  capabilities: {
    supportsTwoWaySync: true,
    writableFields: [],
    supportsVariants: false,
    supportsCategories: false,
    supportsTags: false,
    supportsImages: false,
    maxPageSize: 100,
  },
  credentialSchema: [],
  async validateConnection(credentials) {
    lastCredentials = { ...credentials }
    if (providerState.fail) {
      throw providerState.fail
    }
  },
  async listProducts() {
    throw new Error("not used in this suite")
  },
  async getProduct() {
    throw new Error("not used in this suite")
  },
  async updateProductFields() {
    throw new Error("not used in this suite")
  },
  mapProduct(): never {
    throw new Error("not used in this suite")
  },
  async checkWriteAccess() {
    return providerState.writeAccess
  },
}

beforeEach(function resetWorld() {
  resetFakeCms()
  providerState.fail = null
  providerState.writeAccess = true
  lastCredentials = null
  clearProviders()
  registerProvider(fakeProvider)
})

function validInput(): SaveConnectionInput {
  return {
    providerId: "woocommerce",
    storeUrl: "https://store.example.com",
    consumerKey: "ck_abcdef12345678",
    consumerSecret: "cs_abcdef12345678",
    keyScope: "read",
  }
}

describe("normalizeStoreUrl", () => {
  it("adds https when the protocol is missing", () => {
    expect(normalizeStoreUrl("store.example.com")).toEqual({
      ok: true,
      url: "https://store.example.com",
    })
  })

  it("blocks plain http outside localhost with the exact sentence", () => {
    expect(normalizeStoreUrl("http://store.example.com")).toEqual({
      ok: false,
      message: "Store addresses must use HTTPS.",
    })
  })

  it("allows http for localhost development", () => {
    expect(normalizeStoreUrl("http://localhost:8080")).toEqual({
      ok: true,
      url: "http://localhost:8080",
    })
  })

  it("strips trailing slashes", () => {
    expect(normalizeStoreUrl("https://store.example.com/")).toEqual({
      ok: true,
      url: "https://store.example.com",
    })
  })

  it("strips a pasted wp-json base", () => {
    expect(normalizeStoreUrl("https://store.example.com/wp-json")).toEqual({
      ok: true,
      url: "https://store.example.com",
    })
  })

  it("rejects garbage with a helpful sentence", () => {
    expect(normalizeStoreUrl("not a url")).toEqual({
      ok: false,
      message:
        "Enter a valid store address, such as https://store.example.com.",
    })
  })
})

describe("maskSecret", () => {
  it("keeps the prefix and the last four characters", () => {
    expect(maskSecret("ck_abcd12345678")).toBe("ck_\u2022\u2022\u2022\u20225678")
  })

  it("masks short secrets without a tail", () => {
    expect(maskSecret("cs_1234")).toBe("cs_\u2022\u2022\u2022\u2022")
  })
})

describe("validateKeyFormat", () => {
  it("accepts ck_ and cs_ prefixes", () => {
    expect(validateKeyFormat("ck_abc", "cs_abc")).toEqual({
      ok: true,
      message: null,
    })
  })

  it("rejects anything else with one sentence", () => {
    expect(validateKeyFormat("bad_abc", "cs_abc")).toEqual({
      ok: false,
      message:
        "Consumer keys start with ck_ and secrets start with cs_. Check the keys you generated in WooCommerce.",
    })
  })
})

describe("saveConnection", () => {
  it("saves and returns a masked record only (AC5)", async () => {
    const record = await saveConnection(validInput())
    expect(record.consumerKeyMasked).toBe("ck_\u2022\u2022\u2022\u20225678")
    const serialized = JSON.stringify(await listConnections())
    expect(serialized).not.toContain("ck_abcdef12345678")
    expect(serialized).not.toContain("cs_abcdef12345678")
  })

  it("creates the internal collection with the full field schema", async () => {
    await saveConnection(validInput())
    const collections = await fakeCms.getCollections()
    const internal = collections.find(
      function hasName(collection) {
        return collection.name === "Ecom-Link Internal"
      }
    )
    expect(internal).toBeDefined()
    const fields = await fakeCms.getFields(internal!.id)
    const names = fields.map(function nameOf(field) {
      return field.name
    })
    expect(names).toEqual(
      expect.arrayContaining([
        "provider_id",
        "store_url",
        "consumer_key",
        "consumer_secret",
        "key_scope",
        "companion_plugin_url",
        "validation_state",
        "last_validated_at",
        "is_active",
      ])
    )
  })

  it("blocks http saves before any validation call (AC1)", async () => {
    const input = { ...validInput(), storeUrl: "http://store.example.com" }
    await expect(saveConnection(input)).rejects.toBeInstanceOf(
      ConnectionValidationError
    )
    expect(lastCredentials).toBeNull()
    expect(await listConnections()).toEqual([])
  })

  it("saves nothing when the store rejects the keys (AC2)", async () => {
    providerState.fail = new AuthError()
    await expect(saveConnection(validInput())).rejects.toBeInstanceOf(AuthError)
    expect(await listConnections()).toEqual([])
  })

  it("rejects wrong key prefixes before any network call", async () => {
    const input = { ...validInput(), consumerKey: "bad_prefix1234" }
    await expect(saveConnection(input)).rejects.toBeInstanceOf(
      ConnectionValidationError
    )
    expect(lastCredentials).toBeNull()
    expect(await listConnections()).toEqual([])
  })

  it("keeps stored secrets when editing with blank values", async () => {
    const created = await saveConnection(validInput())
    const edited = await saveConnection({
      id: created.id,
      providerId: "woocommerce",
      storeUrl: "https://renamed.example.com",
      consumerKey: "",
      consumerSecret: "",
      keyScope: "read",
    })
    expect(edited.storeUrl).toBe("https://renamed.example.com")
    // The validation call reused the stored secrets, not blanks.
    expect(lastCredentials?.consumerKey).toBe("ck_abcdef12345678")
    const collections = await fakeCms.getCollections()
    const items = await fakeCms.getItems(collections[0].id)
    expect(items[0].fieldData.consumer_key.value).toBe("ck_abcdef12345678")
  })
})

describe("multiple connections", () => {
  it("activates the first connection and switches on demand (AC9)", async () => {
    const first = await saveConnection(validInput())
    const second = await saveConnection({
      ...validInput(),
      storeUrl: "https://second.example.com",
    })
    expect(first.isActive).toBe(true)
    expect(second.isActive).toBe(false)
    await setActiveConnection(second.id)
    const active = await getActiveConnection()
    expect(active?.id).toBe(second.id)
    const all = await listConnections()
    const activeCount = all.filter(function isActive(connection) {
      return connection.isActive
    }).length
    expect(activeCount).toBe(1)
  })

  it("delete clears the record and promotes the next connection (AC6)", async () => {
    await saveConnection(validInput())
    const second = await saveConnection({
      ...validInput(),
      storeUrl: "https://second.example.com",
      companionPluginUrl: "https://bridge.example.com",
    })
    await setActiveConnection(second.id)
    await deleteConnection(second.id)
    const remaining = await listConnections()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].isActive).toBe(true)
    expect(remaining[0].storeHost).toBe("store.example.com")
    const collections = await fakeCms.getCollections()
    const items = await fakeCms.getItems(collections[0].id)
    const serialized = JSON.stringify(items)
    expect(serialized).not.toContain("bridge.example.com")
    expect(serialized).not.toContain("cs_abcdef12345678")
  })
})

describe("revalidateConnection", () => {
  it("records a valid state on success and invalid on failure", async () => {
    const created = await saveConnection(validInput())
    const valid = await revalidateConnection(created.id)
    expect(valid.validationState).toBe("valid")

    providerState.fail = new AuthError()
    await expect(revalidateConnection(created.id)).rejects.toBeInstanceOf(
      AuthError
    )
    const all = await listConnections()
    expect(all[0].validationState).toBe("invalid")
    expect(all[0].lastValidatedAt).not.toBeNull()
  })
})
