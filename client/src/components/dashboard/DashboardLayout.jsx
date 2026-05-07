import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Sidebar from "./Sidebar";

const PERSONA_CACHE_KEY = "mpp.personas.cache.v1";
const FALLBACK_PERSONAS = [
  { _id: "offline-student", name: "Student" },
  { _id: "offline-work", name: "Work" },
  { _id: "offline-wellness", name: "Wellness" },
  { _id: "offline-travel", name: "Travel" },
  { _id: "offline-finance", name: "Finance" },
];

function DashboardLayout({
  title,
  subtitle,
  children,
  restrictTo = null,
  financeTitle = null,
  financeSubtitle = null,
  studentSubtitle = null,
  workSubtitle = null,
  wellnessSubtitle = null,
  travelSubtitle = null,
  adminTitle = null,
  adminSubtitle = null,
}) {
  const navigate = useNavigate();

  const [online, setOnline] = useState(navigator.onLine);
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedPersonaName, setSelectedPersonaName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

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
    const syncSidebarCollapse = () => {
      setSidebarCollapsed(localStorage.getItem("sidebarCollapsed") === "true");
    };

    const handleSidebarCollapseChange = (event) => {
      setSidebarCollapsed(event.detail.collapsed);
    };

    window.addEventListener("storage", syncSidebarCollapse);
    window.addEventListener(
      "sidebar-collapse-change",
      handleSidebarCollapseChange,
    );

    return () => {
      window.removeEventListener("storage", syncSidebarCollapse);
      window.removeEventListener(
        "sidebar-collapse-change",
        handleSidebarCollapseChange,
      );
    };
  }, []);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const cachedPersonas = readCachedPersonas();

        if (!navigator.onLine) {
          applyPersonas(cachedPersonas.length ? cachedPersonas : FALLBACK_PERSONAS);
          return;
        }

        let response;

        try {
          response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/personas`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
        } catch {
          applyPersonas(cachedPersonas.length ? cachedPersonas : FALLBACK_PERSONAS);
          return;
        }

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

        applyPersonas(personaList);
      } catch (err) {
        const cachedPersonas = readCachedPersonas();
        if (cachedPersonas.length) {
          applyPersonas(cachedPersonas);
        } else {
          setError(err.message || "Something went wrong");
          setPersonas([]);
        }
      } finally {
        setLoading(false);
      }
    };

    const applyPersonas = (personaList) => {
      const sortedPersonas = sortPersonas(personaList);
      setPersonas(sortedPersonas);
      cachePersonas(sortedPersonas);

      const savedPersonaId = localStorage.getItem("activePersonaId");
      const savedPersonaName = localStorage.getItem("activePersonaName");

      let initialPersona = null;

      const restrictedPersonaName =
        restrictTo === "admin"
          ? "admin"
          : restrictTo === "student"
            ? "student"
            : restrictTo === "work"
              ? "work"
              : restrictTo === "wellness"
                ? "wellness"
                : restrictTo === "travel"
                  ? "travel"
                  : restrictTo === "finance"
                    ? "finance"
                    : null;

      if (restrictedPersonaName) {
        initialPersona = sortedPersonas.find(
          (persona) =>
            persona.name?.toLowerCase().trim() === restrictedPersonaName,
        );
      }

      const savedPersonaIsAvailableById = savedPersonaId
        ? sortedPersonas.find((persona) => persona._id === savedPersonaId)
        : null;
      const savedPersonaIsAvailableByName = savedPersonaName
        ? sortedPersonas.find(
            (persona) =>
              persona.name?.toLowerCase().trim() ===
              savedPersonaName.toLowerCase().trim(),
          )
        : null;

      initialPersona =
        initialPersona ||
        savedPersonaIsAvailableById ||
        savedPersonaIsAvailableByName;

      if (!initialPersona && sortedPersonas.length > 0) {
        initialPersona = sortedPersonas[0];
      }

      if (initialPersona) {
        setSelectedPersona(initialPersona._id);
        setSelectedPersonaName(initialPersona.name);
        localStorage.setItem("activePersonaId", initialPersona._id);
        localStorage.setItem("activePersonaName", initialPersona.name);
      }
    };

    fetchPersonas();
  }, [restrictTo]);

  const normalizedPersona = selectedPersonaName?.toLowerCase().trim();
  const isAdmin = normalizedPersona === "admin";
  const isFinance =
    normalizedPersona === "personal" || normalizedPersona === "finance";

  const displayPersonaName = useMemo(() => {
    if (isAdmin) return "Admin";
    return isFinance ? "Finance" : selectedPersonaName;
  }, [isAdmin, isFinance, selectedPersonaName]);

  useEffect(() => {
    if (!restrictTo || !selectedPersonaName) return;

    let allowed = false;

    if (restrictTo === "admin") {
      allowed = isAdmin;
    } else if (restrictTo === "student") {
      allowed = normalizedPersona === "student";
    } else if (restrictTo === "work") {
      allowed = normalizedPersona === "work";
    } else if (restrictTo === "finance") {
      allowed = isFinance;
    } else if (restrictTo === "wellness") {
      allowed = normalizedPersona === "wellness";
    } else if (restrictTo === "travel") {
      allowed = normalizedPersona === "travel";
    } else if (restrictTo === "non-finance") {
      allowed = !isFinance;
    }

    if (!allowed) {
      navigate("/dashboard", { replace: true });
    }
  }, [
    restrictTo,
    selectedPersonaName,
    normalizedPersona,
    isAdmin,
    isFinance,
    navigate,
  ]);

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

  const resolvedTitle =
    isAdmin && adminTitle
      ? adminTitle
      : isFinance && financeTitle
        ? financeTitle
        : displayPersonaName
          ? `${displayPersonaName} ${title}`
          : title;
  const resolvedSubtitle =
    isAdmin && adminSubtitle
      ? adminSubtitle
      : isFinance && financeSubtitle
        ? financeSubtitle
        : normalizedPersona === "student" && studentSubtitle
          ? studentSubtitle
          : normalizedPersona === "work" && workSubtitle
            ? workSubtitle
            : normalizedPersona === "wellness" && wellnessSubtitle
              ? wellnessSubtitle
              : normalizedPersona === "travel" && travelSubtitle
                ? travelSubtitle
                : subtitle;

  const content =
    typeof children === "function"
      ? children({
          online,
          personas,
          selectedPersona,
          selectedPersonaName,
          displayPersonaName,
          loading,
          error,
          isAdmin,
          isFinance,
        })
      : children;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-base-200">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside
          className={`hidden shrink-0 lg:block ${
            sidebarCollapsed ? "w-24" : "w-72"
          }`}
        >
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
              <h1 className="text-3xl font-bold md:text-4xl">
                {resolvedTitle}
              </h1>
              <p className="mt-1 text-sm opacity-70 md:text-base">
                {resolvedSubtitle}
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
                        {persona.name === "Personal" ? "Finance" : persona.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div
                className={`rounded-full border px-4 py-1 text-sm font-medium ${
                  online
                    ? "border-green-500 text-green-500"
                    : "border-red-500 text-red-500"
                }`}
              >
                {online ? "Online" : "Offline"}
              </div>
            </div>
          </div>

          {content}
        </main>
      </div>
    </div>
  );
}

function sortPersonas(personaList) {
  const personaOrder = {
    Admin: 0,
    Student: 1,
    Work: 2,
    Finance: 3,
    Wellness: 4,
    Travel: 5,
  };

  return [...personaList].sort(
    (a, b) => (personaOrder[a.name] ?? 999) - (personaOrder[b.name] ?? 999),
  );
}

function readCachedPersonas() {
  try {
    return JSON.parse(localStorage.getItem(PERSONA_CACHE_KEY)) || [];
  } catch {
    return [];
  }
}

function cachePersonas(personas) {
  localStorage.setItem(PERSONA_CACHE_KEY, JSON.stringify(personas));
}

export default DashboardLayout;
