import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DEFAULT_FILTERS, filterItems, filteredCountLabel, hasActiveFilters } from "../filterUtils";
import CollapsibleSection from "./CollapsibleSection";

const API_BASE = `http://${window.location.hostname}:4000/api`;
const MEDIA_SERVICES = ["Plex", "Jellyfin"];
const PIPELINE = [
  "Prowlarr",
  "Sonarr/Radarr",
  "qBittorrent",
  "Tdarr",
  "Plex/Jellyfin"
];

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

function latencyLabel(service) {
  if (!service) return "Not configured";
  return service.latency ? `${service.latency} ms` : "No response";
}

function speedLabel(bytesPerSecond) {
  if (!bytesPerSecond) return "0 B/s";

  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let value = bytesPerSecond;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function connectionState(data) {
  if (!data) return "unavailable";
  return data.connected === false ? "offline" : "online";
}

function MediaOperations({ services, filters = DEFAULT_FILTERS }) {
  const [media, setMedia] = useState(null);
  const [qbit, setQbit] = useState(null);
  const [prowlarr, setProwlarr] = useState(null);
  const [tdarr, setTdarr] = useState(null);

  useEffect(() => {
    fetchMediaOps();
    const timer = setInterval(fetchMediaOps, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchMediaOps() {
    const [mediaResult, qbitResult, prowlarrResult, tdarrResult] = await Promise.allSettled([
      axios.get(`${API_BASE}/media/summary`),
      axios.get(`${API_BASE}/qbit/summary`),
      axios.get(`${API_BASE}/prowlarr/summary`),
      axios.get(`${API_BASE}/tdarr/summary`)
    ]);

    setMedia(mediaResult.status === "fulfilled" ? mediaResult.value.data : null);
    setQbit(qbitResult.status === "fulfilled" ? qbitResult.value.data : null);
    setProwlarr(prowlarrResult.status === "fulfilled" ? prowlarrResult.value.data : null);
    setTdarr(tdarrResult.status === "fulfilled" ? tdarrResult.value.data : null);
  }

  const mediaServiceCards = MEDIA_SERVICES.map(name => ({
    name,
    service: services.find(service => service.name === name),
    category: "media"
  }));

  const warnings = useMemo(() => {
    return [
      media?.sonarr?.healthWarnings || 0,
      media?.radarr?.healthWarnings || 0,
      qbit?.counts?.errored || 0,
      qbit?.counts?.stalled || 0,
      prowlarr?.counts?.healthWarnings || 0,
      tdarr?.warnings?.length || 0,
      mediaServiceCards.filter(item => serviceStatus(item.service) !== "online").length
    ].reduce((total, value) => total + value, 0);
  }, [media, qbit, prowlarr, tdarr, mediaServiceCards]);

  const queueDepth = (media?.sonarr?.queueCount || 0) + (media?.radarr?.queueCount || 0);
  const missingCount = (media?.sonarr?.missingCount || 0) + (media?.radarr?.missingCount || 0);
  const pipelineStatus = {
    Prowlarr: connectionState(prowlarr),
    "Sonarr/Radarr": media?.sonarr?.connected === false || media?.radarr?.connected === false
      ? "offline"
      : media ? "online" : "unavailable",
    qBittorrent: connectionState(qbit),
    Tdarr: connectionState(tdarr),
    "Plex/Jellyfin": mediaServiceCards.every(item => serviceStatus(item.service) === "online")
      ? "online"
      : "offline"
  };
  const operationCards = [
    {
      key: "sonarr",
      name: "Sonarr",
      category: "media",
      status: connectionState(media?.sonarr),
      warning: (media?.sonarr?.healthWarnings || 0) > 0,
      detail: connectionState(media?.sonarr) !== "online" ? "API unavailable" : `${media?.sonarr?.missingCount || 0} missing episodes`,
      meta: `${media?.sonarr?.queueCount || 0} queued / ${media?.sonarr?.healthWarnings || 0} warnings`
    },
    {
      key: "radarr",
      name: "Radarr",
      category: "media",
      status: connectionState(media?.radarr),
      warning: (media?.radarr?.healthWarnings || 0) > 0,
      detail: connectionState(media?.radarr) !== "online" ? "API unavailable" : `${media?.radarr?.missingCount || 0} missing movies`,
      meta: `${media?.radarr?.queueCount || 0} queued / ${media?.radarr?.healthWarnings || 0} warnings`
    },
    {
      key: "qbit",
      name: "qBittorrent",
      category: "media",
      status: connectionState(qbit),
      warning: (qbit?.counts?.stalled || 0) > 0,
      critical: (qbit?.counts?.errored || 0) > 0,
      detail: connectionState(qbit) !== "online" ? qbit?.error || "Downloader unavailable" : `${speedLabel(qbit?.speeds?.download)} down, ${speedLabel(qbit?.speeds?.upload)} up`,
      meta: `${qbit?.counts?.stalled || 0} stalled / ${qbit?.counts?.uploading || 0} seeding`,
      badge: `${qbit?.counts?.errored || 0} errors`
    },
    {
      key: "prowlarr",
      name: "Prowlarr",
      category: "media",
      status: connectionState(prowlarr),
      warning: (prowlarr?.counts?.healthWarnings || 0) > 0,
      detail: connectionState(prowlarr) !== "online" ? prowlarr?.error || "Indexer API unavailable" : `${prowlarr?.counts?.enabledIndexers || 0} enabled indexers`,
      meta: `${prowlarr?.counts?.indexers || 0} total`,
      badge: `${prowlarr?.counts?.healthWarnings || 0} warnings`
    },
    {
      key: "tdarr",
      name: "Tdarr",
      category: "media",
      status: connectionState(tdarr),
      warning: (tdarr?.warnings?.length || 0) > 0,
      detail: connectionState(tdarr) === "online" ? `Version ${tdarr.server?.version || "unknown"}` : tdarr?.error || "Transcode API unavailable",
      meta: `${tdarr?.counts?.activeJobs || 0} active`,
      badge: `${tdarr?.warnings?.length || 0} warnings`
    }
  ];
  const visibleOperationCards = filterItems(operationCards, filters);
  const visibleMediaServiceCards = filterItems(mediaServiceCards.map(item => ({
    ...item,
    status: serviceStatus(item.service),
    url: item.service?.url
  })), filters);

  return (
    <CollapsibleSection
      id="media"
      sectionKey="media-ops"
      title="Media Operations"
      subtitle="Read-only automation, indexer, downloader, and playback health"
      meta={`${warnings} warnings`}
    >
      <div className="status-grid">
        <Metric title="Queue" value={queueDepth} label="Sonarr/Radarr items" danger={queueDepth > 0} />
        <Metric title="Missing" value={missingCount} label="Wanted media backlog" danger={missingCount > 0} />
        <Metric title="Torrents" value={qbit?.counts?.total || 0} label={`${qbit?.counts?.stalled || 0} stalled`} danger={(qbit?.counts?.stalled || 0) > 0} />
        <Metric title="Warnings" value={warnings} label={filteredCountLabel(operationCards.length + mediaServiceCards.length, visibleOperationCards.length + visibleMediaServiceCards.length)} danger={warnings > 0} />
      </div>

      <div className="pipeline-strip" aria-label="Media pipeline status">
        {PIPELINE.map((stage, index) => (
          <div className={`pipeline-step ${pipelineStatus[stage]}`} key={stage}>
            <span className="pipeline-index">{index + 1}</span>
            <strong>{stage}</strong>
            <span>{pipelineStatus[stage]}</span>
          </div>
        ))}
      </div>

      <div className="cards">
        {visibleOperationCards.length === 0 && visibleMediaServiceCards.length === 0 && (
          <div className="empty-card">
            {hasActiveFilters(filters) ? "No media operations match the current filters." : "No media operations available."}
          </div>
        )}

        {visibleOperationCards.map(card => (
          <div className={`service-card ${card.status !== "online" ? "is-offline" : ""}`} key={card.key}>
          <div className="card-top">
            <div>
              <h3>{card.name}</h3>
              <p>{card.detail}</p>
            </div>
            <div className={`status-dot ${card.status === "online" ? "online" : "offline"}`} />
          </div>
          <div className="card-bottom">
            <span className={card.critical ? "bad" : card.warning ? "warn" : card.status === "online" ? "ok" : "bad"}>
              {card.badge || card.status}
            </span>
            <span>{card.meta}</span>
          </div>
        </div>
        ))}

        {visibleMediaServiceCards.map(({ name, service }) => (
          <a
            className={`service-card ${serviceStatus(service) !== "online" ? "is-offline" : ""}`}
            href={service?.url || "#media"}
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
    </CollapsibleSection>
  );
}

function statusText(service) {
  return service?.status || "unavailable";
}

export default MediaOperations;
