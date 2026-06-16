'use client';

import { useState } from 'react';
import { statusTone } from '../lib/status-tones.js';

const WEBHOOK_EVENT_TYPES = ['push', 'pull_request', 'issues', 'workflow_run', 'ping'];
const PROVIDERS = ['GitHub', 'Gitea', 'Generic'];

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, background: 'var(--surface)' };
const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const buttonStyle = { padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const primaryStyle = { ...buttonStyle, backgroundColor: 'var(--accent)', color: '#fff' };
const ghostStyle = { ...buttonStyle, backgroundColor: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' };
const smallGhostStyle = { ...buttonStyle, padding: '4px 10px', fontSize: 12, backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' };

function Badge({ children, tone = 'neutral' }) {
  const colors = {
    good: { background: 'var(--surface-raised)', color: 'var(--success)' },
    warn: { background: 'var(--surface-raised)', color: 'var(--warning)' },
    bad: { background: 'var(--surface-raised)', color: 'var(--danger)' },
    danger: { background: 'var(--surface-raised)', color: 'var(--danger)' },
    neutral: { background: 'var(--bg-subtle)', color: 'var(--text-muted)' },
    info: { background: 'var(--surface-raised)', color: 'var(--accent)' },
  };
  const { background, color } = colors[tone] || colors.neutral;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background, color }}>
      {children}
    </span>
  );
}

function CopyableUrl({ url }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 6, padding: '6px 10px', border: '1px solid var(--border)', fontSize: 12, fontFamily: 'monospace' }}>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
      <button onClick={copy} style={{ ...smallGhostStyle, flexShrink: 0 }}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
  );
}

function WebhookRow({ webhook, org, onPingResult, onDeleted }) {
  const [pinging, setPinging] = useState(false);
  const [pingMsg, setPingMsg] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const spec = webhook.spec || {};
  const events = spec.events || [];
  const ingestUrl = `/api/orgs/${encodeURIComponent(org)}/webhooks/ingest`;

  async function sendPing() {
    setPinging(true);
    setPingMsg('');
    try {
      const res = await fetch(ingestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': `test-${Date.now()}`,
        },
        body: JSON.stringify({ zen: 'Test ping from Kradle', hook_id: 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        setPingMsg('Ping sent successfully');
        if (onPingResult) onPingResult({ ok: true, data });
      } else {
        setPingMsg(`Error: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setPingMsg(`Network error: ${err.message}`);
    } finally {
      setPinging(false);
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.875rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{webhook.metadata?.name || 'unnamed'}</div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          <Badge tone={spec.enabled !== false ? 'good' : 'neutral'}>{spec.enabled !== false ? 'enabled' : 'disabled'}</Badge>
          {spec.provider && <Badge tone="info">{spec.provider}</Badge>}
          <Badge tone={spec.secret ? 'good' : 'warn'}>{spec.secret ? 'Secret configured' : 'No secret'}</Badge>
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>INGEST URL</div>
        <CopyableUrl url={ingestUrl} />
      </div>

      {events.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>EVENT TYPES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {events.map(ev => <Badge key={ev} tone="neutral">{ev}</Badge>)}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button onClick={sendPing} disabled={pinging} style={{ ...ghostStyle, opacity: pinging ? 0.6 : 1 }} aria-label={`Send test ping to webhook ${webhook.metadata?.name || 'unnamed'}`}>
          {pinging ? 'Sending...' : 'Send Test Ping'}
        </button>
        {confirmDelete ? (
          <>
            <button onClick={async () => {
              setConfirmDelete(false);
              setDeleting(true);
              try {
                const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/ExternalWebhookConfig/${encodeURIComponent(webhook.metadata?.name)}`, { method: 'DELETE' });
                if (res.ok) { if (onDeleted) onDeleted(webhook.metadata?.name); }
              } catch (err) { setPingMsg(`Delete failed: ${err.message || 'unknown error'}`); } finally { setDeleting(false); }
            }} style={{ ...smallGhostStyle, color: '#fff', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} aria-label={`Confirm delete webhook ${webhook.metadata?.name || 'unnamed'}`}>
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} style={smallGhostStyle} aria-label="Cancel delete">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)} disabled={deleting} style={{ ...smallGhostStyle, color: 'var(--danger)', borderColor: 'var(--danger)', opacity: deleting ? 0.6 : 1 }} aria-label={`Delete webhook ${webhook.metadata?.name || 'unnamed'}`}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
        {pingMsg && (
          <span style={{ fontSize: 12, color: pingMsg.startsWith('Ping sent') ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
            {pingMsg}
          </span>
        )}
      </div>
    </div>
  );
}

