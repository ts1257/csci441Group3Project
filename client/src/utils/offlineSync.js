const CACHE_PREFIX = "mpp-cache:";
const QUEUE_KEY = "mpp-sync-queue";
const STATUS_KEY = "mpp-last-sync-status";

const RESOURCE_CONFIG = {
  tasks: { collectionKey: "tasks", itemKey: "task" },
  habits: { collectionKey: "habits", itemKey: "habit" },
  trips: { collectionKey: "trips", itemKey: "trip" },
  records: { collectionKey: "records", itemKey: "record" },
  "planned-payments": {
    collectionKey: "plannedPayments",
    itemKey: "plannedPayment",
  },
  categories: { collectionKey: "categories", itemKey: "category" },
  courses: { collectionKey: "courses", itemKey: "course" },
  projects: { collectionKey: "projects", itemKey: "project" },
};

let originalFetch = null;
let syncInProgress = false;

function isApiRequest(url) {
  return String(url).includes("/api/");
}

function getRequestMethod(options = {}) {
  return String(options.method || "GET").toUpperCase();
}

function getRequestUrl(input) {
  return typeof input === "string" ? input : input?.url || "";
}

function getAuthorizationHeader(options = {}) {
  const headers = options.headers;
  if (!headers) return "";

  if (headers instanceof Headers) {
    return headers.get("Authorization") || headers.get("authorization") || "";
  }

  return headers.Authorization || headers.authorization || "";
}

function getCacheKey(url, options = {}) {
  const token =
    getAuthorizationHeader(options) || localStorage.getItem("token") || "guest";
  return `${CACHE_PREFIX}${token}:${url}`;
}

