import { cacheLastLocation, getLastCachedLocation } from './offlineQueue';

// Default fallback coordinates (Connaught Place / Central New Delhi)
const DEFAULT_COORDS = {
  lat: 28.6304,
  lng: 77.2177,
  accuracy: 15
};

export async function getCurrentLocation() {
  if (!navigator.geolocation) {
    const cached = await getLastCachedLocation();
    return cached ? { lat: cached.lat, lng: cached.lng } : DEFAULT_COORDS;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        cacheLastLocation(coords.lat, coords.lng);
        resolve(coords);
      },
      async (err) => {
        console.warn('[Geolocation] Browser GPS error or permission denied:', err.message);
        const cached = await getLastCachedLocation();
        resolve(cached ? { lat: cached.lat, lng: cached.lng, accuracy: 50 } : DEFAULT_COORDS);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000
      }
    );
  });
}

export function watchLiveLocation(onPosition, onError) {
  if (!navigator.geolocation) {
    if (onError) onError(new Error('Geolocation not supported'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      };
      cacheLastLocation(coords.lat, coords.lng);
      if (onPosition) onPosition(coords);
    },
    (err) => {
      if (onError) onError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );
}

export function clearWatchLocation(watchId) {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}
