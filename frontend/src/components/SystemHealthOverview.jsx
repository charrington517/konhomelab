import { useMemo } from "react";
import CollapsibleSection from "./CollapsibleSection";
import { withPriority } from "../alertPriority";
import { updateTrend } from "../trendUtils";

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
  const prioritizedSystems = useMemo(() => (
    systems.map(system => withPriority({
      ...system,
      severity: system.status === "critical" ? "critical" : system.status === "warning" || system.status === "unavailable" ? "warning" : "info",
      title: `${system.name} ${system.status}`,
      detail: system.status
    })).map(system => ({
      ...system,
      trend: updateTrend(`health:${system.name}`, system.status)
    }))
  ), [systems]);

  const counts = useMemo(() => {
    return prioritizedSystems.reduce((next, system) => {
      next[system.status] += 1;
      return next;
    }, {
      healthy: 0,
      warning: 0,
      critical: 0,
      unavailable: 0
    });
  }, [prioritizedSystems]);

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
        {prioritizedSystems.map(system => (
          <div className={`health-pill ${system.status}`} key={system.name}>
            <span className={`legend-dot ${system.status}`}></span>
            <strong>{system.name}</strong>
            <span>{system.status}</span>
            {system.status !== "healthy" && <em className={`priority-chip ${system.priority}`}>{system.priorityLabel}</em>}
            <em className={`trend-chip ${system.trend?.state || "stable"}`}>{system.trend?.label || "stable"}</em>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export default SystemHealthOverview;
