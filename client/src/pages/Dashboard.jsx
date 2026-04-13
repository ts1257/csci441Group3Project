import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router";

function Dashboard() {
  const [online, setOnline] = useState(navigator.onLine);
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedPersonaName, setSelectedPersonaName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Today");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    const openSidebar = () => setSidebarOpen(true);

    window.addEventListener("open-dashboard-sidebar", openSidebar);

    return () => {
      window.removeEventListener("open-dashboard-sidebar", openSidebar);
    };
  }, []);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/personas`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch personas");
        }

        const personaList = Array.isArray(data)
          ? data
          : Array.isArray(data.personas)
            ? data.personas
            : Array.isArray(data.data)
              ? data.data
              : [];

        setPersonas(personaList);

        if (personaList.length > 0) {
          setSelectedPersona(personaList[0]._id);
          setSelectedPersonaName(personaList[0].name);
        }
      } catch (err) {
        setError(err.message || "Something went wrong");
        setPersonas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedPersona) {
        setTasks([]);
        return;
      }

      try {
        setTasksLoading(true);
        setTasksError("");

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
          const taskPersonaId =
            typeof task.persona === "object" ? task.persona?._id : task.persona;

          return taskPersonaId === selectedPersona;
        });

        setTasks(filteredTasks);
      } catch (err) {
        setTasksError(err.message || "Failed to load tasks");
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasks();
  }, [selectedPersona]);

  const handlePersonaChange = (e) => {
    const personaId = e.target.value;
    const foundPersona = personas.find((persona) => persona._id === personaId);

    setSelectedPersona(personaId);
    setSelectedPersonaName(foundPersona ? foundPersona.name : "");
  };

  const tabs = ["Today", "Upcoming", "Completed", "Overdue"];

  const filteredTasksByTab = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      const taskDate = task.dueDate ? new Date(task.dueDate) : null;
      const isCompleted =
        task.status?.toLowerCase() === "completed" || task.completed === true;

      if (activeTab === "Completed") {
        return isCompleted;
      }

      if (activeTab === "Today") {
        if (!taskDate || isCompleted) return false;
        const compareDate = new Date(taskDate);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate.getTime() === today.getTime();
      }

      if (activeTab === "Upcoming") {
        if (!taskDate || isCompleted) return false;
        const compareDate = new Date(taskDate);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate.getTime() > today.getTime();
      }

      if (activeTab === "Overdue") {
        if (!taskDate || isCompleted) return false;
        const compareDate = new Date(taskDate);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate.getTime() < today.getTime();
      }

      return true;
    });
  }, [tasks, activeTab]);

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      const isCompleted =
        task.status?.toLowerCase() === "completed" || task.completed === true;
      return taskDate.getTime() === today.getTime() && !isCompleted;
    }).length;
  }, [tasks]);

  const overdueCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      const isCompleted =
        task.status?.toLowerCase() === "completed" || task.completed === true;
      return taskDate.getTime() < today.getTime() && !isCompleted;
    }).length;
  }, [tasks]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "No due date";
    const date = new Date(dateValue);
    return date.toLocaleDateString();
  };

  const SidebarContent = () => (
    <>
      <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide opacity-60">
          Active Persona
        </p>
        <h2 className="text-2xl font-bold">
          {selectedPersonaName || "Persona"}
        </h2>
      </div>

      <div className="rounded-3xl border border-base-300 bg-base-100 p-3 shadow-sm">
        <ul className="menu gap-1">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive
                  ? "rounded-2xl bg-primary/10 font-semibold text-primary"
                  : "rounded-2xl"
              }
              onClick={() => setSidebarOpen(false)}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="rounded-2xl"
              onClick={() => setSidebarOpen(false)}
            >
              Courses
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="rounded-2xl"
              onClick={() => setSidebarOpen(false)}
            >
              Tasks
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="rounded-2xl"
              onClick={() => setSidebarOpen(false)}
            >
              Calendar
            </Link>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-base-300 bg-base-100 p-3 shadow-sm">
        <ul className="menu gap-1">
          <li>
            <button className="justify-start rounded-2xl">Dark Mode</button>
          </li>
          <li>
            <button className="justify-start rounded-2xl">Collapse</button>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <div className="min-h-[calc(100vh-73px)] bg-base-200">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-28 space-y-4">
            <SidebarContent />
          </div>
        </aside>

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed right-0 top-0 z-50 h-full w-72 overflow-y-auto bg-base-200 p-4 lg:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  className="btn btn-ghost btn-sm rounded-xl"
                  onClick={() => setSidebarOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <SidebarContent />
              </div>
            </aside>
          </>
        )}

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">Dashboard</h1>
              <p className="mt-1 text-sm opacity-70 md:text-base">
                Manage your tasks, switch personas, and track your progress.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium opacity-70">Mode</span>
                {loading ? (
                  <span className="text-sm">Loading...</span>
                ) : error ? (
                  <span className="text-sm text-error">{error}</span>
                ) : personas.length === 0 ? (
                  <span className="text-sm">No personas found</span>
                ) : (
                  <select
                    className="select select-bordered rounded-2xl"
                    value={selectedPersona}
                    onChange={handlePersonaChange}
                  >
                    {personas.map((persona) => (
                      <option key={persona._id} value={persona._id}>
                        {persona.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="badge badge-outline rounded-full px-4 py-3">
                {online ? "Online" : "Offline"}
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide opacity-60">
                Total Tasks
              </p>
              <h3 className="mt-3 text-4xl font-bold">{tasks.length}</h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide opacity-60">
                Today
              </p>
              <h3 className="mt-3 text-4xl font-bold">{todayCount}</h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide opacity-60">
                Overdue
              </p>
              <h3 className="mt-3 text-4xl font-bold">{overdueCount}</h3>
            </div>
          </div>

          <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold md:text-3xl">Tasks</h2>
              <button className="btn btn-primary rounded-2xl">Add Task</button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 hover:bg-base-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {tasksLoading ? (
              <p>Loading tasks...</p>
            ) : tasksError ? (
              <p className="text-error">{tasksError}</p>
            ) : filteredTasksByTab.length === 0 ? (
              <p className="opacity-70">
                No tasks found for {activeTab.toLowerCase()}.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredTasksByTab.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-3xl border border-base-300 bg-base-100 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <p className="mt-1 text-sm opacity-70">
                          {task.description || "No description"}
                        </p>
                        <p className="mt-2 text-sm opacity-60">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      </div>

                      <span className="badge badge-outline">
                        {task.priority || "No Priority"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
