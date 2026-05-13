import { useEffect, useRef, useState } from "react";
import axios from "axios";
import CollapsibleSection from "./CollapsibleSection";
import { sortByPriority, withPriority } from "../alertPriority";
import { updateTrend } from "../trendUtils";
import OperatorNote from "./OperatorNote";

const API_BASE = `http://${window.location.hostname}:4000/api`;

function normalizeDiskStatus(status) {
  return String(status || "unknown").replace("DISK_", "").toLowerCase();
}

function eventKey(event) {
  return `${event.source}-${event.severity}-${event.title}-${event.detail}`;
}

function addEvent(events, severity, source, title, detail, timestamp, priority) {
  const event = withPriority({ severity, source, title, detail, timestamp, priority });
  events.push({
    ...event,
    trend: updateTrend(`event:${source}:${title}`, severity)
  });
}

function buildEvents({ services, proxmox, unraid, media, qbit, prowlarr, tdarr, gpu, platform, previousStatuses, timestamp }) {
  const events = [];
  const currentStatuses = {};

  services.forEach(service => {
    currentStatuses[service.name] = service.status;
    const previous = previousStatuses.current[service.name];

    if (previous && previous !== service.status) {
      addEvent(
        events,
        service.status === "online" ? "info" : "warning",
        service.name,
        `Service ${service.status === "online" ? "came online" : "went offline"}`,
        `${service.category || "Service"} endpoint changed from ${previous} to ${service.status}`,
        timestamp
      );
    } else if (!previous && service.status === "offline") {
      addEvent(
        events,
        "warning",
        service.name,
        "Service unavailable",
        `${service.category || "Service"} endpoint is currently offline`,
        timestamp
      );
    }
  });

  previousStatuses.current = currentStatuses;

  if (proxmox?.enabled && proxmox.error) {
    addEvent(events, "critical", "Proxmox", "Proxmox API unavailable", proxmox.error, timestamp);
  }

  proxmox?.guests
    ?.filter(guest => guest.status !== "running")
    .slice(0, 8)
    .forEach(guest => {
      addEvent(
        events,
        "warning",
        "Proxmox",
        `${guest.type} stopped: ${guest.name}`,
        `Node ${guest.node || "unknown"} / ID ${guest.id}`,
        timestamp
      );
    });

  if (unraid?.enabled && unraid.error) {
    addEvent(events, "critical", "Unraid", "Unraid API unavailable", unraid.error, timestamp);
  }

  if (unraid?.array?.state && unraid.array.state !== "STARTED") {
    addEvent(events, "critical", "Unraid", `Array state: ${unraid.array.state}`, "Array is not in the normal STARTED state", timestamp);
  }

  unraid?.array?.disks
    ?.filter(disk => disk.status !== "DISK_OK")
    .forEach(disk => {
      addEvent(
        events,
        "critical",
        "Unraid",
        `${disk.name} disk warning`,
        `${normalizeDiskStatus(disk.status)}${disk.temp ? ` / ${disk.temp}C` : ""}`,
        timestamp
      );
    });

  unraid?.docker?.containers
    ?.filter(container => container.state !== "RUNNING")
    .slice(0, 8)
    .forEach(container => {
      addEvent(
        events,
        "warning",
        "Unraid Docker",
        `${container.name} exited`,
        container.image || "Container is not running",
        timestamp
      );
    });

  if (media?.sonarr?.connected === false) {
    addEvent(events, "warning", "Sonarr", "Sonarr unavailable", media.sonarr.error || "Could not connect", timestamp);
  }

  if ((media?.sonarr?.healthWarnings || 0) > 0) {
    addEvent(
      events,
      "warning",
      "Sonarr",
      `${media.sonarr.healthWarnings} health warnings`,
      `${media.sonarr.missingCount || 0} missing episodes / ${media.sonarr.queueCount || 0} queued`,
      timestamp
    );
  }

  if (media?.radarr?.connected === false) {
    addEvent(events, "warning", "Radarr", "Radarr unavailable", media.radarr.error || "Could not connect", timestamp);
  }

  if ((media?.radarr?.healthWarnings || 0) > 0) {
    addEvent(
      events,
      "warning",
      "Radarr",
      `${media.radarr.healthWarnings} health warnings`,
      `${media.radarr.missingCount || 0} missing movies / ${media.radarr.queueCount || 0} queued`,
      timestamp
    );
  }

  if (qbit?.connected === false) {
    addEvent(events, "warning", "qBittorrent", "qBittorrent unavailable", qbit.error || "Login/API setup needed", timestamp);
  }

  if ((qbit?.counts?.errored || 0) > 0) {
    addEvent(events, "critical", "qBittorrent", `${qbit.counts.errored} torrents errored`, `${qbit.counts.stalled || 0} stalled torrents`, timestamp);
  }

  if ((qbit?.counts?.stalled || 0) > 0) {
    addEvent(events, "warning", "qBittorrent", `${qbit.counts.stalled} torrents stalled`, `${qbit.counts.downloading || 0} downloading`, timestamp);
  }

  if (prowlarr?.connected === false) {
    addEvent(events, "warning", "Prowlarr", "Prowlarr unavailable", prowlarr.error || "API setup needed", timestamp);
  }

  if ((prowlarr?.counts?.healthWarnings || 0) > 0) {
    addEvent(events, "warning", "Prowlarr", `${prowlarr.counts.healthWarnings} indexer warnings`, `${prowlarr.counts.enabledIndexers || 0} enabled indexers`, timestamp);
  }

  if (tdarr?.connected === false) {
    addEvent(events, "warning", "Tdarr", "Tdarr unavailable", tdarr.error || "API endpoint unavailable", timestamp);
  }

  tdarr?.warnings?.forEach(warning => {
    addEvent(events, "warning", "Tdarr", "Tdarr endpoint warning", warning, timestamp);
  });

  if (gpu?.enabled === false) {
    addEvent(events, "warning", "GPU", "GPU unavailable", "No local GPU source is currently available", timestamp, "high");
  }

  if (platform?.routes?.some?.(route => route.ok === false)) {
    const failed = platform.routes.filter(route => route.ok === false).length;
    addEvent(events, "critical", "Platform", `${failed} API routes failed`, "Dashboard platform route health needs attention", timestamp);
  }

  return sortByPriority(Array.from(new Map(events.map(event => [eventKey(event), event])).values()))
    .slice(0, 16);
}

