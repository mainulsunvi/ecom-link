# Spec 002: Store Connection Manager and CORS Helper

Status: MVP. Features: `docs/FEATURES.md` M2, M5.

## 1. Problem statement

The merchant must connect their WooCommerce store from inside the plugin with a store URL and REST API keys, get clear validation feedback, and keep credentials project-scoped. Because WooCommerce sends no CORS headers, validation must also detect CORS failure and guide the merchant to the companion WordPress plugin or a host fix.

## 2. Data model decision

Connections live in plugin data (per project), never in CMS fields, per architecture D5.

```ts
interface ConnectionRecord {
  providerId: string;            // "woocommerce" in v1
  storeUrl: string;              // normalized, HTTPS enforced
  consumerKeyMasked: string;     // "ck_••••1234", display only
  consumerSecretMasked: string;
  keyScope: "read" | "read_write";
  companionPluginUrl: string | null;  // set when CORS helper is installed
  validationState: "unvalidated" | "valid" | "invalid";
  lastValidatedAt: string | null;     // ISO
}
```

Full secrets are stored encrypted in plugin data via the storage layer; masked values are the only thing views ever receive. Read path: views read `getConnection()` returning masks only. Write path: `saveConnection(input)` validates, stores, and returns the mask record; `disconnect()` clears everything.

## 3. Platform API operations

- `GET {storeUrl}/wp-json/wc/v3/products?per_page=1` with Basic auth: validation probe (1 request).
- CORS preflight probe: an `OPTIONS` fetch to the same URL. Cost is 1 request; runs only when two-way sync is enabled or validation fails with a network TypeError.

## 4. Credentials required

`read` scope keys for one-way sync. `read_write` only when two-way sync is enabled (spec 004). Key format checks: `ck_`/`cs_` prefixes. No `framer.json` change.

## 5. Triggers consumed

User actions only: "Connect store", "Revalidate", "Disconnect". No webhooks.

## 6. File-by-file change list

- `src/storage/connections.ts`: save, get (masked), clear, new.
- `src/providers/woocommerce/client.ts`: `validateConnection`, probe with typed errors (`AuthError`, `NotWooError`, `CorsError`), new.
- `src/views/ConnectionModal.tsx`: URL + key form, validation feedback, companion plugin guidance, new.
- `src/components/connection/CredentialFields.tsx`: reusable masked inputs, new.
- `src/components/ui/Switch.tsx`: reusable Switch (boolean toggle rule), new.
- `src/components/ui/HelpTooltip.tsx`: shared info icon + tooltip, new.
- `src/views/Dashboard.tsx`: connection status card, new (shell).

## 7. Acceptance criteria

1. Given a URL without protocol, normalization adds `https://`; given an `http://` URL (not localhost), saving is blocked with the sentence "Store addresses must use HTTPS."
2. Given 401/403 from the probe, the UI shows "The connection failed. Check that your consumer key and secret are correct and have read access." and no connection is saved.
3. Given a non-WooCommerce URL (404 or HTML response), the UI shows "This does not look like a WooCommerce REST API endpoint. Check the store URL."
4. Given a network TypeError (CORS), the UI shows the CORS explanation and the companion plugin step, with a retry button.
5. Given a saved connection, `getConnection()` returns masked keys only; a grep test asserts full secrets never appear in view-layer return types.
6. Given "Disconnect", credentials and companion URL are cleared and a confirmation flow offers optional cleanup (deferred to spec 003 report).
7. Given two-way sync enabled and a failed `OPTIONS` preflight, the UI reports that write-back is blocked and links to the companion plugin instructions.
8. All error strings in this flow pass the UX writing rules test: no em-dashes, no raw enums, sentence-case buttons, Title Case headings.

## 8. Open questions

- Can the companion WordPress plugin be auto-detected (a HEAD probe to its URL), or must the merchant paste its path? Assume paste in v1.
- Exact plugin-data encryption approach depends on what `@framer/plugin` v4 exposes for secrets; if nothing exists, store plainly but never expose outside plugin data and flag for Security review.

## Always answer these four

- **Removed then re-added plugin**: plugin data is lost with removal; the merchant reconnects and the CMS collection still holds synced items keyed by `woo_id`, so a re-import updates in place instead of duplicating.
- **Framer plan limit mid-sync**: validation only fetches 1 product; no limit risk in this flow.
- **Partial sync failure and retry**: validation is a single probe; retry is the button. Transient 429/5xx retried with backoff (max 3) inside the client before surfacing.
- **Unusually large catalog**: the probe uses `per_page=1` regardless of catalog size; catalog-size handling lives in spec 003.
