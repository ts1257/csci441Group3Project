import logo from "../assets/logo.png";

function Footer() {
  return (
    <footer className="bg-neutral text-neutral-content py-10">
      <div className="max-w-7xl mx-auto w-full px-4 flex flex-col items-center text-center gap-4">
        <img src={logo} alt="logo" className="h-16 sm:h-20 w-auto" />

        <p className="text-sm sm:text-base">
          Multi-Persona Planner helps you manage your life by switching between
          different roles seamlessly.
        </p>

        <p className="text-sm opacity-70">
          © {new Date().getFullYear()} Multi-Persona Planner. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
