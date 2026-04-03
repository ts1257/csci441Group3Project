import { Link } from "react-router";

function Hero() {
  return (
    <div className="hero bg-base-200 min-h-[70vh]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
            Manage Your Life with Multiple Personas
          </h1>

          <p className="py-6 text-base sm:text-lg text-gray-500">
            Switch between Student, Work, and Personal modes effortlessly. Stay
            organized, reduce stress, and track your productivity — all in one
            intelligent planner.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>

            <a href="#features" className="btn btn-outline">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
