import { DiaryEntry } from '../types/diary';

const DB_NAME = 'MariaArgentinaTravelDB';
const DB_VERSION = 1;
const DIARY_STORE = 'diary_entries';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DIARY_STORE)) {
        const store = db.createObjectStore(DIARY_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('dayNumber', 'dayNumber', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DIARY_STORE, 'readonly');
      const store = tx.objectStore(DIARY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = (request.result as DiaryEntry[]) || [];
        entries.sort((a, b) => b.createdAt - a.createdAt);
        resolve(entries);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage for diary:', err);
    try {
      const saved = localStorage.getItem('maria_diary_entries_backup');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  }
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DIARY_STORE, 'readwrite');
      const store = tx.objectStore(DIARY_STORE);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to localStorage:', err);
    // localStorage backup without huge photos if quota issues arise
    try {
      const all = await getAllDiaryEntries();
      const existingIdx = all.findIndex((e) => e.id === entry.id);
      if (existingIdx >= 0) {
        all[existingIdx] = entry;
      } else {
        all.unshift(entry);
      }
      localStorage.setItem('maria_diary_entries_backup', JSON.stringify(all));
    } catch (_) {}
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DIARY_STORE, 'readwrite');
      const store = tx.objectStore(DIARY_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to delete in IndexedDB:', err);
    try {
      const all = (await getAllDiaryEntries()).filter((e) => e.id !== id);
      localStorage.setItem('maria_diary_entries_backup', JSON.stringify(all));
    } catch (_) {}
  }
}

/**
 * Compresses an image file from camera or file picker down to a web-friendly size
 * (max 1280px dimension, JPEG 0.78 quality) to keep offline storage light and fast.
 */
export function compressImageFile(file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