export default function RecentActivity() {
  const [events, setEvents] = useState([]);
  const [lastScan, setLastScan] = useState("");
  const previousStatuses = useRef({});

  useEffect(() => {
    fetchEvents();
    const timer = setInterval(fetchEvents, 15000);
    return () => clearInterval(timer);
  }, []);

  async function safeGet(path) {
    try {
      const res = await axios.get(`${API_BASE}${path}`);
      return res.data;
    } catch {
      return null;
    }
  }

  async function fetchEvents() {
    const timestamp = new Date().toLocaleTimeString();
    const [services, proxmox, unraid, media, qbit, prowlarr, tdarr, gpu, platform] = await Promise.all([
      safeGet("/services"),
      safeGet("/proxmox/summary"),
      safeGet("/unraid/summary"),
      safeGet("/media/summary"),
      safeGet("/qbit/summary"),
      safeGet("/prowlarr/summary"),
      safeGet("/tdarr/summary"),
      safeGet("/gpu/summary"),
      safeGet("/platform/summary")
    ]);

    setEvents(buildEvents({
      services: Array.isArray(services) ? services : [],
      proxmox,
      unraid,
      media,
      qbit,
      prowlarr,
      tdarr,
      gpu,
      platform,
      previousStatuses,
      timestamp
    }));
    setLastScan(timestamp);
  }

  const critical = events.filter(event => event.severity === "critical").length;
  const warnings = events.filter(event => event.severity === "warning").length;
  const highPriority = events.filter(event => event.priority === "high").length;

  return (
    <CollapsibleSection
      id="activity"
      sectionKey="recent-activity"
      className="recent-activity"
      title="Recent Activity"
      subtitle="Generated from current summaries and in-session service changes"
      meta={lastScan ? `Last scan ${lastScan}` : "Scanning..."}
    >
      <div className="activity-summary">
        <span><strong>{events.length}</strong> events</span>
        <span><strong>{critical}</strong> critical</span>
        <span><strong>{highPriority}</strong> high priority</span>
        <span><strong>{warnings}</strong> warnings</span>
      </div>

      <div className="activity-feed">
        {events.length === 0 ? (
          <div className="activity-empty">No recent operational events detected.</div>
        ) : (
          events.map((event, index) => (
            <div className={`activity-row ${event.severity} priority-${event.priority || "info"}`} key={`${eventKey(event)}-${index}`}>
              <span className={`priority-badge ${event.priority || "info"}`}>{event.priorityLabel || "Info"}</span>
              <div className="activity-main">
                <div className="activity-title">
                  <strong>{event.title}</strong>
                  <span>{event.source} / {event.severity}</span>
                </div>
                <p>{event.detail}</p>
                <OperatorNote noteKey={`event:${event.source}:${event.title}`} label={`${event.source} event`} />
              </div>
              <time>
                {event.timestamp}
                <span className={`trend-chip ${event.trend?.state || "stable"}`}>{event.trend?.label || "stable"}</span>
              </time>
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}
