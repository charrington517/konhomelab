import { useState } from "react";
import { SECTION_LAYOUT_EVENT, SECTION_STORAGE_PREFIX } from "./CollapsibleSection";

const MODE_KEY = "konhomelab:view-mode";
const SECTIONS = [
  "pinned-services",
  "system-health",
  "recent-activity",
  "infrastructure-ops",
  "media-ops",
  "storage-ops",
  "ai-stack",
  "gpu-telemetry",
  "network-ops",
  "tdarr-ops"
];

const MODES = [
  {
    id: "operations",
    label: "Operations View",
    expanded: ["system-health", "recent-activity", "infrastructure-ops", "pinned-services"]
  },
  {
    id: "media",
    label: "Media View",
    expanded: ["media-ops", "tdarr-ops", "recent-activity", "pinned-services"]
  },
  {
    id: "ai",
    label: "AI View",
    expanded: ["ai-stack", "gpu-telemetry", "recent-activity", "pinned-services"]
  },
  {
    id: "storage",
    label: "Storage View",
    expanded: ["storage-ops", "system-health", "pinned-services"]
  },
  {
    id: "compact",
    label: "Compact All",
    expanded: []
  }
];

function readMode() {
  try {
    return window.localStorage?.getItem(MODE_KEY) || "operations";
  } catch {
    return "operations";
  }
}

function saveMode(modeId) {
  try {
    window.localStorage?.setItem(MODE_KEY, modeId);
  } catch {
    return false;
  }

  return true;
}

function applyMode(mode) {
  const expanded = new Set(mode.expanded);

  SECTIONS.forEach(section => {
    try {
      window.localStorage?.setItem(`${SECTION_STORAGE_PREFIX}${section}`, expanded.has(section) ? "expanded" : "collapsed");
    } catch {
      // Collapsible sections still update in-session through the event below.
    }
  });

  window.dispatchEvent(new CustomEvent(SECTION_LAYOUT_EVENT, {
    detail: { mode: mode.id }
  }));
}

function ViewModeSelector() {
  const [activeMode, setActiveMode] = useState(readMode);
  const [storageAvailable, setStorageAvailable] = useState(true);

  function selectMode(mode) {
    setActiveMode(mode.id);
    setStorageAvailable(saveMode(mode.id));
    applyMode(mode);
  }

  return (
    <section className="view-mode-bar" aria-label="Dashboard view modes">
      <div>
        <span>View Mode</span>
        <strong>{MODES.find(mode => mode.id === activeMode)?.label || "Operations View"}</strong>
      </div>

      <div className="view-mode-actions">
        {MODES.map(mode => (
          <button
            className={activeMode === mode.id ? "active" : ""}
            type="button"
            onClick={() => selectMode(mode)}
            key={mode.id}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <span className="view-mode-save">{storageAvailable ? "Saved locally" : "Session only"}</span>
    </section>
  );
}

export default ViewModeSelector;
