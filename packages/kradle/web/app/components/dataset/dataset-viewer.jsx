'use client';

import { useState } from 'react';

const btnSecondary = { border: '1px solid var(--border)', background: 'transparent', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' };
const inputStyle = { padding: '0.375rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8125rem', background: 'var(--bg-input, transparent)', color: 'var(--text)' };
const pillStyle = (tone) => ({ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: tone === 'good' ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'color-mix(in srgb, var(--text-muted) 12%, transparent)', color: tone === 'good' ? 'var(--success)' : 'var(--text-muted)' });

export function DatasetViewer({ org, dataset = null, versions = [], records = [] }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  if (!dataset) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Select a dataset to view its records.
      </div>
    );
  }

  const schemaFields = dataset.spec?.schema?.properties ? Object.keys(dataset.spec.schema.properties) : [];

  // Filter records by selected version and filter text
  const activeRecords = records.filter((r) => {
    if (selectedVersion && r.spec?.versionRef !== selectedVersion) return false;
    if (filterText) {
      const search = filterText.toLowerCase();
      const data = r.spec?.data || {};
      return Object.values(data).some((v) => String(v).toLowerCase().includes(search));
    }
    return true;
  });

  const totalPages = Math.ceil(activeRecords.length / pageSize);
  const pageRecords = activeRecords.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Version selector and filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {versions.length > 0 && (
          <select value={selectedVersion || ''} onChange={(e) => { setSelectedVersion(e.target.value || null); setPage(0); }} style={inputStyle}>
            <option value="">All versions</option>
            {versions.map((v) => (
              <option key={v.metadata?.name} value={v.metadata?.name}>v{v.spec?.version} ({v.spec?.recordCount || 0} records)</option>
            ))}
          </select>
        )}
        <input type="text" value={filterText} onChange={(e) => { setFilterText(e.target.value); setPage(0); }} placeholder="Filter records..." style={{ ...inputStyle, minWidth: '200px' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeRecords.length} records</span>
      </div>

      {/* Versions list */}
      {versions.length > 0 && !selectedVersion && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {versions.map((v) => (
            <button key={v.metadata?.name} style={btnSecondary} onClick={() => { setSelectedVersion(v.metadata?.name); setPage(0); }}>
              v{v.spec?.version}
              <span style={{ ...pillStyle('good'), marginLeft: '0.375rem' }}>{v.spec?.recordCount || 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Data table */}
      {pageRecords.length > 0 ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: '0.375rem', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>#</th>
                {(schemaFields.length ? schemaFields : Object.keys(pageRecords[0]?.spec?.data || {})).map((field) => (
                  <th key={field} style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600 }}>{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((record, i) => {
                const data = record.spec?.data || {};
                const fields = schemaFields.length ? schemaFields : Object.keys(data);
                return (
                  <tr key={record.metadata?.name || i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{page * pageSize + i + 1}</td>
                    {fields.map((field) => (
                      <td key={field} style={{ padding: '0.5rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {String(data[field] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {filterText ? 'No records match the filter.' : 'No records in this dataset. Upload data to get started.'}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <button style={btnSecondary} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Page {page + 1} of {totalPages}</span>
          <button style={btnSecondary} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
