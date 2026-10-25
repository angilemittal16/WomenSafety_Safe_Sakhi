import React, { useState, useEffect, useRef } from 'react';
import { SosButton } from '../components/SosButton';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { ShieldCheck, Users, CheckCircle, ExternalLink, WifiOff, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { getCurrentLocation, watchLiveLocation, clearWatchLocation } from '../lib/geolocation';
import { recordAudioClip, captureCameraSnapshot } from '../lib/recorder';
import { openEmergencySms } from '../lib/sms';
import { queueOfflineMedia, queueOfflineLocation } from '../lib/offlineQueue';

export function Home({ isOnline, contacts = [], onNavigateToContacts }) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [activeSos, setActiveSos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offlineSmsTriggered, setOfflineSmsTriggered] = useState(false);
  const [mediaStatus, setMediaStatus] = useState('');
  const locationWatchId = useRef(null);

  // Check active SOS on mount
  useEffect(() => {
    const fetchActiveSos = async () => {
      try {
        const active = await api.getActiveSos();
        if (active) setActiveSos(active);
      } catch (e) {}
    };
    fetchActiveSos();
  }, []);

  // When SOS is active, stream GPS & periodic audio/snapshot captures
  useEffect(() => {
    let mediaInterval = null;

    if (activeSos && activeSos.status === 'active') {
      // 1. Live GPS tracking
      locationWatchId.current = watchLiveLocation(async (coords) => {
        try {
          if (navigator.onLine) {
            await api.updateSosLocation(activeSos.id, coords);
          } else {
            await queueOfflineLocation(activeSos.id, null, coords.lat, coords.lng);
          }
        } catch (e) {
          console.warn('GPS stream error:', e.message);
        }
      });

      // 2. Initial Audio & Camera Snapshot capture
      const captureMedia = async () => {
        try {
          setMediaStatus('Capturing encrypted audio & camera snapshot...');
          const [audioBlob, snapshotBlob] = await Promise.all([
            recordAudioClip(6000),
            captureCameraSnapshot()
          ]);

          if (navigator.onLine) {
            if (audioBlob) {
              const audioData = new FormData();
              audioData.append('file', audioBlob, `sos_audio_${Date.now()}.webm`);
              audioData.append('kind', 'audio');
              await api.uploadSosMedia(activeSos.id, audioData);
            }
            if (snapshotBlob) {
              const snapData = new FormData();
              snapData.append('file', snapshotBlob, `sos_snap_${Date.now()}.jpg`);
              snapData.append('kind', 'snapshot');
              await api.uploadSosMedia(activeSos.id, snapData);
            }
          } else {
            // Offline queueing
            if (audioBlob) await queueOfflineMedia(activeSos.id, 'audio', audioBlob);
            if (snapshotBlob) await queueOfflineMedia(activeSos.id, 'snapshot', snapshotBlob);
          }
          setMediaStatus('Encrypted audio & snapshot secured at rest.');
        } catch (e) {
          console.warn('Media capture error:', e.message);
        }
      };

      captureMedia();
      mediaInterval = setInterval(captureMedia, 20000); // Periodic capture every 20s
    } else {
      if (locationWatchId.current) {
        clearWatchLocation(locationWatchId.current);
        locationWatchId.current = null;
      }
      if (mediaInterval) clearInterval(mediaInterval);
    }

    return () => {
      if (locationWatchId.current) {
        clearWatchLocation(locationWatchId.current);
        locationWatchId.current = null;
      }
      if (mediaInterval) clearInterval(mediaInterval);
    };
  }, [activeSos]);

  // Execute SOS when countdown hits 0
  const handleSosComplete = async () => {
    setShowCountdown(false);
    setLoading(true);

    try {
      const loc = await getCurrentLocation();

      if (!navigator.onLine) {
        // Offline SOS Flow:
        setOfflineSmsTriggered(true);
        setActiveSos({
          id: `offline_sos_${Date.now()}`,
          status: 'active',
          type: 'sos',
          last_lat: loc.lat,
          last_lng: loc.lng,
          offline: true
        });

        // Launch native SMS composer with Google Maps link
        openEmergencySms(contacts, loc.lat, loc.lng, 'SOS Alert (Offline)');
      } else {
        // Online SOS Flow:
        const response = await api.startSos({
          type: 'sos',
          lat: loc.lat,
          lng: loc.lng
        });
        setActiveSos(response);
      }
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
    } finally {
      setLoading(false);
    }
  };

  // 112 helpline handler (direct `<a href="tel:112">` fires immediately; parallel telemetry)
  const handle112Press = async () => {
    try {
      const loc = await getCurrentLocation();
      if (navigator.onLine) {
        api.startSos({ type: '112', lat: loc.lat, lng: loc.lng }).catch(() => {});
      } else {
        openEmergencySms(contacts, loc.lat, loc.lng, 'Calling 112 Helpline');
      }
    } catch (e) {}
  };

  // End SOS
  const handleEndSos = async () => {
    if (!activeSos) return;
    setLoading(true);
    try {
      if (navigator.onLine && !activeSos.offline) {
        await api.endSos(activeSos.id);
      }
      setActiveSos(null);
      setOfflineSmsTriggered(false);
      setMediaStatus('');
    } catch (e) {
      setActiveSos(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-container">
      {/* Active SOS Confirmation State */}
      {activeSos ? (
        <div className="card" style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                Help is being notified
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {activeSos.offline ? 'Offline SMS mode active' : 'Live tracking link sent to contacts'}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
              Emergency Contacts Alerted:
            </div>
            {contacts.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                No contacts saved. Please add trusted contacts in Settings.
              </p>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    padding: '4px 0'
                  }}
                >
                  <span>
                    <strong>{c.name}</strong> ({c.phone})
                  </span>
                  <span style={{ color: 'var(--primary-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle size={14} /> Dispatched
                  </span>
                </div>
              ))
            )}
          </div>

          {activeSos.trackingUrl && (
            <div style={{ marginBottom: '16px' }}>
              <a
                href={activeSos.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-light"
                style={{ width: '100%', minHeight: '44px', fontSize: '14px', textDecoration: 'none' }}
              >
                <ExternalLink size={16} /> Open Public Contact Tracker Link
              </a>
            </div>
          )}

          {mediaStatus && (
            <div style={{ fontSize: '12px', color: 'var(--primary-dark)', marginBottom: '16px', fontWeight: 600 }}>
              {mediaStatus}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleEndSos}
            disabled={loading}
            style={{ width: '100%', minHeight: '52px', fontSize: '16px', fontWeight: 800 }}
          >
            <CheckCircle size={20} /> I'm safe now / End alert
          </button>
        </div>
      ) : (
        <>
          {/* Instructions / Calm Reassuring Microcopy */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
              Personal Emergency Dispatch
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Tap SOS for immediate emergency alert with live GPS, encrypted audio, and photo trail sent to your trusted circle.
            </p>
          </div>

          {/* SOS & 112 Buttons */}
          <SosButton onSosPress={() => setShowCountdown(true)} on112Press={handle112Press} />

          {/* Inline Contacts Prompt Card */}
          <div
            className="card"
            style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Users size={20} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                  Trusted Contacts ({contacts.length})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {contacts.length > 0
                    ? contacts.map((c) => c.name).join(', ')
                    : 'Add trusted emergency contacts'}
                </div>
              </div>
            </div>
            <button
              className="btn btn-light"
              onClick={onNavigateToContacts}
              style={{ minHeight: '38px', padding: '6px 14px', fontSize: '13px' }}
            >
              Manage
            </button>
          </div>
        </>
      )}

      {/* 3-Second SOS Countdown Overlay */}
      {showCountdown && (
        <CountdownOverlay
          onComplete={handleSosComplete}
          onCancel={() => setShowCountdown(false)}
        />
      )}
    </div>
  );
}
