const DB_NAME = 'MelodyVaultDB';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio_files';
const ARTWORK_STORE = 'custom_artwork';

export interface StoredAudioRecord {
  songId: string;
  blob: Blob;
  mimeType: string;
  filename: string;
  size: number;
  importedAt: string;
}

export interface StoredArtworkRecord {
  songId: string;
  blob: Blob;
  mimeType: string;
}

let dbInstance: IDBDatabase | null = null;
const objectUrlCache = new Map<string, string>();

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'songId' });
      }
      if (!db.objectStoreNames.contains(ARTWORK_STORE)) {
        db.createObjectStore(ARTWORK_STORE, { keyPath: 'songId' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveAudioBlob(
  songId: string,
  blob: Blob,
  filename: string
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readwrite');
    const store = tx.objectStore(AUDIO_STORE);

    const record: StoredAudioRecord = {
      songId,
      blob,
      mimeType: blob.type || 'audio/mpeg',
      filename,
      size: blob.size,
      importedAt: new Date().toISOString(),
    };

    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAudioBlob(songId: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readonly');
    const store = tx.objectStore(AUDIO_STORE);
    const req = store.get(songId);

    req.onsuccess = () => {
      const result = req.result as StoredAudioRecord | undefined;
      resolve(result ? result.blob : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAudioBlob(songId: string): Promise<void> {
  if (objectUrlCache.has(songId)) {
    URL.revokeObjectURL(objectUrlCache.get(songId)!);
    objectUrlCache.delete(songId);
  }

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([AUDIO_STORE, ARTWORK_STORE], 'readwrite');
    tx.objectStore(AUDIO_STORE).delete(songId);
    tx.objectStore(ARTWORK_STORE).delete(songId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveArtworkBlob(songId: string, blob: Blob): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ARTWORK_STORE, 'readwrite');
    const store = tx.objectStore(ARTWORK_STORE);

    const record: StoredArtworkRecord = {
      songId,
      blob,
      mimeType: blob.type || 'image/jpeg',
    };

    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getArtworkBlob(songId: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ARTWORK_STORE, 'readonly');
    const store = tx.objectStore(ARTWORK_STORE);
    const req = store.get(songId);

    req.onsuccess = () => {
      const result = req.result as StoredArtworkRecord | undefined;
      resolve(result ? result.blob : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAudioObjectURL(songId: string): Promise<string | null> {
  if (objectUrlCache.has(songId)) {
    return objectUrlCache.get(songId)!;
  }

  const blob = await getAudioBlob(songId);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  objectUrlCache.set(songId, url);
  return url;
}

export async function getAllStoredAudioRecords(): Promise<StoredAudioRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readonly');
    const store = tx.objectStore(AUDIO_STORE);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getStorageStats(): Promise<{
  usageMB: number;
  quotaMB: number;
  percent: number;
  songCount: number;
}> {
  try {
    let usageBytes = 0;
    let quotaBytes = 0;

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    }

    const records = await getAllStoredAudioRecords();
    if (usageBytes === 0) {
      usageBytes = records.reduce((acc, r) => acc + (r.size || 0), 0);
    }

    const usageMB = Math.round((usageBytes / (1024 * 1024)) * 10) / 10;
    const quotaMB = quotaBytes > 0 ? Math.round((quotaBytes / (1024 * 1024)) * 10) / 10 : 2048;
    const percent = quotaMB > 0 ? Math.min(100, Math.round((usageMB / quotaMB) * 100)) : 0;

    return {
      usageMB,
      quotaMB,
      percent,
      songCount: records.length,
    };
  } catch (err) {
    console.warn('Storage estimate failed:', err);
    return { usageMB: 0, quotaMB: 1024, percent: 0, songCount: 0 };
  }
}
