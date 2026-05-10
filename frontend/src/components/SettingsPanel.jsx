import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SettingsPanel() {
  const [configText, setConfigText] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);

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
              <h3>services.json Editor</h3>
              <p>
                Edit carefully. A backup is created automatically on every save.
                Masked secrets must be replaced with real values before saving if changed.
              </p>
            </div>
            <div className="status-dot online" />
          </div>

          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            spellCheck="false"
            style={{
              width: '100%',
              minHeight: '520px',
              marginTop: '24px',
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
