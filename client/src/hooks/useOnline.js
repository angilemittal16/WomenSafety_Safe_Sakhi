import { useState, useEffect, useCallback } from 'react';
import { getQueueCount, flushOfflineQueue } from '../lib/offlineQueue';
import { api } from '../lib/api';

export function useOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  const refreshQueueCount = useCallback(async () => {
    const count = await getQueueCount();
    setPendingQueueCount(count);
  }, []);

  const flush = useCallback(async () => {
    if (navigator.onLine) {
      await flushOfflineQueue(api);
      await refreshQueueCount();
    }
  }, [refreshQueueCount]);

  useEffect(() => {
    refreshQueueCount();

    const handleOnline = async () => {
      setIsOnline(true);
      console.log('[Network] App transitioned ONLINE. Auto-flushing offline queue...');
      await flush();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Network] App transitioned OFFLINE. Offline SMS mode engaged.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic ping & queue check
    const interval = setInterval(async () => {
      refreshQueueCount();
      // Optional ping check
      if (navigator.onLine) {
        try {
          await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
          setIsOnline(true);
        } catch (e) {
          setIsOnline(false);
        }
      } else {
        setIsOnline(false);
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [flush, refreshQueueCount]);

  return {
    isOnline,
    pendingQueueCount,
    flushQueue: flush
  };
}
