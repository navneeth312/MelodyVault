const DB_NAME = 'MelodyVaultDB';
const DB_VERSION = 2;
const AUDIO_STORE = 'audio_files';
const ARTWORK_STORE = 'custom_artwork';
const SEPARATED_STORE = 'separated_audio';

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

export interface StoredSeparatedAudioRecord {
  songId: string;
  instrumentalBlob: Blob;
  vocalBlob?: Blob;
  modelUsed: string; // e.g. 'htdemucs_v4', 'spleeter_2stem', 'studio_backing_track'
  processedAt: string;
  size: number;
}

let dbInstance: IDBDatabase | null = null;
const objectUrlCache = new Map<string, string>();
const instrumentalUrlCache = new Map<string, string>();

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
      if (!db.objectStoreNames.contains(SEPARATED_STORE)) {
        db.createObjectStore(SEPARATED_STORE, { keyPath: 'songId' });
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

export async function hasAudioBlob(songId: string): Promise<boolean> {
  const blob = await getAudioBlob(songId);
  return blob !== null && blob.size > 0;
}

const artworkUrlCache = new Map<string, string>();

export async function getArtworkObjectURL(songId: string): Promise<string | null> {
  if (artworkUrlCache.has(songId)) {
    return artworkUrlCache.get(songId)!;
  }
  const blob = await getArtworkBlob(songId);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  artworkUrlCache.set(songId, url);
  return url;
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
  if (instrumentalUrlCache.has(songId)) {
    URL.revokeObjectURL(instrumentalUrlCache.get(songId)!);
    instrumentalUrlCache.delete(songId);
  }

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([AUDIO_STORE, ARTWORK_STORE, SEPARATED_STORE], 'readwrite');
    tx.objectStore(AUDIO_STORE).delete(songId);
    tx.objectStore(ARTWORK_STORE).delete(songId);
    tx.objectStore(SEPARATED_STORE).delete(songId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveSeparatedAudioRecord(record: StoredSeparatedAudioRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SEPARATED_STORE, 'readwrite');
    const store = tx.objectStore(SEPARATED_STORE);
    const req = store.put(record);
    req.onsuccess = () => {
      // Invalidate existing cache if re-saving
      if (instrumentalUrlCache.has(record.songId)) {
        URL.revokeObjectURL(instrumentalUrlCache.get(record.songId)!);
        instrumentalUrlCache.delete(record.songId);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getSeparatedAudioRecord(songId: string): Promise<StoredSeparatedAudioRecord | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SEPARATED_STORE, 'readonly');
    const store = tx.objectStore(SEPARATED_STORE);
    const req = store.get(songId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function hasSeparatedAudio(songId: string): Promise<boolean> {
  const record = await getSeparatedAudioRecord(songId);
  return record !== null && record.instrumentalBlob !== undefined && record.instrumentalBlob.size > 0;
}

export async function getInstrumentalObjectURL(songId: string): Promise<string | null> {
  if (instrumentalUrlCache.has(songId)) {
    return instrumentalUrlCache.get(songId)!;
  }

  const record = await getSeparatedAudioRecord(songId);
  if (!record || !record.instrumentalBlob) return null;

  const url = URL.createObjectURL(record.instrumentalBlob);
  instrumentalUrlCache.set(songId, url);
  return url;
}

export async function deleteSeparatedAudioRecord(songId: string): Promise<void> {
  if (instrumentalUrlCache.has(songId)) {
    URL.revokeObjectURL(instrumentalUrlCache.get(songId)!);
    instrumentalUrlCache.delete(songId);
  }

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SEPARATED_STORE, 'readwrite');
    const store = tx.objectStore(SEPARATED_STORE);
    const req = store.delete(songId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
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
