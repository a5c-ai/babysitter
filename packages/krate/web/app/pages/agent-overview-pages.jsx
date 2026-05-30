// Routes: /orgs/[org]/agents, /agents/stacks, /agents/stacks/[name], /agents/stacks/new — agent dashboard and stack management.
import { loadKrateUi, orgHref, StatusPill, DegradedBanner, EmptyState, InfoList } from '../lib/krate-ui.jsx';
import { resourceToYaml } from '@a5c-ai/krate-sdk';
import { PageFrame } from '../lib/page-frame.jsx';
import { DispatchButton } from '../components/agent/dispatch-button.jsx';
import { GraphStackBuilder } from '../components/agent/stack-builder-graph.jsx';
import { LiveUpdates } from '../components/agent/live-updates.jsx';
import { StackActions } from '../components/agent/stack-actions.jsx';
import { StackEditForm } from '../components/agent/stack-edit-form.jsx';
import { CopyButton } from '../components/inference/inference-helpers.jsx';
import { phaseTone } from './agent-helpers.jsx';

export async function AgentsDashboardPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { stacks: { count: 0 }, runs: { count: 0, active: [] }, rules: { count: 0 }, approvals: { count: 0, pending: [] } };
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent orchestration" title="Agent stacks, runs, and rules" text="View agent stacks, dispatch runs, trigger rules, and pending approvals from one place." actions={[['/agents/stacks', 'View stacks'], ['/agents/runs', 'View runs']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
      <DispatchButton org={activeOrg} stacks={agentView.stacks?.items || []} meetings={agentView.meetings?.active || []} />
      <LiveUpdates org={activeOrg} />
    </div>
    <section className="routeGrid two">
      <div className="card">
        <div className="cardTitle"><h2>Agent overview</h2><StatusPill tone={agentView.stacks?.count ? 'good' : 'neutral'}>{ui.model.status}</StatusPill></div>
        <div className="metricGrid">
          <a href={orgHref(activeOrg, '/agents/stacks')}><strong>{agentView.stacks?.count || 0}</strong><span>Agent stacks</span></a>
          <a href={orgHref(activeOrg, '/agents/runs')}><strong>{agentView.runs?.active?.length || 0}</strong><span>Active runs</span></a>
          <a href={orgHref(activeOrg, '/agents/runs')}><strong>{agentView.approvals?.pending?.length || 0}</strong><span>Pending approvals</span></a>
          <a href={orgHref(activeOrg, '/agents/rules')}><strong>{agentView.rules?.count || 0}</strong><span>Trigger rules</span></a>
        </div>
        <InfoList title="Quick links" items={['View and inspect agent stack configurations', 'Monitor dispatch runs and their phases', 'Review trigger rules and delivery targets']} />
      </div>
      <div className="card">
        <div className="cardTitle"><h2>Recent activity</h2><StatusPill tone={agentView.runs.active?.length ? 'warn' : 'neutral'}>{agentView.runs.active?.length || 0} active</StatusPill></div>
        {agentView.runs.items?.length ? <ul className="resourceList">{agentView.runs.items.slice(0, 5).map((run) => <li key={run.metadata?.name}><a href={orgHref(activeOrg, `/agents/runs/${run.metadata?.name}`)}><strong>{run.metadata?.name}</strong></a><span>{run.spec?.stackRef || 'unassigned'} {run.spec?.repository ? `/ ${run.spec.repository}` : ''}</span><small>Phase: {run.status?.phase || 'Pending'}{run.status?.startedAt ? ` / Started: ${run.status.startedAt}` : ''}</small></li>)}</ul> : <EmptyState title="No dispatch runs yet" text="Dispatch runs appear when agent stacks are triggered by rules or manual dispatch." cta={orgHref(activeOrg, '/agents/runs')} ctaLabel="Dispatch an agent" />}
      </div>
    </section>
  </PageFrame>;
}

