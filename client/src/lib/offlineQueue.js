const DB_NAME = 'safesakhi_offline_db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('queued_media')) {
        db.createObjectStore('queued_media', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('queued_locations')) {
        db.createObjectStore('queued_locations', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached_data')) {
        db.createObjectStore('cached_data', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Cache last known GPS location
export async function cacheLastLocation(lat, lng) {
  try {
    const db = await openDB();
    const tx = db.transaction('cached_data', 'readwrite');
    const store = tx.objectStore('cached_data');
    store.put({ key: 'last_location', lat, lng, timestamp: Date.now() });
  } catch (err) {
    console.warn('[OfflineDB] Could not cache location:', err);
  }
}

export async function getLastCachedLocation() {
  try {
    const db = await openDB();
    const tx = db.transaction('cached_data', 'readonly');
    const store = tx.objectStore('cached_data');
    return new Promise((resolve) => {
      const req = store.get('last_location');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

// Queue offline SOS media (audio clip / snapshot blob)
export async function queueOfflineMedia(sosId, kind, blob) {
  try {
    const db = await openDB();
    const tx = db.transaction('queued_media', 'readwrite');
    const store = tx.objectStore('queued_media');
    store.add({
      sosId,
      kind,
      blob,
      timestamp: Date.now()
    });
    console.log(`[OfflineQueue] Queued ${kind} for SOS ${sosId}`);
  } catch (err) {
    console.error('[OfflineQueue] Error queuing media:', err);
  }
}

// Queue offline location ping
export async function queueOfflineLocation(sosId, journeyId, lat, lng) {
  try {
    const db = await openDB();
    const tx = db.transaction('queued_locations', 'readwrite');
    const store = tx.objectStore('queued_locations');
    store.add({
      sosId,
      journeyId,
      lat,
      lng,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('[OfflineQueue] Error queuing location:', err);
  }
}

// Get number of pending queued items
export async function getQueueCount() {
  try {
    const db = await openDB();
    const countMedia = await new Promise((resolve) => {
      const tx = db.transaction('queued_media', 'readonly');
      const req = tx.objectStore('queued_media').count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });

    const countLocs = await new Promise((resolve) => {
      const tx = db.transaction('queued_locations', 'readonly');
      const req = tx.objectStore('queued_locations').count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });

    return countMedia + countLocs;
  } catch (err) {
    return 0;
  }
}

// Flush all queued offline requests to backend
export async function flushOfflineQueue(api) {
  if (!navigator.onLine) return 0;
  let flushedCount = 0;

  try {
    const db = await openDB();

    // 1. Flush queued locations
    const locTx = db.transaction('queued_locations', 'readwrite');
    const locStore = locTx.objectStore('queued_locations');
    const locations = await new Promise((res) => {
      const req = locStore.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    });

    for (const item of locations) {
      try {
        if (item.sosId) {
          await api.updateSosLocation(item.sosId, { lat: item.lat, lng: item.lng });
        } else if (item.journeyId) {
          await api.updateJourneyLocation({ lat: item.lat, lng: item.lng });
        }
        flushedCount++;
      } catch (e) {
        console.warn('[OfflineQueue] Failed to sync location item:', e.message);
      }
    }
    locStore.clear();

    // 2. Flush queued media
    const mediaTx = db.transaction('queued_media', 'readwrite');
    const mediaStore = mediaTx.objectStore('queued_media');
    const mediaItems = await new Promise((res) => {
      const req = mediaStore.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    });

    for (const item of mediaItems) {
      try {
        const formData = new FormData();
        const ext = item.kind === 'audio' ? 'webm' : 'jpg';
        formData.append('file', item.blob, `offline_${item.kind}_${Date.now()}.${ext}`);
        formData.append('kind', item.kind);
        await api.uploadSosMedia(item.sosId, formData);
        flushedCount++;
      } catch (e) {
        console.warn('[OfflineQueue] Failed to sync media item:', e.message);
      }
    }
    mediaStore.clear();

    if (flushedCount > 0) {
      console.log(`[OfflineQueue] Successfully flushed ${flushedCount} offline items to server.`);
    }
  } catch (err) {
    console.error('[OfflineQueue] Error flushing queue:', err);
  }

  return flushedCount;
}
