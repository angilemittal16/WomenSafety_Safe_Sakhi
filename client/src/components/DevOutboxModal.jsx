import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Trash2, Send, CheckCheck } from 'lucide-react';
import { api } from '../lib/api';

export function DevOutboxModal({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOutbox = async () => {
    setLoading(true);
    try {
      const data = await api.getDevOutbox();
      setMessages(data.messages || []);
    } catch (e) {
      console.warn('Could not fetch outbox:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await api.clearDevOutbox();
    setMessages([]);
  };

  useEffect(() => {
    fetchOutbox();
    const interval = setInterval(fetchOutbox, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="outbox-title">
      <div className="modal-content" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 id="outbox-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
              SMS & WhatsApp Outbox
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Simulated message delivery console ({messages.length} messages)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="icon-btn" onClick={fetchOutbox} title="Refresh">
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
            </button>
            <button className="icon-btn" onClick={handleClear} title="Clear Outbox">
              <Trash2 size={18} />
            </button>
            <button className="icon-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Send size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p>No messages sent yet.</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                Trigger SOS or Journey to observe instant SMS dispatches here.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--primary)',
                      color: '#FFFFFF'
                    }}
                  >
                    {msg.channel} {msg.mocked ? '(MOCK)' : '(TWILIO)'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                  To: {msg.to}
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text)',
                    backgroundColor: 'var(--surface)',
                    padding: '10px',
                    borderRadius: '8px',
                    wordBreak: 'break-word',
                    lineHeight: 1.4
                  }}
                >
                  {msg.body}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--primary-dark)', fontWeight: 600 }}>
                  <CheckCheck size={14} /> Delivered
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
