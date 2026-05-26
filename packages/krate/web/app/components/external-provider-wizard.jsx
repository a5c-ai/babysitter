'use client';

import { useState } from 'react';

const PROVIDER_TYPES = [
  { value: 'github', label: 'GitHub', description: 'GitHub.com or GitHub Enterprise Server' },
  { value: 'gitlab', label: 'GitLab', description: 'GitLab.com or self-hosted GitLab' },
  { value: 'bitbucket', label: 'Bitbucket', description: 'Bitbucket Cloud or Data Center' },
  { value: 'gitea', label: 'Gitea', description: 'Gitea or Forgejo self-hosted' },
  { value: 'azure_devops', label: 'Azure DevOps', description: 'Azure DevOps Services or Server' },
];

const INTERFACES = [
  { value: 'gitForge', label: 'Git forge', description: 'Repository management and webhooks' },
  { value: 'issueTracking', label: 'Issue tracking', description: 'Issues, milestones, and labels' },
  { value: 'cicd', label: 'CI/CD', description: 'Pipelines, jobs, and run triggers' },
];

const TOTAL_STEPS = 5;

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box' };
const btnPrimaryStyle = { padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' };
const btnSecondaryStyle = { padding: '0.5rem 1.25rem', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' };

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

function Step1ProviderType({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Select provider type</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>Choose the forge platform to connect.</p>
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
            name="providerType"
            value={pt.value}
            checked={value === pt.value}
            onChange={() => onChange(pt.value)}
            style={{ accentColor: '#2563eb' }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{pt.label}</div>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{pt.description}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

function Step2Hosting({ hosting, setHosting, baseUrl, setBaseUrl, providerType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Hosting configuration</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>Specify whether this is a SaaS or self-hosted instance.</p>

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
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{h === 'saas' ? 'Use default public endpoint' : 'Custom base URL'}</div>
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
            placeholder={`https://${providerType}.example.com`}
            style={inputStyle}
          />
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>The root URL of your self-hosted instance.</p>
        </div>
      )}
    </div>
  );
}

function Step3Interfaces({ selected, onChange }) {
  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Select interfaces</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>Choose which capabilities to enable for this provider.</p>
      {INTERFACES.map((iface) => (
        <label key={iface.value} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          border: `1px solid ${selected.includes(iface.value) ? '#2563eb' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          cursor: 'pointer',
          background: selected.includes(iface.value) ? '#eff6ff' : '#fff',
        }}>
          <input
            type="checkbox"
            checked={selected.includes(iface.value)}
            onChange={() => toggle(iface.value)}
            style={{ accentColor: '#2563eb', width: 16, height: 16, flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{iface.label}</div>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{iface.description}</div>
          </div>
        </label>
      ))}
      {selected.length === 0 && (
        <p style={{ fontSize: '0.8125rem', color: '#dc2626' }}>Select at least one interface.</p>
      )}
    </div>
  );
}

function Step4Auth({ name, setName, secretRef, setSecretRef, providerType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Auth configuration</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>Configure the resource name and secret reference for API credentials.</p>

      <div>
        <label htmlFor="provider-resource-name" style={labelStyle}>Provider resource name <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
        <input
          id="provider-resource-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder={`${providerType}-provider`}
          required
          aria-required="true"
          style={inputStyle}
        />
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>Kubernetes resource name (lowercase, hyphens only).</p>
      </div>

      <div>
        <label htmlFor="provider-secret-ref" style={labelStyle}>Secret name (for API key / App credentials) <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span></label>
        <input
          id="provider-secret-ref"
          type="text"
          value={secretRef}
          onChange={(e) => setSecretRef(e.target.value)}
          placeholder={`${providerType}-credentials`}
          required
          aria-required="true"
          style={inputStyle}
        />
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
          Name of the Kubernetes Secret in the same namespace that holds the provider credentials.
        </p>
      </div>
    </div>
  );
}

function buildYaml({ name, providerType, hosting, baseUrl, interfaces, secretRef }) {
  const lines = [
    'apiVersion: krate.a5c.ai/v1alpha1',
    'kind: ExternalBackendProvider',
    'metadata:',
    `  name: ${name || '<name>'}`,
    'spec:',
    `  providerType: ${providerType}`,
  ];
  if (hosting === 'self-hosted' && baseUrl) {
    lines.push(`  baseUrl: ${baseUrl}`);
  }
  if (interfaces.length) {
    lines.push('  interfaces:');
    interfaces.forEach((iface) => lines.push(`    - ${iface}`));
  }
  if (secretRef) {
    lines.push(`  secretRef: ${secretRef}`);
  }
  return lines.join('\n');
}

function Step5Review({ name, providerType, hosting, baseUrl, interfaces, secretRef }) {
  const yaml = buildYaml({ name, providerType, hosting, baseUrl, interfaces, secretRef });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Review &amp; submit</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>Review the generated resource definition before submitting.</p>
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
      }}>{yaml}</pre>
    </div>
  );
}

function defaultEndpointForProvider(type) {
  const endpoints = { github: 'https://api.github.com', gitlab: 'https://gitlab.com', bitbucket: 'https://api.bitbucket.org', gitea: 'https://gitea.example.com', azure_devops: 'https://dev.azure.com' };
  return endpoints[type] || 'https://api.github.com';
}

export function ExternalProviderWizard({ org, onCancel, onSuccess }) {
  const defaultNav = () => { window.location.href = `/orgs/${encodeURIComponent(org)}/external`; };
  const handleCancel = onCancel || defaultNav;
  const handleSuccess = onSuccess || defaultNav;
  const [step, setStep] = useState(0);
  const [providerType, setProviderType] = useState('github');
  const [hosting, setHosting] = useState('saas');
  const [baseUrl, setBaseUrl] = useState('');
  const [interfaces, setInterfaces] = useState(['gitForge']);
  const [name, setName] = useState('');
  const [secretRef, setSecretRef] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | error
  const [errorMsg, setErrorMsg] = useState('');

  function canNext() {
    if (step === 0) return !!providerType;
    if (step === 1) return hosting === 'saas' || !!baseUrl;
    if (step === 2) return interfaces.length > 0;
    if (step === 3) return !!name && !!secretRef;
    return true;
  }

  async function handleSubmit() {
    setStatus('saving');
    setErrorMsg('');
    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'ExternalBackendProvider',
      metadata: { name },
      spec: {
        providerType,
        endpoint: hosting === 'self-hosted' && baseUrl ? baseUrl : defaultEndpointForProvider(providerType),
        interfaces,
        secretRef,
      },
    };
    try {
      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('idle');
        handleSuccess();
      } else {
        setErrorMsg(data.message || data.error || `HTTP ${res.status}`);
        setStatus('error');
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

      {step === 0 && <Step1ProviderType value={providerType} onChange={setProviderType} />}
      {step === 1 && <Step2Hosting hosting={hosting} setHosting={setHosting} baseUrl={baseUrl} setBaseUrl={setBaseUrl} providerType={providerType} />}
      {step === 2 && <Step3Interfaces selected={interfaces} onChange={setInterfaces} />}
      {step === 3 && <Step4Auth name={name} setName={setName} secretRef={secretRef} setSecretRef={setSecretRef} providerType={providerType} />}
      {step === 4 && <Step5Review name={name} providerType={providerType} hosting={hosting} baseUrl={baseUrl} interfaces={interfaces} secretRef={secretRef} />}

      {status === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem' }}>
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
            style={{ ...btnPrimaryStyle, opacity: (status === 'saving' || !name) ? 0.6 : 1, cursor: (status === 'saving' || !name) ? 'not-allowed' : 'pointer' }}
            onClick={handleSubmit}
            disabled={status === 'saving' || !name}
          >
            {status === 'saving' ? 'Creating...' : 'Create provider'}
          </button>
        )}
      </div>
    </div>
  );
}
