import { useEffect, useMemo, useState } from "react";

function TaskManager({ selectedPersona, selectedPersonaName, onTasksChange }) {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [activeTab, setActiveTab] = useState("Today");

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showViewTaskModal, setShowViewTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskSubmitError, setTaskSubmitError] = useState("");

  const normalizedPersona = selectedPersonaName?.toLowerCase().trim();
  const isStudent = normalizedPersona === "student";
  const isWork = normalizedPersona === "work";

  const getInitialTaskState = () => ({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "todo",
    course: "",
    project: "",
  });

  const [newTask, setNewTask] = useState(getInitialTaskState());

  const [editingTask, setEditingTask] = useState({
    _id: "",
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "todo",
    course: "",
    project: "",
  });

  const [courses, setCourses] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setNewTask(getInitialTaskState());
  }, [selectedPersonaName]);

  useEffect(() => {
    const fetchCoursesAndProjects = async () => {
      try {
        const token = localStorage.getItem("token");

        const [coursesRes, projectsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/courses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          const list = Array.isArray(data) ? data : data.courses || [];
          setCourses(list.map((c) => c.name));
        }

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const list = Array.isArray(data) ? data : data.projects || [];
          setProjects(list.map((p) => p.name));
        }
      } catch {
        setCourses([]);
        setProjects([]);
      }
    };

    fetchCoursesAndProjects();
  }, []);

  const parseLocalDate = (dateString) => {
    if (!dateString) return null;

    if (dateString.includes("T")) {
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "No due date";
    const date = parseLocalDate(dateValue);
    return date.toLocaleDateString();
  };

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    if (dateValue.includes("T")) {
      return dateValue.split("T")[0];
    }
    return dateValue;
  };

  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedPersona) {
        setTasks([]);
        return;
      }

      try {
        setTasksLoading(true);
        setTasksError("");

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
          return task.persona === normalizedPersona;
        });

        setTasks(filteredTasks);
        onTasksChange?.(filteredTasks);
      } catch (err) {
        setTasksError(err.message || "Failed to load tasks");
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasks();
  }, [normalizedPersona]);

  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditTaskInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildPayload = (taskData) => {
    const basePayload = {
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate || null,
      priority: taskData.priority,
      status: taskData.status,
      persona: normalizedPersona,
    };

    if (isStudent) {
      basePayload.courseId = taskData.course || "";
    }

    if (isWork) {
      basePayload.projectId = taskData.project || "";
    }

    return basePayload;
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      setTaskSubmitError("Task title is required.");
      return;
    }

    if (!selectedPersona) {
      setTaskSubmitError("Please select a persona first.");
      return;
    }

    try {
      setTaskSubmitting(true);
      setTaskSubmitError("");

      const token = localStorage.getItem("token");
      const payload = buildPayload(newTask);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tasks`,
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
        throw new Error(data.message || "Failed to create task");
      }

      const createdTask = {
        ...(data.task || data.data || data),
        courseId: payload.courseId || "",
        projectId: payload.projectId || "",
      };

      if (createdTask.persona === normalizedPersona) {
        setTasks((prev) => {
          const next = [createdTask, ...prev];
          onTasksChange?.(next);
          return next;
        });
      }

      setNewTask(getInitialTaskState());
      setShowAddTaskModal(false);
    } catch (err) {
      setTaskSubmitError(err.message || "Failed to create task");
    } finally {
      setTaskSubmitting(false);
    }
  };

  const openViewTaskModal = (task) => {
    setSelectedTask(task);
    setShowViewTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setTaskSubmitError("");
    setSelectedTask(task);
    setEditingTask({
      _id: task._id,
      title: task.title || "",
      description: task.description || "",
      dueDate: formatDateForInput(task.dueDate),
      priority: task.priority || "medium",
      status: task.status || "todo",
      course: task.courseId || "",
      project: task.projectId || "",
    });
    setShowEditTaskModal(true);
  };

  const handleEditTask = async (e) => {
    e.preventDefault();

    if (!editingTask.title.trim()) {
      setTaskSubmitError("Task title is required.");
      return;
    }

    try {
      setTaskSubmitting(true);
      setTaskSubmitError("");

      const token = localStorage.getItem("token");
      const payload = buildPayload(editingTask);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${editingTask._id}`,
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
        throw new Error(data.message || "Failed to update task");
      }

      const updatedTask = {
        ...(data.task || data.data || data),
        courseId: payload.courseId || "",
        projectId: payload.projectId || "",
      };

      setTasks((prev) => {
        const next = prev.map((item) =>
          item._id === editingTask._id ? updatedTask : item,
        );
        onTasksChange?.(next);
        return next;
      });

      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask);
      }

      setShowEditTaskModal(false);
    } catch (err) {
      setTaskSubmitError(err.message || "Failed to update task");
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${task._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...task,
            status: "completed",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete task");
      }

      const updatedTask = data.task || data.data || data;

      setTasks((prev) => {
        const next = prev.map((item) =>
          item._id === task._id ? updatedTask : item,
        );
        onTasksChange?.(next);
        return next;
      });

      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask);
      }
    } catch (err) {
      setTasksError(err.message || "Failed to complete task");
    }
  };

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${task._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      setTasks((prev) => {
        const next = prev.filter((item) => item._id !== task._id);
        onTasksChange?.(next);
        return next;
      });

      if (selectedTask?._id === task._id) {
        setSelectedTask(null);
        setShowViewTaskModal(false);
        setShowEditTaskModal(false);
      }
    } catch (err) {
      setTasksError(err.message || "Failed to delete task");
    }
  };

  const tabs = ["Today", "Upcoming", "Completed", "Overdue"];

  const filteredTasksByTab = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const priorityOrder = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return tasks
      .filter((task) => {
        const taskDate = task.dueDate ? parseLocalDate(task.dueDate) : null;
        const isCompleted = task.status === "completed";

        if (activeTab === "Completed") {
          return isCompleted;
        }

        if (activeTab === "Today") {
          if (!taskDate || isCompleted) return false;
          const compareDate = new Date(taskDate);
          compareDate.setHours(0, 0, 0, 0);
          return compareDate.getTime() === today.getTime();
        }

        if (activeTab === "Upcoming") {
          if (!taskDate || isCompleted) return false;
          const compareDate = new Date(taskDate);
          compareDate.setHours(0, 0, 0, 0);
          return compareDate.getTime() > today.getTime();
        }

        if (activeTab === "Overdue") {
          if (!taskDate || isCompleted) return false;
          const compareDate = new Date(taskDate);
          compareDate.setHours(0, 0, 0, 0);
          return compareDate.getTime() < today.getTime();
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.dueDate
          ? parseLocalDate(a.dueDate).getTime()
          : Number.MAX_SAFE_INTEGER;
        const dateB = b.dueDate
          ? parseLocalDate(b.dueDate).getTime()
          : Number.MAX_SAFE_INTEGER;

        if (dateA !== dateB) {
          return dateA - dateB;
        }

        const priorityA = priorityOrder[a.priority] || 0;
        const priorityB = priorityOrder[b.priority] || 0;

        return priorityB - priorityA;
      });
  }, [tasks, activeTab]);

  const renderPersonaMeta = (task) => {
    if (isStudent && task.courseId) {
      return <p className="mt-1 text-sm opacity-70">Course: {task.courseId}</p>;
    }

    if (isWork && task.projectId) {
      return (
        <p className="mt-1 text-sm opacity-70">Project: {task.projectId}</p>
      );
    }

    return null;
  };

  const renderPersonaFields = (taskState, onChangeHandler) => {
    if (isStudent) {
      return (
        <div>
          <label className="mb-2 block text-sm font-medium">Course</label>
          <input
            type="text"
            name="course"
            value={taskState.course}
            onChange={onChangeHandler}
            className="input input-bordered w-full rounded-2xl"
            placeholder="Enter or select a course"
            list="coursesList"
          />
          <datalist id="coursesList">
            {courses.map((course, index) => (
              <option key={index} value={course} />
            ))}
          </datalist>
        </div>
      );
    }

    if (isWork) {
      return (
        <div>
          <label className="mb-2 block text-sm font-medium">Project</label>
          <input
            type="text"
            name="project"
            value={taskState.project}
            onChange={onChangeHandler}
            className="input input-bordered w-full rounded-2xl"
            placeholder="Enter or select a project"
            list="projectsList"
          />
          <datalist id="projectsList">
            {projects.map((project, index) => (
              <option key={index} value={project} />
            ))}
          </datalist>
        </div>
      );
    }

    return null;
  };

  const taskStatusLabel = (task) => {
    if (task.status === "completed") return "Completed";
    if (task.status === "in-progress") return "In Progress";
    return "To Do";
  };

  return (
    <>
      <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Tasks</h2>
          <button
            className="btn btn-primary rounded-2xl"
            onClick={() => {
              setTaskSubmitError("");
              setShowAddTaskModal(true);
            }}
          >
            Add Task
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 hover:bg-base-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {tasksLoading ? (
          <p>Loading tasks...</p>
        ) : tasksError ? (
          <p className="text-error">{tasksError}</p>
        ) : filteredTasksByTab.length === 0 ? (
          <p className="opacity-70">
            No tasks found for {activeTab.toLowerCase()}.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredTasksByTab.map((task) => {
              const isCompleted = task.status === "completed";

              return (
                <div
                  key={task._id}
                  className="rounded-3xl border border-base-300 bg-base-100 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold wrap-break-word">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-sm opacity-70 wrap-break-word whitespace-pre-wrap">
                        {task.description || "No description"}
                      </p>
                      {renderPersonaMeta(task)}
                      <p className="mt-2 text-sm opacity-60">
                        Due: {formatDate(task.dueDate)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <div className="flex flex-wrap gap-2">
                        <span className="badge badge-outline">
                          {task.priority
                            ? task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)
                            : "No Priority"}
                        </span>
                        <span className="badge badge-outline">
                          {taskStatusLabel(task)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          className="btn btn-outline btn-sm rounded-xl"
                          onClick={() => openViewTaskModal(task)}
                        >
                          View
                        </button>

                        <button
                          className="btn btn-outline btn-sm rounded-xl"
                          onClick={() => openEditTaskModal(task)}
                        >
                          Edit
                        </button>

                        {!isCompleted && (
                          <button
                            className="btn btn-success btn-sm rounded-xl text-white"
                            onClick={() => handleCompleteTask(task)}
                          >
                            Complete
                          </button>
                        )}

                        <button
                          className="btn btn-error btn-sm rounded-xl text-white"
                          onClick={() => handleDeleteTask(task)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showAddTaskModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add Task</h2>
              <button
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => setShowAddTaskModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleTaskInputChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Enter task title"
                />
              </div>

              {renderPersonaFields(newTask, handleTaskInputChange)}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newTask.description}
                  onChange={handleTaskInputChange}
                  className="textarea textarea-bordered w-full rounded-2xl"
                  placeholder="Enter description"
                  rows="4"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={newTask.dueDate}
                  onChange={handleTaskInputChange}
                  className="input input-bordered w-full rounded-2xl"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={newTask.priority}
                    onChange={handleTaskInputChange}
                    className="select select-bordered w-full rounded-2xl"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newTask.status}
                    onChange={handleTaskInputChange}
                    className="select select-bordered w-full rounded-2xl"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {taskSubmitError && (
                <p className="text-sm text-error">{taskSubmitError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost rounded-2xl"
                  onClick={() => setShowAddTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-2xl"
                  disabled={taskSubmitting}
                >
                  {taskSubmitting ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditTaskModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Task</h2>
              <button
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => setShowEditTaskModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editingTask.title}
                  onChange={handleEditTaskInputChange}
                  className="input input-bordered w-full rounded-2xl"
                  placeholder="Enter task title"
                />
              </div>

              {renderPersonaFields(editingTask, handleEditTaskInputChange)}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editingTask.description}
                  onChange={handleEditTaskInputChange}
                  className="textarea textarea-bordered w-full rounded-2xl"
                  placeholder="Enter description"
                  rows="4"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={editingTask.dueDate}
                  onChange={handleEditTaskInputChange}
                  className="input input-bordered w-full rounded-2xl"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={editingTask.priority}
                    onChange={handleEditTaskInputChange}
                    className="select select-bordered w-full rounded-2xl"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editingTask.status}
                    onChange={handleEditTaskInputChange}
                    className="select select-bordered w-full rounded-2xl"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {taskSubmitError && (
                <p className="text-sm text-error">{taskSubmitError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost rounded-2xl"
                  onClick={() => setShowEditTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-2xl"
                  disabled={taskSubmitting}
                >
                  {taskSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewTaskModal && selectedTask && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Task Details</h2>
              <button
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => {
                  setShowViewTaskModal(false);
                  setSelectedTask(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-60">Title</p>
                <p className="mt-1 text-lg font-semibold wrap-break-word">
                  {selectedTask.title}
                </p>
              </div>

              <div>
                <p className="text-sm opacity-60">Description</p>
                <p className="mt-1 wrap-break-word whitespace-pre-wrap">
                  {selectedTask.description || "No description"}
                </p>
              </div>

              {isStudent && (
                <div>
                  <p className="text-sm opacity-60">Course</p>
                  <p className="mt-1">{selectedTask.course || "Not set"}</p>
                </div>
              )}

              {isWork && (
                <div>
                  <p className="text-sm opacity-60">Project</p>
                  <p className="mt-1">{selectedTask.project || "Not set"}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm opacity-60">Due Date</p>
                  <p className="mt-1">{formatDate(selectedTask.dueDate)}</p>
                </div>

                <div>
                  <p className="text-sm opacity-60">Priority</p>
                  <p className="mt-1">
                    {selectedTask.priority
                      ? selectedTask.priority.charAt(0).toUpperCase() +
                        selectedTask.priority.slice(1)
                      : "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm opacity-60">Status</p>
                  <p className="mt-1">{taskStatusLabel(selectedTask)}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  className="btn btn-outline rounded-2xl"
                  onClick={() => {
                    setShowViewTaskModal(false);
                    openEditTaskModal(selectedTask);
                  }}
                >
                  Edit
                </button>

                {!(
                  selectedTask.status === "completed" ||
                  selectedTask.completed === true
                ) && (
                  <button
                    className="btn btn-success rounded-2xl text-white"
                    onClick={() => handleCompleteTask(selectedTask)}
                  >
                    Complete
                  </button>
                )}

                <button
                  className="btn btn-error rounded-2xl text-white"
                  onClick={() => handleDeleteTask(selectedTask)}
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

export default TaskManager;
