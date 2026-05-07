const RECORD_CACHE_KEY = "mpp.records.cache.v1";
const CATEGORY_CACHE_KEY = "mpp.categories.cache.v1";
const FINANCE_QUEUE_KEY = "mpp.finance.syncQueue.v1";

export function getFinanceSyncState() {
  return {
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    pendingCount: readQueue().length,
  };
}

export async function fetchRecordsWithOfflineFallback({ apiUrl, token }) {
  if (!navigator.onLine) {
    return { records: applyPendingRecords(getCachedRecords()), source: "cache" };
  }

  let response;
  try {
    response = await fetch(`${apiUrl}/api/records`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return { records: applyPendingRecords(getCachedRecords()), source: "cache" };
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch records");
  }

  const records = parseList(data, "records");
  writeJson(RECORD_CACHE_KEY, records);
  return { records: applyPendingRecords(records), source: "network" };
}

export async function fetchCategoriesWithOfflineFallback({ apiUrl, token }) {
  if (!navigator.onLine) return getCachedCategories();

  try {
    const response = await fetch(`${apiUrl}/api/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Failed categories");

    const categories = parseList(data, "categories");
    writeJson(CATEGORY_CACHE_KEY, categories);
    return categories;
  } catch {
    return getCachedCategories();
  }
}

export function queueCreateRecord(payload) {
  const now = new Date().toISOString();
  const record = {
    ...payload,
    _id: createLocalId(),
    createdAt: now,
    updatedAt: now,
    _syncStatus: "pending-create",
  };

  writeJson(RECORD_CACHE_KEY, [record, ...getCachedRecords()]);
  pushQueue({
    id: createLocalId("op"),
    type: "record:create",
    recordId: record._id,
    payload,
    clientUpdatedAt: now,
  });

  return record;
}

export function queueUpdateRecord(record, payload) {
  const now = new Date().toISOString();
  const queue = readQueue();
  const pendingCreate = queue.find(
    (operation) =>
      operation.type === "record:create" && operation.recordId === record._id,
  );

  if (pendingCreate) {
    pendingCreate.payload = { ...pendingCreate.payload, ...payload };
    pendingCreate.clientUpdatedAt = now;
    writeJson(FINANCE_QUEUE_KEY, queue);
  } else {
    pushQueue({
      id: createLocalId("op"),
      type: "record:update",
      recordId: record._id,
      payload,
      clientUpdatedAt: now,
    });
  }

  const updatedRecord = {
    ...record,
    ...payload,
    updatedAt: now,
    _syncStatus: "pending-update",
  };
  replaceCachedRecord(record._id, updatedRecord);
  return updatedRecord;
}

export function queueDeleteRecord(recordId) {
  const queue = readQueue();
  const hasPendingCreate = queue.some(
    (operation) =>
      operation.type === "record:create" && operation.recordId === recordId,
  );

  if (hasPendingCreate) {
    writeJson(
      FINANCE_QUEUE_KEY,
      queue.filter((operation) => operation.recordId !== recordId),
    );
  } else {
    pushQueue({
      id: createLocalId("op"),
      type: "record:delete",
      recordId,
      payload: {},
      clientUpdatedAt: new Date().toISOString(),
    });
  }

  removeCachedRecord(recordId);
}

export async function syncPendingFinance({ apiUrl, token }) {
  if (!navigator.onLine) return { synced: 0, pendingCount: readQueue().length };

  const queue = readQueue();
  const remaining = [];
  const idMap = {};
  let synced = 0;

  for (const operation of queue) {
    const recordId = idMap[operation.recordId] || operation.recordId;

    try {
      if (operation.type === "record:create") {
        const record = await sendRequest({
          apiUrl,
          token,
          method: "POST",
          path: "/api/records",
          body: operation.payload,
        });
        idMap[operation.recordId] = record._id;
        replaceCachedRecord(operation.recordId, record);
      }

      if (operation.type === "record:update") {
        const record = await sendRequest({
          apiUrl,
          token,
          method: "PATCH",
          path: `/api/records/${recordId}`,
          body: operation.payload,
        });
        replaceCachedRecord(recordId, record);
      }

      if (operation.type === "record:delete") {
        await sendRequest({
          apiUrl,
          token,
          method: "DELETE",
          path: `/api/records/${recordId}`,
        });
        removeCachedRecord(recordId);
      }

      synced += 1;
    } catch {
      remaining.push(operation);
    }
  }

  writeJson(FINANCE_QUEUE_KEY, remaining);
  return { synced, pendingCount: remaining.length };
}

export function saveRecordToCache(record) {
  replaceCachedRecord(record._id, record);
}

function applyPendingRecords(records) {
  const deletedIds = new Set();
  const recordMap = new Map(records.map((record) => [record._id, record]));

  readQueue().forEach((operation) => {
    if (operation.type === "record:delete") {
      deletedIds.add(operation.recordId);
      return;
    }

    if (operation.type === "record:create" || operation.type === "record:update") {
      const current = recordMap.get(operation.recordId) || {};
      recordMap.set(operation.recordId, {
        ...current,
        ...operation.payload,
        _id: operation.recordId,
        updatedAt: operation.clientUpdatedAt,
        _syncStatus:
          operation.type === "record:create"
            ? "pending-create"
            : "pending-update",
      });
    }
  });

  return Array.from(recordMap.values()).filter(
    (record) => !deletedIds.has(record._id),
  );
}

async function sendRequest({ apiUrl, token, method, path, body }) {
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
  return data.record || data.data || data;
}

function parseList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function replaceCachedRecord(recordId, record) {
  const normalizedRecord = stripSyncFields(record);
  const records = getCachedRecords();
  const next = records.some((item) => item._id === recordId)
    ? records.map((item) => (item._id === recordId ? normalizedRecord : item))
    : [normalizedRecord, ...records];
  writeJson(RECORD_CACHE_KEY, next);
}

function removeCachedRecord(recordId) {
  writeJson(
    RECORD_CACHE_KEY,
    getCachedRecords().filter((record) => record._id !== recordId),
  );
}

function getCachedRecords() {
  return readJson(RECORD_CACHE_KEY, []);
}

function getCachedCategories() {
  return readJson(CATEGORY_CACHE_KEY, []);
}

function readQueue() {
  return readJson(FINANCE_QUEUE_KEY, []);
}

function pushQueue(operation) {
  writeJson(FINANCE_QUEUE_KEY, [...readQueue(), operation]);
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

function stripSyncFields(record) {
  const { _syncStatus, ...rest } = record || {};
  return rest;
}

function createLocalId(prefix = "offline-record") {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
