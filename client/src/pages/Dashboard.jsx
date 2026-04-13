import { useEffect, useState } from "react";

function Dashboard() {
  const [online, setOnline] = useState(navigator.onLine);

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

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm opacity-70">Multi-Persona Planner overview</p>
          </div>

          <div className="badge badge-outline">
            {online ? "Online" : "Offline"}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Current Persona</h2>
              <p>Persona selector will go here.</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Tasks</h2>
              <p>Your task list will appear here.</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Quick Actions</h2>
              <p>Add task and other controls will go here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
