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
      setTdarr({ enabled: true, connected: false, error: "Tdarr request failed" });
    }
  }

  if (!tdarr?.enabled) {
    return null;
  }

  return (
    <section id="tdarr" className="section">
      <div className="section-header">
        <div>
          <h2>Tdarr Operations</h2>
          <span>Transcoding, workers, and media processing</span>
        </div>
      </div>

      <div className="status-grid">
        <Metric
          title="Tdarr API"
          value={tdarr.connected ? "Live" : "Off"}
          label="Server connection"
          danger={!tdarr.connected}
        />

        <Metric
          title="Warnings"
          value={tdarr.warnings?.length || 0}
          label="Endpoint issues"
          danger={(tdarr.warnings?.length || 0) > 0}
        />

        <Metric
          title="Nodes"
          value={
            Array.isArray(tdarr.nodes)
              ? tdarr.nodes.length
              : tdarr.nodes?.length || "Check"
          }
          label="Worker visibility"
        />

        <Metric
          title="Status"
          value={tdarr.connected ? "Ready" : "Setup"}
          label="Processing layer"
        />
      </div>

      <div className="cards">
        <div className="service-card">
          <div className="card-top">
            <div>
              <h3>Tdarr Server</h3>
              <p>{tdarr.error || "Media transcoding control plane"}</p>
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

        {tdarr.warnings?.map(warning => (
          <div className="service-card" key={warning}>
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
