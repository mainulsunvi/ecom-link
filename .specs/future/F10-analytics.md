# Spec F10: Analytics

Status: Future. Feature: `docs/FEATURES.md` F10.

## 1. Problem statement

Users have no visibility into sync performance over time. Analytics surfaces metrics like items synced per day, failure rates, average sync duration, and commerce insights (product count trends, stock levels, price changes) to help users optimize their workflow and understand their catalog health.

## 2. Data model decision

Analytics data is derived from existing sync history and snapshots, stored in plugin data (per-project) or aggregated in the backend (if using F2/F9).

**Metrics tracked**:
- Items synced per day/week/month (created, updated, deleted)
- Sync duration (time per sync run)
- Failure rate (failed items / total items per sync)
- Error type distribution (CORS, auth, rate limit, etc.)
- Catalog size trends (product count over time)
- Stock level changes (products going out of stock, restocking)
- Price change frequency (products with price updates)
- Two-way sync volume (Framer → Woo writes per day)

Read path: Dashboard queries sync history and computes metrics. Write path: Sync engine writes to history; analytics reads from it.

## 3. Platform API operations

None. Analytics operates on local sync history data.

## 4. Credentials required

None. Analytics uses existing plugin data.

## 5. Triggers consumed

None. Analytics is a read-only view of historical data.

## 6. File-by-file change list

- `src/analytics/metrics.ts`: Metric calculation functions, new
- `src/analytics/trends.ts`: Trend analysis (moving averages, growth rates), new
- `src/analytics/commerce.ts`: Commerce-specific insights (stock, price), new
- `src/views/AnalyticsDashboard.tsx`: Main analytics view, new
- `src/views/SyncPerformance.tsx`: Sync performance metrics, new
- `src/views/CatalogHealth.tsx`: Catalog health insights, new
- `src/components/ui/Chart.tsx`: Reusable chart component (line, bar, pie), new
- `src/components/ui/MetricCard.tsx`: Metric display card, new
- `src/components/ui/TrendIndicator.tsx`: Up/down trend arrow, new
- `docs/help/Analytics.md`: Analytics usage guide, new

## 7. Acceptance criteria

1. Given 30 days of sync history, the analytics dashboard shows a line chart of items synced per day.
2. Given a sync failure rate of 15%, the dashboard displays a warning badge and suggests troubleshooting.
3. Given a catalog that grew from 100 to 150 products over 30 days, the trend indicator shows "+50% growth".
4. Given 10 products went out of stock in the last 7 days, the catalog health page lists them with restock recommendations.
5. Given a user views sync performance, they see average sync duration (e.g., "2m 34s") and p95 duration.
6. Given a user filters by date range (last 7 days), all charts update to show that period.
7. Given a user exports analytics data, they receive a CSV file with all metrics.

## 8. Open questions

1. **Data retention**: How long should we keep sync history for analytics? 30 days, 90 days, 1 year?
2. **Charting library**: Should we use Recharts, Chart.js, or build custom SVG charts?
3. **Performance**: Should analytics compute on-the-fly, or pre-aggregate daily snapshots?
4. **Commerce insights**: Should we integrate with external analytics (Google Analytics, Shopify Analytics) for revenue data?
5. **Export formats**: CSV only, or also JSON, PDF reports?
6. **Alerts based on analytics**: Should we trigger alerts when metrics cross thresholds (e.g., failure rate > 20%)?

## Always answer these four

- **Removed then re-added plugin**: Analytics data cleared; user starts fresh.
- **Framer plan limit mid-sync**: Analytics shows limit-related failures in error distribution.
- **Partial sync failure and retry**: Analytics counts retries in failure metrics.
- **Unusually large catalog**: Analytics handles 10,000+ items; charts paginate or aggregate.
