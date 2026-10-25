import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export function AreYouSafeModal({ onSafe, onNotSafe }) {
  // In demo fast mode, 15 seconds remaining before auto-SMS; otherwise 300 seconds (5 mins)
  const [remainingSeconds, setRemainingSeconds] = useState(15);

  useEffect(() => {
    triggerHaptic([100, 100, 100, 100]);

    // Show native notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SafeSakhi Safety Check', {
        body: "You have stopped for a while. Are you safe?",
        icon: '/icons/shield.svg'
      });
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="safe-modal-title">
      <div className="modal-content" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}
        >
          <AlertTriangle size={32} color="var(--primary)" />
        </div>

        <h2 id="safe-modal-title" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          Are you safe?
        </h2>

        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
          We noticed you've been stationary at this location for a while. Please confirm you are okay.
        </p>

        {remainingSeconds > 0 ? (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FFF8D6',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#6A4B00'
            }}
          >
            Auto-alerting emergency contacts via SMS in <strong>{remainingSeconds}s</strong> if no response
          </div>
        ) : (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FFE8E8',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#8A1515'
            }}
          >
            Emergency SMS dispatched to contacts!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* "I'm not safe": solid --primary */}
          <button
            className="btn btn-primary"
            onClick={() => {
              triggerHaptic([100, 50, 100]);
              onNotSafe();
            }}
            style={{ minHeight: '60px', fontSize: '18px', fontWeight: 800 }}
          >
            <ShieldAlert size={22} /> I'm not safe
          </button>

          {/* "Yes, I'm safe": outlined */}
          <button
            className="btn btn-outline"
            onClick={() => {
              triggerHaptic(50);
              onSafe();
            }}
            style={{ minHeight: '56px', fontSize: '17px', fontWeight: 700 }}
          >
            <CheckCircle size={22} /> Yes, I'm safe
          </button>
        </div>
      </div>
    </div>
  );
}
