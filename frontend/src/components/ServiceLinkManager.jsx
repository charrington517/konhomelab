import { useState, useEffect } from 'react';

export default function ServiceLinkManager({ configText, setConfigText }) {
  const [services, setServices] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'Other',
    enabled: true
  });

  const categories = [
    'Infrastructure',
    'Media', 
    'AI',
    'Business',
    'Storage',
    'Monitoring',
    'Network',
    'Other'
  ];

  useEffect(() => {
    try {
      const config = JSON.parse(configText);
      setServices(config.services || []);
    } catch {
      setServices([]);
    }
  }, [configText]);

  const updateConfig = (newServices) => {
    try {
      const config = JSON.parse(configText);
      config.services = newServices;
      setConfigText(JSON.stringify(config, null, 2));
    } catch (err) {
      console.error('Failed to update services:', err);
    }
  };

  const handleAddService = () => {
    if (!formData.name || !formData.url) return;
    
    const newService = {
      name: formData.name,
      url: formData.url,
      category: formData.category,
      enabled: formData.enabled
    };
    
    const newServices = [...services, newService];
    setServices(newServices);
    updateConfig(newServices);
    
    setFormData({
      name: '',
      url: '',
      category: 'Other',
      enabled: true
    });
  };

  const handleUpdateService = () => {
    if (editingIndex === -1 || !formData.name || !formData.url) return;
    
    const newServices = [...services];
    newServices[editingIndex] = {
      name: formData.name,
      url: formData.url,
      category: formData.category,
      enabled: formData.enabled
    };
    
    setServices(newServices);
    updateConfig(newServices);
    
    setEditingIndex(-1);
    setFormData({
      name: '',
      url: '',
      category: 'Other',
      enabled: true
    });
  };

  const handleRemoveService = (index) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
    updateConfig(newServices);
    
    if (editingIndex === index) {
      setEditingIndex(-1);
      setFormData({
        name: '',
        url: '',
        category: 'Other',
        enabled: true
      });
    }
  };

  const handleEditService = (index) => {
    const service = services[index];
    setEditingIndex(index);
    setFormData({
      name: service.name || '',
      url: service.url || '',
      category: service.category || 'Other',
      enabled: service.enabled !== false
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setFormData({
      name: '',
      url: '',
      category: 'Other',
      enabled: true
    });
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ marginBottom: '24px', color: '#e2e8f0' }}>Service Link Manager</h3>
      <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
        Manage your homelab service links. Changes update the JSON below - remember to save your configuration.
      </p>

      <div style={{
        padding: '24px',
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,.22)',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>
          {editingIndex === -1 ? 'Add New Service' : 'Edit Service'}
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '14px' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Service Name"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#070b10',
                border: '1px solid rgba(148,163,184,.22)',
                borderRadius: '8px',
                color: '#dbeafe',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '14px' }}>
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://service.local:8080"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#070b10',
                border: '1px solid rgba(148,163,184,.22)',
                borderRadius: '8px',
                color: '#dbeafe',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '14px' }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#070b10',
                border: '1px solid rgba(148,163,184,.22)',
                borderRadius: '8px',
                color: '#dbeafe',
                fontSize: '14px'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '14px' }}>
              Enabled
            </label>
            <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                style={{ marginRight: '8px' }}
              />
              <span style={{ color: '#e2e8f0', fontSize: '14px' }}>Show in Quick Launch</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {editingIndex === -1 ? (
            <button
              onClick={handleAddService}
              disabled={!formData.name || !formData.url}
              className="button primary"
            >
              Add Service
            </button>
          ) : (
            <>
              <button
                onClick={handleUpdateService}
                disabled={!formData.name || !formData.url}
                className="button primary"
              >
                Update Service
              </button>
              <button
                onClick={handleCancelEdit}
                className="button"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{
        padding: '24px',
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,.22)',
        borderRadius: '12px'
      }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>
          Current Services ({services.length})
        </h4>
        
        {services.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No services configured yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {services.map((service, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: '#070b10',
                  border: '1px solid rgba(148,163,184,.22)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <strong style={{ color: '#e2e8f0' }}>{service.name}</strong>
                    <span style={{
                      padding: '2px 8px',
                      background: '#1e293b',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#94a3b8'
                    }}>
                      {service.category || 'Other'}
                    </span>
                    {service.enabled === false && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#7f1d1d',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#fca5a5'
                      }}>
                        Disabled
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>{service.url}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEditService(index)}
                    className="button"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemoveService(index)}
                    className="button"
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px',
                      backgroundColor: '#7f1d1d',
                      borderColor: '#ef4444'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}