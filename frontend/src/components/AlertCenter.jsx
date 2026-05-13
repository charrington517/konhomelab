import { useEffect, useState } from "react";
import axios from "axios";
import { sortByPriority, withPriority } from "../alertPriority";

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [lastScan, setLastScan] = useState("");

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 15000);
    return () => clearInterval(timer);
  }, []);

  async function safeGet(url) {
    try {
      const res = await axios.get(url);
      return res.data;
    } catch {
      return null;
    }
  }

  async function fetchAlerts() {
    const host = window.location.hostname;
    const [proxmox, unraid, media, qbit, prowlarr, tdarr, gpu, platform] = await Promise.all([
      safeGet(`http://${host}:4000/api/proxmox/summary`),
      safeGet(`http://${host}:4000/api/unraid/summary`),
      safeGet(`http://${host}:4000/api/media/summary`),
      safeGet(`http://${host}:4000/api/qbit/summary`),
      safeGet(`http://${host}:4000/api/prowlarr/summary`),
      safeGet(`http://${host}:4000/api/tdarr/summary`),
      safeGet(`http://${host}:4000/api/gpu/summary`),
      safeGet(`http://${host}:4000/api/platform/summary`)
    ]);

    const nextAlerts = [];

    if (proxmox?.enabled && proxmox.error) {
      nextAlerts.push({
        level: "critical",
        source: "Proxmox",
        title: "Proxmox API unavailable",
        detail: proxmox.error
      });
    }

    if (proxmox?.guests?.length) {
      proxmox.guests
        .filter(g => g.status !== "running")
        .slice(0, 6)
        .forEach(g => {
          nextAlerts.push({
            level: "warning",
            source: "Proxmox",
            title: `${g.type} stopped: ${g.name}`,
            detail: `Node ${g.node} • ID ${g.id}`
          });
        });
    }

    if (unraid?.enabled && unraid.error) {
      nextAlerts.push({
        level: "critical",
        source: "Unraid",
        title: "Unraid API unavailable",
        detail: unraid.error
      });
    }

    if (unraid?.array?.state && unraid.array.state !== "STARTED") {
      nextAlerts.push({
        level: "critical",
        source: "Unraid",
        title: `Array state: ${unraid.array.state}`,
        detail: "Array is not in normal STARTED state"
      });
    }

    if (unraid?.array?.disks?.length) {
      unraid.array.disks
        .filter(d => d.status !== "DISK_OK")
        .forEach(d => {
          nextAlerts.push({
            level: "critical",
            source: "Unraid",
            title: `${d.name} status: ${d.status.replace("DISK_", "")}`,
            detail: d.temp ? `Temperature ${d.temp}°C` : "Disk needs attention"
          });
        });
    }

    if (unraid?.docker?.stopped > 0) {
      nextAlerts.push({
        level: "warning",
        source: "Unraid Docker",
        title: `${unraid.docker.stopped} containers exited`,
        detail: `${unraid.docker.running} running of ${unraid.docker.total} total`
      });
    }

    if (media?.sonarr?.connected === false) {
      nextAlerts.push({
        level: "warning",
        source: "Sonarr",
        title: "Sonarr unavailable",
        detail: media.sonarr.error || "Could not connect"
      });
    }

    if ((media?.sonarr?.healthWarnings || 0) > 0) {
      nextAlerts.push({
        level: "warning",
        source: "Sonarr",
        title: `${media.sonarr.healthWarnings} health warnings`,
        detail: `${media.sonarr.missingCount || 0} missing episodes`
      });
    }

    if (media?.radarr?.connected === false) {
      nextAlerts.push({
        level: "warning",
        source: "Radarr",
        title: "Radarr unavailable",
        detail: media.radarr.error || "Could not connect"
      });
    }

    if ((media?.radarr?.healthWarnings || 0) > 0) {
      nextAlerts.push({
        level: "warning",
        source: "Radarr",
        title: `${media.radarr.healthWarnings} health warnings`,
        detail: `${media.radarr.missingCount || 0} missing movies`
      });
    }

    if (qbit?.connected === false) {
      nextAlerts.push({
        level: "warning",
        source: "qBittorrent",
        title: "qBittorrent unavailable",
        detail: qbit.error || "Login/API setup needed"
      });
    }

    if ((qbit?.counts?.errored || 0) > 0) {
      nextAlerts.push({
        level: "critical",
        source: "qBittorrent",
        title: `${qbit.counts.errored} torrents errored`,
        detail: `${qbit.counts.stalled || 0} stalled torrents`
      });
    }

    if ((qbit?.counts?.stalled || 0) > 0) {
      nextAlerts.push({
        level: "warning",
        source: "qBittorrent",
        title: `${qbit.counts.stalled} torrents stalled`,
        detail: `${qbit.counts.downloading || 0} downloading`
      });
    }

    if (prowlarr?.connected === false) {
      nextAlerts.push({
        level: "warning",
        source: "Prowlarr",
        title: "Prowlarr unavailable",
        detail: prowlarr.error || "API setup needed"
      });
    }

    if ((prowlarr?.counts?.healthWarnings || 0) > 0) {
      nextAlerts.push({
        level: "warning",
        source: "Prowlarr",
        title: `${prowlarr.counts.healthWarnings} indexer warnings`,
        detail: `${prowlarr.counts.enabledIndexers || 0} enabled indexers`
      });
    }

    if (tdarr?.connected === false) {
      nextAlerts.push({
        level: "warning",
        source: "Tdarr",
        title: "Tdarr unavailable",
        detail: tdarr.error || "API endpoint unavailable"
      });
    }

    if ((tdarr?.warnings?.length || 0) > 0) {
      tdarr.warnings.forEach(warning => {
        nextAlerts.push({
          level: "warning",
          source: "Tdarr",
          title: "Tdarr endpoint warning",
          detail: warning
        });
      });
    }

    if (gpu?.enabled === false) {
      nextAlerts.push({
        level: "warning",
        source: "GPU",
        title: "GPU unavailable",
        detail: "No local GPU source is currently available",
        priority: "high"
      });
    }

    if (platform?.routes?.some?.(route => route.ok === false)) {
      const failed = platform.routes.filter(route => route.ok === false).length;
      nextAlerts.push({
        level: "critical",
        source: "Platform",
        title: `${failed} API routes failed`,
        detail: "Dashboard platform route health needs attention"
      });
    }

    setAlerts(sortByPriority(nextAlerts.map(withPriority)));
    setLastScan(new Date().toLocaleTimeString());
  }

  const criticalCount = alerts.filter(a => a.level === "critical").length;
  const warningCount = alerts.filter(a => a.level === "warning").length;
  const highPriorityCount = alerts.filter(a => a.priority === "high").length;

  return (
    <section id="alerts" className="section">
      <div className="section-header">
        <div>
          <h2>Alert Center</h2>
          <span>Unified operational issues across the lab</span>
        </div>
        <span>{lastScan ? `Last scan ${lastScan}` : "Scanning..."}</span>
      </div>

      <div className="status-grid">
        <div className={`metric ${criticalCount > 0 ? "danger" : ""}`}>
          <span>Critical</span>
          <strong>{criticalCount}</strong>
          <p>Immediate attention</p>
        </div>
        <div className={`metric ${warningCount > 0 ? "warning" : ""}`}>
          <span>High Priority</span>
          <strong>{highPriorityCount}</strong>
          <p>Escalated warnings</p>
        </div>
        <div className="metric">
          <span>Total Alerts</span>
          <strong>{alerts.length}</strong>
          <p>Across all integrations</p>
        </div>
        <div className="metric">
          <span>Status</span>
          <strong>{alerts.length === 0 ? "Clear" : "Review"}</strong>
          <p>Operations posture</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="hero-panel">
          <div>
            <h2>No active alerts</h2>
            <p>
              No current problems were detected from Proxmox, Unraid, media automation,
              download services, indexers, or Tdarr.
            </p>
          </div>
        </div>
      ) : (
        <div className="cards">
          {alerts.map((alert, index) => (
            <div className={`service-card alert-card alert-${alert.level} priority-${alert.priority || "info"}`} key={`${alert.source}-${alert.title}-${index}`}>
              <div className="card-top">
                <div>
                  <h3>{alert.title}</h3>
                  <p>{alert.source} / {alert.level}</p>
                </div>
                <div className={`status-dot ${alert.level === "critical" ? "offline" : "warning"}`} />
              </div>
              <p className="alert-detail">
                {alert.detail}
              </p>
              <div className="card-bottom">
                <span className={`priority-badge ${alert.priority || "info"}`}>{alert.priorityLabel || "Info"}</span>
                <span>Alert</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
