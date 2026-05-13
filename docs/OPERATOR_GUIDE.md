# KonHomeLab Operator Guide

This guide covers the daily-use controls added through the compact command-center releases.

## Current Operating Model

KonHomeLab is a read-only command-center dashboard. It aggregates live service, infrastructure, media, storage, AI, network, alert, trend, and diagnostic context without starting, stopping, restarting, or modifying homelab services.

Most personalization features are stored in browser `localStorage`. They are local to the current browser only and are not shared across users, devices, or the backend.

## View Modes

Use the View Mode selector near the top of the dashboard to switch scan presets:

- Operations View: health, activity, pinned services, and infrastructure
- Media View: media operations, Tdarr, activity, and pinned services
- AI View: AI Stack, GPU telemetry when available, activity, and pinned services
- Storage View: storage operations, health, and pinned services
- Compact All: collapses operational sections for a high-level scan

The selected mode and section layout are saved in the browser.

## Command Palette

Open the command palette with:

- Windows/Linux: `Ctrl+K`
- macOS: `Cmd+K`

You can also use the visible `Command Palette` button.

Supported actions:

- Jump to dashboard sections
- Open configured service links
- Switch dashboard view modes
- Expand all sections
- Collapse all sections

Keyboard controls:

- Type to search
- `ArrowDown` / `ArrowUp` to move through results
- `Enter` to run the selected command
- `Escape` to close

## Pinned Services

Pinned Services gives quick access to frequently used systems. Pins are stored in browser `localStorage`.

Use it for:

- Core infrastructure links
- Media services
- AI services
- Monitoring tools

If pins disappear, the browser likely cleared site data. The dashboard will fall back to default suggested pins when services are available.

## Filters

The Global Search and Quick Filters bar filters operational cards and service lists.

Filter by:

- Search text
- Status: healthy, warning, critical, offline
- Category: infrastructure, media, storage, AI, network

Filters are client-side and do not change backend state.

## Collapsible Sections

Major operational sections can be expanded or collapsed using their section headers.

Supported sections include:

- Pinned Services
- System Health Overview
- Recent Activity
- Infrastructure Operations
- Media Operations
- Storage Operations
- AI Stack
- Network Operations
- Tdarr
- GPU Telemetry when available

Collapsed state is stored in browser `localStorage`. Use the command palette or View Mode selector to quickly reset layout.

## Smart Alert Prioritization

Alert Center and Recent Activity assign a client-side priority:

- Critical: disk/parity issues, array state problems, platform/API failures, critical infrastructure outages
- High: stopped guests, exited containers, unavailable services, unavailable GPU, errored jobs
- Medium: recurring health warnings, stalled torrents, media/indexer warnings
- Low: minor endpoint or polling warnings
- Info: recovery or informational changes

Priority badges are for scanability only. They do not change backend behavior.

## Trend Context

Trend chips summarize recent local history:

- stable
- improving
- degraded
- flapping
- persistent

Trend history is stored in browser `localStorage` and is intentionally lightweight. If browser data is cleared, trend context restarts from the next dashboard load.

## Operator Notes

Operator notes let you annotate known issues locally, for example:

- `GPU intentionally offline`
- `disk replacement scheduled`
- `maintenance in progress`
- `expected during nightly sync`

Notes are available on:

- Alert Center cards
- Recent Activity rows
- System Health pills
- Quick Launch service cards

Use `Note` to add a note, `Edit` to update it, and `Remove` to clear it. Notes are local-only browser state and must not be used for secrets or shared operational handoff.

## Diagnostics

Diagnostics shows safe runtime context:

- frontend/backend metadata
- API route health summary
- localStorage availability
- active view mode
- collapsed section count
- pinned service count
- trend history count/sample count
- Error Boundary event count and last timestamp

Use Diagnostics when a dashboard behavior looks odd before making code changes.

## Safety Notes

- Current operations panels are read-only.
- Service links open external tools but do not start, stop, restart, or modify services.
- Settings remains the sensitive area; validate runtime behavior after any Settings change.
- Operator notes, pinned services, layout memory, trend context, and filters are local browser state.
- Never store secrets, passwords, API keys, or private tokens in operator notes.
