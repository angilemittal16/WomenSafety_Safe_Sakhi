import React from 'react';
import { Image, FileText, Link, Copy, ShieldCheck } from 'lucide-react';
import { getToken } from '../lib/api';

export function ThumbGrid({ items = [], onSelect, onDelete }) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
        No evidence items uploaded yet. Tap "Add Evidence" below.
      </div>
    );
  }

  const token = getToken();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}
    >
      {items.map((item, idx) => {
        const isImage = item.type === 'image';
        const thumbUrl = `/api/evidence/${item.id}/thumb?token=${token}`;

        return (
          <div
            key={item.id}
            onClick={() => onSelect && onSelect(item)}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Top preview box */}
            <div
              style={{
                height: '110px',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {isImage ? (
                <img
                  src={thumbUrl}
                  alt={item.original_name || 'Evidence'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    // Fallback to placeholder icon if fetch error
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}

              <div
                style={{
                  display: isImage ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  color: 'var(--primary)'
                }}
              >
                {item.type === 'url' ? <Link size={32} /> : <FileText size={32} />}
              </div>

              {/* Duplicate badge indicator */}
              {item.duplicate_of && (
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    backgroundColor: '#FFF3C4',
                    color: '#6A4B00',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <Copy size={10} /> Duplicate
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  backgroundColor: 'rgba(11, 42, 58, 0.75)',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                #{idx + 1}
              </div>
            </div>

            {/* Info bottom */}
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={item.original_name}
              >
                {item.original_name || (item.type === 'url' ? item.url : 'Item')}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {new Date(item.occurred_at).toLocaleDateString()}
              </div>

              {item.sha256 && (
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--primary-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontWeight: 600
                  }}
                >
                  <ShieldCheck size={11} /> SHA-256 Verified
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
