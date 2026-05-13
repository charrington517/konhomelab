# KonHomeLab AI Context

Persistent engineering memory for AI-assisted development in this repo. Keep this file concise, current, and operational. Do not use it for raw chat logs, secrets, temporary troubleshooting spam, or notes that do not affect engineering decisions.

## Project Overview

KonHomeLab is a React/Vite homelab operations dashboard running in Docker inside Proxmox LXC container `291`.

- Proxmox host: `192.168.0.50`
- Dashboard LXC: `291`
- Project path: `/opt/konhomelab`
- Primary dashboard URL: `http://192.168.0.101:3000`
- Cloudflare tunnel URL: `https://command.konhomelab.com`
- Frontend: React, Vite, Nginx container, exposed on port `3000`
- Backend: Node.js, Express, exposed on port `4000`
- Config: `/opt/konhomelab/config/services.json`
- Orchestration: `/opt/konhomelab/docker-compose.yml`

## Current Stable State

Stable through v6.7:

- Compact command-center layout
- Sidebar navigation with active section state
- System Health Overview
- Header summary bar
- Recent Activity feed
- Alert Center
- Quick Launch
- Pinned Services with browser `localStorage`
- Global search and quick filters
- Collapsible operational sections with layout memory
- Dashboard view modes: Operations, Media, AI, Storage, Compact All
- Keyboard Command Palette via `Ctrl+K` / `Cmd+K`
- Smart alert prioritization: Critical, High, Medium, Low, Info
- Time-aware trend context using client-side rolling history
- Operator notes/local annotations for alerts, activity, health items, and Quick Launch services
- Proxmox status and Infrastructure Operations
- Unraid-driven Storage Operations
- Media Operations: Sonarr, Radarr, qBittorrent, Prowlarr, Tdarr, Plex/Jellyfin health
- Network Operations
- AI Stack Overview
- GPU Telemetry route/UI with safe unavailable fallback
- Backend Observability panel with API route health, latency, version, and refresh status
- Platform Release Banner with frontend/backend status, version, deploy timestamp, and docs sync label
- Diagnostics panel for safe runtime state, localStorage status, trend history, and error-boundary state
- Error Boundary protection for root and higher-risk sections
- SettingsPanel with connection testing and raw JSON config editor

## Client-Side State

The following features intentionally use browser `localStorage` only:

- Pinned services
- Global filters and dashboard view/layout memory
- Collapsed section state
- Operator notes/local annotations
- Trend history samples
- Error Boundary event count/timestamp

This state is local to the browser and is not shared across users or devices. The dashboard must work safely when localStorage is empty or unavailable.

## Rolled Back / Removed

- `SettingsForms`
- `ServiceLinkManager`

Reason:

- Runtime import and component integration failures caused React blank screens. Keep Settings changes small and validate runtime behavior before committing.

## Critical Lessons Learned

- Build success does not guarantee runtime success.
- Runtime imports have repeatedly failed when components were added too quickly.
- Known failure examples:
  - `SettingsForms is not defined`
  - `ServiceLinkManager is not defined`
- JSX generated through shell heredocs caused malformed syntax and missing quotes.
- Prefer existing component patterns, small diffs, and runtime validation after every build.

## Critical Rules

- Always inspect `git status --short` before editing.
- Create a checkpoint commit before any code changes.
- Do not touch backend files unless the task specifically requires it.
- Do not add imports without verifying the referenced file/package exists.
- Do not claim success until build and runtime verification both pass.
- For frontend work, check browser/runtime console errors when possible.
- Keep edits narrow and aligned with the existing component patterns.
- Never include secrets, passwords, tokens, or API keys in commits or docs.
- Do not keep backup artifacts in git; use checkpoint commits for rollback.

## Required Safe Workflow

Before any code change:

1. Run `git status --short`.
2. Create a checkpoint commit:

```bash
git add .
git commit -m "Checkpoint before <task>"
```

After any frontend change:

1. Run `docker compose build frontend`.
2. If the build succeeds, run `docker compose up -d frontend`.
3. Verify browser runtime:
   - No blank screen
   - Desktop console errors: `0`
   - Changed feature works
4. Only then commit the final change.

After backend changes:

1. Run `docker compose build backend`.
2. Deploy the affected service.
3. Curl the changed endpoint.
4. Verify frontend still loads if the backend feeds UI state.

Rollback immediately on:

- Blank screen
- Console `ReferenceError`
- Runtime import failure
- Broken navigation or Settings access

## Forbidden Actions

- No JSX via shell heredocs.
- No broad Settings rewrites.
- No runtime imports without validation.
- No destructive service controls unless explicitly requested.
- No modifying secrets/config writing during read-only dashboard work.
- No claiming success before runtime verification.

## Preferred Editing Strategy

Good:

- Edit existing JSX/components.
- Add small isolated components only when their imports are verified.
- Prefer CSS polish and read-only panels.
- Keep diffs small.
- Use existing localStorage/event patterns for client-only UI state.

Bad:

- Multi-file rewrites without validation points.
- Shell-generated JSX.
- Runtime imports that are not verified first.
- Reintroducing rolled-back Settings components.

## Current Development Direction

Near-term:

- Stability and documentation sync through v6.7
- Operational readability
- Better runbooks and troubleshooting notes
- Small read-only improvements

Long-term:

- AI orchestration
- Infrastructure monitoring depth
- Docker controls with strong safeguards
- GPU telemetry across AI Core and Unraid/Tdarr sources
- Automation integration
- Authentication and role-aware controls

## Common Commands

```bash
cd /opt/konhomelab
git status --short
docker compose ps
docker compose build frontend
docker compose build backend
docker compose up -d frontend
git log --oneline -10
```
