# KonHomeLab Operator Guide

This guide covers the daily-use controls added through the compact command-center releases.

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

## Safety Notes

- Current operations panels are read-only.
- Service links open external tools but do not start, stop, restart, or modify services.
- Settings remains the sensitive area; validate runtime behavior after any Settings change.
