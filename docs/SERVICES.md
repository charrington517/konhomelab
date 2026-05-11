# KonHomeLab Services

This file inventories services that KonHomeLab tracks or may integrate with. Keep URLs, ports, and auth details out of git when they are sensitive.

## Core Infrastructure

### Proxmox

- Role: Virtualization host
- Host: `192.168.0.50`
- Dashboard LXC: `291`
- Used for container status, VM/LXC visibility, and host-level operations.

### KonHomeLab Dashboard

- Frontend: `http://192.168.0.101:3000`
- Backend API: port `4000`
- Project path: `/opt/konhomelab`
- Runs via Docker Compose inside LXC `291`.

### Unraid

- Role: Storage/server platform
- Used for storage/server status and dashboard visibility.

## Media And Automation Stack

### Tdarr

- Role: Media transcoding/automation
- Current status integration is working.

### Sonarr

- Role: TV automation
- Candidate for service inventory, health checks, and quick launch.

### Radarr

- Role: Movie automation
- Candidate for service inventory, health checks, and quick launch.

## Monitoring And AI Stack

### Grafana

- Role: Dashboards/observability
- Candidate for quick launch and status integration.

### Ollama

- Role: Local model runtime
- Candidate for AI orchestration and GPU telemetry workflows.

### OpenWebUI

- Role: Local AI web UI
- Candidate for AI operations center links and status visibility.

### n8n

- Role: Automation workflows
- Candidate for automation integration and dashboard controls.

## Inventory Rules

- Add new services here before wiring new UI controls.
- Document the purpose, health-check method, and safe integration path.
- Do not commit API keys, tokens, service passwords, or private webhook secrets.
