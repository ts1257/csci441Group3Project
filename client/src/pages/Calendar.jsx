import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");

  const [plannedPayments, setPlannedPayments] = useState([]);
  const [trips, setTrips] = useState([]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

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

  const changeMonth = (offset) => {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    setCurrentMonth(nextMonth);
    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  };

  const isSameDate = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <DashboardLayout
      title="Calendar"
      subtitle="View tasks on a monthly calendar for the active persona."
      financeTitle="Calendar"
      financeSubtitle="View planned payments on a monthly calendar for Finance mode."
    >
      {({ selectedPersona, selectedPersonaName, isFinance }) => (
        <CalendarContent
          selectedPersona={selectedPersona}
          selectedPersonaName={selectedPersonaName}
          isFinance={isFinance}
          tasks={tasks}
          setTasks={setTasks}
          tasksLoading={tasksLoading}
          setTasksLoading={setTasksLoading}
          tasksError={tasksError}
          setTasksError={setTasksError}
          plannedPayments={plannedPayments}
          setPlannedPayments={setPlannedPayments}
          trips={trips}
          setTrips={setTrips}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          parseLocalDate={parseLocalDate}
          formatDate={formatDate}
          dateKey={dateKey}
          today={today}
          priorityDotClass={priorityDotClass}
          changeMonth={changeMonth}
          isSameDate={isSameDate}
        />
      )}
    </DashboardLayout>
  );
}

