import { useEffect, useState } from "react";

const STORAGE_PREFIX = "konhomelab:section:";

function readCollapsed(sectionKey) {
  try {
    return window.localStorage?.getItem(`${STORAGE_PREFIX}${sectionKey}`) === "collapsed";
  } catch {
    return false;
  }
}

function saveCollapsed(sectionKey, collapsed) {
  try {
    window.localStorage?.setItem(`${STORAGE_PREFIX}${sectionKey}`, collapsed ? "collapsed" : "expanded");
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
