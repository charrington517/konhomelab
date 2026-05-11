import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = `http://${window.location.hostname}:4000/api`;

function Metric({ title, value, label, danger }) {
  return (
    <div className={`metric ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function percent(value) {
  return typeof value === "number" ? `${value}%` : "N/A";
}

function stateClass(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized === "running" || normalized === "online" || normalized === "started"
    ? "online"
    : "offline";
}

function InfrastructureOperations() {
  const [proxmox, setProxmox] = useState(null);
  const [unraid, setUnraid] = useState(null);

  useEffect(() => {
    fetchInfrastructure();
    const timer = setInterval(fetchInfrastructure, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchInfrastructure() {
    const [proxmoxResult, unraidResult] = await Promise.allSettled([
      axios.get(`${API_BASE}/proxmox/summary`),
      axios.get(`${API_BASE}/unraid/summary`)
    ]);

    setProxmox(proxmoxResult.status === "fulfilled"
      ? proxmoxResult.value.data
      : { enabled: true, error: "Proxmox summary unavailable" });
    setUnraid(unraidResult.status === "fulfilled"
      ? unraidResult.value.data
      : { enabled: true, connected: false, error: "Unraid summary unavailable" });
  }

  const guests = proxmox?.guests || [];
  const vms = guests.filter(guest => guest.type === "VM");
  const lxcs = guests.filter(guest => guest.type === "LXC");
  const containers = unraid?.docker?.containers || [];

  const counts = useMemo(() => ({
    runningGuests: guests.filter(guest => guest.status === "running").length,
    stoppedGuests: guests.filter(guest => guest.status !== "running").length,
    runningContainers: containers.filter(container => container.state === "RUNNING").length,
    stoppedContainers: containers.filter(container => container.state !== "RUNNING").length
  }), [guests, containers]);

  return (
    <section id="infrastructure-ops" className="section">
      <div className="section-header">
        <div>
          <h2>Infrastructure Operations</h2>
          <span>Read-only Proxmox guests and Unraid Docker visibility</span>
        </div>
      </div>

      <div className="status-grid">
        <Metric title="Proxmox VMs" value={vms.length} label={`${vms.filter(vm => vm.status === "running").length} running`} />
        <Metric title="Proxmox LXCs" value={lxcs.length} label={`${lxcs.filter(lxc => lxc.status === "running").length} running`} danger={counts.stoppedGuests > 0} />
        <Metric title="Unraid Docker" value={containers.length} label={`${counts.runningContainers} running`} danger={counts.stoppedContainers > 0} />
        <Metric title="Warnings" value={counts.stoppedGuests + counts.stoppedContainers} label="Stopped guests/containers" danger={(counts.stoppedGuests + counts.stoppedContainers) > 0} />
      </div>

      {proxmox?.error && <div className="empty-card">{proxmox.error}</div>}
      {unraid?.error && <div className="empty-card">{unraid.error}</div>}

      <div className="section-header compact-header">
        <div>
          <h2>Proxmox Guests</h2>
          <span>VMs and LXCs by node, status, CPU, and memory</span>
        </div>
      </div>

      <div className="cards">
        {guests.length === 0 && (
          <div className="empty-card">No Proxmox guest data available.</div>
        )}

        {guests.map(guest => (
          <div className={`service-card ${guest.status !== "running" ? "is-offline" : ""}`} key={`${guest.type}-${guest.id}`}>
            <div className="card-top">
              <div>
                <h3>{guest.name}</h3>
                <p>{guest.type} {guest.id} - Node {guest.node || "unknown"} - CPU {percent(guest.cpu)} - RAM {percent(guest.memoryPercent)}</p>
              </div>
              <div className={`status-dot ${stateClass(guest.status)}`} />
            </div>

            <div className="card-bottom">
              <span className={guest.status === "running" ? "ok" : "bad"}>{guest.status || "unknown"}</span>
              <span>{guest.type}</span>
            </div>
          </div>
        ))}
      </div>

      <div id="unraid" className="section-header compact-header">
        <div>
          <h2>Unraid Docker</h2>
          <span>Container state and image inventory</span>
        </div>
        <span>{counts.stoppedContainers} warnings</span>
      </div>

      <div className="cards">
        {containers.length === 0 && (
          <div className="empty-card">No Unraid Docker container data available.</div>
        )}

        {containers.map(container => (
          <div className={`service-card ${container.state !== "RUNNING" ? "is-offline" : ""}`} key={container.name}>
            <div className="card-top">
              <div>
                <h3>{container.name}</h3>
                <p>{container.image || "Image unavailable"}</p>
              </div>
              <div className={`status-dot ${stateClass(container.state)}`} />
            </div>

            <div className="card-bottom">
              <span className={container.state === "RUNNING" ? "ok" : "bad"}>{container.state || "unknown"}</span>
              <span>Unraid</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default InfrastructureOperations;
