'use client';

import { useState, useEffect } from 'react';

const ROLE_OPTIONS = ['cluster-admin', 'edit', 'view', 'custom'];

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, background: '#fff' };
const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' };
const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
const secondaryStyle = { ...buttonStyle, backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
const disabledStyle = { ...primaryStyle, opacity: 0.5, cursor: 'not-allowed' };

function StatusMsg({ status, message }) {
  if (!message) return null;
  const color = status === 'success' ? '#16a34a' : '#dc2626';
  return <span style={{ fontSize: 13, color, fontWeight: 600 }}>{message}</span>;
}

function ServiceAccountRow({ org, sa, onDeleted }) {
  const name = sa.metadata?.name;
  const roleRef = sa.spec?.roleRef || 'edit';
  const ns = sa.spec?.namespace || `krate-org-${org}`;
  const [delStatus, setDelStatus] = useState('idle');

  async function handleDelete() {
    if (!confirm(`Delete service account "${name}" and its role binding?`)) return;
    setDelStatus('deleting');
    try {
      const rbName = `${name}-binding`;
      fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentRoleBinding/${encodeURIComponent(rbName)}`, {
        method: 'DELETE',
      }).catch(() => {});
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/AgentServiceAccount/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted(name);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete service account');
        setDelStatus('idle');
      }
    } catch (err) {
      alert(err.message || 'Network error');
      setDelStatus('idle');
    }
  }

  return (
    <div className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <strong style={{ flex: '1 1 auto' }}>{name}</strong>
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{roleRef}</span>
      <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>{ns}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
        <span style={{
          display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
          backgroundColor: sa.status?.phase === 'Active' ? '#22c55e' : '#9ca3af',
        }} />
        {sa.status?.phase || 'Pending'}
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={delStatus === 'deleting'}
        style={{ ...secondaryStyle, padding: '4px 12px', fontSize: 12, color: '#dc2626', borderColor: '#fca5a5' }}
      >
        {delStatus === 'deleting' ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}

function AddServiceAccountForm({ org, onCreated }) {
  const [name, setName] = useState('');
  const [roleRef, setRoleRef] = useState('edit');
  const [customRole, setCustomRole] = useState('');
  const [namespace, setNamespace] = useState(`krate-org-${org}`);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('saving');
    setMessage('');

    const effectiveRole = roleRef === 'custom' ? customRole.trim() : roleRef;
    if (!effectiveRole) {
      setStatus('error');
      setMessage('Custom role name is required');
      return;
    }

    const saResource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentServiceAccount',
      metadata: { name: name.trim() },
      spec: {
        organizationRef: org,
        namespace: namespace.trim() || `krate-org-${org}`,
        serviceAccountName: name.trim(),
      },
    };

    const roleBindingResource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentRoleBinding',
      metadata: { name: `${name.trim()}-binding` },
      spec: {
        organizationRef: org,
        subject: name.trim(),
        roleRef: effectiveRole,
        scope: namespace.trim() || `krate-org-${org}`,
        namespace: namespace.trim() || `krate-org-${org}`,
      },
    };

    try {
      // Create the service account first
      const saRes = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saResource),
      });
      const saData = await saRes.json();
      if (!saRes.ok || saData.error) {
        setStatus('error');
        setMessage(saData.message || saData.reason || 'Failed to create service account');
        return;
      }

      // Then create the role binding
      const rbRes = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleBindingResource),
      });
      const rbData = await rbRes.json();
      if (!rbRes.ok || rbData.error) {
        setStatus('error');
        setMessage(rbData.message || rbData.reason || 'Service account created but role binding failed');
        return;
      }

      setStatus('success');
      setMessage(`Service account "${name.trim()}" created with role "${effectiveRole}".`);
      setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
      onCreated({ ...saData, spec: { ...saData.spec, roleRef: effectiveRole } });
      setName('');
      setRoleRef('edit');
      setCustomRole('');
      setNamespace(`krate-org-${org}`);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Network error');
    }
  }

  const canSubmit = name.trim() && status !== 'saving';

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', marginTop: '0.75rem' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700 }}>New service account + role binding</h4>
        <div style={fieldGroupStyle}>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>ServiceAccount Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="agent-sa" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={roleRef} onChange={(e) => setRoleRef(e.target.value)} style={selectStyle}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {roleRef === 'custom' && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="custom-role-name"
                  required
                  style={{ ...inputStyle, marginTop: '0.5rem' }}
                />
              )}
            </div>
            <div>
              <label style={labelStyle}>Namespace</label>
              <input type="text" value={namespace} onChange={(e) => setNamespace(e.target.value)} placeholder={`krate-org-${org}`} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="submit" disabled={!canSubmit} style={!canSubmit ? disabledStyle : primaryStyle}>
              {status === 'saving' ? 'Creating...' : 'Create service account'}
            </button>
            <StatusMsg status={status} message={message} />
          </div>
        </div>
      </div>
    </form>
  );
}

export function RbacSection({ org, initialServiceAccounts }) {
  const [serviceAccounts, setServiceAccounts] = useState(initialServiceAccounts || []);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (initialServiceAccounts && initialServiceAccounts.length > 0) return;
    let cancelled = false;
    async function fetchServiceAccounts() {
      try {
        const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources?kind=AgentServiceAccount`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setServiceAccounts(data.items || []);
          }
        }
      } catch {
        // Non-critical
      }
    }
    fetchServiceAccounts();
    return () => { cancelled = true; };
  }, [org, initialServiceAccounts]);

  function handleDeleted(name) {
    setServiceAccounts((prev) => prev.filter((sa) => sa.metadata?.name !== name));
  }

  function handleCreated(newSa) {
    setServiceAccounts((prev) => [...prev, newSa]);
    setShowForm(false);
  }

  return (
    <div className="card">
      <div className="cardTitle">
        <h2>Service Accounts (RBAC)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`pill ${serviceAccounts.length ? 'good' : 'neutral'}`}>{serviceAccounts.length} accounts</span>
          <button type="button" onClick={() => setShowForm((v) => !v)} style={{ ...secondaryStyle, padding: '4px 14px', fontSize: 13 }}>
            {showForm ? 'Cancel' : '+ Add service account'}
          </button>
        </div>
      </div>
      {serviceAccounts.length > 0 ? (
        <div className="resourceTable">
          {serviceAccounts.map((sa) => (
            <ServiceAccountRow key={sa.metadata?.name} org={org} sa={sa} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : !showForm ? (
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          <p>No service accounts configured. Click <strong>+ Add service account</strong> to create a K8s ServiceAccount with a role binding for agent RBAC.</p>
        </div>
      ) : null}
      {showForm && <AddServiceAccountForm org={org} onCreated={handleCreated} />}
    </div>
  );
}
