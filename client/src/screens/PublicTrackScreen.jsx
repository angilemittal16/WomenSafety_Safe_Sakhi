import React, { useState, useEffect } from 'react';
import { ShieldAlert, Navigation, MapPin, Volume2, Image, Clock, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

export function PublicTrackScreen({ token, type = 'sos' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTracking = async () => {
    try {
      if (type === 'journey') {
        const res = await api.getJourneyTracking(token);
        setData(res);
      } else {
        const res = await api.getSosTracking(token);
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Tracking link expired or invalid');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 6000);
    return () => clearInterval(interval);
  }, [token, type]);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text)' }}>
        <h2>Loading Live Safety Telemetry...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text)' }}>
        <h2 style={{ color: '#D9534F' }}>Tracking Link Expired</h2>
        <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
          {error || 'This live safety tracking link is no longer accessible.'}
        </p>
      </div>
    );
  }

  const isSos = type !== 'journey';
  const event = isSos ? data.sos : data.journey;
  const userName = isSos ? data.user?.name : data.userName;
  const locations = isSos ? data.locations : data.trail;
  const mediaList = isSos ? data.media || [] : [];

  const lastLoc = locations && locations.length > 0 ? locations[locations.length - 1] : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '20px' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          backgroundColor: isSos && event.status === 'active' ? '#007CBE' : 'var(--surface)',
          color: isSos && event.status === 'active' ? '#FFFFFF' : 'var(--text)',
          border: 'none',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isSos && event.status === 'active' ? 'rgba(255, 255, 255, 0.25)' : 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isSos ? (
              <ShieldAlert size={28} color={isSos && event.status === 'active' ? '#FFFFFF' : 'var(--primary)'} />
            ) : (
              <Navigation size={28} color={isSos && event.status === 'active' ? '#FFFFFF' : 'var(--primary)'} />
            )}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.9 }}>
              {isSos ? 'Live Emergency Dispatch' : 'Live Journey Tracking'}
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 900 }}>
              {userName || 'SafeSakhi User'}
            </h1>
          </div>
        </div>

        <div style={{ marginTop: '14px', fontSize: '14px', lineHeight: 1.4 }}>
          {isSos ? (
            event.status === 'active' ? (
              <strong>EMERGENCY ALERT: Active distress signal. Monitoring live location and surroundings.</strong>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={16} /> User has ended the alert and marked themselves safe.
              </span>
            )
          ) : (
            <div>
              Traveling to: <strong>{event.destination}</strong> (ETA: {event.eta || 'En route'})
            </div>
          )}
        </div>
      </div>

      {/* Live Map / Coordinates Card */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          Last Reported Location
        </h2>

        {lastLoc ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: 'var(--text)',
                marginBottom: '12px'
              }}
            >
              <MapPin size={18} color="var(--primary)" />
              <span>
                Coordinates: <strong>{lastLoc.lat.toFixed(5)}, {lastLoc.lng.toFixed(5)}</strong>
              </span>
            </div>

            {/* Embedded interactive OpenStreetMap view */}
            <div
              style={{
                width: '100%',
                height: '240px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                marginBottom: '12px'
              }}
            >
              <iframe
                title="Live Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lastLoc.lng - 0.008}%2C${lastLoc.lat - 0.008}%2C${lastLoc.lng + 0.008}%2C${lastLoc.lat + 0.008}&layer=mapnik&marker=${lastLoc.lat}%2C${lastLoc.lng}`}
              />
            </div>

            <a
              href={`https://maps.google.com/?q=${lastLoc.lat},${lastLoc.lng}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '44px', fontSize: '14px', textDecoration: 'none' }}
            >
              Open in Google Maps / Navigation
            </a>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Awaiting first GPS coordinate lock...
          </p>
        )}
      </div>

      {/* Recorded Media Stream (Playable audio clips & camera snapshots) */}
      {isSos && mediaList.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '12px' }}>
            Transmitted Surveillance Evidence ({mediaList.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mediaList.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                    {m.kind === 'audio' ? 'Encrypted Ambient Audio' : 'Surveillance Snapshot'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(m.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {m.kind === 'audio' ? (
                  <audio controls src={m.url} style={{ width: '100%' }} />
                ) : (
                  <img
                    src={m.url}
                    alt="SOS Camera Snapshot"
                    style={{ width: '100%', borderRadius: '8px', maxHeight: '220px', objectFit: 'cover' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Trail History */}
      {locations && locations.length > 1 && (
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '10px' }}>
            Location Breadcrumb Trail ({locations.length} pings)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {locations.slice(-5).reverse().map((loc, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  padding: '4px 0',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <span>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(loc.recorded_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
