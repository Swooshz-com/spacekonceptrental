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
            <button
              className={styles.submit}
              formAction="/api/admin/login"
              type="submit"
            >
              Continue with Google
            </button>
            <p className={styles.helpText}>
              Use the Google email that has been added to admin access.
            </p>
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
