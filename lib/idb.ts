import { openDB, type IDBPDatabase } from 'idb';

export type OfflineOperation = {
  id?: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  createdAt: number;
};

const DB_NAME = 'nadra-offline';
const STORE = 'queue';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    });
  }
  return dbPromise;
}

export async function enqueueOperation(op: OfflineOperation) {
  const db = await getDb();
  await db.add(STORE, { ...op, createdAt: Date.now() });
}

export async function getAllOperations(): Promise<OfflineOperation[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function clearOperation(id: number) {
  const db = await getDb();
  await db.delete(STORE, id);
}


