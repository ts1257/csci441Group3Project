const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TASK_CACHE_PREFIX = "mpp-task-cache-v1";
const TASK_QUEUE_PREFIX = "mpp-task-queue-v1";

function buildApiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function getCurrentUserKey() {
  if (typeof window === "undefined") return "guest";

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?._id || user?.id || user?.email || "guest";
  } catch {
    return "guest";
  }
}

function getStorageKey(prefix) {
  return `${prefix}:${getCurrentUserKey()}`;
}

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

function normalizeTask(task, overrides = {}) {
  return {
    ...task,
    description: task.description || "",
    dueDate: task.dueDate || null,
    priority: task.priority || "medium",
    status: task.status || "todo",
    courseId: task.courseId || "",
    projectId: task.projectId || "",
    localOnly: Boolean(task.localOnly),
    syncStatus: task.syncStatus || "synced",
    ...overrides,
  };
}

function stripTaskForApi(task) {
  return {
    title: task.title,
    description: task.description || "",
    dueDate: task.dueDate || null,
    priority: task.priority || "medium",
    status: task.status || "todo",
    persona: task.persona,
    courseId: task.courseId || "",
    projectId: task.projectId || "",
  };
}

function getAllCachedTasks() {
  const tasks = readJson(getStorageKey(TASK_CACHE_PREFIX), []);
  return Array.isArray(tasks) ? tasks.map((task) => normalizeTask(task)) : [];
}

function setAllCachedTasks(tasks) {
  writeJson(getStorageKey(TASK_CACHE_PREFIX), sortTasks(tasks));
}

function getPendingChanges() {
  const changes = readJson(getStorageKey(TASK_QUEUE_PREFIX), []);
  return Array.isArray(changes) ? changes : [];
}

function setPendingChanges(changes) {
  writeJson(getStorageKey(TASK_QUEUE_PREFIX), changes);
}

function upsertTask(tasks, task) {
  const next = tasks.filter((item) => item._id !== task._id);
  next.unshift(normalizeTask(task));
  return sortTasks(next);
}

function removeTask(tasks, taskId) {
  return tasks.filter((task) => task._id !== taskId);
}

function createQueueEntry(type, taskId, payload) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    taskId,
    payload,
    createdAt: new Date().toISOString(),
  };
}

function replaceQueueEntry(changes, nextEntry) {
  return [
    ...changes.filter(
      (change) => change.taskId !== nextEntry.taskId || change.type === "delete",
    ),
    nextEntry,
  ];
}

function mergeRemoteWithPending(remoteTasks) {
  const localTasks = getAllCachedTasks();
  const pendingIds = new Set(getPendingChanges().map((change) => change.taskId));
  const pendingTasks = localTasks.filter(
    (task) => pendingIds.has(task._id) || task.localOnly || task.syncStatus === "pending",
  );

  const merged = [...remoteTasks.map((task) => normalizeTask(task))];

  pendingTasks.forEach((task) => {
    const existingIndex = merged.findIndex((item) => item._id === task._id);

    if (existingIndex >= 0) {
      merged.splice(existingIndex, 1, normalizeTask(task));
      return;
    }

    merged.unshift(normalizeTask(task));
  });

  setAllCachedTasks(merged);
  return merged;
}

export function getCachedTasksByPersona(persona) {
  if (!persona) return [];
  return getAllCachedTasks().filter((task) => task.persona === persona);
}

export function getPendingChangesCount() {
  return getPendingChanges().length;
}

export function saveTaskLocally(taskInput) {
  const now = new Date().toISOString();
  const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const task = normalizeTask(
    {
      ...taskInput,
      _id: tempId,
      createdAt: now,
      updatedAt: now,
    },
    {
      localOnly: true,
      syncStatus: "pending",
    },
  );

  const tasks = upsertTask(getAllCachedTasks(), task);
  setAllCachedTasks(tasks);

  const changes = [...getPendingChanges(), createQueueEntry("create", task._id, task)];
  setPendingChanges(changes);

  return task;
}

