import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = `http://${window.location.hostname}:4000/api`;

function Metric({ title, value, label, danger, tone }) {
  return (
    <div className={`metric ${tone || ""} ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

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

function SystemHealthOverview() {
  const [systems, setSystems] = useState([]);
  const [lastScan, setLastScan] = useState("");

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
      status: statusFor(results[index], evaluate)
    })));
    setLastScan(new Date().toLocaleTimeString());
  }

  const counts = useMemo(() => {
    return systems.reduce((next, system) => {
      next[system.status] += 1;
      return next;
    }, {
      healthy: 0,
      warning: 0,
      critical: 0,
      unavailable: 0
    });
  }, [systems]);

  return (
    <section className="section health-overview">
      <div className="section-header">
        <div>
          <h2>System Health Overview</h2>
          <span>Compact read-only status across core lab services</span>
        </div>
        <span>{lastScan ? `Last scan ${lastScan}` : "Scanning..."}</span>
      </div>

      <div className="status-grid">
        <Metric title="Healthy" value={counts.healthy} label="No action needed" />
        <Metric title="Warnings" value={counts.warning} label="Watch list" tone={counts.warning > 0 ? "warning" : ""} />
        <Metric title="Critical" value={counts.critical} label="Needs attention" danger={counts.critical > 0} />
        <Metric title="Unavailable" value={counts.unavailable} label="Offline or disabled" danger={counts.unavailable > 0} />
      </div>

      <div className="health-strip">
        {systems.map(system => (
          <div className={`health-pill ${system.status}`} key={system.name}>
            <span className={`legend-dot ${system.status}`}></span>
            <strong>{system.name}</strong>
            <span>{system.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SystemHealthOverview;
