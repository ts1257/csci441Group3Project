const HABITS_CACHE_KEY = "mpp.habits.cache.v1";
const TRIPS_CACHE_KEY = "mpp.trips.cache.v1";
const PAYMENTS_CACHE_KEY = "mpp.plannedPayments.cache.v1";
const COURSES_CACHE_KEY = "mpp.courses.cache.v1";
const PROJECTS_CACHE_KEY = "mpp.projects.cache.v1";
const COLLECTION_QUEUE_KEY = "mpp.collections.syncQueue.v1";

const CONFIG = {
  habits: {
    cacheKey: HABITS_CACHE_KEY,
    apiPath: "/api/habits",
    listKey: "habits",
    itemKey: "habit",
  },
  trips: {
    cacheKey: TRIPS_CACHE_KEY,
    apiPath: "/api/trips",
    listKey: "trips",
    itemKey: "trip",
  },
  plannedPayments: {
    cacheKey: PAYMENTS_CACHE_KEY,
    apiPath: "/api/planned-payments",
    listKey: "plannedPayments",
    itemKey: "plannedPayment",
  },
  courses: {
    cacheKey: COURSES_CACHE_KEY,
    apiPath: "/api/courses",
    listKey: "courses",
    itemKey: "course",
  },
  projects: {
    cacheKey: PROJECTS_CACHE_KEY,
    apiPath: "/api/projects",
    listKey: "projects",
    itemKey: "project",
  },
};

