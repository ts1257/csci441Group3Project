import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function Category() {
  const [categories, setCategories] = useState([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);

  const [form, setForm] = useState({
    name: "",
    subcategoryInput: "",
    subcategories: [],
  });

  useEffect(() => {
    const stored = localStorage.getItem("financeCategories");

    try {
      const parsed = stored ? JSON.parse(stored) : [];
      setCategories(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCategories([]);
    }
  }, []);

  const persistCategories = (updatedCategories) => {
    setCategories(updatedCategories);
    localStorage.setItem(
      "financeCategories",
      JSON.stringify(updatedCategories),
    );
  };

  const resetForm = () => {
    setForm({
      name: "",
      subcategoryInput: "",
      subcategories: [],
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedCategory(null);
    resetForm();
  };

  const categoryNames = useMemo(() => {
    return categories.map((category) => category.name);
  }, [categories]);

  const findCategoryByName = (name) => {
    return categories.find(
      (category) =>
        category.name?.toLowerCase().trim() === name?.toLowerCase().trim(),
    );
  };

  const selectedCategoryObject = useMemo(() => {
    return findCategoryByName(form.name);
  }, [categories, form.name]);

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

  const totalSubcategories = useMemo(() => {
    return categories.reduce(
      (total, category) => total + (category.subcategories?.length || 0),
      0,
    );
  }, [categories]);

  const handleCategoryNameChange = (e) => {
    const value = e.target.value;

    if (!value.trim()) {
      setForm((prev) => ({
        ...prev,
        name: value,
        subcategories: [],
      }));
      return;
    }

    const matchedCategory = findCategoryByName(value);

    setForm((prev) => ({
      ...prev,
      name: value,
      subcategories: matchedCategory
        ? [...(matchedCategory.subcategories || [])]
        : prev.subcategories,
    }));
  };

  const handleSubcategoryInputChange = (e) => {
    const value = e.target.value;
    const parentCategory = categories.find((category) =>
      (category.subcategories || []).some(
        (subcategory) =>
          subcategory.toLowerCase().trim() === value.toLowerCase().trim(),
      ),
    );

    setForm((prev) => ({
      ...prev,
      subcategoryInput: value,
      name: parentCategory ? parentCategory.name : prev.name,
      subcategories: parentCategory
        ? [...(parentCategory.subcategories || [])]
        : prev.subcategories,
    }));
  };

  const handleAddSubcategory = () => {
    const value = form.subcategoryInput.trim();
    if (!value) return;

    const exists = form.subcategories.some(
      (subcategory) => subcategory.toLowerCase() === value.toLowerCase(),
    );

    if (exists) {
      setForm((prev) => ({
        ...prev,
        subcategoryInput: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      subcategories: [...prev.subcategories, value],
      subcategoryInput: "",
    }));
  };

  const handleRemoveSubcategory = (subcategoryToRemove) => {
    setForm((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter(
        (subcategory) => subcategory !== subcategoryToRemove,
      ),
    }));
  };

  const handleAddCategory = (e) => {
    e.preventDefault();

    const categoryName = form.name.trim();
    if (!categoryName) return;

    const duplicateCategory = findCategoryByName(categoryName);

    if (duplicateCategory) {
      const mergedSubcategories = [
        ...(duplicateCategory.subcategories || []),
        ...form.subcategories.filter(
          (subcategory) =>
            !(duplicateCategory.subcategories || []).some(
              (existing) =>
                existing.toLowerCase() === subcategory.toLowerCase(),
            ),
        ),
      ];

      const updatedCategories = categories.map((category) =>
        category.id === duplicateCategory.id
          ? {
              ...category,
              subcategories: mergedSubcategories,
            }
          : category,
      );

      persistCategories(updatedCategories);
      setExpandedCategoryId(duplicateCategory.id);
    } else {
      const newCategory = {
        id: Date.now().toString(),
        name: categoryName,
        subcategories: form.subcategories,
        createdAt: new Date().toISOString(),
      };

      const updatedCategories = [newCategory, ...categories];
      persistCategories(updatedCategories);
      setExpandedCategoryId(newCategory.id);
    }

    closeModal();
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setForm({
      name: category.name || "",
      subcategoryInput: "",
      subcategories: [...(category.subcategories || [])],
    });
    setShowEditModal(true);
  };

  const handleEditCategory = (e) => {
    e.preventDefault();

    if (!selectedCategory) return;

    const categoryName = form.name.trim();
    if (!categoryName) return;

    const conflictingCategory = categories.find(
      (category) =>
        category.id !== selectedCategory.id &&
        category.name?.toLowerCase().trim() === categoryName.toLowerCase(),
    );

    if (conflictingCategory) {
      const mergedSubcategories = [
        ...(conflictingCategory.subcategories || []),
        ...form.subcategories.filter(
          (subcategory) =>
            !(conflictingCategory.subcategories || []).some(
              (existing) =>
                existing.toLowerCase() === subcategory.toLowerCase(),
            ),
        ),
      ];

      const remainingCategories = categories.filter(
        (category) => category.id !== selectedCategory.id,
      );

      const updatedCategories = remainingCategories.map((category) =>
        category.id === conflictingCategory.id
          ? {
              ...category,
              subcategories: mergedSubcategories,
            }
          : category,
      );

      persistCategories(updatedCategories);
      setExpandedCategoryId(conflictingCategory.id);
      closeModal();
      return;
    }

    const updatedCategories = categories.map((category) =>
      category.id === selectedCategory.id
        ? {
            ...category,
            name: categoryName,
            subcategories: form.subcategories,
          }
        : category,
    );

    persistCategories(updatedCategories);
    setExpandedCategoryId(selectedCategory.id);
    closeModal();
  };

  const handleDeleteCategory = (categoryId) => {
    const confirmed = window.confirm("Delete this category?");
    if (!confirmed) return;

    const updatedCategories = categories.filter(
      (category) => category.id !== categoryId,
    );
    persistCategories(updatedCategories);

    if (expandedCategoryId === categoryId) {
      setExpandedCategoryId(null);
    }
  };

  const toggleExpanded = (categoryId) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  return (
    <DashboardLayout
      title="Category"
      subtitle="Manage finance categories and subcategories."
      restrictTo="finance"
    >
      {() => (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Total Categories</p>
              <h3 className="mt-3 text-4xl font-bold">{categories.length}</h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Total Subcategories</p>
              <h3 className="mt-3 text-4xl font-bold">{totalSubcategories}</h3>
            </div>
          </div>

          <section className="rounded-[2rem] border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold md:text-3xl">
                Category Structure
              </h2>

              <button
                className="btn btn-primary rounded-2xl"
                onClick={() => setShowAddModal(true)}
              >
                Add Category
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="opacity-70">No categories added yet.</p>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-base-300">
                <div className="hidden grid-cols-[1.5fr_1fr_1fr] bg-base-200 px-4 py-3 text-sm font-semibold md:grid">
                  <div>Category</div>
                  <div>Subcategories</div>
                  <div>Actions</div>
                </div>

                <div className="divide-y divide-base-300">
                  {categories.map((category) => {
                    const isExpanded = expandedCategoryId === category.id;

                    return (
                      <div key={category.id} className="bg-base-100">
                        <div className="grid gap-3 px-4 py-4 md:grid-cols-[1.5fr_1fr_1fr] md:items-center">
                          <div className="min-w-0">
                            <button
                              onClick={() => toggleExpanded(category.id)}
                              className="flex items-center gap-2 text-left"
                            >
                              <span className="text-sm">
                                {isExpanded ? "▾" : "▸"}
                              </span>
                              <span className="font-semibold break-words">
                                {category.name}
                              </span>
                            </button>
                          </div>

                          <div className="text-sm opacity-70">
                            {(category.subcategories || []).length}{" "}
                            subcategories
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              className="btn btn-outline btn-sm rounded-xl"
                              onClick={() => openEditModal(category)}
                            >
                              Edit
                            </button>

                            <button
                              className="btn btn-error btn-sm rounded-xl text-white"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-base-300 bg-base-200/40 px-4 py-4">
                            {category.subcategories?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {category.subcategories.map((subcategory) => (
                                  <span
                                    key={subcategory}
                                    className="badge badge-outline px-3 py-3"
                                  >
                                    {subcategory}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm opacity-60">
                                No subcategories added.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {(showAddModal || showEditModal) && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-xl rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {showAddModal ? "Add Category" : "Edit Category"}
                  </h2>

                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={closeModal}
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={
                    showAddModal ? handleAddCategory : handleEditCategory
                  }
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Category
                    </label>
                    <input
                      type="text"
                      list="finance-category-suggestions"
                      value={form.name}
                      onChange={handleCategoryNameChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Choose existing or type a new category"
                      required
                    />
                    <datalist id="finance-category-suggestions">
                      {categoryNames.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Subcategory
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        list="finance-subcategory-suggestions"
                        value={form.subcategoryInput}
                        onChange={handleSubcategoryInputChange}
                        className="input input-bordered w-full rounded-2xl"
                        placeholder="Choose existing or type a new subcategory"
                      />
                      <button
                        type="button"
                        className="btn rounded-2xl"
                        onClick={handleAddSubcategory}
                      >
                        Add
                      </button>
                    </div>

                    <datalist id="finance-subcategory-suggestions">
                      {subcategorySuggestions.map((subcategory) => (
                        <option key={subcategory} value={subcategory} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Selected Subcategories
                    </label>

                    {form.subcategories.length === 0 ? (
                      <p className="text-sm opacity-60">
                        No subcategories added yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {form.subcategories.map((subcategory) => (
                          <span
                            key={subcategory}
                            className="badge gap-2 px-3 py-3"
                          >
                            {subcategory}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveSubcategory(subcategory)
                              }
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary rounded-2xl"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default Category;
