'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InlineCreateForm } from '../resource-crud-actions.jsx';

const cardStyle = { padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-card, var(--bg-subtle))' };
const pillStyle = (tone) => ({ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, background: tone === 'good' ? 'color-mix(in srgb, var(--success) 12%, transparent)' : tone === 'warn' ? 'color-mix(in srgb, var(--warning) 12%, transparent)' : 'color-mix(in srgb, var(--text-muted) 12%, transparent)', color: tone === 'good' ? 'var(--success)' : tone === 'warn' ? 'var(--warning)' : 'var(--text-muted)' });

export function DatasetManager({ org, datasets: initialDatasets = [], versions: initialVersions = [] }) {
  const router = useRouter();
  const [datasets, setDatasets] = useState(initialDatasets);
  const versions = initialVersions;

  function handleCreated(body) {
    const item = body?.items?.[0] || body?.resource || body;
    if (item?.metadata?.name) setDatasets((prev) => [...prev, item]);
    else router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Datasets</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{datasets.length} configured</p>
            </div>
          </div>

          {datasets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No datasets yet. Create one to manage structured data for training, evaluation, or reference.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {datasets.map((dataset) => {
                const name = dataset.metadata?.name || 'unnamed';
                const datasetVersions = versions.filter((v) => v.spec?.datasetRef === name);
                const latestVersion = datasetVersions.sort((a, b) => (b.spec?.version || '').localeCompare(a.spec?.version || ''))[0];
                const schemaFields = dataset.spec?.schema ? Object.keys(dataset.spec.schema.properties || dataset.spec.schema).length : 0;
                return (
                  <a key={name} href={`datasets/${name}`} style={{ ...cardStyle, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{dataset.spec?.displayName || name}</h4>
                      <span style={pillStyle(datasetVersions.length ? 'good' : 'neutral')}>{datasetVersions.length} versions</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {schemaFields > 0 ? `${schemaFields} fields` : 'No schema defined'}
                      {latestVersion ? ` · v${latestVersion.spec?.version}` : ''}
                      {latestVersion?.spec?.recordCount ? ` · ${latestVersion.spec.recordCount} records` : ''}
                    </p>
                    {dataset.spec?.description && (
                      <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dataset.spec.description}</p>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <InlineCreateForm
          org={org}
          kind="Dataset"
          title="Create dataset"
          fields={[
            { name: 'name', label: 'Name', placeholder: 'my-dataset' },
            { name: 'displayName', label: 'Display name', placeholder: 'My Dataset' },
            { name: 'description', label: 'Description', placeholder: 'Dataset purpose', required: false },
            { name: 'schemaFields', label: 'Schema fields (comma-separated)', placeholder: 'input, output, label, score' }
          ]}
          buildSpec={(fd) => {
            const fields = (fd.get('schemaFields') || '').split(',').map((s) => s.trim()).filter(Boolean);
            const properties = {};
            for (const field of fields) properties[field] = { type: 'string' };
            return {
              displayName: fd.get('displayName'),
              description: fd.get('description') || '',
              schema: { type: 'object', properties }
            };
          }}
          successText={(body) => `Created dataset ${body?.resource?.metadata?.name || ''}`}
        />
      </section>
    </div>
  );
}
