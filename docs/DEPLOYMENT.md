# KonHomeLab Deployment

Use this file for stable deployment commands and validation steps.

## Access

From the Proxmox host:

```bash
pct exec 291 -- bash
```

Inside the LXC:

```bash
cd /opt/konhomelab
```

## Required Pre-Change Check

Before any code change:

```bash
git status --short
git add .
git commit -m "Checkpoint before <task>"
```

If the working tree has unrelated changes, inspect them before committing or editing.

## Frontend Build

```bash
docker compose build frontend
```

## Frontend Deploy

```bash
docker compose up -d frontend
```

## Container Status

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
- The changed feature works.
- Sidebar and Settings access still work.

## Final Commit

Only after build, deploy, and runtime verification:

```bash
git status --short
git add <changed-files>
git commit -m "<clear change summary>"
```

## Compose Warning

Docker Compose may warn that the `version` field in `docker-compose.yml` is obsolete. This warning is not currently blocking, but the field can be removed in a future cleanup commit.
