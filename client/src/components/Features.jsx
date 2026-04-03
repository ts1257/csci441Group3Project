function Features() {
  return (
    <div id="features" className="py-16">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
        Features
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">Persona Switching</h3>
            <p>
              Instantly switch between Student, Work, and Personal views to stay
              focused.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">Offline Access</h3>
            <p>
              Manage your tasks even without internet. Your data syncs
              automatically later.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">Smart Dashboard</h3>
            <p>
              View only relevant tasks based on your current role and reduce
              distractions.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">Productivity Analytics</h3>
            <p>Track your progress with visual charts and insights.</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">Task Management</h3>
            <p>
              Create, edit, and organize tasks easily with a clean interface.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">Budget Tracking</h3>
            <p>Manage your finances alongside your tasks in one place.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Features;
