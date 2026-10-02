# Spec F09: Web Admin Dashboard

Status: Future. Feature: `docs/FEATURES.md` F9.

## 1. Problem statement

The plugin runs inside Framer with no external visibility. Agencies and teams managing multiple Framer projects need a centralized web dashboard to monitor all connections, view sync history across projects, receive alerts for failures, and manage team access without opening each Framer project individually.

## 2. Data model decision

A web application (React + backend) that aggregates data from all plugin instances via a reporting API. The plugin periodically sends anonymized sync reports and connection status to the backend.

**Data stored in backend**:
- Organization/team info
- User accounts and roles (admin, editor, viewer)
- Plugin instances (project ID, connection status, last sync)
- Sync history (aggregated reports from all instances)
- Alerts and notifications (failure thresholds, sync delays)

Read path: Dashboard queries backend API for aggregated data. Write path: Plugin reports to backend; users manage settings via dashboard UI.

## 3. Platform API operations

None directly. Dashboard reads from Ecom-Link backend, not platform APIs.

## 4. Credentials required

Users authenticate to dashboard via email/password or OAuth (Google/GitHub). Backend manages JWT tokens. No changes to plugin credentials.

## 5. Triggers consumed

None. Dashboard is a read-only view of plugin-reported data.

## 6. File-by-file change list

- `dashboard/`: New directory for web dashboard (separate repo or monorepo)
- `dashboard/src/pages/Dashboard.tsx`: Overview page with all instances, new
- `dashboard/src/pages/Connections.tsx`: Connection management page, new
- `dashboard/src/pages/SyncHistory.tsx`: Sync history and reports, new
- `dashboard/src/pages/Alerts.tsx`: Alert configuration and history, new
- `dashboard/src/pages/Team.tsx`: Team member management, new
- `dashboard/src/components/InstanceCard.tsx`: Card showing instance status, new
- `dashboard/src/components/SyncTimeline.tsx`: Timeline visualization, new
- `backend/src/api/reports.ts`: Plugin reporting endpoint, new
- `backend/src/api/teams.ts`: Team management API, new
- `backend/src/api/alerts.ts`: Alert configuration API, new
- `src/backend/reporter.ts`: Plugin-side reporting client, new
- `docs/help/Web Dashboard.md`: Dashboard usage guide, new

## 7. Acceptance criteria

1. Given a user logs into the dashboard, they see a list of all Framer projects with Ecom-Link installed.
2. Given a plugin instance fails to sync, the dashboard shows an alert within 5 minutes.
3. Given a user is assigned the "editor" role, they can view sync history but cannot change connection settings.
4. Given a sync failure rate > 10% across all instances, the dashboard sends an email notification.
5. Given a user clicks an instance card, they see detailed sync history (last 30 days) with success/failure counts.
6. Given a team with 10 members, the dashboard displays all members with their roles and last login time.
7. Given a plugin instance is removed from Framer, the dashboard marks it as "inactive" after 7 days of no reports.

## 8. Open questions

1. **Hosting**: Should the dashboard be a separate SaaS product (ecom-link.app), or part of the managed proxy (F2)?
2. **Data privacy**: Should plugin reports include project names (readable) or only project IDs (anonymous)?
3. **Real-time updates**: Should the dashboard use WebSockets for live updates, or poll every 60 seconds?
4. **Alert channels**: Email only, or also Slack/Discord/webhook integrations?
5. **Billing integration**: Should the dashboard show usage metrics for paid plans (F10)?
6. **Plugin reporting frequency**: Should plugins report every sync, hourly, or daily?

## Always answer these four

- **Removed then re-added plugin**: Dashboard marks instance as "reconnected"; history preserved if same project ID.
- **Framer plan limit mid-sync**: Dashboard shows limit-related failures in alerts.
- **Partial sync failure and retry**: Dashboard aggregates retry attempts in sync history.
- **Unusually large catalog**: Dashboard shows catalog size per instance; no impact on dashboard performance.
