# Changelog

## v6.8 - Stability + Operator Documentation Sync

- Synced AI project memory and operator docs through v6.7.
- Documented operator notes, localStorage-backed client features, trend context, diagnostics, alert prioritization, view modes, command palette, and rollback guidance.
- Rechecked stale component references, sidebar targets, stale imports, and backup artifacts.

## v6.7 - Operator Notes / Local Annotations

- Added local-only operator notes for alerts, recent activity, health items, and Quick Launch service cards.
- Added compact known-issue note chips with add, edit, and remove behavior using browser storage only.
- Preserved read-only dashboard behavior with safe fallback when local storage is unavailable.

## v6.6 - Time Awareness + Trend Context

- Added client-side rolling trend history using browser storage only.
- Added compact stable, improving, degraded, flapping, and persistent trend labels for alerts, activity, and health status.
- Added diagnostics visibility for tracked trend history and sample count.

## v6.5 - Smart Alert Prioritization

- Added client-side Critical, High, Medium, Low, and Info priority ranking for operational alerts and events.
- Prioritized disk/parity issues, platform/API failures, stopped guests, exited containers, unavailable GPU, media warnings, and minor endpoint warnings.
- Updated Alert Center, Recent Activity, and System Health Overview with compact priority badges while preserving existing severity colors.

## v6.4 - Safe Diagnostics Panel

- Added read-only Diagnostics panel for runtime troubleshooting.
- Shows frontend/backend metadata, API endpoint summary, local dashboard state, localStorage availability, and error-boundary event state.
- Reuses existing platform and client-side state without exposing secrets or adding controls.

## v6.3 - Error Boundary + Blank Screen Protection

- Added app-level React error boundary protection around the dashboard root.
- Added compact section-level fallbacks around higher-risk operational panels.
- Added dark fallback UI with reload action, timestamp, safe error message, and browser console guidance.

## v6.2 - Performance + Polling Optimization

- Centralized shared system health polling for the header summary bar and System Health Overview.
- Removed duplicate 15-second health endpoint polling from child components.
- Preserved the existing compact dashboard behavior while reducing repeated API calls and rerenders.

## v6.1 - Platform Release Banner

- Added compact platform identity/release banner near the top of the dashboard.
- Reuses `/api/platform/summary` for backend status, version, route count, and deploy/start timestamp.
- Shows frontend/backend status, version/commit fallback, docs sync label, and last checked time.

## v6.0 - Safe Backend Observability

- Added read-only Backend Observability panel.
- Added lightweight `/api/platform/summary` metadata route.
- Shows backend/frontend status, API route health, failed endpoint count, average API latency, last successful refresh, and available version/commit metadata.
- Removed remaining tracked backup artifacts.

## v5.7 - Stability + Documentation Sync

- Synced project docs with the dashboard state through v5.6.
- Added the operator guide.
- Added this changelog.
- Removed tracked backup artifacts and stale rolled-back component files.
- Verified sidebar link targets, stale imports, and backup artifacts.

## v5.6 - Keyboard Command Palette

- Added `Ctrl+K` / `Cmd+K` command palette.
- Added searchable section jumps, service link opens, view mode switching, and expand/collapse all actions.
- Added keyboard navigation with arrow keys, `Enter`, and `Escape`.

## v5.5 - Dashboard View Modes

- Added Operations, Media, AI, Storage, and Compact All view presets.
- Reused collapsible section layout memory.
- Preserved view mode state in browser storage.

## v5.4 - Collapsible Sections + Layout Memory

- Added collapse/expand behavior for major dashboard sections.
- Stored collapsed state in browser storage.

## v5.3 - Favorite / Pinned Services

- Added Pinned Services.
- Added client-side pin/unpin support using browser storage.

## v5.2 - Global Search + Quick Filter

- Added client-side dashboard filtering by text, status, and category.

## v5.1 - Dashboard Header Summary Bar

- Added compact top-level operational summary counts.

## v5.0 - Recent Activity / Event Feed

- Added read-only recent activity feed generated from current summaries and alert-like signals.

## v4.x - Operations Bundles And Compact UI

- Added Infrastructure, Media, Storage, Network, AI, Tdarr, GPU, and system health visibility.
- Shifted UI toward compact operational density and clearer visual hierarchy.
