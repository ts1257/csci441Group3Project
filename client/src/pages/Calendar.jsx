import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";

function Calendar() {
  const [online, setOnline] = useState(navigator.onLine);
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedPersonaName, setSelectedPersonaName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

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

        const savedPersonaId = localStorage.getItem("activePersonaId");
        const savedPersonaName = localStorage.getItem("activePersonaName");

        let initialPersona = null;

        if (savedPersonaId) {
          initialPersona = personaList.find(
            (persona) => persona._id === savedPersonaId,
          );
        }

        if (!initialPersona && savedPersonaName) {
          initialPersona = personaList.find(
            (persona) =>
              persona.name?.toLowerCase().trim() ===
              savedPersonaName.toLowerCase().trim(),
          );
        }

        if (!initialPersona && personaList.length > 0) {
          initialPersona = personaList[0];
        }

        if (initialPersona) {
          setSelectedPersona(initialPersona._id);
          setSelectedPersonaName(initialPersona.name);
          localStorage.setItem("activePersonaId", initialPersona._id);
          localStorage.setItem("activePersonaName", initialPersona.name);
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

    localStorage.setItem("activePersonaId", personaId);
    localStorage.setItem(
      "activePersonaName",
      foundPersona ? foundPersona.name : "",
    );
  };

  const parseLocalDate = (dateString) => {
    if (!dateString) return null;

    const datePart = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString;
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "No due date";
    return parseLocalDate(dateValue).toLocaleDateString();
  };

  const dateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const priorityDotClass = (priority) => {
    if (priority === "high") return "bg-error";
    if (priority === "medium") return "bg-warning";
    if (priority === "low") return "bg-success";
    return "bg-base-300";
  };

  const tasksByDate = useMemo(() => {
    const map = new Map();

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const localDate = parseLocalDate(task.dueDate);
      const key = dateKey(localDate);

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(task);
    });

    return map;
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [currentMonth]);

  const mobileDays = useMemo(
    () => calendarDays.filter((day) => day !== null),
    [calendarDays],
  );

  const selectedDateTasks = useMemo(() => {
    const key = dateKey(selectedDate);
    const list = tasksByDate.get(key) || [];

    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return [...list].sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;
      return priorityB - priorityA;
    });
  }, [selectedDate, tasksByDate]);

  const changeMonth = (offset) => {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    setCurrentMonth(nextMonth);

    const nextSelected = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      1,
    );
    setSelectedDate(nextSelected);
  };

  const isSameDate = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const monthTitle = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-[calc(100vh-73px)] bg-base-200">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-28 space-y-4">
            <Sidebar
              selectedPersonaName={selectedPersonaName}
              onNavigate={() => setSidebarOpen(false)}
            />
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
                <Sidebar
                  selectedPersonaName={selectedPersonaName}
                  onNavigate={() => setSidebarOpen(false)}
                />
              </div>
            </aside>
          </>
        )}

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">Calendar</h1>
              <p className="mt-1 text-sm opacity-70 md:text-base">
                View tasks on a monthly calendar for the active persona.
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

          <section className="rounded-[2rem] border border-base-300 bg-base-100 p-4 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                className="btn btn-outline btn-sm rounded-2xl sm:btn-md"
                onClick={() => changeMonth(-1)}
              >
                Prev
              </button>

              <h2 className="text-center text-lg font-bold sm:text-xl md:text-2xl">
                {monthTitle}
              </h2>

              <button
                className="btn btn-outline btn-sm rounded-2xl sm:btn-md"
                onClick={() => changeMonth(1)}
              >
                Next
              </button>
            </div>

            {tasksLoading ? (
              <p>Loading calendar...</p>
            ) : tasksError ? (
              <p className="text-error">{tasksError}</p>
            ) : (
              <>
                <div className="hidden md:block">
                  <div className="mb-3 grid grid-cols-7 gap-2 text-center text-sm font-semibold opacity-70">
                    {weekdayLabels.map((label) => (
                      <div key={label} className="py-2">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="min-h-28 rounded-2xl bg-base-200"
                          />
                        );
                      }

                      const key = dateKey(day);
                      const dayTasks = tasksByDate.get(key) || [];
                      const isSelected = isSameDate(day, selectedDate);
                      const isToday = isSameDate(day, today);

                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedDate(day)}
                          className={`min-h-28 rounded-2xl border p-2 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-base-300 bg-base-100 hover:bg-base-200"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span
                              className={`text-sm font-semibold ${
                                isToday ? "text-primary" : ""
                              }`}
                            >
                              {day.getDate()}
                            </span>
                            {dayTasks.length > 0 && (
                              <span className="badge badge-primary badge-sm">
                                {dayTasks.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            {dayTasks.slice(0, 2).map((task) => (
                              <div
                                key={task._id}
                                className="flex items-center gap-1 truncate rounded-lg bg-base-200 px-2 py-1 text-xs"
                              >
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full ${priorityDotClass(
                                    task.priority,
                                  )}`}
                                />
                                <span className="truncate">{task.title}</span>
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <div className="text-xs opacity-60">
                                +{dayTasks.length - 2} more
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:hidden">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {mobileDays.map((day) => {
                      const key = dateKey(day);
                      const dayTasks = tasksByDate.get(key) || [];
                      const isSelected = isSameDate(day, selectedDate);
                      const isToday = isSameDate(day, today);

                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedDate(day)}
                          className={`rounded-2xl border p-3 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-base-300 bg-base-100"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <p className="text-xs opacity-60">
                                {day.toLocaleDateString(undefined, {
                                  weekday: "short",
                                })}
                              </p>
                              <p
                                className={`text-lg font-bold ${
                                  isToday ? "text-primary" : ""
                                }`}
                              >
                                {day.getDate()}
                              </p>
                            </div>

                            {dayTasks.length > 0 && (
                              <span className="badge badge-primary badge-sm">
                                {dayTasks.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            {dayTasks.slice(0, 2).map((task) => (
                              <div
                                key={task._id}
                                className="flex items-center gap-1 text-xs"
                              >
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full ${priorityDotClass(
                                    task.priority,
                                  )}`}
                                />
                                <span className="truncate">{task.title}</span>
                              </div>
                            ))}
                            {dayTasks.length === 0 && (
                              <p className="text-xs opacity-50">No tasks</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="mt-6 rounded-[2rem] border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold sm:text-2xl">
                Tasks for {selectedDate.toLocaleDateString()}
              </h2>

              <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-error" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-warning" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-success" />
                  <span>Low</span>
                </div>
              </div>
            </div>

            {selectedDateTasks.length === 0 ? (
              <p className="opacity-70">No tasks for this date.</p>
            ) : (
              <div className="space-y-4">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-3xl border border-base-300 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <p className="mt-1 text-sm opacity-70">
                          {task.description || "No description"}
                        </p>
                        <p className="mt-2 text-sm opacity-60">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="badge badge-outline flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${priorityDotClass(
                              task.priority,
                            )}`}
                          />
                          {task.priority
                            ? task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)
                            : "No Priority"}
                        </span>
                        <span className="badge badge-outline">
                          {task.status || "No Status"}
                        </span>
                      </div>
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

export default Calendar;
