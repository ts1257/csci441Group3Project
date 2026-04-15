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
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedPersona) {
        setTasks([]);
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
      } finally {
        setLoadingStats(false);
      }
    };

    fetchTasks();
  }, [selectedPersona]);

  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    const datePart = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString;
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const overviewStats = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;

    tasks.forEach((task) => {
      if (!task.dueDate) return;

      const isCompleted = task.status === "completed";
      if (isCompleted) return;

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

    return {
      today: todayCount,
      upcoming: upcomingCount,
      overdue: overdueCount,
    };
  }, [tasks, today]);

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Today</p>
          <h3 className="mt-3 text-4xl font-bold">
            {loadingStats ? "..." : overviewStats.today}
          </h3>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Upcoming</p>
          <h3 className="mt-3 text-4xl font-bold">
            {loadingStats ? "..." : overviewStats.upcoming}
          </h3>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-sm opacity-60">Overdue</p>
          <h3 className="mt-3 text-4xl font-bold">
            {loadingStats ? "..." : overviewStats.overdue}
          </h3>
        </div>
      </div>

      <TaskManager
        selectedPersona={selectedPersona}
        selectedPersonaName={selectedPersonaName}
        key={displayPersonaName}
        onTasksChange={(newTasks) => setTasks(newTasks)}
      />
    </>
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
      // silently fail — stats will show $0
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
        const datePart = payment.dueDate.includes("T")
          ? payment.dueDate.split("T")[0]
          : payment.dueDate;
        const [y, m, d] = datePart.split("-").map(Number);
        const dueDate = new Date(y, m - 1, d);
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

export default Dashboard;
