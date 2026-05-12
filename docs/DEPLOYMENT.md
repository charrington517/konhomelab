# KonHomeLab Deployment

Use this file for stable deployment commands and validation steps.

## Access

Direct development access:

```bash
ssh codexdev@192.168.0.101
cd /opt/konhomelab
```

Fallback from the Proxmox host:

```bash
pct exec 291 -- bash
cd /opt/konhomelab
```

## Required Pre-Change Check

Before any code or docs change:

```bash
git status --short
git add .
git commit -m "Checkpoint before <task>"
```

If the working tree has unrelated changes, inspect them before committing or editing.

## Builds

Frontend:

```bash
docker compose build frontend
```

Backend:

```bash
docker compose build backend
```

## Deploy

Deploy only when code or runtime assets changed. Documentation-only changes do not require deploy.

Frontend:

```bash
docker compose up -d frontend
```

Backend:

```bash
docker compose up -d backend
```

Container status:

```bash
docker compose ps
```

Expected services:

- `konhomelab-frontend`
- `konhomelab-backend`

## Browser Verification

After frontend deployment, verify:

- The dashboard loads at `http://192.168.0.101:3000`.
- There is no blank screen.
- The browser console has no runtime errors.
- Sidebar and Settings access still work.
- Operator UI works when changed:
  - View modes
  - Command palette
  - Pinned services
  - Filters
  - Collapsible sections

## Final Commit

Only after build and runtime verification:

```bash
git status --short
git add .
git commit -m "<clear change summary>"
git push
```

## Compose Warning

Docker Compose may warn that the `version` field in `docker-compose.yml` is obsolete. This warning is not currently blocking, but the field can be removed in a future cleanup commit.
