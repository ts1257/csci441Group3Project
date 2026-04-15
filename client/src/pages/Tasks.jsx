import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import TaskManager from "../components/dashboard/TaskManager";

function Tasks() {
  const [taskStats, setTaskStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
  });

  return (
    <DashboardLayout
      title="Tasks"
      subtitle="View and manage tasks for the active persona."
      restrictTo="non-finance"
    >
      {({ selectedPersona, selectedPersonaName, displayPersonaName }) => (
        <TasksContent
          selectedPersona={selectedPersona}
          selectedPersonaName={selectedPersonaName}
          displayPersonaName={displayPersonaName}
          taskStats={taskStats}
          setTaskStats={setTaskStats}
        />
      )}
    </DashboardLayout>
  );
}

function TasksContent({
  selectedPersona,
  selectedPersonaName,
  displayPersonaName,
  taskStats,
  setTaskStats,
}) {
  const [tasks, setTasks] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchTasksForStats = async () => {
      if (!selectedPersona) {
        setTasks([]);
        setTaskStats({
          total: 0,
          active: 0,
          completed: 0,
        });
        return;
      }

      try {
        setLoadingStats(true);

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tasks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch tasks");
        }

        const taskList = Array.isArray(data)
          ? data
          : Array.isArray(data.tasks)
            ? data.tasks
            : Array.isArray(data.data)
              ? data.data
              : [];

        const filteredTasks = taskList.filter((task) => {
          return task.persona === selectedPersonaName?.toLowerCase().trim();
        });

        setTasks(filteredTasks);
      } catch {
        setTasks([]);
        setTaskStats({
          total: 0,
          active: 0,
          completed: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchTasksForStats();
  }, [selectedPersona, setTaskStats]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed",
    ).length;
    const active = total - completed;

    return {
      total,
      active,
      completed,
    };
  }, [tasks]);

  useEffect(() => {
    setTaskStats(stats);
  }, [stats, setTaskStats]);

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Total Tasks</p>
          <h3 className="mt-3 text-4xl font-bold">
            {loadingStats ? "..." : taskStats.total}
          </h3>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Active Tasks</p>
          <h3 className="mt-3 text-4xl font-bold">
            {loadingStats ? "..." : taskStats.active}
          </h3>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Completed Tasks</p>
          <h3 className="mt-3 text-4xl font-bold">
            {loadingStats ? "..." : taskStats.completed}
          </h3>
        </div>
      </div>

      <TaskManager
        selectedPersona={selectedPersona}
        selectedPersonaName={selectedPersonaName}
        key={displayPersonaName}
      />
    </>
  );
}

export default Tasks;