function AddWebhookForm({ org, onCreated }) {
  const [name, setName] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([...WEBHOOK_EVENT_TYPES]);
  const [provider, setProvider] = useState('GitHub');
  const [secret, setSecret] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  function toggleEvent(ev) {
    setSelectedEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('saving');
    setMessage('');

    const resource = {
      apiVersion: 'kradle.a5c.ai/v1alpha1',
      kind: 'ExternalWebhookConfig',
      metadata: { name: name.trim() },
      spec: {
        provider: provider.toLowerCase(),
        events: selectedEvents,
        enabled,
        ...(secret.trim() ? { secret: secret.trim() } : {}),
      },
    };

    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatus('error');
        setMessage(data.message || data.reason || 'Failed to create webhook');
      } else {
        setStatus('success');
        setMessage(`Webhook "${name}" created.`);
        setName('');
        setSecret('');
        if (onCreated) onCreated(data);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  const canSubmit = name.trim() && status !== 'saving';

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', background: 'var(--surface-raised)', marginTop: '0.75rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--accent)' }}>Add Webhook</div>
        <div style={fieldGroupStyle}>
          <div>
            <label style={labelStyle}>Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-github-webhook"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Provider</label>
            <select value={provider} onChange={e => setProvider(e.target.value)} style={selectStyle}>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Event Types</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {WEBHOOK_EVENT_TYPES.map(ev => (
                <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedEvents.includes(ev)} onChange={() => toggleEvent(ev)} />
                  {ev}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Secret <small style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — used for HMAC verification)</small></label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="webhook-secret"
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="webhook-enabled"
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
            />
            <label htmlFor="webhook-enabled" style={{ fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Enabled</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.25rem' }}>
            <button type="submit" disabled={!canSubmit} style={{ ...primaryStyle, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }} aria-label="Create webhook">
              {status === 'saving' ? 'Creating...' : 'Create Webhook'}
            </button>
            {status === 'success' && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{message}</span>}
            {status === 'error' && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{message}</span>}
          </div>
        </div>
      </div>
    </form>
  );
}

function DeliveryHistoryList({ deliveries = [] }) {
  const recent = deliveries.slice(0, 10);

  function truncateId(id) {
    if (!id) return '—';
    return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
        Recent Deliveries (last 10)
      </div>
      {recent.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>No delivery history yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {recent.map((d, i) => {
            const id = d.deliveryId || d.metadata?.name || `delivery-${i}`;
            const evType = d.eventType || d.spec?.eventType || d.status?.eventType || '—';
            const ts = d.timestamp || d.metadata?.creationTimestamp || '';
            const st = d.status || d.status?.phase || 'received';
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <code style={{ flex: '0 0 auto', color: 'var(--text-muted)' }}>{truncateId(id)}</code>
                <Badge tone="neutral">{evType}</Badge>
                <span style={{ color: 'var(--text-muted)', flex: 1, fontSize: 11 }}>{ts ? new Date(ts).toLocaleString() : ''}</span>
                <Badge tone={statusTone(typeof st === 'string' ? st : 'received')}>{typeof st === 'string' ? st : 'received'}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * WebhookManager — manages inbound webhook configurations.
 *
 * @param {{ org: string, webhooks?: object[] }} props
 */
export function WebhookManager({ org, webhooks = [] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [localWebhooks, setLocalWebhooks] = useState(webhooks);

  // Collect all deliveries across webhook resources
  const allDeliveries = localWebhooks.flatMap(wh => wh.deliveries || wh.status?.deliveries || []);

  function handleCreated(newResource) {
    if (newResource && newResource.metadata) {
      setLocalWebhooks(prev => [...prev, newResource]);
    }
    setShowAddForm(false);
  }

  return (
    <div className="card">
      <div className="cardTitle">
        <h3>Webhook Management</h3>
        <button onClick={() => setShowAddForm(v => !v)} style={ghostStyle} aria-label={showAddForm ? 'Cancel adding webhook' : 'Add new webhook'}>
          {showAddForm ? 'Cancel' : 'Add Webhook'}
        </button>
      </div>

      {/* Configured webhooks */}
      {localWebhooks.length === 0 && !showAddForm ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '0.5rem 0' }}>
          No webhooks configured yet.{' '}
          <button onClick={() => setShowAddForm(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, padding: 0 }}>
            Add one
          </button>{' '}
          to receive events from GitHub or Gitea.
        </div>
      ) : (
        localWebhooks.map(wh => (
          <WebhookRow key={wh.metadata?.name || Math.random()} webhook={wh} org={org} onDeleted={(name) => setLocalWebhooks(prev => prev.filter(w => w.metadata?.name !== name))} />
        ))
      )}

      {/* Add Webhook Form */}
      {showAddForm && (
        <AddWebhookForm org={org} onCreated={handleCreated} />
      )}

      {/* Delivery History */}
      <DeliveryHistoryList deliveries={allDeliveries} />
    </div>
  );
}
