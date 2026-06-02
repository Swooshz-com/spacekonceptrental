type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readState(params: Record<string, string | string[] | undefined>) {
  const value = params.state;

  return Array.isArray(value) ? value[0] : value;
}

function LoginStatus({ state }: { state?: string }) {
  if (state === "unavailable") {
    return (
      <p className="admin-login__status" role="status">
        Admin access is temporarily unavailable.
      </p>
    );
  }

  if (state === "unauthenticated") {
    return (
      <p className="admin-login__status" role="status">
        Sign in to continue.
      </p>
    );
  }

  return null;
}

export default async function AdminLoginPage({
  searchParams
}: AdminLoginPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const state = readState(params);

  return (
    <section className="section admin-login">
      <div className="admin-login__panel">
        <p className="eyebrow">Secure admin</p>
        <h1>Admin sign in</h1>
        <LoginStatus state={state} />
        <form className="admin-login__form" method="post">
          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              required
              type="email"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          <button className="button" formAction="/api/admin/login" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </section>
  );
}
