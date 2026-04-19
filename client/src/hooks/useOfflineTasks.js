import { useCallback, useEffect, useState } from "react";
import {
  deleteTaskLocally,
  fetchRemoteTasks,
  getCachedTasksByPersona,
  getPendingChangesCount,
  saveTaskLocally,
  syncPendingChanges,
  updateTaskLocally,
} from "../utils/taskOfflineSync";

export default function useOfflineTasks(selectedPersonaName) {
  const persona = selectedPersonaName?.toLowerCase().trim() || "";
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [syncStatus, setSyncStatus] = useState("idle");
  const [pendingChangesCount, setPendingChangesCount] = useState(
    getPendingChangesCount(),
  );

  const refreshFromCache = useCallback(() => {
    setTasks(getCachedTasksByPersona(persona));
    setPendingChangesCount(getPendingChangesCount());
  }, [persona]);

  const loadTasks = useCallback(async () => {
    if (!persona) {
      setTasks([]);
      setError("");
      setLoading(false);
      return;
    }

    refreshFromCache();
    setIsOffline(typeof navigator !== "undefined" ? !navigator.onLine : false);

    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (getPendingChangesCount() > 0) {
        setSyncStatus("syncing");
        const syncResult = await syncPendingChanges(token);
        refreshFromCache();

        if (syncResult.didSync) {
          setSyncStatus("synced");
        } else if (syncResult.error) {
          setSyncStatus("pending");
          setError(syncResult.error);
        }
      } else {
        setSyncStatus("idle");
      }

      const mergedTasks = await fetchRemoteTasks(token);
      setTasks(mergedTasks.filter((task) => task.persona === persona));
      setPendingChangesCount(getPendingChangesCount());
      setIsOffline(false);
      setError("");
    } catch (loadError) {
      setTasks(getCachedTasksByPersona(persona));
      setError(loadError.message || "Failed to load tasks");
      setIsOffline(true);
      setSyncStatus(getPendingChangesCount() > 0 ? "pending" : "idle");
    } finally {
      setLoading(false);
    }
  }, [persona, refreshFromCache]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void loadTasks();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus(getPendingChangesCount() > 0 ? "pending" : "idle");
      refreshFromCache();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadTasks, refreshFromCache]);

  const addTask = async (taskInput) => {
    const createdTask = saveTaskLocally({
      ...taskInput,
      persona,
    });
    refreshFromCache();

    if (typeof navigator !== "undefined" && navigator.onLine) {
      await loadTasks();
    } else {
      setSyncStatus("pending");
    }

    return createdTask;
  };

  const updateTask = async (taskId, updates) => {
    const updatedTask = updateTaskLocally(taskId, updates);
    refreshFromCache();

    if (typeof navigator !== "undefined" && navigator.onLine) {
      await loadTasks();
    } else {
      setSyncStatus("pending");
    }

    return updatedTask;
  };

  const completeTask = async (task) => {
    return updateTask(task._id, {
      ...task,
      status: "completed",
    });
  };

  const deleteTask = async (taskId) => {
    deleteTaskLocally(taskId);
    refreshFromCache();

    if (typeof navigator !== "undefined" && navigator.onLine) {
      await loadTasks();
    } else {
      setSyncStatus("pending");
    }
  };

  return {
    tasks,
    loading,
    error,
    isOffline,
    syncStatus,
    pendingChangesCount,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    refreshTasks: loadTasks,
  };
}
