# Spec 002: Store Connection Manager and CORS Helper

Status: MVP. Features: `docs/FEATURES.md` M2, M5.

## 1. Problem statement

The merchant must connect their WooCommerce store from inside the plugin with a store URL and REST API keys, get clear validation feedback, and keep credentials project-scoped. Because WooCommerce sends no CORS headers, validation must also detect CORS failure and guide the merchant to the companion WordPress plugin or a host fix.

## 2. Data model decision

Amended 2026-10-03 after API verification: `@framer/plugin` v4 exposes no plugin-scoped storage (`docs/API-NOTES.md`), so connections live as items in a dedicated internal CMS collection named "Ecom-Link Internal", one item per connection. This amends architecture D5.

Collection fields: `name` (store host, for CMS display), `provider_id`, `store_url` (normalized, HTTPS enforced), `consumer_key`, `consumer_secret`, `key_scope`, `companion_plugin_url`, `validation_state`, `last_validated_at`, `is_active`.

Multiple connections are stored with exactly one active at a time (user directive 2026-10-03; a thin storage-level slice of F7 pulled into M2 so the dashboard can offer "Set active").

```ts
interface ConnectionRecord {          // what views receive: masks only
  id: string;                        // CMS item id
  providerId: string;                // "woocommerce" in v1
  storeUrl: string;                  // normalized, HTTPS enforced
  storeHost: string;                 // derived, for display
  consumerKeyMasked: string;         // "ck_••••1234", display only
  consumerSecretMasked: string;
  keyScope: "read" | "read_write";
  companionPluginUrl: string | null; // set when CORS helper is installed
  validationState: "unvalidated" | "valid" | "invalid";
  lastValidatedAt: string | null;    // ISO
  isActive: boolean;
}
```

Read path: views call `listConnections()` / `getActiveConnection()` and receive masked records only. Write path: `saveConnection(input)` normalizes the URL, checks key prefixes, validates through the provider contract, then upserts the item and returns the masked record. `deleteConnection(id)` deletes the item, clearing credentials and the companion URL. `revalidateConnection(id)` re-runs validation and stores the outcome. Full secrets leave the storage layer only as Basic auth headers to the store's own endpoint.

Security posture (Security review required): values inside the internal collection are readable by anyone with CMS access to the project. This is accepted for the free MVP per `docs/API-NOTES.md`, masked everywhere in the plugin UI, and removed on disconnect.

## 3. Platform API operations

- `GET {storeUrl}/wp-json/wc/v3/products?per_page=1` with Basic auth: validation probe (1 request).
- CORS preflight probe: an `OPTIONS` fetch to the same URL. Cost is 1 request; runs only when two-way sync is enabled or validation fails with a network TypeError.

## 4. Credentials required

`read` scope keys for one-way sync. `read_write` only when two-way sync is enabled (spec 004). Key format checks: `ck_`/`cs_` prefixes. No `framer.json` change.

## 5. Triggers consumed

User actions only: "Connect store", "Revalidate", "Disconnect". No webhooks.

## 6. File-by-file change list

- `src/storage/connections.ts`: CMS-backed save, masked list/get, activate, revalidate, delete, new.
- `src/providers/woocommerce/client.ts`: `validateConnection`, probe with typed errors (`AuthError`, `NotWooError`, `CorsError`), retry with backoff, `OPTIONS` preflight probe, new.
- `src/providers/types.ts`: optional `checkWriteAccess(credentials)` on the provider contract, extend.
- `src/providers/woocommerce/index.ts`: provider registration with validation and preflight wired; product methods throw a clear "not available yet" error until spec 003, new.
- `src/views/ConnectionModal.tsx`: URL + key form, validation feedback, companion plugin guidance, new.
- `src/components/connection/CredentialFields.tsx`: reusable masked inputs, new.
- `src/components/ui/Switch.tsx`: reusable Switch (boolean toggle rule), new.
- `src/components/ui/HelpTooltip.tsx`: shared info icon + tooltip, new.
- `src/components/ui/Modal.tsx`: reusable modal shell (Title Case titles, Escape and overlay close), new.
- `src/components/ui/Field.tsx`: labeled input with one-sentence helpText and error, new.
- `src/views/Dashboard.tsx`: connection list, active connection card, empty state, new (shell).
- `src/App.tsx`: dashboard shell + modal state, extend.
- `docs/help/Getting Started.md`, `docs/help/Connections.md`: new, same run.

## 7. Acceptance criteria

1. Given a URL without protocol, normalization adds `https://`; given an `http://` URL (not localhost), saving is blocked with the sentence "Store addresses must use HTTPS."
2. Given 401/403 from the probe, the UI shows "The connection failed. Check that your consumer key and secret are correct and have read access." and no connection is saved.
3. Given a non-WooCommerce URL (404 or HTML response), the UI shows "This does not look like a WooCommerce REST API endpoint. Check the store URL."
4. Given a network TypeError (CORS), the UI shows the CORS explanation and the companion plugin step, with a retry button.
5. Given a saved connection, `getConnection()` returns masked keys only; a grep test asserts full secrets never appear in view-layer return types.
6. Given "Disconnect", credentials and companion URL are cleared and a confirmation flow offers optional cleanup (deferred to spec 003 report).
7. Given two-way sync enabled and a failed `OPTIONS` preflight, the UI reports that write-back is blocked and links to the companion plugin instructions.
8. All error strings in this flow pass the UX writing rules test: no em-dashes, no raw enums, sentence-case buttons, Title Case headings.
9. Given two saved connections, "Set active" switches which one the dashboard treats as active, and exactly one connection is active at any time.

## 8. Open questions

- Can the companion WordPress plugin be auto-detected (a HEAD probe to its URL), or must the merchant paste its path? Assume paste in v1.
- ~~Exact plugin-data encryption approach depends on what `@framer/plugin` v4 exposes for secrets.~~ Resolved 2026-10-03: no secrets or plugin-data API exists in v4. Credentials are stored in the internal CMS collection, masked in every read path, with the CMS-visibility limitation documented and Security-reviewed. Revisit if Framer ships plugin-scoped storage.

## Always answer these four

- **Removed then re-added plugin**: plugin data is lost with removal; the merchant reconnects and the CMS collection still holds synced items keyed by `woo_id`, so a re-import updates in place instead of duplicating.
- **Framer plan limit mid-sync**: validation only fetches 1 product; no limit risk in this flow.
- **Partial sync failure and retry**: validation is a single probe; retry is the button. Transient 429/5xx retried with backoff (max 3) inside the client before surfacing.
- **Unusually large catalog**: the probe uses `per_page=1` regardless of catalog size; catalog-size handling lives in spec 003.
