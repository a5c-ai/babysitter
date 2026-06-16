'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem', background: 'var(--bg-input, transparent)', color: 'var(--text)' };
const btnPrimary = { border: 'none', padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, background: 'var(--accent)', color: '#fff' };
const btnSecondary = { border: '1px solid var(--border)', background: 'transparent', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' };
const cardStyle = { padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-card, var(--bg-subtle))' };

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const record = {};
    headers.forEach((h, i) => { record[h] = values[i] || ''; });
    return record;
  });
  return { headers, rows };
}

function parseJSON(text) {
  const data = JSON.parse(text);
  const rows = Array.isArray(data) ? data : data.records || data.data || [];
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

export function DatasetUpload({ org, datasetRef, onUploaded }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [version, setVersion] = useState('');
  const [fileContent, setFileContent] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage('');
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      setFileContent(text);
      try {
        const parsed = file.name.endsWith('.csv') ? parseCSV(text) : parseJSON(text);
        setPreview(parsed);
        setMessage(`Parsed ${parsed.rows.length} records with ${parsed.headers.length} fields.`);
      } catch (err) {
        setPreview(null);
        setMessage(`Parse error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  async function handleUpload() {
    if (!preview || !version.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      // Create version
      const versionResource = {
        apiVersion: 'kradle.a5c.ai/v1alpha1',
        kind: 'DatasetVersion',
        metadata: { name: `${datasetRef}-v${version.replace(/\./g, '-')}`, namespace: 'kradle-system' },
        spec: {
          organizationRef: org,
          datasetRef,
          version: version.trim(),
          recordCount: preview.rows.length,
          storageRef: 'inline'
        },
        status: {}
      };
      const vResponse = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(versionResource)
      });
      if (!vResponse.ok) {
        const err = await vResponse.json().catch(() => ({}));
        setMessage(err.message || 'Failed to create version');
        return;
      }
      const vBody = await vResponse.json().catch(() => ({}));
      const versionName = vBody?.resource?.metadata?.name || versionResource.metadata.name;

      // Create records (batch, max 50 at a time)
      const batch = preview.rows.slice(0, 50);
      await Promise.all(batch.map((record, i) =>
        fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            apiVersion: 'kradle.a5c.ai/v1alpha1',
            kind: 'DatasetRecord',
            metadata: { name: `${versionName}-r${i}`, namespace: 'kradle-system' },
            spec: { organizationRef: org, versionRef: versionName, data: record },
            status: {}
          })
        })
      ));

      setMessage(`Uploaded version ${version} with ${batch.length} records${preview.rows.length > 50 ? ` (showing first 50 of ${preview.rows.length})` : ''}`);
      if (onUploaded) onUploaded(vBody?.resource);
      setTimeout(() => router.refresh(), 1200);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Upload data</h3>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Upload a CSV or JSON file to create a new dataset version.</p>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Version</span>
        <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" style={inputStyle} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Data file (CSV or JSON)</span>
        <input type="file" accept=".csv,.json" onChange={handleFileChange} style={{ fontSize: '0.8125rem' }} />
      </label>

      {preview && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '0.375rem', overflow: 'auto', maxHeight: '200px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-subtle)' }}>
                {preview.headers.map((h) => <th key={h} style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 10).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {preview.headers.map((h) => <td key={h} style={{ padding: '0.375rem 0.5rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row[h] || '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {preview.rows.length > 10 && <div style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>...and {preview.rows.length - 10} more rows</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleUpload} disabled={busy || !preview || !version.trim()} style={{ ...btnPrimary, opacity: busy || !preview || !version.trim() ? 0.6 : 1 }}>
          {busy ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {message && <p style={{ margin: 0, fontSize: '0.75rem', color: message.startsWith('Uploaded') || message.startsWith('Parsed') ? 'var(--success)' : 'var(--danger)' }}>{message}</p>}
    </div>
  );
}
