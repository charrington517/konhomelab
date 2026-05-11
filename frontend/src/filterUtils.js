export const DEFAULT_FILTERS = {
  query: "",
  status: "all",
  category: "all"
};

const HEALTHY_STATUSES = new Set(["online", "healthy", "running", "started", "available", "disk_ok"]);
const OFFLINE_STATUSES = new Set(["offline", "unavailable", "stopped", "exited", "false"]);
const CRITICAL_TERMS = ["critical", "invalid", "error", "failed", "problem"];
const WARNING_TERMS = ["warning", "warn", "stalled", "missing", "queued"];

export function hasActiveFilters(filters) {
  return Boolean(filters.query) || filters.status !== "all" || filters.category !== "all";
}

export function filterItems(items, filters) {
  return items.filter(item => matchesFilter(item, filters));
}

export function matchesFilter(item, filters) {
  const text = searchableText(item);
  const statusText = statusValue(item);

  if (filters.query && !text.includes(filters.query.toLowerCase())) {
    return false;
  }

  if (filters.category !== "all" && !text.includes(filters.category.toLowerCase())) {
    return false;
  }

  if (filters.status !== "all" && classifyStatus(item, statusText) !== filters.status) {
    return false;
  }

  return true;
}

export function filteredCountLabel(total, visible) {
  return total === visible ? `${total} shown` : `${visible} of ${total} shown`;
}

function searchableText(item) {
  return [
    item.name,
    item.title,
    item.detail,
    item.source,
    item.url,
    item.category,
    item.type,
    item.node,
    item.image,
    item.group,
    item.status,
    item.state,
    item.severity,
    item.text
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function statusValue(item) {
  if (item.severity) return String(item.severity).toLowerCase();
  if (item.status !== undefined) return String(item.status).toLowerCase();
  if (item.state !== undefined) return String(item.state).toLowerCase();
  if (item.connected === false || item.reachable === false) return "offline";
  if (item.connected === true || item.reachable === true) return "online";
  return "";
}

function classifyStatus(item, statusText) {
  const text = searchableText(item);

  if (item.critical || statusText === "critical" || CRITICAL_TERMS.some(term => statusText.includes(term))) {
    return "critical";
  }

  if (item.warning || statusText === "warning" || WARNING_TERMS.some(term => statusText.includes(term))) {
    return "warning";
  }

  if (OFFLINE_STATUSES.has(statusText)) {
    return "offline";
  }

  if (HEALTHY_STATUSES.has(statusText)) {
    return "healthy";
  }

  if (CRITICAL_TERMS.some(term => text.includes(term))) {
    return "critical";
  }

  if (WARNING_TERMS.some(term => text.includes(term))) {
    return "warning";
  }

  return "healthy";
}
