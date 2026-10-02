# Spec F02: Managed Proxy and Background Syncs

Status: Future. Feature: `docs/FEATURES.md` F2.

## 1. Problem statement

The MVP requires users to install a companion WordPress plugin for CORS support and manually trigger syncs. A managed proxy eliminates CORS issues entirely, enables one-click store connection via WooCommerce's Application Authentication Endpoint, and unlocks background/webhook-driven syncs for a seamless experience.

## 2. Data model decision

A backend service (Node.js/Cloudflare Workers) acts as a proxy between the Framer plugin and eCommerce platforms. The backend stores:
- OAuth tokens (encrypted at rest)
- Webhook subscriptions
- Sync schedules
- Background job queue

The plugin authenticates to the backend via a user-specific token. The backend authenticates to platforms using stored OAuth credentials.

Read path: Plugin → Backend → Platform API. Write path: Plugin → Backend → Platform API. Webhook path: Platform → Backend → Plugin (via polling or push notification).

## 3. Platform API operations

**WooCommerce Application Authentication Endpoint**:
- `GET /wc-auth/v1/authorize` with app_name, app_description, scope, return_url, callback_url
- User approves in browser; Woo redirects to callback with API keys
- Backend exchanges keys for OAuth tokens

**Webhook subscriptions**:
- `POST /wp-json/wc/v3/webhooks` with topic (product.created, product.updated, product.deleted)
- Backend receives webhook payloads, validates signatures, queues sync jobs

**Background sync scheduling**:
- Cron-based or queue-based (Bull, Agenda, Cloudflare Queues)
- Configurable intervals (e.g., every 15 minutes, hourly, daily)

## 4. Credentials required

User authenticates to the backend via email/password or OAuth (Google/GitHub). Backend stores platform credentials encrypted (AES-256-GCM). No changes to `framer.json`.

## 5. Triggers consumed

**WooCommerce webhooks**:
- `product.created` → queue full product fetch
- `product.updated` → queue incremental sync for that product
- `product.deleted` → queue removal from Framer CMS

Idempotency: webhook ID + timestamp. Deduplicate via Redis set with TTL.

## 6. File-by-file change list

- `backend/`: New directory for backend service
- `backend/src/index.ts`: Entry point (Express/Fastify/Hono)
- `backend/src/auth/`: User authentication (JWT, OAuth)
- `backend/src/proxy/`: Platform API proxy handlers
- `backend/src/webhooks/`: Webhook receivers and processors
- `backend/src/jobs/`: Background sync job queue
- `backend/src/db/`: Database schema (Prisma/Drizzle)
- `backend/src/crypto/`: Encryption for stored credentials
- `src/backend/client.ts`: Plugin-side HTTP client for backend API
- `src/backend/auth.ts`: Backend authentication flow
- `src/views/ConnectionModal.tsx`: Add "Connect via Ecom-Link Cloud" option
- `src/views/SettingsModal.tsx`: Add sync schedule configuration
- `docs/help/Cloud Sync.md`: New page explaining backend sync
- `framer.json`: No changes (backend is external service)

## 7. Acceptance criteria

1. Given a user signs up for Ecom-Link Cloud, they can connect a WooCommerce store via one-click OAuth without manually generating API keys.
2. Given a connected store, the backend receives `product.updated` webhooks and queues a sync job within 60 seconds.
3. Given a sync schedule of "every 15 minutes", the backend triggers automatic syncs without user interaction.
4. Given a webhook payload, the backend validates the signature and rejects invalid payloads with a 401 response.
5. Given a user disconnects their store, the backend deletes all stored credentials and webhook subscriptions.
6. Given a plugin instance, it authenticates to the backend via JWT and includes the token in all proxy requests.
7. Given a backend outage, the plugin falls back to direct connection mode (if CORS helper is installed) or shows a clear error message.

## 8. Open questions

1. **Backend hosting**: Cloudflare Workers (edge, low latency) vs. Railway/Render (simpler, longer-running jobs) vs. AWS Lambda (complex, scalable)?
2. **Database**: PlanetScale (MySQL-compatible, serverless) vs. Supabase (Postgres, built-in auth) vs. Neon (Postgres, serverless)?
3. **Pricing**: Free tier (limited syncs/month) vs. paid plans (unlimited syncs, priority support)?
4. **Data residency**: EU vs. US servers? GDPR compliance for stored credentials?
5. **Fallback strategy**: If backend is down, should the plugin auto-switch to direct mode, or require user intervention?

## Always answer these four

- **Removed then re-added plugin**: Backend credentials remain; user re-authenticates plugin to backend.
- **Framer plan limit mid-sync**: Backend enforces its own limits; plugin shows backend-provided error messages.
- **Partial sync failure and retry**: Backend retries with exponential backoff; plugin polls for job status.
- **Unusually large catalog**: Backend processes in chunks; plugin shows progress via polling.
