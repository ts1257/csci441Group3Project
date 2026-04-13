import { Link, NavLink, useLocation, useNavigate } from "react-router";
import logo from "../assets/logo.png";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isDashboardPage = location.pathname === "/dashboard";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleDashboardMenuOpen = () => {
    window.dispatchEvent(new CustomEvent("open-dashboard-sidebar"));
  };

  return (
    <div className="sticky top-0 z-50 border-b border-base-300 bg-base-100/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        {/* LEFT: Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="logo"
              className="h-12 w-auto sm:h-14 lg:h-16"
            />
          </Link>
        </div>

        {/* CENTER (only non-dashboard) */}
        {!isDashboardPage && (
          <div className="hidden lg:flex">
            <ul className="menu menu-horizontal gap-2 px-1">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive
                      ? "rounded-xl bg-primary/10 font-medium text-primary"
                      : "rounded-xl font-medium"
                  }
                >
                  Home
                </NavLink>
              </li>

              {token && (
                <li>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      isActive
                        ? "rounded-xl bg-primary/10 font-medium text-primary"
                        : "rounded-xl font-medium"
                    }
                  >
                    Dashboard
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          {/* Dashboard Hamburger (RIGHT side now) */}
          {isDashboardPage && (
            <button
              className="btn btn-ghost rounded-xl lg:hidden"
              onClick={handleDashboardMenuOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Desktop Auth */}
          <div className="hidden items-center gap-3 lg:flex">
            {token ? (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost rounded-xl"
                >
                  {user?.name || "Account"}
                </div>

                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 w-48 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-lg"
                >
                  <li>
                    <span className="font-medium">
                      {user?.name || "Account"}
                    </span>
                  </li>
                  <li>
                    <button onClick={handleLogout}>Logout</button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost rounded-xl">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary rounded-xl">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu (non-dashboard only) */}
          {!isDashboardPage && (
            <div className="dropdown dropdown-end lg:hidden">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost rounded-xl"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h8m-8 6h16"
                  />
                </svg>
              </div>

              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 w-56 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-lg"
              >
                <li>
                  <NavLink to="/">Home</NavLink>
                </li>

                {token && (
                  <li>
                    <NavLink to="/dashboard">Dashboard</NavLink>
                  </li>
                )}

                {token ? (
                  <>
                    <li className="menu-title">
                      <span>{user?.name || "Account"}</span>
                    </li>
                    <li>
                      <button onClick={handleLogout}>Logout</button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <NavLink to="/login">Login</NavLink>
                    </li>
                    <li>
                      <NavLink to="/register">Register</NavLink>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
