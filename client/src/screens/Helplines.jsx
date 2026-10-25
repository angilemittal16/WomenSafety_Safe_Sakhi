import React, { useState, useEffect } from 'react';
import { Phone, Train, Bus, Car, Footprints, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { triggerHaptic } from '../lib/haptics';

export function Helplines({ onTriggerSos }) {
  const [helplines, setHelplines] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [mode, setMode] = useState('Walking');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHelplines = async () => {
    try {
      const data = await api.getHelplines();
      setHelplines(data || []);
    } catch (e) {
      console.warn('Could not fetch helplines:', e);
    }
  };

  useEffect(() => {
    fetchHelplines();
  }, []);

  const handleAddHelpline = async (e) => {
    e.preventDefault();
    if (!name || !number) return;
    setLoading(true);
    try {
      await api.createHelpline({ name, number, mode, city });
      setName('');
      setNumber('');
      setCity('');
      setShowAddModal(false);
      fetchHelplines();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this custom helpline?')) return;
    try {
      await api.deleteHelpline(id);
      fetchHelplines();
    } catch (e) {
      alert(e.message);
    }
  };

  // Group helplines by mode
  const modes = [
    { key: 'Emergency', title: 'Emergency Response', icon: ShieldAlert },
    { key: 'Walking', title: 'Walking / Street Safety', icon: Footprints },
    { key: 'Railway', title: 'Railway & Metro Security', icon: Train },
    { key: 'Bus', title: 'Bus & Public Transit', icon: Bus },
    { key: 'Cab', title: 'Cab & Highway Transit', icon: Car }
  ];

  return (
    <div className="screen-container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
            Immediate Helplines
          </h2>
          <button
            className="btn btn-light"
            onClick={() => setShowAddModal(true)}
            style={{ minHeight: '38px', padding: '6px 12px', fontSize: '13px' }}
          >
            <Plus size={16} /> Add City Number
          </button>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Tap any button to connect immediately. Grouped by your mode of transit.
        </p>
      </div>

      {modes.map((m) => {
        const Icon = m.icon;
        const items = helplines.filter(
          (h) => (h.mode || '').toLowerCase() === m.key.toLowerCase()
        );

        if (items.length === 0) return null;

        return (
          <div key={m.key} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon size={18} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>
                {m.title}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item) => (
                <div
                  key={item.id || item.number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <a
                    href={`tel:${item.number}`}
                    onClick={() => triggerHaptic(80)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--primary)',
                      color: '#FFFFFF',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>
                        {item.name} {item.city ? `(${item.city})` : ''}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        {item.is_national ? 'National Free Helpline' : 'Local Support'}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '15px',
                        fontWeight: 900
                      }}
                    >
                      <Phone size={16} /> {item.number}
                    </div>
                  </a>

                  {!item.is_national && item.id && (
                    <button
                      className="icon-btn"
                      onClick={() => handleDelete(item.id)}
                      title="Remove helpline"
                      style={{ width: '44px', height: '44px', flexShrink: 0 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add City Helpline Modal */}
      {showAddModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
              Add Local or City Helpline
            </h3>
            <form onSubmit={handleAddHelpline}>
              <div className="form-group">
                <label className="form-label">Helpline Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Delhi Metro Security / Local Police"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 011-23456789 or 100"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transit Mode</label>
                <select
                  className="form-select"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="Walking">Walking / Street</option>
                  <option value="Railway">Railway & Metro</option>
                  <option value="Bus">Bus & Public Transit</option>
                  <option value="Cab">Cab & Highway</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">City (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mumbai, Delhi, Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Save Helpline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
