# KonHomeLab AI Context

This file is the working memory for AI-assisted development in this repo. Keep it current when architecture, safety rules, or deployment steps change.

## Project Overview

KonHomeLab is a self-hosted dashboard running in LXC container `291` on the Proxmox host `192.168.0.50`.

- Project root: `/opt/konhomelab`
- Frontend: `/opt/konhomelab/frontend` React dashboard
- Backend: `/opt/konhomelab/backend` Express API server
- Config: `/opt/konhomelab/config/services.json`
- Orchestration: `/opt/konhomelab/docker-compose.yml`
- Local dashboard URL: `http://192.168.0.101:3000`
- Cloudflare tunnel URL: `https://command.konhomelab.com`

## Current Stable State

The dashboard is stable with:

- Sidebar navigation
- Settings panel
- Alert center
- Quick Launch service grid
- Proxmox, Unraid, and media stack integration
- Cross-system monitoring
- JSON config editor and connection testing

## Critical Rules

- Always inspect `git status` before editing.
- Create a checkpoint commit before risky or multi-file changes.
- Do not touch backend files unless the task specifically requires it.
- Do not add imports without verifying the referenced file/package exists.
- Do not claim success until the relevant build passes.
- For frontend work, also check browser/runtime console errors when possible.
- Keep edits narrow and aligned with the existing component patterns.
- Never include secrets, passwords, tokens, or API keys in commits or docs.

## Known Risk Areas

- Runtime-only React failures after a successful build
- Missing or incorrect imports
- Component integration across multiple files
- Settings/config editor changes
- Docker rebuild/deploy steps that mask stale frontend assets

## Safe Frontend Workflow

1. Run `git status --short`.
2. Review the relevant files before editing.
3. Make the smallest useful change.
4. Run the frontend build.
5. Restart only the frontend service when appropriate.
6. Check container status.
7. Verify the dashboard loads and has no obvious runtime errors.
8. Commit only after validation succeeds.

## Common Commands

Access the LXC container from the Proxmox host:

```bash
pct exec 291 -- bash
```

Project directory inside the LXC:

```bash
cd /opt/konhomelab
```

View containers:

```bash
docker compose ps
```

Rebuild frontend:

```bash
docker compose up -d --build frontend
```

Check recent commits:

```bash
git log --oneline -10
```

## Deployment Notes

- The frontend container exposes port `3000`.
- The backend container exposes port `4000`.
- Prefer rebuilding only the affected service.
- If the dashboard breaks, inspect git history and `.before-*` backup files before making larger repairs.
