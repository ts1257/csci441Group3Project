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
      adminTitle="Admin Dashboard"
      adminSubtitle="Monitor users, tasks, and system records across the planner."
    >
      {({ selectedPersona, selectedPersonaName, isAdmin, isFinance, displayPersonaName }) =>
        isAdmin ? (
          <AdminDashboardContent />
        ) : isFinance ? (
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

function AdminDashboardContent() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load admin stats");
        }

        setStats(data.stats || data.data || data);
      } catch (err) {
        setError(err.message || "Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const activityCounts = useMemo(() => {
    return [
      { label: "Users", value: stats?.totalUsers ?? 0 },
      { label: "Admins", value: stats?.totalAdmins ?? 0 },
      { label: "Tasks", value: stats?.totalTasks ?? 0 },
      { label: "Courses", value: stats?.totalCourses ?? 0 },
      { label: "Projects", value: stats?.totalProjects ?? 0 },
      { label: "Habits", value: stats?.totalHabits ?? 0 },
      { label: "Trips", value: stats?.totalTrips ?? 0 },
      { label: "Finance Records", value: stats?.totalRecords ?? 0 },
      { label: "Planned Payments", value: stats?.totalPlannedPayments ?? 0 },
      { label: "Categories", value: stats?.totalCategories ?? 0 },
      { label: "Personas", value: stats?.totalPersonas ?? 0 },
      { label: "System Records", value: stats?.totalSystemItems ?? 0 },
    ];
  }, [stats]);

  const systemChartData = useMemo(() => {
    return activityCounts.filter((item) => item.label !== "System Records");
  }, [activityCounts]);

  return (
    <div className="space-y-6">
      {error && <div className="alert alert-error rounded-2xl">{error}</div>}

      <section className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-bold md:text-3xl">System Activity Counts</h2>
          <p className="mt-1 text-sm opacity-70">
            Monitor the total records stored across users, personas, tasks, trips, habits, and finance modules.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activityCounts.map((item) => (
            <StatRow key={item.label} label={item.label} value={item.value} loading={loading} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
        <SectionHeader
          title="System Activity Chart"
          subtitle="Visual comparison of the main data records across the application."
        />
        <SimpleBarChart data={systemChartData} loading={loading} />
      </section>
    </div>
  );
}

function StatRow({ label, value, loading }) {
  return (
    <div className="rounded-2xl bg-base-200 p-4">
      <p className="text-sm opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-bold">{loading ? "..." : value}</p>
    </div>
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
          setHabits(Array.isArray(habitData) ? habitData : habitData.habits || habitData.data || []);
        } else {
          setHabits([]);
        }

        if (isTravel && responses[1]) {
          const tripData = await responses[1].json();
          setTrips(Array.isArray(tripData) ? tripData : tripData.trips || tripData.data || []);
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
        { label: "Completed Habits", value: habits.filter((habit) => habit.completedToday).length },
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

  const analyticsContent = useMemo(() => {
    if (isWellness) {
      return {
        title: "Wellness Progress Analytics",
        subtitle: "Track daily habit completion and medicine reminder progress.",
        completionTitle: "Habit Completion",
        completionValue: getPercentage(habits.filter((habit) => habit.completedToday).length, habits.length),
        barData: habits.map((habit) => ({
          label: habit.name,
          value: Math.min(Number(habit.progress) || 0, Number(habit.goal) || Number(habit.progress) || 0),
          total: Number(habit.goal) || Number(habit.progress) || 1,
          detail: `${habit.progress || 0}/${habit.goal || 0} ${habit.unit || ""}`.trim(),
        })),
      };
    }

    if (isTravel) {
      const checklistItems = trips.flatMap((trip) => trip.checklist || []);
      return {
        title: "Travel Checklist Analytics",
        subtitle: "View checklist progress across upcoming and active trips.",
        completionTitle: "Checklist Completion",
        completionValue: getPercentage(checklistItems.filter((item) => item.completed).length, checklistItems.length),
        barData: trips.map((trip) => {
          const items = trip.checklist || [];
          const completed = items.filter((item) => item.completed).length;
          return {
            label: trip.tripName,
            value: completed,
            total: items.length || 1,
            detail: `${completed}/${items.length} done`,
          };
        }),
      };
    }

    const completedTasks = tasks.filter((task) => task.status === "completed").length;
    return {
      title: `${displayPersonaName || "Persona"} Productivity Analytics`,
      subtitle: "View task completion and workload distribution for the active persona.",
      completionTitle: "Task Completion",
      completionValue: getPercentage(completedTasks, tasks.length),
      barData: [
        { label: "Completed", value: completedTasks },
        { label: "Pending", value: tasks.filter((task) => task.status !== "completed").length },
        { label: "High Priority", value: tasks.filter((task) => task.priority === "High").length },
        { label: "Medium Priority", value: tasks.filter((task) => task.priority === "Medium").length },
        { label: "Low Priority", value: tasks.filter((task) => task.priority === "Low").length },
      ],
    };
  }, [tasks, habits, trips, isWellness, isTravel, displayPersonaName]);

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <p className="text-sm opacity-60">{card.label}</p>
            <h3 className="mt-3 text-4xl font-bold">{loadingStats ? "..." : card.value}</h3>
          </div>
        ))}
      </div>

      <AnalyticsSection
        title={analyticsContent.title}
        subtitle={analyticsContent.subtitle}
        completionTitle={analyticsContent.completionTitle}
        completionValue={analyticsContent.completionValue}
        barData={analyticsContent.barData}
        loading={loadingStats}
      />

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/habits/${habit._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update habit");
      const updatedHabit = data.habit || data.data || data;
      setHabits((prev) => prev.map((item) => (item._id === updatedHabit._id ? updatedHabit : item)));
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
      progress: habit.goal ? String(Number(habit.goal) || habit.goal) : habit.progress || "0",
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
    if (habit.goal && habit.progress) return `${habit.progress} / ${habit.goal}${unit}`;
    if (habit.goal) return `0 / ${habit.goal}${unit}`;
    if (habit.progress) return `${habit.progress}${unit}`;
    return `0${unit}`;
  };

  return (
    <section className="mb-6 rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
      <h2 className="text-2xl font-bold md:text-3xl">Daily Habits</h2>
      <p className="mt-1 text-sm opacity-70">Complete your daily habits here. Add or edit habits from the Habits page.</p>

      {habits.length === 0 ? (
        <p className="mt-5 opacity-70">No habits found. Add habits from the Habits page.</p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {habits.map((habit) => (
            <div key={habit._id} className="rounded-3xl border border-base-300 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{habit.name}</h3>
                  <p className="text-sm opacity-70">{formatProgress(habit)}</p>
                  <p className="text-sm opacity-70">Unit: {habit.unit || "Not set"}</p>
                  <p className="text-sm opacity-70">Reminder: {habit.reminderTime || "Not set"}</p>
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${trip._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checklist }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update checklist");
      const updatedTrip = data.trip || data.data || data;
      setTrips((prev) => prev.map((item) => (item._id === updatedTrip._id ? updatedTrip : item)));
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
            return getTripDateBucket(trip.startDate) === activeTab.toLowerCase();
          }),
      }))
      .filter((group) => group.items.length > 0);
  }, [trips, activeTab]);

  return (
    <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Tasks</h2>
          <p className="mt-1 text-sm opacity-70">Travel checklist tasks are filtered by each trip start date.</p>
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
        <p className="mt-6 opacity-70">No trips found. Add a trip from the Trips page.</p>
      ) : filteredGroups.length === 0 ? (
        <p className="mt-6 opacity-70">No travel tasks found for {activeTab.toLowerCase()}.</p>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(({ trip, items }) => (
            <div key={trip._id} className="rounded-3xl border border-base-300 p-5">
              <h3 className="text-lg font-semibold">{trip.tripName}</h3>
              <p className="text-sm opacity-70">{trip.destination} • Start: {formatDate(trip.startDate)}</p>

              <div className="mt-4 space-y-2">
                {items.map(({ item, index }) => (
                  <label key={`${trip._id}-${item._id || index}`} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-base-200 px-4 py-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(trip, index)}
                    />
                    <span className={item.completed ? "line-through opacity-60" : ""}>{item.text}</span>
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
        const list = Array.isArray(data) ? data : data.records || data.data || [];
        setRecords(list);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        const list = Array.isArray(data) ? data : data.plannedPayments || data.data || [];
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
      income,
      expense,
      balance: income - expense,
      pendingTotal,
      overdueTotal,
      paidPayments: plannedPayments.filter((payment) => payment.status === "paid").length,
      pendingPayments: plannedPayments.filter((payment) => payment.status !== "paid").length,
    };
  }, [records, plannedPayments]);

  const financeChartData = useMemo(() => {
    return [
      { label: "Income", value: financeStats.income, detail: `$${financeStats.income.toFixed(2)}` },
      { label: "Expenses", value: financeStats.expense, detail: `$${financeStats.expense.toFixed(2)}` },
      { label: "Pending", value: financeStats.pendingTotal, detail: `$${financeStats.pendingTotal.toFixed(2)}` },
      { label: "Overdue", value: financeStats.overdueTotal, detail: `$${financeStats.overdueTotal.toFixed(2)}` },
    ];
  }, [financeStats]);

  const paymentCompletion = getPercentage(financeStats.paidPayments, plannedPayments.length);

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Balance</p>
          <h3 className="mt-3 text-4xl font-bold">${financeStats.balance.toFixed(2)}</h3>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Pending Total</p>
          <h3 className="mt-3 text-4xl font-bold">${financeStats.pendingTotal.toFixed(2)}</h3>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Overdue</p>
          <h3 className="mt-3 text-4xl font-bold">${financeStats.overdueTotal.toFixed(2)}</h3>
        </div>
      </div>

      <AnalyticsSection
        title="Finance Analytics"
        subtitle="Compare income, expenses, pending payments, and paid payment progress."
        completionTitle="Paid Payments"
        completionValue={paymentCompletion}
        barData={financeChartData}
      />

      <FinanceSection
        onDataChange={({ records: newRecords, payments: newPayments }) => {
          if (newRecords) setRecords(newRecords);
          if (newPayments) setPlannedPayments(newPayments);
        }}
      />
    </>
  );
}

