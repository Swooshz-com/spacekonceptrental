import styles from "./admin-login.module.css";

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
      <p className={`${styles.status} ${styles.statusDanger}`} role="status">
        Admin access is temporarily unavailable.
      </p>
    );
  }

  if (state === "unauthenticated") {
    return (
      <p className={`${styles.status} ${styles.statusWarning}`} role="status">
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
    <main className={styles.screen}>
      <div className={styles.shell}>
        <div className={styles.brand}>
          <p className={styles.eyebrow}>Protected admin</p>
          <h1>Admin sign in</h1>
          <p className={styles.brandText}>
            Sign in to manage the owner workspace.
          </p>
        </div>

        <section className={styles.card} aria-label="Admin sign in">
          <LoginStatus state={state} />

          <form className={styles.form} method="post">
            <label className={styles.field}>
              Email
              <input
                autoComplete="email"
                className={styles.input}
                name="email"
                required
                type="email"
              />
            </label>
            <label className={styles.field}>
              Password
              <input
                autoComplete="current-password"
                className={styles.input}
                name="password"
                required
                type="password"
              />
            </label>
            <button
              className={styles.submit}
              formAction="/api/admin/login"
              type="submit"
            >
              Sign in
            </button>
          </form>
        </section>

        <div className={styles.footerActions}>
          <a className={styles.publicLink} href="/">
            View public site
          </a>
        </div>
      </div>
    </main>
  );
}
