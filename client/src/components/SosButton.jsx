import React from 'react';
import { ShieldAlert, PhoneCall } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export function SosButton({ onSosPress, on112Press }) {
  const handleSos = () => {
    triggerHaptic([120, 40, 120]);
    onSosPress();
  };

  const handle112 = (e) => {
    triggerHaptic(100);
    if (on112Press) on112Press(e);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
      {/* SOS Button: Solid --primary, at least 96px tall, pulse ring */}
      <button
        onClick={handleSos}
        className="sos-button-pulsing"
        style={{
          width: '100%',
          minHeight: '110px',
          backgroundColor: 'var(--primary)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          boxShadow: 'var(--shadow-md)',
          padding: '20px',
          transition: 'transform 0.1s ease',
          userSelect: 'none'
        }}
        aria-label="Send Emergency SOS Alert to all contacts"
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ShieldAlert size={36} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1.1 }}>
            SOS
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, opacity: 0.95, marginTop: '4px' }}>
            Alert Trusted Contacts
          </div>
        </div>
      </button>

      {/* 112 Helpline Button: at least 96px tall, `<a href="tel:112">` */}
      <a
        href="tel:112"
        onClick={handle112}
        style={{
          width: '100%',
          minHeight: '96px',
          backgroundColor: 'var(--surface)',
          color: 'var(--text)',
          borderRadius: 'var(--radius-lg)',
          border: '2.5px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          textDecoration: 'none',
          boxShadow: 'var(--shadow-sm)',
          padding: '16px 20px',
          userSelect: 'none'
        }}
        aria-label="Call National Emergency 112 and share location"
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <PhoneCall size={30} color="var(--primary)" strokeWidth={2.5} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.1 }}>
            112 HELPLINE
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>
            Direct Call + Auto Location Share
          </div>
        </div>
      </a>
    </div>
  );
}
