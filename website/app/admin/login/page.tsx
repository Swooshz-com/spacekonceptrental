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
      <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', color: '#ef4444', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }} role="status">
        Admin access is temporarily unavailable.
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div style={{ padding: '16px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: 'var(--radius-md)', color: '#eab308', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }} role="status">
        Sign in to continue.
      </div>
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
    <section className="premium-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <div className="premium-form-card" style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Secure admin</p>
          <h1 className="premium-title-section" style={{ fontSize: '28px', margin: 0 }}>Sign in to Admin</h1>
        </div>
        
        <LoginStatus state={state} />
        
        <form method="post" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            Email
            <input
              autoComplete="email"
              name="email"
              required
              type="email"
              className="premium-input"
              style={{ width: '100%', height: '48px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            Password
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
              className="premium-input"
              style={{ width: '100%', height: '48px' }}
            />
          </label>
          <button className="premium-button premium-button--primary" formAction="/api/admin/login" type="submit" style={{ width: '100%', height: '48px', marginTop: '12px' }}>
            Sign in
          </button>
        </form>
      </div>
    </section>
  );
}
