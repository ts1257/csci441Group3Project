import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import TaskManager from "../components/dashboard/TaskManager";
import FinanceSection from "../components/dashboard/FinanceSection";

function Dashboard() {
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="View your overview for the active persona."
      studentSubtitle="Track your tasks, courses, and upcoming deadlines for Student mode."
      workSubtitle="Track your tasks, projects, and work deadlines for Work mode."
      wellnessSubtitle="Track wellness habits, medicine reminders, and self-care tasks."
      travelSubtitle="Track trip tasks based on each trip start date."
      financeTitle="Finance Dashboard"
      financeSubtitle="Track balance and pending payments for Finance mode."
    >
      {({
        selectedPersona,
        selectedPersonaName,
        isFinance,
        displayPersonaName,
      }) =>
        isFinance ? (
          <FinanceDashboardContent />
        ) : (
          <StandardDashboardContent
            selectedPersona={selectedPersona}
            selectedPersonaName={selectedPersonaName}
            displayPersonaName={displayPersonaName}
          />
        )
      }
    </DashboardLayout>
  );
}

function StandardDashboardContent({
  selectedPersona,
  selectedPersonaName,
  displayPersonaName,
}) {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const normalizedPersona = selectedPersonaName?.toLowerCase().trim();
  const isWellness = normalizedPersona === "wellness";
  const isTravel = normalizedPersona === "travel";

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedPersona) {
        setTasks([]);
        setHabits([]);
        setTrips([]);
        return;
      }

      try {
        setLoadingStats(true);
        const token = localStorage.getItem("token");

        const requests = [
          fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ];

        if (isWellness) {
          requests.push(
            fetch(`${import.meta.env.VITE_API_URL}/api/habits`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
        }

        if (isTravel) {
          requests.push(
            fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
        }

        const responses = await Promise.all(requests);
        const taskData = await responses[0].json();

        if (!responses[0].ok) {
          throw new Error(taskData.message || "Failed to fetch tasks");
        }

        const taskList = Array.isArray(taskData)
          ? taskData
          : Array.isArray(taskData.tasks)
            ? taskData.tasks
            : Array.isArray(taskData.data)
              ? taskData.data
              : [];

        setTasks(taskList.filter((task) => task.persona === normalizedPersona));

        if (isWellness && responses[1]) {
          const habitData = await responses[1].json();
          setHabits(
            Array.isArray(habitData)
              ? habitData
              : habitData.habits || habitData.data || [],
          );
        } else {
          setHabits([]);
        }

        if (isTravel && responses[1]) {
          const tripData = await responses[1].json();
          setTrips(
            Array.isArray(tripData)
              ? tripData
              : tripData.trips || tripData.data || [],
          );
        } else {
          setTrips([]);
        }
      } catch {
        setTasks([]);
        setHabits([]);
        setTrips([]);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [selectedPersona, normalizedPersona, isWellness, isTravel]);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const overviewCards = useMemo(() => {
    if (isWellness) {
      const medicineReminders = tasks.filter(
        (task) => task.taskType === "medicine" && task.status !== "completed",
      ).length;

      return [
        { label: "Daily Habits", value: habits.length },
        {
          label: "Completed Habits",
          value: habits.filter((habit) => habit.completedToday).length,
        },
        { label: "Medicine Reminders", value: medicineReminders },
      ];
    }

    if (isTravel) {
      const stats = getChecklistStats(trips, today);
      return [
        { label: "Today", value: stats.today },
        { label: "Upcoming", value: stats.upcoming },
        { label: "Overdue", value: stats.overdue },
      ];
    }

    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      if (task.status === "completed") return;

      const taskDate = parseLocalDate(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() === today.getTime()) {
        todayCount += 1;
      } else if (taskDate.getTime() > today.getTime()) {
        upcomingCount += 1;
      } else {
        overdueCount += 1;
      }
    });

    return [
      { label: "Today", value: todayCount },
      { label: "Upcoming", value: upcomingCount },
      { label: "Overdue", value: overdueCount },
    ];
  }, [tasks, habits, trips, isWellness, isTravel, today]);

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm"
          >
            <p className="text-sm opacity-60">{card.label}</p>
            <h3 className="mt-3 text-4xl font-bold">
              {loadingStats ? "..." : card.value}
            </h3>
          </div>
        ))}
      </div>

      {isTravel ? (
        <TravelDashboardTasks trips={trips} setTrips={setTrips} />
      ) : isWellness ? (
        <>
          <WellnessDashboardHabits habits={habits} setHabits={setHabits} />
          <TaskManager
            selectedPersona={selectedPersona}
            selectedPersonaName={selectedPersonaName}
            key={displayPersonaName}
            onTasksChange={(newTasks) => setTasks(newTasks)}
          />
        </>
      ) : (
        <TaskManager
          selectedPersona={selectedPersona}
          selectedPersonaName={selectedPersonaName}
          key={displayPersonaName}
          onTasksChange={(newTasks) => setTasks(newTasks)}
        />
      )}
    </>
  );
}

