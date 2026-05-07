import { useEffect, useState } from "react";
import { Navigate } from "react-router";

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [status, setStatus] = useState(storedUser?.role === "admin" ? "allowed" : "checking");

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!token) {
        setStatus("no-token");
        return;
      }

      if (storedUser?.role === "admin") {
        setStatus("allowed");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to verify admin access");
        }

        if (data.user?.role === "admin") {
          localStorage.setItem("user", JSON.stringify(data.user));
          setStatus("allowed");
          return;
        }

        setStatus("denied");
      } catch {
        setStatus("denied");
      }
    };

    verifyAdmin();
  }, [token, storedUser?.role]);

  if (!token || status === "no-token") {
    return <Navigate to="/login" replace />;
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (status !== "allowed") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;
