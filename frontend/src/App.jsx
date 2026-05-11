import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AlertCenter from "./components/AlertCenter";
import TdarrPanel from "./components/TdarrPanel";
import QuickLaunch from "./components/QuickLaunch";
import SettingsPanel from "./components/SettingsPanel";
import GpuTelemetry from "./components/GpuTelemetry";
import GlobalFilterBar from "./components/GlobalFilterBar";
import HeaderSummaryBar from "./components/HeaderSummaryBar";
import PinnedServices from "./components/PinnedServices";
import ViewModeSelector from "./components/ViewModeSelector";
import SystemHealthOverview from "./components/SystemHealthOverview";
import RecentActivity from "./components/RecentActivity";
import AiStackOverview from "./components/AiStackOverview";
import InfrastructureOperations from "./components/InfrastructureOperations";
import MediaOperations from "./components/MediaOperations";
import StorageOperations from "./components/StorageOperations";
import NetworkOperations from "./components/NetworkOperations";
import { DEFAULT_FILTERS, filterItems, filteredCountLabel, hasActiveFilters } from "./filterUtils";

const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:4000/api/services"
  : `http://${window.location.hostname}:4000/api/services`;

const BASE_NAV_ITEMS = [
  { id: "overview", label: "Overview", short: "OV" },
  { id: "pinned", label: "Pinned", short: "PN" },
  { id: "activity", label: "Activity", short: "AC" },
  { id: "infrastructure-ops", label: "Ops", short: "OP" },
  { id: "alerts", label: "Alerts", short: "AL" },
  { id: "quicklaunch", label: "Quick Launch", short: "QL" },
  { id: "proxmox", label: "Proxmox", short: "PX" },
  { id: "unraid", label: "Unraid", short: "UR" },
  { id: "media", label: "Media Ops", short: "MO" },
  { id: "storage", label: "Storage Ops", short: "SO" },
  { id: "network", label: "Network Ops", short: "NO" },
  { id: "tdarr", label: "Tdarr", short: "TD" },
  { id: "gpu", label: "GPU", short: "GP" },
  { id: "settings", label: "Settings", short: "ST" },
  { id: "ai", label: "AI Stack", short: "AI" },
  { id: "monitoring", label: "Monitoring", short: "MN" }
];