function WellnessDashboardHabits({ habits, setHabits }) {
  const updateHabit = async (habit, payload) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/habits/${habit._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update habit");
      const updatedHabit = data.habit || data.data || data;
      setHabits((prev) =>
        prev.map((item) =>
          item._id === updatedHabit._id ? updatedHabit : item,
        ),
      );
    } catch {
      return;
    }
  };

  const getNotDoneProgress = (habit) => {
    const goal = Number(habit.goal) || 0;

    if (goal > 0) {
      return String(Math.max(goal - 1, 0));
    }

    return String(Math.max((Number(habit.progress) || 0) - 1, 0));
  };

  const toggleHabit = async (habit) => {
    if (habit.completedToday) {
      await updateHabit(habit, {
        completedToday: false,
        progress: getNotDoneProgress(habit),
      });
      return;
    }

    await updateHabit(habit, {
      completedToday: true,
      progress: habit.goal
        ? String(Number(habit.goal) || habit.goal)
        : habit.progress || "0",
    });
  };

  const addOneUnit = async (habit) => {
    const currentProgress = Number(habit.progress) || 0;
    const goal = Number(habit.goal) || 0;
    const nextProgress = currentProgress + 1;
    const shouldComplete = goal > 0 && nextProgress >= goal;

    await updateHabit(habit, {
      progress: String(nextProgress),
      completedToday: shouldComplete ? true : habit.completedToday,
    });
  };

  const subtractOneUnit = async (habit) => {
    const currentProgress = Number(habit.progress) || 0;
    const goal = Number(habit.goal) || 0;
    const nextProgress = Math.max(currentProgress - 1, 0);
    const shouldStayComplete = goal > 0 && nextProgress >= goal;

    await updateHabit(habit, {
      progress: String(nextProgress),
      completedToday: shouldStayComplete,
    });
  };

  const formatProgress = (habit) => {
    const unit = habit.unit ? ` ${habit.unit}` : "";
    if (habit.goal && habit.progress)
      return `${habit.progress} / ${habit.goal}${unit}`;
    if (habit.goal) return `0 / ${habit.goal}${unit}`;
    if (habit.progress) return `${habit.progress}${unit}`;
    return `0${unit}`;
  };

  return (
    <section className="mb-6 rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
      <h2 className="text-2xl font-bold md:text-3xl">Daily Habits</h2>
      <p className="mt-1 text-sm opacity-70">
        Complete your daily habits here. Add or edit habits from the Habits
        page.
      </p>

      {habits.length === 0 ? (
        <p className="mt-5 opacity-70">
          No habits found. Add habits from the Habits page.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {habits.map((habit) => (
            <div
              key={habit._id}
              className="rounded-3xl border border-base-300 p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{habit.name}</h3>
                  <p className="text-sm opacity-70">{formatProgress(habit)}</p>
                  <p className="text-sm opacity-70">
                    Unit: {habit.unit || "Not set"}
                  </p>
                  <p className="text-sm opacity-70">
                    Reminder: {habit.reminderTime || "Not set"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    className="btn btn-outline btn-sm rounded-xl"
                    onClick={() => addOneUnit(habit)}
                  >
                    +1 {habit.unit || "unit"}
                  </button>
                  <button
                    className="btn btn-outline btn-sm rounded-xl"
                    onClick={() => subtractOneUnit(habit)}
                  >
                    -1 {habit.unit || "unit"}
                  </button>
                  <button
                    className={`btn btn-sm rounded-xl ${habit.completedToday ? "btn-success" : "btn-outline"}`}
                    onClick={() => toggleHabit(habit)}
                  >
                    {habit.completedToday ? "Done" : "Complete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TravelDashboardTasks({ trips, setTrips }) {
  const [activeTab, setActiveTab] = useState("Today");
  const tabs = ["Today", "Upcoming", "Completed", "Overdue"];

  const toggleChecklistItem = async (trip, itemIndex) => {
    try {
      const token = localStorage.getItem("token");
      const checklist = (trip.checklist || []).map((item, index) =>
        index === itemIndex ? { ...item, completed: !item.completed } : item,
      );
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trips/${trip._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ checklist }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update checklist");
      const updatedTrip = data.trip || data.data || data;
      setTrips((prev) =>
        prev.map((item) => (item._id === updatedTrip._id ? updatedTrip : item)),
      );
    } catch {
      return;
    }
  };

  const filteredGroups = useMemo(() => {
    return trips
      .map((trip) => ({
        trip,
        items: (trip.checklist || [])
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => {
            if (activeTab === "Completed") return item.completed;
            if (item.completed) return false;
            return (
              getTripDateBucket(trip.startDate) === activeTab.toLowerCase()
            );
          }),
      }))
      .filter((group) => group.items.length > 0);
  }, [trips, activeTab]);

  return (
    <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Tasks</h2>
          <p className="mt-1 text-sm opacity-70">
            Travel checklist tasks are filtered by each trip start date.
          </p>
        </div>
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

      {trips.length === 0 ? (
        <p className="mt-6 opacity-70">
          No trips found. Add a trip from the Trips page.
        </p>
      ) : filteredGroups.length === 0 ? (
        <p className="mt-6 opacity-70">
          No travel tasks found for {activeTab.toLowerCase()}.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(({ trip, items }) => (
            <div
              key={trip._id}
              className="rounded-3xl border border-base-300 p-5"
            >
              <h3 className="text-lg font-semibold">{trip.tripName}</h3>
              <p className="text-sm opacity-70">
                {trip.destination} • Start: {formatDate(trip.startDate)}
              </p>

              <div className="mt-4 space-y-2">
                {items.map(({ item, index }) => (
                  <label
                    key={`${trip._id}-${item._id || index}`}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl bg-base-200 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(trip, index)}
                    />
                    <span
                      className={
                        item.completed ? "line-through opacity-60" : ""
                      }
                    >
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FinanceDashboardContent() {
  const [records, setRecords] = useState([]);
  const [plannedPayments, setPlannedPayments] = useState([]);

  const loadFinanceData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [recordsRes, paymentsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/records`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/planned-payments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        const list = Array.isArray(data)
          ? data
          : data.records || data.data || [];
        setRecords(list);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        const list = Array.isArray(data)
          ? data
          : data.plannedPayments || data.data || [];
        setPlannedPayments(list);
      }
    } catch {
      return;
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const financeStats = useMemo(() => {
    const income = records
      .filter((record) => record.type === "income")
      .reduce((sum, record) => sum + (Number(record.amount) || 0), 0);

    const expense = records
      .filter((record) => record.type === "expense")
      .reduce((sum, record) => sum + (Number(record.amount) || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingTotal = plannedPayments
      .filter((payment) => payment.status !== "paid")
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    const overdueTotal = plannedPayments
      .filter((payment) => {
        if (payment.status === "paid") return false;
        if (!payment.dueDate) return false;
        const dueDate = parseLocalDate(payment.dueDate);
        return dueDate < today;
      })
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    return {
      balance: income - expense,
      pendingTotal,
      overdueTotal,
    };
  }, [records, plannedPayments]);

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Balance</p>
          <h3 className="mt-3 text-4xl font-bold">
            ${financeStats.balance.toFixed(2)}
          </h3>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Pending Total</p>
          <h3 className="mt-3 text-4xl font-bold">
            ${financeStats.pendingTotal.toFixed(2)}
          </h3>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Overdue</p>
          <h3 className="mt-3 text-4xl font-bold">
            ${financeStats.overdueTotal.toFixed(2)}
          </h3>
        </div>
      </div>

      <FinanceSection
        onDataChange={({ records: newRecords, payments: newPayments }) => {
          if (newRecords) setRecords(newRecords);
          if (newPayments) setPlannedPayments(newPayments);
        }}
      />
    </>
  );
}

function getChecklistStats(trips, today) {
  const result = { today: 0, upcoming: 0, overdue: 0 };

  trips.forEach((trip) => {
    const pendingItems = (trip.checklist || []).filter(
      (item) => !item.completed,
    ).length;
    if (pendingItems === 0) return;
    const bucket = getTripDateBucket(trip.startDate, today);
    result[bucket] += pendingItems;
  });

  return result;
}

function getTripDateBucket(startDate, todayValue = null) {
  const today = todayValue || new Date();
  today.setHours(0, 0, 0, 0);

  const tripStart = parseLocalDate(startDate);
  if (!tripStart) return "upcoming";

  tripStart.setHours(0, 0, 0, 0);

  if (tripStart.getTime() === today.getTime()) return "today";
  if (tripStart.getTime() > today.getTime()) return "upcoming";
  return "overdue";
}

function parseLocalDate(dateString) {
  if (!dateString) return null;
  const datePart = dateString.includes("T")
    ? dateString.split("T")[0]
    : dateString;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateValue) {
  if (!dateValue) return "Not set";
  return parseLocalDate(dateValue).toLocaleDateString();
}

export default Dashboard;
