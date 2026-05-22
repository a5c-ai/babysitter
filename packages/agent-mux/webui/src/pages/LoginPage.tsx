import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v6';

import { readPersistedAuthError, useGatewayAuth } from '../providers/GatewayProvider.js';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, isAuthenticated, isReady, login } = useGatewayAuth();
  const [gatewayUrl, setGatewayUrl] = useState(() => `${window.location.protocol}//${window.location.host}`);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(() => readPersistedAuthError());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (!auth) {
        setError(readPersistedAuthError());
      }
      return;
    }

    navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true });
  }, [auth, isAuthenticated, location.state, navigate]);

  if (auth && !isReady) {
    return (
      <main className="login-page">
        <section className="login-card auth-card">
          <p className="eyebrow">agent-mux webui</p>
          <h1>Checking saved gateway access</h1>
          <p className="lede auth-note">
            Revalidating the stored gateway token before reconnecting this browser to the gateway.
          </p>
        </section>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ gatewayUrl, token });
      navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card auth-card">
        <p className="eyebrow">agent-mux webui</p>
        <h1>Attach to your gateway</h1>
        <p className="lede auth-note">
          The token is stored in <code>localStorage.amux.webui.auth</code>. That is convenient and
          less secure than an OS keychain.
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Gateway URL</span>
            <input
              className="auth-input"
              value={gatewayUrl}
              onChange={(event) => setGatewayUrl(event.target.value)}
              placeholder="http://127.0.0.1:7878"
            />
          </label>
          <label className="auth-field">
            <span>Bearer token</span>
            <input
              className="auth-input"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="paste token"
            />
          </label>
          {error ? <p className="error-banner">{error}</p> : null}
          <button type="submit" className="auth-submit" disabled={submitting || !token.trim()}>
            {submitting ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </section>
    </main>
  );
}
