# KonHomeLab Roadmap

This roadmap is intentionally practical. Prefer small, validated improvements over large rewrites.

## Current Stable Baseline

KonHomeLab is now a compact operational command center with read-only visibility across infrastructure, media, storage, AI, network, Tdarr, alerts, recent activity, services, pinned services, filters, collapsible sections, view modes, and a keyboard command palette.

## Near-Term

- Keep documentation current after each bundle.
- Improve troubleshooting/runbook coverage.
- Continue small read-only visibility improvements.
- Refine operational scanability without large redesigns.
- Add tests or scripted validation where it reduces runtime risk.

## Infrastructure And Monitoring

- Deeper Proxmox health summaries
- Safer Docker/container visibility
- GPU telemetry across dashboard LXC, AI Core, and Unraid/Tdarr sources
- Service uptime/status history
- WebSocket or polling improvements for live updates
- Alert severity tuning

## AI And Automation

- Ollama visibility
- OpenWebUI health details
- n8n workflow status
- AI worker management
- AI agent operations center

## Remote Access And Security

- Cloudflare remote access improvements
- Authentication
- Role-aware controls
- Safer secrets/config handling

## Development Principles

- One feature or stabilization pass at a time.
- Small diffs.
- Existing components first.
- Runtime validation before success claims.
- Roll back immediately on blank screen or console runtime errors.
- Use checkpoint commits, not backup files, for rollback.
