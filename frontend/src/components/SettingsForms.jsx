import { useState, useEffect } from 'react';

export default function SettingsForms({ configText, setConfigText }) {
  const [formData, setFormData] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());

  // Parse config when configText changes
  useEffect(() => {
    try {
      const config = JSON.parse(configText);
      setFormData(config);
    } catch {
      setFormData({});
    }
  }, [configText]);

  // Update configText when form changes
  const updateConfig = (path, value, fieldName) => {
    try {
      const config = JSON.parse(configText);
      
      // Navigate to nested object
      const keys = path.split('.');
      let current = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      // Only update if value changed and isn't masked
      if (value !== '********' && value !== '') {
        current[keys[keys.length - 1]] = value;
        setChangedFields(prev => new Set([...prev, fieldName]));
      } else if (value === '' && changedFields.has(fieldName)) {
        // Allow clearing fields that were previously changed
        current[keys[keys.length - 1]] = '';
      }
      
      setConfigText(JSON.stringify(config, null, 2));
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  const handleInputChange = (path, fieldName) => (e) => {
    const value = e.target.value;
    updateConfig(path, value, fieldName);
  };

  const getFieldValue = (path) => {
    try {
      const keys = path.split('.');
      let current = formData;
      for (const key of keys) {
        if (current && typeof current === 'object') {
          current = current[key];
        } else {
          return '';
        }
      }
      return current || '';
    } catch {
      return '';
    }
  };

  const FormField = ({ label, path, type = 'text', placeholder, required = false }) => {
    const fieldName = path.replace(/\./g, '_');
    const value = getFieldValue(path);
    const isSecret = type === 'password' || label.toLowerCase().includes('secret') || label.toLowerCase().includes('key');
    const displayValue = isSecret && value && !changedFields.has(fieldName) ? '********' : value;

    return (
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          color: '#e2e8f0',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <input
          type={type}
          value={displayValue}
          onChange={handleInputChange(path, fieldName)}
          placeholder={placeholder || (isSecret ? 'Enter new value to change' : '')}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#0f172a',
            border: '1px solid rgba(148,163,184,.22)',
            borderRadius: '8px',
            color: '#dbeafe',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
      </div>
    );
  };

  const FormSection = ({ title, children }) => (
    <div style={{ 
      marginBottom: '32px',
      padding: '24px',
      background: '#0f172a',
      border: '1px solid rgba(148,163,184,.22)',
      borderRadius: '12px'
    }}>
      <h4 style={{ 
        margin: '0 0 20px 0',
        color: '#e2e8f0',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        {title}
      </h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ marginBottom: '24px', color: '#e2e8f0' }}>Service Configuration</h3>
      <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
        Configure your homelab services below. Existing secrets are masked for security - only enter new values to change them.
      </p>

      <FormSection title="Infrastructure">
        <div>
          <FormField 
            label="Proxmox URL" 
            path="proxmox.url" 
            placeholder="https://proxmox.local:8006"
            required
          />
          <FormField 
            label="Proxmox Token ID" 
            path="proxmox.tokenId" 
            placeholder="user@pam!token-name"
            required
          />
          <FormField 
            label="Proxmox Token Secret" 
            path="proxmox.tokenSecret" 
            type="password"
            required
          />
        </div>
        <div>
          <FormField 
            label="Unraid URL" 
            path="unraid.url" 
            placeholder="http://unraid.local"
            required
          />
          <FormField 
            label="Unraid API Key" 
            path="unraid.apiKey" 
            type="password"
            required
          />
        </div>
      </FormSection>

      <FormSection title="Media Automation">
        <div>
          <FormField 
            label="Sonarr URL" 
            path="media.sonarr.url" 
            placeholder="http://sonarr.local:8989"
          />
          <FormField 
            label="Sonarr API Key" 
            path="media.sonarr.apiKey" 
            type="password"
          />
        </div>
        <div>
          <FormField 
            label="Radarr URL" 
            path="media.radarr.url" 
            placeholder="http://radarr.local:7878"
          />
          <FormField 
            label="Radarr API Key" 
            path="media.radarr.apiKey" 
            type="password"
          />
        </div>
      </FormSection>

      <FormSection title="Downloads & Indexers">
        <div>
          <FormField 
            label="qBittorrent URL" 
            path="qbittorrent.url" 
            placeholder="http://qbittorrent.local:8080"
          />
          <FormField 
            label="qBittorrent Username" 
            path="qbittorrent.username" 
            placeholder="admin"
          />
          <FormField 
            label="qBittorrent Password" 
            path="qbittorrent.password" 
            type="password"
          />
        </div>
        <div>
          <FormField 
            label="Prowlarr URL" 
            path="prowlarr.url" 
            placeholder="http://prowlarr.local:9696"
          />
          <FormField 
            label="Prowlarr API Key" 
            path="prowlarr.apiKey" 
            type="password"
          />
        </div>
      </FormSection>

      <FormSection title="Media Processing">
        <div>
          <FormField 
            label="Tdarr URL" 
            path="tdarr.url" 
            placeholder="http://tdarr.local:8265"
          />
        </div>
      </FormSection>

      {changedFields.size > 0 && (
        <div style={{
          padding: '12px 16px',
          background: '#065f46',
          border: '1px solid #10b981',
          borderRadius: '8px',
          color: '#d1fae5',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          <strong>Changes detected:</strong> {Array.from(changedFields).join(', ')}
          <br />
          <em>Remember to save your configuration to apply changes.</em>
        </div>
      )}
    </div>
  );
}
