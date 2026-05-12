import { useEffect, useMemo, useRef, useState } from "react";
import { SECTION_LAYOUT_EVENT, SECTION_STORAGE_PREFIX } from "./CollapsibleSection";
import { MODES, SECTIONS, applyMode, saveMode } from "./ViewModeSelector";

const SECTION_TARGETS = [
  { id: "infrastructure-ops", label: "Infrastructure Ops", keywords: "proxmox lxc vm docker ops" },
  { id: "media", label: "Media Ops", keywords: "sonarr radarr qbittorrent prowlarr plex jellyfin" },
  { id: "storage", label: "Storage Ops", keywords: "unraid array disk cache immich nextcloud" },
  { id: "ai", label: "AI Stack", keywords: "ollama openwebui n8n ai dashboard" },
  { id: "network", label: "Network Ops", keywords: "wan cloudflare tunnel dns latency" },
  { id: "platform", label: "Backend Observability", keywords: "backend frontend api health latency route platform" },
  { id: "tdarr", label: "Tdarr", keywords: "transcode workers nodes queue" },
  { id: "activity", label: "Activity", keywords: "recent events warnings critical" },
  { id: "settings", label: "Settings", keywords: "configuration connection tests json" },
  { id: "pinned", label: "Pinned Services", keywords: "favorites quick access" }
];

function setSectionState(collapsed) {
  SECTIONS.forEach(section => {
    try {
      window.localStorage?.setItem(`${SECTION_STORAGE_PREFIX}${section}`, collapsed ? "collapsed" : "expanded");
    } catch {
      // The layout event still updates mounted sections for the current session.
    }
  });

  window.dispatchEvent(new CustomEvent(SECTION_LAYOUT_EVENT, {
    detail: { mode: collapsed ? "collapsed" : "expanded" }
  }));
}

function jumpToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.location.hash = id;
  }
}

function serviceMeta(service) {
  const latency = typeof service.latency === "number" ? `${service.latency} ms` : "No response";
  return `${service.category || "Service"} - ${service.status || "unknown"} - ${latency}`;
}

function buildSearchText(action) {
  return [action.label, action.type, action.meta, action.keywords].filter(Boolean).join(" ").toLowerCase();
}

function scoreAction(action, terms) {
  const label = action.label.toLowerCase();
  const type = action.type.toLowerCase();
  const exactLabel = terms.some(term => label === term);
  const labelStarts = terms.some(term => label.startsWith(term));
  const typeBoost = type === "open" ? 3 : 0;

  if (exactLabel) return 0 - typeBoost;
  if (labelStarts) return 2 - typeBoost;
  if (terms.every(term => label.includes(term))) return 4 - typeBoost;
  return 8;
}

function openServiceLink(url) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = url;
  }
}

function CommandPalette({ services = [], navItems = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const actions = useMemo(() => {
    const navIds = new Set(navItems.map(item => item.id));
    const sectionActions = SECTION_TARGETS
      .filter(item => navIds.size === 0 || navIds.has(item.id))
      .map(item => ({
        id: `section:${item.id}`,
        type: "Jump",
        label: item.label,
        meta: "Go to section",
        keywords: item.keywords,
        run: () => jumpToSection(item.id)
      }));

    const viewModeActions = MODES.map(mode => ({
      id: `mode:${mode.id}`,
      type: "View",
      label: mode.label,
      meta: "Switch dashboard mode",
      keywords: `${mode.id} preset sections collapse expand`,
      run: () => {
        saveMode(mode.id);
        applyMode(mode);
      }
    }));

    const layoutActions = [
      {
        id: "layout:expand",
        type: "Layout",
        label: "Expand all sections",
        meta: "Show all operational sections",
        keywords: "open show sections",
        run: () => setSectionState(false)
      },
      {
        id: "layout:collapse",
        type: "Layout",
        label: "Collapse all sections",
        meta: "Compact scan mode",
        keywords: "hide compact sections",
        run: () => setSectionState(true)
      }
    ];

    const serviceActions = services
      .filter(service => service?.name && service?.url)
      .map(service => ({
        id: `service:${service.name}`,
        type: "Open",
        label: service.name,
        meta: serviceMeta(service),
        keywords: `${service.category || ""} ${service.status || ""} ${service.url || ""}`,
        run: () => openServiceLink(service.url)
      }));

    return [...sectionActions, ...viewModeActions, ...layoutActions, ...serviceActions];
  }, [navItems, services]);

  const visibleActions = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return actions.slice(0, 12);

    return actions
      .filter(action => {
        const haystack = buildSearchText(action);
        return terms.every(term => haystack.includes(term));
      })
      .sort((a, b) => scoreAction(a, terms) - scoreAction(b, terms))
      .slice(0, 12);
  }, [actions, query]);

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function closePalette() {
    setOpen(false);
  }

  function runAction(action) {
    action.run();
    closePalette();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex(index => Math.min(index + 1, Math.max(visibleActions.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(index => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && visibleActions[selectedIndex]) {
      event.preventDefault();
      runAction(visibleActions[selectedIndex]);
    }
  }

  return (
    <>
      <button className="command-trigger" type="button" onClick={() => setOpen(true)}>
        <span>Command Palette</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open && (
        <div className="command-overlay" role="presentation" onMouseDown={closePalette}>
          <section
            className="command-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onMouseDown={event => event.stopPropagation()}
          >
            <div className="command-search">
              <span>Command</span>
              <input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Jump, open, switch view..."
                aria-label="Search commands"
              />
              <kbd>Esc</kbd>
            </div>

            <div className="command-list" role="listbox" aria-label="Command results">
              {visibleActions.length === 0 && (
                <div className="command-empty">No matching commands.</div>
              )}

              {visibleActions.map((action, index) => (
                <button
                  className={index === selectedIndex ? "active" : ""}
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => runAction(action)}
                  key={action.id}
                >
                  <span className="command-kind">{action.type}</span>
                  <span>
                    <strong>{action.label}</strong>
                    <small>{action.meta}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default CommandPalette;
