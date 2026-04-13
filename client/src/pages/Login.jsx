import { useState } from "react";
import { useNavigate } from "react-router";
import { loginRequest, persistAuth } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.email.trim() || !form.password) {
      setError("Email and password are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await loginRequest({
        email: form.email,
        password: form.password,
      });

      persistAuth(data);
      setSuccess("Login successful. Redirecting...");
      setForm({ email: "", password: "" });

      setTimeout(() => {
        navigate("/");
      }, 700);
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center">
      <div className="flex flex-col lg:flex-row-reverse gap-10 lg:gap-20 w-full">
        <div className="text-center lg:text-left flex-1">
          <h1 className="text-4xl sm:text-5xl font-bold">Welcome back</h1>
          <p className="py-6 text-base sm:text-lg text-gray-600">
            Log in to continue managing your tasks across different personas.
            Stay organized, focused, and in control of your daily
            responsibilities.
          </p>
        </div>

        <div className="card bg-base-100 w-full max-w-md shrink-0 shadow-2xl flex-1">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="fieldset">
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="input w-full"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="input w-full"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <div className="text-right">
                <a className="link link-hover text-sm">Forgot password?</a>
              </div>

              {error && (
                <p className="text-sm text-error mt-2" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-success mt-2" role="status">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary mt-4 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
