export const dynamic = 'force-dynamic';

import { loadKrateUi, DegradedBanner } from '../../../lib/krate-ui.jsx';
import { PageFrame } from '../../../lib/page-frame.jsx';
import { CURATED_MODELS, MODEL_CATEGORIES } from '../../../lib/model-catalog-data.js';

export const metadata = { title: 'Model Catalog | Krate' };

const CATEGORY_COLORS = {
  LLM: '#8b5cf6', Code: '#3b82f6', Embedding: '#06b6d4',
  Vision: '#ec4899', Speech: '#f59e0b', 'Classical ML': '#16a34a',
};

export default async function ModelsPage({ params }) {
  const { org } = await params;
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model?.org?.slug || org || 'default';

  const grouped = {};
  for (const cat of MODEL_CATEGORIES) grouped[cat] = [];
  for (const m of CURATED_MODELS) grouped[m.category].push(m);

  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model?.orgs || []}
      eyebrow="model catalog"
      title="Models"
      text="Browse available models and deploy them to the cluster. Each model comes pre-configured with the right runtime, format, and resource requirements."
      currentPath="/models"
      breadcrumbs={[['/', 'Krate'], ['/models', 'Models']]}
      actions={[['/inference', 'Manage Services'], ['/for-agents', 'For Agents']]}
    >
      <DegradedBanner model={ui.model} />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {MODEL_CATEGORIES.map((cat) => (
          <a key={cat} href={`#${cat.toLowerCase().replace(/\s+/g, '-')}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem', borderRadius: '999px',
            border: `1px solid ${CATEGORY_COLORS[cat] || '#d1d5db'}`,
            color: CATEGORY_COLORS[cat] || 'var(--text)',
            background: 'var(--surface)', textDecoration: 'none',
            fontSize: '0.8rem', fontWeight: 600,
          }}>
            {cat}
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{grouped[cat]?.length || 0}</span>
          </a>
        ))}
      </div>

      {MODEL_CATEGORIES.map((cat) => (
        <section key={cat} id={cat.toLowerCase().replace(/\s+/g, '-')} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: CATEGORY_COLORS[cat] || 'var(--text)' }}>{cat}</h2>
          <div className="routeGrid three">
            {(grouped[cat] || []).map((model) => (
              <div key={model.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem' }}>{model.name}</h3>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.125rem 0.5rem',
                    borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em',
                    background: model.gpu ? 'rgba(249, 115, 22, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: model.gpu ? '#ea580c' : '#16a34a',
                    border: `1px solid ${model.gpu ? 'rgba(249, 115, 22, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                  }}>
                    {model.gpu ? `GPU ×${model.minGpu}` : 'CPU'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{model.description}</p>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'var(--surface-overlay)', color: 'var(--text-muted)' }}>{model.provider}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'var(--surface-overlay)', color: 'var(--text-muted)' }}>{model.modelFormat}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'var(--surface-overlay)', color: 'var(--text-muted)' }}>{model.minMemory}</span>
                </div>
                <a href={`/orgs/${activeOrg}/inference`} style={{
                  display: 'block', textAlign: 'center', marginTop: '0.25rem',
                  padding: '0.375rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent, #2563eb)', color: '#fff',
                  textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  Deploy
                </a>
              </div>
            ))}
          </div>
        </section>
      ))}
    </PageFrame>
  );
}
