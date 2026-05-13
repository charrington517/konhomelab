import { useMemo } from "react";
import { summarizeSystemHealth } from "../healthUtils";

export default function HeaderSummaryBar({ services = [], lastUpdated, systems = [] }) {
  const summary = useMemo(() => {
    return summarizeSystemHealth(systems, services);
  }, [services, systems]);

  return (
    <section className={`summary-bar ${summary.tone}`} aria-label="Operational summary">
      <div className="summary-state">
        <span className={`legend-dot ${summary.tone}`}></span>
        <strong>{summary.label}</strong>
        <span>System state</span>
      </div>

      <div className="summary-items">
        <span><strong>{summary.critical}</strong> critical</span>
        <span><strong>{summary.warning}</strong> warnings</span>
        <span><strong>{summary.offlineUnavailable}</strong> offline/unavailable</span>
        <span><strong>{summary.totalServices}</strong> services</span>
        <span><strong>{lastUpdated || "Starting..."}</strong> refreshed</span>
      </div>
    </section>
  );
}
