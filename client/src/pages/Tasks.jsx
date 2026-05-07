import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import TaskManager from "../components/dashboard/TaskManager";

const emptyChecklistForm = {
  tripId: "",
  text: "",
};

function Tasks() {
  return (
    <DashboardLayout
      title="Tasks"
      subtitle="View and manage tasks for the active persona."
      wellnessSubtitle="View wellness tasks and medicine reminders. Habits are managed from the Habits page."
      travelSubtitle="Add and manage checklist tasks for existing trips."
      restrictTo="non-finance"
    >
      {({ selectedPersona, selectedPersonaName, displayPersonaName }) => (
        <TasksContent
          selectedPersona={selectedPersona}
          selectedPersonaName={selectedPersonaName}
          displayPersonaName={displayPersonaName}
        />
      )}
    </DashboardLayout>
  );
}

function TasksContent({ selectedPersona, selectedPersonaName, displayPersonaName }) {
  const normalizedPersona = selectedPersonaName?.toLowerCase().trim();

  if (normalizedPersona === "travel") {
    return <TravelTasksContent />;
  }

  return (
    <StandardTasksContent
      selectedPersona={selectedPersona}
      selectedPersonaName={selectedPersonaName}
      displayPersonaName={displayPersonaName}
    />
  );
}

function StandardTasksContent({ selectedPersona, selectedPersonaName, displayPersonaName }) {
  const [tasks, setTasks] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchTasksForStats = async () => {
      if (!selectedPersona) {
        setTasks([]);
        return;
      }

      try {
        setLoadingStats(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

        setTasks(
          taskList.filter((task) => {
            return task.persona === selectedPersonaName?.toLowerCase().trim();
          }),
        );
      } catch {
        setTasks([]);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchTasksForStats();
  }, [selectedPersona, selectedPersonaName]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    return { total, active: total - completed, completed };
  }, [tasks]);

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total Tasks" value={loadingStats ? "..." : stats.total} />
        <StatCard label="Active Tasks" value={loadingStats ? "..." : stats.active} />
        <StatCard label="Completed Tasks" value={loadingStats ? "..." : stats.completed} />
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

function TravelTasksContent() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyChecklistForm);
  const [submitting, setSubmitting] = useState(false);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load trips");
      setTrips(Array.isArray(data) ? data : data.trips || data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load trips");
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const stats = useMemo(() => getChecklistStats(trips), [trips]);

  const openAddModal = () => {
    setForm({ tripId: trips[0]?._id || "", text: "" });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setForm(emptyChecklistForm);
    setError("");
    setShowModal(false);
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();

    if (!form.tripId) {
      setError("Select a trip first.");
      return;
    }

    if (!form.text.trim()) {
      setError("Checklist task is required.");
      return;
    }

    const trip = trips.find((item) => item._id === form.tripId);
    if (!trip) {
      setError("Selected trip was not found.");
      return;
    }

    const checklist = [...(trip.checklist || []), { text: form.text.trim(), completed: false }];
    await updateTripChecklist(trip, checklist, () => {
      closeModal();
    });
  };

  const updateTripChecklist = async (trip, checklist, afterSuccess = null) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
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
      afterSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to update checklist");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChecklistItem = async (trip, itemIndex) => {
    const checklist = (trip.checklist || []).map((item, index) =>
      index === itemIndex ? { ...item, completed: !item.completed } : item,
    );
    await updateTripChecklist(trip, checklist);
  };

  const deleteChecklistItem = async (trip, itemIndex) => {
    const checklist = (trip.checklist || []).filter((_, index) => index !== itemIndex);
    await updateTripChecklist(trip, checklist);
  };

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Today" value={loading ? "..." : stats.today} />
        <StatCard label="Upcoming" value={loading ? "..." : stats.upcoming} />
        <StatCard label="Overdue" value={loading ? "..." : stats.overdue} />
      </div>

      <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Tasks</h2>
            <p className="mt-1 text-sm opacity-70">Travel tasks are checklist items added to existing trips.</p>
          </div>
          <button className="btn btn-primary rounded-2xl" onClick={openAddModal} disabled={trips.length === 0}>
            Add Checklist Task
          </button>
        </div>

        {error && <div className="alert alert-error mt-5 rounded-2xl text-sm">{error}</div>}

        {loading ? (
          <p className="mt-6 opacity-70">Loading trips...</p>
        ) : trips.length === 0 ? (
          <p className="mt-6 opacity-70">No trips found. Add a trip from the Trips page before adding checklist tasks.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {trips.map((trip) => (
              <div key={trip._id} className="rounded-3xl border border-base-300 p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{trip.tripName}</h3>
                    <p className="text-sm opacity-70">{trip.destination}</p>
                  </div>
                  <span className="badge badge-outline">Start: {formatDate(trip.startDate)}</span>
                </div>

                {(trip.checklist || []).length === 0 ? (
                  <p className="mt-4 text-sm opacity-70">No checklist tasks for this trip.</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {(trip.checklist || []).map((item, index) => (
                      <div key={`${trip._id}-${index}`} className="flex items-center gap-3 rounded-2xl bg-base-200 px-4 py-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(trip, index)}
                        />
                        <span className={`flex-1 ${item.completed ? "line-through opacity-60" : ""}`}>{item.text}</span>
                        <button className="btn btn-ghost btn-xs rounded-xl" onClick={() => deleteChecklistItem(trip, index)}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-4xl bg-base-100 p-5 shadow-xl md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Add Checklist Task</h2>
              <button className="btn btn-ghost btn-sm rounded-xl" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleAddChecklist} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Trip</label>
                <select
                  name="tripId"
                  value={form.tripId}
                  onChange={(e) => setForm((prev) => ({ ...prev, tripId: e.target.value }))}
                  className="select select-bordered w-full rounded-2xl"
                >
                  {trips.map((trip) => (
                    <option key={trip._id} value={trip._id}>
                      {trip.tripName} - {trip.destination}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Checklist Task</label>
                <input
                  type="text"
                  value={form.text}
                  onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Pack passport, confirm hotel, arrange transport"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn rounded-2xl" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-2xl" disabled={submitting}>{submitting ? "Saving..." : "Add Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function getChecklistStats(trips) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = { today: 0, upcoming: 0, overdue: 0 };

  trips.forEach((trip) => {
    const pendingItems = (trip.checklist || []).filter((item) => !item.completed).length;
    if (pendingItems === 0) return;

    const startDate = parseLocalDate(trip.startDate);

    if (!startDate) {
      result.upcoming += pendingItems;
      return;
    }

    startDate.setHours(0, 0, 0, 0);

    if (startDate.getTime() === today.getTime()) {
      result.today += pendingItems;
    } else if (startDate.getTime() > today.getTime()) {
      result.upcoming += pendingItems;
    } else {
      result.overdue += pendingItems;
    }
  });

  return result;
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

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
      <p className="text-sm opacity-60">{label}</p>
      <h3 className="mt-3 text-4xl font-bold">{value}</h3>
    </div>
  );
}

export default Tasks;
