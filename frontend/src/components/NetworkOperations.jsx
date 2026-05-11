import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = `http://${window.location.hostname}:4000/api`;
const NETWORK_TERMS = [
  "router",
  "switch",
  "gateway",
  "dns",
  "pihole",
  "pi-hole",
  "adguard",
  "cloudflare",
  "tunnel",
  "uptime kuma",
  "prometheus",
  "grafana"
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

function isNetworkService(service) {
  const text = `${service.name} ${service.url} ${service.category}`.toLowerCase();
  return NETWORK_TERMS.some(term => text.includes(term));
}

function latencyLabel(value) {
  return typeof value === "number" ? `${value} ms` : "No response";
}

function statusClass(status) {
  return status === "online" || status === true ? "online" : "offline";
}

function NetworkOperations({ services }) {
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    fetchNetwork();
    const timer = setInterval(fetchNetwork, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchNetwork() {
    try {
      const res = await axios.get(`${API_BASE}/network/summary`);
      setNetwork(res.data);
    } catch {
      setNetwork({
        enabled: true,
        wan: { name: "WAN", reachable: false, latency: null, error: "Network summary unavailable" },
        cloudflareTunnel: { name: "Cloudflare Tunnel", reachable: false, latency: null, error: "Network summary unavailable" },
        warnings: ["Network summary unavailable"]
      });
    }
  }

  const networkServices = useMemo(() => {
    return services.filter(isNetworkService);
  }, [services]);

  const latencyValues = services
    .map(service => service.latency)
    .filter(value => typeof value === "number");
  const averageLatency = latencyValues.length
    ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
    : null;
  const slowServices = services.filter(service => typeof service.latency === "number" && service.latency >= 150);
  const offlineNetworkServices = networkServices.filter(service => service.status !== "online");
  const warningCount = (network?.warnings?.length || 0) + slowServices.length + offlineNetworkServices.length;

  return (
    <section id="network" className="section">
      <div className="section-header">
        <div>
          <h2>Network Operations</h2>
          <span>Read-only WAN, tunnel, DNS, monitoring, and service latency visibility</span>
        </div>
      </div>

      <div className="status-grid">
        <Metric
          title="WAN"
          value={network?.wan?.reachable ? "Online" : "Off"}
          label={latencyLabel(network?.wan?.latency)}
          danger={!network?.wan?.reachable}
        />
        <Metric
          title="Tunnel"
          value={network?.cloudflareTunnel?.reachable ? "Online" : "Off"}
          label={latencyLabel(network?.cloudflareTunnel?.latency)}
          danger={!network?.cloudflareTunnel?.reachable}
        />
        <Metric
          title="Avg Latency"
          value={averageLatency !== null ? `${averageLatency} ms` : "N/A"}
          label={`${latencyValues.length} services reporting`}
          danger={averageLatency !== null && averageLatency >= 150}
        />
        <Metric
          title="Warnings"
          value={warningCount}
          label="Unreachable or slow"
          danger={warningCount > 0}
        />
      </div>

      <div className="cards">
        {[network?.wan, network?.cloudflareTunnel].filter(Boolean).map(target => (
          <div className={`service-card ${target.reachable ? "" : "is-offline"}`} key={target.name}>
            <div className="card-top">
              <div>
                <h3>{target.name}</h3>
                <p>{target.url || target.error || "Reachability check"}</p>
              </div>
              <div className={`status-dot ${statusClass(target.reachable)}`} />
            </div>
            <div className="card-bottom">
              <span className={target.reachable ? "ok" : "bad"}>{target.reachable ? "online" : "offline"}</span>
              <span>{latencyLabel(target.latency)}</span>
            </div>
          </div>
        ))}

        {networkServices.length === 0 && (
          <div className="empty-card">No router, switch, DNS, or network monitoring services configured yet.</div>
        )}

        {networkServices.map(service => (
          <a
            className={`service-card ${service.status !== "online" ? "is-offline" : ""}`}
            href={service.url}
            target="_blank"
            rel="noreferrer"
            key={service.name}
          >
            <div className="card-top">
              <div>
                <h3>{service.name}</h3>
                <p>{service.url}</p>
              </div>
              <div className={`status-dot ${statusClass(service.status)}`} />
            </div>
            <div className="card-bottom">
              <span className={service.status === "online" ? "ok" : "bad"}>{service.status || "unknown"}</span>
              <span>{latencyLabel(service.latency)}</span>
            </div>
          </a>
        ))}
      </div>

      <div className="section-header compact-header">
        <div>
          <h2>Service Response Times</h2>
          <span>Existing health-check latency from configured services</span>
        </div>
      </div>

      <div className="health-strip">
        {services.map(service => (
          <div className={`health-pill ${service.status === "online" ? "healthy" : "critical"}`} key={service.name}>
            <span className={`legend-dot ${statusClass(service.status)}`}></span>
            <strong>{service.name}</strong>
            <span>{latencyLabel(service.latency)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NetworkOperations;
