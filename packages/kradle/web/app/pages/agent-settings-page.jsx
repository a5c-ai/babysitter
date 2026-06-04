// Routes: /orgs/[org]/agents/settings — gateway, adapter, provider, and RBAC configuration.
import { loadKradleUi, orgHref, StatusPill, DegradedBanner } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { AgentSettingsForm } from '../components/agent/agent-settings-form.jsx';

export async function AgentSettingsPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { stacks: { count: 0 }, runs: { count: 0 }, rules: { count: 0 }, sessions: { count: 0 }, workspaces: { count: 0 }, approvals: { count: 0 }, adapters: { count: 0, items: [] }, providers: { count: 0, items: [] }, gateway: null };
  const gateway = agentView.gateway;
  const adapters = agentView.adapters?.items || [];
  const providers = agentView.providers?.items || [];
  const gatewayReady = gateway?.status?.conditions?.find((c) => c.type === 'Ready');
  const agentsEnabled = (agentView.stacks?.count || 0) > 0 || gateway != null;
  const agentMuxConnected = gateway != null && gatewayReady?.status === 'True';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent settings" title="Agent settings" text="Configure the gateway connection, adapter bindings, and provider credentials for this org." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/settings', 'Settings']]}>
    <DegradedBanner model={ui.model} />
    <AgentSettingsForm org={activeOrg} gateway={gateway} adapters={adapters} providers={providers} />
    <div className="card">
      <div className="cardTitle"><h2>System info</h2><StatusPill tone="neutral">overview</StatusPill></div>
      <div className="metricGrid">
        <a href={orgHref(activeOrg, '/agents/stacks')}><strong>{agentView.stacks?.count || 0}</strong><span>Stacks</span></a>
        <a href={orgHref(activeOrg, '/agents/rules')}><strong>{agentView.rules?.count || 0}</strong><span>Rules</span></a>
        <a href={orgHref(activeOrg, '/agents/sessions')}><strong>{agentView.sessions?.count || 0}</strong><span>Sessions</span></a>
        <a href={orgHref(activeOrg, '/agents/workspaces')}><strong>{agentView.workspaces?.count || 0}</strong><span>Workspaces</span></a>
        <a href={orgHref(activeOrg, '/agents/approvals')}><strong>{agentView.approvals?.count || 0}</strong><span>Approvals</span></a>
        <a href={orgHref(activeOrg, '/agents/runs')}><strong>{agentView.runs?.count || 0}</strong><span>Runs</span></a>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <span>Agents: <strong style={{ color: agentsEnabled ? '#22c55e' : '#9ca3af' }}>{agentsEnabled ? 'enabled' : 'disabled'}</strong></span>
        <span>Agent Mux: <strong style={{ color: agentMuxConnected ? '#22c55e' : '#9ca3af' }}>{agentMuxConnected ? 'connected' : 'not configured'}</strong></span>
      </div>
    </div>
  </PageFrame>;
}
