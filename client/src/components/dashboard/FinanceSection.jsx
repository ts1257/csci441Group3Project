import { useEffect, useMemo, useState } from "react";
import {
  fetchCategoriesWithOfflineFallback,
  fetchRecordsWithOfflineFallback,
  queueCreateRecord,
  saveRecordToCache,
} from "../../utils/offlineFinance";

function FinanceSection({ onDataChange }) {
  const [records, setRecords] = useState([]);
  const [plannedPayments, setPlannedPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [recordFilter, setRecordFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewRecordModal, setShowViewRecordModal] = useState(false);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [recordForm, setRecordForm] = useState({
    title: "",
    type: "expense",
    amount: "",
    category: "",
    subcategory: "",
    date: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    title: "",
    amount: "",
    dueDate: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const [recordResult, paymentsResult, categoriesResult] = await Promise.all([
        fetchRecordsWithOfflineFallback({
          apiUrl: import.meta.env.VITE_API_URL,
          token,
        }),
        fetchFinanceList({
          path: "/api/planned-payments",
          listKey: "plannedPayments",
          token,
          fallback: [],
        }),
        fetchCategoriesWithOfflineFallback({
          apiUrl: import.meta.env.VITE_API_URL,
          token,
        }),
      ]);

      setRecords(recordResult.records);
      setPlannedPayments(paymentsResult);
      setCategories(categoriesResult);
    } catch (err) {
      setError(err.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  const resetRecordForm = () => {
    setRecordForm({
      title: "",
      type: "expense",
      amount: "",
      category: "",
      subcategory: "",
      date: "",
      notes: "",
    });
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

  const findCategoryByName = (name) => {
    return categories.find(
      (category) =>
        category.name?.toLowerCase().trim() === name?.toLowerCase().trim(),
    );
  };

  const findParentCategoryBySubcategory = (subcategoryName) => {
    return categories.find((category) =>
      (category.subcategories || []).some(
        (subcategory) =>
          subcategory.toLowerCase().trim() ===
          subcategoryName?.toLowerCase().trim(),
      ),
    );
  };

  const handleRecordChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setRecordForm((prev) => ({
        ...prev,
        category: value,
        subcategory: "",
      }));
      return;
    }

    if (name === "subcategory") {
      const parentCategory = findParentCategoryBySubcategory(value);

      setRecordForm((prev) => ({
        ...prev,
        subcategory: value,
        category: parentCategory ? parentCategory.name : prev.category,
      }));
      return;
    }

    setRecordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const categorySuggestions = useMemo(() => {
    return categories.map((category) => category.name);
  }, [categories]);

  const selectedCategoryObject = useMemo(() => {
    return findCategoryByName(recordForm.category);
  }, [categories, recordForm.category]);

  const subcategorySuggestions = useMemo(() => {
    if (selectedCategoryObject) {
      return selectedCategoryObject.subcategories || [];
    }

    return [
      ...new Set(
        categories.flatMap((category) => category.subcategories || []),
      ),
    ];
  }, [categories, selectedCategoryObject]);

  const syncCategoryStorage = async (categoryName, subcategoryName) => {
    const trimmedCategory = categoryName.trim();
    const trimmedSubcategory = subcategoryName.trim();

    if (!trimmedCategory) return;

    const token = localStorage.getItem("token");
    const existingCategory = categories.find(
      (category) =>
        category.name?.toLowerCase().trim() === trimmedCategory.toLowerCase(),
    );

    if (existingCategory) {
      if (!trimmedSubcategory) return;

      const hasSubcategory = (existingCategory.subcategories || []).some(
        (subcategory) =>
          subcategory.toLowerCase().trim() === trimmedSubcategory.toLowerCase(),
      );

      if (hasSubcategory) return;

      // Update category with new subcategory
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/categories/${existingCategory._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: existingCategory.name,
              subcategories: [
                ...(existingCategory.subcategories || []),
                trimmedSubcategory,
              ],
            }),
          },
        );
        if (response.ok) {
          const updated = await response.json();
          const updatedCategories = categories.map((c) =>
            c._id === existingCategory._id ? updated.category || updated : c,
          );
          setCategories(updatedCategories);
        }
      } catch {
        // silently ignore — category sync is best-effort
      }
      return;
    }

    // Create new category
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedCategory,
            subcategories: trimmedSubcategory ? [trimmedSubcategory] : [],
          }),
        },
      );
      if (response.ok) {
        const newCat = await response.json();
        setCategories([newCat.category || newCat, ...categories]);
      }
    } catch {
      // silently ignore — category sync is best-effort
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();

    if (!recordForm.title.trim()) return;
    if (!recordForm.amount) return;

    const token = localStorage.getItem("token");
    const payload = buildRecordPayload(recordForm);

    try {
      setSubmitting(true);
      setError("");

      // Sync category first if there's one
      if (navigator.onLine && recordForm.category.trim()) {
        await syncCategoryStorage(recordForm.category, recordForm.subcategory);
      }

      if (!navigator.onLine) {
        const newRecord = queueCreateRecord(payload);
        setRecords([newRecord, ...records]);
        onDataChange?.({ records: [newRecord, ...records] });
        resetRecordForm();
        setShowRecordModal(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/records`,
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
      if (!response.ok) throw new Error(data.message);

      const newRecord = data.record || data;
      setRecords([newRecord, ...records]);
      saveRecordToCache(newRecord);
      onDataChange?.({ records: [newRecord, ...records] });
      resetRecordForm();
      setShowRecordModal(false);
    } catch (err) {
      if (isNetworkFailure(err)) {
        const newRecord = queueCreateRecord(payload);
        setRecords([newRecord, ...records]);
        onDataChange?.({ records: [newRecord, ...records] });
        resetRecordForm();
        setShowRecordModal(false);
      } else {
        setError(err.message || "Failed to add record");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!paymentForm.title.trim()) return;
    if (!paymentForm.amount) return;

    try {
      setSubmitting(true);
      setError("");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/planned-payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: paymentForm.title.trim(),
            amount: Number(paymentForm.amount) || 0,
            dueDate: paymentForm.dueDate,
            status: paymentForm.status,
            notes: paymentForm.notes,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      const newPayment = data.plannedPayment || data;
      setPlannedPayments([newPayment, ...plannedPayments]);
      onDataChange?.({ payments: [newPayment, ...plannedPayments] });
      resetPaymentForm();
      setShowPaymentModal(false);
    } catch (err) {
      setError(err.message || "Failed to add payment");
    } finally {
      setSubmitting(false);
    }
  };

  const openViewRecordModal = (record) => {
    setSelectedRecord(record);
    setShowViewRecordModal(true);
  };

  const openEditRecordModal = (record) => {
    setSelectedRecord(record);
    setRecordForm({
      title: record.title || "",
      type: record.type || "expense",
      amount: record.amount || "",
      category: record.category || "",
      subcategory: record.subcategory || "",
      date: record.date || "",
      notes: record.notes || "",
    });
    setShowEditRecordModal(true);
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();

    if (!selectedRecord) return;
    if (!recordForm.title.trim()) return;
    if (!recordForm.amount) return;

    try {
      setSubmitting(true);
      setError("");
      const token = localStorage.getItem("token");

      // Sync category first if there's one
      if (recordForm.category.trim()) {
        await syncCategoryStorage(recordForm.category, recordForm.subcategory);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/records/${selectedRecord._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: recordForm.title.trim(),
            type: recordForm.type,
            amount: Number(recordForm.amount) || 0,
            category: recordForm.category.trim(),
            subcategory: recordForm.subcategory.trim(),
            date: recordForm.date,
            notes: recordForm.notes,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      const updatedRecord = data.record || data;
      const updatedRecords = records.map((r) =>
        r._id === selectedRecord._id ? updatedRecord : r,
      );
      setRecords(updatedRecords);
      onDataChange?.({ records: updatedRecords });
      setSelectedRecord(updatedRecord);
      setShowEditRecordModal(false);
      resetRecordForm();
    } catch (err) {
      setError(err.message || "Failed to edit record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    const confirmed = window.confirm("Delete this record?");
    if (!confirmed) return;

    try {
      setError("");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/records/${recordId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      setRecords(records.filter((r) => r._id !== recordId));
      onDataChange?.({ records: records.filter((r) => r._id !== recordId) });

      if (selectedRecord?._id === recordId) {
        setSelectedRecord(null);
        setShowViewRecordModal(false);
        setShowEditRecordModal(false);
      }
    } catch (err) {
      setError(err.message || "Failed to delete record");
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
      dueDate: payment.dueDate ? payment.dueDate.split("T")[0] : "",
      status: payment.status || "pending",
      notes: payment.notes || "",
    });
    setShowEditPaymentModal(true);
  };

  const handleEditPayment = async (e) => {
    e.preventDefault();

    if (!selectedPayment) return;
    if (!paymentForm.title.trim()) return;
    if (!paymentForm.amount) return;

    try {
      setSubmitting(true);
      setError("");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/planned-payments/${selectedPayment._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: paymentForm.title.trim(),
            amount: Number(paymentForm.amount) || 0,
            dueDate: paymentForm.dueDate,
            status: paymentForm.status,
            notes: paymentForm.notes,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      const updatedPayment = data.plannedPayment || data;
      const updatedPayments = plannedPayments.map((p) =>
        p._id === selectedPayment._id ? updatedPayment : p,
      );
      setPlannedPayments(updatedPayments);
      onDataChange?.({ payments: updatedPayments });
      setSelectedPayment(updatedPayment);
      setShowEditPaymentModal(false);
      resetPaymentForm();
    } catch (err) {
      setError(err.message || "Failed to edit payment");
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
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      setPlannedPayments(plannedPayments.filter((p) => p._id !== paymentId));
      onDataChange?.({
        payments: plannedPayments.filter((p) => p._id !== paymentId),
      });

      if (selectedPayment?._id === paymentId) {
        setSelectedPayment(null);
        setShowViewPaymentModal(false);
        setShowEditPaymentModal(false);
      }
    } catch (err) {
      setError(err.message || "Failed to delete payment");
    }
  };

  const recordBadgeClass = (type) => {
    if (type === "income") return "badge-success";
    return "badge-outline";
  };

  const paymentBadgeClass = (status) => {
    if (status === "paid") return "badge-success";
    return "badge-warning";
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return "No due date";
    const part = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString;
    const [y, m, d] = part.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString();
  };

  const recordFilters = ["All", "Income", "Expense"];
  const paymentFilters = ["All", "Pending", "Paid"];

  const filteredRecords = useMemo(() => {
    if (recordFilter === "All") return records;
    return records.filter(
      (r) => r.type?.toLowerCase() === recordFilter.toLowerCase(),
    );
  }, [records, recordFilter]);

  const filteredPayments = useMemo(() => {
    if (paymentFilter === "All") return plannedPayments;
    return plannedPayments.filter(
      (p) => p.status?.toLowerCase() === paymentFilter.toLowerCase(),
    );
  }, [plannedPayments, paymentFilter]);

  const handleCompletePayment = async (payment) => {
    if (payment.status === "paid") return;

    try {
      setError("");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/planned-payments/${payment._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...payment, status: "paid" }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      const updatedPayment = data.plannedPayment || data;
      const updatedPayments = plannedPayments.map((p) =>
        p._id === payment._id ? updatedPayment : p,
      );
      setPlannedPayments(updatedPayments);
      onDataChange?.({ payments: updatedPayments });

      if (selectedPayment?._id === payment._id) {
        setSelectedPayment(updatedPayment);
      }
    } catch (err) {
      setError(err.message || "Failed to mark payment as paid");
    }
  };

  return (
    <>
      <section className="mb-6 rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Records</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-2">
              {recordFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRecordFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    recordFilter === filter
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
              onClick={() => setShowRecordModal(true)}
            >
              Add Record
            </button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <p className="opacity-70">
            {recordFilter === "All"
              ? "No finance records added yet."
              : `No ${recordFilter.toLowerCase()} records found.`}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record._id}
                className="rounded-3xl border border-base-300 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold wrap-break-word">
                      {record.title}
                    </h3>
                    <p className="mt-1 text-sm opacity-70 wrap-break-word">
                      Category: {record.category || "Uncategorized"}
                      {record.subcategory ? ` / ${record.subcategory}` : ""}
                    </p>
                    <p className="mt-1 text-sm opacity-60">
                      {record.date || "No date"}
                    </p>
                    <p className="mt-2 text-sm opacity-70 wrap-break-word whitespace-pre-wrap">
                      {record.notes || "No notes"}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`badge ${recordBadgeClass(record.type)}`}
                      >
                        {record.type}
                      </span>
                      <span className="badge badge-outline">
                        ${Number(record.amount || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline btn-sm rounded-xl"
                        onClick={() => openViewRecordModal(record)}
                      >
                        View
                      </button>

                      <button
                        className="btn btn-outline btn-sm rounded-xl"
                        onClick={() => openEditRecordModal(record)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-error btn-sm rounded-xl text-white"
                        onClick={() => handleDeleteRecord(record._id)}
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

      <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Planned Payments</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-2">
              {paymentFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPaymentFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    paymentFilter === filter
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
              onClick={() => setShowPaymentModal(true)}
            >
              Add Planned Payment
            </button>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="opacity-70">
            {paymentFilter === "All"
              ? "No planned payments added yet."
              : `No ${paymentFilter.toLowerCase()} payments found.`}
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
                      Due: {formatDueDate(payment.dueDate)}
                    </p>
                    <p className="mt-2 text-sm opacity-70 wrap-break-word whitespace-pre-wrap">
                      {payment.notes || "No notes"}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`badge ${paymentBadgeClass(payment.status)}`}
                      >
                        {payment.status}
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

                      {payment.status !== "paid" && (
                        <button
                          className="btn btn-success btn-sm rounded-xl text-white"
                          onClick={() => handleCompletePayment(payment)}
                        >
                          Complete
                        </button>
                      )}

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

      {showRecordModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add Record</h2>
              <button
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => {
                  setShowRecordModal(false);
                  resetRecordForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
                <input
                  type="text"
                  name="title"
                  value={recordForm.title}
                  onChange={handleRecordChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Enter record title"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <select
                    name="type"
                    value={recordForm.type}
                    onChange={handleRecordChange}
                    className="select select-bordered w-full rounded-2xl"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={recordForm.amount}
                    onChange={handleRecordChange}
                    className="input input-bordered w-full rounded-2xl"
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  list="finance-category-suggestions-dashboard"
                  value={recordForm.category}
                  onChange={handleRecordChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Choose or type category"
                />
                <datalist id="finance-category-suggestions-dashboard">
                  {categorySuggestions.map((categoryName, index) => (
                    <option
                      key={`${categoryName}-${index}`}
                      value={categoryName}
                    />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Subcategory
                </label>
                <input
                  type="text"
                  name="subcategory"
                  list="finance-subcategory-suggestions-dashboard"
                  value={recordForm.subcategory}
                  onChange={handleRecordChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Choose or type subcategory"
                />
                <datalist id="finance-subcategory-suggestions-dashboard">
                  {subcategorySuggestions.map((subcategory, index) => (
                    <option
                      key={`${subcategory}-${index}`}
                      value={subcategory}
                    />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={recordForm.date}
                  onChange={handleRecordChange}
                  className="input input-bordered w-full rounded-2xl"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={recordForm.notes}
                  onChange={handleRecordChange}
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
                    setShowRecordModal(false);
                    resetRecordForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-2xl">
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditRecordModal && selectedRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Record</h2>
              <button
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => {
                  setShowEditRecordModal(false);
                  setSelectedRecord(null);
                  resetRecordForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditRecord} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
                <input
                  type="text"
                  name="title"
                  value={recordForm.title}
                  onChange={handleRecordChange}
                  className="input input-bordered w-full rounded-2xl"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <select
                    name="type"
                    value={recordForm.type}
                    onChange={handleRecordChange}
                    className="select select-bordered w-full rounded-2xl"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={recordForm.amount}
                    onChange={handleRecordChange}
                    className="input input-bordered w-full rounded-2xl"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  list="finance-category-suggestions-dashboard-edit"
                  value={recordForm.category}
                  onChange={handleRecordChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Choose or type category"
                />
                <datalist id="finance-category-suggestions-dashboard-edit">
                  {categorySuggestions.map((categoryName, index) => (
                    <option
                      key={`${categoryName}-${index}`}
                      value={categoryName}
                    />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Subcategory
                </label>
                <input
                  type="text"
                  name="subcategory"
                  list="finance-subcategory-suggestions-dashboard-edit"
                  value={recordForm.subcategory}
                  onChange={handleRecordChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Choose or type subcategory"
                />
                <datalist id="finance-subcategory-suggestions-dashboard-edit">
                  {subcategorySuggestions.map((subcategory, index) => (
                    <option
                      key={`${subcategory}-${index}`}
                      value={subcategory}
                    />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={recordForm.date}
                  onChange={handleRecordChange}
                  className="input input-bordered w-full rounded-2xl"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={recordForm.notes}
                  onChange={handleRecordChange}
                  className="textarea textarea-bordered w-full rounded-2xl"
                  rows="4"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost rounded-2xl"
                  onClick={() => {
                    setShowEditRecordModal(false);
                    setSelectedRecord(null);
                    resetRecordForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-2xl">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewRecordModal && selectedRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Record Details</h2>
              <button
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => {
                  setShowViewRecordModal(false);
                  setSelectedRecord(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-60">Title</p>
                <p className="mt-1 text-lg font-semibold wrap-break-word">
                  {selectedRecord.title}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm opacity-60">Type</p>
                  <p className="mt-1">{selectedRecord.type}</p>
                </div>

                <div>
                  <p className="text-sm opacity-60">Amount</p>
                  <p className="mt-1">
                    ${Number(selectedRecord.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm opacity-60">Category</p>
                <p className="mt-1">
                  {selectedRecord.category || "Uncategorized"}
                  {selectedRecord.subcategory
                    ? ` / ${selectedRecord.subcategory}`
                    : ""}
                </p>
              </div>

              <div>
                <p className="text-sm opacity-60">Date</p>
                <p className="mt-1">{selectedRecord.date || "No date"}</p>
              </div>

              <div>
                <p className="text-sm opacity-60">Notes</p>
                <p className="mt-1 wrap-break-word whitespace-pre-wrap">
                  {selectedRecord.notes || "No notes"}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  className="btn btn-outline rounded-2xl"
                  onClick={() => {
                    setShowViewRecordModal(false);
                    openEditRecordModal(selectedRecord);
                  }}
                >
                  Edit
                </button>

                <button
                  className="btn btn-error rounded-2xl text-white"
                  onClick={() => handleDeleteRecord(selectedRecord._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add Planned Payment</h2>
              <button
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
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
                <label className="mb-2 block text-sm font-medium">Notes</label>
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
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-2xl">
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
                <label className="mb-2 block text-sm font-medium">Title</label>
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
                <label className="mb-2 block text-sm font-medium">Notes</label>
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
                <button type="submit" className="btn btn-primary rounded-2xl">
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
              <h2 className="text-2xl font-bold">Planned Payment Details</h2>
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
                  <p className="mt-1">{selectedPayment.status || "pending"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm opacity-60">Due Date</p>
                <p className="mt-1">{formatDueDate(selectedPayment.dueDate)}</p>
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

                {selectedPayment.status !== "paid" && (
                  <button
                    className="btn btn-success rounded-2xl text-white"
                    onClick={() => {
                      handleCompletePayment(selectedPayment);
                      setShowViewPaymentModal(false);
                    }}
                  >
                    Complete
                  </button>
                )}

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
  );
}

async function fetchFinanceList({ path, listKey, token, fallback }) {
  if (!navigator.onLine) return fallback;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) return fallback;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data[listKey])) return data[listKey];
    if (Array.isArray(data.data)) return data.data;
    return fallback;
  } catch {
    return fallback;
  }
}

function buildRecordPayload(recordForm) {
  return {
    title: recordForm.title.trim(),
    type: recordForm.type,
    amount: Number(recordForm.amount) || 0,
    category: recordForm.category.trim() || "Uncategorized",
    subcategory: recordForm.subcategory.trim(),
    date: recordForm.date || new Date().toISOString().slice(0, 10),
    notes: recordForm.notes,
  };
}

function isNetworkFailure(error) {
  return (
    error instanceof TypeError ||
    /failed to fetch|networkerror|cors request did not succeed/i.test(
      error?.message || "",
    )
  );
}

export default FinanceSection;