export async function fetchCollectionWithOfflineFallback({
  apiUrl,
  token,
  collection,
}) {
  const config = CONFIG[collection];
  if (!config) return [];

  if (!navigator.onLine) {
    return applyPending(collection, readJson(config.cacheKey, []));
  }

  try {
    const response = await fetch(`${apiUrl}${config.apiPath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Failed to fetch");

    const list = uniqueById(parseList(data, config.listKey));
    writeJson(config.cacheKey, list);
    return applyPending(collection, list);
  } catch {
    return applyPending(collection, readJson(config.cacheKey, []));
  }
}

export function queueCollectionCreate(collection, payload) {
  const config = CONFIG[collection];
  const now = new Date().toISOString();
  const item = {
    ...payload,
    _id: createLocalId(collection),
    createdAt: now,
    updatedAt: now,
    _syncStatus: "pending-create",
  };

  writeJson(config.cacheKey, uniqueById([item, ...readJson(config.cacheKey, [])]));
  pushQueue({
    id: createLocalId("op"),
    collection,
    type: "create",
    itemId: item._id,
    payload,
    clientUpdatedAt: now,
  });
  return item;
}

export function queueCollectionUpdate(collection, item, payload) {
  const config = CONFIG[collection];
  const now = new Date().toISOString();
  const queue = readQueue();
  const pendingCreate = queue.find(
    (operation) =>
      operation.collection === collection &&
      operation.type === "create" &&
      operation.itemId === item._id,
  );

  if (pendingCreate) {
    pendingCreate.payload = { ...pendingCreate.payload, ...payload };
    pendingCreate.clientUpdatedAt = now;
    writeJson(COLLECTION_QUEUE_KEY, queue);
  } else {
    pushQueue({
      id: createLocalId("op"),
      collection,
      type: "update",
      itemId: item._id,
      payload,
      clientUpdatedAt: now,
    });
  }

  const updated = {
    ...item,
    ...payload,
    updatedAt: now,
    _syncStatus: "pending-update",
  };
  replaceCachedItem(config.cacheKey, item._id, updated);
  return updated;
}

export function queueCollectionDelete(collection, itemId) {
  const config = CONFIG[collection];
  const queue = readQueue();
  const pendingCreate = queue.some(
    (operation) =>
      operation.collection === collection &&
      operation.type === "create" &&
      operation.itemId === itemId,
  );

  if (pendingCreate) {
    writeJson(
      COLLECTION_QUEUE_KEY,
      queue.filter(
        (operation) =>
          !(operation.collection === collection && operation.itemId === itemId),
      ),
    );
  } else {
    pushQueue({
      id: createLocalId("op"),
      collection,
      type: "delete",
      itemId,
      payload: {},
      clientUpdatedAt: new Date().toISOString(),
    });
  }

  removeCachedItem(config.cacheKey, itemId);
}

export async function syncPendingCollections({ apiUrl, token }) {
  if (!navigator.onLine) return { synced: 0, pendingCount: readQueue().length };

  const queue = readQueue();
  const remaining = [];
  const idMap = {};
  let synced = 0;

  for (const operation of queue) {
    const config = CONFIG[operation.collection];
    if (!config) continue;

    const itemId = idMap[operation.itemId] || operation.itemId;

    try {
      if (operation.type === "create") {
        const item = await sendRequest({
          apiUrl,
          token,
          method: "POST",
          path: config.apiPath,
          body: operation.payload,
          itemKey: config.itemKey,
        });
        idMap[operation.itemId] = item._id;
        replaceCachedItem(config.cacheKey, operation.itemId, item);
      }

      if (operation.type === "update") {
        const item = await sendRequest({
          apiUrl,
          token,
          method: "PATCH",
          path: `${config.apiPath}/${itemId}`,
          body: operation.payload,
          itemKey: config.itemKey,
        });
        replaceCachedItem(config.cacheKey, itemId, item);
      }

      if (operation.type === "delete") {
        await sendRequest({
          apiUrl,
          token,
          method: "DELETE",
          path: `${config.apiPath}/${itemId}`,
          itemKey: config.itemKey,
        });
        removeCachedItem(config.cacheKey, itemId);
      }

      synced += 1;
    } catch {
      remaining.push(operation);
    }
  }

  writeJson(COLLECTION_QUEUE_KEY, remaining);
  return { synced, pendingCount: remaining.length };
}

export function saveCollectionItemToCache(collection, item) {
  const config = CONFIG[collection];
  replaceCachedItem(config.cacheKey, item._id, item);
}

function applyPending(collection, list) {
  const map = new Map(list.map((item) => [item._id, item]));
  const deletedIds = new Set();

  readQueue()
    .filter((operation) => operation.collection === collection)
    .forEach((operation) => {
      if (operation.type === "delete") {
        deletedIds.add(operation.itemId);
        return;
      }

      const current = map.get(operation.itemId) || {};
      map.set(operation.itemId, {
        ...current,
        ...operation.payload,
        _id: operation.itemId,
        updatedAt: operation.clientUpdatedAt,
        _syncStatus:
          operation.type === "create" ? "pending-create" : "pending-update",
      });
    });

  return uniqueById(
    Array.from(map.values()).filter((item) => !deletedIds.has(item._id)),
  );
}

async function sendRequest({ apiUrl, token, method, path, body, itemKey }) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (method === "DELETE" && response.status === 404) return null;

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Sync failed");
  return data[itemKey] || data.data || data;
}

function parseList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function replaceCachedItem(cacheKey, itemId, item) {
  const list = readJson(cacheKey, []);
  const normalized = stripSyncFields(item);
  const next = list.some((current) => current._id === itemId)
    ? list.map((current) => (current._id === itemId ? normalized : current))
    : [normalized, ...list];
  writeJson(cacheKey, next);
}

function removeCachedItem(cacheKey, itemId) {
  writeJson(
    cacheKey,
    readJson(cacheKey, []).filter((item) => item._id !== itemId),
  );
}

function readQueue() {
  return readJson(COLLECTION_QUEUE_KEY, []);
}

function pushQueue(operation) {
  writeJson(COLLECTION_QUEUE_KEY, [...readQueue(), operation]);
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function stripSyncFields(item) {
  const { _syncStatus, ...rest } = item || {};
  return rest;
}

function createLocalId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `offline-${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `offline-${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function uniqueById(items) {
  const seen = new Set();
  const result = [];

  items.forEach((item, index) => {
    const key = item?._id || `missing-id-${index}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });

  return result;
}
