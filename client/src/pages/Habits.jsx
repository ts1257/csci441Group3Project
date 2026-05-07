import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  fetchCollectionWithOfflineFallback,
  queueCollectionCreate,
  queueCollectionDelete,
  queueCollectionUpdate,
  saveCollectionItemToCache,
  syncPendingCollections,
} from "../utils/offlineCollections";

const emptyHabit = {
  name: "",
  category: "hydration",
  goal: "",
  progress: "",
  unit: "",
  reminderTime: "",
  completedToday: false,
};

function Habits() {
  return (
    <DashboardLayout
      title="Habits"
      subtitle="Track daily wellness habits and simple reminders."
      wellnessSubtitle="Track daily wellness habits, progress, units, and reminder times."
      restrictTo="wellness"
    >
      <HabitsContent />
    </DashboardLayout>
  );
}

function HabitsContent() {
  const [habits, setHabits] = useState([]);
  const [form, setForm] = useState(emptyHabit);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadHabits = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const list = await fetchCollectionWithOfflineFallback({
        apiUrl: import.meta.env.VITE_API_URL,
        token,
        collection: "habits",
      });
      setHabits(list);
    } catch (err) {
      setError(err.message || "Failed to load cached habits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
    const sync = async () => {
      const token = localStorage.getItem("token");
      await syncPendingCollections({
        apiUrl: import.meta.env.VITE_API_URL,
        token,
      });
      await loadHabits();
    };
    const handleOnline = () => sync();
    window.addEventListener("online", handleOnline);
    sync();
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const stats = useMemo(() => {
    return {
      total: habits.length,
      completed: habits.filter((habit) => habit.completedToday).length,
      reminders: habits.filter((habit) => habit.reminderTime).length,
    };
  }, [habits]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyHabit);
    setEditingId(null);
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  const startEdit = (habit) => {
    setEditingId(habit._id);
    setForm({
      name: habit.name || "",
      category: habit.category || "other",
      goal: habit.goal || "",
      progress: habit.progress || "",
      unit: habit.unit || "",
      reminderTime: habit.reminderTime || "",
      completedToday: Boolean(habit.completedToday),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Habit name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const token = localStorage.getItem("token");
      const url = editingId
        ? `${import.meta.env.VITE_API_URL}/api/habits/${editingId}`
        : `${import.meta.env.VITE_API_URL}/api/habits`;

      if (!navigator.onLine) {
        if (editingId) {
          const current = habits.find((habit) => habit._id === editingId);
          const updated = queueCollectionUpdate("habits", current, form);
          setHabits((prev) =>
            prev.map((habit) => (habit._id === editingId ? updated : habit)),
          );
        } else {
          const created = queueCollectionCreate("habits", form);
          setHabits((prev) => [created, ...prev]);
        }
        closeModal();
        return;
      }

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save habit");

      const savedHabit = data.habit || data.data || data;
      if (editingId) {
        setHabits((prev) =>
          prev.map((habit) =>
            habit._id === savedHabit._id ? savedHabit : habit,
          ),
        );
      } else {
        setHabits((prev) => [savedHabit, ...prev]);
      }
      saveCollectionItemToCache("habits", savedHabit);
      closeModal();
    } catch (err) {
      if (isNetworkFailure(err)) {
        if (editingId) {
          const current = habits.find((habit) => habit._id === editingId);
          const updated = queueCollectionUpdate("habits", current, form);
          setHabits((prev) =>
            prev.map((habit) => (habit._id === editingId ? updated : habit)),
          );
        } else {
          const created = queueCollectionCreate("habits", form);
          setHabits((prev) => [created, ...prev]);
        }
        closeModal();
      } else {
        setError(err.message || "Failed to save habit");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateHabit = async (habit, payload) => {
    try {
      if (!navigator.onLine) {
        const updatedHabit = queueCollectionUpdate("habits", habit, payload);
        setHabits((prev) =>
          prev.map((item) =>
            item._id === updatedHabit._id ? updatedHabit : item,
          ),
        );
        return;
      }

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
      saveCollectionItemToCache("habits", updatedHabit);
    } catch {
      const updatedHabit = queueCollectionUpdate("habits", habit, payload);
      setHabits((prev) =>
        prev.map((item) => (item._id === updatedHabit._id ? updatedHabit : item)),
      );
    }
  };

  const getNotDoneProgress = (habit) => {
    const goal = Number(habit.goal) || 0;

    if (goal > 0) {
      return String(Math.max(goal - 1, 0));
    }

    return String(Math.max((Number(habit.progress) || 0) - 1, 0));
  };

  const toggleCompleted = async (habit) => {
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

  const deleteHabit = async (habit) => {
    const confirmed = window.confirm(`Delete "${habit.name}"?`);
    if (!confirmed) return;

    try {
      if (!navigator.onLine) {
        queueCollectionDelete("habits", habit._id);
        setHabits((prev) => prev.filter((item) => item._id !== habit._id));
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/habits/${habit._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to delete habit");
      setHabits((prev) => prev.filter((item) => item._id !== habit._id));
    } catch (err) {
      if (isNetworkFailure(err)) {
        queueCollectionDelete("habits", habit._id);
        setHabits((prev) => prev.filter((item) => item._id !== habit._id));
      } else {
        setError(err.message || "Failed to delete habit");
      }
    }
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
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Daily Habits" value={loading ? "..." : stats.total} />
        <StatCard
          label="Completed Today"
          value={loading ? "..." : stats.completed}
        />
        <StatCard
          label="Reminder Times"
          value={loading ? "..." : stats.reminders}
        />
      </div>

      <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Habits</h2>
            <p className="mt-1 text-sm opacity-70">
              Create habits here. Daily completion is shown on the Wellness
              dashboard.
            </p>
          </div>
          <button
            className="btn btn-primary rounded-2xl"
            onClick={openAddModal}
          >
            Add Habit
          </button>
        </div>

        {error && (
          <div className="alert alert-error mt-5 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 opacity-70">Loading habits...</p>
        ) : habits.length === 0 ? (
          <p className="mt-6 opacity-70">
            No habits yet. Add your first wellness habit.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {habits.map((habit, index) => (
              <article
                key={`${habit._id || habit.name}-${index}`}
                className="rounded-3xl border border-base-300 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{habit.name}</h3>
                    <p className="mt-1 text-sm capitalize opacity-70">
                      {habit.category?.replace("-", " ")}
                    </p>
                  </div>
                  <span
                    className={`badge ${habit.completedToday ? "badge-success" : "badge-outline"}`}
                  >
                    {habit.completedToday ? "Done" : "Daily"}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm opacity-80">
                  <p>{formatProgress(habit)}</p>
                  <p>Unit: {habit.unit || "Not set"}</p>
                  <p>Reminder: {habit.reminderTime || "Not set"}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
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
                    className="btn btn-sm rounded-xl"
                    onClick={() => toggleCompleted(habit)}
                  >
                    {habit.completedToday ? "Mark Not Done" : "Complete Today"}
                  </button>
                  <button
                    className="btn btn-outline btn-sm rounded-xl"
                    onClick={() => startEdit(habit)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-error btn-outline btn-sm rounded-xl"
                    onClick={() => deleteHabit(habit)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-4xl bg-base-100 p-5 shadow-xl md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {editingId ? "Edit Habit" : "Add Habit"}
              </h2>
              <button
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Habit Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Drink water"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="select select-bordered w-full rounded-2xl"
                >
                  <option value="hydration">Hydration</option>
                  <option value="sleep">Sleep</option>
                  <option value="exercise">Exercise</option>
                  <option value="rest">Rest</option>
                  <option value="mental-health">Mental Health</option>
                  <option value="meal">Meal</option>
                  <option value="medicine">Medicine</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">Goal</label>
                  <input
                    type="text"
                    name="goal"
                    value={form.goal}
                    onChange={handleChange}
                    className="input input-bordered w-full rounded-2xl"
                    placeholder="8"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Progress
                  </label>
                  <input
                    type="text"
                    name="progress"
                    value={form.progress}
                    onChange={handleChange}
                    className="input input-bordered w-full rounded-2xl"
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className="input input-bordered w-full rounded-2xl"
                    placeholder="cups, pages, minutes"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    name="reminderTime"
                    value={form.reminderTime}
                    onChange={handleChange}
                    className="input input-bordered w-full rounded-2xl"
                  />
                </div>
                <label className="flex items-center gap-3 self-end rounded-2xl border border-base-300 px-4 py-3">
                  <input
                    type="checkbox"
                    name="completedToday"
                    checked={form.completedToday}
                    onChange={handleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm font-medium">Completed today</span>
                </label>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn rounded-2xl"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-2xl"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
      <p className="text-sm opacity-60">{label}</p>
      <h3 className="mt-3 text-4xl font-bold">{value}</h3>
    </div>
  );
}

function isNetworkFailure(error) {
  return (
    error instanceof TypeError ||
    /failed to fetch|networkerror|cors request did not succeed/i.test(
      error?.message || "",
    )
  );
}

export default Habits;
