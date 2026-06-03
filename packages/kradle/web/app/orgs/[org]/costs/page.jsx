export const dynamic = 'force-dynamic';

import { loadKrateUi, orgHref, StatusPill, DegradedBanner } from '../../../lib/krate-ui.jsx';
import { PageFrame } from '../../../lib/page-frame.jsx';
import { loadPersistedEvents } from '@a5c-ai/krate-sdk';

export const metadata = { title: 'Costs | Krate' };

function formatUsd(amount) {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return `$${amount.toFixed(4)}`;
}

function formatTokens(count) {
  if (count == null) return '—';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export default async function CostsPage({ params }) {
  const { org } = await params;
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model?.org?.slug || org || 'default';

  // Load persisted events and extract cost data
  let events = [];
  try { events = loadPersistedEvents(500); } catch (err) { console.warn('Failed to load persisted cost events:', err.message || err); }
  const costEvents = events.filter(e =>
    e.type === 'virtual-model-observability' ||
    e.type === 'virtual-model-request' ||
    e.type === 'cost-tracked' ||
    (e.metrics && (e.metrics.costUsd != null || e.metrics.inputTokens != null))
  );

  // Aggregate by model
  const byModel = {};
  for (const event of costEvents) {
    const model = event.modelName || event.model || event.name || 'unknown';
    if (!byModel[model]) byModel[model] = { requests: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
    byModel[model].requests += 1;
    byModel[model].inputTokens += event.metrics?.inputTokens || 0;
    byModel[model].outputTokens += event.metrics?.outputTokens || 0;
    byModel[model].costUsd += event.metrics?.costUsd || event.metrics?.cost || 0;
  }

  // Aggregate by stack
  const runs = ui.model?.agents?.runs?.items || [];
  const byStack = {};
  for (const run of runs) {
    const stack = run.spec?.agentStack || 'unknown';
    if (!byStack[stack]) byStack[stack] = { runs: 0, completed: 0, failed: 0 };
    byStack[stack].runs += 1;
    const phase = run.status?.phase;
    if (phase === 'Completed' || phase === 'Succeeded') byStack[stack].completed += 1;
    if (phase === 'Failed') byStack[stack].failed += 1;
  }

  const totalCost = Object.values(byModel).reduce((s, m) => s + m.costUsd, 0);
  const totalRequests = Object.values(byModel).reduce((s, m) => s + m.requests, 0);
  const totalInputTokens = Object.values(byModel).reduce((s, m) => s + m.inputTokens, 0);
  const totalOutputTokens = Object.values(byModel).reduce((s, m) => s + m.outputTokens, 0);
  const modelEntries = Object.entries(byModel).sort((a, b) => b[1].costUsd - a[1].costUsd);
  const stackEntries = Object.entries(byStack).sort((a, b) => b[1].runs - a[1].runs);

  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model?.orgs || []}
      eyebrow="observability"
      title="Cost & Usage"
      text="Token usage, estimated costs, and request volume across models and agent stacks."
      currentPath="/costs"
      breadcrumbs={[['/', 'Krate'], ['/costs', 'Costs']]}
      actions={[['/insights', 'Health'], ['/agents/runs', 'Runs']]}
    >
      <DegradedBanner model={ui.model} />

      <section className="routeGrid four" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="cardTitle"><h3>Total cost</h3></div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{formatUsd(totalCost)}</div>
          <small style={{ color: 'var(--text-muted)' }}>Estimated from token usage</small>
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Requests</h3></div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{totalRequests}</div>
          <small style={{ color: 'var(--text-muted)' }}>Model completions tracked</small>
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Input tokens</h3></div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{formatTokens(totalInputTokens)}</div>
          <small style={{ color: 'var(--text-muted)' }}>Prompt tokens consumed</small>
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Output tokens</h3></div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{formatTokens(totalOutputTokens)}</div>
          <small style={{ color: 'var(--text-muted)' }}>Completion tokens generated</small>
        </div>
      </section>

      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardTitle"><h2>Cost by model</h2><StatusPill tone={modelEntries.length ? 'good' : 'neutral'}>{modelEntries.length} models</StatusPill></div>
          {modelEntries.length ? <div className="resourceTable">{modelEntries.map(([model, data]) => (
            <div key={model} className="resourceRow" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.75rem', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.85rem' }}>{model}</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.requests} req</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatTokens(data.inputTokens + data.outputTokens)} tok</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>{formatUsd(data.costUsd)}</span>
            </div>
          ))}</div> : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No cost data yet. Cost events appear after model completions with token tracking enabled.</p>}
        </div>

        <div className="card">
          <div className="cardTitle"><h2>Runs by stack</h2><StatusPill tone={stackEntries.length ? 'good' : 'neutral'}>{stackEntries.length} stacks</StatusPill></div>
          {stackEntries.length ? <div className="resourceTable">{stackEntries.map(([stack, data]) => (
            <div key={stack} className="resourceRow" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.75rem', alignItems: 'center' }}>
              <a href={orgHref(activeOrg, `/agents/stacks/${stack}`)} style={{ fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', color: 'var(--accent)' }}>{stack}</a>
              <span style={{ fontSize: '0.8rem' }}>{data.runs} runs</span>
              <StatusPill tone="good">{data.completed} ok</StatusPill>
              {data.failed > 0 ? <StatusPill tone="danger">{data.failed} failed</StatusPill> : <span />}
            </div>
          ))}</div> : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No dispatch runs recorded yet.</p>}
        </div>
      </section>

      {costEvents.length > 0 && <section className="card" style={{ marginTop: '1rem' }}>
        <div className="cardTitle"><h2>Recent cost events</h2><StatusPill tone="neutral">{costEvents.length} events</StatusPill></div>
        <div className="resourceTable">{costEvents.slice(-20).reverse().map((event, i) => (
          <div key={i} className="resourceRow" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
            <span>{event.modelName || event.model || '—'}</span>
            <span style={{ color: 'var(--text-muted)' }}>{event.type}</span>
            <span>{formatTokens((event.metrics?.inputTokens || 0) + (event.metrics?.outputTokens || 0))} tok</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatUsd(event.metrics?.costUsd || event.metrics?.cost)}</span>
          </div>
        ))}</div>
      </section>}
    </PageFrame>
  );
}
