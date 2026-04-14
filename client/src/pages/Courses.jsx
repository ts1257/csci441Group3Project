import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showViewCourseModal, setShowViewCourseModal] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);

  const [courseForm, setCourseForm] = useState({
    name: "",
    instructor: "",
    credits: "",
    color: "blue",
    notes: "",
    status: "active",
  });

  useEffect(() => {
    const storedCourses = localStorage.getItem("studentCourses");

    try {
      const parsedCourses = storedCourses ? JSON.parse(storedCourses) : [];
      setCourses(Array.isArray(parsedCourses) ? parsedCourses : []);
    } catch {
      setCourses([]);
    }
  }, []);

  const persistCourses = (updatedCourses) => {
    setCourses(updatedCourses);
    localStorage.setItem("studentCourses", JSON.stringify(updatedCourses));
  };

  const resetCourseForm = () => {
    setCourseForm({
      name: "",
      instructor: "",
      credits: "",
      color: "blue",
      notes: "",
      status: "active",
    });
  };

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourseForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddCourse = (e) => {
    e.preventDefault();

    if (!courseForm.name.trim()) return;

    const newCourse = {
      id: Date.now().toString(),
      name: courseForm.name,
      instructor: courseForm.instructor,
      credits: courseForm.credits,
      color: courseForm.color,
      notes: courseForm.notes,
      status: courseForm.status,
      completed: courseForm.status === "completed",
      createdAt: new Date().toISOString(),
    };

    const updatedCourses = [newCourse, ...courses];
    persistCourses(updatedCourses);

    resetCourseForm();
    setShowAddCourseModal(false);
  };

  const openViewCourseModal = (course) => {
    setSelectedCourse(course);
    setShowViewCourseModal(true);
  };

  const openEditCourseModal = (course) => {
    setSelectedCourse(course);
    setCourseForm({
      name: course.name || "",
      instructor: course.instructor || "",
      credits: course.credits || "",
      color: course.color || "blue",
      notes: course.notes || "",
      status: course.status || "active",
    });
    setShowEditCourseModal(true);
  };

  const handleEditCourse = (e) => {
    e.preventDefault();

    if (!selectedCourse || !courseForm.name.trim()) return;

    const updatedCourses = courses.map((course) =>
      course.id === selectedCourse.id
        ? {
            ...course,
            name: courseForm.name,
            instructor: courseForm.instructor,
            credits: courseForm.credits,
            color: courseForm.color,
            notes: courseForm.notes,
            status: courseForm.status,
            completed: courseForm.status === "completed",
          }
        : course,
    );

    persistCourses(updatedCourses);

    const updatedSelectedCourse = updatedCourses.find(
      (course) => course.id === selectedCourse.id,
    );
    setSelectedCourse(updatedSelectedCourse || null);

    setShowEditCourseModal(false);
    resetCourseForm();
  };

  const handleDeleteCourse = (courseId) => {
    const confirmed = window.confirm("Delete this course?");
    if (!confirmed) return;

    const updatedCourses = courses.filter((course) => course.id !== courseId);
    persistCourses(updatedCourses);

    if (selectedCourse?.id === courseId) {
      setSelectedCourse(null);
      setShowViewCourseModal(false);
      setShowEditCourseModal(false);
    }
  };

  const handleCompleteCourse = (courseId) => {
    const updatedCourses = courses.map((course) =>
      course.id === courseId
        ? {
            ...course,
            completed: true,
            status: "completed",
          }
        : course,
    );

    persistCourses(updatedCourses);

    if (selectedCourse?.id === courseId) {
      const updatedSelected = updatedCourses.find(
        (course) => course.id === courseId,
      );
      setSelectedCourse(updatedSelected || null);
    }
  };

  const totalCourses = courses.length;

  const completedCourses = useMemo(
    () =>
      courses.filter(
        (course) => course.status === "completed" || course.completed,
      ).length,
    [courses],
  );

  const activeCourses = useMemo(
    () => courses.filter((course) => course.status === "active").length,
    [courses],
  );

  const filteredCourses = useMemo(() => {
    if (activeFilter === "All") return courses;
    if (activeFilter === "Active") {
      return courses.filter((course) => course.status === "active");
    }
    if (activeFilter === "Completed") {
      return courses.filter(
        (course) => course.status === "completed" || course.completed,
      );
    }
    return courses;
  }, [courses, activeFilter]);

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
      title="Courses"
      subtitle="Manage course-related information for Student mode."
      restrictTo="student"
    >
      {() => (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Total Courses</p>
              <h3 className="mt-3 text-4xl font-bold">{totalCourses}</h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Active Courses</p>
              <h3 className="mt-3 text-4xl font-bold">{activeCourses}</h3>
            </div>

            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <p className="text-sm opacity-60">Completed Courses</p>
              <h3 className="mt-3 text-4xl font-bold">{completedCourses}</h3>
            </div>
          </div>

          <section className="rounded-[2rem] border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-2xl font-bold md:text-3xl">My Courses</h2>

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
                  onClick={() => setShowAddCourseModal(true)}
                >
                  Add Course
                </button>
              </div>
            </div>

            {filteredCourses.length === 0 ? (
              <p className="opacity-70">
                No courses found for {activeFilter.toLowerCase()}.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`rounded-3xl border p-5 min-w-0 overflow-hidden ${
                      colorClasses[course.color] ||
                      "bg-base-100 border-base-300"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-xl font-semibold break-words">
                        {course.name}
                      </h3>
                      <span
                        className={`badge ${statusBadgeClass(course.status)}`}
                      >
                        {course.status || "active"}
                      </span>
                    </div>

                    <p className="text-sm opacity-60 break-words">
                      Instructor: {course.instructor || "Not set"}
                    </p>

                    <p className="mt-1 text-sm opacity-60 break-words">
                      Credits: {course.credits || "Not set"}
                    </p>

                    <p className="mt-3 text-sm opacity-70 break-words whitespace-pre-wrap overflow-hidden">
                      {course.notes || "No notes"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline btn-sm rounded-xl"
                        onClick={() => openViewCourseModal(course)}
                      >
                        View
                      </button>

                      <button
                        className="btn btn-outline btn-sm rounded-xl"
                        onClick={() => openEditCourseModal(course)}
                      >
                        Edit
                      </button>

                      {course.status !== "completed" && !course.completed && (
                        <button
                          className="btn btn-success btn-sm rounded-xl text-white"
                          onClick={() => handleCompleteCourse(course.id)}
                        >
                          Complete
                        </button>
                      )}

                      <button
                        className="btn btn-error btn-sm rounded-xl text-white"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showAddCourseModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Add Course</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowAddCourseModal(false);
                      resetCourseForm();
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Course Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={courseForm.name}
                      onChange={handleCourseChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Enter course name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Instructor
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={courseForm.instructor}
                      onChange={handleCourseChange}
                      className="input input-bordered w-full rounded-2xl"
                      placeholder="Enter instructor name"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Credits
                      </label>
                      <input
                        type="number"
                        name="credits"
                        value={courseForm.credits}
                        onChange={handleCourseChange}
                        className="input input-bordered w-full rounded-2xl"
                        placeholder="Enter credits"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Color
                      </label>
                      <select
                        name="color"
                        value={courseForm.color}
                        onChange={handleCourseChange}
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
                      value={courseForm.status}
                      onChange={handleCourseChange}
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
                      value={courseForm.notes}
                      onChange={handleCourseChange}
                      className="textarea textarea-bordered w-full rounded-2xl"
                      rows="4"
                      placeholder="Enter course notes"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl"
                      onClick={() => {
                        setShowAddCourseModal(false);
                        resetCourseForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary rounded-2xl"
                    >
                      Add Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showEditCourseModal && selectedCourse && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Edit Course</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowEditCourseModal(false);
                      setSelectedCourse(null);
                      resetCourseForm();
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditCourse} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Course Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={courseForm.name}
                      onChange={handleCourseChange}
                      className="input input-bordered w-full rounded-2xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Instructor
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={courseForm.instructor}
                      onChange={handleCourseChange}
                      className="input input-bordered w-full rounded-2xl"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Credits
                      </label>
                      <input
                        type="number"
                        name="credits"
                        value={courseForm.credits}
                        onChange={handleCourseChange}
                        className="input input-bordered w-full rounded-2xl"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Color
                      </label>
                      <select
                        name="color"
                        value={courseForm.color}
                        onChange={handleCourseChange}
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
                      value={courseForm.status}
                      onChange={handleCourseChange}
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
                      value={courseForm.notes}
                      onChange={handleCourseChange}
                      className="textarea textarea-bordered w-full rounded-2xl"
                      rows="4"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl"
                      onClick={() => {
                        setShowEditCourseModal(false);
                        setSelectedCourse(null);
                        resetCourseForm();
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

          {showViewCourseModal && selectedCourse && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Course Details</h2>
                  <button
                    className="btn btn-ghost btn-sm rounded-xl"
                    onClick={() => {
                      setShowViewCourseModal(false);
                      setSelectedCourse(null);
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm opacity-60">Course Name</p>
                    <p className="mt-1 text-lg font-semibold break-words">
                      {selectedCourse.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm opacity-60">Instructor</p>
                    <p className="mt-1 break-words">
                      {selectedCourse.instructor || "Not set"}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm opacity-60">Credits</p>
                      <p className="mt-1">
                        {selectedCourse.credits || "Not set"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm opacity-60">Status</p>
                      <p className="mt-1">
                        {selectedCourse.status || "active"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm opacity-60">Notes</p>
                    <p className="mt-1 break-words whitespace-pre-wrap">
                      {selectedCourse.notes || "No notes"}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                      className="btn btn-outline rounded-2xl"
                      onClick={() => {
                        setShowViewCourseModal(false);
                        openEditCourseModal(selectedCourse);
                      }}
                    >
                      Edit
                    </button>

                    {selectedCourse.status !== "completed" &&
                      !selectedCourse.completed && (
                        <button
                          className="btn btn-success rounded-2xl text-white"
                          onClick={() =>
                            handleCompleteCourse(selectedCourse.id)
                          }
                        >
                          Complete
                        </button>
                      )}

                    <button
                      className="btn btn-error rounded-2xl text-white"
                      onClick={() => handleDeleteCourse(selectedCourse.id)}
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

export default Courses;
