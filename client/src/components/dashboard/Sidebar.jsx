import { NavLink, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faBook,
  faListCheck,
  faMoneyBill,
  faFileInvoice,
  faTags,
  faCalendar,
  faMoon,
  faSun,
  faChevronLeft,
  faChevronRight,
  faUser,
  faRightFromBracket,
  faBriefcase,
  faHeartPulse,
  faPlane,
} from "@fortawesome/free-solid-svg-icons";

function Sidebar({ selectedPersonaName, onNavigate }) {
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    setIsDark(savedTheme === "dark");

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const username = useMemo(() => {
    const directUsername =
      localStorage.getItem("username") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("name");

    if (directUsername) return directUsername;

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return (
          parsedUser?.username ||
          parsedUser?.name ||
          parsedUser?.displayName ||
          parsedUser?.email ||
          "User"
        );
      } catch {
        return storedUser;
      }
    }

    return "User";
  }, []);

  const persona = selectedPersonaName?.toLowerCase().trim();
  const isStudent = persona === "student";
  const isWork = persona === "work";
  const isFinance = persona === "personal" || persona === "finance";
  const isWellness = persona === "wellness";
  const isTravel = persona === "travel";

  const displayPersonaName = isFinance
    ? "Finance"
    : selectedPersonaName || "Persona";

  const handleThemeToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    setIsDark(!isDark);
  };

  const handleCollapseToggle = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    localStorage.setItem("sidebarCollapsed", String(nextCollapsed));

    window.dispatchEvent(
      new CustomEvent("sidebar-collapse-change", {
        detail: { collapsed: nextCollapsed },
      }),
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    localStorage.removeItem("userName");
    localStorage.removeItem("name");
    navigate("/login");
    onNavigate?.();
  };

  const effectiveIsCollapsed = isMobile ? false : isCollapsed;

  const navClass = ({ isActive }) =>
    `rounded-2xl flex items-center gap-3 ${
      effectiveIsCollapsed ? "justify-center px-2" : "px-3"
    } ${isActive ? "bg-base-200 font-semibold" : ""}`;

  const actionButtonClass = `rounded-2xl flex items-center gap-3 ${
    effectiveIsCollapsed ? "justify-center px-2" : "px-3"
  }`;

  const renderLabel = (label) =>
    !effectiveIsCollapsed ? <span>{label}</span> : null;

  const Icon = ({ icon }) => (
    <FontAwesomeIcon icon={icon} className="text-lg" />
  );

  return (
    <>
      <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <p
          className={`mb-2 text-sm font-medium uppercase tracking-wide opacity-60 ${
            effectiveIsCollapsed ? "text-center" : ""
          }`}
        >
          {effectiveIsCollapsed ? "Mode" : "Active Persona"}
        </p>
        <h2
          className={`text-2xl font-bold ${effectiveIsCollapsed ? "text-center" : ""}`}
        >
          {effectiveIsCollapsed
            ? displayPersonaName.charAt(0)
            : displayPersonaName}
        </h2>
      </div>

      <div className="rounded-3xl border border-base-300 bg-base-100 p-3 shadow-sm">
        <ul className="menu gap-1">
          <li>
            <NavLink to="/dashboard" className={navClass} onClick={onNavigate}>
              <Icon icon={faHouse} />
              {renderLabel("Dashboard")}
            </NavLink>
          </li>

          {isStudent && (
            <li>
              <NavLink
                to="/dashboard/courses"
                className={navClass}
                onClick={onNavigate}
              >
                <Icon icon={faBook} />
                {renderLabel("Courses")}
              </NavLink>
            </li>
          )}

          {(isStudent || isWork || isWellness || isTravel) && (
            <li>
              <NavLink
                to="/dashboard/tasks"
                className={navClass}
                onClick={onNavigate}
              >
                <Icon icon={faListCheck} />
                {renderLabel("Tasks")}
              </NavLink>
            </li>
          )}

          {isWellness && (
            <li>
              <NavLink
                to="/dashboard/habits"
                className={navClass}
                onClick={onNavigate}
              >
                <Icon icon={faHeartPulse} />
                {renderLabel("Habits")}
              </NavLink>
            </li>
          )}

          {isTravel && (
            <li>
              <NavLink
                to="/dashboard/trips"
                className={navClass}
                onClick={onNavigate}
              >
                <Icon icon={faPlane} />
                {renderLabel("Trips")}
              </NavLink>
            </li>
          )}

          {isWork && (
            <li>
              <NavLink to="/dashboard/projects" className={navClass}>
                <Icon icon={faBriefcase} />
                {renderLabel("Projects")}
              </NavLink>
            </li>
          )}

          {isFinance && (
            <>
              <li>
                <NavLink
                  to="/dashboard/records"
                  className={navClass}
                  onClick={onNavigate}
                >
                  <Icon icon={faMoneyBill} />
                  {renderLabel("Records")}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/dashboard/planned-payments"
                  className={navClass}
                  onClick={onNavigate}
                >
                  <Icon icon={faFileInvoice} />
                  {renderLabel("Planned Payments")}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/dashboard/category"
                  className={navClass}
                  onClick={onNavigate}
                >
                  <Icon icon={faTags} />
                  {renderLabel("Category")}
                </NavLink>
              </li>
            </>
          )}

          <li>
            <NavLink
              to="/dashboard/calendar"
              className={navClass}
              onClick={onNavigate}
            >
              <Icon icon={faCalendar} />
              {renderLabel("Calendar")}
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-base-300 bg-base-100 p-3 shadow-sm">
        <ul className="menu gap-1">
          <li>
            <button className={actionButtonClass} onClick={handleThemeToggle}>
              <Icon icon={isDark ? faSun : faMoon} />
              {!effectiveIsCollapsed && (
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              )}
            </button>
          </li>

          {isMobile && (
            <>
              <li>
                <div className="rounded-2xl flex items-center gap-3 px-3">
                  <Icon icon={faUser} />
                  <span className="truncate">{username}</span>
                </div>
              </li>

              <li>
                <button className={actionButtonClass} onClick={handleLogout}>
                  <Icon icon={faRightFromBracket} />
                  <span>Logout</span>
                </button>
              </li>
            </>
          )}

          {!isMobile && (
            <li>
              <button
                className={actionButtonClass}
                onClick={handleCollapseToggle}
              >
                <Icon
                  icon={effectiveIsCollapsed ? faChevronRight : faChevronLeft}
                />
                {!effectiveIsCollapsed && <span>Collapse</span>}
              </button>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
