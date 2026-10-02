/**
 * WooCommerce REST Client: Connection Validation And CORS Detection
 *
 * The plugin talks to WooCommerce directly from the browser (architecture D1).
 * WooCommerce does not send CORS headers, so a plain store will reject browser
 * requests. That rejection surfaces as a TypeError from fetch, and this client
 * translates it into a CorsError that carries companion plugin guidance
 * (spec 002, feature M5).
 *
 * Conventions: function declarations only (INSTRUCTION.md section 5). Error
 * messages are full user-facing sentences (section 7). Raw error codes never
 * appear in the UI.
 */

import { ProviderError, RateLimitError, type Credentials } from "../types"

// ============================================================================
// Typed Connection Errors
// ============================================================================

/**
 * 401 or 403 from the probe: the keys are wrong or lack read permission.
 * Message comes verbatim from the research error matrix (section 6.4).
 */
export class AuthError extends ProviderError {
  constructor() {
    super(
      "The connection failed. Check that your consumer key and secret are correct and have read access.",
      "AUTH_FAILED",
      "woocommerce"
    )
    this.name = "AuthError"
  }
}

/**
 * 404 or a non-JSON response: the URL is not a WooCommerce REST API endpoint.
 */
export class NotWooError extends ProviderError {
  constructor() {
    super(
      "This does not look like a WooCommerce REST API endpoint. Check the store URL.",
      "NOT_WOOCOMMERCE",
      "woocommerce"
    )
    this.name = "NotWooError"
  }
}

/**
 * Network TypeError: the browser blocked the request (CORS) before it reached
 * the store. The message guides the merchant to the companion WordPress plugin
 * or a host-side origin fix.
 */
export class CorsError extends ProviderError {
  constructor() {
    super(
      "The browser blocked the connection to your store. WooCommerce does not allow direct browser requests by default. Install the free companion plugin on your store, or ask your host to allow requests from Framer, then try again.",
      "CORS_BLOCKED",
      "woocommerce"
    )
    this.name = "CorsError"
  }
}

/**
 * 5xx responses that exhausted every retry attempt.
 */
export class TransientError extends ProviderError {
  constructor() {
    super(
      "The store could not be reached. Check that your store is online, then try again.",
      "TRANSIENT",
      "woocommerce"
    )
    this.name = "TransientError"
  }
}

// ============================================================================
// Retry With Backoff
// ============================================================================

/** Options for retry behavior. Both exist so tests can run without delays. */
export interface RetryOptions {
  /** Injectable sleep function so tests can skip real backoff waits. */
  sleepFn?: (ms: number) => Promise<void>
  /** Total attempts including the first one. Spec cap: 3. */
  maxAttempts?: number
}

const DEFAULT_MAX_ATTEMPTS = 3

function defaultSleep(ms: number): Promise<void> {
  return new Promise(function resolveLater(resolve) {
    setTimeout(resolve, ms)
  })
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

/**
 * Fetch with exponential backoff on 429 and 5xx (research section 6.4).
 * Retries at most the configured number of attempts, then throws
 * RateLimitError (429) or TransientError (5xx). Non-retryable responses
 * return as-is so the caller can classify them. Fetch rejections propagate
 * untouched; the caller decides whether they mean CORS.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const sleepFn = options.sleepFn ?? defaultSleep
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  let attempt = 1
  for (;;) {
    const response = await fetch(url, init)
    if (!isRetryableStatus(response.status)) {
      return response
    }
    if (attempt >= maxAttempts) {
      if (response.status === 429) {
        const retryAfterSeconds = Number(response.headers.get("Retry-After"))
        const retryAfter =
          Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds
            : undefined
        throw new RateLimitError("woocommerce", retryAfter)
      }
      throw new TransientError()
    }
    // Prefer the server's Retry-After hint over our own backoff when present.
    const retryAfterHeader = Number(response.headers.get("Retry-After"))
    const backoffMs = 1000 * Math.pow(2, attempt - 1)
    const waitMs =
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : backoffMs
    await sleepFn(waitMs)
    attempt += 1
  }
}

// ============================================================================
// Auth
// ============================================================================

/**
 * Basic auth header from the consumer key and secret. Query-string auth is
 * never used because it leaks secrets into URLs and server logs (research
 * section 11.1).
 */
export function toBasicAuthHeader(
  consumerKey: string,
  consumerSecret: string
): string {
  return `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

// ============================================================================
// Validation Probe And Preflight
// ============================================================================

/**
 * Validate a connection with one cheap request (spec 002 section 3):
 * GET {storeUrl}/wp-json/wc/v3/products?per_page=1 with Basic auth.
 *
 * Throws AuthError (401/403), NotWooError (404 or HTML), CorsError (network
 * TypeError), RateLimitError (429 after retries), or TransientError (5xx
 * after retries). Resolves when the store answers with JSON.
 */
export async function validateConnection(
  credentials: Credentials,
  options: RetryOptions = {}
): Promise<void> {
  const storeUrl = stripTrailingSlash(String(credentials.storeUrl ?? ""))
  if (storeUrl === "") {
    // An empty URL is a wrong-URL case, not worth a separate error type.
    throw new NotWooError()
  }
  const probeUrl = `${storeUrl}/wp-json/wc/v3/products?per_page=1`
  const init: RequestInit = {
    method: "GET",
    headers: {
      Authorization: toBasicAuthHeader(
        String(credentials.consumerKey ?? ""),
        String(credentials.consumerSecret ?? "")
      ),
    },
  }
  let response: Response
  try {
    response = await fetchWithRetry(probeUrl, init, options)
  } catch (error) {
    // A blocked or failed network call rejects with a TypeError in browsers.
    if (error instanceof TypeError) {
      throw new CorsError()
    }
    throw error
  }
  if (response.status === 401 || response.status === 403) {
    throw new AuthError()
  }
  const contentType = response.headers.get("Content-Type") ?? ""
  if (response.status === 404 || !contentType.toLowerCase().includes("json")) {
    throw new NotWooError()
  }
}

/**
 * CORS preflight probe for write-back (M5): an OPTIONS request to the
 * products endpoint. Returns true only when the store answers the preflight
 * successfully, which means browser PUT and POST requests can proceed.
 */
export async function checkWriteAccess(
  credentials: Credentials
): Promise<boolean> {
  const storeUrl = stripTrailingSlash(String(credentials.storeUrl ?? ""))
  if (storeUrl === "") {
    return false
  }
  const preflightUrl = `${storeUrl}/wp-json/wc/v3/products`
  try {
    const response = await fetch(preflightUrl, { method: "OPTIONS" })
    return response.ok
  } catch {
    return false
  }
}
