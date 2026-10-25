import React, { useState } from 'react';
import { Users, Plus, Phone, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { api } from '../lib/api';

export function Contacts({ contacts = [], onRefresh, onBack }) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);
  const [relationship, setRelationship] = useState('Family');
  const [loading, setLoading] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setWhatsapp(true);
    setRelationship('Family');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setWhatsapp(!!c.whatsapp);
    setRelationship(c.relationship || 'Family');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    setLoading(true);
    try {
      if (editingId) {
        await api.updateContact(editingId, { name, phone, whatsapp, relationship });
      } else {
        await api.createContact({ name, phone, whatsapp, relationship });
      }
      setShowModal(false);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this emergency contact?')) return;
    try {
      await api.deleteContact(id);
      onRefresh();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="screen-container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
              Trusted Contacts
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              People alerted during SOS or unexpected stops ({contacts.length} saved)
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={openAdd}
            style={{ minHeight: '38px', padding: '6px 14px', fontSize: '13px' }}
          >
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {contacts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Users size={40} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
            <p style={{ fontWeight: 600 }}>No emergency contacts saved yet.</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Add at least one contact so SafeSakhi can notify them during emergencies.
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>
                    {contact.name}
                  </h3>
                  {contact.relationship && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--text)',
                        fontWeight: 700
                      }}
                    >
                      {contact.relationship}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} /> {contact.phone}
                  </span>
                  {contact.whatsapp && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#128C7E', fontWeight: 600 }}>
                      <MessageSquare size={13} /> WhatsApp Active
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="icon-btn"
                  onClick={() => openEdit(contact)}
                  title="Edit contact"
                  style={{ width: '40px', height: '40px' }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => handleDelete(contact.id)}
                  title="Delete contact"
                  style={{ width: '40px', height: '40px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {onBack && (
        <button
          className="btn btn-outline"
          onClick={onBack}
          style={{ width: '100%', marginTop: '20px' }}
        >
          Back to Safety Dashboard
        </button>
      )}

      {/* Add / Edit Contact Modal */}
      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>
              {editingId ? 'Edit Contact' : 'Add Emergency Contact'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rohan Sharma"
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
                  placeholder="+91XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Relationship</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Brother, Mother, Friend, Colleague"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="whatsapp-cb"
                  checked={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="whatsapp-cb" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                  Also send alerts via WhatsApp
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