function AnalyticsSection({ title, subtitle, completionTitle, completionValue, barData, loading = false }) {
  return (
    <section className="mb-6 rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ProgressRing title={completionTitle} value={completionValue} loading={loading} />
        <SimpleBarChart data={barData} loading={loading} />
      </div>
    </section>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
      <p className="mt-1 text-sm opacity-70">{subtitle}</p>
    </div>
  );
}

function ProgressRing({ title, value, loading }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(value, 100)) : 0;

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-base-200 p-6 text-center">
      <div
        className="grid h-36 w-36 place-items-center rounded-full text-primary"
        style={{
          background: `conic-gradient(currentColor ${safeValue * 3.6}deg, var(--color-base-300) 0deg)`,
        }}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-base-100">
          <span className="text-3xl font-bold">{loading ? "..." : `${safeValue}%`}</span>
        </div>
      </div>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-70">Completion rate</p>
    </div>
  );
}

function SimpleBarChart({ data, loading }) {
  const cleanedData = Array.isArray(data) ? data : [];
  const maxValue = Math.max(...cleanedData.map((item) => Number(item.total || item.value) || 0), 1);

  if (!loading && cleanedData.length === 0) {
    return (
      <div className="rounded-3xl bg-base-200 p-5">
        <p className="opacity-70">No chart data available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-base-200 p-5">
      <div className="space-y-4">
        {loading ? (
          <p className="opacity-70">Loading chart...</p>
        ) : (
          cleanedData.map((item) => {
            const value = Number(item.value) || 0;
            const itemTotal = Number(item.total) || maxValue;
            const width = itemTotal > 0 ? Math.min((value / itemTotal) * 100, 100) : 0;

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="opacity-70">{item.detail || value}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-base-300">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getPercentage(value, total) {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getChecklistStats(trips, today) {
  const result = { today: 0, upcoming: 0, overdue: 0 };

  trips.forEach((trip) => {
    const pendingItems = (trip.checklist || []).filter((item) => !item.completed).length;
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
  const datePart = dateString.includes("T") ? dateString.split("T")[0] : dateString;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateValue) {
  if (!dateValue) return "Not set";
  return parseLocalDate(dateValue).toLocaleDateString();
}

export default Dashboard;
