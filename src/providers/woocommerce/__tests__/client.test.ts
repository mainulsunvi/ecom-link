/**
 * Tests for the WooCommerce REST client: typed error classification,
 * retry with backoff, auth transport, and the CORS preflight probe
 * (spec 002 acceptance criteria 2, 3, 4, and 7).
 */

import { afterEach, expect, it, describe, vi } from "vitest"
import {
  AuthError,
  CorsError,
  NotWooError,
  TransientError,
  checkWriteAccess,
  validateConnection,
} from "../client"
import { RateLimitError } from "../../types"

const credentials = {
  storeUrl: "https://store.example.com",
  consumerKey: "ck_abcdef1234567890",
  consumerSecret: "cs_abcdef1234567890",
}

function instantSleep(): Promise<void> {
  return Promise.resolve()
}

function jsonResponse(status = 200): Response {
  return new Response("[]", {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function htmlResponse(status = 200): Response {
  return new Response("<html></html>", {
    status,
    headers: { "Content-Type": "text/html" },
  })
}

afterEach(function restoreFetch() {
  vi.unstubAllGlobals()
})

describe("validateConnection", () => {
  it("resolves when the store answers with JSON", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200))
    vi.stubGlobal("fetch", fetchMock)
    await expect(
      validateConnection(credentials, { sleepFn: instantSleep })
    ).resolves.toBeUndefined()
  })

  it("throws AuthError with the research sentence on 401", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(401))
    vi.stubGlobal("fetch", fetchMock)
    const attempt = validateConnection(credentials, { sleepFn: instantSleep })
    await expect(attempt).rejects.toBeInstanceOf(AuthError)
    await expect(attempt).rejects.toThrow(
      "The connection failed. Check that your consumer key and secret are correct and have read access."
    )
  })

  it("throws AuthError on 403 as well", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(403))
    vi.stubGlobal("fetch", fetchMock)
    await expect(
      validateConnection(credentials, { sleepFn: instantSleep })
    ).rejects.toBeInstanceOf(AuthError)
  })

  it("throws NotWooError with the research sentence on 404", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(404))
    vi.stubGlobal("fetch", fetchMock)
    const attempt = validateConnection(credentials, { sleepFn: instantSleep })
    await expect(attempt).rejects.toBeInstanceOf(NotWooError)
    await expect(attempt).rejects.toThrow(
      "This does not look like a WooCommerce REST API endpoint. Check the store URL."
    )
  })

  it("throws NotWooError when a 200 response is HTML, not the REST API", async () => {
    const fetchMock = vi.fn(async () => htmlResponse(200))
    vi.stubGlobal("fetch", fetchMock)
    await expect(
      validateConnection(credentials, { sleepFn: instantSleep })
    ).rejects.toBeInstanceOf(NotWooError)
  })

  it("throws CorsError when fetch rejects with a TypeError", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("Failed to fetch")
    })
    vi.stubGlobal("fetch", fetchMock)
    const attempt = validateConnection(credentials, { sleepFn: instantSleep })
    await expect(attempt).rejects.toBeInstanceOf(CorsError)
    await expect(attempt).rejects.toThrow(
      "The browser blocked the connection to your store."
    )
  })

  it("retries a 429 with backoff and succeeds on the second attempt", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse(429))
      .mockResolvedValueOnce(jsonResponse(200))
    vi.stubGlobal("fetch", fetchMock)
    await expect(
      validateConnection(credentials, { sleepFn: instantSleep })
    ).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("throws RateLimitError after three 429 responses", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(429))
    vi.stubGlobal("fetch", fetchMock)
    await expect(
      validateConnection(credentials, { sleepFn: instantSleep })
    ).rejects.toBeInstanceOf(RateLimitError)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("throws TransientError after three 5xx responses", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(500))
    vi.stubGlobal("fetch", fetchMock)
    await expect(
      validateConnection(credentials, { sleepFn: instantSleep })
    ).rejects.toBeInstanceOf(TransientError)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("sends Basic auth and never puts secrets in the URL", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200))
    vi.stubGlobal("fetch", fetchMock)
    await validateConnection(credentials, { sleepFn: instantSleep })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(String(url)).not.toContain("consumer_key")
    expect(String(url)).not.toContain("consumer_secret")
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toMatch(/^Basic /)
  })
})

describe("checkWriteAccess", () => {
  it("returns true when the store answers the preflight", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200))
    vi.stubGlobal("fetch", fetchMock)
    await expect(checkWriteAccess(credentials)).resolves.toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(String(url)).toContain("/wp-json/wc/v3/products")
    expect(init.method).toBe("OPTIONS")
  })

  it("returns false when the preflight is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403)))
    await expect(checkWriteAccess(credentials)).resolves.toBe(false)
  })

  it("returns false when the preflight is blocked by the browser", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch")
      })
    )
    await expect(checkWriteAccess(credentials)).resolves.toBe(false)
  })
})
