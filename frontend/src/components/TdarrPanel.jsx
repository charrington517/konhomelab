import { useState, useEffect } from "react";
import axios from "axios";

function Metric({ title, value, label, danger }) {
  return (
    <div className={`metric ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function safeCount(value) {
  return typeof value === "number" ? value : 0;
}

function TdarrPanel() {
  const [tdarr, setTdarr] = useState(null);

  useEffect(() => {
    fetchTdarr();
    const timer = setInterval(fetchTdarr, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchTdarr() {
    try {
      const tdarrRes = await axios.get(`http://${window.location.hostname}:4000/api/tdarr/summary`);
      setTdarr(tdarrRes.data);
    } catch {
      setTdarr({
        enabled: true,
        connected: false,
        warnings: ["Tdarr request failed"],
        counts: {
          nodes: 0,
          workers: 0,
          activeWorkers: 0,
          activeJobs: 0,
          queueDepth: 0
        }
      });
    }
  }

  if (!tdarr?.enabled) {
    return null;
  }

  const counts = tdarr.counts || {};
  const warnings = tdarr.warnings || [];
  const version = tdarr.server?.version || "Unknown";
  const uptime = tdarr.server?.uptime
    ? `${Math.floor(tdarr.server.uptime / 3600)}h`
    : "Unavailable";

  return (
    <section id="tdarr" className="section">
      <div className="section-header">
        <div>
          <h2>Tdarr Operations</h2>
          <span>Read-only server, worker, queue, and transcode telemetry</span>
        </div>
      </div>

      <div className="status-grid">
        <Metric
          title="Tdarr API"
          value={tdarr.connected ? "Live" : "Off"}
          label={`Version ${version}`}
          danger={!tdarr.connected}
        />

        <Metric
          title="Nodes"
          value={safeCount(counts.nodes)}
          label={`${safeCount(counts.workers)} workers visible`}
        />

        <Metric
          title="Active"
          value={safeCount(counts.activeWorkers)}
          label={`${safeCount(counts.activeJobs)} jobs/transcodes`}
        />

        <Metric
          title="Queue"
          value={safeCount(counts.queueDepth)}
          label="Items waiting if exposed"
          danger={safeCount(counts.queueDepth) > 0}
        />
      </div>

      <div className="cards">
        <div className="service-card">
          <div className="card-top">
            <div>
              <h3>Tdarr Server</h3>
              <p>
                {tdarr.connected
                  ? `Server status ${tdarr.server?.status || "good"} - uptime ${uptime}`
                  : tdarr.error || "Tdarr server status unavailable"}
              </p>
            </div>
            <div className={`status-dot ${tdarr.connected ? "online" : "offline"}`} />
          </div>

          <div className="card-bottom">
            <span className={tdarr.connected ? "ok" : "bad"}>
              {tdarr.connected ? "connected" : "offline"}
            </span>
            <span>API v2</span>
          </div>
        </div>

        {warnings.map(warning => (
          <div className="service-card is-offline" key={warning}>
            <div className="card-top">
              <div>
                <h3>Endpoint Warning</h3>
                <p>{warning}</p>
              </div>
              <div className="status-dot offline" />
            </div>

            <div className="card-bottom">
              <span className="bad">warning</span>
              <span>Tdarr</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TdarrPanel;
