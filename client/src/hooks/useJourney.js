import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { getCurrentLocation, watchLiveLocation, clearWatchLocation } from '../lib/geolocation';
import { queueOfflineLocation } from '../lib/offlineQueue';

export function useJourney() {
  const [activeJourney, setActiveJourney] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSafePrompt, setShowSafePrompt] = useState(false);
  const watchIdRef = useRef(null);

  const fetchActive = useCallback(async () => {
    try {
      const journey = await api.getActiveJourney();
      setActiveJourney(journey);
      if (journey && journey.stationary_prompt_sent && !journey.stationary_alert_sent) {
        setShowSafePrompt(true);
      }
    } catch (err) {
      // offline or not logged in
    }
  }, []);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 6000);
    return () => clearInterval(interval);
  }, [fetchActive]);

  // Start background location streaming while journey is active
  useEffect(() => {
    if (activeJourney && activeJourney.status === 'active') {
      watchIdRef.current = watchLiveLocation(async (coords) => {
        try {
          if (navigator.onLine) {
            await api.updateJourneyLocation(coords);
          } else {
            await queueOfflineLocation(null, activeJourney.id, coords.lat, coords.lng);
          }
        } catch (e) {
          console.warn('[Journey] Location send failed:', e.message);
        }
      });
    } else {
      if (watchIdRef.current) {
        clearWatchLocation(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current) {
        clearWatchLocation(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeJourney]);

  const start = async (destination, destCoords, eta) => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      const journey = await api.startJourney({
        destination,
        dest_lat: destCoords ? destCoords.lat : null,
        dest_lng: destCoords ? destCoords.lng : null,
        eta: eta || '25 mins',
        lat: loc.lat,
        lng: loc.lng
      });
      setActiveJourney(journey);
      return journey;
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    setLoading(true);
    try {
      await api.stopJourney();
      setActiveJourney(null);
      setShowSafePrompt(false);
    } finally {
      setLoading(false);
    }
  };

  const respondSafe = async (isSafe) => {
    setShowSafePrompt(false);
    try {
      await api.journeyCheckIn(isSafe);
      await fetchActive();
    } catch (e) {
      console.warn('Check-in error:', e.message);
    }
  };

  return {
    activeJourney,
    loading,
    showSafePrompt,
    setShowSafePrompt,
    startJourney: start,
    stopJourney: stop,
    respondSafe,
    refreshJourney: fetchActive
  };
}
