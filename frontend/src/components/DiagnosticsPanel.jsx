import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import packageInfo from "../../package.json";
import CollapsibleSection, { SECTION_STORAGE_PREFIX } from "./CollapsibleSection";
import { MODE_KEY, MODES, SECTIONS } from "./ViewModeSelector";
import { trendSummary } from "../trendUtils";

const API_BASE = `http://${window.location.hostname}:4000/api`;
const PINNED_KEY = "konhomelab:pinned-services";
const ERROR_KEY = "konhomelab:error-boundary-events";

const ENDPOINTS = [
  "/platform/summary",
  "/services",
  "/proxmox/summary",
  "/unraid/summary",
  "/media/summary",
  "/qbit/summary",
  "/prowlarr/summary",
  "/tdarr/summary",
  "/gpu/summary",
  "/network/summary"
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

function readStorageStatus() {
  try {
    const key = "konhomelab:diagnostics-test";
    window.localStorage?.setItem(key, "ok");
    window.localStorage?.removeItem(key);
    return { available: true, label: "Available" };
  } catch {
    return { available: false, label: "Session only" };
  }
}

function readJson(key, fallback) {
  try {
    const value = window.localStorage?.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readText(key, fallback = "") {
  try {
    return window.localStorage?.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function safeTime(value) {
  return value || "Unavailable";
}

function DiagnosticsPanel({ lastUpdated = "" }) {
  const [platform, setPlatform] = useState(null);
  const [endpointSummary, setEndpointSummary] = useState({
    total: ENDPOINTS.length,
    healthy: 0,
    failed: 0,
    lastSuccess: ""
  });
  const [runtimeState, setRuntimeState] = useState({
    storage: { available: false, label: "Checking" },
    viewMode: "operations",
    collapsedCount: 0,
    pinnedCount: 0,
    trends: { tracked: 0, samples: 0 },
    errors: { count: 0, lastTimestamp: "" }
  });

  useEffect(() => {
    refreshDiagnostics();
    const timer = setInterval(refreshDiagnostics, 30000);
    window.addEventListener("storage", refreshRuntimeState);
    window.addEventListener("konhomelab:view-mode", refreshRuntimeState);
    window.addEventListener("konhomelab:section-layout", refreshRuntimeState);
    window.addEventListener("konhomelab:error-boundary", refreshRuntimeState);

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", refreshRuntimeState);
      window.removeEventListener("konhomelab:view-mode", refreshRuntimeState);
      window.removeEventListener("konhomelab:section-layout", refreshRuntimeState);
      window.removeEventListener("konhomelab:error-boundary", refreshRuntimeState);
    };
  }, []);

  async function refreshDiagnostics() {
    refreshRuntimeState();

    try {
      const [platformResult, endpointResults] = await Promise.all([
        axios.get(`${API_BASE}/platform/summary`, { timeout: 5000 }).catch(() => null),
        Promise.allSettled(ENDPOINTS.map(path => axios.get(`${API_BASE}${path}`, {
          timeout: 7000,
          validateStatus: () => true
        })))
      ]);

      if (platformResult?.data) {
        setPlatform(platformResult.data);
      }

      const healthy = endpointResults.filter(result => (
        result.status === "fulfilled"
        && result.value.status >= 200
        && result.value.status < 300
      )).length;

      setEndpointSummary({
        total: ENDPOINTS.length,
        healthy,
        failed: ENDPOINTS.length - healthy,
        lastSuccess: healthy > 0 ? new Date().toLocaleTimeString() : ""
      });
    } catch {
      setEndpointSummary(current => ({
        ...current,
        failed: current.total,
        healthy: 0
      }));
    }
  }

  function refreshRuntimeState() {
    const storage = readStorageStatus();
    const viewMode = readText(MODE_KEY, "operations");
    const pinned = readJson(PINNED_KEY, []);
    const errors = readJson(ERROR_KEY, { count: 0, lastTimestamp: "" });
    const trends = trendSummary();
    const collapsedCount = SECTIONS.filter(section => (
      readText(`${SECTION_STORAGE_PREFIX}${section}`) === "collapsed"
    )).length;

    setRuntimeState({
      storage,
      viewMode,
      collapsedCount,
      pinnedCount: Array.isArray(pinned) ? pinned.length : 0,
      trends,
      errors: {
        count: Number(errors.count) || 0,
        lastTimestamp: errors.lastTimestamp || ""
      }
    });
  }

  const activeModeLabel = useMemo(() => (
    MODES.find(mode => mode.id === runtimeState.viewMode)?.label || "Operations View"
  ), [runtimeState.viewMode]);

  const backendOnline = platform?.backend?.online !== false && endpointSummary.healthy > 0;
  const hasEndpointFailures = endpointSummary.failed > 0;

  return (
    <CollapsibleSection
      id="diagnostics"
      sectionKey="diagnostics"
      className="diagnostics-panel"
      title="Diagnostics"
      subtitle="Safe read-only runtime state for troubleshooting"
      meta={endpointSummary.lastSuccess ? `Last check ${endpointSummary.lastSuccess}` : "Checking"}
    >
      <div className="status-grid">
        <Metric
          title="Frontend"
          value={`v${packageInfo.version || "unknown"}`}
          label="Build metadata available"
        />
        <Metric
          title="Backend"
          value={backendOnline ? "Online" : "Off"}
          label={`v${platform?.backend?.version || "unknown"}`}
          danger={!backendOnline}
        />
        <Metric
          title="API Summary"
          value={`${endpointSummary.healthy}/${endpointSummary.total}`}
          label={`${endpointSummary.failed} failed endpoints`}
          danger={hasEndpointFailures}
        />
        <Metric
          title="Storage"
          value={runtimeState.storage.label}
          label={runtimeState.storage.available ? "Browser state writable" : "Local state unavailable"}
          danger={!runtimeState.storage.available}
        />
      </div>

      <div className="diagnostics-grid">
        <div className="diagnostic-row">
          <span>Last service fetch</span>
          <strong>{safeTime(lastUpdated)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Last API success</span>
          <strong>{safeTime(endpointSummary.lastSuccess)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>View mode</span>
          <strong>{activeModeLabel}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Collapsed sections</span>
          <strong>{runtimeState.collapsedCount}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Pinned services</span>
          <strong>{runtimeState.pinnedCount}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Error boundary events</span>
          <strong>{runtimeState.errors.count}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Trend history</span>
          <strong>{runtimeState.trends.tracked} tracked</strong>
        </div>
        <div className="diagnostic-row">
          <span>Trend samples</span>
          <strong>{runtimeState.trends.samples}</strong>
        </div>
        <div className="diagnostic-row wide">
          <span>Last boundary error</span>
          <strong>{safeTime(runtimeState.errors.lastTimestamp)}</strong>
        </div>
        <div className="diagnostic-row wide">
          <span>Backend commit</span>
          <strong>{platform?.backend?.commit ? String(platform.backend.commit).slice(0, 7) : "Unavailable"}</strong>
        </div>
      </div>
    </CollapsibleSection>
  );
}

export default DiagnosticsPanel;
