import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'roder-pwa-db';
const STORE_NAME = 'sync-queue';
const BLOB_STORE = 'media-cache';

export interface SyncItem {
  id: string;
  type: 'indication' | 'product' | 'profile_image' | 'stock_update';
  data: any;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  createdAt: number;
  retryCount: number;
  error?: string;
}

export interface MediaItem {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function addToSyncQueue(item: Omit<SyncItem, 'createdAt' | 'status' | 'retryCount'>) {
  const db = await getDB();
  const syncItem: SyncItem = {
    ...item,
    status: 'pending',
    createdAt: Date.now(),
    retryCount: 0,
  };
  await db.put(STORE_NAME, syncItem);
  return syncItem;
}

export async function getSyncQueue(): Promise<SyncItem[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function updateSyncItem(item: SyncItem) {
  const db = await getDB();
  await db.put(STORE_NAME, item);
}

export async function removeSyncItem(id: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function saveMediaLocally(media: MediaItem) {
  const db = await getDB();
  await db.put(BLOB_STORE, media);
}

export async function getMediaLocally(id: string): Promise<MediaItem | undefined> {
  const db = await getDB();
  return db.get(BLOB_STORE, id);
}

export async function removeMediaLocally(id: string) {
  const db = await getDB();
  await db.delete(BLOB_STORE, id);
}
