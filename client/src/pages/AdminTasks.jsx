import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function AdminTasks() {
  return (
    <DashboardLayout
      title="Manage Data"
      subtitle="View and manage system records."
      adminTitle="Manage Data"
      adminSubtitle="Review and update tasks, trips, habits, finance records, and other system data."
      restrictTo="admin"
    >
      <AdminDataContent />
    </DashboardLayout>
  );
}

function AdminDataContent() {
  const [data, setData] = useState({});
  const [taskFilter, setTaskFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load admin data");
      }

      setData(result.data || result);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
      setData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    const tasks = data.tasks || [];
    if (taskFilter === "all") return tasks;
    return tasks.filter((task) => task.persona === taskFilter);
  }, [data.tasks, taskFilter]);

  const openEdit = (resource, item, label) => {
    setEditing({ resource, item, label });
    setEditForm(createEditForm(resource, item));
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm({});
    setSaving(false);
  };

  const updateEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;

    try {
      setSaving(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/data/${editing.resource}/${editing.item._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(prepareEditPayload(editing.resource, editForm)),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update record");
      }

      const updatedItem = result.item || result.data || result;

      setData((prev) => ({
        ...prev,
        [editing.resource]: (prev[editing.resource] || []).map((record) =>
          record._id === editing.item._id ? updatedItem : record,
        ),
      }));

      closeEdit();
    } catch (err) {
      setError(err.message || "Failed to update record");
      setSaving(false);
    }
  };

  const deleteItem = async (resource, item, label) => {
    const confirmed = window.confirm(`Delete ${label}: ${getItemTitle(item)}?`);
    if (!confirmed) return;

    try {
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/data/${resource}/${item._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete record");
      }

      setData((prev) => ({
        ...prev,
        [resource]: (prev[resource] || []).filter((record) => record._id !== item._id),
      }));
    } catch (err) {
      setError(err.message || "Failed to delete record");
    }
  };

  const actionButtons = (resource, item, label) => (
    <div className="flex justify-end gap-2" key="actions">
      <button className="btn btn-outline btn-sm rounded-xl" onClick={() => openEdit(resource, item, label)}>
        Edit
      </button>
      <DeleteButton onClick={() => deleteItem(resource, item, label)} />
    </div>
  );

  return (
    <div className="space-y-6">
      {error && <div className="alert alert-error rounded-2xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <>
          <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Manage Tasks</h2>
                <p className="mt-1 text-sm opacity-70">Review, edit, and delete tasks across all users.</p>
              </div>

              <select
                className="select select-bordered rounded-2xl"
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
              >
                <option value="all">All Personas</option>
                <option value="student">Student</option>
                <option value="work">Work</option>
                <option value="finance">Finance</option>
                <option value="wellness">Wellness</option>
                <option value="travel">Travel</option>
              </select>
            </div>

            <ScrollableTable
              emptyText="No tasks found."
              headers={["Task", "Persona", "Owner", "Due Date", "Status", "Actions"]}
              rows={filteredTasks.map((task) => [
                <RecordTitle key="task" title={task.title} subtitle={task.description} />,
                <span key="persona" className="capitalize">{task.persona}</span>,
                task.user?.email || "Unknown",
                formatDate(task.dueDate),
                <span key="status" className="badge badge-ghost capitalize">{task.status}</span>,
                actionButtons("tasks", task, "task"),
              ])}
            />
          </section>

          <AdminDataSection
            title="Manage Trips"
            description="Review, edit, and delete travel trips created by users. Checklist items are managed from Travel Tasks."
            emptyText="No trips found."
            headers={["Trip", "Destination", "Owner", "Start", "End", "Checklist", "Actions"]}
            rows={(data.trips || []).map((trip) => [
              <RecordTitle key="trip" title={trip.tripName} subtitle={trip.notes} />,
              trip.destination || "N/A",
              trip.user?.email || "Unknown",
              formatDate(trip.startDate),
              formatDate(trip.endDate),
              trip.checklist?.length || 0,
              actionButtons("trips", trip, "trip"),
            ])}
          />

          <AdminDataSection
            title="Manage Habits"
            description="Review, edit, and delete wellness habits created by users."
            emptyText="No habits found."
            headers={["Habit", "Category", "Owner", "Goal", "Progress", "Status", "Actions"]}
            rows={(data.habits || []).map((habit) => [
              <RecordTitle key="habit" title={habit.name} subtitle={habit.reminderTime ? `Reminder: ${habit.reminderTime}` : ""} />,
              <span key="category" className="capitalize">{habit.category?.replace("-", " ") || "N/A"}</span>,
              habit.user?.email || "Unknown",
              formatUnitValue(habit.goal, habit.unit),
              formatUnitValue(habit.progress, habit.unit),
              habit.completedToday ? "Completed" : "Not Done",
              actionButtons("habits", habit, "habit"),
            ])}
          />

          <AdminDataSection
            title="Manage Finance Records"
            description="Review, edit, and delete income and expense records."
            emptyText="No finance records found."
            headers={["Record", "Type", "Owner", "Amount", "Category", "Date", "Actions"]}
            rows={(data.records || []).map((record) => [
              <RecordTitle key="record" title={record.title} subtitle={record.notes} />,
              <span key="type" className="capitalize">{record.type}</span>,
              record.user?.email || "Unknown",
              formatMoney(record.amount),
              record.subcategory ? `${record.category} / ${record.subcategory}` : record.category,
              formatDate(record.date),
              actionButtons("records", record, "finance record"),
            ])}
          />

          <AdminDataSection
            title="Manage Planned Payments"
            description="Review, edit, and delete planned payments and due bills."
            emptyText="No planned payments found."
            headers={["Payment", "Owner", "Amount", "Due Date", "Status", "Actions"]}
            rows={(data.plannedPayments || []).map((payment) => [
              <RecordTitle key="payment" title={payment.title} subtitle={payment.notes} />,
              payment.user?.email || "Unknown",
              formatMoney(payment.amount),
              formatDate(payment.dueDate),
              <span key="status" className="badge badge-ghost capitalize">{payment.status}</span>,
              actionButtons("plannedPayments", payment, "planned payment"),
            ])}
          />

          <AdminDataSection
            title="Manage Courses"
            description="Review, edit, and delete student courses."
            emptyText="No courses found."
            headers={["Course", "Instructor", "Owner", "Credits", "Status", "Actions"]}
            rows={(data.courses || []).map((course) => [
              <RecordTitle key="course" title={course.name} subtitle={course.notes} />,
              course.instructor || "N/A",
              course.user?.email || "Unknown",
              course.credits ?? 0,
              <span key="status" className="badge badge-ghost capitalize">{course.status}</span>,
              actionButtons("courses", course, "course"),
            ])}
          />

          <AdminDataSection
            title="Manage Projects"
            description="Review, edit, and delete work projects."
            emptyText="No projects found."
            headers={["Project", "Client", "Owner", "Budget", "Status", "Actions"]}
            rows={(data.projects || []).map((project) => [
              <RecordTitle key="project" title={project.name} subtitle={project.description || project.notes} />,
              project.client || "N/A",
              project.user?.email || "Unknown",
              formatMoney(project.budget),
              <span key="status" className="badge badge-ghost capitalize">{project.status}</span>,
              actionButtons("projects", project, "project"),
            ])}
          />

          <AdminDataSection
            title="Manage Categories"
            description="Review, edit, and delete finance categories and subcategories."
            emptyText="No categories found."
            headers={["Category", "Owner", "Subcategories", "Created", "Actions"]}
            rows={(data.categories || []).map((category) => [
              <RecordTitle key="category" title={category.name} />,
              category.user?.email || "Unknown",
              category.subcategories?.join(", ") || "None",
              formatDate(category.createdAt),
              actionButtons("categories", category, "category"),
            ])}
          />
        </>
      )}

      {editing && (
        <ResourceEditModal
          editing={editing}
          form={editForm}
          saving={saving}
          onChange={updateEditField}
          onCancel={closeEdit}
          onSubmit={saveEdit}
        />
      )}
    </div>
  );
}

