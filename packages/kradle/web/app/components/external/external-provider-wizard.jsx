'use client';

import { useState } from 'react';

const PROVIDER_TYPES = [
  { value: 'github', label: 'GitHub', description: 'GitHub.com or GitHub Enterprise Server' },
  { value: 'gitlab', label: 'GitLab', description: 'GitLab.com or self-hosted GitLab' },
  { value: 'bitbucket', label: 'Bitbucket', description: 'Bitbucket Cloud or Data Center' },
  { value: 'gitea', label: 'Gitea', description: 'Gitea or Forgejo self-hosted' },
  { value: 'azure_devops', label: 'Azure DevOps', description: 'Azure DevOps Services or Server' },
  { value: 'vercel', label: 'Vercel', description: 'Vercel deployment and hosting platform' },
  { value: 'cloudflare', label: 'Cloudflare', description: 'Cloudflare Workers, Pages, and R2' },
  { value: 'firebase', label: 'Firebase', description: 'Google Firebase hosting and functions' },
  { value: 'netlify', label: 'Netlify', description: 'Netlify hosting and edge functions' },
];

// Platforms that are forges (support git, ci, issues)
const FORGE_PLATFORMS = new Set(['github', 'gitlab', 'bitbucket', 'gitea', 'azure_devops']);
// Platforms that are hosting-only
const HOSTING_PLATFORMS = new Set(['vercel', 'cloudflare', 'firebase', 'netlify']);

// Scope definitions: scope key -> { label, description, kind }
const SCOPE_DEFS = {
  git: { label: 'Git', description: 'Repository management and webhooks', kind: 'GitProvider' },
  cicd: { label: 'CI/CD', description: 'Pipelines, jobs, and run triggers', kind: 'CiProvider' },
  issues: { label: 'Issues', description: 'Issues, milestones, and labels', kind: 'IssueTrackerProvider' },
  hosting: { label: 'App Hosting', description: 'Deploy targets and hosting', kind: 'AppHostingProvider' },
  artifacts: { label: 'Artifact Registry', description: 'Package feeds, container images, and build artifacts', kind: 'ArtifactRegistryProvider' },
};

function defaultScopesForPlatform(platform) {
  if (FORGE_PLATFORMS.has(platform)) return ['git', 'cicd', 'issues'];
  if (HOSTING_PLATFORMS.has(platform)) return ['hosting'];
  return [];
}

function availableScopesForPlatform(platform) {
  if (FORGE_PLATFORMS.has(platform)) return ['git', 'cicd', 'issues', 'artifacts'];
  if (HOSTING_PLATFORMS.has(platform)) return ['hosting', 'artifacts'];
  return ['artifacts'];
}

function isScopeFixed(platform, scope) {
  // Hosting platforms have hosting auto-selected and not changeable
  return HOSTING_PLATFORMS.has(platform) && scope === 'hosting';
}

const TOTAL_STEPS = 5;

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box' };
const btnPrimaryStyle = { padding: '0.5rem 1.25rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' };
const btnSecondaryStyle = { padding: '0.5rem 1.25rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' };

function StepIndicator({ current, total }) {
  return (
    <div
      style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}
      role="list"
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          role="listitem"
          aria-current={i === current ? 'step' : undefined}
          aria-label={`Step ${i + 1}${i < current ? ' (completed)' : i === current ? ' (current)' : ''}`}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            background: i < current ? '#2563eb' : i === current ? '#93c5fd' : '#e5e7eb',
          }}
        />
      ))}
    </div>
  );
}

