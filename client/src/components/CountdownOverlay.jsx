import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export function CountdownOverlay({ onComplete, onCancel }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    triggerHaptic([100, 50, 100]);

    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      triggerHaptic(80);
      setCount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 42, 58, 0.94)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 24px',
        color: '#FFFFFF',
        backdropFilter: 'blur(8px)',
        textAlign: 'center'
      }}
      role="alertdialog"
      aria-label="Emergency SOS Countdown"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px'
          }}
        >
          <AlertTriangle size={36} color="#FFFFFF" />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Sending Emergency Alert
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--primary-light)', maxWidth: '300px' }}>
          Alerting all trusted contacts & dispatching GPS tracking in...
        </p>
      </div>

      <div
        style={{
          fontSize: '110px',
          fontWeight: 900,
          color: 'var(--bg)',
          lineHeight: 1,
          textShadow: '0 4px 24px rgba(0, 124, 190, 0.5)',
          animation: 'countPop 1s ease-in-out'
        }}
        aria-live="assertive"
      >
        {count}
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <button
          className="btn"
          onClick={() => {
            triggerHaptic(50);
            onCancel();
          }}
          style={{
            width: '100%',
            height: '76px',
            backgroundColor: '#FFFFFF',
            color: 'var(--text)',
            fontSize: '22px',
            fontWeight: 800,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            border: '3px solid var(--primary-dark)'
          }}
          aria-label="Cancel Emergency Alert"
        >
          <X size={32} color="var(--primary)" /> CANCEL ALERT
        </button>
        <p style={{ marginTop: '14px', fontSize: '13px', color: '#B5D5E8' }}>
          Tap Cancel to abort without alerting contacts
        </p>
      </div>
    </div>
  );
}
