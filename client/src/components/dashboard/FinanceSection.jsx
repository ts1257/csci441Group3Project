import { useEffect, useMemo, useState } from "react";

function FinanceSection() {
  const [records, setRecords] = useState([]);
  const [plannedPayments, setPlannedPayments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewRecordModal, setShowViewRecordModal] = useState(false);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

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
    const storedRecords = localStorage.getItem("financeRecords");
    const storedPayments = localStorage.getItem("plannedPayments");
    const storedCategories = localStorage.getItem("financeCategories");

    try {
      const parsedRecords = storedRecords ? JSON.parse(storedRecords) : [];
      const parsedPayments = storedPayments ? JSON.parse(storedPayments) : [];
      const parsedCategories = storedCategories
        ? JSON.parse(storedCategories)
        : [];

      setRecords(Array.isArray(parsedRecords) ? parsedRecords : []);
      setPlannedPayments(Array.isArray(parsedPayments) ? parsedPayments : []);
      setCategories(Array.isArray(parsedCategories) ? parsedCategories : []);
    } catch {
      setRecords([]);
      setPlannedPayments([]);
      setCategories([]);
    }
  }, []);

  const persistRecords = (updatedRecords) => {
    setRecords(updatedRecords);
    localStorage.setItem("financeRecords", JSON.stringify(updatedRecords));
  };

  const persistPayments = (updatedPayments) => {
    setPlannedPayments(updatedPayments);
    localStorage.setItem("plannedPayments", JSON.stringify(updatedPayments));
  };

  const persistCategories = (updatedCategories) => {
    setCategories(updatedCategories);
    localStorage.setItem(
      "financeCategories",
      JSON.stringify(updatedCategories),
    );
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

  const syncCategoryStorage = (categoryName, subcategoryName) => {
    const trimmedCategory = categoryName.trim();
    const trimmedSubcategory = subcategoryName.trim();

    if (!trimmedCategory) return;

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

      const updatedCategories = categories.map((category) =>
        category.id === existingCategory.id
          ? {
              ...category,
              subcategories: [
                ...(category.subcategories || []),
                trimmedSubcategory,
              ],
            }
          : category,
      );

      persistCategories(updatedCategories);
      return;
    }

    const newCategory = {
      id: Date.now().toString(),
      name: trimmedCategory,
      subcategories: trimmedSubcategory ? [trimmedSubcategory] : [],
      createdAt: new Date().toISOString(),
    };

    persistCategories([newCategory, ...categories]);
  };

  const handleAddRecord = (e) => {
    e.preventDefault();

    if (!recordForm.title.trim()) return;
    if (!recordForm.amount) return;

    syncCategoryStorage(recordForm.category, recordForm.subcategory);

    const newRecord = {
      id: Date.now().toString(),
      title: recordForm.title.trim(),
      type: recordForm.type,
      amount: Number(recordForm.amount) || 0,
      category: recordForm.category.trim(),
      subcategory: recordForm.subcategory.trim(),
      date: recordForm.date,
      notes: recordForm.notes,
    };

    const updatedRecords = [newRecord, ...records];
    persistRecords(updatedRecords);

    resetRecordForm();
    setShowRecordModal(false);
  };

  const handleAddPayment = (e) => {
    e.preventDefault();

    if (!paymentForm.title.trim()) return;
    if (!paymentForm.amount) return;

    const newPayment = {
      id: Date.now().toString(),
      title: paymentForm.title.trim(),
      amount: Number(paymentForm.amount) || 0,
      dueDate: paymentForm.dueDate,
      status: paymentForm.status,
      notes: paymentForm.notes,
    };

    const updatedPayments = [newPayment, ...plannedPayments];
    persistPayments(updatedPayments);

    resetPaymentForm();
    setShowPaymentModal(false);
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

  const handleEditRecord = (e) => {
    e.preventDefault();

    if (!selectedRecord) return;
    if (!recordForm.title.trim()) return;
    if (!recordForm.amount) return;

    syncCategoryStorage(recordForm.category, recordForm.subcategory);

    const updatedRecords = records.map((record) =>
      record.id === selectedRecord.id
        ? {
            ...record,
            title: recordForm.title.trim(),
            type: recordForm.type,
            amount: Number(recordForm.amount) || 0,
            category: recordForm.category.trim(),
            subcategory: recordForm.subcategory.trim(),
            date: recordForm.date,
            notes: recordForm.notes,
          }
        : record,
    );

    persistRecords(updatedRecords);

    const updatedSelected = updatedRecords.find(
      (record) => record.id === selectedRecord.id,
    );
    setSelectedRecord(updatedSelected || null);
    setShowEditRecordModal(false);
    resetRecordForm();
  };

  const handleDeleteRecord = (recordId) => {
    const confirmed = window.confirm("Delete this record?");
    if (!confirmed) return;

    const updatedRecords = records.filter((record) => record.id !== recordId);
    persistRecords(updatedRecords);

    if (selectedRecord?.id === recordId) {
      setSelectedRecord(null);
      setShowViewRecordModal(false);
      setShowEditRecordModal(false);
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

  const handleEditPayment = (e) => {
    e.preventDefault();

    if (!selectedPayment) return;
    if (!paymentForm.title.trim()) return;
    if (!paymentForm.amount) return;

    const updatedPayments = plannedPayments.map((payment) =>
      payment.id === selectedPayment.id
        ? {
            ...payment,
            title: paymentForm.title.trim(),
            amount: Number(paymentForm.amount) || 0,
            dueDate: paymentForm.dueDate,
            status: paymentForm.status,
            notes: paymentForm.notes,
          }
        : payment,
    );

    persistPayments(updatedPayments);

    const updatedSelected = updatedPayments.find(
      (payment) => payment.id === selectedPayment.id,
    );
    setSelectedPayment(updatedSelected || null);
    setShowEditPaymentModal(false);
    resetPaymentForm();
  };

  const handleDeletePayment = (paymentId) => {
    const confirmed = window.confirm("Delete this planned payment?");
    if (!confirmed) return;

    const updatedPayments = plannedPayments.filter(
      (payment) => payment.id !== paymentId,
    );
    persistPayments(updatedPayments);

    if (selectedPayment?.id === paymentId) {
      setSelectedPayment(null);
      setShowViewPaymentModal(false);
      setShowEditPaymentModal(false);
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

  return (
    <>
      <section className="mb-6 rounded-[2rem] border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Records</h2>
          <button
            className="btn btn-primary rounded-2xl"
            onClick={() => setShowRecordModal(true)}
          >
            Add Record
          </button>
        </div>

        {records.length === 0 ? (
          <p className="opacity-70">No finance records added yet.</p>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-3xl border border-base-300 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold break-words">
                      {record.title}
                    </h3>
                    <p className="mt-1 text-sm opacity-70 break-words">
                      Category: {record.category || "Uncategorized"}
                      {record.subcategory ? ` / ${record.subcategory}` : ""}
                    </p>
                    <p className="mt-1 text-sm opacity-60">
                      {record.date || "No date"}
                    </p>
                    <p className="mt-2 text-sm opacity-70 break-words whitespace-pre-wrap">
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
                        onClick={() => handleDeleteRecord(record.id)}
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

      <section className="rounded-[2rem] border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Planned Payments</h2>
          <button
            className="btn btn-primary rounded-2xl"
            onClick={() => setShowPaymentModal(true)}
          >
            Add Planned Payment
          </button>
        </div>

        {plannedPayments.length === 0 ? (
          <p className="opacity-70">No planned payments added yet.</p>
        ) : (
          <div className="space-y-4">
            {plannedPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-3xl border border-base-300 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold break-words">
                      {payment.title}
                    </h3>
                    <p className="mt-1 text-sm opacity-60">
                      Due: {payment.dueDate || "No due date"}
                    </p>
                    <p className="mt-2 text-sm opacity-70 break-words whitespace-pre-wrap">
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

                      <button
                        className="btn btn-error btn-sm rounded-xl text-white"
                        onClick={() => handleDeletePayment(payment.id)}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
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
                  {categorySuggestions.map((categoryName) => (
                    <option key={categoryName} value={categoryName} />
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
                  {subcategorySuggestions.map((subcategory) => (
                    <option key={subcategory} value={subcategory} />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
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
                  {categorySuggestions.map((categoryName) => (
                    <option key={categoryName} value={categoryName} />
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
                  {subcategorySuggestions.map((subcategory) => (
                    <option key={subcategory} value={subcategory} />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
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
                <p className="mt-1 text-lg font-semibold break-words">
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
                <p className="mt-1 break-words whitespace-pre-wrap">
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
                  onClick={() => handleDeleteRecord(selectedRecord.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
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
                <p className="mt-1 text-lg font-semibold break-words">
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
                <p className="mt-1">
                  {selectedPayment.dueDate || "No due date"}
                </p>
              </div>

              <div>
                <p className="text-sm opacity-60">Notes</p>
                <p className="mt-1 break-words whitespace-pre-wrap">
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
                  onClick={() => handleDeletePayment(selectedPayment.id)}
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

export default FinanceSection;
