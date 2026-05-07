import { useEffect, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

function AdminUsers() {
  return (
    <DashboardLayout
      title="Users"
      subtitle="View users, update roles, and remove accounts."
      adminTitle="Admin Users"
      adminSubtitle="View users, update roles, and remove accounts."
      restrictTo="admin"
    >
      <AdminUsersContent />
    </DashboardLayout>
  );
}

function AdminUsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      setUsers(Array.isArray(data) ? data : data.users || data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (user, role) => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${user._id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update role");
      }

      setUsers((prev) => prev.map((item) => (item._id === user._id ? { ...item, role } : item)));
    } catch (err) {
      setError(err.message || "Failed to update role");
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(`Delete ${user.name}? This will remove the user and related data.`);
    if (!confirmed) return;

    try {
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${user._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((item) => item._id !== user._id));
    } catch (err) {
      setError(err.message || "Failed to delete user");
    }
  };

  return (
    <section className="rounded-4xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Manage Users</h2>
          <p className="mt-1 text-sm opacity-70">Admins can update roles and delete users except their own account.</p>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4 rounded-2xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : users.length === 0 ? (
        <p className="opacity-70">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user._id === currentUser?._id || user._id === currentUser?.id;
                return (
                  <tr key={user._id}>
                    <td className="font-medium">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === "admin" ? "badge-primary" : "badge-ghost"}`}>
                        {user.role || "user"}
                      </span>
                    </td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {user.role === "admin" ? (
                          <button
                            className="btn btn-outline btn-sm rounded-xl"
                            disabled={isSelf}
                            onClick={() => updateRole(user, "user")}
                          >
                            Make User
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline btn-sm rounded-xl"
                            onClick={() => updateRole(user, "admin")}
                          >
                            Make Admin
                          </button>
                        )}
                        <button
                          className="btn btn-error btn-sm rounded-xl"
                          disabled={isSelf}
                          onClick={() => deleteUser(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdminUsers;
