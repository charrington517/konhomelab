import { useEffect, useState } from 'react';
import axios from 'axios';
import { DEFAULT_FILTERS, filterItems, hasActiveFilters } from "../filterUtils";

export default function QuickLaunch({ services: providedServices, filters }) {
  const [loadedServices, setLoadedServices] = useState([]);

  useEffect(() => {
    if (providedServices) return;
    fetchServices();
  }, [providedServices]);

  async function fetchServices() {
    try {
      const res = await axios.get(`http://${window.location.hostname}:4000/api/services`);
      setLoadedServices(res.data);
    } catch {
      setLoadedServices([]);
    }
  }

  const priorityOrder = [
    'Proxmox',
    'Unraid',
    'AI Dashboard',
    'Grafana',
    'Sonarr',
    'Radarr',
    'qBittorrent',
    'Prowlarr',
    'Tdarr',
    'OpenWebUI',
    'n8n'
  ];

  const services = providedServices || loadedServices;
  const activeFilters = filters || DEFAULT_FILTERS;
  const visibleServices = filterItems(services, activeFilters);

  const sorted = [...visibleServices].sort((a, b) => {
    const ai = priorityOrder.indexOf(a.name);
    const bi = priorityOrder.indexOf(b.name);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <section id="quicklaunch" className="section">
      <div className="section-header">
        <div>
          <h2>Quick Launch</h2>
          <span>Fast access to core systems</span>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px'
        }}
      >
        {sorted.length === 0 && (
          <div className="empty-card">
            {hasActiveFilters(activeFilters)
              ? "No quick-launch services match the current filters."
              : "No quick-launch services available."}
          </div>
        )}

        {sorted.map((service) => (
          <a
            key={service.name}
            href={service.url}
            target="_blank"
            rel="noreferrer"
            className="service-card"
            style={{
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div className="card-top">
              <div>
                <h3>{service.name}</h3>
                <p>
                  {service.category}
                </p>
              </div>
              <div
                className={`status-dot ${
                  service.status === 'online'
                    ? 'online'
                    : 'offline'
                }`}
              />
            </div>
            <div className="card-bottom">
              <span
                className={
                  service.status === 'online'
                    ? 'ok'
                    : 'bad'
                }
              >
                {service.status}
              </span>
              <span>
                Launch
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
