// Routes: /orgs/[org]/agents/rules, /agents/rules/[name], /agents/rules/new — trigger rule management.
import { loadKradleUi, orgHref, StatusPill, DegradedBanner, EmptyState } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { TriggerRuleForm } from '../components/agent/trigger-rule-form.jsx';
import { TriggerRuleEditForm } from '../components/agent/trigger-rule-edit-form.jsx';
import { EnableDisableToggle, DeleteRuleButton } from '../components/agent/rule-actions.jsx';

export async function AgentRulesPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { rules: { count: 0, items: [] } };
  const rules = agentView.rules.items || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent trigger rules" title="Trigger rules" text="Trigger rules define which events dispatch agent runs and which stack handles them." actions={[['/agents/rules/new', 'Create rule'], ['/agents', 'Overview'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/rules', 'Trigger rules']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <div className="cardTitle"><h2>Trigger rules</h2><StatusPill tone={rules.length ? 'good' : 'neutral'}>{rules.length} rules</StatusPill></div>
      {rules.length ? <div className="resourceTable">{rules.map((rule) => <div key={rule.metadata?.name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a href={orgHref(activeOrg, `/agents/rules/${rule.metadata?.name}`)} style={{ textDecoration: 'none', flex: '1 1 auto', display: 'contents' }}>
          <strong>{rule.metadata?.name}</strong>
          <span>{(rule.spec?.sources || []).join(', ') || 'all sources'}</span>
          <span>{rule.spec?.stackRef || rule.spec?.targetStack || 'unassigned'}</span>
          <span>{rule.spec?.taskKind || 'default'}</span>
          <small>{rule.status?.phase || 'Pending'}</small>
        </a>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <EnableDisableToggle org={activeOrg} ruleName={rule.metadata?.name} enabled={rule.spec?.enabled !== false && rule.status?.phase !== 'Disabled'} />
          <DeleteRuleButton org={activeOrg} ruleName={rule.metadata?.name} />
        </span>
      </div>)}</div> : <EmptyState title="No trigger rules configured" text="Create your first trigger rule to start dispatching agent runs on events." cta={orgHref(activeOrg, '/agents/rules/new')} ctaLabel="Create rule" />}
    </div>
  </PageFrame>;
}

