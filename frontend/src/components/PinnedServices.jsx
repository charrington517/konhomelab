import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_FILTERS, filterItems, hasActiveFilters } from "../filterUtils";
import CollapsibleSection from "./CollapsibleSection";

const STORAGE_KEY = "konhomelab:pinned-services";
const DEFAULT_PINNED = ["Proxmox", "Unraid", "AI Dashboard", "Grafana", "Sonarr", "qBittorrent"];

function readPins(services) {
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    return defaultPins(services);
  }

  return defaultPins(services);
}

function savePins(nextPins) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(nextPins));
  } catch {
    return false;
  }

  return true;
}

function defaultPins(services) {
  const names = new Set(services.map(service => service.name));
  return DEFAULT_PINNED.filter(name => names.has(name));
}

function latencyText(service) {
  return typeof service.latency === "number" ? `${service.latency} ms` : "No response";
}

function PinnedServices({ services, filters = DEFAULT_FILTERS }) {
  const [pinnedNames, setPinnedNames] = useState([]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || services.length === 0) return;
    initialized.current = true;
    setPinnedNames(readPins(services));
  }, [services]);

  const pinnedServices = useMemo(() => {
    const names = new Set(pinnedNames);
    return services
      .filter(service => names.has(service.name))
      .map(service => ({ ...service, text: "pinned favorite service" }));
  }, [services, pinnedNames]);

  const visiblePinned = useMemo(() => filterItems(pinnedServices, filters), [pinnedServices, filters]);
  const addCandidates = useMemo(() => {
    const names = new Set(pinnedNames);
    return filterItems(services.filter(service => !names.has(service.name)), filters).slice(0, 10);
  }, [services, pinnedNames, filters]);

  function commitPins(nextPins) {
    setPinnedNames(nextPins);
    setStorageAvailable(savePins(nextPins));
  }

  function pin(name) {
    commitPins([...pinnedNames, name]);
  }

  function unpin(name) {
    commitPins(pinnedNames.filter(item => item !== name));
  }

  return (
    <CollapsibleSection
      id="pinned"
      sectionKey="pinned-services"
      className="pinned-services"
      title="Pinned Services"
      subtitle="Local browser favorites for fast operational access"
      meta={storageAvailable ? "Saved locally" : "Session only"}
    >
      <div className="pinned-grid">
        {visiblePinned.length === 0 && (
          <div className="empty-card">
            {hasActiveFilters(filters)
              ? "No pinned services match the current filters."
              : "No services pinned yet. Add a service below."}
          </div>
        )}

        {visiblePinned.map(service => (
          <article className={`service-card pinned-card ${service.status !== "online" ? "is-offline" : ""}`} key={service.name}>
            <div className="card-top">
              <div>
                <h3>{service.name}</h3>
                <p>{service.category || "Service"} - {latencyText(service)}</p>
              </div>
              <div className={`status-dot ${service.status === "online" ? "online" : "offline"}`} />
            </div>

            <div className="pinned-actions">
              <a href={service.url} target="_blank" rel="noreferrer">Open</a>
              <button type="button" onClick={() => unpin(service.name)} aria-label={`Unpin ${service.name}`}>
                Unpin
              </button>
            </div>

            <div className="card-bottom">
              <span className={service.status === "online" ? "ok" : "bad"}>{service.status || "unknown"}</span>
              <span>Pinned</span>
            </div>
          </article>
        ))}
      </div>

      <div className="pin-tray" aria-label="Available services to pin">
        <span>Add pin</span>
        {addCandidates.length === 0 ? (
          <strong>{hasActiveFilters(filters) ? "No matching services available" : "All visible services pinned"}</strong>
        ) : (
          addCandidates.map(service => (
            <button type="button" onClick={() => pin(service.name)} key={service.name}>
              {service.name}
            </button>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}

export default PinnedServices;
