import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function PlannedPayments() {
  const [plannedPayments, setPlannedPayments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    title: "",
    amount: "",
    dueDate: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/planned-payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payments");
      }

      const paymentList = Array.isArray(data)
        ? data
        : Array.isArray(data.plannedPayments)
          ? data.plannedPayments
          : Array.isArray(data.data)
            ? data.data
            : [];

      setPlannedPayments(paymentList);
    } catch (err) {
      setError(err.message || "Failed to load payments");
      setPlannedPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      title: "",
      amount: "",
      dueDate: "",
      status: "pending",
      notes: "",
    });
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!paymentForm.title.trim()) return;
    if (!paymentForm.amount) return;

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("token");

      const payload = {
        title: paymentForm.title.trim(),
        amount: Number(paymentForm.amount) || 0,
        dueDate: paymentForm.dueDate,
        status: paymentForm.status,
        notes: paymentForm.notes,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/planned-payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payment");
      }

      const newPayment = data.plannedPayment || data.data || data;
      setPlannedPayments((prev) => [newPayment, ...prev]);

      resetPaymentForm();
      setShowAddPaymentModal(false);
    } catch (err) {
      setError(err.message || "Failed to add payment");
    } finally {
      setSubmitting(false);
    }
  };

  const openViewPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setShowViewPaymentModal(true);
  };

  const openEditPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      title: payment.title || "",
      amount: payment.amount || "",
      dueDate: payment.dueDate || "",
      status: payment.status || "pending",
      notes: payment.notes || "",
    });
    setShowEditPaymentModal(true);
  };

  const handleEditPayment = async (e) => {
    e.preventDefault();

    if (!selectedPayment || !paymentForm.title.trim()) return;
    if (!paymentForm.amount) return;

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("token");

      const payload = {
        title: paymentForm.title.trim(),
        amount: Number(paymentForm.amount) || 0,
        dueDate: paymentForm.dueDate,
        status: paymentForm.status,
        notes: paymentForm.notes,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/planned-payments/${selectedPayment._id}`,
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

      if (!response.ok) {
        throw new Error(data.message || "Failed to update payment");
      }

      const updatedPayment = data.plannedPayment || data.data || data;

      setPlannedPayments((prev) =>
        prev.map((payment) =>
          payment._id === selectedPayment._id ? updatedPayment : payment,
        ),
      );

      setSelectedPayment(updatedPayment);
      setShowEditPaymentModal(false);
      resetPaymentForm();
    } catch (err) {
      setError(err.message || "Failed to update payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const confirmed = window.confirm("Delete this planned payment?");
    if (!confirmed) return;

    try {
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/planned-payments/${paymentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete payment");
      }

      setPlannedPayments((prev) =>
        prev.filter((payment) => payment._id !== paymentId),
      );

      if (selectedPayment?._id === paymentId) {
        setSelectedPayment(null);
        setShowViewPaymentModal(false);
        setShowEditPaymentModal(false);
      }
    } catch (err) {
      setError(err.message || "Failed to delete payment");
    }
  };

  const filters = ["All", "Pending", "Paid"];

  const filteredPayments = useMemo(() => {
    if (activeFilter === "All") return plannedPayments;
    return plannedPayments.filter(
      (payment) => payment.status?.toLowerCase() === activeFilter.toLowerCase(),
    );
  }, [plannedPayments, activeFilter]);

  const totalPlanned = useMemo(() => {
    return plannedPayments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0,
    );
  }, [plannedPayments]);

  const pendingTotal = useMemo(() => {
    return plannedPayments
      .filter((payment) => payment.status !== "paid")
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  }, [plannedPayments]);

  const statusBadgeClass = (status) => {
    if (status === "paid") return "badge-success";
    return "badge-warning";
  };

  return (
    <DashboardLayout
      title="Planned Payments"
      subtitle="Manage upcoming and completed planned payments."
      restrictTo="finance"
    >
      {() => (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Total Planned</p>
              <h3 className="mt-3 text-4xl font-bold">
                ${totalPlanned.toFixed(2)}
              </h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Pending Total</p>
              <h3 className="mt-3 text-4xl font-bold">
                ${pendingTotal.toFixed(2)}
              </h3>
            </div>
          </div>

          <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-2xl font-bold md:text-3xl">
                Planned Payments
              </h2>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        activeFilter === filter
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 hover:bg-base-300"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-primary rounded-2xl"
                  onClick={() => setShowAddPaymentModal(true)}
                >
                  Add Planned Payment
                </button>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <p className="opacity-70">
                No planned payments found for {activeFilter.toLowerCase()}.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className="rounded-3xl border border-base-300 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold wrap-break-word">
                          {payment.title}
                        </h3>

                        <p className="mt-1 text-sm opacity-60">
                          Due: {payment.dueDate || "No due date"}
                        </p>

                        <p className="mt-2 text-sm opacity-70 wrap-break-word whitespace-pre-wrap">
                          {payment.notes || "No notes"}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`badge ${statusBadgeClass(payment.status)}`}
                          >
                            {payment.status || "pending"}
                          </span>
                          <span className="badge badge-outline">
                            ${Number(payment.amount || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn btn-outline btn-sm rounded-xl"
                            onClick={() => openViewPaymentModal(payment)}
                          >
                            View
                          </button>

                          <button
                            className="btn btn-outline btn-sm rounded-xl"
                            onClick={() => openEditPaymentModal(payment)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-error btn-sm rounded-xl text-white"
                            onClick={() => handleDeletePayment(payment._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showAddPaymentModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Add Planned Payment</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowAddPaymentModal(false);
                      resetPaymentForm();
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddPayment} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={paymentForm.title}
                      onChange={handlePaymentChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Enter payment title"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Amount
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={paymentForm.amount}
                        onChange={handlePaymentChange}
                        className="input input-bordered w-full rounded-2xl"
                        placeholder="Enter amount"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Status
                      </label>
                      <select
                        name="status"
                        value={paymentForm.status}
                        onChange={handlePaymentChange}
                        className="select select-bordered w-full rounded-2xl"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={paymentForm.dueDate}
                      onChange={handlePaymentChange}
                      className="input input-bordered w-full rounded-2xl"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={paymentForm.notes}
                      onChange={handlePaymentChange}
                      className="textarea textarea-bordered w-full rounded-2xl"
                      rows="4"
                      placeholder="Enter notes"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl"
                      onClick={() => {
                        setShowAddPaymentModal(false);
                        resetPaymentForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary rounded-2xl"
                    >
                      Add Planned Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showEditPaymentModal && selectedPayment && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Edit Planned Payment</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowEditPaymentModal(false);
                      setSelectedPayment(null);
                      resetPaymentForm();
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditPayment} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={paymentForm.title}
                      onChange={handlePaymentChange}
                      className="input input-bordered w-full rounded-2xl"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Amount
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={paymentForm.amount}
                        onChange={handlePaymentChange}
                        className="input input-bordered w-full rounded-2xl"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Status
                      </label>
                      <select
                        name="status"
                        value={paymentForm.status}
                        onChange={handlePaymentChange}
                        className="select select-bordered w-full rounded-2xl"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={paymentForm.dueDate}
                      onChange={handlePaymentChange}
                      className="input input-bordered w-full rounded-2xl"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={paymentForm.notes}
                      onChange={handlePaymentChange}
                      className="textarea textarea-bordered w-full rounded-2xl"
                      rows="4"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl"
                      onClick={() => {
                        setShowEditPaymentModal(false);
                        setSelectedPayment(null);
                        resetPaymentForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary rounded-2xl"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showViewPaymentModal && selectedPayment && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Planned Payment Details
                  </h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowViewPaymentModal(false);
                      setSelectedPayment(null);
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm opacity-60">Title</p>
                    <p className="mt-1 text-lg font-semibold wrap-break-word">
                      {selectedPayment.title}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm opacity-60">Amount</p>
                      <p className="mt-1">
                        ${Number(selectedPayment.amount || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm opacity-60">Status</p>
                      <p className="mt-1">
                        {selectedPayment.status || "pending"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm opacity-60">Due Date</p>
                    <p className="mt-1">
                      {selectedPayment.dueDate || "No due date"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm opacity-60">Notes</p>
                    <p className="mt-1 wrap-break-word whitespace-pre-wrap">
                      {selectedPayment.notes || "No notes"}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                      className="btn btn-outline rounded-2xl"
                      onClick={() => {
                        setShowViewPaymentModal(false);
                        openEditPaymentModal(selectedPayment);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-error rounded-2xl text-white"
                      onClick={() => handleDeletePayment(selectedPayment._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default PlannedPayments;
