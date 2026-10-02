# Spec F08: Sync Rules and Scheduling

Status: Future. Feature: `docs/FEATURES.md` F8.

## 1. Problem statement

The MVP requires manual sync triggers and applies the same logic to all products. Sync rules allow users to define conditional logic (auto-publish products over $100, transform field values, filter by category) and schedule automatic syncs (every 15 minutes, daily at 2 AM).

## 2. Data model decision

Rules are stored in plugin data as JSON objects:
- Rule ID (UUID)
- Rule name (user-defined)
- Rule type: "auto-publish", "field-transform", "filter"
- Conditions: Array of `{field, operator, value}` (e.g., `{field: "price", operator: ">", value: 100}`)
- Actions: Array of `{type, config}` (e.g., `{type: "set-status", config: {status: "publish"}}`)
- Enabled: boolean

Schedules are stored separately:
- Schedule ID (UUID)
- Connection ID (which store to sync)
- Cron expression (e.g., "*/15 * * * *" for every 15 minutes)
- Last run timestamp
- Next run timestamp
- Enabled: boolean

Read path: Sync engine evaluates rules before applying changes. Scheduler triggers syncs based on cron. Write path: Users create/edit rules and schedules via UI.

## 3. Platform API operations

None new. Rules and scheduling operate on existing sync engine and provider APIs.

## 4. Credentials required

None new. Rules use existing connection credentials.

## 5. Triggers consumed

None. Scheduling requires a backend (F2) or browser-based timer (limited to when Framer is open).

## 6. File-by-file change list

- `src/rules/types.ts`: Rule and schedule type definitions, new
- `src/rules/engine.ts`: Rule evaluation logic, new
- `src/rules/conditions.ts`: Condition operators (>, <, =, contains, etc.), new
- `src/rules/actions.ts`: Action handlers (set-status, transform-field, etc.), new
- `src/scheduler/cron.ts`: Cron parser and scheduler, new
- `src/scheduler/timer.ts`: Browser-based timer (fallback without backend), new
- `src/views/RuleEditor.tsx`: Rule creation/editing UI (dedicated route per INSTRUCTION.md §6), new
- `src/views/RuleList.tsx`: List of all rules with enable/disable toggles, new
- `src/views/ScheduleEditor.tsx`: Schedule creation/editing UI, new
- `src/views/ScheduleList.tsx`: List of all schedules, new
- `src/sync/engine.ts`: Integrate rule evaluation before sync, update
- `docs/help/Sync Rules.md`: Guide for creating and managing rules, new
- `docs/help/Scheduled Syncs.md`: Guide for setting up automatic syncs, new

## 7. Acceptance criteria

1. Given a rule "Auto-publish products over $100", a synced product with price $150 is set to "publish" status.
2. Given a rule "Transform SKU to uppercase", a synced product with SKU "abc123" is written to CMS as "ABC123".
3. Given a filter rule "Only sync 'Clothing' category", products in other categories are skipped during sync.
4. Given a schedule "Every 15 minutes", the sync engine triggers automatically at 0, 15, 30, 45 minutes past each hour.
5. Given a user creates a rule on a dedicated route (`/rules/new`), the rule is saved and appears in the rule list.
6. Given a rule is disabled, the sync engine skips it during evaluation.
7. Given a schedule is disabled, the scheduler does not trigger syncs.
8. Given multiple rules, they are evaluated in order (priority-based).

## 8. Open questions

1. **Rule priority**: Should rules have a priority field (1, 2, 3), or be evaluated in creation order?
2. **Rule conflicts**: What happens if two rules conflict (e.g., one sets status to "publish", another to "draft")? Last-write-wins, or error?
3. **Scheduling without backend**: Should we use a browser-based timer (only works when Framer is open), or require the managed proxy (F2) for true scheduling?
4. **Rule testing**: Should we add a "Test Rule" feature that shows which products match the conditions?
5. **Rule templates**: Should we provide pre-built rule templates (e.g., "Auto-publish featured products", "Filter out-of-stock")?
6. **Complex conditions**: Should we support AND/OR logic (e.g., "price > 100 AND category = 'Clothing'"), or only simple conditions?

## Always answer these four

- **Removed then re-added plugin**: Rules and schedules cleared; user recreates them.
- **Framer plan limit mid-sync**: Rules are evaluated per-item; no performance impact.
- **Partial sync failure and retry**: Rules are re-evaluated on retry; no state contamination.
- **Unusually large catalog**: Rule evaluation is O(n) per sync; no scaling issues.
