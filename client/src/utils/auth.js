const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const buildApiUrl = (path) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export async function registerRequest({ name, email, password }) {
  const response = await fetch(buildApiUrl("/api/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Registration failed");
  }

  return data;
}

export async function loginRequest({ email, password }) {
  const response = await fetch(buildApiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Login failed");
  }

  return data;
}

export function persistAuth(data) {
  const token = data?.token ?? "";
  const user = data?.user ?? null;

  if (token) {
    localStorage.setItem("token", token);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
}
