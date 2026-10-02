# Spec F07: Multi-Store Support

Status: Future. Feature: `docs/FEATURES.md` F7.

## 1. Problem statement

The MVP supports one store connection per Framer project. Agencies and power users managing multiple client stores need to connect multiple stores to a single Framer project, each syncing to a separate CMS collection.

## 2. Data model decision

Multiple connections stored in plugin data, each with:
- Connection ID (UUID)
- Provider ID (woocommerce, shopify, etc.)
- Display name (user-defined, e.g., "Client A Store")
- Credentials (encrypted)
- Target CMS collection ID
- Sync settings (field mappings, two-way config)

Each connection operates independently with its own sync history, snapshots, and settings.

Read path: User selects a connection from a dropdown; UI shows connection-specific data. Write path: Sync engine operates on the selected connection's credentials and target collection.

## 3. Platform API operations

None new. Multi-store is a UI and storage layer on top of existing provider APIs.

## 4. Credentials required

Each connection has its own credentials. No changes to credential schema.

## 5. Triggers consumed

None. Manual sync triggers per connection.

## 6. File-by-file change list

- `src/storage/connections.ts`: Support multiple connections (array instead of single), update
- `src/storage/snapshots.ts`: Namespace snapshots by connection ID, update
- `src/storage/history.ts`: Namespace sync history by connection ID, update
- `src/views/Dashboard.tsx`: Add connection selector dropdown, update
- `src/views/ConnectionModal.tsx`: Add "Add Another Store" button, update
- `src/views/ConnectionCard.tsx`: Show connection name and provider icon, update
- `src/views/MultiStoreSettings.tsx`: New modal for managing multiple connections, new
- `src/components/ui/ConnectionSelector.tsx`: Reusable connection dropdown, new
- `docs/help/Multi-Store Setup.md`: Guide for agencies managing multiple stores, new

## 7. Acceptance criteria

1. Given a user connects a second store, the connection selector shows both stores with distinct names.
2. Given a user selects "Client A Store", the dashboard shows Client A's sync status, last sync time, and item count.
3. Given a user syncs Client A, only Client A's target collection is updated; Client B's collection is unaffected.
4. Given a user deletes Client A's connection, Client B's connection and data remain intact.
5. Given 5 connections, the UI renders all 5 in the selector without performance degradation.
6. Given a user renames a connection to "Client A - Production", the new name appears in the selector and dashboard.
7. Given a user switches connections mid-sync, the current sync completes for the original connection (no cross-contamination).

## 8. Open questions

1. **Connection limits**: Should we cap the number of connections (e.g., 10 on free plan, unlimited on paid)?
2. **CMS collection management**: Should we auto-create a collection per connection, or require users to create manually?
3. **Sync scheduling**: Should each connection have its own sync schedule (F2), or a global schedule?
4. **Data isolation**: Should each connection's data (snapshots, history) be stored separately, or in a shared structure with connection IDs?
5. **UI complexity**: How do we keep the UI simple with 10+ connections? Search/filter? Pagination?
6. **Agency features**: Should we add team management (invite collaborators, assign connections to team members)?

## Always answer these four

- **Removed then re-added plugin**: All connections cleared; user reconnects all stores.
- **Framer plan limit mid-sync**: Safety cap applies per connection (not global).
- **Partial sync failure and retry**: Each connection's sync is independent; retry per connection.
- **Unusually large catalog**: Each connection handles its own catalog size; no global limit.
