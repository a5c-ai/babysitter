export const dynamic = 'force-dynamic';

import { loadKrateUi, orgHref, StatusPill, DegradedBanner } from '../../../lib/krate-ui.jsx';
import { PageFrame } from '../../../lib/page-frame.jsx';

export const metadata = { title: 'Getting Started | Krate' };

function StepCard({ number, title, description, href, done, org }) {
  return (
    <a href={orgHref(org, href)} style={{
      display: 'flex', gap: '1rem', padding: '1rem', border: `1px solid ${done ? 'var(--success, #22c55e)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--text)',
      background: done ? 'rgba(34, 197, 94, 0.04)' : 'var(--surface)', transition: 'border-color 0.15s',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
        background: done ? 'var(--success, #22c55e)' : 'var(--surface-overlay)', color: done ? '#fff' : 'var(--text-muted)',
        fontWeight: 700, fontSize: '0.85rem',
      }}>
        {done ? '✓' : number}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{description}</div>
      </div>
    </a>
  );
}

export default async function GettingStartedPage({ params }) {
  const { org } = await params;
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model?.org?.slug || org || 'default';
  const model = ui.model || {};
  const agents = model.agents || {};

  const hasRepos = (model.resources?.find?.(r => r.kind === 'Repository')?.items?.length || 0) > 0;
  const hasStacks = (agents.stacks?.items?.length || 0) > 0;
  const hasRules = (agents.rules?.items?.length || 0) > 0;
  const hasRuns = (agents.runs?.items?.length || 0) > 0;
  const hasProviders = (model.resources || []).some(r =>
    ['GitProvider', 'CiProvider', 'AppHostingProvider'].includes(r.kind) && r.items?.length > 0
  );
  const hasSecrets = (model.resources?.find?.(r => r.kind === 'AgentSecretGrant')?.items?.length || 0) > 0;

  const steps = [
    { number: 1, title: 'Create a repository', description: 'Start hosting code with Krate-managed repositories.', href: '/repositories', done: hasRepos },
    { number: 2, title: 'Connect an external provider', description: 'Link GitHub, GitLab, Vercel, or other platforms.', href: '/external/providers/new', done: hasProviders },
    { number: 3, title: 'Configure secrets', description: 'Add API keys and credentials for agent access.', href: '/settings/secrets', done: hasSecrets },
    { number: 4, title: 'Create an agent stack', description: 'Define a reusable agent with model, tools, and identity.', href: '/agents/stacks/new', done: hasStacks },
    { number: 5, title: 'Set up trigger rules', description: 'Automate agent dispatch on push, PR, or schedule.', href: '/agents/rules/new', done: hasRules },
    { number: 6, title: 'Dispatch your first run', description: 'Manually trigger an agent and watch it work.', href: '/agents/runs', done: hasRuns },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model?.orgs || []}
      eyebrow="onboarding"
      title="Getting Started"
      text={allDone ? 'Your workspace is fully configured. Explore the platform or check the docs.' : `Complete these ${steps.length} steps to set up your Krate workspace.`}
      currentPath="/getting-started"
      breadcrumbs={[['/', 'Krate'], ['/getting-started', 'Getting Started']]}
      actions={[['/for-agents', 'For Agents'], ['/api-docs', 'API Docs']]}
    >
      <DegradedBanner model={ui.model} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--surface-overlay)' }}>
          <div style={{ width: `${(completedCount / steps.length) * 100}%`, height: '100%', borderRadius: 4, background: 'var(--success, #22c55e)', transition: 'width 0.3s' }} />
        </div>
        <StatusPill tone={allDone ? 'good' : completedCount > 0 ? 'warn' : 'neutral'}>{completedCount}/{steps.length}</StatusPill>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {steps.map((step) => <StepCard key={step.number} {...step} org={activeOrg} />)}
      </div>

      {allDone && <section className="card" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem' }}>You're all set!</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem' }}>Your workspace has repositories, providers, secrets, stacks, rules, and dispatch runs configured.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={orgHref(activeOrg, '/playground')} style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Try the Playground</a>
          <a href={orgHref(activeOrg, '/models')} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Browse Models</a>
          <a href={orgHref(activeOrg, '/for-agents')} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Connect MCP</a>
        </div>
      </section>}
    </PageFrame>
  );
}
