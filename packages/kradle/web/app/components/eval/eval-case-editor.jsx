'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem', background: 'var(--bg-input, transparent)', color: 'var(--text)' };
const btnPrimary = { border: 'none', padding: '0.375rem 0.875rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, background: 'var(--color-accent, #3b82f6)', color: '#fff' };
const btnSecondary = { border: '1px solid var(--border)', background: 'transparent', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' };
const cardStyle = { padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-card, var(--bg-subtle))' };

export function EvalCaseEditor({ org, suiteRef, cases: initialCases = [], onCaseCreated }) {
  const router = useRouter();
  const [cases, setCases] = useState(initialCases);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const fd = new FormData(e.currentTarget);
    try {
      const name = `${suiteRef}-case-${Date.now()}`;
      const resource = {
        apiVersion: 'kradle.a5c.ai/v1alpha1',
        kind: 'EvalCase',
        metadata: { name, namespace: 'kradle-system' },
        spec: {
          organizationRef: org,
          suiteRef,
          input: fd.get('input'),
          expectedOutput: fd.get('expectedOutput') || '',
          rubric: fd.get('rubric') || '',
          tags: (fd.get('tags') || '').split(',').map((s) => s.trim()).filter(Boolean)
        },
        status: {}
      };
      const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resource)
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        const item = body?.resource || body;
        setCases((prev) => [...prev, item]);
        setShowForm(false);
        setMessage('');
        if (onCaseCreated) onCaseCreated(item);
        e.currentTarget.reset();
      } else {
        setMessage(body.message || body.error || 'Failed to create test case');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Test cases ({cases.length})</h3>
        <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add case'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Input prompt <span style={{ color: 'var(--color-danger, #cb2431)' }}>*</span></span>
            <textarea name="input" rows={3} required placeholder="Enter the test prompt..." style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Expected output</span>
            <textarea name="expectedOutput" rows={2} placeholder="Expected response (optional)" style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Scoring rubric</span>
            <textarea name="rubric" rows={2} placeholder="How should this case be scored?" style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Tags</span>
            <input name="tags" type="text" placeholder="safety, accuracy, edge-case" style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={busy} style={btnPrimary}>{busy ? 'Creating...' : 'Create case'}</button>
            <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
          </div>
          {message && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-danger, #cb2431)' }}>{message}</p>}
        </form>
      )}

      {cases.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No test cases yet. Add cases with input prompts and expected outputs.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {cases.map((c, i) => (
            <div key={c.metadata?.name || i} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.metadata?.name || `case-${i}`}</code>
                {c.spec?.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {c.spec.tags.map((tag) => (
                      <span key={tag} style={{ padding: '0.0625rem 0.375rem', borderRadius: '9999px', fontSize: '0.625rem', background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.8125rem', fontWeight: 500 }}>Input:</p>
              <pre style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{c.spec?.input || ''}</pre>
              {c.spec?.expectedOutput && (
                <>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>Expected:</p>
                  <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>{c.spec.expectedOutput}</pre>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
