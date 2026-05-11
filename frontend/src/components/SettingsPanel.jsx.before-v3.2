import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SettingsPanel() {
  const [configText, setConfigText] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(true);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await axios.get(`http://${window.location.hostname}:4000/api/config`);
      setConfigText(JSON.stringify(res.data, null, 2));
      setStatus('Config loaded');
    } catch (err) {
      setStatus('Failed to load config');
    }
  }

  async function saveConfig() {
    try {
      const parsed = JSON.parse(configText);
      await axios.post(`http://${window.location.hostname}:4000/api/config`, parsed);
      setStatus('Config saved. Refresh dashboard to reload changes.');
    } catch (err) {
      setStatus(`Save failed: ${err.message}`);
    }
  }

  async function testService(type) {
    setTestResults(prev => ({ ...prev, [type]: { testing: true } }));
    try {
      const parsed = JSON.parse(configText);
      const configMap = {
        proxmox: parsed.proxmox,
        unraid: parsed.unraid,
        sonarr: parsed.media?.sonarr,
        radarr: parsed.media?.radarr,
        qbittorrent: parsed.qbittorrent,
        prowlarr: parsed.prowlarr,
        tdarr: parsed.tdarr
      };
      
      const serviceConfig = configMap[type];
      if (!serviceConfig) {
        setTestResults(prev => ({
          ...prev,
          [type]: {
            ok: false,
            message: `No config found for ${type}`
          }
        }));
        return;
      }
      
      const res = await axios.post(`http://${window.location.hostname}:4000/api/test-service`, {
        type,
        config: serviceConfig
      });
      setTestResults(prev => ({ ...prev, [type]: res.data }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [type]: {
          ok: false,
          message: err.message
        }
      }));
    }
  }

  const services = [
    { key: 'proxmox', name: 'Proxmox' },
    { key: 'unraid', name: 'Unraid' },
    { key: 'sonarr', name: 'Sonarr' },
    { key: 'radarr', name: 'Radarr' },
    { key: 'qbittorrent', name: 'qBittorrent' },
    { key: 'prowlarr', name: 'Prowlarr' },
    { key: 'tdarr', name: 'Tdarr' }
  ];

  return (
    <section id="settings" className="section">
      <div className="section-header">
        <div>
          <h2>Settings</h2>
          <span>Dashboard configuration and service management</span>
        </div>
        <button className="button" onClick={() => setOpen(!open)}>
          {open ? 'Close Settings' : 'Open Settings'}
        </button>
      </div>

      {open && (
        <div className="service-card" style={{ minHeight: 'auto' }}>
          <div className="card-top">
            <div>
              <h3>Configuration Management</h3>
              <p>
                Edit configuration and test service connections.
                Backups are created automatically on every save.
              </p>
            </div>
            <div className="status-dot online" />
          </div>

          {/* Connection Test Buttons */}
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ marginBottom: '12px', color: '#e2e8f0' }}>Connection Tests</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px',
              marginBottom: '24px'
            }}>
              {services.map(service => {
                const result = testResults[service.key];
                return (
                  <button
                    key={service.key}
                    className="button"
                    onClick={() => testService(service.key)}
                    disabled={result?.testing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: result?.ok === true ? '#065f46' : 
                                     result?.ok === false ? '#7f1d1d' : '#1e293b'
                    }}
                  >
                    <span>Test {service.name}</span>
                    <div 
                      className={`status-dot ${
                        result?.testing ? 'offline' : 
                        result?.ok === true ? 'online' : 
                        result?.ok === false ? 'offline' : ''
                      }`}
                      style={{ marginLeft: '8px' }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Test Results */}
            {Object.keys(testResults).length > 0 && (
              <div style={{ 
                background: '#0f172a', 
                border: '1px solid rgba(148,163,184,.22)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h4 style={{ marginBottom: '12px', color: '#e2e8f0' }}>Test Results</h4>
                {Object.entries(testResults).map(([key, result]) => (
                  <div key={key} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '8px',
                    color: result.ok ? '#10b981' : '#ef4444'
                  }}>
                    <strong style={{ minWidth: '100px' }}>
                      {services.find(s => s.key === key)?.name}:
                    </strong>
                    <span style={{ marginLeft: '12px' }}>
                      {result.testing ? 'Testing...' : result.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* JSON Editor */}
          <div>
            <h4 style={{ marginBottom: '12px', color: '#e2e8f0' }}>Raw Configuration</h4>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
              Masked secrets must be replaced with real values before saving if changed.
            </p>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              spellCheck="false"
              style={{
                width: '100%',
                minHeight: '400px',
                background: '#070b10',
                color: '#dbeafe',
                border: '1px solid rgba(148,163,184,.22)',
                borderRadius: '16px',
                padding: '18px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                resize: 'vertical'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '18px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <button className="button primary" onClick={saveConfig}>
              Save Config
            </button>
            <button className="button" onClick={loadConfig}>
              Reload
            </button>
            <span style={{ color: '#94a3b8' }}>
              {status}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}