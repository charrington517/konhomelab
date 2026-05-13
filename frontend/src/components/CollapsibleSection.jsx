import { useEffect, useState } from "react";
import { getWorkspaceSectionState, saveWorkspaceSectionState } from "../workspaceState";

const STORAGE_PREFIX = "konhomelab:section:";
export const SECTION_STORAGE_PREFIX = STORAGE_PREFIX;
export const SECTION_LAYOUT_EVENT = "konhomelab:section-layout";

function readCollapsed(sectionKey) {
  try {
    const workspaceState = getWorkspaceSectionState(sectionKey);
    const saved = workspaceState || window.localStorage?.getItem(`${STORAGE_PREFIX}${sectionKey}`);
    return saved === "collapsed";
  } catch {
    return false;
  }
}

function saveCollapsed(sectionKey, collapsed) {
  try {
    const state = collapsed ? "collapsed" : "expanded";
    window.localStorage?.setItem(`${STORAGE_PREFIX}${sectionKey}`, state);
    saveWorkspaceSectionState(sectionKey, state);
    return true;
  } catch {
    return false;
  }
}

function CollapsibleSection({ id, sectionKey, className = "", title, subtitle, meta, children }) {
  const key = sectionKey || id || title.toLowerCase().replace(/\s+/g, "-");
  const [collapsed, setCollapsed] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    setCollapsed(readCollapsed(key));
  }, [key]);

  useEffect(() => {
    function syncLayout(event) {
      if (!event.detail || !event.detail.key || event.detail.key === key) {
        setCollapsed(readCollapsed(key));
      }
    }

    window.addEventListener(SECTION_LAYOUT_EVENT, syncLayout);
    return () => window.removeEventListener(SECTION_LAYOUT_EVENT, syncLayout);
  }, [key]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    setStorageAvailable(saveCollapsed(key, next));
  }

  return (
    <section id={id} className={`section collapsible-section ${collapsed ? "is-collapsed" : ""} ${className}`}>
      <div className="section-header collapsible-header">
        <button
          className="collapse-toggle"
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls={`${key}-content`}
        >
          <span className="collapse-indicator">{collapsed ? "+" : "-"}</span>
          <span>
            <strong>{title}</strong>
            {subtitle && <small>{subtitle}</small>}
          </span>
        </button>
        <span>{meta || (storageAvailable ? "Layout saved" : "Session only")}</span>
      </div>

      {!collapsed && (
        <div id={`${key}-content`} className="collapsible-content">
          {children}
        </div>
      )}
    </section>
  );
}

export default CollapsibleSection;
