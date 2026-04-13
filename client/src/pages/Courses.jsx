import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Sidebar from "../components/dashboard/Sidebar";

function Courses() {
  const navigate = useNavigate();

  const [online, setOnline] = useState(navigator.onLine);
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedPersonaName, setSelectedPersonaName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    const openSidebar = () => setSidebarOpen(true);

    window.addEventListener("open-dashboard-sidebar", openSidebar);

    return () => {
      window.removeEventListener("open-dashboard-sidebar", openSidebar);
    };
  }, []);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/personas`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch personas");
        }

        const personaList = Array.isArray(data)
          ? data
          : Array.isArray(data.personas)
            ? data.personas
            : Array.isArray(data.data)
              ? data.data
              : [];

        setPersonas(personaList);

        const savedPersonaId = localStorage.getItem("activePersonaId");
        const savedPersonaName = localStorage.getItem("activePersonaName");

        let initialPersona = null;

        if (savedPersonaId) {
          initialPersona = personaList.find(
            (persona) => persona._id === savedPersonaId,
          );
        }

        if (!initialPersona && savedPersonaName) {
          initialPersona = personaList.find(
            (persona) =>
              persona.name?.toLowerCase().trim() ===
              savedPersonaName.toLowerCase().trim(),
          );
        }

        if (!initialPersona && personaList.length > 0) {
          initialPersona = personaList[0];
        }

        if (initialPersona) {
          setSelectedPersona(initialPersona._id);
          setSelectedPersonaName(initialPersona.name);
          localStorage.setItem("activePersonaId", initialPersona._id);
          localStorage.setItem("activePersonaName", initialPersona.name);
        }
      } catch (err) {
        setError(err.message || "Something went wrong");
        setPersonas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, []);

  useEffect(() => {
    if (!selectedPersonaName) return;

    const isStudent = selectedPersonaName.toLowerCase().trim() === "student";

    if (!isStudent) {
      navigate("/dashboard", { replace: true });
    }
  }, [selectedPersonaName, navigate]);

  const handlePersonaChange = (e) => {
    const personaId = e.target.value;
    const foundPersona = personas.find((persona) => persona._id === personaId);

    setSelectedPersona(personaId);
    setSelectedPersonaName(foundPersona ? foundPersona.name : "");

    localStorage.setItem("activePersonaId", personaId);
    localStorage.setItem(
      "activePersonaName",
      foundPersona ? foundPersona.name : "",
    );
  };

  const isStudent = selectedPersonaName?.toLowerCase().trim() === "student";

  return (
    <div className="min-h-[calc(100vh-73px)] bg-base-200">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-28 space-y-4">
            <Sidebar
              selectedPersonaName={selectedPersonaName}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </aside>

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed right-0 top-0 z-50 h-full w-72 overflow-y-auto bg-base-200 p-4 lg:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  className="btn btn-ghost btn-sm rounded-xl"
                  onClick={() => setSidebarOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <Sidebar
                  selectedPersonaName={selectedPersonaName}
                  onNavigate={() => setSidebarOpen(false)}
                />
              </div>
            </aside>
          </>
        )}

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">Courses</h1>
              <p className="mt-1 text-sm opacity-70 md:text-base">
                Manage course-related information for Student mode.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium opacity-70">Mode</span>
                {loading ? (
                  <span className="text-sm">Loading...</span>
                ) : error ? (
                  <span className="text-sm text-error">{error}</span>
                ) : personas.length === 0 ? (
                  <span className="text-sm">No personas found</span>
                ) : (
                  <select
                    className="select select-bordered rounded-2xl"
                    value={selectedPersona}
                    onChange={handlePersonaChange}
                  >
                    {personas.map((persona) => (
                      <option key={persona._id} value={persona._id}>
                        {persona.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="badge badge-outline rounded-full px-4 py-3">
                {online ? "Online" : "Offline"}
              </div>
            </div>
          </div>

          {!isStudent ? (
            <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Courses unavailable</h2>
              <p className="mt-2 opacity-70">
                Courses is only available in Student mode.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
                  <p className="text-sm font-medium uppercase tracking-wide opacity-60">
                    Total Courses
                  </p>
                  <h3 className="mt-3 text-4xl font-bold">3</h3>
                </div>

                <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
                  <p className="text-sm font-medium uppercase tracking-wide opacity-60">
                    Active Assignments
                  </p>
                  <h3 className="mt-3 text-4xl font-bold">5</h3>
                </div>

                <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
                  <p className="text-sm font-medium uppercase tracking-wide opacity-60">
                    Due This Week
                  </p>
                  <h3 className="mt-3 text-4xl font-bold">2</h3>
                </div>
              </div>

              <section className="rounded-[2rem] border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold md:text-3xl">My Courses</h2>
                  <button className="btn btn-primary rounded-2xl">
                    Add Course
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-3xl border border-base-300 p-5">
                    <h3 className="text-xl font-semibold">
                      Software Engineering
                    </h3>
                    <p className="mt-2 text-sm opacity-70">
                      Group project, reports, and implementation tasks.
                    </p>
                    <p className="mt-3 text-sm opacity-60">
                      Instructor: Professor Ghunaim
                    </p>
                  </div>

                  <div className="rounded-3xl border border-base-300 p-5">
                    <h3 className="text-xl font-semibold">
                      Foundations of Computing
                    </h3>
                    <p className="mt-2 text-sm opacity-70">
                      Concepts, quizzes, and chapter review materials.
                    </p>
                    <p className="mt-3 text-sm opacity-60">
                      Weekly study planning
                    </p>
                  </div>

                  <div className="rounded-3xl border border-base-300 p-5">
                    <h3 className="text-xl font-semibold">
                      Back-End Web Development
                    </h3>
                    <p className="mt-2 text-sm opacity-70">
                      API development, Node.js practice, and deployment work.
                    </p>
                    <p className="mt-3 text-sm opacity-60">
                      Ongoing course activities
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Courses;
