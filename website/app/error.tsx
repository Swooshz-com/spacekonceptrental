"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service securely
    console.error("Application error:", error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--surface)' }}>
      <div className="premium-card premium-card--tall" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', alignItems: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h1 className="premium-title-card" style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '32px', lineHeight: 1.6 }}>
          We've encountered an unexpected issue while loading this page. Our team has been notified.
        </p>
        {error.digest && (
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '32px', padding: '8px', background: '#f1f5f9', borderRadius: '4px' }}>
            Reference: {error.digest}
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%' }}>
          <button
            onClick={() => reset()}
            className="premium-button premium-button--secondary"
            style={{ flex: 1 }}
          >
            Try again
          </button>
          <Link href="/" className="premium-button premium-button--primary" style={{ flex: 1 }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
