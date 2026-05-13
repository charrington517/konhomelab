const TREND_KEY = "konhomelab:trend-history";
const MAX_SAMPLES = 80;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

const HEALTHY_STATES = new Set(["healthy", "online", "info", "ok", "clear", "running"]);
const WARNING_STATES = new Set(["warning", "high", "medium", "low", "unavailable", "offline", "failed", "critical"]);

function now() {
  return Date.now();
}

function readHistory() {
  try {
    const stored = window.localStorage?.getItem(TREND_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function writeHistory(history) {
  try {
    window.localStorage?.setItem(TREND_KEY, JSON.stringify(history));
    return true;
  } catch {
    return false;
  }
}

function formatDuration(ms) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function transitions(samples) {
  return samples.reduce((count, sample, index) => {
    if (index === 0) return count;
    return samples[index - 1].state === sample.state ? count : count + 1;
  }, 0);
}

function currentStreak(samples, state) {
  let startedAt = samples[samples.length - 1]?.ts || now();

  for (let index = samples.length - 1; index >= 0; index -= 1) {
    if (samples[index].state !== state) break;
    startedAt = samples[index].ts;
  }

  return now() - startedAt;
}

export function updateTrend(key, state) {
  const normalized = String(state || "unknown").toLowerCase();
  const timestamp = now();
  const history = readHistory();
  const samples = [
    ...(history[key] || []),
    { state: normalized, ts: timestamp }
  ]
    .filter(sample => timestamp - sample.ts <= MAX_AGE_MS)
    .slice(-MAX_SAMPLES);

  history[key] = samples;
  writeHistory(history);

  const recentTransitions = transitions(samples.slice(-8));
  const streakMs = currentStreak(samples, normalized);
  const previous = samples[samples.length - 2]?.state;
  const recurring = samples.slice(-8).filter(sample => sample.state === normalized).length >= 3;
  const healthy = HEALTHY_STATES.has(normalized);

  if (recentTransitions >= 3) {
    return { state: "flapping", label: "flapping", duration: formatDuration(streakMs) };
  }

  if (healthy) {
    if (previous && WARNING_STATES.has(previous)) {
      return { state: "improving", label: `improving ${formatDuration(streakMs)}`, duration: formatDuration(streakMs) };
    }

    return { state: "stable", label: `stable ${formatDuration(streakMs)}`, duration: formatDuration(streakMs) };
  }

  if (recurring || streakMs >= 10 * 60 * 1000) {
    return { state: "persistent", label: `${normalized} persistent`, duration: formatDuration(streakMs) };
  }

  return { state: "degraded", label: `${normalized} ${formatDuration(streakMs)}`, duration: formatDuration(streakMs) };
}

export function trendSummary() {
  const history = readHistory();
  const keys = Object.keys(history);
  const active = keys.filter(key => (history[key] || []).length > 0);

  return {
    tracked: active.length,
    samples: active.reduce((total, key) => total + history[key].length, 0)
  };
}
