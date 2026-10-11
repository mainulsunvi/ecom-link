/**
 * Type-level tests for spec 001 acceptance criterion 3: a provider whose
 * capabilities declare supportsTwoWaySync false must not offer
 * updateProductFields to the engine at compile time.
 *
 * This file matches the vitest typecheck include pattern (it ends in
 * .test-d.ts) and is verified by tsc during every pnpm test run. It is
 * never executed at runtime; the runtime half of the two-way contract is
 * covered in providers.test.ts.
 */

import { describe, expectTypeOf, it } from "vitest"
import type {
  Credentials,
  NormalizedProduct,
  ProductUpdateFields,
} from "../types"
import { getProvider } from "../registry"
import { wooCommerceProvider } from "../woocommerce"
import { createMockTwoWayProvider, mockReadOnlyProvider } from "./mockProvider"

describe("AC3: supportsTwoWaySync false rejects updateProductFields", () => {
  it("types updateProductFields as never on a read-only provider", () => {
    expectTypeOf(
      mockReadOnlyProvider.capabilities.supportsTwoWaySync
    ).toEqualTypeOf<false>()
    expectTypeOf(mockReadOnlyProvider.updateProductFields).toBeNever()

    // The engine cannot call the method. The directive below proves the
    // call is a compile error: if it ever stops erroring, the unused
    // directive itself fails typechecking.
    // @ts-expect-error updateProductFields is not callable on a provider without two-way sync support.
    mockReadOnlyProvider.updateProductFields({}, "101", {})
  })

  it("exposes the full update signature on a two-way provider", () => {
    const provider = createMockTwoWayProvider()
    expectTypeOf(
      provider.capabilities.supportsTwoWaySync
    ).toEqualTypeOf<true>()
    expectTypeOf(provider.updateProductFields).toBeFunction()
    expectTypeOf(provider.updateProductFields)
      .parameter(0)
      .toEqualTypeOf<Credentials>()
    expectTypeOf(provider.updateProductFields)
      .parameter(1)
      .toEqualTypeOf<string>()
    expectTypeOf(provider.updateProductFields)
      .parameter(2)
      .toEqualTypeOf<ProductUpdateFields>()
    expectTypeOf(provider.updateProductFields)
      .returns.toEqualTypeOf<Promise<NormalizedProduct>>()
  })

  it("declares two-way support on the v1 WooCommerce provider", () => {
    expectTypeOf(
      wooCommerceProvider.capabilities.supportsTwoWaySync
    ).toEqualTypeOf<true>()
    expectTypeOf(wooCommerceProvider.updateProductFields).toBeFunction()
  })

  it("keeps registry lookups callable and guardable at runtime", () => {
    // getProvider returns EcommerceProvider<boolean>. The conditional type
    // distributes over the boolean union, so the method stays callable and
    // the engine guards with the runtime capability flag before writing.
    const provider = getProvider("woocommerce")
    expectTypeOf(
      provider.capabilities.supportsTwoWaySync
    ).toEqualTypeOf<boolean>()
    expectTypeOf(provider.updateProductFields).toBeFunction()
  })
})