export async function AgentStacksPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { stacks: { count: 0, items: [] } };
  const stacks = agentView.stacks.items || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent stacks" title="Agent stack configurations" text="Each agent stack defines a base agent, adapter, runtime identity, and capability gates." actions={[['/agents', 'Overview'], ['/agents/runs', 'Dispatch runs'], [orgHref(activeOrg, '/agents/stacks/new'), 'Create Stack']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/stacks', 'Stacks']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <div className="cardTitle"><h2>Stacks</h2><StatusPill tone={stacks.length ? 'good' : 'neutral'}>{stacks.length} stacks</StatusPill></div>
      {stacks.length ? <div className="resourceTable">{stacks.map((stack) => <div key={stack.metadata?.name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href={orgHref(activeOrg, `/agents/stacks/${stack.metadata?.name}`)} style={{ textDecoration: 'none', flex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
          <strong>{stack.metadata?.name}</strong>
          <span>{stack.spec?.adapter || 'default'}</span>
          <span>{typeof stack.spec?.runtimeIdentity === 'object' ? (stack.spec.runtimeIdentity.serviceAccountRef || 'sa') : (stack.spec?.runtimeIdentity || stack.spec?.identity || 'workspace')}</span>
          <small>{stack.status?.phase || 'Pending'}</small>
        </a>
        <StackActions org={activeOrg} stackName={stack.metadata?.name} />
      </div>)}</div> : <EmptyState title="No agent stacks" text="Create your first agent stack to get started."><a href={orgHref(activeOrg, '/agents/stacks/new')}>Create Stack</a></EmptyState>}
    </div>
  </PageFrame>;
}

export async function AgentStackDetailPage({ org = null, name } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { stacks: { items: [] }, rules: { items: [] } };
  const stack = (agentView.stacks.items || []).find((s) => s.metadata?.name === name) || null;
  const relatedRules = (agentView.rules.items || []).filter((rule) => rule.spec?.stackRef === name || rule.spec?.targetStack === name);
  const conditions = stack?.status?.conditions || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`agent stack / ${name}`} title={name || 'Stack detail'} text={stack ? `Agent stack using ${stack.spec?.adapter || 'default'} adapter with ${typeof stack.spec?.runtimeIdentity === 'object' ? (stack.spec.runtimeIdentity.serviceAccountRef || 'sa') : (stack.spec?.runtimeIdentity || 'workspace')} identity.` : 'This agent stack was not found in the current workspace.'} actions={[[orgHref(activeOrg, '/agents/stacks'), 'All stacks'], ['/agents/runs', 'Dispatch runs']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/stacks', 'Stacks'], [`/agents/stacks/${name}`, name || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two">
      <div className="card">
        <div className="cardTitle"><h3>Stack configuration</h3><StatusPill tone={stack ? 'good' : 'warn'}>{stack?.status?.phase || 'not found'}</StatusPill></div>
        {stack ? <><dl className="kv">
          <dt>Name</dt><dd>{stack.metadata?.name}</dd>
          <dt>Namespace</dt><dd>{stack.metadata?.namespace || ui.model.namespace}</dd>
          <dt>Base agent</dt><dd>{stack.spec?.baseAgent || stack.spec?.agent || 'not specified'}</dd>
          <dt>Adapter</dt><dd>{stack.spec?.adapter || 'default'}</dd>
          <dt>Runtime identity</dt><dd>{typeof stack.spec?.runtimeIdentity === 'object' ? (stack.spec.runtimeIdentity.serviceAccountRef || JSON.stringify(stack.spec.runtimeIdentity)) : (stack.spec?.runtimeIdentity || stack.spec?.identity || 'workspace')}</dd>
          <dt>Phase</dt><dd>{stack.status?.phase || 'Pending'}</dd>
          {stack.spec?.displayName ? <><dt>Display name</dt><dd>{stack.spec.displayName}</dd></> : null}
          {stack.spec?.description ? <><dt>Description</dt><dd>{stack.spec.description}</dd></> : null}
          {stack.spec?.providerRef ? <><dt>Provider</dt><dd>{stack.spec.providerRef}</dd></> : null}
          {stack.spec?.model ? <><dt>Model</dt><dd>{stack.spec.model}</dd></> : null}
          {stack.spec?.maxTokens ? <><dt>Max tokens</dt><dd>{stack.spec.maxTokens}</dd></> : null}
          {stack.spec?.budgetLimitUsd ? <><dt>Budget limit</dt><dd>${stack.spec.budgetLimitUsd}</dd></> : null}
        </dl><StackEditForm org={activeOrg} stack={stack} /><div style={{ marginTop: 12, display: 'flex', gap: '0.5rem', alignItems: 'center' }}><StackActions org={activeOrg} stackName={name} /><CopyButton text={resourceToYaml(stack)} label="Copy as YAML" /></div></> : <EmptyState title={`Stack ${name} not found`} text="This agent stack does not exist in the current workspace. Create it through Krate resource definitions." cta={orgHref(activeOrg, '/agents/stacks')} ctaLabel="View all stacks" />}
      </div>
      <div className="stack">
        <div className="card">
          <div className="cardTitle"><h3>Trigger rules</h3><StatusPill tone={relatedRules.length ? 'good' : 'neutral'}>{relatedRules.length} rules</StatusPill></div>
          {relatedRules.length ? <ul className="compactList">{relatedRules.map((rule) => <li key={rule.metadata?.name}><strong>{rule.metadata?.name}</strong> / {(rule.spec?.sources || []).join(', ') || 'all sources'} / {rule.spec?.taskKind || 'default'} / {rule.status?.phase || 'Pending'}</li>)}</ul> : <p className="emptyText">No trigger rules target this stack.</p>}
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Capability conditions</h3><StatusPill tone={conditions.length ? 'good' : 'neutral'}>{conditions.length} conditions</StatusPill></div>
          {conditions.length ? <ul className="compactList">{conditions.map((cond) => <li key={cond.type || cond.reason}>{cond.type || cond.reason}: {cond.status === 'True' ? 'ready' : cond.status === 'False' ? 'needs attention' : cond.status || 'unknown'}{cond.message ? ` / ${cond.message}` : ''}</li>)}</ul> : <p className="emptyText">No capability status conditions reported.</p>}
        </div>
      </div>
    </section>
  </PageFrame>;
}

export async function AgentStackBuilderPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const atlasBaseUrl = process.env.ATLAS_BASE_URL || 'https://atlas.a5c.ai';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent stack" title="New agent stack" text="Build an agent stack from Atlas knowledge-graph layers. Select models, providers, runtimes, tools, and more from the live catalog." actions={[['/agents/stacks', 'All stacks'], ['/agents', 'Overview']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/stacks', 'Stacks'], ['/agents/stacks/new', 'New']]}>
    <DegradedBanner model={ui.model} />
    <GraphStackBuilder org={activeOrg} atlasBaseUrl={atlasBaseUrl} />
  </PageFrame>;
}
