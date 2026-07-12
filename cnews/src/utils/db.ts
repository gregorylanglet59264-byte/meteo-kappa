const DB_NAME = "WeatherAppDB";
const STORE_NAME = "clients";
const DB_VERSION = 1;

async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
    });
}

export async function saveClientsAsync(clients: any[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(clients, "saved_clients");

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function loadClientsAsync(): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get("saved_clients");

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}
