import { NavLink } from "react-router";

function Sidebar({ selectedPersonaName, onNavigate }) {
  const navClass = ({ isActive }) =>
    isActive
      ? "rounded-2xl bg-primary/10 font-semibold text-primary"
      : "rounded-2xl";

  const persona = selectedPersonaName?.toLowerCase().trim();
  const isStudent = persona === "student";

  return (
    <>
      <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide opacity-60">
          Active Persona
        </p>
        <h2 className="text-2xl font-bold">
          {selectedPersonaName || "Persona"}
        </h2>
      </div>

      <div className="rounded-3xl border border-base-300 bg-base-100 p-3 shadow-sm">
        <ul className="menu gap-1">
          <li>
            <NavLink to="/dashboard" className={navClass} onClick={onNavigate}>
              Dashboard
            </NavLink>
          </li>

          {isStudent && (
            <li>
              <NavLink
                to="/dashboard/courses"
                className={navClass}
                onClick={onNavigate}
              >
                Courses
              </NavLink>
            </li>
          )}

          <li>
            <NavLink
              to="/dashboard/tasks"
              className={navClass}
              onClick={onNavigate}
            >
              Tasks
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/dashboard/calendar"
              className={navClass}
              onClick={onNavigate}
            >
              Calendar
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-base-300 bg-base-100 p-3 shadow-sm">
        <ul className="menu gap-1">
          <li>
            <button className="justify-start rounded-2xl">Dark Mode</button>
          </li>
          <li>
            <button className="justify-start rounded-2xl">Collapse</button>
          </li>
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
