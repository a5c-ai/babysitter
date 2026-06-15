// Routes: /orgs/[org]/agents/projects, /agents/projects/[name] — agent project boards and issue triage.
import { loadKradleUi, orgHref, StatusPill, DegradedBanner, EmptyState } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { EnhancedKanbanBoard } from '../components/kanban/kanban-enhanced.jsx';
import { ProjectEditForm } from '../components/agent/project-edit-form.jsx';
import { ResourceActions, InlineCreateForm } from '../components/resource-crud-actions.jsx';
import { IssueWorkspace, issuesForScope, IssueDetailView } from './agent-helpers.jsx';

export async function AgentProjectsPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { projects: { count: 0, items: [] }, stacks: { items: [] } };
  const projects = agentView.projects?.items || [];
  const stacks = agentView.stacks?.items || [];
  const projectFields = [
    { name: 'name', label: 'Name', placeholder: 'my-project', required: true },
    { name: 'displayName', label: 'Display name', placeholder: 'My Project', required: false },
    { name: 'description', label: 'Description', placeholder: 'What is this project for?', required: false },
    { name: 'workflow', label: 'Workflow columns', placeholder: 'todo,in-progress,review,done', required: false }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent projects" title="Projects" text="Organize agent work into projects with kanban boards, linked stacks, and tracked issues." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/projects', 'Projects']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div>
        {projects.length ? <section className="routeGrid three" style={{ gridColumn: '1 / -1' }}>{projects.map((project) => {
          const name = project.metadata?.name;
          const displayName = project.spec?.displayName || name;
          const linkedStacks = (project.spec?.stackRefs || []).length || (stacks.filter((s) => s.spec?.projectRef === name).length);
          const phase = project.status?.phase || 'Active';
          const projectTone = phase === 'Active' ? 'good' : phase === 'Archived' ? 'neutral' : 'warn';
          return <div key={name} className="card quickAction" style={{ position: 'relative' }}>
            <a href={orgHref(activeOrg, `/agents/projects/${name}`)} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="cardTitle"><h3>{displayName}</h3><StatusPill tone={projectTone}>{phase}</StatusPill></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{project.spec?.description || 'No description'}</p>
              <small>{linkedStacks} linked stack{linkedStacks === 1 ? '' : 's'}</small>
            </a>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem' }}>
              <ResourceActions org={activeOrg} apiPath={`resources/KradleProject/${name}`} actions={['archive', 'delete']} />
            </div>
          </div>;
        })}</section> : <EmptyState title="No projects yet" text="Projects organize agent work into boards with columns. Use the form on the right to create your first project." cta={orgHref(activeOrg, '/agents')} ctaLabel="Agent overview" />}
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="KradleProject"
        title="Create project"
        fields={projectFields}
        successText="Project created"
      />
    </section>
  </PageFrame>;
}

