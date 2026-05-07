import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showViewProjectModal, setShowViewProjectModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [projectForm, setProjectForm] = useState({
    name: "",
    client: "",
    budget: "",
    color: "blue",
    notes: "",
    status: "active",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch projects");
      }

      const projectList = Array.isArray(data)
        ? data
        : Array.isArray(data.projects)
          ? data.projects
          : Array.isArray(data.data)
            ? data.data
            : [];

      setProjects(projectList);
    } catch (err) {
      setError(err.message || "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      name: "",
      client: "",
      budget: "",
      color: "blue",
      notes: "",
      status: "active",
    });
  };

  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProjectForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProject = async (e) => {
    e.preventDefault();

    if (!projectForm.name.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("token");

      const payload = {
        name: projectForm.name,
        client: projectForm.client,
        budget: projectForm.budget,
        color: projectForm.color,
        notes: projectForm.notes,
        status: projectForm.status,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects`,
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
        throw new Error(data.message || "Failed to create project");
      }

      const newProject = data.project || data.data || data;
      setProjects((prev) => [newProject, ...prev]);

      resetProjectForm();
      setShowAddProjectModal(false);
    } catch (err) {
      setError(err.message || "Failed to add project");
    } finally {
      setSubmitting(false);
    }
  };

  const openViewProjectModal = (project) => {
    setSelectedProject(project);
    setShowViewProjectModal(true);
  };

  const openEditProjectModal = (project) => {
    setSelectedProject(project);
    setProjectForm({
      name: project.name || "",
      client: project.client || "",
      budget: project.budget || "",
      color: project.color || "blue",
      notes: project.notes || "",
      status: project.status || "active",
    });
    setShowEditProjectModal(true);
  };

  const handleEditProject = async (e) => {
    e.preventDefault();

    if (!selectedProject || !projectForm.name.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("token");

      const payload = {
        name: projectForm.name,
        client: projectForm.client,
        budget: projectForm.budget,
        color: projectForm.color,
        notes: projectForm.notes,
        status: projectForm.status,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}`,
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
        throw new Error(data.message || "Failed to update project");
      }

      const updatedProject = data.project || data.data || data;

      setProjects((prev) =>
        prev.map((project) =>
          project._id === selectedProject._id ? updatedProject : project,
        ),
      );

      setSelectedProject(updatedProject);
      setShowEditProjectModal(false);
      resetProjectForm();
    } catch (err) {
      setError(err.message || "Failed to update project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    try {
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete project");
      }

      setProjects((prev) =>
        prev.filter((project) => project._id !== projectId),
      );

      if (selectedProject?._id === projectId) {
        setSelectedProject(null);
        setShowViewProjectModal(false);
        setShowEditProjectModal(false);
      }
    } catch (err) {
      setError(err.message || "Failed to delete project");
    }
  };

  const handleCompleteProject = async (projectId) => {
    try {
      setError("");

      const token = localStorage.getItem("token");
      const projectToUpdate = projects.find((p) => p._id === projectId);

      if (!projectToUpdate) return;

      const payload = {
        ...projectToUpdate,
        status: "completed",
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}`,
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
        throw new Error(data.message || "Failed to complete project");
      }

      const updatedProject = data.project || data.data || data;

      setProjects((prev) =>
        prev.map((project) =>
          project._id === projectId ? updatedProject : project,
        ),
      );

      if (selectedProject?._id === projectId) {
        setSelectedProject(updatedProject);
      }
    } catch (err) {
      setError(err.message || "Failed to complete project");
    }
  };

  const totalProjects = projects.length;

  const completedProjects = useMemo(
    () =>
      projects.filter(
        (project) => project.status === "completed" || project.completed,
      ).length,
    [projects],
  );

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === "active").length,
    [projects],
  );

  const filteredProjects = useMemo(() => {
    if (activeFilter === "All") return projects;
    if (activeFilter === "Active") {
      return projects.filter((project) => project.status === "active");
    }
    if (activeFilter === "Completed") {
      return projects.filter(
        (project) => project.status === "completed" || project.completed,
      );
    }
    return projects;
  }, [projects, activeFilter]);

  const colorClasses = {
    blue: "bg-blue-100 border-blue-300",
    green: "bg-green-100 border-green-300",
    yellow: "bg-yellow-100 border-yellow-300",
    purple: "bg-purple-100 border-purple-300",
    red: "bg-red-100 border-red-300",
  };

  const statusBadgeClass = (status) => {
    if (status === "completed") return "badge-success";
    return "badge-outline";
  };

  const filters = ["All", "Active", "Completed"];

  return (
    <DashboardLayout
      title="Projects"
      subtitle="Manage project-related information for Work mode."
      restrictTo="work"
    >
      {() => (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Total Projects</p>
              <h3 className="mt-3 text-4xl font-bold">{totalProjects}</h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Active Projects</p>
              <h3 className="mt-3 text-4xl font-bold">{activeProjects}</h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Completed Projects</p>
              <h3 className="mt-3 text-4xl font-bold">{completedProjects}</h3>
            </div>
          </div>

          <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-2xl font-bold md:text-3xl">My Projects</h2>

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
                  onClick={() => setShowAddProjectModal(true)}
                >
                  Add Project
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <p className="opacity-70">
                No projects found for {activeFilter.toLowerCase()}.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    className={`rounded-3xl border p-5 min-w-0 overflow-hidden ${
                      colorClasses[project.color] ||
                      "bg-base-100 border-base-300"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-xl font-semibold wrap-break-word">
                        {project.name}
                      </h3>
                      <span
                        className={`badge ${statusBadgeClass(project.status)}`}
                      >
                        {project.status || "active"}
                      </span>
                    </div>

                    <p className="text-sm opacity-60 wrap-break-word">
                      Client: {project.client || "Not set"}
                    </p>

                    <p className="mt-1 text-sm opacity-60 wrap-break-word">
                      Budget: {project.budget || "Not set"}
                    </p>

                    <p className="mt-3 text-sm opacity-70 wrap-break-word whitespace-pre-wrap overflow-hidden">
                      {project.notes || "No notes"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline btn-sm rounded-xl"
                        onClick={() => openViewProjectModal(project)}
                      >
                        View
                      </button>

                      <button
                        className="btn btn-outline btn-sm rounded-xl"
                        onClick={() => openEditProjectModal(project)}
                      >
                        Edit
                      </button>

                      {project.status !== "completed" && !project.completed && (
                        <button
                          className="btn btn-success btn-sm rounded-xl text-white"
                          onClick={() => handleCompleteProject(project._id)}
                        >
                          Complete
                        </button>
                      )}

                      <button
                        className="btn btn-error btn-sm rounded-xl text-white"
                        onClick={() => handleDeleteProject(project._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showAddProjectModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Add Project</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowAddProjectModal(false);
                      resetProjectForm();
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddProject} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Project Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={projectForm.name}
                      onChange={handleProjectChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Enter project name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Client
                    </label>
                    <input
                      type="text"
                      name="client"
                      value={projectForm.client}
                      onChange={handleProjectChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Enter client name"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Budget
                      </label>
                      <input
                        type="text"
                        name="budget"
                        value={projectForm.budget}
                        onChange={handleProjectChange}
                        className="input input-bordered w-full rounded-2xl"
                        placeholder="Enter budget"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Color
                      </label>
                      <select
                        name="color"
                        value={projectForm.color}
                        onChange={handleProjectChange}
                        className="select select-bordered w-full rounded-2xl"
                      >
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="yellow">Yellow</option>
                        <option value="purple">Purple</option>
                        <option value="red">Red</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Status
                    </label>
                    <select
                      name="status"
                      value={projectForm.status}
                      onChange={handleProjectChange}
                      className="select select-bordered w-full rounded-2xl"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={projectForm.notes}
                      onChange={handleProjectChange}
                      className="textarea textarea-bordered w-full rounded-2xl"
                      placeholder="Enter project notes"
                      rows="4"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl"
                      onClick={() => {
                        setShowAddProjectModal(false);
                        resetProjectForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary rounded-2xl"
                    >
                      Add Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showEditProjectModal && selectedProject && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Edit Project</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowEditProjectModal(false);
                      setSelectedProject(null);
                      resetProjectForm();
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditProject} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Project Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={projectForm.name}
                      onChange={handleProjectChange}
                      className="input input-bordered w-full rounded-2xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Client
                    </label>
                    <input
                      type="text"
                      name="client"
                      value={projectForm.client}
                      onChange={handleProjectChange}
                      className="input input-bordered w-full rounded-2xl"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Budget
                      </label>
                      <input
                        type="text"
                        name="budget"
                        value={projectForm.budget}
                        onChange={handleProjectChange}
                        className="input input-bordered w-full rounded-2xl"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Color
                      </label>
                      <select
                        name="color"
                        value={projectForm.color}
                        onChange={handleProjectChange}
                        className="select select-bordered w-full rounded-2xl"
                      >
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="yellow">Yellow</option>
                        <option value="purple">Purple</option>
                        <option value="red">Red</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Status
                    </label>
                    <select
                      name="status"
                      value={projectForm.status}
                      onChange={handleProjectChange}
                      className="select select-bordered w-full rounded-2xl"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={projectForm.notes}
                      onChange={handleProjectChange}
                      className="textarea textarea-bordered w-full rounded-2xl"
                      rows="4"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl"
                      onClick={() => {
                        setShowEditProjectModal(false);
                        setSelectedProject(null);
                        resetProjectForm();
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

          {showViewProjectModal && selectedProject && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-4xl border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Project Details</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xi"
                    onClick={() => {
                      setShowViewProjectModal(false);
                      setSelectedProject(null);
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm opacity-60">Project Name</p>
                    <p className="mt-1 text-lg font-semibold wrap-break-word">
                      {selectedProject.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm opacity-60">Client</p>
                    <p className="mt-1">
                      {selectedProject.client || "Not set"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm opacity-60">Budget</p>
                    <p className="mt-1">
                      {selectedProject.budget || "Not set"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm opacity-60">Status</p>
                    <p className="mt-1">{selectedProject.status || "active"}</p>
                  </div>

                  <div>
                    <p className="text-sm opacity-60">Notes</p>
                    <p className="mt-1 wrap-break-word whitespace-pre-wrap">
                      {selectedProject.notes || "No notes"}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                      className="btn btn-outline rounded-2xl"
                      onClick={() => {
                        setShowViewProjectModal(false);
                        openEditProjectModal(selectedProject);
                      }}
                    >
                      Edit
                    </button>

                    {selectedProject.status !== "completed" &&
                      !selectedProject.completed && (
                        <button
                          className="btn btn-success rounded-2xl text-white"
                          onClick={() =>
                            handleCompleteProject(selectedProject._id)
                          }
                        >
                          Complete
                        </button>
                      )}

                    <button
                      className="btn btn-error rounded-2xl text-white"
                      onClick={() => handleDeleteProject(selectedProject._id)}
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

export default Projects;
