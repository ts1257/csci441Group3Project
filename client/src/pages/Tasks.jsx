import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import TaskManager from "../components/dashboard/TaskManager";
import useOfflineTasks from "../hooks/useOfflineTasks";

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
  const {
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
    refreshTasks,
  } = useOfflineTasks(selectedPersonaName);

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
              {loading ? "..." : taskStats.total}
            </h3>
          </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">Active Tasks</p>
            <h3 className="mt-3 text-4xl font-bold">
              {loading ? "..." : taskStats.active}
            </h3>
          </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">Completed Tasks</p>
            <h3 className="mt-3 text-4xl font-bold">
              {loading ? "..." : taskStats.completed}
            </h3>
          </div>
        </div>

        <TaskManager
          selectedPersona={selectedPersona}
          selectedPersonaName={selectedPersonaName}
          key={displayPersonaName}
          tasks={tasks}
          tasksLoading={loading}
          tasksError={error}
          isOffline={isOffline}
          syncStatus={syncStatus}
          pendingChangesCount={pendingChangesCount}
          addTask={addTask}
          updateTask={updateTask}
          completeTask={completeTask}
          deleteTask={deleteTask}
          refreshTasks={refreshTasks}
        />
      </>
    );
}

export default Tasks;
