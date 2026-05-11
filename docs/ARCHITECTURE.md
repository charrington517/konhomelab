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

The frontend is the main dashboard UI. It includes sidebar navigation, alert views, quick-launch service links, settings/config tools, and integration status panels.

## Backend

- Location: `/opt/konhomelab/backend`
- Runtime: Node.js
- API framework: Express
- Exposed port: `4000`

The backend provides API routes for service health, connection testing, dashboard data, and configuration-backed integrations.

## Configuration

- Main config: `/opt/konhomelab/config/services.json`
- Orchestration: `/opt/konhomelab/docker-compose.yml`

Treat config files as sensitive. Do not commit secrets, tokens, passwords, or private endpoint credentials.

## Network Flow

1. User opens the dashboard at `http://192.168.0.101:3000` or through the Cloudflare tunnel.
2. The frontend serves static React assets from the Nginx container.
3. The frontend calls the backend API on port `4000`.
4. The backend checks configured homelab services and returns status/config data.

## Operational Notes

- Build success does not prove runtime success.
- Frontend changes must be validated in the browser after deployment.
- Runtime import failures have caused blank screens before.
- Keep frontend-only work isolated from backend changes unless the task explicitly requires backend work.
