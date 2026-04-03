function Login() {
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
            <fieldset className="fieldset">
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

              <div className="text-right">
                <a className="link link-hover text-sm">Forgot password?</a>
              </div>

              <button className="btn btn-primary mt-4 w-full">Login</button>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