function CalendarContent({
  selectedPersona,
  selectedPersonaName,
  isFinance,
  tasks,
  setTasks,
  tasksLoading,
  setTasksLoading,
  tasksError,
  setTasksError,
  plannedPayments,
  setPlannedPayments,
  trips,
  setTrips,
  currentMonth,
  selectedDate,
  setSelectedDate,
  parseLocalDate,
  formatDate,
  dateKey,
  today,
  priorityDotClass,
  changeMonth,
  isSameDate,
}) {
  const normalizedPersona = selectedPersonaName?.toLowerCase().trim();
  const isTravel = normalizedPersona === "travel";

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/planned-payments`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data)
            ? data
            : data.plannedPayments || data.data || [];
          setPlannedPayments(list);
        } else {
          setPlannedPayments([]);
        }
      } catch {
        setPlannedPayments([]);
      }
    };

    fetchPayments();
  }, [selectedPersonaName, setPlannedPayments]);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!isTravel) {
        setTrips([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.ok) {
          const list = Array.isArray(data) ? data : data.trips || data.data || [];
          setTrips(list);
        } else {
          setTrips([]);
        }
      } catch {
        setTrips([]);
      }
    };

    fetchTrips();
  }, [isTravel, setTrips]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedPersona || isFinance || isTravel) {
        setTasks([]);
        setTasksLoading(false);
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
          return task.persona === selectedPersonaName?.toLowerCase().trim();
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
  }, [selectedPersona, isFinance, isTravel, setTasks, setTasksLoading, setTasksError]);

  const tasksByDate = useMemo(() => {
    const map = new Map();

    tasks.forEach((task) => {
      if (!task.dueDate) return;

      const localDate = parseLocalDate(task.dueDate);
      const key = dateKey(localDate);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push({
        id: task._id,
        kind: "task",
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate,
        priority: task.priority || "",
        status: task.status || "",
      });
    });

    return map;
  }, [tasks, parseLocalDate, dateKey]);

  const plannedPaymentsByDate = useMemo(() => {
    const map = new Map();

    plannedPayments.forEach((payment) => {
      if (!payment.dueDate) return;

      const localDate = parseLocalDate(payment.dueDate);
      const key = dateKey(localDate);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push({
        id: payment._id,
        kind: "planned-payment",
        title: payment.title,
        description: payment.notes || "",
        dueDate: payment.dueDate,
        amount: payment.amount || 0,
        status: payment.status || "pending",
      });
    });

    return map;
  }, [plannedPayments, parseLocalDate, dateKey]);

  const tripsByDate = useMemo(() => {
    const map = new Map();

    trips.forEach((trip) => {
      if (!trip.startDate) return;

      const localDate = parseLocalDate(trip.startDate);
      const key = dateKey(localDate);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push({
        id: trip._id,
        kind: "trip",
        title: trip.tripName || "Trip",
        description: trip.destination || "No destination",
        dueDate: trip.startDate,
        endDate: trip.endDate,
        travelType: trip.travelType || "",
        status: "Trip",
      });
    });

    return map;
  }, [trips, parseLocalDate, dateKey]);

  const calendarItemsByDate = useMemo(() => {
    const map = new Map();

    if (isFinance) {
      plannedPaymentsByDate.forEach((items, key) => {
        map.set(key, items);
      });
      return map;
    }

    if (isTravel) {
      tripsByDate.forEach((items, key) => {
        map.set(key, items);
      });
      return map;
    }

    tasksByDate.forEach((items, key) => {
      map.set(key, items);
    });

    return map;
  }, [isFinance, isTravel, plannedPaymentsByDate, tasksByDate, tripsByDate]);

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

  const selectedDateItems = useMemo(() => {
    const key = dateKey(selectedDate);
    const list = calendarItemsByDate.get(key) || [];

    if (isFinance) {
      return [...list].sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === "pending") return -1;
        return 1;
      });
    }

    if (isTravel) {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return [...list].sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;
      return priorityB - priorityA;
    });
  }, [selectedDate, calendarItemsByDate, isFinance, isTravel, dateKey]);

  const monthTitle = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDateLabel = isFinance ? "Planned payments" : isTravel ? "Trips" : "Tasks";

  const totalPlannedPayments = useMemo(
    () => plannedPayments.length,
    [plannedPayments],
  );

  const financeThisMonth = useMemo(() => {
    return plannedPayments.filter((payment) => {
      if (!payment.dueDate) return false;
      const d = parseLocalDate(payment.dueDate);
      return (
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      );
    }).length;
  }, [plannedPayments, currentMonth, parseLocalDate]);

  const totalTrips = useMemo(() => trips.length, [trips]);

  const tripsThisMonth = useMemo(() => {
    return trips.filter((trip) => {
      if (!trip.startDate) return false;
      const d = parseLocalDate(trip.startDate);
      return (
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      );
    }).length;
  }, [trips, currentMonth, parseLocalDate]);

  const totalTasks = useMemo(() => tasks.length, [tasks]);

  const tasksThisMonth = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const d = parseLocalDate(task.dueDate);
      return (
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      );
    }).length;
  }, [tasks, currentMonth, parseLocalDate]);

  return (
    <>
      {isFinance ? (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">Total Planned Payments</p>
            <h3 className="mt-3 text-4xl font-bold">{totalPlannedPayments}</h3>
          </div>

          <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">This Month</p>
            <h3 className="mt-3 text-4xl font-bold">{financeThisMonth}</h3>
          </div>
        </div>
      ) : isTravel ? (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">Total Trips</p>
            <h3 className="mt-3 text-4xl font-bold">{totalTrips}</h3>
          </div>

          <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">Trips This Month</p>
            <h3 className="mt-3 text-4xl font-bold">{tripsThisMonth}</h3>
          </div>
        </div>
      ) : (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">Total Tasks</p>
            <h3 className="mt-3 text-4xl font-bold">{totalTasks}</h3>
          </div>

          <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">This Month</p>
            <h3 className="mt-3 text-4xl font-bold">{tasksThisMonth}</h3>
          </div>
        </div>
      )}

      <section className="rounded-4xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-6">
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
                  const dayItems = calendarItemsByDate.get(key) || [];
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
                        {dayItems.length > 0 && (
                          <span className="badge badge-primary badge-sm">
                            {dayItems.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayItems.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1 truncate rounded-lg bg-base-200 px-2 py-1 text-xs"
                          >
                            {!isFinance && !isTravel ? (
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${priorityDotClass(
                                  item.priority,
                                )}`}
                              />
                            ) : (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                            <span className="truncate">{item.title}</span>
                          </div>
                        ))}
                        {dayItems.length > 2 && (
                          <div className="text-xs opacity-60">
                            +{dayItems.length - 2} more
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
                  const dayItems = calendarItemsByDate.get(key) || [];
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

                        {dayItems.length > 0 && (
                          <span className="badge badge-primary badge-sm">
                            {dayItems.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayItems.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1 text-xs"
                          >
                            {!isFinance && !isTravel ? (
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${priorityDotClass(
                                  item.priority,
                                )}`}
                              />
                            ) : (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                            <span className="truncate">{item.title}</span>
                          </div>
                        ))}
                        {dayItems.length === 0 && (
                          <p className="text-xs opacity-50">
                            No {isFinance ? "payments" : isTravel ? "trips" : "tasks"}
                          </p>
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

      <section className="mt-6 rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">
            {selectedDateLabel} for {selectedDate.toLocaleDateString()}
          </h2>

          {!isFinance && !isTravel && (
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
          )}
        </div>

        {selectedDateItems.length === 0 ? (
          <p className="opacity-70">
            No {isFinance ? "planned payments" : isTravel ? "trips" : "tasks"} for this date.
          </p>
        ) : (
          <div className="space-y-4">
            {selectedDateItems.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-base-300 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm opacity-70">
                      {item.description || "No description"}
                    </p>
                    <p className="mt-2 text-sm opacity-60">
                      {item.kind === "trip" ? "Start" : "Due"}: {formatDate(item.dueDate)}
                    </p>
                    {item.kind === "trip" && item.endDate && (
                      <p className="mt-1 text-sm opacity-60">End: {formatDate(item.endDate)}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isFinance ? (
                      <>
                        <span className="badge badge-outline">
                          {item.status || "pending"}
                        </span>
                        <span className="badge badge-outline">
                          ${Number(item.amount || 0).toFixed(2)}
                        </span>
                      </>
                    ) : isTravel ? (
                      <>
                        <span className="badge badge-outline">Trip</span>
                        {item.travelType && (
                          <span className="badge badge-outline">{item.travelType}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="badge badge-outline flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${priorityDotClass(
                              item.priority,
                            )}`}
                          />
                          {item.priority
                            ? item.priority.charAt(0).toUpperCase() +
                              item.priority.slice(1)
                            : "No Priority"}
                        </span>
                        <span className="badge badge-outline">
                          {item.status || "No Status"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default Calendar;
