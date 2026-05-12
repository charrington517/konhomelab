# KonHomeLab Services

This file inventories services that KonHomeLab tracks or may integrate with. Keep URLs, ports, and auth details out of git when they are sensitive.

## Core Infrastructure

### Proxmox

- Role: Virtualization host
- Host: `192.168.0.50`
- Dashboard LXC: `291`
- Used for host, VM, LXC, storage, and infrastructure operations visibility.

### KonHomeLab Dashboard

- Frontend: `http://192.168.0.101:3000`
- Backend API: port `4000`
- Project path: `/opt/konhomelab`
- Runs via Docker Compose inside LXC `291`.

### Unraid

- Role: Storage/server platform
- Used for Docker container state, array health, disks, capacity, cache pools, and storage service health.

## Media And Automation Stack

### Sonarr

- Role: TV automation
- Used for queue, missing episodes, health warnings, media pipeline visibility, service health, quick launch, filters, and command palette.

### Radarr

- Role: Movie automation
- Used for queue, missing movies, health warnings, media pipeline visibility, service health, quick launch, filters, and command palette.

### qBittorrent

- Role: Download client
- Used for download/upload speed, stalled/error counts, media pipeline visibility, service health, quick launch, filters, and command palette.

### Prowlarr

- Role: Indexer manager
- Used for enabled indexer counts, warnings, media pipeline visibility, service health, quick launch, filters, and command palette.

### Tdarr

- Role: Media transcoding/automation
- Used for API status, endpoint warnings, operations panel, media pipeline visibility, service health, quick launch, filters, and command palette.

### Plex / Jellyfin

- Role: Playback/media serving
- Used through service health, quick launch, filters, and command palette.

## Storage Apps

### Immich

- Role: Photo/media storage
- Used through service health, Storage Operations, quick launch, filters, and command palette.

### Nextcloud

- Role: File sync/storage
- Used through service health, Storage Operations, quick launch, filters, and command palette.

## Monitoring And AI Stack

### Grafana / Prometheus / Uptime Kuma

- Role: Observability and monitoring
- Used through service health, Quick Launch, Pinned Services, Network Operations, filters, and command palette.

### Ollama

- Role: Local model runtime
- Candidate for deeper AI Stack and GPU telemetry workflows.

### OpenWebUI

- Role: Local AI web UI
- Used through AI Stack service health and command palette when configured.

### n8n

- Role: Automation workflows
- Used through AI Stack service health and command palette when configured.

## Inventory Rules

- Add new services here before wiring new UI controls.
- Document purpose, health-check method, and safe integration path.
- Do not commit API keys, tokens, service passwords, or private webhook secrets.
- Prefer read-only visibility before adding any controls.
