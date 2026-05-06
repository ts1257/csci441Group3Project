import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const emptyTrip = {
  tripName: "",
  destination: "",
  startDate: "",
  endDate: "",
  travelType: "flight",
  notes: "",
};

function Trips() {
  return (
    <DashboardLayout
      title="Trips"
      subtitle="Plan and manage trips."
      travelSubtitle="Add and manage trips. Add checklist items from the Travel Tasks page."
      restrictTo="travel"
    >
      <TripsContent />
    </DashboardLayout>
  );
}

function TripsContent() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(emptyTrip);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trips`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = trips.filter((trip) => {
      if (!trip.startDate) return true;
      const date = parseLocalDate(trip.startDate);
      date.setHours(0, 0, 0, 0);
      return date >= today;
    }).length;

    const activeChecklist = trips.reduce(
      (total, trip) =>
        total + (trip.checklist || []).filter((item) => !item.completed).length,
      0,
    );

    return { total: trips.length, upcoming, activeChecklist };
  }, [trips]);

  const resetForm = () => {
    setForm(emptyTrip);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = (trip) => {
    setEditingId(trip._id);
    setForm({
      tripName: trip.tripName || "",
      destination: trip.destination || "",
      startDate: formatDateForInput(trip.startDate),
      endDate: formatDateForInput(trip.endDate),
      travelType: trip.travelType || "other",
      notes: trip.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tripName.trim() || !form.destination.trim()) {
      setError("Trip name and destination are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const token = localStorage.getItem("token");
      const url = editingId
        ? `${import.meta.env.VITE_API_URL}/api/trips/${editingId}`
        : `${import.meta.env.VITE_API_URL}/api/trips`;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save trip");
      const savedTrip = data.trip || data.data || data;

      if (editingId) {
        setTrips((prev) =>
          prev.map((trip) => (trip._id === savedTrip._id ? savedTrip : trip)),
        );
      } else {
        setTrips((prev) => [savedTrip, ...prev]);
      }
      closeModal();
    } catch (err) {
      setError(err.message || "Failed to save trip");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTrip = async (trip) => {
    const confirmed = window.confirm(`Delete "${trip.tripName}"?`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trips/${trip._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to delete trip");
      setTrips((prev) => prev.filter((item) => item._id !== trip._id));
    } catch (err) {
      setError(err.message || "Failed to delete trip");
    }
  };

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Trips" value={loading ? "..." : stats.total} />
        <StatCard
          label="Upcoming Trips"
          value={loading ? "..." : stats.upcoming}
        />
        <StatCard
          label="Checklist Tasks"
          value={loading ? "..." : stats.activeChecklist}
        />
      </div>

      <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Trips</h2>
            <p className="mt-1 text-sm opacity-70">
              This page is only for trip details. Add checklist tasks from the
              Tasks page.
            </p>
          </div>
          <button
            className="btn btn-primary rounded-2xl"
            onClick={openAddModal}
          >
            Add Trip
          </button>
        </div>

        {error && (
          <div className="alert alert-error mt-5 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 opacity-70">Loading trips...</p>
        ) : trips.length === 0 ? (
          <p className="mt-6 opacity-70">No trips yet. Add your first trip.</p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {trips.map((trip) => (
              <article
                key={trip._id}
                className="rounded-3xl border border-base-300 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{trip.tripName}</h3>
                    <p className="mt-1 text-sm opacity-70">
                      {trip.destination}
                    </p>
                  </div>
                  <span className="badge badge-outline capitalize">
                    {trip.travelType}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm opacity-80">
                  <p>Start: {formatDate(trip.startDate)}</p>
                  <p>End: {formatDate(trip.endDate)}</p>
                  <p>Checklist tasks: {(trip.checklist || []).length}</p>
                  {trip.notes && <p>Notes: {trip.notes}</p>}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="btn btn-outline btn-sm rounded-xl"
                    onClick={() => startEdit(trip)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-error btn-outline btn-sm rounded-xl"
                    onClick={() => deleteTrip(trip)}
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
                {editingId ? "Edit Trip" : "Add Trip"}
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
                  Trip Name
                </label>
                <input
                  type="text"
                  name="tripName"
                  value={form.tripName}
                  onChange={handleChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="New York Conference"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Destination
                </label>
                <input
                  type="text"
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="New York"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="input input-bordered w-full rounded-2xl"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="input input-bordered w-full rounded-2xl"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Travel Type
                </label>
                <select
                  name="travelType"
                  value={form.travelType}
                  onChange={handleChange}
                  className="select select-bordered w-full rounded-2xl"
                >
                  <option value="flight">Flight</option>
                  <option value="car">Car</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full rounded-2xl"
                  rows="3"
                  placeholder="Hotel check-in, terminal, transport notes"
                />
              </div>

              <div className="rounded-2xl bg-base-200 p-4 text-sm opacity-80">
                Checklist items are added from the Travel Tasks page after the
                trip is created.
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
                      : "Add Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function parseLocalDate(dateString) {
  if (!dateString) return null;
  const datePart = dateString.includes("T")
    ? dateString.split("T")[0]
    : dateString;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateForInput(dateValue) {
  if (!dateValue) return "";
  return dateValue.includes("T") ? dateValue.split("T")[0] : dateValue;
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

export default Trips;
