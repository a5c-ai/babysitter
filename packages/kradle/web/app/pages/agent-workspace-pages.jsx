// Routes: /orgs/[org]/agents/workspaces, /agents/workspaces/[name] — agent workspace list and detail.
import { loadKradleUi, orgHref, StatusPill, DegradedBanner, EmptyState } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { WorkspacePanel } from '../components/workspace/workspace-panel.jsx';
import { WorkspaceEditForm } from '../components/workspace/workspace-edit-form.jsx';
import { ResourceActions, InlineCreateForm } from '../components/resource-crud-actions.jsx';
import { phaseTone } from './agent-helpers.jsx';

export async function AgentWorkspacesPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { workspaces: { count: 0, items: [] } };
  const workspaces = agentView.workspaces?.items || [];
  const workspaceFields = [
    { name: 'name', label: 'Name', placeholder: 'my-workspace', required: true },
    { name: 'description', label: 'Description', placeholder: 'What is this workspace for?', required: false },
    { name: 'repositoryRef', label: 'Repository', placeholder: 'https://github.com/org/repo', required: false }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent workspaces" title="Agent workspaces" text="Volume-backed git workspaces with PVC lifecycle, repo binding, and runner mount specs. Workspaces are reusable across runs." actions={[['/agents', 'Overview'], ['/agents/sessions', 'Sessions']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/workspaces', 'Workspaces']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="cardTitle"><h2>Workspaces</h2><StatusPill tone={workspaces.length ? 'good' : 'neutral'}>{workspaces.length} workspaces</StatusPill></div>
        {workspaces.length ? <div className="resourceTable">{workspaces.map((ws) => <div key={ws.metadata?.name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href={orgHref(activeOrg, `/agents/workspaces/${ws.metadata?.name}`)} style={{ textDecoration: 'none', display: 'contents' }}>
            <strong>{ws.metadata?.name}</strong>
            <span>{ws.spec?.repository || 'no repository'}</span>
            <StatusPill tone={phaseTone(ws.status?.phase)}>{ws.status?.phase || 'Pending'}</StatusPill>
            <StatusPill tone={ws.status?.volumeStatus === 'Bound' ? 'good' : ws.status?.volumeStatus === 'Pending' ? 'warn' : 'neutral'}>{ws.status?.volumeStatus ? `PVC: ${ws.status.volumeStatus}` : 'PVC: Unknown'}</StatusPill>
            <span>{ws.spec?.volumeSpec?.capacity || '10Gi'}</span>
            <small>{ws.spec?.branch || 'main'}</small>
            {ws.status?.runRef ? <small style={{ color: 'var(--accent)' }}>mounted: {ws.status.runRef}</small> : null}
          </a>
          <ResourceActions org={activeOrg} apiPath={`resources/KradleWorkspace/${ws.metadata?.name}`} actions={ws.status?.phase === 'Archived' ? ['delete'] : ws.status?.phase === 'InUse' ? ['archive', 'delete'] : ['archive', 'delete']} />
        </div>)}</div> : <EmptyState title="No agent workspaces" text="Workspaces are provisioned when runs start, or create one manually using the form." info />}
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="KradleWorkspace"
        title="Create workspace"
        fields={workspaceFields}
        successText="Workspace created"
      />
    </section>
  </PageFrame>;
}

export async function AgentWorkspaceDetailPage({ org = null, workspaceId } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { workspaces: { items: [] }, sessions: { items: [] } };
  const workspace = (agentView.workspaces?.items || []).find((w) => w.metadata?.name === workspaceId) || null;
  const runtimes = (ui.model.resources || []).find((r) => r.kind === 'KradleWorkspaceRuntime');
  const runtimeItems = runtimes?.items || [];
  const runtime = runtimeItems.find((r) => r.spec?.workspaceRef === workspaceId) || null;
  const boundSessions = workspace?.status?.boundSessions || [];
  const allWorkItemLinks = (ui.model.resources || []).find((r) => r.kind === 'WorkItemWorkspaceLink');
  const workItemLinks = (allWorkItemLinks?.items || []).filter((link) => link.spec?.workspace === workspaceId);
  const truncatePath = (path, maxLen = 60) => {
    if (!path) return '—';
    return path.length > maxLen ? '…' + path.slice(path.length - maxLen + 1) : path;
  };
  const firstSessionRef = boundSessions.length ? (boundSessions[0]?.sessionRef || boundSessions[0]) : null;
  const firstSession = firstSessionRef ? (agentView.sessions?.items || []).find((s) => s.metadata?.name === firstSessionRef) || null : null;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`workspace / ${workspaceId}`} title={workspaceId || 'Workspace detail'} text={workspace ? `Agent workspace for ${workspace.spec?.repository || 'unknown repository'} with phase ${workspace.status?.phase || 'Pending'}.` : 'This agent workspace was not found in the current workspace.'} actions={[['/agents/workspaces', 'All workspaces'], ['/agents/sessions', 'Sessions']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/workspaces', 'Workspaces'], [`/agents/workspaces/${workspaceId}`, workspaceId || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    {workspace ? <>
      <WorkspacePanel workspace={workspace} runtime={runtime} session={firstSession} org={activeOrg} />
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="cardTitle"><h3>Edit workspace</h3></div>
        <WorkspaceEditForm org={activeOrg} workspace={workspace} />
      </div>
    </> : <EmptyState title={`Workspace ${workspaceId} not found`} text="This agent workspace does not exist in the current workspace. Agent workspaces are provisioned when dispatch runs create git worktrees." cta={orgHref(activeOrg, '/agents/workspaces')} ctaLabel="View all workspaces" />}
  </PageFrame>;
}