export async function AgentRuleDetailPage({ org = null, ruleName } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { rules: { items: [] }, triggerExecutions: { items: [] }, stacks: { items: [] } };
  const rule = (agentView.rules.items || []).find((r) => r.metadata?.name === ruleName) || null;
  const agentStack = rule?.spec?.agentStack || rule?.spec?.stackRef || rule?.spec?.targetStack || null;
  const sources = rule?.spec?.sources || [];
  const taskKind = rule?.spec?.taskKind || 'default';
  const repository = rule?.spec?.repository || null;
  const allowedActors = rule?.spec?.allowedActors || null;
  const executions = (agentView.triggerExecutions?.items || []).filter((exec) => exec.spec?.triggerRule === ruleName || exec.spec?.ruleRef === ruleName);
  const decisionTone = (decision) => {
    if (!decision) return 'neutral';
    const d = decision.toLowerCase();
    if (d === 'dispatched') return 'good';
    if (d === 'skipped') return 'neutral';
    if (d === 'deduplicated') return 'warn';
    if (d === 'failed') return 'danger';
    return 'neutral';
  };
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`trigger rule / ${ruleName}`} title={ruleName || 'Rule detail'} text={rule ? `Trigger rule targeting ${agentStack || 'unknown stack'} with ${sources.length ? sources.join(', ') : 'all'} sources.` : 'This trigger rule was not found in the current workspace.'} actions={[['/agents/rules', 'All rules'], ['/agents/rules/new', 'New rule'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/rules', 'Trigger rules'], [`/agents/rules/${ruleName}`, ruleName || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    {rule ? <>
      <section className="routeGrid two">
        <div className="card">
          <div className="cardTitle"><h3>Configuration</h3><StatusPill tone={rule.status?.phase === 'Active' || rule.status?.phase === 'Ready' ? 'good' : rule.status?.phase === 'Failed' ? 'danger' : 'neutral'}>{rule.status?.phase || 'Pending'}</StatusPill></div>
          <dl className="kv">
            <dt>Sources</dt><dd>{sources.length ? sources.map((source) => <span key={source} className="pill neutral" style={{ marginRight: '0.25rem', fontSize: '0.75rem' }}>{source}</span>) : <span className="pill neutral" style={{ fontSize: '0.75rem' }}>all sources</span>}</dd>
            <dt>Target stack</dt><dd>{agentStack ? <a href={orgHref(activeOrg, `/agents/stacks/${agentStack}`)}>{agentStack}</a> : 'not assigned'}</dd>
            <dt>Task kind</dt><dd>{taskKind}</dd>
            <dt>Repository scope</dt><dd>{repository || 'All repositories'}</dd>
            <dt>Actor filter</dt><dd>{allowedActors && allowedActors.length ? allowedActors.join(', ') : 'Any actor'}</dd>
          </dl>
          <TriggerRuleEditForm org={activeOrg} rule={rule} />
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Metadata</h3><StatusPill tone="neutral">resource</StatusPill></div>
          <dl className="kv">
            <dt>Name</dt><dd>{rule.metadata?.name}</dd>
            <dt>Namespace</dt><dd>{rule.metadata?.namespace || ui.model.namespace}</dd>
            <dt>Organization</dt><dd>{rule.spec?.organizationRef || activeOrg}</dd>
            <dt>Created</dt><dd>{rule.metadata?.creationTimestamp || 'unknown'}</dd>
          </dl>
        </div>
      </section>
      <div className="card">
        <div className="cardTitle"><h2>Execution history</h2><StatusPill tone={executions.length ? 'good' : 'neutral'}>{executions.length} executions</StatusPill></div>
        {executions.length ? <div className="resourceTable">{executions.map((exec) => <div key={exec.metadata?.name} className="resourceRow">
          <strong>{exec.spec?.event || exec.spec?.eventType || 'event'}</strong>
          <StatusPill tone={decisionTone(exec.status?.decision || exec.spec?.decision)}>{exec.status?.decision || exec.spec?.decision || 'unknown'}</StatusPill>
          <span>{exec.status?.dispatchRun || exec.spec?.dispatchRun ? <a href={orgHref(activeOrg, `/agents/runs/${exec.status?.dispatchRun || exec.spec?.dispatchRun}`)}>{exec.status?.dispatchRun || exec.spec?.dispatchRun}</a> : 'no run'}</span>
          <small>{exec.metadata?.creationTimestamp || exec.status?.timestamp || ''}</small>
        </div>)}</div> : <EmptyState title="No trigger executions yet" text="Execution records appear when events match this trigger rule. Each execution shows the event, decision, and any dispatched run." cta={orgHref(activeOrg, '/agents/runs')} ctaLabel="View dispatch runs" />}
      </div>
    </> : <EmptyState title={`Rule ${ruleName} not found`} text="This trigger rule does not exist in the current workspace. Trigger rules are created through resource definitions." cta={orgHref(activeOrg, '/agents/rules')} ctaLabel="View all rules" />}
  </PageFrame>;
}

export async function AgentRuleBuilderPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { stacks: { items: [] } };
  const stacks = (agentView.stacks?.items || []).map(s => s.metadata?.name).filter(Boolean);
  const exampleYaml = `apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentTriggerRule
metadata:
  name: my-trigger-rule
  namespace: kradle-system
spec:
  organizationRef: ${activeOrg}
  sources:
    - push
  agentStack: my-diagnostic-stack
  taskKind: diagnostic`;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="new trigger rule" title="Create trigger rule" text="Define which events dispatch agent runs and which stack handles them." actions={[['/agents/rules', 'All rules'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/rules', 'Trigger rules'], ['/agents/rules/new', 'New rule']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two">
      <TriggerRuleForm org={activeOrg} stacks={stacks} />
      <div className="card">
        <div className="cardTitle"><h3>Resource definition</h3><StatusPill tone="neutral">example</StatusPill></div>
        <pre style={{ background: 'var(--bg)', color: 'var(--text)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', lineHeight: '1.6', overflow: 'auto' }}><code>{exampleYaml}</code></pre>
      </div>
    </section>
  </PageFrame>;
}
