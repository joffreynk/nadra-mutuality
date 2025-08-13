/* Basic SW with background sync for queued requests */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'nadra-sync') {
    event.waitUntil(flushQueue());
  }
});

async function flushQueue() {
  const db = await openDB('nadra-offline', 1);
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const all = await store.getAll();
  for (const op of all) {
    try {
      await fetch(op.url, {
        method: op.method,
        headers: op.headers,
        body: op.body ? JSON.stringify(op.body) : undefined
      });
      await store.delete(op.id);
    } catch (e) {
      // keep for next sync
    }
  }
  await tx.done;
}

function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


