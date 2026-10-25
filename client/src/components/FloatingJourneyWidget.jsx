import React, { useState, useEffect, useRef } from 'react';
import { Navigation, AlertOctagon, XCircle } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export function FloatingJourneyWidget({ journey, onStopSharing, onNotSafe }) {
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('safesakhi_journey_widget_pos') || localStorage.getItem('safeher_journey_widget_pos');
      return saved ? JSON.parse(saved) : { y: 0 };
    } catch (e) {
      return { y: 0 };
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentY = useRef(position.y);
  const widgetRef = useRef(null);

  useEffect(() => {
    currentY.current = position.y;
    try {
      localStorage.setItem('safesakhi_journey_widget_pos', JSON.stringify(position));
    } catch (e) {}
  }, [position]);

  const handlePointerDown = (e) => {
    // Only drag from widget background/handle, not buttons
    if (e.target.closest('button')) return;
    setIsDragging(true);
    dragStartY.current = e.clientY - currentY.current;
    if (widgetRef.current) {
      widgetRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const newY = e.clientY - dragStartY.current;
    // Restrict within viewport bounds (between -350px and 0px above tab bar)
    const clampedY = Math.min(20, Math.max(-350, newY));
    currentY.current = clampedY;
    if (widgetRef.current) {
      widgetRef.current.style.transform = `translateY(${clampedY}px)`;
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setPosition({ y: currentY.current });
  };

  if (!journey) return null;

  return (
    <div
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'fixed',
        bottom: '84px', // docked above the tab bar
        left: '16px',
        right: '16px',
        maxWidth: '448px',
        margin: '0 auto',
        transform: `translateY(${position.y}px)`,
        backgroundColor: 'var(--primary)',
        color: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        boxShadow: '0 8px 24px rgba(0, 124, 190, 0.4)',
        zIndex: 500,
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1.5px solid rgba(255, 255, 255, 0.25)'
      }}
      role="region"
      aria-label="Active Journey Tracking Widget"
    >
      {/* Drag handle line */}
      <div
        style={{
          width: '36px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '2px',
          margin: '0 auto 10px auto'
        }}
      />

      {/* Destination & ETA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Navigation size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>
              Live Journey Sharing
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
              {journey.destination}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', opacity: 0.85, fontWeight: 600 }}>ETA</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--bg)' }}>
            {journey.eta || 'En route'}
          </div>
        </div>
      </div>

      {/* Actions: "Stop sharing" and "I'm not safe" */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            triggerHaptic(50);
            onStopSharing();
          }}
          className="btn"
          style={{
            flex: 1,
            minHeight: '44px',
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 700,
            padding: '8px 12px'
          }}
        >
          <XCircle size={16} /> Stop sharing
        </button>

        <button
          onClick={() => {
            triggerHaptic([100, 50, 100]);
            onNotSafe();
          }}
          className="btn"
          style={{
            flex: 1,
            minHeight: '44px',
            backgroundColor: '#FFFFFF',
            color: 'var(--primary-dark)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 800,
            padding: '8px 12px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <AlertOctagon size={16} color="var(--primary-dark)" /> I'm not safe
        </button>
      </div>
    </div>
  );
}
