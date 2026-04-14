import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function Records() {
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [showViewRecordModal, setShowViewRecordModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const [recordForm, setRecordForm] = useState({
    title: "",
    type: "expense",
    amount: "",
    category: "",
    subcategory: "",
    date: "",
    notes: "",
  });

  useEffect(() => {
    const storedRecords = localStorage.getItem("financeRecords");
    const storedCategories = localStorage.getItem("financeCategories");

    try {
      const parsedRecords = storedRecords ? JSON.parse(storedRecords) : [];
      setRecords(Array.isArray(parsedRecords) ? parsedRecords : []);
    } catch {
      setRecords([]);
    }

    try {
      const parsedCategories = storedCategories
        ? JSON.parse(storedCategories)
        : [];
      setCategories(Array.isArray(parsedCategories) ? parsedCategories : []);
    } catch {
      setCategories([]);
    }
  }, []);

  const persistRecords = (updatedRecords) => {
    setRecords(updatedRecords);
    localStorage.setItem("financeRecords", JSON.stringify(updatedRecords));
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
      createdAt: new Date().toISOString(),
    };

    persistRecords([newRecord, ...records]);
    resetRecordForm();
    setShowAddRecordModal(false);
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

    if (!selectedRecord || !recordForm.title.trim()) return;
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

    const updatedSelectedRecord = updatedRecords.find(
      (record) => record.id === selectedRecord.id,
    );
    setSelectedRecord(updatedSelectedRecord || null);

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

  const filters = ["All", "Income", "Expense"];

  const filteredRecords = useMemo(() => {
    if (activeFilter === "All") return records;
    return records.filter(
      (record) => record.type?.toLowerCase() === activeFilter.toLowerCase(),
    );
  }, [records, activeFilter]);

  const incomeTotal = useMemo(() => {
    return records
      .filter((record) => record.type === "income")
      .reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
  }, [records]);

  const expenseTotal = useMemo(() => {
    return records
      .filter((record) => record.type === "expense")
      .reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
  }, [records]);

  const recordTypeBadgeClass = (type) => {
    if (type === "income") return "badge-success";
    return "badge-outline";
  };

  return (
    <DashboardLayout
      title="Records"
      subtitle="Manage finance records for income and expenses."
      restrictTo="finance"
    >
      {() => (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Income</p>
              <h3 className="mt-3 text-4xl font-bold">
                ${incomeTotal.toFixed(2)}
              </h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Expense</p>
              <h3 className="mt-3 text-4xl font-bold">
                ${expenseTotal.toFixed(2)}
              </h3>
            </div>
          </div>

          <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-2xl font-bold md:text-3xl">
                Finance Records
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
                  onClick={() => setShowAddRecordModal(true)}
                >
                  Add Record
                </button>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <p className="opacity-70">
                No records found for {activeFilter.toLowerCase()}.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
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
                          Date: {record.date || "No date"}
                        </p>

                        <p className="mt-2 text-sm opacity-70 wrap-break-word whitespace-pre-wrap">
                          {record.notes || "No notes"}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`badge ${recordTypeBadgeClass(record.type)}`}
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

          {showAddRecordModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Add Record</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowAddRecordModal(false);
                      resetRecordForm();
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddRecord} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Title
                    </label>
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
                      <label className="mb-2 block text-sm font-medium">
                        Type
                      </label>
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
                      list="finance-category-suggestions"
                      value={recordForm.category}
                      onChange={handleRecordChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Choose or type category"
                    />
                    <datalist id="finance-category-suggestions">
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
                      list="finance-subcategory-suggestions"
                      value={recordForm.subcategory}
                      onChange={handleRecordChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Choose or type subcategory"
                    />
                    <datalist id="finance-subcategory-suggestions">
                      {subcategorySuggestions.map((subcategory) => (
                        <option key={subcategory} value={subcategory} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={recordForm.date}
                      onChange={handleRecordChange}
                      className="input input-bordered w-full rounded-2xl"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Notes
                    </label>
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
                        setShowAddRecordModal(false);
                        resetRecordForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary rounded-2xl"
                    >
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
                    <label className="mb-2 block text-sm font-medium">
                      Title
                    </label>
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
                      <label className="mb-2 block text-sm font-medium">
                        Type
                      </label>
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
                      list="finance-category-suggestions-edit"
                      value={recordForm.category}
                      onChange={handleRecordChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Choose or type category"
                    />
                    <datalist id="finance-category-suggestions-edit">
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
                      list="finance-subcategory-suggestions-edit"
                      value={recordForm.subcategory}
                      onChange={handleRecordChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Choose or type subcategory"
                    />
                    <datalist id="finance-subcategory-suggestions-edit">
                      {subcategorySuggestions.map((subcategory) => (
                        <option key={subcategory} value={subcategory} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={recordForm.date}
                      onChange={handleRecordChange}
                      className="input input-bordered w-full rounded-2xl"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Notes
                    </label>
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
                      onClick={() => handleDeleteRecord(selectedRecord.id)}
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

export default Records;
