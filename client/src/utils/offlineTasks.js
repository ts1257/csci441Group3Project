const CACHE_KEY = "mpp.tasks.cache.v1";
const QUEUE_KEY = "mpp.tasks.syncQueue.v1";

export function getClientSyncState() {
  return {
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    pendingCount: readQueue().length,
  };
}

export function getCachedTasks() {
  return readJson(CACHE_KEY, []);
}

export function cacheRemoteTasks(tasks) {
  const pendingTasks = getCachedTasks().filter((task) => isPendingTask(task));
  const deletedIds = new Set(
    readQueue()
      .filter((operation) => operation.type === "delete")
      .map((operation) => operation.taskId),
  );
  const merged = [...pendingTasks, ...tasks].filter(
    (task) => !deletedIds.has(task._id),
  );
  writeJson(CACHE_KEY, merged);
  return applyPendingOperations(merged);
}

export function saveTaskToCache(task) {
  replaceCachedTask(task._id, task);
}

export function deleteTaskFromCache(taskId) {
  removeCachedTask(taskId);
}

export async function fetchTasksWithOfflineFallback({ apiUrl, token }) {
  if (!navigator.onLine) {
    return {
      tasks: applyPendingOperations(getCachedTasks()),
      source: "cache",
    };
  }

  let response;

  try {
    response = await fetch(`${apiUrl}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return {
      tasks: applyPendingOperations(getCachedTasks()),
      source: "cache",
    };
  }
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tasks");
  }

  const tasks = parseTaskList(data);
  return {
    tasks: cacheRemoteTasks(tasks),
    source: "network",
  };
}

export function queueCreateTask(payload) {
  const now = new Date().toISOString();
  const localId = createLocalId();
  const task = {
    ...payload,
    _id: localId,
    createdAt: now,
    updatedAt: now,
    _syncStatus: "pending-create",
  };

  writeJson(CACHE_KEY, [task, ...getCachedTasks()]);
  upsertQueueOperation({
    id: createLocalId("op"),
    type: "create",
    taskId: localId,
    payload,
    clientUpdatedAt: now,
  });

  return task;
}

export function queueUpdateTask(task, payload) {
  const now = new Date().toISOString();
  const taskId = task._id;
  const queue = readQueue();
  const createOperation = queue.find(
    (operation) => operation.type === "create" && operation.taskId === taskId,
  );

  if (createOperation) {
    createOperation.payload = { ...createOperation.payload, ...payload };
    createOperation.clientUpdatedAt = now;
    writeJson(QUEUE_KEY, queue);
  } else {
    upsertQueueOperation({
      id: createLocalId("op"),
      type: "update",
      taskId,
      payload,
      clientUpdatedAt: now,
    });
  }

  const updatedTask = {
    ...task,
    ...payload,
    updatedAt: now,
    _syncStatus: "pending-update",
  };
  replaceCachedTask(taskId, updatedTask);
  return updatedTask;
}

export function queueDeleteTask(task) {
  const taskId = task._id;
  const queue = readQueue();
  const hasPendingCreate = queue.some(
    (operation) => operation.type === "create" && operation.taskId === taskId,
  );

  if (hasPendingCreate) {
    writeJson(
      QUEUE_KEY,
      queue.filter((operation) => operation.taskId !== taskId),
    );
  } else {
    upsertQueueOperation({
      id: createLocalId("op"),
      type: "delete",
      taskId,
      payload: {},
      clientUpdatedAt: new Date().toISOString(),
    });
  }

  writeJson(
    CACHE_KEY,
    getCachedTasks().filter((item) => item._id !== taskId),
  );
}

export async function syncPendingTasks({ apiUrl, token }) {
  if (!navigator.onLine) {
    return { synced: 0, pendingCount: readQueue().length };
  }

  const queue = readQueue();
  let synced = 0;
  const remaining = [];
  const idMap = {};

  for (const operation of queue) {
    const taskId = idMap[operation.taskId] || operation.taskId;

    try {
      if (operation.type === "create") {
        const createdTask = await sendTaskRequest({
          apiUrl,
          token,
          method: "POST",
          path: "/api/tasks",
          body: operation.payload,
        });
        idMap[operation.taskId] = createdTask._id;
        replaceCachedTask(operation.taskId, createdTask);
      }

      if (operation.type === "update") {
        const updatedTask = await sendTaskRequest({
          apiUrl,
          token,
          method: "PATCH",
          path: `/api/tasks/${taskId}`,
          body: {
            ...operation.payload,
            clientUpdatedAt: operation.clientUpdatedAt,
          },
        });
        replaceCachedTask(taskId, updatedTask);
      }

      if (operation.type === "delete") {
        await sendTaskRequest({
          apiUrl,
          token,
          method: "DELETE",
          path: `/api/tasks/${taskId}`,
        });
        removeCachedTask(taskId);
      }

      synced += 1;
    } catch (error) {
      remaining.push(operation);
    }
  }

  writeJson(QUEUE_KEY, remaining);
  return { synced, pendingCount: remaining.length };
}

function parseTaskList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.tasks)) return data.tasks;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

async function sendTaskRequest({ apiUrl, token, method, path, body }) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();

  if (!response.ok) {
    if (method === "DELETE" && response.status === 404) return null;
    throw new Error(data.message || "Sync failed");
  }

  return data?.task || data?.data || data;
}

function upsertQueueOperation(nextOperation) {
  const queue = readQueue();
  const index = queue.findIndex(
    (operation) =>
      operation.type === nextOperation.type &&
      operation.taskId === nextOperation.taskId,
  );

  if (index >= 0) {
    queue[index] = {
      ...queue[index],
      ...nextOperation,
      clientUpdatedAt: maxIsoDate(
        queue[index].clientUpdatedAt,
        nextOperation.clientUpdatedAt,
      ),
    };
  } else {
    queue.push(nextOperation);
  }

  writeJson(QUEUE_KEY, queue);
}

function applyPendingOperations(tasks) {
  const deletedIds = new Set();
  const taskMap = new Map(tasks.map((task) => [task._id, task]));

  readQueue().forEach((operation) => {
    if (operation.type === "delete") {
      deletedIds.add(operation.taskId);
      return;
    }

    const current = taskMap.get(operation.taskId) || {};
    taskMap.set(operation.taskId, {
      ...current,
      ...operation.payload,
      _id: operation.taskId,
      updatedAt: operation.clientUpdatedAt,
      _syncStatus:
        operation.type === "create" ? "pending-create" : "pending-update",
    });
  });

  return Array.from(taskMap.values()).filter((task) => !deletedIds.has(task._id));
}

function replaceCachedTask(taskId, task) {
  const normalizedTask = stripSyncFields(task);
  const tasks = getCachedTasks();
  const exists = tasks.some((item) => item._id === taskId);
  const next = exists
    ? tasks.map((item) => (item._id === taskId ? normalizedTask : item))
    : [normalizedTask, ...tasks];
  writeJson(CACHE_KEY, next);
}

function removeCachedTask(taskId) {
  writeJson(
    CACHE_KEY,
    getCachedTasks().filter((task) => task._id !== taskId),
  );
}

function stripSyncFields(task) {
  const { _syncStatus, ...rest } = task || {};
  return rest;
}

function isPendingTask(task) {
  return task?._id?.startsWith("offline-") || task?._syncStatus;
}

function readQueue() {
  return readJson(QUEUE_KEY, []);
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

function createLocalId(prefix = "offline") {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function maxIsoDate(left, right) {
  return new Date(left).getTime() > new Date(right).getTime() ? left : right;
}
