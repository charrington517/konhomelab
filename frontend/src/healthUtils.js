import axios from "axios";

const API_BASE = `http://${window.location.hostname}:4000/api`;

const HEALTH_ENDPOINTS = [
  ["Proxmox", `${API_BASE}/proxmox/summary`, data => {
    const stoppedGuests = data.guests?.filter(guest => guest.status !== "running").length || 0;
    return stoppedGuests > 0 ? "warning" : "healthy";
  }],
  ["Unraid", `${API_BASE}/unraid/summary`, data => {
    if (data.array?.state && data.array.state !== "STARTED") return "critical";
    if (data.array?.disks?.some(disk => disk.status !== "DISK_OK")) return "critical";
    if ((data.docker?.stopped || 0) > 0) return "warning";
    return "healthy";
  }],
  ["Media", `${API_BASE}/media/summary`, data => {
    if (data.sonarr?.connected === false || data.radarr?.connected === false) return "critical";
    if ((data.sonarr?.healthWarnings || 0) > 0 || (data.radarr?.healthWarnings || 0) > 0) return "warning";
    return "healthy";
  }],
  ["qBittorrent", `${API_BASE}/qbit/summary`, data => {
    if ((data.counts?.errored || 0) > 0) return "critical";
    if ((data.counts?.stalled || 0) > 0) return "warning";
    return "healthy";
  }],
  ["Prowlarr", `${API_BASE}/prowlarr/summary`, data => {
    if ((data.counts?.healthWarnings || 0) > 0) return "warning";
    return "healthy";
  }],
  ["Tdarr", `${API_BASE}/tdarr/summary`, data => {
    if ((data.warnings?.length || 0) > 0) return "warning";
    return "healthy";
  }],
  ["GPU", `${API_BASE}/gpu/summary`, data => (
    data.enabled ? "healthy" : "unavailable"
  )]
];

function statusFor(result, evaluate) {
  if (result.status === "rejected" || !result.value) {
    return "unavailable";
  }

  const data = result.value.data;
  if (data?.enabled === false) {
    return "unavailable";
  }

  if (data?.error || data?.connected === false) {
    return "critical";
  }

  return evaluate(data);
}

export async function fetchSystemHealth() {
  const results = await Promise.allSettled(
    HEALTH_ENDPOINTS.map(([, url]) => axios.get(url, { timeout: 7000 }))
  );

  return {
    systems: HEALTH_ENDPOINTS.map(([name, , evaluate], index) => ({
      name,
      status: statusFor(results[index], evaluate)
    })),
    lastScan: new Date().toLocaleTimeString()
  };
}

export function summarizeSystemHealth(systems = [], services = []) {
  const systemCounts = systems.reduce((next, system) => {
    next[system.status] += 1;
    return next;
  }, {
    healthy: 0,
    warning: 0,
    critical: 0,
    unavailable: 0
  });

  const offlineServices = services.filter(service => service.status === "offline").length;
  const offlineUnavailable = offlineServices + systemCounts.unavailable;
  const label = systemCounts.critical > 0
    ? "Critical"
    : systemCounts.warning > 0 || offlineUnavailable > 0
      ? "Warning"
      : "Healthy";

  return {
    ...systemCounts,
    offlineUnavailable,
    label,
    tone: label === "Critical" ? "critical" : label === "Warning" ? "warning" : "healthy",
    totalServices: services.length
  };
}
