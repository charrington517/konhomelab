# KonHomeLab Architecture

KonHomeLab is a homelab operations dashboard running in Docker inside Proxmox LXC container `291`.

## Runtime Layout

- Proxmox host: `192.168.0.50`
- LXC container: `291`
- Project root: `/opt/konhomelab`
- Frontend URL: `http://192.168.0.101:3000`
- Backend API port: `4000`
- Cloudflare tunnel URL: `https://command.konhomelab.com`

## Frontend

- Location: `/opt/konhomelab/frontend`
- Framework: React
- Build tool: Vite
- Runtime container: Nginx
- Exposed port: `3000`

The frontend is the main command-center UI. It includes:

- Sidebar navigation
- Header summary bar
- Global search and quick filters
- Pinned Services
- Keyboard Command Palette
- View modes
- Collapsible section layout memory
- Alert Center and Recent Activity
- Infrastructure, Media, Storage, AI, Network, Tdarr, GPU, and service panels
- SettingsPanel for connection tests and raw config editing

Client-only state uses browser `localStorage` for pinned services, collapsed sections, and view mode selection.

## Backend

- Location: `/opt/konhomelab/backend`
- Runtime: Node.js
- API framework: Express
- Exposed port: `4000`

The backend provides read-only summary data and config-backed health checks for services including Proxmox, Unraid, media apps, Tdarr, GPU fallback telemetry, network checks, and dashboard service health. Settings connection tests also use backend routes.

## Configuration

- Main config: `/opt/konhomelab/config/services.json`
- Orchestration: `/opt/konhomelab/docker-compose.yml`

Treat config files as sensitive. Do not commit secrets, tokens, passwords, or private endpoint credentials.

## Network Flow

1. User opens the dashboard at `http://192.168.0.101:3000` or through the Cloudflare tunnel.
2. Nginx serves the static React app from the frontend container.
3. The frontend calls backend API routes on port `4000`.
4. The backend checks configured homelab services and returns status/config data.
5. Client-only operator UI state stays in the browser.

## Operational Notes

- Build success does not prove runtime success.
- Frontend changes must be validated in the browser after deployment.
- Runtime import failures have caused blank screens before.
- Keep frontend-only work isolated from backend changes unless the task explicitly requires backend work.
- Use git checkpoint commits instead of tracked backup files.
