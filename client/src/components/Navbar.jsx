import { Link } from "react-router";
import logo from "../assets/logo.png";

function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm px-4">
      {/* LEFT: Logo */}
      <div className="navbar-start">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="logo" className="h-12 sm:h-14 lg:h-16 w-auto" />
        </Link>
      </div>

      {/* CENTER: Desktop Menu */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link to="/">Home</Link>
          </li>
        </ul>
      </div>

      {/* RIGHT */}
      <div className="navbar-end gap-2">
        {/* Desktop Buttons */}
        <div className="hidden lg:flex gap-2">
          <Link to="/login" className="btn btn-outline">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary">
            Register
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="dropdown dropdown-end lg:hidden">
          <div tabIndex={0} role="button" className="btn btn-ghost">
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
            className="menu menu-sm dropdown-content bg-base-100 rounded-box mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
