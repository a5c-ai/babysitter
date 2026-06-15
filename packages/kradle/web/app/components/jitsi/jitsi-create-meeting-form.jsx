'use client';

import { useState } from 'react';

export function JitsiCreateMeetingForm({ org = 'default', templates = [] }) {
  const [status, setStatus] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('Creating meeting...');
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/orgs/${org}/jitsi/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: form.get('displayName'),
        templateRef: form.get('templateRef') || undefined,
        ttlMinutes: Number(form.get('ttlMinutes') || 120),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload.message || payload.error || 'Could not create meeting');
      return;
    }
    const name = payload.resource?.metadata?.name || payload.metadata?.name;
    window.location.href = name ? `/orgs/${org}/meetings/${name}` : `/orgs/${org}/meetings`;
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="cardTitle"><h3>New meeting</h3></div>
      <label>
        Display name
        <input name="displayName" aria-label="Meeting display name" />
      </label>
      <label>
        Template
        <select name="templateRef" aria-label="Meeting template">
          <option value="">Ad hoc</option>
          {templates.map((template) => <option key={template.metadata?.name} value={template.metadata?.name}>{template.spec?.displayName || template.metadata?.name}</option>)}
        </select>
      </label>
      <label>
        TTL minutes
        <input name="ttlMinutes" type="number" min="1" max="1440" defaultValue="120" aria-label="Meeting TTL minutes" />
      </label>
      <button type="submit">Create meeting</button>
      {status ? <p className="muted" role="status">{status}</p> : null}
    </form>
  );
}
