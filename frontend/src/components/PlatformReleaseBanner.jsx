import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import packageInfo from "../../package.json";

const API_BASE = `http://${window.location.hostname}:4000/api`;
const RELEASE_LABEL = "v6.1";
const DOC_SYNC_LABEL = "Docs synced through v6.1";

function shortCommit(value) {
  return value ? String(value).slice(0, 7) : "unavailable";
}

function formatStarted(value) {
  if (!value) return "unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unavailable";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function PlatformReleaseBanner() {
  const [platform, setPlatform] = useState(null);
  const [available, setAvailable] = useState(false);
  const [lastChecked, setLastChecked] = useState("");

  useEffect(() => {
    fetchPlatform();
    const timer = setInterval(fetchPlatform, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchPlatform() {
    try {
      const response = await axios.get(`${API_BASE}/platform/summary`, { timeout: 5000 });
      setPlatform(response.data);
      setAvailable(true);
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setPlatform(null);
      setAvailable(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  }

  const state = useMemo(() => {
    const backendOnline = available && platform?.backend?.online !== false;
    const frontendOnline = true;
    const routeCount = platform?.api?.routeCount || platform?.api?.routes?.length || 0;

    return {
      backendOnline,
      frontendOnline,
      routeCount,
      tone: backendOnline ? "healthy" : "critical",
      version: platform?.backend?.version || packageInfo.version || "unknown",
      commit: shortCommit(platform?.backend?.commit),
      deployed: formatStarted(platform?.backend?.startedAt)
    };
  }, [available, platform]);

  return (
    <section className={`platform-release-banner ${state.tone}`} aria-label="Platform release status">
      <div className="platform-release-title">
        <span className={`legend-dot ${state.tone}`}></span>
        <strong>KONHOMELAB Platform</strong>
        <span>{RELEASE_LABEL}</span>
      </div>

      <div className="platform-release-items">
        <span><strong>Frontend</strong> {state.frontendOnline ? "online" : "offline"}</span>
        <span><strong>Backend</strong> {state.backendOnline ? "online" : "offline"}</span>
        <span><strong>Version</strong> {state.version} / {state.commit}</span>
        <span><strong>Deploy</strong> {state.deployed}</span>
        <span><strong>API</strong> {state.routeCount || "N/A"} routes</span>
        <span><strong>Docs</strong> {DOC_SYNC_LABEL}</span>
        <span><strong>Checked</strong> {lastChecked || "starting"}</span>
      </div>
    </section>
  );
}

export default PlatformReleaseBanner;
