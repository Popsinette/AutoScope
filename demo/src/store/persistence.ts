import type { DemoData, FilePersistence, RecordPersistence } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export function reviveDates(json: string): DemoData {
  return JSON.parse(json, (_key, value) => (typeof value === "string" && ISO_DATE.test(value) ? new Date(value) : value));
}

export class LocalStoragePersistence implements RecordPersistence {
  constructor(private readonly key = "carview-demo-v1") {}
  load() {
    try {
      const raw = window.localStorage.getItem(this.key);
      return raw ? reviveDates(raw) : null;
    } catch {
      return null;
    }
  }
  save(data: DemoData) {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // Stockage indisponible (navigation privée stricte) : les données restent en mémoire.
    }
  }
  clear() {
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      /* ignoré */
    }
  }
}

export class MemoryPersistence implements RecordPersistence {
  private json: string | null = null;
  load() {
    return this.json ? reviveDates(this.json) : null;
  }
  save(data: DemoData) {
    this.json = JSON.stringify(data);
  }
  clear() {
    this.json = null;
  }
}

/** Fichiers (photos, factures, modèles GLB) dans IndexedDB. */
export class IndexedDbFiles implements FilePersistence {
  private db: Promise<IDBDatabase> | null = null;
  private open() {
    this.db ??= new Promise((resolve, reject) => {
      const req = indexedDB.open("carview-demo-files", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("files");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.db;
  }
  private async tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const t = db.transaction("files", mode);
      const req = run(t.objectStore("files"));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
    });
  }
  async put(id: string, blob: Blob) {
    await this.tx("readwrite", (s) => s.put(blob, id));
  }
  async delete(id: string) {
    await this.tx("readwrite", (s) => s.delete(id));
  }
  async clear() {
    await this.tx("readwrite", (s) => s.clear());
  }
  async all() {
    const db = await this.open();
    return new Promise<Map<string, Blob>>((resolve, reject) => {
      const out = new Map<string, Blob>();
      const req = db.transaction("files").objectStore("files").openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve(out);
        out.set(String(cursor.key), cursor.value as Blob);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export class MemoryFiles implements FilePersistence {
  readonly files = new Map<string, Blob>();
  async put(id: string, blob: Blob) {
    this.files.set(id, blob);
  }
  async delete(id: string) {
    this.files.delete(id);
  }
  async clear() {
    this.files.clear();
  }
  async all() {
    return new Map(this.files);
  }
}