function Step1Platform({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Select platform</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Choose the platform to connect.</p>
      {PROVIDER_TYPES.map((pt) => (
        <label key={pt.value} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          border: `1px solid ${value === pt.value ? '#2563eb' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          cursor: 'pointer',
          background: value === pt.value ? '#eff6ff' : '#fff',
        }}>
          <input
            type="radio"
            name="platform"
            value={pt.value}
            checked={value === pt.value}
            onChange={() => onChange(pt.value)}
            style={{ accentColor: '#2563eb' }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{pt.label}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{pt.description}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

function Step2Hosting({ hosting, setHosting, baseUrl, setBaseUrl, platform }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Hosting configuration</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Specify whether this is a SaaS or self-hosted instance.</p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {['saas', 'self-hosted'].map((h) => (
          <label key={h} style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            border: `1px solid ${hosting === h ? '#2563eb' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            cursor: 'pointer',
            background: hosting === h ? '#eff6ff' : '#fff',
          }}>
            <input
              type="radio"
              name="hosting"
              value={h}
              checked={hosting === h}
              onChange={() => { setHosting(h); if (h === 'saas') setBaseUrl(''); }}
              style={{ accentColor: '#2563eb' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{h === 'saas' ? 'SaaS / Cloud' : 'Self-hosted'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h === 'saas' ? 'Use default public endpoint' : 'Custom base URL'}</div>
            </div>
          </label>
        ))}
      </div>

      {hosting === 'self-hosted' && (
        <div>
          <label htmlFor="provider-base-url" style={labelStyle}>Base URL</label>
          <input
            id="provider-base-url"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={`https://${platform}.example.com`}
            style={inputStyle}
          />
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>The root URL of your self-hosted instance.</p>
        </div>
      )}
    </div>
  );
}

function Step3Scopes({ platform, selected, onChange }) {
  const available = availableScopesForPlatform(platform);
  function toggle(scope) {
    if (isScopeFixed(platform, scope)) return;
    onChange(selected.includes(scope) ? selected.filter((s) => s !== scope) : [...selected, scope]);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Select scopes</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Choose which provider kinds to create for this platform.</p>
      {available.map((scope) => {
        const def = SCOPE_DEFS[scope];
        const fixed = isScopeFixed(platform, scope);
        const checked = selected.includes(scope);
        return (
          <label key={scope} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            border: `1px solid ${checked ? '#2563eb' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            cursor: fixed ? 'default' : 'pointer',
            background: checked ? '#eff6ff' : '#fff',
            opacity: fixed ? 0.85 : 1,
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(scope)}
              disabled={fixed}
              style={{ accentColor: '#2563eb', width: 16, height: 16, flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {def.label}
                <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{def.kind}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{def.description}</div>
            </div>
          </label>
        );
      })}
      {selected.length === 0 && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>Select at least one scope.</p>
      )}
    </div>
  );
}

function Step4Auth({ secretRef, setSecretRef, platform }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Auth configuration</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Configure the secret reference for API credentials.</p>

      <div>
        <label htmlFor="provider-secret-ref" style={labelStyle}>Secret name (for API key / App credentials) <span aria-hidden="true" style={{ color: 'var(--danger)' }}>*</span></label>
        <input
          id="provider-secret-ref"
          type="text"
          value={secretRef}
          onChange={(e) => setSecretRef(e.target.value)}
          placeholder={`${platform}-credentials`}
          required
          aria-required="true"
          style={inputStyle}
        />
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Name of the Kubernetes Secret in the same namespace that holds the provider credentials.
        </p>
      </div>
    </div>
  );
}

function defaultEndpointForPlatform(platform) {
  const endpoints = { github: 'https://api.github.com', gitlab: 'https://gitlab.com', bitbucket: 'https://api.bitbucket.org', gitea: 'https://gitea.example.com', azure_devops: 'https://dev.azure.com', vercel: 'https://api.vercel.com', cloudflare: 'https://api.cloudflare.com', firebase: 'https://firebase.googleapis.com', netlify: 'https://api.netlify.com' };
  return endpoints[platform] || 'https://api.github.com';
}

function Step5Review({ platform, hosting, baseUrl, scopes, secretRef, org }) {
  const endpoint = hosting === 'self-hosted' && baseUrl ? baseUrl : defaultEndpointForPlatform(platform);
  const resources = scopes.map((scope) => {
    const def = SCOPE_DEFS[scope];
    return {
      apiVersion: 'kradle.a5c.ai/v1alpha1',
      kind: def.kind,
      metadata: { name: `${platform}-${scope}` },
      spec: { organizationRef: org, platform, endpoint, secretRef },
    };
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Review &amp; submit</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        {resources.length} resource{resources.length !== 1 ? 's' : ''} will be created: {resources.map((r) => r.kind).join(', ')}
      </p>
      <pre style={{
        background: '#1e1e2e',
        color: '#cdd6f4',
        padding: '1rem',
        borderRadius: '0.5rem',
        fontSize: '0.8125rem',
        fontFamily: 'monospace',
        overflow: 'auto',
        whiteSpace: 'pre',
        margin: 0,
      }}>{JSON.stringify(resources, null, 2)}</pre>
    </div>
  );
}

export function ExternalProviderWizard({ org, onCancel, onSuccess }) {
  const defaultNav = () => { window.location.href = `/orgs/${encodeURIComponent(org)}/external`; };
  const handleCancel = onCancel || defaultNav;
  const handleSuccess = onSuccess || defaultNav;
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState('github');
  const [hosting, setHosting] = useState('saas');
  const [baseUrl, setBaseUrl] = useState('');
  const [scopes, setScopes] = useState(defaultScopesForPlatform('github'));
  const [secretRef, setSecretRef] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | error
  const [errorMsg, setErrorMsg] = useState('');

  function handlePlatformChange(newPlatform) {
    setPlatform(newPlatform);
    setScopes(defaultScopesForPlatform(newPlatform));
  }

  function canNext() {
    if (step === 0) return !!platform;
    if (step === 1) return hosting === 'saas' || !!baseUrl;
    if (step === 2) return scopes.length > 0;
    if (step === 3) return !!secretRef;
    return true;
  }

  async function handleSubmit() {
    setStatus('saving');
    setErrorMsg('');
    const endpoint = hosting === 'self-hosted' && baseUrl ? baseUrl : defaultEndpointForPlatform(platform);
    const resources = scopes.map((scope) => {
      const def = SCOPE_DEFS[scope];
      return {
        apiVersion: 'kradle.a5c.ai/v1alpha1',
        kind: def.kind,
        metadata: { name: `${platform}-${scope}` },
        spec: { organizationRef: org, platform, endpoint, secretRef },
      };
    });
    try {
      const results = await Promise.all(
        resources.map((resource) =>
          fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resource),
          })
        )
      );
      const failures = [];
      for (const res of results) {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          failures.push(data.message || data.error || `HTTP ${res.status}`);
        }
      }
      if (failures.length > 0) {
        setErrorMsg(failures.join('; '));
        setStatus('error');
      } else {
        setStatus('idle');
        handleSuccess();
      }
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  const wrapStyle = { display: 'flex', flexDirection: 'column', gap: '1.5rem' };
  const actionsStyle = { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' };

  return (
    <div style={wrapStyle}>
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {step === 0 && <Step1Platform value={platform} onChange={handlePlatformChange} />}
      {step === 1 && <Step2Hosting hosting={hosting} setHosting={setHosting} baseUrl={baseUrl} setBaseUrl={setBaseUrl} platform={platform} />}
      {step === 2 && <Step3Scopes platform={platform} selected={scopes} onChange={setScopes} />}
      {step === 3 && <Step4Auth secretRef={secretRef} setSecretRef={setSecretRef} platform={platform} />}
      {step === 4 && <Step5Review platform={platform} hosting={hosting} baseUrl={baseUrl} scopes={scopes} secretRef={secretRef} org={org} />}

      {status === 'error' && (
        <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', padding: '0.75rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={actionsStyle}>
        <button style={btnSecondaryStyle} onClick={step === 0 ? handleCancel : () => setStep(step - 1)}>
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < TOTAL_STEPS - 1 ? (
          <button style={{ ...btnPrimaryStyle, opacity: canNext() ? 1 : 0.5, cursor: canNext() ? 'pointer' : 'not-allowed' }} onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}>
            Next
          </button>
        ) : (
          <button
            style={{ ...btnPrimaryStyle, opacity: (status === 'saving' || scopes.length === 0) ? 0.6 : 1, cursor: (status === 'saving' || scopes.length === 0) ? 'not-allowed' : 'pointer' }}
            onClick={handleSubmit}
            disabled={status === 'saving' || scopes.length === 0}
          >
            {status === 'saving' ? 'Creating...' : `Create ${scopes.length} provider${scopes.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </div>
  );
}
