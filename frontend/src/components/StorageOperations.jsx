import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DEFAULT_FILTERS, filterItems, filteredCountLabel, hasActiveFilters } from "../filterUtils";

const API_BASE = `http://${window.location.hostname}:4000/api`;
const STORAGE_SERVICES = ["Immich", "Nextcloud"];

function Metric({ title, value, label, danger }) {
  return (
    <div className={`metric ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function serviceStatus(service) {
  return service?.status === "online" ? "online" : "offline";
}

function statusText(service) {
  return service?.status || "unavailable";
}

function latencyLabel(service) {
  if (!service) return "Not configured";
  return service.latency ? `${service.latency} ms` : "No response";
}

function tempLabel(temp) {
  return temp === null || temp === undefined ? "Temp N/A" : `${temp}C`;
}

function diskClass(status) {
  return status === "DISK_OK" ? "online" : "offline";
}

function diskStatusLabel(status) {
  return String(status || "unknown").replace("DISK_", "").toLowerCase();
}

function StorageOperations({ services, filters = DEFAULT_FILTERS }) {
  const [unraid, setUnraid] = useState(null);

  useEffect(() => {
    fetchStorage();
    const timer = setInterval(fetchStorage, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchStorage() {
    try {
      const res = await axios.get(`${API_BASE}/unraid/summary`);
      setUnraid(res.data);
    } catch {
      setUnraid({ enabled: true, connected: false, error: "Unraid storage summary unavailable" });
    }
  }

  const disks = (unraid?.array?.disks || []).map(disk => ({ ...disk, category: "storage", status: disk.status, text: "unraid array disk" }));
  const parities = (unraid?.array?.parities || []).map(parity => ({ ...parity, category: "storage", status: parity.status, text: "unraid parity disk" }));
  const caches = (unraid?.array?.caches || []).map(cache => ({ ...cache, category: "storage", status: cache.status, text: "unraid cache pool" }));
  const serviceCards = STORAGE_SERVICES.map(name => ({
    name,
    service: services.find(service => service.name === name),
    category: "storage"
  }));
  const visibleParities = filterItems(parities, filters);
  const visibleDisks = filterItems(disks, filters);
  const visibleCaches = filterItems(caches, filters);
  const visibleServiceCards = filterItems(serviceCards.map(item => ({
    ...item,
    status: serviceStatus(item.service),
    url: item.service?.url
  })), filters);

  const counts = useMemo(() => {
    const problemDisks = disks.filter(disk => disk.status !== "DISK_OK").length;
    const problemParity = parities.filter(parity => parity.status !== "DISK_OK").length;
    const problemCaches = caches.filter(cache => cache.status !== "DISK_OK").length;

    return {
      healthyDisks: disks.length - problemDisks,
      problemDisks,
      problemParity,
      problemCaches
    };
  }, [disks, parities, caches]);

  if (!unraid?.enabled) {
    return null;
  }

  return (
    <section id="storage" className="section">
      <div className="section-header">
        <div>
          <h2>Storage Operations</h2>
          <span>Read-only Unraid array, parity, cache, and storage app health</span>
        </div>
      </div>

      <div className="status-grid">
        <Metric
          title="Array"
          value={unraid?.array?.state || "Unknown"}
          label={unraid?.connected ? "Unraid connected" : unraid?.error || "Storage unavailable"}
          danger={!unraid?.connected || unraid?.array?.state !== "STARTED"}
        />
        <Metric
          title="Disks"
          value={disks.length}
          label={`${counts.healthyDisks} healthy / ${counts.problemDisks} problem`}
          danger={counts.problemDisks > 0}
        />
        <Metric
          title="Capacity"
          value={`${unraid?.array?.usedPercent ?? 0}%`}
          label={`${unraid?.array?.usedTB || "0"} TB used / ${unraid?.array?.freeTB || "0"} TB free`}
          danger={(unraid?.array?.usedPercent || 0) >= 85}
        />
        <Metric
          title="Cache"
          value={caches.length}
          label={`${counts.problemCaches} cache warnings`}
          danger={counts.problemCaches > 0}
        />
      </div>

      <div className="cards">
        {visibleParities.length === 0 && visibleServiceCards.length === 0 && hasActiveFilters(filters) && (
          <div className="empty-card">No storage summary cards match the current filters.</div>
        )}

        {visibleParities.map(parity => (
          <div className={`service-card ${parity.status !== "DISK_OK" ? "is-offline" : ""}`} key={parity.name}>
            <div className="card-top">
              <div>
                <h3>{parity.name}</h3>
                <p>Parity disk - {parity.sizeGB || "Unknown"} GB</p>
              </div>
              <div className={`status-dot ${diskClass(parity.status)}`} />
            </div>
            <div className="card-bottom">
              <span className={parity.status === "DISK_OK" ? "ok" : "bad"}>{diskStatusLabel(parity.status)}</span>
              <span>Parity</span>
            </div>
          </div>
        ))}

        {visibleServiceCards.map(({ name, service }) => (
          <a
            className={`service-card ${serviceStatus(service) !== "online" ? "is-offline" : ""}`}
            href={service?.url || "#storage"}
            target={service?.url ? "_blank" : undefined}
            rel={service?.url ? "noreferrer" : undefined}
            key={name}
          >
            <div className="card-top">
              <div>
                <h3>{name}</h3>
                <p>{service?.url || "Service not configured"}</p>
              </div>
              <div className={`status-dot ${serviceStatus(service)}`} />
            </div>
            <div className="card-bottom">
              <span className={serviceStatus(service) === "online" ? "ok" : "bad"}>{statusText(service)}</span>
              <span>{latencyLabel(service)}</span>
            </div>
          </a>
        ))}
      </div>

      <div className="section-header compact-header">
        <div>
          <h2>Array Disks</h2>
          <span>{filteredCountLabel(disks.length, visibleDisks.length)} - Disk status, temperature, and reported size</span>
        </div>
      </div>

      <div className="cards">
        {visibleDisks.length === 0 && (
          <div className="empty-card">
            {hasActiveFilters(filters) ? "No array disks match the current filters." : "No Unraid disk data available."}
          </div>
        )}

        {visibleDisks.map(disk => (
          <div className={`service-card ${disk.status !== "DISK_OK" ? "is-offline" : ""}`} key={disk.name}>
            <div className="card-top">
              <div>
                <h3>{disk.name}</h3>
                <p>{disk.sizeGB || "Unknown"} GB - {tempLabel(disk.temp)}</p>
              </div>
              <div className={`status-dot ${diskClass(disk.status)}`} />
            </div>
            <div className="card-bottom">
              <span className={disk.status === "DISK_OK" ? "ok" : "bad"}>{diskStatusLabel(disk.status)}</span>
              <span>{unraid?.array?.usedPercent ?? "N/A"}% array used</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section-header compact-header">
        <div>
          <h2>Cache Pools</h2>
          <span>{filteredCountLabel(caches.length, visibleCaches.length)} - Cache pool status and temperatures when available</span>
        </div>
      </div>

      <div className="cards">
        {visibleCaches.length === 0 && (
          <div className="empty-card">
            {hasActiveFilters(filters) ? "No cache pools match the current filters." : "No cache pool data available."}
          </div>
        )}

        {visibleCaches.map(cache => (
          <div className={`service-card ${cache.status !== "DISK_OK" ? "is-offline" : ""}`} key={cache.name}>
            <div className="card-top">
              <div>
                <h3>{cache.name}</h3>
                <p>{cache.sizeGB || "Unknown"} GB - {tempLabel(cache.temp)}</p>
              </div>
              <div className={`status-dot ${diskClass(cache.status)}`} />
            </div>
            <div className="card-bottom">
              <span className={cache.status === "DISK_OK" ? "ok" : "bad"}>{diskStatusLabel(cache.status)}</span>
              <span>Cache</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StorageOperations;
