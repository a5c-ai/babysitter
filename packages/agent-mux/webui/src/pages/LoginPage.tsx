import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v6';
import { Button, Field, Input } from '@a5c-ai/compendium';

import { useGatewayAuth } from '../providers/GatewayProvider.js';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useGatewayAuth();
  const [gatewayUrl, setGatewayUrl] = useState(() => `${window.location.protocol}//${window.location.host}`);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      <section className="login-card">
        <p className="eyebrow">agent-mux webui</p>
        <h1>Attach to your gateway</h1>
        <p className="lede">The token is stored in `localStorage.amux.webui.auth`. That is convenient and less secure than an OS keychain.</p>
        <form onSubmit={handleSubmit} className="stack">
          <Field label="Gateway URL">
            <Input
              value={gatewayUrl}
              onChange={(event) => setGatewayUrl(event.target.value)}
              placeholder="http://127.0.0.1:7878"
            />
          </Field>
          <Field label="Bearer token">
            <Input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="paste token"
            />
          </Field>
          {error ? <p className="error-banner">{error}</p> : null}
          <Button type="submit" variant="primary" loading={submitting} disabled={submitting || !token.trim()}>
            Connect
          </Button>
        </form>
      </section>
    </main>
  );
}