function AdminDataSection({ title, description, emptyText, headers, rows }) {
  return (
    <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <p className="mt-1 text-sm opacity-70">{description}</p>
      </div>
      <ScrollableTable emptyText={emptyText} headers={headers} rows={rows} />
    </section>
  );
}

function ScrollableTable({ emptyText, headers, rows }) {
  if (!rows || rows.length === 0) {
    return <p className="opacity-70">{emptyText}</p>;
  }

  return (
    <div className="max-h-96 overflow-y-auto rounded-2xl border border-base-300">
      <div className="overflow-x-auto">
        <table className="table table-pin-rows">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className={header === "Actions" ? "text-right" : ""}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={headers[cellIndex] === "Actions" ? "text-right" : ""}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResourceEditModal(props) {
  const { editing } = props;

  if (editing.resource === "tasks") return <TaskEditModal {...props} />;
  if (editing.resource === "trips") return <TripEditModal {...props} />;
  if (editing.resource === "habits") return <HabitEditModal {...props} />;
  if (editing.resource === "records") return <RecordEditModal {...props} />;
  if (editing.resource === "plannedPayments") return <PlannedPaymentEditModal {...props} />;
  if (editing.resource === "courses") return <CourseEditModal {...props} />;
  if (editing.resource === "projects") return <ProjectEditModal {...props} />;
  if (editing.resource === "categories") return <CategoryEditModal {...props} />;

  return null;
}

function ModalShell({ title, subtitle, children, saving, onCancel, onSubmit }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && <p className="mt-1 text-sm opacity-70">{subtitle}</p>}
          </div>
          <button className="btn btn-ghost btn-sm rounded-xl" onClick={onCancel} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-ghost rounded-2xl" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary rounded-2xl" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({ label, name, value, onChange, placeholder = "", type = "text", required = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        className="input input-bordered w-full rounded-2xl"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function TextAreaField({ label, name, value, onChange, placeholder = "", rows = "3" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <textarea
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        className="textarea textarea-bordered w-full rounded-2xl"
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <select
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        className="select select-bordered w-full rounded-2xl"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function TaskEditModal({ form, saving, onChange, onCancel, onSubmit }) {
  return (
    <ModalShell title="Edit Task" subtitle="Same task edit form style used on the Tasks page." saving={saving} onCancel={onCancel} onSubmit={onSubmit}>
      <TextField label="Title" name="title" value={form.title} onChange={onChange} placeholder="Enter task title" required />

      <SelectField label="Persona" name="persona" value={form.persona} onChange={onChange} options={personaOptions()} />

      {form.persona === "student" && (
        <TextField label="Course" name="courseId" value={form.courseId} onChange={onChange} placeholder="Enter or select a course" />
      )}

      {form.persona === "work" && (
        <TextField label="Project" name="projectId" value={form.projectId} onChange={onChange} placeholder="Enter or select a project" />
      )}

      {form.persona === "wellness" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Wellness Task Type" name="taskType" value={form.taskType} onChange={onChange} options={wellnessTaskTypeOptions()} />
          <TextField label="Reminder Time" name="reminderTime" type="time" value={form.reminderTime} onChange={onChange} />
        </div>
      )}

      {form.persona === "travel" && (
        <TextField label="Trip ID" name="tripId" value={form.tripId} onChange={onChange} placeholder="Related trip ID" />
      )}

      <TextAreaField label="Description" name="description" value={form.description} onChange={onChange} placeholder="Enter description" rows="4" />
      <TextField label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={onChange} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Priority" name="priority" value={form.priority} onChange={onChange} options={priorityOptions()} />
        <SelectField label="Status" name="status" value={form.status} onChange={onChange} options={taskStatusOptions()} />
      </div>
    </ModalShell>
  );
}

function TripEditModal({ form, saving, onChange, onCancel, onSubmit }) {
  return (
    <ModalShell title="Edit Trip" subtitle="This matches the Trips page modal. Checklist tasks stay on the Travel Tasks page." saving={saving} onCancel={onCancel} onSubmit={onSubmit}>
      <TextField label="Trip Name" name="tripName" value={form.tripName} onChange={onChange} placeholder="New York Conference" required />
      <TextField label="Destination" name="destination" value={form.destination} onChange={onChange} placeholder="New York" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Start Date" name="startDate" type="date" value={form.startDate} onChange={onChange} />
        <TextField label="End Date" name="endDate" type="date" value={form.endDate} onChange={onChange} />
      </div>

      <SelectField label="Travel Type" name="travelType" value={form.travelType} onChange={onChange} options={travelTypeOptions()} />
      <TextAreaField label="Notes" name="notes" value={form.notes} onChange={onChange} placeholder="Hotel check-in, terminal, transport notes" />
    </ModalShell>
  );
}

function HabitEditModal({ form, saving, onChange, onCancel, onSubmit }) {
  return (
    <ModalShell title="Edit Habit" subtitle="This matches the Habits page modal." saving={saving} onCancel={onCancel} onSubmit={onSubmit}>
      <TextField label="Habit Name" name="name" value={form.name} onChange={onChange} placeholder="Drink water" required />
      <SelectField label="Category" name="category" value={form.category} onChange={onChange} options={habitCategoryOptions()} />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Goal" name="goal" value={form.goal} onChange={onChange} placeholder="8" />
        <TextField label="Progress" name="progress" value={form.progress} onChange={onChange} placeholder="4" />
        <TextField label="Unit" name="unit" value={form.unit} onChange={onChange} placeholder="cups, pages, minutes" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Reminder Time" name="reminderTime" type="time" value={form.reminderTime} onChange={onChange} />
        <label className="flex items-center gap-3 rounded-2xl border border-base-300 p-4">
          <input
            type="checkbox"
            name="completedToday"
            checked={Boolean(form.completedToday)}
            onChange={(e) => onChange("completedToday", e.target.checked)}
            className="checkbox checkbox-primary"
          />
          <span className="font-medium">Completed Today</span>
        </label>
      </div>
    </ModalShell>
  );
}

function RecordEditModal({ form, saving, onChange, onCancel, onSubmit }) {
  return (
    <ModalShell title="Edit Record" subtitle="This matches the Finance Records page modal." saving={saving} onCancel={onCancel} onSubmit={onSubmit}>
      <TextField label="Title" name="title" value={form.title} onChange={onChange} placeholder="Paycheck, groceries, gas" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Type" name="type" value={form.type} onChange={onChange} options={recordTypeOptions()} />
        <TextField label="Amount" name="amount" type="number" value={form.amount} onChange={onChange} placeholder="100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Category" name="category" value={form.category} onChange={onChange} placeholder="Food, Salary, Transport" />
        <TextField label="Subcategory" name="subcategory" value={form.subcategory} onChange={onChange} placeholder="Groceries, Bonus" />
      </div>

      <TextField label="Date" name="date" type="date" value={form.date} onChange={onChange} />
      <TextAreaField label="Notes" name="notes" value={form.notes} onChange={onChange} placeholder="Optional notes" />
    </ModalShell>
  );
}

function PlannedPaymentEditModal({ form, saving, onChange, onCancel, onSubmit }) {
  return (
    <ModalShell title="Edit Planned Payment" subtitle="This matches the Planned Payments page modal." saving={saving} onCancel={onCancel} onSubmit={onSubmit}>
      <TextField label="Title" name="title" value={form.title} onChange={onChange} placeholder="Rent, phone bill, textbook" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Amount" name="amount" type="number" value={form.amount} onChange={onChange} placeholder="100" />
        <TextField label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={onChange} />
      </div>

      <SelectField label="Status" name="status" value={form.status} onChange={onChange} options={paymentStatusOptions()} />
      <TextAreaField label="Notes" name="notes" value={form.notes} onChange={onChange} placeholder="Optional notes" />
    </ModalShell>
  );
}

function CourseEditModal({ form, saving, onChange, onCancel, onSubmit }) {
  return (
    <ModalShell title="Edit Course" subtitle="This matches the Courses page modal." saving={saving} onCancel={onCancel} onSubmit={onSubmit}>
      <TextField label="Course Name" name="name" value={form.name} onChange={onChange} placeholder="Software Engineering" required />
      <TextField label="Instructor" name="instructor" value={form.instructor} onChange={onChange} placeholder="Professor name" />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Credits" name="credits" type="number" value={form.credits} onChange={onChange} />
        <TextField label="Color" name="color" type="color" value={form.color} onChange={onChange} />
        <SelectField label="Status" name="status" value={form.status} onChange={onChange} options={activeStatusOptions()} />
      </div>

      <TextAreaField label="Notes" name="notes" value={form.notes} onChange={onChange} placeholder="Course notes" />
    </ModalShell>
  );
}

function ProjectEditModal({ form, saving, onChange, onCancel, onSubmit }) {
  return (
    <ModalShell title="Edit Project" subtitle="This matches the Projects page modal." saving={saving} onCancel={onCancel} onSubmit={onSubmit}>
      <TextField label="Project Name" name="name" value={form.name} onChange={onChange} placeholder="Client Website" required />
      <TextField label="Client" name="client" value={form.client} onChange={onChange} placeholder="Client or team name" />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Budget" name="budget" type="number" value={form.budget} onChange={onChange} />
        <TextField label="Color" name="color" type="color" value={form.color} onChange={onChange} />
        <SelectField label="Status" name="status" value={form.status} onChange={onChange} options={activeStatusOptions()} />
      </div>

      <TextAreaField label="Description" name="description" value={form.description} onChange={onChange} placeholder="Project description" />
      <TextAreaField label="Notes" name="notes" value={form.notes} onChange={onChange} placeholder="Project notes" />
    </ModalShell>
  );
}

function CategoryEditModal({ form, saving, onChange, onCancel, onSubmit }) {
  const subcategories = Array.isArray(form.subcategories) ? form.subcategories : [];

  const addSubcategory = () => {
    const value = String(form.subcategoryInput || "").trim();
    if (!value) return;
    const exists = subcategories.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) return;
    onChange("subcategories", [...subcategories, value]);
    onChange("subcategoryInput", "");
  };

  const removeSubcategory = (value) => {
    onChange("subcategories", subcategories.filter((item) => item !== value));
  };

  return (
    <ModalShell title="Edit Category" subtitle="This matches the Categories page modal." saving={saving} onCancel={onCancel} onSubmit={onSubmit}>
      <TextField label="Category Name" name="name" value={form.name} onChange={onChange} placeholder="Food, Bills, School" required />

      <div>
        <label className="mb-2 block text-sm font-medium">Add Subcategory</label>
        <div className="flex gap-2">
          <input
            type="text"
            name="subcategoryInput"
            value={form.subcategoryInput || ""}
            onChange={(e) => onChange("subcategoryInput", e.target.value)}
            className="input input-bordered w-full rounded-2xl"
            placeholder="Groceries, rent, textbook"
          />
          <button type="button" className="btn btn-outline rounded-2xl" onClick={addSubcategory}>
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Subcategories</label>
        {subcategories.length === 0 ? (
          <p className="rounded-2xl bg-base-200 p-4 text-sm opacity-70">No subcategories added.</p>
        ) : (
          <div className="flex flex-wrap gap-2 rounded-2xl bg-base-200 p-4">
            {subcategories.map((subcategory) => (
              <span key={subcategory} className="badge badge-lg gap-2 rounded-xl">
                {subcategory}
                <button type="button" className="text-error" onClick={() => removeSubcategory(subcategory)}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function RecordTitle({ title, subtitle = "" }) {
  return (
    <div>
      <div className="font-medium">{title || "Untitled"}</div>
      {subtitle && <div className="max-w-sm truncate text-sm opacity-60">{subtitle}</div>}
    </div>
  );
}

function DeleteButton({ onClick }) {
  return (
    <button className="btn btn-error btn-sm rounded-xl" onClick={onClick}>
      Delete
    </button>
  );
}

function createEditForm(resource, item) {
  if (resource === "tasks") {
    return {
      title: item.title || "",
      description: item.description || "",
      persona: item.persona || "student",
      dueDate: formatDateInput(item.dueDate),
      priority: item.priority || "medium",
      status: item.status || "todo",
      taskType: item.taskType || "general",
      reminderTime: item.reminderTime || "",
      courseId: item.courseId || "",
      projectId: item.projectId || "",
      tripId: item.tripId || "",
    };
  }

  if (resource === "trips") {
    return {
      tripName: item.tripName || "",
      destination: item.destination || "",
      startDate: formatDateInput(item.startDate),
      endDate: formatDateInput(item.endDate),
      travelType: item.travelType || "other",
      notes: item.notes || "",
    };
  }

  if (resource === "habits") {
    return {
      name: item.name || "",
      category: item.category || "other",
      goal: item.goal || "",
      progress: item.progress || "",
      unit: item.unit || "",
      reminderTime: item.reminderTime || "",
      completedToday: Boolean(item.completedToday),
    };
  }

  if (resource === "records") {
    return {
      title: item.title || "",
      type: item.type || "expense",
      amount: item.amount ?? "",
      category: item.category || "",
      subcategory: item.subcategory || "",
      date: formatDateInput(item.date),
      notes: item.notes || "",
    };
  }

  if (resource === "plannedPayments") {
    return {
      title: item.title || "",
      amount: item.amount ?? "",
      dueDate: formatDateInput(item.dueDate),
      status: item.status || "pending",
      notes: item.notes || "",
    };
  }

  if (resource === "courses") {
    return {
      name: item.name || "",
      instructor: item.instructor || "",
      credits: item.credits ?? 0,
      color: item.color || "#3b82f6",
      notes: item.notes || "",
      status: item.status || "active",
    };
  }

  if (resource === "projects") {
    return {
      name: item.name || "",
      client: item.client || "",
      budget: item.budget ?? 0,
      color: item.color || "#10b981",
      description: item.description || "",
      notes: item.notes || "",
      status: item.status || "active",
    };
  }

  if (resource === "categories") {
    return {
      name: item.name || "",
      subcategories: item.subcategories || [],
      subcategoryInput: "",
    };
  }

  return {};
}

function prepareEditPayload(resource, form) {
  const payload = { ...form };

  if (resource === "categories") {
    payload.subcategories = Array.isArray(form.subcategories)
      ? form.subcategories
      : String(form.subcategories || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    delete payload.subcategoryInput;
  }

  return payload;
}

function personaOptions() {
  return [
    { value: "student", label: "Student" },
    { value: "work", label: "Work" },
    { value: "finance", label: "Finance" },
    { value: "wellness", label: "Wellness" },
    { value: "travel", label: "Travel" },
  ];
}

function priorityOptions() {
  return [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];
}

function taskStatusOptions() {
  return [
    { value: "todo", label: "To Do" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];
}

function wellnessTaskTypeOptions() {
  return [
    { value: "general", label: "General Wellness" },
    { value: "medicine", label: "Medicine Reminder" },
  ];
}

function travelTypeOptions() {
  return [
    { value: "flight", label: "Flight" },
    { value: "car", label: "Car" },
    { value: "train", label: "Train" },
    { value: "bus", label: "Bus" },
    { value: "other", label: "Other" },
  ];
}

function habitCategoryOptions() {
  return [
    { value: "hydration", label: "Hydration" },
    { value: "sleep", label: "Sleep" },
    { value: "exercise", label: "Exercise" },
    { value: "rest", label: "Rest" },
    { value: "mental-health", label: "Mental Health" },
    { value: "meal", label: "Meal" },
    { value: "medicine", label: "Medicine" },
    { value: "other", label: "Other" },
  ];
}

function recordTypeOptions() {
  return [
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
  ];
}

function paymentStatusOptions() {
  return [
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
  ];
}

function activeStatusOptions() {
  return [
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];
}

function getItemTitle(item) {
  return item.title || item.name || item.tripName || item.email || "record";
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

function formatDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatMoney(value) {
  const amount = Number(value) || 0;
  return `$${amount.toFixed(2)}`;
}

function formatUnitValue(value, unit) {
  if (value === undefined || value === null || value === "") return "0";
  return unit ? `${value} ${unit}` : value;
}

export default AdminTasks;
