'use client';

import { useState, memo } from 'react';
import {
  relativeTime, getDefaultPayload, getServiceStatus,
  cardStyle, btnStyle, btnOutlineStyle, inputStyle, labelStyle, badgeStyle,
  overlayStyle, panelStyle,
  FrameworkBadge, StatusBadge, CopyButton,
} from './inference-helpers.jsx';

function serviceConditionKey(condition) {
  return [
    condition.type,
    condition.reason,
    condition.status,
    condition.lastTransitionTime,
    condition.message,
  ].filter(Boolean).join(':');
}

// ─── Service Card ───────────────────────────────────────────────────────────

export const ServiceCard = memo(function ServiceCard({ service, onView, onDelete }) {
  const name = service.metadata?.name || service.name || 'unknown';
  const modelFormat = service.spec?.predictor?.model?.modelFormat?.name || 'custom';
  const endpoint = service.status?.url || service.status?.address?.url;
  const resources = service.spec?.predictor?.resources;
  const cpuLimit = resources?.limits?.cpu || resources?.requests?.cpu;
  const memLimit = resources?.limits?.memory || resources?.requests?.memory;
  const gpuLimit = resources?.limits?.['nvidia.com/gpu'];
  const createdAt = service.metadata?.creationTimestamp || service.status?.lastTransitionTime;
  const status = getServiceStatus(service);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{name}</span>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <FrameworkBadge format={modelFormat} />
          <StatusBadge status={status} />
        </div>
      </div>

      {endpoint && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', padding: '0.375rem 0.625rem' }}>
          <code style={{ fontSize: '0.75rem', color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{endpoint}</code>
          <CopyButton text={endpoint} />
        </div>
      )}

      {(cpuLimit || memLimit || gpuLimit) && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
          {cpuLimit && <span>CPU: {cpuLimit}</span>}
          {memLimit && <span>Mem: {memLimit}</span>}
          {gpuLimit && <span>GPU: {gpuLimit}</span>}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{createdAt ? relativeTime(createdAt) : ''}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btnStyle()} onClick={() => onView(service)} aria-label={`View details for service ${name}`}>Details</button>
          <button style={btnStyle('var(--danger)')} onClick={() => onDelete(service)} aria-label={`Delete service ${name}`}>Delete</button>
        </div>
      </div>
    </div>
  );
});

// ─── Create Service Form ────────────────────────────────────────────────────

export function CreateServiceForm({ runtimes, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: '',
    modelFormat: 'sklearn',
    storageUri: '',
    runtime: '',
    cpuLimit: '1',
    memLimit: '2Gi',
    gpuEnabled: false,
    gpuCount: '1',
    protocolVersion: 'v2',
    streaming: false,
    batchInference: false,
    explainability: false,
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = {
      name: form.name,
      modelFormat: form.modelFormat,
      storageUri: form.storageUri,
      runtime: form.runtime || undefined,
      protocolVersion: form.protocolVersion,
      resources: {
        limits: {
          cpu: form.cpuLimit || undefined,
          memory: form.memLimit || undefined,
          ...(form.gpuEnabled ? { 'nvidia.com/gpu': form.gpuCount } : {}),
        },
      },
      features: {
        streaming: form.streaming,
        batchInference: form.batchInference,
        explainability: form.explainability,
      },
    };
    onSubmit(body);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Name *</label>
        <input style={inputStyle} value={form.name} onChange={set('name')} required placeholder="my-inference-service" />
      </div>
      <div>
        <label style={labelStyle}>Model Format</label>
        <select style={inputStyle} value={form.modelFormat} onChange={set('modelFormat')}>
          {['sklearn', 'pytorch', 'tensorflow', 'onnx', 'huggingface', 'triton', 'custom'].map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Storage URI</label>
        <input style={inputStyle} value={form.storageUri} onChange={set('storageUri')} placeholder="s3://bucket/path or gs://bucket/path or pvc://name/path" />
      </div>
      <div>
        <label style={labelStyle}>Runtime (optional)</label>
        <select style={inputStyle} value={form.runtime} onChange={set('runtime')}>
          <option value="">auto</option>
          {(runtimes || []).map(r => {
            const n = r.metadata?.name || r.name;
            return <option key={n} value={n}>{n}</option>;
          })}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={labelStyle}>CPU Limit</label>
          <input style={inputStyle} value={form.cpuLimit} onChange={set('cpuLimit')} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle}>Memory Limit</label>
          <input style={inputStyle} value={form.memLimit} onChange={set('memLimit')} placeholder="2Gi" />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" id="gpuEnabled" checked={form.gpuEnabled} onChange={set('gpuEnabled')} />
        <label htmlFor="gpuEnabled" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Enable GPU</label>
        {form.gpuEnabled && (
          <input style={{ ...inputStyle, width: '5rem', marginLeft: '0.5rem' }} type="number" min="1" value={form.gpuCount} onChange={set('gpuCount')} aria-label="GPU count" />
        )}
      </div>
      <div>
        <label style={labelStyle}>Inference Protocol</label>
        <select style={inputStyle} value={form.protocolVersion} onChange={set('protocolVersion')}>
          <option value="v2">V2 (gRPC/HTTP)</option>
          <option value="v1">V1 (REST)</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <label style={labelStyle}>Features</label>
        {[['streaming', 'Streaming'], ['batchInference', 'Batch Inference'], ['explainability', 'Explainability']].map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form[key]} onChange={set(key)} />
            {label}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button type="submit" style={btnStyle()} disabled={loading} aria-label={form.name ? `Create inference service ${form.name}` : 'Create new inference service'}>{loading ? 'Creating...' : 'Create Service'}</button>
        <button type="button" style={btnOutlineStyle} onClick={onCancel} aria-label="Cancel creating service">Cancel</button>
      </div>
    </form>
  );
}

