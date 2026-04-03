function Register() {
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
            <fieldset className="fieldset">
              <label className="label">Name</label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                className="input w-full"
                placeholder="Your name"
              />

              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="input w-full"
                placeholder="Email"
              />

              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="input w-full"
                placeholder="Password"
              />

              <label className="label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                className="input w-full"
                placeholder="Confirm password"
              />

              <button className="btn btn-primary mt-4 w-full">Register</button>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
