import { useMemo } from "react";
import CollapsibleSection from "./CollapsibleSection";

function Metric({ title, value, label, danger, tone }) {
  return (
    <div className={`metric ${tone || ""} ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function SystemHealthOverview({ systems = [], lastScan = "" }) {
  const counts = useMemo(() => {
    return systems.reduce((next, system) => {
      next[system.status] += 1;
      return next;
    }, {
      healthy: 0,
      warning: 0,
      critical: 0,
      unavailable: 0
    });
  }, [systems]);

  return (
    <CollapsibleSection
      id="system-health"
      sectionKey="system-health"
      className="health-overview"
      title="System Health Overview"
      subtitle="Compact read-only status across core lab services"
      meta={lastScan ? `Last scan ${lastScan}` : "Scanning..."}
    >
      <div className="status-grid">
        <Metric title="Healthy" value={counts.healthy} label="No action needed" />
        <Metric title="Warnings" value={counts.warning} label="Watch list" tone={counts.warning > 0 ? "warning" : ""} />
        <Metric title="Critical" value={counts.critical} label="Needs attention" danger={counts.critical > 0} />
        <Metric title="Unavailable" value={counts.unavailable} label="Offline or disabled" danger={counts.unavailable > 0} />
      </div>

      <div className="health-strip">
        {systems.map(system => (
          <div className={`health-pill ${system.status}`} key={system.name}>
            <span className={`legend-dot ${system.status}`}></span>
            <strong>{system.name}</strong>
            <span>{system.status}</span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export default SystemHealthOverview;
