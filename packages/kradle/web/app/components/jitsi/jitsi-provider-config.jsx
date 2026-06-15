'use client';

import { useState } from 'react';

export function JitsiProviderConfig({ org = 'default', provider = {} }) {
  const [status, setStatus] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('Saving provider...');
    const form = new FormData(event.currentTarget);
    const body = {
      name: provider.metadata?.name || form.get('name') || form.get('endpoint'),
      endpoint: form.get('endpoint'),
      authMode: form.get('authMode'),
    };
    const method = provider.metadata?.name ? 'PATCH' : 'POST';
    const path = provider.metadata?.name ? `/api/orgs/${org}/jitsi/providers/${provider.metadata.name}` : `/api/orgs/${org}/jitsi/providers`;
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    setStatus(response.ok ? 'Provider saved' : (payload.message || payload.error || 'Could not save provider'));
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="cardTitle"><h3>Provider</h3></div>
      <label>
        Name
        <input name="name" defaultValue={provider.metadata?.name || ''} aria-label="Jitsi provider name" />
      </label>
      <label>
        Endpoint
        <input name="endpoint" defaultValue={provider.spec?.endpoint || ''} aria-label="Jitsi endpoint" />
      </label>
      <label>
        Auth mode
        <select name="authMode" defaultValue={provider.spec?.authMode || 'jwt'} aria-label="Jitsi auth mode">
          <option value="jwt">JWT</option>
          <option value="anonymous">Anonymous</option>
          <option value="ldap">LDAP</option>
        </select>
      </label>
      <button type="submit">Save provider</button>
      {status ? <p className="muted" role="status">{status}</p> : null}
    </form>
  );
}