async function cacheSuccessfulGet(url, options, response) {
  try {
    const clone = response.clone();
    const data = await clone.json();
    localStorage.setItem(
      getCacheKey(url, options),
      JSON.stringify({
        data,
        cachedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Ignore non-JSON responses.
  }
}

function getCachedGet(url, options = {}) {
  try {
    const raw = localStorage.getItem(getCacheKey(url, options));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(
    new CustomEvent("offline-sync-queue-change", {
      detail: { count: queue.length },
    }),
  );
}

function setSyncStatus(status) {
  localStorage.setItem(STATUS_KEY, status);
  window.dispatchEvent(
    new CustomEvent("offline-sync-status-change", {
      detail: { status },
    }),
  );
}

function normalizeHeaders(headers) {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const output = {};
    headers.forEach((value, key) => {
      output[key] = value;
    });
    return output;
  }

  return { ...headers };
}

function getResourceName(url) {
  const match = String(url).match(/\/api\/([^/?#]+)/);
  return match?.[1] || "";
}

function getIdFromUrl(url) {
  const match = String(url).match(/\/api\/[^/?#]+\/([^/?#]+)/);
  return match?.[1] || "";
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return typeof body === "object" ? body : {};
}

function stringifyBody(body) {
  if (!body) return null;
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body);
  } catch {
    return null;
  }
}

function getConfig(resource) {
  return RESOURCE_CONFIG[resource] || { collectionKey: resource, itemKey: "data" };
}

function getCollectionFromPayload(data, resource) {
  if (Array.isArray(data)) return data;
  const config = getConfig(resource);
  if (Array.isArray(data?.[config.collectionKey])) return data[config.collectionKey];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function wrapCollectionPayload(originalData, resource, collection) {
  if (Array.isArray(originalData)) return collection;

  const config = getConfig(resource);
  if (Array.isArray(originalData?.[config.collectionKey])) {
    return { ...originalData, [config.collectionKey]: collection };
  }

  if (Array.isArray(originalData?.data)) {
    return { ...originalData, data: collection };
  }

  return { [config.collectionKey]: collection };
}

function getMatchingCacheEntries(resource) {
  const entries = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    if (!key.includes(`/api/${resource}`)) continue;
    if (key.match(new RegExp(`/api/${resource}/[^/?#]+`))) continue;

    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      entries.push({ key, parsed });
    } catch {
      // Ignore invalid cache entries.
    }
  }

  return entries;
}

function findCachedItem(resource, id) {
  const cacheEntries = getMatchingCacheEntries(resource);

  for (const entry of cacheEntries) {
    const collection = getCollectionFromPayload(entry.parsed?.data, resource);
    const found = collection.find((item) => item?._id === id);
    if (found) return found;
  }

  return null;
}

function updateLocalCaches(resource, action, itemOrId, replacement = null) {
  const cacheEntries = getMatchingCacheEntries(resource);

  cacheEntries.forEach(({ key, parsed }) => {
    const originalData = parsed?.data;
    let collection = getCollectionFromPayload(originalData, resource);

    if (action === "create") {
      collection = [
        itemOrId,
        ...collection.filter((item) => item?._id !== itemOrId?._id),
      ];
    }

    if (action === "update") {
      collection = collection.map((item) =>
        item?._id === itemOrId?._id ? { ...item, ...itemOrId } : item,
      );
    }

    if (action === "replace") {
      collection = collection.map((item) =>
        item?._id === itemOrId ? replacement : item,
      );
    }

    if (action === "delete") {
      collection = collection.filter((item) => item?._id !== itemOrId);
    }

    localStorage.setItem(
      key,
      JSON.stringify({
        ...parsed,
        data: wrapCollectionPayload(originalData, resource, collection),
        cachedAt: new Date().toISOString(),
      }),
    );
  });
}

function formatMutationResponse(resource, item, message) {
  const config = getConfig(resource);
  return {
    message,
    [config.itemKey]: item,
    data: item,
  };
}

function extractItemFromResponse(resource, data) {
  if (!data) return null;
  const config = getConfig(resource);
  if (data[config.itemKey]) return data[config.itemKey];
  if (data.data && !Array.isArray(data.data)) return data.data;
  return null;
}

function queueRequest(url, options = {}, optimisticId = "") {
  const method = getRequestMethod(options);
  const headers = normalizeHeaders(options.headers);
  const bodyData = parseBody(options.body);
  const queuedAt = new Date().toISOString();
  const queue = getQueue();

  const body = stringifyBody({
    ...bodyData,
    _clientQueuedAt: queuedAt,
    _clientOfflineId: optimisticId || bodyData._clientOfflineId || "",
  });

  queue.push({
    id: `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    url,
    method,
    headers,
    body,
    optimisticId,
    resource: getResourceName(url),
    createdAt: queuedAt,
  });

  setQueue(queue);
  setSyncStatus("pending");
}


function compactOfflineQueue(queue) {
  const deletedOfflineIds = new Set();

  queue.forEach((item) => {
    if (item.method === "DELETE") {
      const id = getIdFromUrl(item.url);
      if (id?.startsWith("offline-")) {
        deletedOfflineIds.add(id);
      }
    }
  });

  const compacted = [];
  const postByOfflineId = new Map();

  queue.forEach((item) => {
    const idFromUrl = getIdFromUrl(item.url);
    const offlineId = item.optimisticId || idFromUrl;

    if (offlineId && deletedOfflineIds.has(offlineId)) {
      return;
    }

    if (item.method === "POST" && item.optimisticId) {
      postByOfflineId.set(item.optimisticId, item);
      compacted.push(item);
      return;
    }

    if ((item.method === "PATCH" || item.method === "PUT") && idFromUrl?.startsWith("offline-")) {
      const matchingPost = postByOfflineId.get(idFromUrl);

      if (matchingPost) {
        const originalBody = parseBody(matchingPost.body);
        const patchBody = parseBody(item.body);
        matchingPost.body = stringifyBody({
          ...originalBody,
          ...patchBody,
          _clientOfflineId: idFromUrl,
          _clientQueuedAt: item.createdAt || originalBody._clientQueuedAt,
        });
        return;
      }
    }

    if (item.method === "DELETE" && idFromUrl?.startsWith("offline-")) {
      return;
    }

    compacted.push(item);
  });

  return compacted;
}

function buildOfflineResponse(url, options = {}) {
  const method = getRequestMethod(options);
  const resource = getResourceName(url);
  const body = parseBody(options.body);
  const now = new Date().toISOString();

  if (method === "POST") {
    const created = {
      _id: `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...body,
      offline: true,
      pendingSync: true,
      createdAt: now,
      updatedAt: now,
    };

    queueRequest(url, options, created._id);
    updateLocalCaches(resource, "create", created);

    return formatMutationResponse(
      resource,
      created,
      "Saved offline and queued for synchronization",
    );
  }

  if (method === "PATCH" || method === "PUT") {
    const id = getIdFromUrl(url);
    const existing = findCachedItem(resource, id) || {};
    const updated = {
      ...existing,
      ...body,
      _id: id,
      offline: true,
      pendingSync: true,
      updatedAt: now,
    };

    if (id?.startsWith("offline-")) {
      const queue = getQueue();
      const matchingPost = queue.find(
        (item) => item.method === "POST" && item.optimisticId === id,
      );

      if (matchingPost) {
        matchingPost.body = stringifyBody({
          ...parseBody(matchingPost.body),
          ...body,
          _clientOfflineId: id,
          _clientQueuedAt: matchingPost.createdAt,
        });
        setQueue(compactOfflineQueue(queue));
        setSyncStatus("pending");
      } else {
        queueRequest(url, options);
      }
    } else {
      queueRequest(url, options);
    }

    updateLocalCaches(resource, "update", updated);

    return formatMutationResponse(
      resource,
      updated,
      "Updated offline and queued for synchronization",
    );
  }

  if (method === "DELETE") {
    const id = getIdFromUrl(url);

    if (id?.startsWith("offline-")) {
      const queue = compactOfflineQueue(
        getQueue().filter(
          (item) => item.optimisticId !== id && getIdFromUrl(item.url) !== id,
        ),
      );
      setQueue(queue);
      setSyncStatus(queue.length === 0 ? "synced" : "pending");
    } else {
      queueRequest(url, options);
    }

    updateLocalCaches(resource, "delete", id);

    return {
      message: id?.startsWith("offline-")
        ? "Deleted locally before synchronization"
        : "Deleted offline and queued for synchronization",
      id,
      data: { _id: id, offline: true, pendingSync: !id?.startsWith("offline-") },
    };
  }

  return {
    message: "Saved offline and queued for synchronization",
    offline: true,
    pendingSync: true,
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Offline-Response": "true",
    },
  });
}

export function getOfflineQueueCount() {
  return getQueue().length;
}

export function getOfflineSyncStatus() {
  return localStorage.getItem(STATUS_KEY) || (navigator.onLine ? "synced" : "offline");
}

export async function syncOfflineQueue() {
  if (!navigator.onLine || !originalFetch || syncInProgress) return;

  let queue = compactOfflineQueue(getQueue());
  setQueue(queue);

  if (queue.length === 0) {
    setSyncStatus("synced");
    return;
  }

  syncInProgress = true;
  setSyncStatus("syncing");

  const remaining = [];

  try {
    for (const item of queue) {
      try {
        const response = await originalFetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });

        if (!response.ok) {
          const failedId = getIdFromUrl(item.url);
          if (failedId?.startsWith("offline-")) {
            continue;
          }

          remaining.push(item);
          continue;
        }

        const responseData = await response.clone().json().catch(() => null);
        const serverItem = extractItemFromResponse(item.resource, responseData);

        if (item.method === "POST" && item.optimisticId && serverItem?._id) {
          updateLocalCaches(item.resource, "replace", item.optimisticId, serverItem);
        }

        if ((item.method === "PATCH" || item.method === "PUT") && serverItem?._id) {
          updateLocalCaches(item.resource, "update", serverItem);
        }
      } catch {
        remaining.push(item);
      }
    }

    const compactedRemaining = compactOfflineQueue(remaining);
    setQueue(compactedRemaining);
    setSyncStatus(compactedRemaining.length === 0 ? "synced" : "pending");
  } finally {
    syncInProgress = false;
  }
}

export function setupOfflineSupport() {
  if (typeof window === "undefined" || originalFetch) return;

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input, options = {}) => {
    const url = getRequestUrl(input);
    const method = getRequestMethod(options);

    if (!isApiRequest(url)) {
      return originalFetch(input, options);
    }

    if (method === "GET") {
      try {
        const response = await originalFetch(input, options);
        if (response.ok) {
          await cacheSuccessfulGet(url, options, response);
        }
        return response;
      } catch (error) {
        const cached = getCachedGet(url, options);
        if (cached) return jsonResponse(cached);
        throw error;
      }
    }

    if (!navigator.onLine) {
      return jsonResponse(buildOfflineResponse(url, options), method === "POST" ? 201 : 200);
    }

    try {
      const response = await originalFetch(input, options);
      if (response.ok) return response;
      return response;
    } catch {
      return jsonResponse(buildOfflineResponse(url, options), method === "POST" ? 201 : 200);
    }
  };

  window.addEventListener("online", syncOfflineQueue);
  window.addEventListener("focus", syncOfflineQueue);
  setInterval(syncOfflineQueue, 30000);
  syncOfflineQueue();
}
