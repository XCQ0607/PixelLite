import { AppSettings, ProcessedImage } from '../types';
import { blobToDataURL } from './imageService';

const DB_NAME = 'PixelLiteDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export const StorageService = {
    // Settings (LocalStorage)
    saveSettings: (settings: AppSettings) => {
        try {
            localStorage.setItem('pixelLite_settings', JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings:", e);
        }
    },

    loadSettings: (): AppSettings | null => {
        try {
            const data = localStorage.getItem('pixelLite_settings');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Failed to load settings:", e);
            return null;
        }
    },

    // History (IndexedDB)
    initDB: (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => reject("IndexedDB error: " + (event.target as any).error);

            request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    },

    saveImage: async (image: ProcessedImage) => {
        const db = await StorageService.initDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // We need to store the raw blobs, but we don't need to store the base64 previews
            // as they take up too much space and can be regenerated.
            // However, for simplicity and performance (avoiding regeneration on every load),
            // we will try to store them. If it fails due to size, we might need a strategy.
            // IndexedDB quota is usually large (hundreds of MBs).

            // Clone the object to avoid modifying the original reference if we needed to
            const request = store.put(image);

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject((e.target as any).error);
        });
    },

    saveAllImages: async (images: ProcessedImage[]) => {
        const db = await StorageService.initDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Clear existing and rewrite (simplest sync strategy for this app)
            // Or better: merge. But since state is single source of truth, 
            // we might just want to ensure the DB reflects current state.
            // For now, let's just put all items.

            images.forEach(img => store.put(img));

            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject((e.target as any).error);
        });
    },

    deleteImage: async (id: string) => {
        const db = await StorageService.initDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject((e.target as any).error);
        });
    },

    deleteAllImages: async (ids: string[]) => {
        const db = await StorageService.initDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            ids.forEach(id => store.delete(id));
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject((e.target as any).error);
        });
    },

    loadAllImages: async (): Promise<ProcessedImage[]> => {
        const db = await StorageService.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result as ProcessedImage[];
                // Sort by timestamp desc
                results.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };
            request.onerror = (e) => reject((e.target as any).error);
        });
    }
};
