'use client';

import { useState, useEffect } from 'react';

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', color: 'var(--ink-pigment)' };
const descStyle = { fontSize: '0.75rem', color: 'var(--ink-ghost)', marginTop: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--line)', fontSize: '0.875rem', boxSizing: 'border-box' };
const buttonStyle = { padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const primaryStyle = { ...buttonStyle, backgroundColor: '#2563eb', color: '#fff' };
const dangerStyle = { ...buttonStyle, backgroundColor: '#dc2626', color: '#fff' };
const secondaryStyle = { ...buttonStyle, backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
const disabledStyle = { ...primaryStyle, opacity: 0.5, cursor: 'not-allowed' };
const sectionStyle = { display: 'flex', flexDirection: 'column', gap: '1.25rem' };
const cardStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const kvRowStyle = { display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', gap: '6px 16px', alignItems: 'center', fontSize: '0.875rem' };
const kvLabelStyle = { color: 'var(--ink-ghost)', fontFamily: 'var(--mono)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' };
const kvValueStyle = { color: 'var(--ink-pigment)', overflowWrap: 'anywhere' };

function StatusMsg({ status, message }) {
  if (!message) return null;
  const color = status === 'success' ? '#16a34a' : '#dc2626';
  return <span style={{ fontSize: 13, color, fontWeight: 600 }}>{message}</span>;
}

export function UserProfileForm({ org, user }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.user || '');
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications !== false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const [apiKeys, setApiKeys] = useState([]);
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle');
  const [keyMessage, setKeyMessage] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  useEffect(() => {
    loadApiKeys();
  }, [org]);

  async function loadApiKeys() {
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/profile`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch { /* ignore */ }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveStatus('saving');
    setSaveMessage('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, emailNotifications }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSaveStatus('error');
        setSaveMessage(data.message || 'Failed to update profile');
      } else {
        setSaveStatus('success');
        setSaveMessage('Profile updated.');
        setEditing(false);
      }
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(err.message || 'Network error');
    }
  }

  async function handleGenerateKey(e) {
    e.preventDefault();
    if (!keyName.trim()) return;
    setKeyStatus('generating');
    setKeyMessage('');
    setGeneratedKey('');
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVersion: 'krate.a5c.ai/v1alpha1',
          kind: 'AgentSecretGrant',
          metadata: { name: `user-apikey-${keyName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')}` },
          spec: {
            organizationRef: org,
            subject: { kind: 'User', name: user?.user || user?.subject || 'unknown' },
            secretRef: { name: `user-apikey-${keyName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')}` },
            purpose: `Personal API key: ${keyName.trim()}`,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setKeyStatus('error');
        setKeyMessage(data.message || 'Failed to create API key');
      } else {
        setKeyStatus('success');
        setKeyMessage(`API key "${keyName.trim()}" created.`);
        setGeneratedKey(data.metadata?.name || keyName.trim());
        setKeyName('');
        loadApiKeys();
      }
    } catch (err) {
      setKeyStatus('error');
      setKeyMessage(err.message || 'Network error');
    }
  }

  async function handleRevokeKey(secretName) {
    if (!confirm(`Revoke API key "${secretName}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/secrets/${encodeURIComponent(secretName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.name !== secretName));
        setKeyMessage(`Key "${secretName}" revoked.`);
        setKeyStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setKeyMessage(data.message || 'Failed to revoke key');
        setKeyStatus('error');
      }
    } catch (err) {
      setKeyMessage(err.message || 'Network error');
      setKeyStatus('error');
    }
  }

  function handleSignOut() {
    window.location.href = '/api/auth/logout';
  }

  const username = user?.user || user?.subject || 'Unknown user';
  const email = user?.email || user?.mail || '';
  const orgName = user?.org || org || 'default';
  const role = user?.role || user?.roles?.[0] || 'member';
  const teams = user?.teams || [];
  const signInMethod = user?.authProvider || user?.method || 'session cookie';
  const lastLogin = user?.lastLogin || user?.iat ? new Date((user.iat || 0) * 1000).toLocaleString() : 'Unknown';

  return (
    <div style={sectionStyle}>
      <div className="card" style={cardStyle}>
        <div className="cardTitle">
          <h2>User info</h2>
          <button type="button" onClick={() => setEditing(!editing)} style={secondaryStyle}>
            {editing ? 'Cancel' : 'Edit profile'}
          </button>
        </div>
        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Display name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ ...inputStyle, maxWidth: '400px' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
                Receive email notifications
              </label>
              <p style={descStyle}>Get notified about agent run completions, approval requests, and system alerts.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button type="submit" disabled={saveStatus === 'saving'} style={saveStatus === 'saving' ? disabledStyle : primaryStyle}>
                {saveStatus === 'saving' ? 'Saving...' : 'Save changes'}
              </button>
              <StatusMsg status={saveStatus} message={saveMessage} />
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={kvRowStyle}><span style={kvLabelStyle}>Username</span><span style={kvValueStyle}>{username}</span></div>
            {email && <div style={kvRowStyle}><span style={kvLabelStyle}>Email</span><span style={kvValueStyle}>{email}</span></div>}
            <div style={kvRowStyle}><span style={kvLabelStyle}>Organization</span><span style={kvValueStyle}>{orgName}</span></div>
            <div style={kvRowStyle}><span style={kvLabelStyle}>Role</span><span style={kvValueStyle}>{role}</span></div>
            {teams.length > 0 && <div style={kvRowStyle}><span style={kvLabelStyle}>Teams</span><span style={kvValueStyle}>{teams.join(', ')}</span></div>}
          </div>
        )}
      </div>

      <div className="card" style={cardStyle}>
        <div className="cardTitle"><h2>API keys</h2></div>
        {apiKeys.length > 0 ? (
          <div className="resourceTable">
            {apiKeys.map(key => (
              <div key={key.name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <strong style={{ flex: '1 1 auto' }}>{key.name}</strong>
                <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>{key.purpose || 'API key'}</span>
                <button
                  type="button"
                  onClick={() => handleRevokeKey(key.name)}
                  style={{ ...secondaryStyle, padding: '4px 12px', fontSize: 12, color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--ink-fade)', fontSize: '0.875rem' }}>No personal API keys. Generate one to use the Krate API programmatically.</p>
        )}
        {generatedKey && (
          <div style={{ padding: '0.75rem', background: 'rgba(47, 111, 94, .1)', border: '1px solid rgba(47, 111, 94, .38)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
            <strong>New key created:</strong> <code style={{ fontFamily: 'var(--mono)' }}>{generatedKey}</code>
            <p style={descStyle}>Copy this key now. It will not be shown again.</p>
          </div>
        )}
        <form onSubmit={handleGenerateKey} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
          <div style={{ flex: 1, maxWidth: '300px' }}>
            <label style={labelStyle}>Key name</label>
            <input type="text" value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="my-cli-key" style={inputStyle} />
          </div>
          <button type="submit" disabled={!keyName.trim() || keyStatus === 'generating'} style={!keyName.trim() || keyStatus === 'generating' ? disabledStyle : primaryStyle}>
            {keyStatus === 'generating' ? 'Generating...' : 'Generate key'}
          </button>
          <StatusMsg status={keyStatus} message={keyMessage} />
        </form>
      </div>

      <div className="card" style={cardStyle}>
        <div className="cardTitle"><h2>Session</h2></div>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={kvRowStyle}><span style={kvLabelStyle}>Sign-in method</span><span style={kvValueStyle}>{signInMethod}</span></div>
          <div style={kvRowStyle}><span style={kvLabelStyle}>Last login</span><span style={kvValueStyle}>{lastLogin}</span></div>
          <div style={kvRowStyle}><span style={kvLabelStyle}>Session</span><span style={kvValueStyle}>Active</span></div>
        </div>
        <div style={{ paddingTop: '0.5rem' }}>
          <button type="button" onClick={handleSignOut} style={dangerStyle}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