export function updateTaskLocally(taskId, updates) {
  const tasks = getAllCachedTasks();
  const existingTask = tasks.find((task) => task._id === taskId);

  if (!existingTask) {
    throw new Error("Task not found in local cache");
  }

  const updatedTask = normalizeTask(
    {
      ...existingTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    },
    {
      syncStatus: "pending",
      localOnly: existingTask.localOnly,
    },
  );

  setAllCachedTasks(upsertTask(tasks, updatedTask));

  const changes = getPendingChanges();
  const createChange = changes.find(
    (change) => change.taskId === taskId && change.type === "create",
  );

  if (createChange) {
    const nextChanges = changes.map((change) =>
      change.id === createChange.id
        ? {
            ...change,
            payload: updatedTask,
          }
        : change,
    );
    setPendingChanges(nextChanges);
    return updatedTask;
  }

  const nextChanges = replaceQueueEntry(
    changes.filter((change) => !(change.taskId === taskId && change.type === "update")),
    createQueueEntry("update", taskId, updatedTask),
  );
  setPendingChanges(nextChanges);

  return updatedTask;
}

export function deleteTaskLocally(taskId) {
  const tasks = getAllCachedTasks();
  const nextTasks = removeTask(tasks, taskId);
  setAllCachedTasks(nextTasks);

  const changes = getPendingChanges();
  const createChange = changes.find(
    (change) => change.taskId === taskId && change.type === "create",
  );

  if (createChange) {
    setPendingChanges(changes.filter((change) => change.taskId !== taskId));
    return;
  }

  const nextChanges = changes.filter(
    (change) => !(change.taskId === taskId && change.type === "update"),
  );
  nextChanges.push(createQueueEntry("delete", taskId, { _id: taskId }));
  setPendingChanges(nextChanges);
}

export async function fetchRemoteTasks(token) {
  const response = await fetch(buildApiUrl("/api/tasks"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch tasks");
  }

  const tasks = Array.isArray(data)
    ? data
    : Array.isArray(data.tasks)
      ? data.tasks
      : Array.isArray(data.data)
        ? data.data
        : [];

  return mergeRemoteWithPending(tasks);
}

export async function syncPendingChanges(token) {
  const queue = getPendingChanges();

  if (!queue.length) {
    return {
      didSync: false,
      remaining: 0,
    };
  }

  let tasks = getAllCachedTasks();
  let remainingQueue = [...queue];

  for (const change of queue) {
    try {
      if (change.type === "create") {
        const response = await fetch(buildApiUrl("/api/tasks"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(stripTaskForApi(change.payload)),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Failed to sync new task");
        }

        const createdTask = normalizeTask(data.task || data.data || data, {
          localOnly: false,
          syncStatus: "synced",
        });

        tasks = removeTask(tasks, change.taskId);
        tasks = upsertTask(tasks, createdTask);
      }

      if (change.type === "update") {
        const response = await fetch(buildApiUrl(`/api/tasks/${change.taskId}`), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(stripTaskForApi(change.payload)),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Failed to sync updated task");
        }

        const updatedTask = normalizeTask(data.task || data.data || data, {
          localOnly: false,
          syncStatus: "synced",
        });

        tasks = upsertTask(tasks, updatedTask);
      }

      if (change.type === "delete") {
        const response = await fetch(buildApiUrl(`/api/tasks/${change.taskId}`), {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Failed to sync deleted task");
        }

        tasks = removeTask(tasks, change.taskId);
      }

      remainingQueue = remainingQueue.filter((item) => item.id !== change.id);
      setAllCachedTasks(tasks);
      setPendingChanges(remainingQueue);
    } catch (error) {
      return {
        didSync: false,
        remaining: remainingQueue.length,
        error: error.message || "Sync failed",
      };
    }
  }

  return {
    didSync: true,
    remaining: remainingQueue.length,
  };
}