// ─── Service Detail Panel ───────────────────────────────────────────────────

export function ServiceDetailPanel({ service, org, onClose }) {
  const name = service.metadata?.name || service.name || 'unknown';
  const modelFormat = service.spec?.predictor?.model?.modelFormat?.name || 'custom';
  const endpoint = service.status?.url || service.status?.address?.url;
  const conditions = service.status?.conditions || [];
  const status = getServiceStatus(service);

  const [testInput, setTestInput] = useState(getDefaultPayload(modelFormat));
  const [testOutput, setTestOutput] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);

  const handleTest = async () => {
    setTestLoading(true);
    setTestError(null);
    setTestOutput(null);
    try {
      let body;
      try { body = JSON.parse(testInput); } catch { throw new Error('Invalid JSON in test input'); }
      const res = await fetch(`/api/orgs/${org}/inference/services/${encodeURIComponent(name)}/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setTestOutput(data);
    } catch (err) {
      setTestError(err.message || 'Test request failed');
    } finally {
      setTestLoading(false);
    }
  };

  const agentStackHref = endpoint
    ? `/orgs/${org}/agents/stacks/new?providerType=kserve&endpoint=${encodeURIComponent(endpoint)}&modelName=${encodeURIComponent(name)}`
    : `/orgs/${org}/agents/stacks/new?providerType=kserve&modelName=${encodeURIComponent(name)}`;

  return (
    <div style={overlayStyle} role="dialog" aria-label={`Service details for ${name}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{name}</h2>
            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
              <FrameworkBadge format={modelFormat} />
              <StatusBadge status={status} />
            </div>
          </div>
          <button style={btnOutlineStyle} onClick={onClose} aria-label={`Close detail panel for service ${name}`}>Close</button>
        </div>

        {/* Endpoint */}
        <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Endpoint</div>
          {endpoint ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ fontSize: '0.8125rem', flex: 1, wordBreak: 'break-all' }}>{endpoint}</code>
              <CopyButton text={endpoint} />
            </div>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Not available (service not ready)</div>
          )}
        </div>

        {/* Status / Conditions */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Status Conditions</div>
          {conditions.length === 0 ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No conditions reported</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {conditions.map((c) => (
                <div key={serviceConditionKey(c)} style={{ ...cardStyle, padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{c.type}</span>
                    <span style={{ fontSize: '0.8125rem', color: c.status === 'True' ? 'var(--success)' : 'var(--danger)' }}>{c.status}</span>
                  </div>
                  {c.message && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.message}</div>}
                  {c.lastTransitionTime && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{relativeTime(c.lastTransitionTime)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model Metadata */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Model</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div>Format: <strong>{modelFormat}</strong></div>
            {service.spec?.predictor?.model?.storageUri && (
              <div>Storage: <code style={{ fontSize: '0.75rem' }}>{service.spec.predictor.model.storageUri}</code></div>
            )}
            {service.spec?.predictor?.model?.protocolVersion && (
              <div>Protocol: <strong>{service.spec.predictor.model.protocolVersion.toUpperCase()}</strong></div>
            )}
          </div>
        </div>

        {/* Test Inference */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Test Inference</div>
          <textarea
            style={{ ...inputStyle, height: '8rem', fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder="JSON inference payload"
          />
          <button
            style={{ ...btnStyle('#a9bf57'), marginTop: '0.5rem', width: '100%' }}
            onClick={handleTest}
            disabled={testLoading || !endpoint}
            aria-label={`Send test inference request to service ${name}`}
          >
            {testLoading ? 'Sending...' : endpoint ? 'Send Test Request' : 'Service not ready'}
          </button>
          {testError && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 12%, transparent)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
              {testError}
            </div>
          )}
          {testOutput && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Status: {testOutput.status} | Endpoint: {testOutput.endpoint}
              </div>
              <pre style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.75rem', overflow: 'auto', maxHeight: '12rem', margin: 0 }}>
                {JSON.stringify(testOutput.response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Use in Agent Stack */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <a
            href={agentStackHref}
            style={{ ...btnStyle('var(--success)'), display: 'inline-block', textDecoration: 'none' }}
          >
            Use in Agent Stack
          </a>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            Creates an AgentProviderConfig with type &apos;kserve&apos; linked to this service.
          </div>
        </div>
      </div>
    </div>
  );
}