export async function AgentProjectBoardPage({ org = null, projectId } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { projects: { items: [] }, stacks: { items: [] } };
  const project = (agentView.projects?.items || []).find((p) => p.metadata?.name === projectId) || null;
  const displayName = project?.spec?.displayName || projectId || 'Project';
  const boardItems = project?.spec?.boardItems || project?.status?.boardItems || [];
  const workspaces = agentView.workspaces?.items || [];
  const sessions = agentView.sessions?.items || [];
  const enrichedItems = boardItems.map((item) => {
    const itemName = item.metadata?.name || item.spec?.title;
    const ws = workspaces.find(
      (w) => w.spec?.boardItemRef === itemName || w.metadata?.labels?.['kradle.a5c.ai/board-item'] === itemName
    );
    const sess = sessions.find(
      (s) => s.spec?.boardItemRef === itemName || s.metadata?.labels?.['kradle.a5c.ai/board-item'] === itemName
    );
    return {
      ...item,
      workspaceRef: ws?.metadata?.name || item.workspaceRef || null,
      workspacePvcStatus: ws?.status?.pvcPhase || ws?.status?.storagePhase || (ws ? 'Unknown' : null),
      sessionRef: sess?.metadata?.name || item.sessionRef || null,
      sessionStatus: sess?.status?.phase || null,
    };
  });
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`project / ${displayName}`} title={displayName} text={project ? (project.spec?.description || `Kanban board for project ${displayName}.`) : 'This project was not found in the current workspace.'} actions={[[`/agents/projects/${projectId}/issues`, 'Issue view'], ['/agents/projects', 'All projects'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/projects', 'Projects'], [`/agents/projects/${projectId}`, displayName]]}>
    <DegradedBanner model={ui.model} />
    {project ? <>
      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardTitle"><h3>Project details</h3><StatusPill tone={project.status?.phase === 'Active' ? 'good' : 'neutral'}>{project.status?.phase || 'Active'}</StatusPill></div>
          <dl className="kv">
            <dt>Name</dt><dd>{project.metadata?.name}</dd>
            <dt>Display name</dt><dd>{project.spec?.displayName || project.metadata?.name}</dd>
            <dt>Description</dt><dd>{project.spec?.description || 'No description'}</dd>
            <dt>Workflow</dt><dd>{(project.spec?.workflow || project.spec?.workflowColumns || []).join(', ') || 'default'}</dd>
          </dl>
          <ProjectEditForm org={activeOrg} project={project} />
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Metadata</h3><StatusPill tone="neutral">resource</StatusPill></div>
          <dl className="kv">
            <dt>Namespace</dt><dd>{project.metadata?.namespace || 'kradle-system'}</dd>
            <dt>Organization</dt><dd>{project.spec?.organizationRef || activeOrg}</dd>
            <dt>Created</dt><dd>{project.metadata?.creationTimestamp || 'unknown'}</dd>
            <dt>Linked stacks</dt><dd>{(project.spec?.stackRefs || []).length || 0}</dd>
          </dl>
        </div>
      </section>
      <div className="card">
        <div className="cardTitle"><h2>Board</h2><StatusPill tone={enrichedItems.length ? 'good' : 'neutral'}>{enrichedItems.length} items</StatusPill></div>
        <EnhancedKanbanBoard project={project} initialIssues={enrichedItems} org={activeOrg} workspaces={workspaces} sessions={sessions} />
      </div>
    </> : <EmptyState title={`Project ${projectId} not found`} text="This project does not exist in the current workspace. Create it through Kradle resource definitions." cta={orgHref(activeOrg, '/agents/projects')} ctaLabel="View all projects" />}
  </PageFrame>;
}

export async function IssueScopePage({ org = null, projectId, view = 'kanban' } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const project = (ui.model.agents?.projects?.items || []).find((item) => item.metadata?.name === projectId) || null;
  const displayName = project?.spec?.displayName || projectId || 'Project';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`project issues / ${displayName}`} title={`${displayName} issues`} text="Use the same issue workspace for project and repository triage. Issues may link to zero, one, or many repositories." actions={[[`/agents/projects/${projectId}`, 'Project board'], [`/agents/projects/${projectId}/issues?view=kanban`, 'Kanban'], [`/agents/projects/${projectId}/issues?view=list`, 'List view']]} breadcrumbs={[[ '/', 'Kradle' ], [ '/agents', 'Agents' ], [ '/agents/projects', 'Projects' ], [ `/agents/projects/${projectId}/issues`, `${displayName} issues` ]]}>
    <DegradedBanner model={ui.model} />
    <IssueWorkspace model={ui.model} resource={ui.issues} project={projectId} view={view} />
  </PageFrame>;
}

export async function IssueDetailPage({ org = null, repo = null, projectId = null, issueName }) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const scopedIssues = issuesForScope(ui.issues?.items || [], { repo, project: projectId });
  const issue = scopedIssues.find((item) => item.metadata?.name === issueName) || null;
  const parentHref = repo ? `/repositories/${repo}/issues` : projectId ? `/agents/projects/${projectId}/issues` : '/inbox';
  const parentLabel = repo || projectId || 'Issues';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath={repo ? '/repositories' : '/agents'} eyebrow={repo ? `repository issue / ${repo}` : `project issue / ${projectId}`} title={issue?.spec?.title || issueName} text="Edit the issue resource, review comments, and verify backend sync metadata from one full-page view." actions={[[parentHref, 'Back to issues'], [`${parentHref}?view=list`, 'List view']]} breadcrumbs={[[ '/', 'Kradle' ], [ repo ? '/repositories' : '/agents/projects', repo ? 'Repositories' : 'Projects' ], [ parentHref, parentLabel ], [ `${parentHref}/${issueName}`, issueName ]]}>
    <DegradedBanner model={ui.model} />
    {issue ? <IssueDetailView model={ui.model} issue={issue} repo={repo} project={projectId} /> : <EmptyState title="Issue is not linked to this scope" text="This issue is not associated with the selected repository or project, so it is hidden from this issue view." cta={orgHref(activeOrg, parentHref)} ctaLabel="Back to issues" />}
  </PageFrame>;
}
