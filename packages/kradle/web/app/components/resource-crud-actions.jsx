'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './shell/confirm-dialog.jsx';

/**
 * ResourceActions — terminate / archive / delete buttons for any resource.
 *
 * Props:
 *   org        {string}   — organization slug
 *   apiPath    {string}   — e.g. "agents/sessions/my-session"
 *   actions    {string[]} — subset of ['terminate','archive','delete']
 *   onMutated  {fn}       — called with (action, resourceName) after success
 */
export function ResourceActions({ org, apiPath, actions = [], onMutated }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(null);

  async function execute(action) {
    setBusy(true);
    setMessage('');
    try {
      let response;
      if (action === 'delete') {
        response = await fetch(`/api/orgs/${encodeURIComponent(org)}/${apiPath}`, { method: 'DELETE' });
      } else {
        // terminate / archive → PATCH status
        const newPhase = action === 'terminate' ? 'Terminated' : action === 'revoke' ? 'Revoked' : 'Archived';
        response = await fetch(`/api/orgs/${encodeURIComponent(org)}/${apiPath}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: { phase: newPhase } })
        });
      }
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setDone(action);
        if (onMutated) onMutated(action, apiPath);
        if (action === 'delete') setTimeout(() => router.refresh(), 800);
      } else {
        setMessage(body.message || body.error || `${action} failed`);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  }

  if (done) {
    const labels = { terminate: 'Terminated', archive: 'Archived', delete: 'Deleted', revoke: 'Revoked' };
    return <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{labels[done] || done}</span>;
  }

  const buttonStyle = (variant) => {
    const base = { border: 'none', padding: '0.25rem 0.625rem', borderRadius: '4px', cursor: busy ? 'wait' : 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: busy ? 0.6 : 1 };
    if (variant === 'terminate' || variant === 'revoke') return { ...base, background: 'var(--color-warn, #d97706)', color: '#fff' };
    if (variant === 'archive') return { ...base, background: 'var(--color-neutral, #6b7280)', color: '#fff' };
    if (variant === 'delete') return { ...base, background: 'transparent', border: '1px solid var(--color-danger, #cb2431)', color: 'var(--color-danger, #cb2431)' };
    return base;
  };

  const actionLabel = { terminate: 'Terminate', archive: 'Archive', delete: 'Delete', revoke: 'Revoke' };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          disabled={busy}
          onClick={() => setConfirmAction(action)}
          style={buttonStyle(action)}
        >
          {busy && confirmAction === action ? 'Working...' : (actionLabel[action] || action)}
        </button>
      ))}
      {message ? <small style={{ color: 'var(--color-danger, #cb2431)', fontSize: '0.75rem' }}>{message}</small> : null}
      <ConfirmDialog
        open={!!confirmAction}
        title={`${actionLabel[confirmAction] || confirmAction || ''} resource`}
        message={`Are you sure you want to ${confirmAction || 'perform this action on'} this resource?`}
        confirmLabel={actionLabel[confirmAction] || confirmAction || 'Confirm'}
        cancelLabel="Cancel"
        danger={confirmAction === 'delete' || confirmAction === 'terminate'}
        onConfirm={() => execute(confirmAction)}
        onCancel={() => setConfirmAction(null)}
      />
    </span>
  );
}


/**
 * InlineCreateForm — generic form that POSTs a resource to /api/orgs/{org}/resources.
 *
 * Props:
 *   org         {string}  — organization slug
 *   namespace   {string}  — resource namespace
 *   kind        {string}  — resource kind e.g. "KrateProject"
 *   apiVersion  {string}  — default "krate.a5c.ai/v1alpha1"
 *   title       {string}  — card heading
 *   fields      {Array}   — [{ name, label, type?, placeholder?, required?, defaultValue?, options? }]
 *                           type: 'text'|'url'|'email'|'select'  options: [{value,label}]
 *   buildSpec   {fn}      — (formData) => spec object
 *   successText {fn|str}  — (body) => string, or fixed string
 */
export function InlineCreateForm({ org, namespace = 'krate-system', kind, apiVersion = 'krate.a5c.ai/v1alpha1', title, fields = [], successText, buildSpec }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget || e.target;
    const formData = new FormData(formEl);

    // Client-side validation
    const errors = {};
    for (const field of fields) {
      if (field.required !== false) {
        const val = formData.get(field.name);
        if (!val || !String(val).trim()) {
          errors[field.name] = `${field.label || field.name} is required`;
        }
      }
    }
    setSubmitted(true);
    setInvalidFields(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    setMessage('');
    setIsSuccess(false);
    try {
      const name = slugify(formData.get('name') || formData.get(fields[0]?.name) || kind.toLowerCase());
      let spec = {};
      if (typeof buildSpec === 'function') {
        spec = buildSpec(formData);
      } else {
        for (const field of fields) {
          if (field.name === 'name') continue;
          const value = formData.get(field.name);
          if (value) spec[field.name] = field.name === 'workflow' || field.name === 'workflowColumns'
            ? String(value).split(',').map(c => c.trim()).filter(Boolean)
            : value;
        }
      }
      const resource = {
        apiVersion,
        kind,
        metadata: { name, namespace },
        spec: { organizationRef: org, ...spec },
        status: {}
      };
      const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resource)
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setIsSuccess(true);
        const msg = typeof successText === 'function'
          ? successText(body)
          : successText || `Created ${kind}/${body.resource?.metadata?.name || name}`;
        setMessage(msg);
        setSubmitted(false);
        setInvalidFields({});
        formEl.reset();
        setTimeout(() => router.refresh(), 1200);
      } else {
        setMessage(body.message || body.error || 'Create failed');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  const inputBorderStyle = (fieldName) => {
    if (submitted && invalidFields[fieldName]) {
      return { border: '1.5px solid var(--color-danger, #cb2431)' };
    }
    return {};
  };

  return (
    <div className="card managementCard">
      <div className="cardTitle"><h3>{title || `Create ${kind}`}</h3><span className="pill neutral">inline</span></div>
      <form onSubmit={handleSubmit} className="formGrid" noValidate>
        {fields.map((field, fieldIndex) => (
          <label key={field.name}>
            <span>
              {field.label || field.name}
              {field.required !== false && <span aria-hidden="true" style={{ color: 'var(--color-danger, #cb2431)', marginLeft: '0.2rem' }}>*</span>}
            </span>
            {field.type === 'select' ? (
              <select name={field.name} defaultValue={field.defaultValue || ''} style={inputBorderStyle(field.name)}>
                {(field.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label || opt.value}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                name={field.name}
                placeholder={field.placeholder || ''}
                defaultValue={field.defaultValue || ''}
                required={field.required !== false}
                rows={3}
                style={{ ...inputBorderStyle(field.name), resize: 'vertical' }}
              />
            ) : (
              <input
                name={field.name}
                type={field.type || 'text'}
                placeholder={field.placeholder || ''}
                defaultValue={field.defaultValue || ''}
                required={field.required !== false}
                autoFocus={fieldIndex === 0}
                aria-required={field.required !== false}
                aria-invalid={submitted && !!invalidFields[field.name]}
                style={inputBorderStyle(field.name)}
              />
            )}
            {submitted && invalidFields[field.name] && (
              <span role="alert" style={{ color: 'var(--color-danger, #cb2431)', fontSize: '0.75rem', marginTop: '0.125rem', display: 'block' }}>
                {invalidFields[field.name]}
              </span>
            )}
          </label>
        ))}
        <button type="submit" disabled={busy} style={{ marginTop: '0.25rem' }}>
          {busy ? 'Saving...' : `Create ${kind}`}
        </button>
      </form>
      {message ? (
        <p role="status" className="mutationStatus" style={{ color: isSuccess ? 'var(--color-good, #22c55e)' : 'var(--color-danger, #cb2431)' }}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

function buildDefaultSpec(formData, fields, org) {
  const spec = {};
  for (const field of fields) {
    const val = formData.get(field.name);
    if (val !== null && val !== '') spec[field.name] = val;
  }
  return spec;
}

function slugify(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63) || 'resource';
}
