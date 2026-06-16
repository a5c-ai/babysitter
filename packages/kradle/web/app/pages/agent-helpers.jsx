// Shared helpers, components, and constants used across all agent page modules.
import { loadKradleUi, orgHref, modelHref, publicResource, resourceJson, sanitizeCopy, StatusPill, DegradedBanner, EmptyState, InfoList, PlanCard, ResourceTable } from '../lib/kradle-ui.jsx';
import { ToolCallInspector } from '../components/observability/tool-inspector.jsx';
import { IssueCreateForm, IssueEditor } from '../components/repo/issue-editor.jsx';
import { ResourceApplyPanel } from '../components/resource-actions.jsx';
import { issueRepositoryRefs, issueProjectRefs } from '@a5c-ai/kradle-sdk';

// ── Re-export shared helpers from the canonical source ──────────────────────
export {
  phaseTone,
  relativeTime,
  TOOL_RENDERERS,
  truncateText,
  resolveToolRenderer,
  tryParseJson,
  SEGMENT_KINDS,
  classifyMessageKind,
  deriveSegments,
} from '../lib/agent-utils.js';

export function ToolCallCard({ toolName, input, output, status }) {
  const renderer = resolveToolRenderer(toolName);
  const statusColor = status === 'error' ? 'var(--danger)' : status === 'completed' ? 'var(--success)' : 'var(--warning)';
  const inputPreview = renderer.renderInput(typeof input === 'string' ? tryParseJson(input) : input);
  const outputPreview = output != null ? renderer.renderOutput(typeof output === 'string' ? tryParseJson(output) : output) : null;

  return (
    <div style={{ border: '1px solid var(--border)', borderLeft: `3px solid ${statusColor}`, borderRadius: 4, padding: '8px 12px', marginBottom: 8, fontSize: 13, backgroundColor: 'var(--surface-raised)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: outputPreview ? 4 : 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{renderer.prefix}</span>
        <strong style={{ fontSize: 12 }}>{renderer.label}</strong>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{inputPreview}</span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
      </div>
      {outputPreview && (
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{outputPreview}</div>
      )}
    </div>
  );
}

export function TranscriptMessage({ message }) {
  const role = message.role || 'unknown';
  if (role === 'tool' || role === 'tool_use' || role === 'tool_result') {
    return <ToolCallInspector toolName={message.toolName || message.name} input={message.input || message.content} output={message.output} status={message.status || 'completed'} durationMs={message.durationMs} />;
  }
  if (role === 'system' || role === 'thinking') {
    return <div className="transcriptMessage transcriptSystem">
      <small className="transcriptRole">{role}</small>
      <p>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</p>
    </div>;
  }
  const isUser = role === 'user';
  return <div className={`transcriptMessage ${isUser ? 'transcriptUser' : 'transcriptAssistant'}`}>
    <small className="transcriptRole">{role}</small>
    <div className="transcriptContent">{typeof message.content === 'string' ? message.content : Array.isArray(message.content) ? message.content.map((block, i) => <span key={i}>{typeof block === 'string' ? block : block.text || block.content || JSON.stringify(block)}</span>) : JSON.stringify(message.content)}</div>
  </div>;
}

export function FlowLane({ run, transcript }) {
  const runName = run?.metadata?.name || 'unknown';
  const stackName = run?.spec?.stackRef || run?.spec?.targetStack || null;
  const phase = run?.status?.phase || 'Pending';

  const messages = transcript?.spec?.messages || [];
  const segments = deriveSegments(messages);
  const tone = phaseTone(phase);
  const phaseColor = tone === 'good' ? 'var(--success)' : tone === 'warn' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : 'var(--text-muted)';

  return <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <strong title={runName} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{runName}</strong>
      {stackName ? <span style={{ color: 'var(--text-muted)' }}>{stackName}</span> : null}
      <StatusPill tone={tone}>{phase}</StatusPill>
    </div>
    <div style={{ display: 'flex', height: 28, borderRadius: 4, overflow: 'hidden', backgroundColor: 'var(--surface-raised)' }}>
      {segments.length ? segments.map((seg, index) => {
        const info = SEGMENT_KINDS[seg.kind] || SEGMENT_KINDS.lifecycle;
        return <div key={index} className="flowSegment" title={`${info.label}: ${seg.count} messages`} style={{
          minWidth: 24,
          flexGrow: seg.count,
          backgroundColor: info.color,
          borderTopLeftRadius: index === 0 ? 4 : 0,
          borderBottomLeftRadius: index === 0 ? 4 : 0,
          borderTopRightRadius: index === segments.length - 1 ? 4 : 0,
          borderBottomRightRadius: index === segments.length - 1 ? 4 : 0,
        }} />;
      }) : <div style={{ flexGrow: 1, backgroundColor: phaseColor, borderRadius: 4 }} title={`${phase}: no transcript data`} />}
    </div>
  </div>;
}

export function FlowVisualization({ runs = [], transcripts = [] }) {
  if (!runs.length) return <EmptyState title="No execution flow data" text="Flow visualization appears when dispatch runs have been created for this session." cta="/agents/runs" ctaLabel="View dispatch runs" />;
  return <div>{runs.map((run) => {
    const runName = run?.metadata?.name;
    const sessionRef = run?.status?.sessionRef || run?.spec?.sessionRef || null;
    const transcript = transcripts.find((t) => t.spec?.sessionRef === sessionRef || t.spec?.runRef === runName) || null;
    return <FlowLane key={runName} run={run} transcript={transcript} />;
  })}</div>;
}

// ── Issue helpers (also used by repo-pages) ───────────────────────────────────

export function issuesForScope(issues = [], { repo = null, project = null } = {}) {
  return issues.filter((issue) => {
    if (repo && !issueRepositoryRefs(issue).includes(repo)) return false;
    if (project && !issueProjectRefs(issue).includes(project)) return false;
    return true;
  });
}

export function issueDetailHref(model, issue, { repo = null, project = null } = {}) {
  const name = issue.metadata?.name;
  if (repo) return modelHref(model, `/repositories/${repo}/issues/${name}`);
  if (project) return modelHref(model, `/agents/projects/${project}/issues/${name}`);
  return modelHref(model, '/inbox');
}

export function issueColumn(issue) {
  const phase = String(issue.status?.phase || issue.spec?.status || issue.spec?.state || 'triage').toLowerCase();
  if (['done', 'closed', 'resolved', 'merged'].includes(phase)) return 'done';
  if (['blocked', 'failed', 'stalled'].includes(phase)) return 'blocked';
  if (['ready', 'active', 'open', 'in-progress', 'in progress'].includes(phase)) return 'ready';
  return 'triage';
}

export function issueLabels(issue) {
  return [...(issue.spec?.labels || []), ...(issue.metadata?.labels ? Object.values(issue.metadata.labels) : [])].filter(Boolean).map(String);
}

export function issueComments(issue) {
  const raw = [issue.spec?.comments, issue.status?.comments, issue.spec?.discussion, issue.status?.discussion].flat().filter(Boolean);
  return raw.map((comment, index) => typeof comment === 'string' ? { id: `comment-${index}`, author: 'synced comment', body: comment, createdAt: '' } : { id: comment.id || comment.url || `comment-${index}`, author: comment.author || comment.user || 'synced comment', body: comment.body || comment.text || comment.message || '', createdAt: comment.createdAt || comment.created_at || comment.updatedAt || '' });
}

export function IssueViewSwitcher({ model, repo = null, project = null, view = 'kanban' }) {
  const base = repo ? `/repositories/${repo}/issues` : project ? `/agents/projects/${project}/issues` : '/inbox';
  return <nav className="issueViewSwitcher" aria-label="Issue view"><a aria-current={view !== 'list' ? 'page' : undefined} href={modelHref(model, `${base}?view=kanban`)}>Kanban</a><a aria-current={view === 'list' ? 'page' : undefined} href={modelHref(model, `${base}?view=list`)}>List</a></nav>;
}

export function IssueKanbanView({ model, issues, repo = null, project = null }) {
  const columns = ['triage', 'ready', 'blocked', 'done'];
  return <div className="boardColumns issueColumns">{columns.map((column) => { const columnIssues = issues.filter((issue) => issueColumn(issue) === column); return <section key={column}><h4>{column}</h4>{columnIssues.map((issue) => <IssueCard key={issue.metadata?.name} model={model} issue={issue} repo={repo} project={project} />)}{columnIssues.length ? null : <p className="emptyText">No {column} issues.</p>}</section>; })}</div>;
}

export function IssueListView({ model, issues, repo = null, project = null }) {
  if (!issues.length) return <EmptyState title="No scoped issues" text="Create or sync an issue with matching project and repository metadata to show it here." cta={repo ? orgHref(model?.org?.slug || 'default', `/repositories/${repo}/issues`) : '/agents/projects'} ctaLabel={repo ? 'View repository issues' : 'View projects'} />;
  return <ul className="resourceList issueList">{issues.map((issue) => <li key={issue.metadata?.name}><a href={issueDetailHref(model, issue, { repo, project })}><strong>{issue.spec?.title || issue.metadata?.name}</strong></a><span>{issue.status?.phase || issue.spec?.status || 'Open'}</span><small>{issueLabels(issue).join(', ') || 'no labels'} · repos: {issueRepositoryRefs(issue).join(', ') || 'none'}</small></li>)}</ul>;
}

export function IssueCard({ model, issue, repo = null, project = null }) {
  const repositories = issueRepositoryRefs(issue);
  const projects = issueProjectRefs(issue);
  return <article><a href={issueDetailHref(model, issue, { repo, project })}><strong>{issue.spec?.title || issue.metadata?.name}</strong></a><small>{issue.status?.phase || issue.spec?.status || 'Open'} · {issue.metadata?.name}</small><small>Repos: {repositories.join(', ') || 'none'}</small>{projects.length ? <small>Projects: {projects.join(', ')}</small> : null}</article>;
}

export function IssueComments({ comments }) {
  return <div className="card issueComments"><div className="cardTitle"><h3>Comments</h3><StatusPill tone={comments.length ? 'good' : 'neutral'}>{comments.length}</StatusPill></div>{comments.length ? <ul className="conversation">{comments.map((comment) => <li key={comment.id}><strong>{comment.author}</strong><p>{sanitizeCopy(comment.body)}</p><small>{comment.createdAt || 'synced comment'}</small></li>)}</ul> : <p className="emptyText">No comments have been synced for this issue yet.</p>}</div>;
}

export function IssueSyncSummary({ model, repo = null, project = null, issue = null }) {
  const sync = model.views?.dashboard?.issueSync || {};
  return <div className="card issueSync"><div className="cardTitle"><h3>Backend sync</h3><StatusPill tone="neutral">metadata</StatusPill></div><p>Internal Gitea uses the org memory repository for issues. GitHub keeps project-scoped issue state and stores repository links as metadata.</p><dl className="kv"><dt>Scope</dt><dd>{project || repo || model.org?.slug || 'default'}</dd><dt>Gitea memory repo</dt><dd>{sync.gitea?.repo || '_org_'}</dd><dt>GitHub project</dt><dd>{sync.github?.project || project || 'project field'}</dd><dt>Issue</dt><dd>{issue?.metadata?.name || sync.gitea?.issue || 'selected on sync'}</dd></dl></div>;
}

export function IssueWorkspace({ model, resource, repo = null, project = null, view = 'kanban' }) {
  const issues = issuesForScope(resource?.items || [], { repo, project });
  const title = repo ? `${repo} issues` : project ? `${project} issues` : 'Issues';
  const scopeText = repo ? 'Only issues whose repository metadata includes this repository are visible here.' : 'Issues are filtered by project metadata and can link to zero, one, or many repositories.';
  return <div className="issueWorkspace"><div className="card"><div className="cardTitle"><h3>{title}</h3><StatusPill tone={issues.length ? 'good' : 'neutral'}>{issues.length} issues</StatusPill></div><p>{scopeText}</p><IssueCreateForm org={model.org?.slug || 'default'} repo={repo} project={project} /><IssueViewSwitcher model={model} repo={repo} project={project} view={view} />{view === 'list' ? <IssueListView model={model} issues={issues} repo={repo} project={project} /> : <IssueKanbanView model={model} issues={issues} repo={repo} project={project} />}</div><IssueSyncSummary model={model} repo={repo} project={project} /></div>;
}

export function IssueDetailView({ model, issue, repo = null, project = null }) {
  const comments = issueComments(issue);
  const org = model.org?.slug || 'default';
  return <div className="routeGrid wideLeft"><div className="stack"><div className="card issueDetailCard"><div className="cardTitle"><h2>{issue.spec?.title || issue.metadata?.name}</h2><StatusPill tone={issueColumn(issue) === 'blocked' ? 'warn' : issueColumn(issue) === 'done' ? 'good' : 'neutral'}>{issue.status?.phase || issue.spec?.status || 'Open'}</StatusPill></div><p>{sanitizeCopy(issue.spec?.body || issue.spec?.description || issue.status?.summary || 'No description has been synced yet.')}</p><dl className="kv"><dt>Issue</dt><dd>{issue.metadata?.name}</dd><dt>Project refs</dt><dd>{issueProjectRefs(issue).join(', ') || project || 'none'}</dd><dt>Repository refs</dt><dd>{issueRepositoryRefs(issue).join(', ') || 'none'}</dd><dt>Labels</dt><dd>{issueLabels(issue).join(', ') || 'none'}</dd></dl></div><IssueComments comments={comments} /><IssueEditor org={org} issue={publicResource(issue)} repo={repo} project={project} /></div><div className="stack"><IssueSyncSummary model={model} issue={issue} repo={repo} project={project} /><ResourceApplyPanel org={org} resource={publicResource(issue)} /><PlanCard title="Issue details" plan={resourceJson(issue)} initiallyOpen /></div></div>;
}

// ── Kanban helpers ────────────────────────────────────────────────────────────

export const WORKFLOW_COLUMNS = [
  { id: 'todo', label: 'Todo', color: 'var(--text-muted)' },
  { id: 'in-progress', label: 'In Progress', color: 'var(--warning)' },
  { id: 'review', label: 'Review', color: 'var(--info)' },
  { id: 'done', label: 'Done', color: 'var(--success)' },
];

export function KanbanBoard({ project, items = [], org = 'default' }) {
  const columns = WORKFLOW_COLUMNS.map((col) => ({
    ...col,
    items: items.filter((item) => (item.status?.column || 'todo') === col.id),
  }));
  const hasItems = items.length > 0;
  return <div className="kanbanBoard" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', minHeight: '20rem' }}>
    {columns.map((col) => <section key={col.id} className="kanbanColumn" style={{ background: 'var(--surface)', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{col.label}</h3>
        <span style={{ background: col.color, color: '#fff', borderRadius: '9999px', padding: '0.125rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>{col.items.length}</span>
      </div>
      {col.items.length ? col.items.map((item) => <div key={item.metadata?.name || item.spec?.title} className="kanbanCard" style={{ background: 'var(--surface-raised)', borderRadius: '0.375rem', padding: '0.625rem 0.75rem', borderLeft: `4px solid ${col.color}`, boxShadow: 'var(--shadow-sm)' }}>
        <strong style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem' }}>{item.spec?.title || item.metadata?.name}</strong>
        {item.spec?.priority ? <span className="pill neutral" style={{ fontSize: '0.6875rem', marginRight: '0.25rem' }}>{item.spec.priority}</span> : null}
        {item.spec?.assignee ? <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.spec.assignee}</small> : null}
        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
          {item.status?.linkedSessions ? <small style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{item.status.linkedSessions} sessions</small> : null}
          {item.status?.linkedWorkspaces ? <small style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{item.status.linkedWorkspaces} workspaces</small> : null}
        </div>
      </div>) : <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', margin: 'auto 0', padding: '1rem 0' }}>No items</p>}
    </section>)}
    {!hasItems ? <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: '0.875rem' }}>Link issues to this project to populate the board</p>
    </div> : null}
  </div>;
}

// ── Resolved approvals helper ─────────────────────────────────────────────────

export function ResolvedApprovalsSection({ resolved }) {
  const decisionTone = (phase) => {
    if (phase === 'Approved') return 'good';
    if (phase === 'Denied') return 'danger';
    return 'neutral';
  };
  return <details className="card">
    <summary style={{ cursor: 'pointer', padding: '0.75rem 0' }}><span><h3 style={{ display: 'inline' }}>Resolved approvals</h3> <StatusPill tone="neutral">{resolved.length} resolved</StatusPill></span></summary>
    {resolved.length ? <div className="resourceTable" style={{ marginTop: '0.5rem' }}>{resolved.map((approval) => {
      const name = approval.metadata?.name || 'unknown';
      const action = approval.spec?.action || 'Unknown action';
      const decision = approval.status?.phase || 'Unknown';
      const decidedBy = approval.status?.decidedBy || approval.status?.approvedBy || approval.status?.deniedBy || '--';
      const decidedAt = approval.status?.decidedAt || approval.status?.updatedAt || approval.metadata?.creationTimestamp || '';
      return <div key={name} className="resourceRow">
        <strong>{action}</strong>
        <StatusPill tone={decisionTone(decision)}>{decision.toLowerCase()}</StatusPill>
        <span>{decidedBy}</span>
        <small>{decidedAt ? relativeTime(decidedAt) : '--'}</small>
      </div>;
    })}</div> : <p className="emptyText" style={{ padding: '0.5rem 0' }}>No resolved approvals yet.</p>}
  </details>;
}
