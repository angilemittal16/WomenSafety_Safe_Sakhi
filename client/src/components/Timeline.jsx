import React from 'react';
import { Calendar, Hash, ExternalLink, Copy } from 'lucide-react';

export function Timeline({ items = [], onSelectEvidence }) {
  if (items.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
        No timeline events logged yet. Add evidence to build the chronological chain of events.
      </div>
    );
  }

  // Sort chronological by occurred_at
  const sorted = [...items].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));

  return (
    <div className="card" style={{ position: 'relative', paddingLeft: '32px' }}>
      {/* Vertical timeline guide line */}
      <div
        style={{
          position: 'absolute',
          top: '28px',
          bottom: '28px',
          left: '18px',
          width: '3px',
          backgroundColor: 'var(--primary-light)',
          borderRadius: '2px'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {sorted.map((item, idx) => (
          <div
            key={item.id}
            style={{
              position: 'relative',
              cursor: onSelectEvidence ? 'pointer' : 'default'
            }}
            onClick={() => onSelectEvidence && onSelectEvidence(item)}
          >
            {/* Primary timeline node dot */}
            <div
              style={{
                position: 'absolute',
                left: '-22px',
                top: '4px',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                border: '3px solid var(--surface)',
                boxShadow: '0 0 0 2px var(--primary)',
                zIndex: 2
              }}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--text)'
                  }}
                >
                  Item #{idx + 1}
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <Calendar size={13} />
                  {new Date(item.occurred_at).toLocaleString()}
                </span>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                {item.original_name || (item.type === 'url' ? 'Web Link / Post' : 'Evidence File')}
              </h4>

              {item.description && (
                <p style={{ fontSize: '14px', color: 'var(--text)', marginTop: '4px', lineHeight: 1.4 }}>
                  {item.description}
                </p>
              )}

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '13px',
                    color: 'var(--primary)',
                    marginTop: '6px',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={13} /> {item.url}
                </a>
              )}

              {item.duplicate_of && (
                <div
                  style={{
                    marginTop: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#FFF3C4',
                    color: '#6A4B00'
                  }}
                >
                  <Copy size={12} /> {item.duplicate_of}
                </div>
              )}

              {item.sha256 && (
                <div
                  style={{
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <Hash size={12} /> SHA-256: {item.sha256.substring(0, 16)}...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
