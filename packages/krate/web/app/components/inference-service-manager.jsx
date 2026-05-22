'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(timestamp) {
  if (!timestamp) return '';
  try {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (diffMs < 0) return 'just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch { return String(timestamp); }
}

const FORMAT_COLORS = {
  sklearn: '#2563eb',
  pytorch: '#ea580c',
  tensorflow: '#16a34a',
  onnx: '#7c3aed',
  huggingface: '#d97706',
  triton: '#6b7280',
  custom: '#6b7280',
};

const DEFAULT_PAYLOADS = {
  sklearn: JSON.stringify({ inputs: [{ name: 'input-0', shape: [1, 4], datatype: 'FP32', data: [[1.0, 2.0, 3.0, 4.0]] }] }, null, 2),
  pytorch: JSON.stringify({ inputs: [{ name: 'input-0', shape: [1, 3, 224, 224], datatype: 'FP32', data: [] }] }, null, 2),
  huggingface: JSON.stringify({ inputs: [{ name: 'input_ids', shape: [1, 10], datatype: 'INT64', data: [101, 2054, 2003, 1996, 3007, 1997, 2605, 102, 0, 0] }] }, null, 2),
};

function getDefaultPayload(modelFormat) {
  return DEFAULT_PAYLOADS[modelFormat] || JSON.stringify({ inputs: [{ name: 'input-0', shape: [1], datatype: 'FP32', data: [1.0] }] }, null, 2);
}

function getServiceStatus(service) {
  if (!service) return 'Unknown';
  if (service.status?.ready === true) return 'Ready';
  if (service.status?.ready === false) return 'Failed';
  const readyCondition = (service.status?.conditions || []).find(c => c.type === 'Ready');
  if (readyCondition?.status === 'True') return 'Ready';
  if (readyCondition?.status === 'False') return 'Failed';
  return 'Pending';
}

function statusColor(status) {
  if (status === 'Ready') return '#16a34a';
  if (status === 'Failed') return '#dc2626';
  return '#d97706';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const cardStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: '0.5rem',
  padding: '1rem',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const btnStyle = (color = '#2563eb') => ({
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  border: 'none',
  background: color,
  color: '#fff',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontWeight: 500,
});

const btnOutlineStyle = {
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontWeight: 500,
};

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '0.375rem',
  border: '1px solid #d1d5db',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.8125rem',
  marginBottom: '0.25rem',
  color: '#374151',
};

const badgeStyle = (color = '#2563eb') => ({
  display: 'inline-block',
  fontSize: '0.6875rem',
  padding: '2px 8px',
  borderRadius: '9999px',
  background: color + '20',
  color: color,
  fontWeight: 600,
  border: `1px solid ${color}40`,
});

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  overflowY: 'auto',
};

