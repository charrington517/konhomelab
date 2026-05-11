# KonHomeLab AI Context

This file is persistent engineering memory for AI-assisted development in this repo. Keep it concise and current. It should contain architecture, stable components, known failures, coding standards, deployment process, current goals, limitations, what already broke, and what is safe.

Do not use this file for raw chat logs, secrets, temporary troubleshooting spam, or emotional/contextual discussion that does not affect engineering decisions.

## Project Overview

KonHomeLab is a React/Vite homelab dashboard running in Docker inside Proxmox LXC container `291`.

- Proxmox host: `192.168.0.50`
- LXC container: `291`
- Project path: `/opt/konhomelab`
- Primary dashboard URL: `http://192.168.0.101:3000`
- Cloudflare tunnel URL: `https://command.konhomelab.com`

Frontend:

- React
- Vite
- Nginx container
- Project path: `/opt/konhomelab/frontend`

Backend:

- Node.js API
- Express server
- Docker container
- Project path: `/opt/konhomelab/backend`

Config and orchestration:

- Config: `/opt/konhomelab/config/services.json`
- Docker Compose: `/opt/konhomelab/docker-compose.yml`

## Current Stable State

Working:

- Alert Center
- Quick Launch
- SettingsPanel
- Sidebar navigation
- Proxmox status
- Tdarr status
- Connection testing
- JSON config editor
- Proxmox, Unraid, and media stack integration
- Cross-system monitoring

Rolled back:

- SettingsForms
- ServiceLinkManager

Reason:

- Runtime import failures caused a React blank screen.

## Critical Lessons Learned

- Build success does not guarantee runtime success.
- Runtime imports have repeatedly failed.
- Known failure examples:
  - `SettingsForms is not defined`
  - `ServiceLinkManager is not defined`
- JSX generated through shell heredocs caused broken syntax.
- Known generated-JSX failures:
  - Missing quotes
  - Malformed JSX attributes
- The safest strategy is single-file edits, small changes only, and runtime validation after every build.

## Critical Rules

- Always inspect `git status --short` before editing.
- Create a checkpoint commit before any code changes.
- Do not touch backend files unless the task specifically requires it.
- Do not add imports without verifying the referenced file/package exists.
- Do not claim success until build and runtime verification both pass.
- For frontend work, check browser/runtime console errors when possible.
- Keep edits narrow and aligned with the existing component patterns.
- Never include secrets, passwords, tokens, or API keys in commits or docs.

## Required Safe Workflow

Before any code change:

1. Run `git status --short`.
2. Create a checkpoint commit:

```bash
git add .
git commit -m "Checkpoint before <task>"
```

After any frontend change:

1. Run the frontend build:

```bash
docker compose build frontend
```

2. If the build succeeds, deploy the frontend:

```bash
docker compose up -d frontend
```

3. Verify in the browser:

- No blank screen
- No console errors
- The feature works

4. Only then commit the final change.

Rollback immediately on:

- Blank screen
- Console `ReferenceError`
- Runtime import failure
- Broken navigation or settings access

## Forbidden Actions

- No JSX via shell heredocs.
- No multi-component integrations in one step.
- No runtime imports without validation.
- No claiming success before runtime verification.
- No modifying backend during frontend-only tasks.

## Preferred Editing Strategy

Good:

- Edit existing JSX.
- Make inline modifications.
- Prefer CSS polish.
- Prefer sidebar tweaks.
- Keep diffs small.
- Work on one feature at a time.

Bad:

- New component integrations without a clear validation path.
- Multi-file refactors.
- Shell-generated JSX.
- Runtime imports that are not verified first.

## Safe Frontend Workflow

1. Run `git status --short`.
2. Create a checkpoint commit before edits.
3. Review the relevant files before editing.
4. Make one isolated change only.
5. Run `docker compose build frontend`.
6. If the build passes, run `docker compose up -d frontend`.
7. Check container status.
8. Verify the dashboard loads, has no console errors, and the feature works.
9. Commit only after validation succeeds.

## Current Development Goals

Near-term:

- Sidebar polish
- Active nav highlighting
- Sticky nav
- Collapsible mobile nav
- Section icons
- Visual improvements
- Safer UX improvements

Long-term:

- AI orchestration
- Infrastructure monitoring
- Docker controls
- GPU telemetry
- Automation integration
- Cloudflare remote access
- AI agent operations center

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

Build frontend:

```bash
docker compose build frontend
```

Deploy frontend:

```bash
docker compose up -d frontend
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
