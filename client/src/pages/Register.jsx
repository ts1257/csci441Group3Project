import { useState } from "react";
import { useNavigate } from "react-router";
import { persistAuth, registerRequest } from "../utils/auth";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Name, email, and password are required");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await registerRequest({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      persistAuth(data);
      setSuccess("Registration successful. Redirecting...");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });

      setTimeout(() => {
        navigate("/login");
      }, 700);
    } catch (requestError) {
      setError(requestError.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center">
      <div className="hero-content flex-col lg:flex-row gap-10 lg:gap-10 w-full">
        <div className="text-center lg:text-left flex-1">
          <h1 className="text-4xl sm:text-5xl font-bold">
            Create your account
          </h1>
          <p className="py-6 text-base sm:text-lg text-gray-600">
            Join Multi-Persona Planner and start organizing your life with
            smarter task management. Switch between different personas, stay
            focused, and keep track of your responsibilities in one place.
          </p>
        </div>

        <div className="card bg-base-100 w-full max-w-md shrink-0 shadow-2xl flex-1">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="fieldset">
              <label className="label">Name</label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                className="input w-full"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />

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
                autoComplete="new-password"
                className="input w-full"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <label className="label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                className="input w-full"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
              />

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
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
