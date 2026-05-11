import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = `http://${window.location.hostname}:4000/api`;

function evaluateStatus(result, evaluate) {
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

function overallLabel({ critical, warning, offlineUnavailable }) {
  if (critical > 0) return "Critical";
  if (warning > 0 || offlineUnavailable > 0) return "Warning";
  return "Healthy";
}

function overallTone(label) {
  if (label === "Critical") return "critical";
  if (label === "Warning") return "warning";
  return "healthy";
}

export default function HeaderSummaryBar({ services, lastUpdated }) {
  const [systems, setSystems] = useState([]);

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchHealth() {
    const endpoints = [
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

    const results = await Promise.allSettled(
      endpoints.map(([, url]) => axios.get(url, { timeout: 7000 }))
    );

    setSystems(endpoints.map(([name, , evaluate], index) => ({
      name,
      status: evaluateStatus(results[index], evaluate)
    })));
  }

  const summary = useMemo(() => {
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
    const label = overallLabel({
      critical: systemCounts.critical,
      warning: systemCounts.warning,
      offlineUnavailable
    });

    return {
      ...systemCounts,
      offlineUnavailable,
      label,
      tone: overallTone(label),
      totalServices: services.length
    };
  }, [services, systems]);

  return (
    <section className={`summary-bar ${summary.tone}`} aria-label="Operational summary">
      <div className="summary-state">
        <span className={`legend-dot ${summary.tone}`}></span>
        <strong>{summary.label}</strong>
        <span>System state</span>
      </div>

      <div className="summary-items">
        <span><strong>{summary.critical}</strong> critical</span>
        <span><strong>{summary.warning}</strong> warnings</span>
        <span><strong>{summary.offlineUnavailable}</strong> offline/unavailable</span>
        <span><strong>{summary.totalServices}</strong> services</span>
        <span><strong>{lastUpdated || "Starting..."}</strong> refreshed</span>
      </div>
    </section>
  );
}
