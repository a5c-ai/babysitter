'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem', background: 'var(--bg-input, transparent)', color: 'var(--text)' };
const btnPrimary = { border: 'none', padding: '0.375rem 0.875rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, background: 'var(--color-accent, #3b82f6)', color: '#fff' };
const btnSecondary = { border: '1px solid var(--border)', background: 'transparent', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' };
const cardStyle = { padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-card, var(--bg-subtle))' };
const pillStyle = (tone) => ({ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: tone === 'good' ? 'rgba(34,197,94,0.12)' : tone === 'warn' ? 'rgba(234,179,8,0.12)' : tone === 'danger' ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)', color: tone === 'good' ? '#16a34a' : tone === 'warn' ? '#ca8a04' : tone === 'danger' ? '#dc2626' : '#6b7280' });

const RULE_TYPE_FIELDS = {
  'content-filter': [
    { name: 'blockedPatterns', label: 'Blocked patterns (one per line)', type: 'textarea', placeholder: 'Enter regex patterns to block...' },
    { name: 'categories', label: 'Content categories', placeholder: 'hate, violence, sexual, self-harm' }
  ],
  'budget-limit': [
    { name: 'maxCostPerRun', label: 'Max cost per run ($)', type: 'number', placeholder: '10.00' },
    { name: 'maxCostPerDay', label: 'Max cost per day ($)', type: 'number', placeholder: '100.00' }
  ],
  'token-limit': [
    { name: 'maxInputTokens', label: 'Max input tokens', type: 'number', placeholder: '100000' },
    { name: 'maxOutputTokens', label: 'Max output tokens', type: 'number', placeholder: '50000' },
    { name: 'maxTotalTokens', label: 'Max total tokens per session', type: 'number', placeholder: '500000' }
  ],
  'pii-detection': [
    { name: 'piiTypes', label: 'PII types to detect', placeholder: 'email, phone, ssn, credit-card, address' },
    { name: 'redactOutput', label: 'Redact in output', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] }
  ],
  'tool-restriction': [
    { name: 'blockedTools', label: 'Blocked tools (comma-separated)', placeholder: 'shell, filesystem_write, network' },
    { name: 'allowedTools', label: 'Allowed tools (leave empty for all)', placeholder: '', required: false }
  ]
};

export function GuardrailRuleEditor({ org, guardrail = null, onSaved }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (!guardrail) {
    return <div style={{ ...cardStyle, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No guardrail selected.</div>;
  }

  const ruleType = guardrail.spec?.ruleType || 'content-filter';
  const typeFields = RULE_TYPE_FIELDS[ruleType] || [];

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const fd = new FormData(e.currentTarget);
      const conditions = {};
      for (const field of typeFields) {
        const val = fd.get(field.name);
        if (val) {
          if (field.type === 'number') conditions[field.name] = Number(val);
          else if (field.type === 'textarea') conditions[field.name] = val.split('\n').map((s) => s.trim()).filter(Boolean);
          else conditions[field.name] = val.includes(',') ? val.split(',').map((s) => s.trim()).filter(Boolean) : val;
        }
      }

      const updated = {
        ...guardrail,
        spec: {
          ...guardrail.spec,
          displayName: fd.get('displayName') || guardrail.spec?.displayName,
          action: fd.get('action') || guardrail.spec?.action,
          scope: fd.get('scope') || guardrail.spec?.scope,
          enabled: fd.get('enabled') === 'true',
          conditions
        }
      };

      const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setMessage('Guardrail saved');
        if (onSaved) onSaved(body?.resource || updated);
        setTimeout(() => router.refresh(), 1200);
      } else {
        setMessage(body.message || body.error || 'Save failed');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Rule configuration</h3>
        <span style={pillStyle(guardrail.spec?.enabled !== false ? 'good' : 'neutral')}>
          {guardrail.spec?.enabled !== false ? 'enabled' : 'disabled'}
        </span>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Display name</span>
        <input name="displayName" type="text" defaultValue={guardrail.spec?.displayName || ''} style={inputStyle} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Action</span>
          <select name="action" defaultValue={guardrail.spec?.action || 'block'} style={inputStyle}>
            <option value="block">Block</option>
            <option value="warn">Warn</option>
            <option value="log">Log only</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Scope</span>
          <select name="scope" defaultValue={guardrail.spec?.scope || 'global'} style={inputStyle}>
            <option value="global">Global</option>
            <option value="stack">Per-stack</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Enabled</span>
          <select name="enabled" defaultValue={String(guardrail.spec?.enabled !== false)} style={inputStyle}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Conditions ({ruleType})</h4>

      {typeFields.map((field) => (
        <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{field.label}</span>
          {field.type === 'textarea' ? (
            <textarea name={field.name} rows={3} placeholder={field.placeholder || ''} defaultValue={Array.isArray(guardrail.spec?.conditions?.[field.name]) ? guardrail.spec.conditions[field.name].join('\n') : (guardrail.spec?.conditions?.[field.name] || '')} style={{ ...inputStyle, resize: 'vertical' }} />
          ) : field.type === 'select' ? (
            <select name={field.name} defaultValue={guardrail.spec?.conditions?.[field.name] || field.options?.[0]?.value} style={inputStyle}>
              {(field.options || []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ) : (
            <input name={field.name} type={field.type || 'text'} placeholder={field.placeholder || ''} defaultValue={Array.isArray(guardrail.spec?.conditions?.[field.name]) ? guardrail.spec.conditions[field.name].join(', ') : (guardrail.spec?.conditions?.[field.name] || '')} style={inputStyle} />
          )}
        </label>
      ))}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button type="submit" disabled={busy} style={btnPrimary}>{busy ? 'Saving...' : 'Save changes'}</button>
      </div>

      {message && <p style={{ margin: 0, fontSize: '0.75rem', color: message === 'Guardrail saved' ? 'var(--color-good, #22c55e)' : 'var(--color-danger, #cb2431)' }}>{message}</p>}
    </form>
  );
}
