'use client';
import { useEffect } from 'react';

export default function OfflineProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          window.addEventListener('online', () => {
            // Check if sync is available (it's not in all browsers)
            if ('sync' in reg) {
              (reg as any).sync?.register('nadra-sync').catch(() => {});
            }
          });
        })
        .catch(() => {});
    }
  }, []);
  return null;
}


