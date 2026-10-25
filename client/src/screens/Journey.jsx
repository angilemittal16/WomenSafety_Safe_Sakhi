import React, { useState } from 'react';
import { Navigation, MapPin, Clock, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export function Journey({
  journey,
  onStartJourney,
  onStopJourney,
  onNotSafe,
  loading
}) {
  const [destination, setDestination] = useState('');
  const [eta, setEta] = useState('25 mins');
  const [geocoding, setGeocoding] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!destination.trim()) return;

    triggerHaptic(80);
    setGeocoding(true);

    let destCoords = null;
    // Attempt free Nominatim geocoding with graceful fallback to free text
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination.trim())}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          destCoords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
        }
      }
    } catch (err) {
      console.warn('Geocoding offline or unavailable, continuing with destination text:', err.message);
    } finally {
      setGeocoding(false);
    }

    await onStartJourney(destination.trim(), destCoords, eta);
  };

  return (
    <div className="screen-container">
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
          Journey Safety & Live Tracking
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Share your live route, destination, and calculated ETA with trusted contacts. If you remain stationary unexpectedly, SafeSakhi checks on you automatically.
        </p>
      </div>

      {journey && journey.status === 'active' ? (
        <div className="card" style={{ border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Navigation size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                Active Journey Sharing
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                {journey.destination}
              </h3>
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Arrival:</span>
              <strong>{journey.eta || '25 mins'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Started At:</span>
              <strong>{new Date(journey.started_at).toLocaleTimeString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stationary Detector:</span>
              <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>
                Active (50m geofence)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={onStopJourney}
              disabled={loading}
              style={{ minHeight: '52px', fontSize: '16px', fontWeight: 700 }}
            >
              <CheckCircle size={20} /> Arrived Safely / Stop Sharing
            </button>

            <button
              className="btn btn-outline"
              onClick={onNotSafe}
              style={{ minHeight: '52px', fontSize: '16px', fontWeight: 800 }}
            >
              <ShieldAlert size={20} /> I'm not safe
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleStart} className="card">
          <div className="form-group">
            <label className="form-label" htmlFor="dest-input">
              Where are you traveling to?
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="dest-input"
                type="text"
                className="form-input"
                placeholder="e.g. Central Station, Connaught Place, Office"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
              <MapPin
                size={20}
                color="var(--primary)"
                style={{ position: 'absolute', right: '14px', top: '14px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="eta-select">
              Estimated Travel Duration (ETA)
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="eta-select"
                className="form-select"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
              >
                <option value="15 mins">15 minutes</option>
                <option value="25 mins">25 minutes</option>
                <option value="40 mins">40 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2+ hours">2+ hours</option>
              </select>
              <Clock
                size={18}
                color="var(--primary)"
                style={{ position: 'absolute', right: '14px', top: '15px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || geocoding || !destination.trim()}
            style={{ width: '100%', minHeight: '56px', fontSize: '17px', fontWeight: 800, marginTop: '8px' }}
          >
            <Navigation size={20} /> {geocoding ? 'Locating...' : 'Start Sharing Journey'}
          </button>
        </form>
      )}

      {/* Quick destination presets */}
      <div className="card">
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>
          Quick Destinations
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Central Station', 'Home', 'Office / Campus', 'Metro Gate #2'].map((preset) => (
            <button
              key={preset}
              type="button"
              className="btn btn-light"
              onClick={() => setDestination(preset)}
              style={{ minHeight: '38px', padding: '6px 14px', fontSize: '13px' }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
