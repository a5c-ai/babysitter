'use client';

import { useState } from 'react';

export function JitsiTemplateForm({ org = 'default', template = {} }) {
  const [status, setStatus] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('Saving template...');
    const form = new FormData(event.currentTarget);
    const body = {
      name: template.metadata?.name || form.get('displayName'),
      displayName: form.get('displayName'),
      roomNameTemplate: form.get('roomNameTemplate'),
      ttlMinutes: Number(form.get('ttlMinutes') || template.spec?.ttlMinutes || 60),
    };
    const method = template.metadata?.name ? 'PATCH' : 'POST';
    const path = template.metadata?.name ? `/api/orgs/${org}/jitsi/templates/${template.metadata.name}` : `/api/orgs/${org}/jitsi/templates`;
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    setStatus(response.ok ? 'Template saved' : (payload.message || payload.error || 'Could not save template'));
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="cardTitle"><h3>Meeting template</h3></div>
      <label>
        Display name
        <input name="displayName" defaultValue={template.spec?.displayName || ''} aria-label="Template display name" />
      </label>
      <label>
        Room name template
        <input name="roomNameTemplate" defaultValue={template.spec?.roomNameTemplate || ''} aria-label="Room name template" />
      </label>
      <label>
        TTL minutes
        <input name="ttlMinutes" type="number" min="1" max="1440" defaultValue={template.spec?.ttlMinutes || 60} aria-label="Template TTL minutes" />
      </label>
      <button type="submit">Save template</button>
      {status ? <p className="muted" role="status">{status}</p> : null}
    </form>
  );
}
