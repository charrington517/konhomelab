import { useState } from "react";
import {
  copyText,
  jumpToDashboardSection,
  openExternalUrl,
  pingUrl,
  quickActionEvent
} from "../quickActions";

function normalizeActions(actions) {
  return actions.filter(action => action?.label && typeof action.run === "function");
}

export default function QuickActions({
  url,
  serviceName,
  sectionId,
  onRefresh,
  extraActions = [],
  compact = false
}) {
  const [status, setStatus] = useState("");
  const [busyAction, setBusyAction] = useState("");

  function showStatus(message) {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 1800);
  }

  async function runAction(id, action) {
    setBusyAction(id);
    try {
      await action();
    } finally {
      setBusyAction("");
    }
  }

  const actions = [
    url && {
      id: "open",
      className: "open",
      label: "Open",
      run: () => openExternalUrl(url)
    },
    url && {
      id: "copy",
      className: "copy",
      label: "Copy URL",
      run: async () => {
        const copied = await copyText(url);
        showStatus(copied ? "Copied" : "Copy unavailable");
      }
    },
    url && {
      id: "ping",
      className: "ping",
      label: "Ping",
      run: async () => {
        const reachable = await pingUrl(url);
        showStatus(reachable ? "Ping sent" : "Ping failed");
      }
    },
    {
      id: "refresh",
      className: "refresh",
      label: "Refresh",
      run: async () => {
        if (onRefresh) {
          await onRefresh();
        } else {
          window.dispatchEvent(quickActionEvent(sectionId));
        }
        showStatus("Refreshed");
      }
    },
    sectionId && {
      id: "section",
      className: "section-jump",
      label: "Section",
      run: () => jumpToDashboardSection(sectionId)
    },
    ...extraActions
  ];

  const visibleActions = normalizeActions(actions);
  if (visibleActions.length === 0) return null;

  return (
    <div
      className={`quick-actions ${compact ? "compact" : ""}`}
      aria-label={`${serviceName || "Service"} quick actions`}
    >
      {visibleActions.map(action => (
        <button
          className={`quick-action ${action.className || ""}`}
          type="button"
          onClick={() => runAction(action.id || action.label, action.run)}
          disabled={busyAction === (action.id || action.label)}
          key={action.id || action.label}
        >
          {busyAction === (action.id || action.label) ? "..." : action.label}
        </button>
      ))}
      {status && <span className="quick-action-status">{status}</span>}
    </div>
  );
}
