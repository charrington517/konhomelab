import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CollapsibleSection from "./CollapsibleSection";
import packageInfo from "../../package.json";

const API_BASE = `http://${window.location.hostname}:4000/api`;
const ENDPOINTS = [
  { name: "Services", path: "/services" },
  { name: "Proxmox", path: "/proxmox/summary" },
  { name: "Unraid", path: "/unraid/summary" },
  { name: "Media", path: "/media/summary" },
  { name: "qBittorrent", path: "/qbit/summary" },
  { name: "Prowlarr", path: "/prowlarr/summary" },
  { name: "Tdarr", path: "/tdarr/summary" },
  { name: "GPU", path: "/gpu/summary" },
  { name: "Network", path: "/network/summary" }
];

function Metric({ title, value, label, danger, tone }) {
  return (
    <div className={`metric ${tone || ""} ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function latencyLabel(value) {
  return typeof value === "number" ? `${value} ms` : "N/A";
}

async function timedGet(path) {
  const started = performance.now();

  try {
    const response = await axios.get(`${API_BASE}${path}`, {
      timeout: 8000,
      validateStatus: () => true
    });

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      latency: Math.round(performance.now() - started)
    };
  } catch (error) {
    return {
      ok: false,
      status: "error",
      latency: Math.round(performance.now() - started),
      error: error.message
    };
  }
}

function commitText(value) {
  return value ? String(value).slice(0, 7) : "unavailable";
}

function BackendObservability() {
  const [platform, setPlatform] = useState(null);
  const [checks, setChecks] = useState([]);
  const [lastSuccess, setLastSuccess] = useState("");

  useEffect(() => {
    fetchPlatform();
    const timer = setInterval(fetchPlatform, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchPlatform() {
    const platformCheck = await timedGet("/platform/summary");
    const endpointResults = await Promise.all(ENDPOINTS.map(async endpoint => ({
      ...endpoint,
      ...(await timedGet(endpoint.path))
    })));

    if (platformCheck.ok) {
      try {
        const response = await axios.get(`${API_BASE}/platform/summary`, { timeout: 5000 });
        setPlatform(response.data);
        setLastSuccess(new Date().toLocaleTimeString());
      } catch {
        setPlatform({
          enabled: true,
          backend: { online: false, version: "unknown", commit: null }
        });
      }
    } else {
      setPlatform({
        enabled: true,
        backend: { online: false, version: "unknown", commit: null }
      });
    }

    setChecks([
      { name: "Platform", path: "/platform/summary", ...platformCheck },
      ...endpointResults
    ]);
  }

  const summary = useMemo(() => {
    const successful = checks.filter(check => check.ok);
    const failed = checks.length - successful.length;
    const latencies = successful.map(check => check.latency).filter(value => typeof value === "number");
    const averageLatency = latencies.length
      ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
      : null;

    return {
      successful: successful.length,
      failed,
      total: checks.length,
      averageLatency
    };
  }, [checks]);

  const backendOnline = platform?.backend?.online !== false && checks.some(check => check.name === "Platform" && check.ok);
  const frontendOnline = true;
  const hasFailures = summary.failed > 0;

  return (
    <CollapsibleSection
      id="platform"
      sectionKey="platform-observability"
      title="Backend Observability"
      subtitle="Read-only dashboard platform, API route, and refresh health"
      meta={lastSuccess ? `Last success ${lastSuccess}` : "Scanning..."}
    >
      <div className="status-grid">
        <Metric
          title="Backend"
          value={backendOnline ? "Online" : "Off"}
          label={`v${platform?.backend?.version || "unknown"} / ${commitText(platform?.backend?.commit)}`}
          danger={!backendOnline}
        />
        <Metric
          title="Frontend"
          value={frontendOnline ? "Online" : "Off"}
          label={`v${packageInfo.version || "unknown"} / commit unavailable`}
        />
        <Metric
          title="API Routes"
          value={`${summary.successful}/${summary.total || ENDPOINTS.length + 1}`}
          label={`${summary.failed} failed endpoints`}
          danger={hasFailures}
        />
        <Metric
          title="Avg API"
          value={latencyLabel(summary.averageLatency)}
          label={lastSuccess ? `Last refresh ${lastSuccess}` : "No successful refresh yet"}
          danger={summary.averageLatency !== null && summary.averageLatency >= 1000}
          tone={summary.averageLatency !== null && summary.averageLatency >= 500 ? "warning" : ""}
        />
      </div>

      <div className="cards">
        {checks.length === 0 && (
          <div className="empty-card">Platform observability scan is starting.</div>
        )}

        {checks.map(check => (
          <div className={`service-card ${check.ok ? "" : "is-offline"}`} key={check.name}>
            <div className="card-top">
              <div>
                <h3>{check.name}</h3>
                <p>{check.path}</p>
              </div>
              <div className={`status-dot ${check.ok ? "online" : "offline"}`} />
            </div>

            <div className="card-bottom">
              <span className={check.ok ? "ok" : "bad"}>{check.ok ? "healthy" : "failed"}</span>
              <span>{check.status} / {latencyLabel(check.latency)}</span>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export default BackendObservability;