const panelStyle = {
  width: '520px',
  maxWidth: '95vw',
  minHeight: '100vh',
  background: '#fff',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  overflowY: 'auto',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FrameworkBadge({ format }) {
  const color = FORMAT_COLORS[format] || '#6b7280';
  return <span style={badgeStyle(color)}>{format || 'custom'}</span>;
}

function StatusBadge({ status }) {
  const color = statusColor(status);
  return (
    <span style={{ ...badgeStyle(color), fontSize: '0.6875rem' }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 4, verticalAlign: 'middle' }} />
      {status}
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => {});
    }
  };
  return (
    <button onClick={handleCopy} style={{ ...btnOutlineStyle, padding: '2px 8px', fontSize: '0.75rem' }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function ServiceCard({ service, onView, onDelete }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', borderRadius: '0.375rem', padding: '0.375rem 0.625rem' }}>
          <code style={{ fontSize: '0.75rem', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{endpoint}</code>
          <CopyButton text={endpoint} />
        </div>
      )}

      {(cpuLimit || memLimit || gpuLimit) && (
        <div style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', gap: '0.75rem' }}>
          {cpuLimit && <span>CPU: {cpuLimit}</span>}
          {memLimit && <span>Mem: {memLimit}</span>}
          {gpuLimit && <span>GPU: {gpuLimit}</span>}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{createdAt ? relativeTime(createdAt) : ''}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={btnStyle()} onClick={() => onView(service)}>Details</button>
          <button style={btnStyle('#dc2626')} onClick={() => onDelete(service)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function RuntimeCard({ runtime }) {
  const name = runtime.metadata?.name || runtime.name || 'unknown';
  const image = runtime.spec?.containers?.[0]?.image || '';
  const formats = runtime.spec?.supportedModelFormats || [];

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{name}</div>
      {image && <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontFamily: 'monospace' }}>{image}</div>}
      {formats.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {formats.map((f, i) => (
            <FrameworkBadge key={i} format={f.name || String(f)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateServiceForm({ runtimes, onSubmit, onCancel, loading }) {
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
          <input style={{ ...inputStyle, width: '5rem', marginLeft: '0.5rem' }} type="number" min="1" value={form.gpuCount} onChange={set('gpuCount')} />
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
        <button type="submit" style={btnStyle()} disabled={loading}>{loading ? 'Creating...' : 'Create Service'}</button>
        <button type="button" style={btnOutlineStyle} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function CreateRuntimeForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ name: '', image: '', formats: '', cpuLimit: '', memLimit: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const supportedModelFormats = form.formats
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name }));
    onSubmit({
      name: form.name,
      image: form.image,
      supportedModelFormats,
      ...(form.cpuLimit || form.memLimit ? {
        resources: { limits: { ...(form.cpuLimit ? { cpu: form.cpuLimit } : {}), ...(form.memLimit ? { memory: form.memLimit } : {}) } }
      } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Name *</label>
        <input style={inputStyle} value={form.name} onChange={set('name')} required placeholder="my-serving-runtime" />
      </div>
      <div>
        <label style={labelStyle}>Container Image</label>
        <input style={inputStyle} value={form.image} onChange={set('image')} placeholder="kserve/sklearnserver:latest" />
      </div>
      <div>
        <label style={labelStyle}>Supported Formats (comma-separated)</label>
        <input style={inputStyle} value={form.formats} onChange={set('formats')} placeholder="sklearn, onnx" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={labelStyle}>CPU Limit</label>
          <input style={inputStyle} value={form.cpuLimit} onChange={set('cpuLimit')} placeholder="2" />
        </div>
        <div>
          <label style={labelStyle}>Memory Limit</label>
          <input style={inputStyle} value={form.memLimit} onChange={set('memLimit')} placeholder="4Gi" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" style={btnStyle()} disabled={loading}>{loading ? 'Adding...' : 'Add Runtime'}</button>
        <button type="button" style={btnOutlineStyle} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ServiceDetailPanel({ service, org, onClose }) {
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
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{name}</h2>
            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
              <FrameworkBadge format={modelFormat} />
              <StatusBadge status={status} />
            </div>
          </div>
          <button style={btnOutlineStyle} onClick={onClose}>Close</button>
        </div>

        {/* Endpoint */}
        <div style={{ background: '#f8fafc', borderRadius: '0.375rem', padding: '0.75rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Endpoint</div>
          {endpoint ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ fontSize: '0.8125rem', flex: 1, wordBreak: 'break-all' }}>{endpoint}</code>
              <CopyButton text={endpoint} />
            </div>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Not available (service not ready)</div>
          )}
        </div>

        {/* Status / Conditions */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Status Conditions</div>
          {conditions.length === 0 ? (
            <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>No conditions reported</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {conditions.map((c, i) => (
                <div key={i} style={{ ...cardStyle, padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{c.type}</span>
                    <span style={{ fontSize: '0.8125rem', color: c.status === 'True' ? '#16a34a' : '#dc2626' }}>{c.status}</span>
                  </div>
                  {c.message && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{c.message}</div>}
                  {c.lastTransitionTime && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{relativeTime(c.lastTransitionTime)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model Metadata */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Model</div>
          <div style={{ fontSize: '0.8125rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
            style={{ ...btnStyle('#7c3aed'), marginTop: '0.5rem', width: '100%' }}
            onClick={handleTest}
            disabled={testLoading || !endpoint}
          >
            {testLoading ? 'Sending...' : endpoint ? 'Send Test Request' : 'Service not ready'}
          </button>
          {testError && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#dc2626', background: '#fef2f2', padding: '0.5rem', borderRadius: '0.375rem' }}>
              {testError}
            </div>
          )}
          {testOutput && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Status: {testOutput.status} | Endpoint: {testOutput.endpoint}
              </div>
              <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.75rem', overflow: 'auto', maxHeight: '12rem', margin: 0 }}>
                {JSON.stringify(testOutput.response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Use in Agent Stack */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <a
            href={agentStackHref}
            style={{ ...btnStyle('#16a34a'), display: 'inline-block', textDecoration: 'none' }}
          >
            Use in Agent Stack
          </a>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.375rem' }}>
            Creates an AgentProviderConfig with type &apos;kserve&apos; linked to this service.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InferenceServiceManager({ org, initialServiceName }) {
  const [services, setServices] = useState([]);
  const [runtimes, setRuntimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRuntimeForm, setShowRuntimeForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svcRes, rtRes] = await Promise.all([
        fetch(`/api/orgs/${org}/inference/services`),
        fetch(`/api/orgs/${org}/inference/runtimes`),
      ]);
      const svcData = svcRes.ok ? await svcRes.json() : null;
      const rtData = rtRes.ok ? await rtRes.json() : null;
      setServices(svcData?.items || (Array.isArray(svcData) ? svcData : []));
      setRuntimes(rtData?.items || (Array.isArray(rtData) ? rtData : []));

      if (initialServiceName) {
        const found = (svcData?.items || []).find(s => (s.metadata?.name || s.name) === initialServiceName);
        if (found) setSelectedService(found);
      }
    } catch (err) {
      setError(err.message || 'Failed to load inference data');
    } finally {
      setLoading(false);
    }
  }, [org, initialServiceName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateService = async (body) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/orgs/${org}/inference/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed with status ${res.status}`);
      }
      setShowCreateForm(false);
      await fetchData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateRuntime = async (body) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/orgs/${org}/inference/runtimes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed with status ${res.status}`);
      }
      setShowRuntimeForm(false);
      await fetchData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (service) => {
    const name = service.metadata?.name || service.name;
    if (!confirm(`Delete inference service "${name}"?`)) return;
    try {
      const res = await fetch(`/api/orgs/${org}/inference/services/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const tabStyle = (active) => ({
    padding: '0.5rem 1rem',
    border: 'none',
    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: active ? 700 : 500,
    color: active ? '#2563eb' : '#6b7280',
    fontSize: '0.875rem',
  });

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          <button style={tabStyle(activeTab === 'services')} onClick={() => setActiveTab('services')}>Services</button>
          <button style={tabStyle(activeTab === 'runtimes')} onClick={() => setActiveTab('runtimes')}>Runtimes</button>
        </div>
        {activeTab === 'services' && !showCreateForm && (
          <button style={btnStyle()} onClick={() => setShowCreateForm(true)}>+ Create Service</button>
        )}
        {activeTab === 'runtimes' && !showRuntimeForm && (
          <button style={btnStyle()} onClick={() => setShowRuntimeForm(true)}>+ Add Runtime</button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.875rem', color: '#dc2626', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ fontSize: '0.875rem', color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>Loading...</div>
      )}

      {/* Services Tab */}
      {!loading && activeTab === 'services' && (
        <>
          {showCreateForm && (
            <div style={{ ...cardStyle, marginBottom: '1rem', background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Create Inference Service</div>
              {createError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.5rem', fontSize: '0.8125rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                  {createError}
                </div>
              )}
              <CreateServiceForm
                runtimes={runtimes}
                onSubmit={handleCreateService}
                onCancel={() => { setShowCreateForm(false); setCreateError(null); }}
                loading={createLoading}
              />
            </div>
          )}
          {services.length === 0 && !showCreateForm ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>No inference services</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Deploy a model to get started.</div>
              <button style={btnStyle()} onClick={() => setShowCreateForm(true)}>Create Service</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
              {services.map((svc, i) => (
                <ServiceCard
                  key={svc.metadata?.name || i}
                  service={svc}
                  onView={setSelectedService}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Runtimes Tab */}
      {!loading && activeTab === 'runtimes' && (
        <>
          {showRuntimeForm && (
            <div style={{ ...cardStyle, marginBottom: '1rem', background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Add Serving Runtime</div>
              {createError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.5rem', fontSize: '0.8125rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                  {createError}
                </div>
              )}
              <CreateRuntimeForm
                onSubmit={handleCreateRuntime}
                onCancel={() => { setShowRuntimeForm(false); setCreateError(null); }}
                loading={createLoading}
              />
            </div>
          )}
          {runtimes.length === 0 && !showRuntimeForm ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>No serving runtimes</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Add a custom serving runtime to use with your models.</div>
              <button style={btnStyle()} onClick={() => setShowRuntimeForm(true)}>Add Runtime</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {runtimes.map((rt, i) => (
                <RuntimeCard key={rt.metadata?.name || i} runtime={rt} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Service Detail Panel */}
      {selectedService && (
        <ServiceDetailPanel
          service={selectedService}
          org={org}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
