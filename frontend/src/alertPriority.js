export const PRIORITIES = {
  critical: { label: "Critical", rank: 0 },
  high: { label: "High", rank: 1 },
  medium: { label: "Medium", rank: 2 },
  low: { label: "Low", rank: 3 },
  info: { label: "Info", rank: 4 }
};

const SOURCE_WEIGHT = {
  Proxmox: 0,
  Unraid: 1,
  "Unraid Docker": 2,
  Platform: 3,
  GPU: 4,
  qBittorrent: 5,
  Sonarr: 6,
  Radarr: 7,
  Prowlarr: 8,
  Tdarr: 9
};

export function priorityForAlert(item = {}) {
  const text = `${item.source || ""} ${item.title || ""} ${item.detail || ""}`.toLowerCase();

  if (item.level === "critical" || item.severity === "critical") {
    return text.includes("torrent") ? "high" : "critical";
  }

  if (text.includes("api unavailable") || text.includes("failed endpoint") || text.includes("api routes failed")) {
    return "critical";
  }

  if (text.includes("disk") || text.includes("parity") || text.includes("array state")) {
    return "critical";
  }

  if (text.includes("exited") || text.includes("stopped:")) {
    return "high";
  }

  if (text.includes("gpu unavailable") || text.includes("unavailable gpu")) {
    return "high";
  }

  if (text.includes("unavailable") || text.includes("went offline") || text.includes("errored")) {
    return "high";
  }

  if (text.includes("stalled") || text.includes("health warning") || text.includes("indexer warning")) {
    return "medium";
  }

  if (text.includes("endpoint warning") || text.includes("polling") || text.includes("404")) {
    return "low";
  }

  if (item.level === "warning" || item.severity === "warning") {
    return "medium";
  }

  return "info";
}

export function withPriority(item) {
  const priority = item.priority || priorityForAlert(item);

  return {
    ...item,
    priority,
    priorityLabel: PRIORITIES[priority]?.label || "Info",
    priorityRank: PRIORITIES[priority]?.rank ?? PRIORITIES.info.rank
  };
}

export function sortByPriority(items) {
  return [...items].sort((a, b) => {
    const left = a.priorityRank ?? PRIORITIES[a.priority]?.rank ?? PRIORITIES.info.rank;
    const right = b.priorityRank ?? PRIORITIES[b.priority]?.rank ?? PRIORITIES.info.rank;
    const sourceLeft = SOURCE_WEIGHT[a.source] ?? 50;
    const sourceRight = SOURCE_WEIGHT[b.source] ?? 50;

    return left - right || sourceLeft - sourceRight || String(a.source || "").localeCompare(String(b.source || ""));
  });
}