function App() {
  const [services, setServices] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [proxmox, setProxmox] = useState(null);
  const [gpuSummary, setGpuSummary] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    fetchServices();
    const timer = setInterval(fetchServices, 15000);
    return () => clearInterval(timer);
  }, []);

  async function fetchServices() {
    try {
      const res = await axios.get(API_URL);
      setServices(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
      
      const pve = await axios.get(`http://${window.location.hostname}:4000/api/proxmox/summary`);
      setProxmox(pve.data);

      try {
        const gpu = await axios.get(`http://${window.location.hostname}:4000/api/gpu/summary`);
        setGpuSummary(gpu.data);
      } catch {
        setGpuSummary({ enabled: false });
      }
    } catch {
      setServices([]);
    }
  }

  const navItems = useMemo(() => {
    return BASE_NAV_ITEMS.filter(item => item.id !== "gpu" || gpuSummary?.enabled);
  }, [gpuSummary]);

  useEffect(() => {
    const updateActiveSection = () => {
      let current = "overview";

      navItems.forEach(item => {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= 150) {
          current = item.id;
        }
      });

      setActiveSection(current);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [navItems]);

  const groups = useMemo(() => {
    return {
      Infrastructure: filterItems(services.filter(s => s.category === "Infrastructure"), filters),
      Business: filterItems(services.filter(s => s.category === "Business"), filters),
      Monitoring: filterItems(services.filter(s => s.category === "Monitoring"), filters)
    };
  }, [services, filters]);

  const online = services.filter(s => s.status === "online").length;
  const offline = services.filter(s => s.status === "offline").length;
  const filteredServices = useMemo(() => filterItems(services, filters), [services, filters]);

  return (
    <div className="app-shell compact-ops">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">KH</div>
          <div>
            <div className="brand-title">KONHOMELAB</div>
            <div className="brand-subtitle">Command Center</div>
          </div>
        </div>

        <nav className="nav" aria-label="Dashboard sections">
          {navItems.map(item => (
            <a
              href={`#${item.id}`}
              className={activeSection === item.id ? "active" : ""}
              aria-current={activeSection === item.id ? "page" : undefined}
              key={item.id}
            >
              <span className="nav-icon">{item.short}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>System Mode</div>
          <strong>Operations</strong>
          <div className="status-legend" aria-label="Service status legend">
            <span><i className="legend-dot online"></i>Online</span>
            <span><i className="legend-dot offline"></i>Offline</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>KonHomeLab Command Center</h1>
            <p>Infrastructure, media automation, AI systems, and monitoring in one control plane.</p>
          </div>
          <div className="timebox">
            <span>Last scan</span>
            <strong>{lastUpdated || "Starting..."}</strong>
          </div>
        </header>

        <HeaderSummaryBar services={services} lastUpdated={lastUpdated} />

        <ViewModeSelector />

        <GlobalFilterBar
          filters={filters}
          onChange={setFilters}
          totalServices={services.length}
          visibleServices={filteredServices.length}
        />

        <section id="overview" className="status-grid">
          <Metric title="Services Online" value={online} label="Healthy endpoints" />
          <Metric title="Offline" value={offline} label="Needs attention" danger={offline > 0} />
          <Metric title="Total Services" value={services.length} label="Tracked systems" />
          <Metric title="Refresh" value="15s" label="Automatic health scan" />
        </section>

        <PinnedServices services={services} filters={filters} />

        <SystemHealthOverview />

        <RecentActivity />

        <InfrastructureOperations filters={filters} />

        <section className="hero-panel">
          <div>
            <h2>Operations Overview</h2>
            <p>
              This is the first real command-center layer. Service cards are live links and health checks.
              Next upgrades can pull real Proxmox, Unraid, Sonarr, Radarr, Tdarr, and GPU stats.
            </p>
          </div>
          <div className="hero-actions">
            <a href="/#" className="button primary">Open Overview</a>
            <a href="http://192.168.0.200" target="_blank" className="button">AI Dashboard</a>
          </div>
        </section>

        <AlertCenter />

        <QuickLaunch services={services} filters={filters} />

        <GpuTelemetry summary={gpuSummary} />

        <AiStackOverview services={services} filters={filters} />

        <MediaOperations services={services} filters={filters} />

        <StorageOperations services={services} filters={filters} />

        <NetworkOperations services={services} filters={filters} />

        <SettingsPanel />

        {proxmox && proxmox.enabled && (
          <section id="proxmox" className="section">
            <div className="section-header">
              <h2>Proxmox Live Status</h2>
              <span>{proxmox.error ? "Connection error" : "API connected"}</span>
            </div>

            {proxmox.error ? (
              <div className="empty-card">{proxmox.error}</div>
            ) : (
              <>
                <div className="status-grid">
                  <Metric title="Nodes" value={proxmox.counts.nodes} label="Proxmox hosts" />
                  <Metric title="VMs" value={proxmox.counts.vms} label={`${proxmox.counts.runningVms} running`} />
                  <Metric title="LXCs" value={proxmox.counts.lxc} label={`${proxmox.counts.runningLxc} running`} />
                  <Metric title="Storage Pools" value={proxmox.storage.length} label="Tracked by Proxmox" />
                </div>

              <div className="cards">
                {filterItems(proxmox.nodes, filters).map(node => (
                  <div className="service-card" key={node.name}>
                      <div className="card-top">
                        <div>
                          <h3>{node.name}</h3>
                          <p>CPU {node.cpu}% • RAM {node.memoryPercent}% • Disk {node.diskPercent}%</p>
                        </div>
                        <div className={`status-dot ${node.status === "online" ? "online" : "offline"}`}></div>
                      </div>
                      <div className="card-bottom">
                        <span className={node.status === "online" ? "ok" : "bad"}>{node.status}</span>
                        <span>Node</span>
                      </div>
                    </div>
                  ))}
                  {hasActiveFilters(filters) && filterItems(proxmox.nodes, filters).length === 0 && (
                    <div className="empty-card">No Proxmox nodes match the current filters.</div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        <TdarrPanel />

        {Object.entries(groups).map(([group, items]) => {
          const sectionId = group.toLowerCase().replace(/\s+/g, '-');
          return (
            <section id={sectionId} className="section" key={group}>
              <div className="section-header">
                <h2>{group}</h2>
                <span>{filteredCountLabel(services.filter(s => s.category === group).length, items.length)}</span>
              </div>

              <div className="cards">
                {items.length === 0 && (
                  <div className="empty-card">
                    {hasActiveFilters(filters)
                      ? "No services match the current filters."
                      : "No services configured in this category yet."}
                  </div>
                )}

                {items.map(service => (
                  <a
                    className={`service-card ${service.status === "offline" ? "is-offline" : ""}`}
                    href={service.url}
                    target="_blank"
                    rel="noreferrer"
                    key={service.name}
                  >
                    <div className="card-top">
                      <div>
                        <h3>{service.name}</h3>
                        <p>{service.url}</p>
                      </div>
                      <div className={`status-dot ${service.status}`}></div>
                    </div>

                    <div className="card-bottom">
                      <span className={service.status === "online" ? "ok" : "bad"}>
                        {service.status || "unknown"}
                      </span>
                      <span>{service.latency ? `${service.latency} ms` : "No response"}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

function Metric({ title, value, label, danger }) {
  return (
    <div className={`metric ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

export default App;
