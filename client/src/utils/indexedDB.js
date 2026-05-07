const DB_NAME = "multi-persona-planner-db";
const DB_VERSION = 1;

const STORES = {
  apiCache: "apiCache",
  syncQueue: "syncQueue",
};

function openPlannerDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.apiCache)) {
        db.createObjectStore(STORES.apiCache, { keyPath: "key" });
      }

      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        db.createObjectStore(STORES.syncQueue, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runStoreTransaction(storeName, mode, callback) {
  return openPlannerDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = callback(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}

export function setApiCache(key, data) {
  return runStoreTransaction(STORES.apiCache, "readwrite", (store) =>
    store.put({ key, data, cachedAt: new Date().toISOString() }),
  );
}

export function getApiCache(key) {
  return runStoreTransaction(STORES.apiCache, "readonly", (store) =>
    store.get(key),
  );
}

export function getAllApiCacheEntries() {
  return runStoreTransaction(STORES.apiCache, "readonly", (store) =>
    store.getAll(),
  );
}

export async function getMatchingApiCacheEntries(resource) {
  const entries = await getAllApiCacheEntries();

  return entries.filter((entry) => {
    if (!entry?.key?.includes(`/api/${resource}`)) return false;
    return !entry.key.match(new RegExp(`/api/${resource}/[^/?#]+`));
  });
}

export function getSyncQueue() {
  return runStoreTransaction(STORES.syncQueue, "readonly", (store) =>
    store.getAll(),
  );
}

export async function setSyncQueue(queue) {
  const db = await openPlannerDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.syncQueue, "readwrite");
    const store = transaction.objectStore(STORES.syncQueue);

    store.clear();
    queue.forEach((item) => store.put(item));

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
