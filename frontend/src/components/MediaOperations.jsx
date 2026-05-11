import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = `http://${window.location.hostname}:4000/api`;
const MEDIA_SERVICES = ["Plex", "Jellyfin"];

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

function MediaOperations({ services }) {
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
    service: services.find(service => service.name === name)
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

  return (
    <section id="media" className="section">
      <div className="section-header">
        <div>
          <h2>Media Operations</h2>
          <span>Read-only automation, indexer, downloader, and playback health</span>
        </div>
      </div>

      <div className="status-grid">
        <Metric title="Queue" value={queueDepth} label="Sonarr/Radarr items" danger={queueDepth > 0} />
        <Metric title="Missing" value={missingCount} label="Wanted media backlog" danger={missingCount > 0} />
        <Metric title="Torrents" value={qbit?.counts?.total || 0} label={`${qbit?.counts?.stalled || 0} stalled`} danger={(qbit?.counts?.stalled || 0) > 0} />
        <Metric title="Warnings" value={warnings} label="Pipeline watch items" danger={warnings > 0} />
      </div>

      <div className="cards">
        <div className={`service-card ${media?.sonarr?.connected === false ? "is-offline" : ""}`}>
          <div className="card-top">
            <div>
              <h3>Sonarr</h3>
              <p>{media?.sonarr?.connected === false ? "API unavailable" : `${media?.sonarr?.missingCount || 0} missing episodes`}</p>
            </div>
            <div className={`status-dot ${media?.sonarr?.connected === false ? "offline" : "online"}`} />
          </div>
          <div className="card-bottom">
            <span className={media?.sonarr?.connected === false ? "bad" : "ok"}>{media?.sonarr?.connected === false ? "offline" : "online"}</span>
            <span>{media?.sonarr?.queueCount || 0} queued</span>
          </div>
        </div>

        <div className={`service-card ${media?.radarr?.connected === false ? "is-offline" : ""}`}>
          <div className="card-top">
            <div>
              <h3>Radarr</h3>
              <p>{media?.radarr?.connected === false ? "API unavailable" : `${media?.radarr?.missingCount || 0} missing movies`}</p>
            </div>
            <div className={`status-dot ${media?.radarr?.connected === false ? "offline" : "online"}`} />
          </div>
          <div className="card-bottom">
            <span className={media?.radarr?.connected === false ? "bad" : "ok"}>{media?.radarr?.connected === false ? "offline" : "online"}</span>
            <span>{media?.radarr?.queueCount || 0} queued</span>
          </div>
        </div>

        <div className={`service-card ${qbit?.connected === false ? "is-offline" : ""}`}>
          <div className="card-top">
            <div>
              <h3>qBittorrent</h3>
              <p>{qbit?.connected === false ? qbit?.error || "Downloader unavailable" : `${qbit?.counts?.downloading || 0} downloading, ${qbit?.counts?.uploading || 0} uploading`}</p>
            </div>
            <div className={`status-dot ${qbit?.connected === false ? "offline" : "online"}`} />
          </div>
          <div className="card-bottom">
            <span className={(qbit?.counts?.errored || 0) > 0 ? "bad" : "ok"}>{qbit?.counts?.errored || 0} errors</span>
            <span>{qbit?.counts?.stalled || 0} stalled</span>
          </div>
        </div>

        <div className={`service-card ${prowlarr?.connected === false ? "is-offline" : ""}`}>
          <div className="card-top">
            <div>
              <h3>Prowlarr</h3>
              <p>{prowlarr?.connected === false ? prowlarr?.error || "Indexer API unavailable" : `${prowlarr?.counts?.enabledIndexers || 0} enabled indexers`}</p>
            </div>
            <div className={`status-dot ${prowlarr?.connected === false ? "offline" : "online"}`} />
          </div>
          <div className="card-bottom">
            <span className={(prowlarr?.counts?.healthWarnings || 0) > 0 ? "bad" : "ok"}>{prowlarr?.counts?.healthWarnings || 0} warnings</span>
            <span>{prowlarr?.counts?.indexers || 0} total</span>
          </div>
        </div>

        <div className={`service-card ${tdarr?.connected === false ? "is-offline" : ""}`}>
          <div className="card-top">
            <div>
              <h3>Tdarr</h3>
              <p>{tdarr?.connected ? `Version ${tdarr.server?.version || "unknown"}` : tdarr?.error || "Transcode API unavailable"}</p>
            </div>
            <div className={`status-dot ${tdarr?.connected ? "online" : "offline"}`} />
          </div>
          <div className="card-bottom">
            <span className={(tdarr?.warnings?.length || 0) > 0 ? "bad" : "ok"}>{tdarr?.warnings?.length || 0} warnings</span>
            <span>{tdarr?.counts?.activeJobs || 0} active</span>
          </div>
        </div>

        {mediaServiceCards.map(({ name, service }) => (
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
    </section>
  );
}

function statusText(service) {
  return service?.status || "unavailable";
}

export default MediaOperations;
