import { loadKrateUi, orgHref, modelHref, publicResource, resourceJson, sanitizeCopy, StatusPill, DegradedBanner, EmptyState, InfoList, PlanCard, ResourceTable } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { ApprovalDecisionButtons } from '../components/approval-actions.jsx';
import { DispatchButton } from '../components/dispatch-button.jsx';
import { GraphStackBuilder } from '../components/stack-builder-graph.jsx';
import { EnhancedKanbanBoard } from '../components/kanban-enhanced.jsx';
import { WorkspacePanel } from '../components/workspace-panel.jsx';
import { MemorySearchForm } from '../components/memory-search-form.jsx';
import { MemoryOntologyEditor } from '../components/memory-ontology-editor.jsx';
import { MemoryImportReview } from '../components/memory-import-review.jsx';
import { LiveUpdates } from '../components/live-updates.jsx';
import { TriggerRuleForm } from '../components/trigger-rule-form.jsx';
import { ToolCallInspector } from '../components/tool-inspector.jsx';
import { SessionCost } from '../components/session-cost.jsx';
import { ApprovalModeToggle } from '../components/approval-mode-toggle.jsx';
import { SessionShell } from '../components/session-shell.jsx';
import { AgentSettingsForm } from '../components/agent-settings-form.jsx';
import { StackActions } from '../components/stack-actions.jsx';
import { ManualDispatchButton, RunActions } from '../components/run-actions.jsx';
import { EnableDisableToggle, DeleteRuleButton } from '../components/rule-actions.jsx';
import { ResourceActions, InlineCreateForm } from '../components/resource-crud-actions.jsx';
import { IssueCreateForm, IssueEditor } from '../components/issue-editor.jsx';
import { ResourceApplyPanel } from '../components/resource-actions.jsx';
import { issueRepositoryRefs, issueProjectRefs } from '@a5c-ai/krate-sdk';

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(timestamp) {
  if (!timestamp) return '';
  try {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    if (diffMs < 0) return 'just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } catch { return String(timestamp); }
}

const TOOL_RENDERERS = {
  bash: { label: 'Shell', prefix: '>', renderInput: (input) => input?.command || 'command', renderOutput: (output) => typeof output === 'string' ? truncateText(output, 300) : output?.stdout || String(output) },
  read: { label: 'Read', prefix: '[R]', renderInput: (input) => input?.file_path || input?.path || 'file', renderOutput: (output) => truncateText(String(output), 300) },
  write: { label: 'Write', prefix: '[W]', renderInput: (input) => input?.file_path || 'file', renderOutput: () => 'File written' },
  edit: { label: 'Edit', prefix: '[E]', renderInput: (input) => input?.file_path || 'file', renderOutput: () => 'File edited' },
  glob: { label: 'Search', prefix: '[G]', renderInput: (input) => input?.pattern || 'pattern', renderOutput: (output) => Array.isArray(output) ? output.length + ' matches' : String(output) },
  grep: { label: 'Grep', prefix: '[?]', renderInput: (input) => input?.pattern || 'pattern', renderOutput: (output) => Array.isArray(output) ? output.length + ' matches' : String(output) },
  web_fetch: { label: 'Fetch', prefix: '[F]', renderInput: (input) => input?.url || 'url', renderOutput: (output) => truncateText(String(output), 200) },
  web_search: { label: 'Search', prefix: '[S]', renderInput: (input) => input?.query || 'query', renderOutput: (output) => truncateText(String(output), 200) },
};

function truncateText(text, maxLen) {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '...';
}

function resolveToolRenderer(toolName) {
  const normalized = (toolName || '').toLowerCase().replace(/[^a-z_]/g, '');
  return TOOL_RENDERERS[normalized] || { label: toolName || 'Tool', prefix: '[T]', renderInput: (i) => truncateText(JSON.stringify(i), 200), renderOutput: (o) => truncateText(JSON.stringify(o), 200) };
}

function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

function ToolCallCard({ toolName, input, output, status }) {
  const renderer = resolveToolRenderer(toolName);
  const statusColor = status === 'error' ? '#ef4444' : status === 'completed' ? '#22c55e' : '#f59e0b';
  const inputPreview = renderer.renderInput(typeof input === 'string' ? tryParseJson(input) : input);
  const outputPreview = output != null ? renderer.renderOutput(typeof output === 'string' ? tryParseJson(output) : output) : null;

  return (
    <div style={{ border: '1px solid #e2e8f0', borderLeft: `3px solid ${statusColor}`, borderRadius: 4, padding: '8px 12px', marginBottom: 8, fontSize: 13, backgroundColor: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: outputPreview ? 4 : 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{renderer.prefix}</span>
        <strong style={{ fontSize: 12 }}>{renderer.label}</strong>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151', flex: 1 }}>{inputPreview}</span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
      </div>
      {outputPreview && (
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{outputPreview}</div>
      )}
    </div>
  );
}

function TranscriptMessage({ message }) {
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

const SEGMENT_KINDS = {
  user: { label: 'User', color: '#3b82f6' },
  assistant: { label: 'Assistant', color: '#6b7280' },
  thinking: { label: 'Thinking', color: '#a855f7' },
  tool: { label: 'Tool', color: '#f59e0b' },
  error: { label: 'Error', color: '#ef4444' },
  lifecycle: { label: 'Lifecycle', color: '#94a3b8' },
};

function classifyMessageKind(message) {
  const role = message.role || 'unknown';
  if (role === 'user') return 'user';
  if (role === 'assistant') return 'assistant';
  if (role === 'thinking') return 'thinking';
  if (role === 'tool' || role === 'tool_use' || role === 'tool_result') return 'tool';
  if (role === 'error') return 'error';
  if (role === 'system' || role === 'lifecycle') return 'lifecycle';
  return 'lifecycle';
}

function deriveSegments(messages) {
  if (!messages || !messages.length) return [];
  const segments = [];
  let currentKind = null;
  let currentCount = 0;
  for (const msg of messages) {
    const kind = classifyMessageKind(msg);
    if (kind === currentKind) {
      currentCount++;
    } else {
      if (currentKind) segments.push({ kind: currentKind, count: currentCount });
      currentKind = kind;
      currentCount = 1;
    }
  }
  if (currentKind) segments.push({ kind: currentKind, count: currentCount });
  return segments;
}

function FlowLane({ run, transcript }) {
  const runName = run?.metadata?.name || 'unknown';
  const stackName = run?.spec?.stackRef || run?.spec?.targetStack || null;
  const phase = run?.status?.phase || 'Pending';
  const phaseTone = !phase || phase === 'Queued' || phase === 'Pending' ? 'neutral' : phase === 'Running' ? 'warn' : phase === 'Completed' || phase === 'Succeeded' ? 'good' : phase === 'Failed' ? 'danger' : 'neutral';
  const messages = transcript?.spec?.messages || [];
  const segments = deriveSegments(messages);
  const phaseColor = phaseTone === 'good' ? '#22c55e' : phaseTone === 'warn' ? '#f59e0b' : phaseTone === 'danger' ? '#ef4444' : '#94a3b8';

  return <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <strong title={runName} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{runName}</strong>
      {stackName ? <span style={{ color: '#6b7280' }}>{stackName}</span> : null}
      <StatusPill tone={phaseTone}>{phase}</StatusPill>
    </div>
    <div style={{ display: 'flex', height: 28, borderRadius: 4, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
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
  if (!runs.length) return <EmptyState title="No execution flow data" text="Flow visualization appears when dispatch runs have been created for this session." />;
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

function issueDetailHref(model, issue, { repo = null, project = null } = {}) {
  const name = issue.metadata?.name;
  if (repo) return modelHref(model, `/repositories/${repo}/issues/${name}`);
  if (project) return modelHref(model, `/agents/projects/${project}/issues/${name}`);
  return modelHref(model, '/inbox');
}

function issueColumn(issue) {
  const phase = String(issue.status?.phase || issue.spec?.status || issue.spec?.state || 'triage').toLowerCase();
  if (['done', 'closed', 'resolved', 'merged'].includes(phase)) return 'done';
  if (['blocked', 'failed', 'stalled'].includes(phase)) return 'blocked';
  if (['ready', 'active', 'open', 'in-progress', 'in progress'].includes(phase)) return 'ready';
  return 'triage';
}

function issueLabels(issue) {
  return [...(issue.spec?.labels || []), ...(issue.metadata?.labels ? Object.values(issue.metadata.labels) : [])].filter(Boolean).map(String);
}

function issueComments(issue) {
  const raw = [issue.spec?.comments, issue.status?.comments, issue.spec?.discussion, issue.status?.discussion].flat().filter(Boolean);
  return raw.map((comment, index) => typeof comment === 'string' ? { id: `comment-${index}`, author: 'synced comment', body: comment, createdAt: '' } : { id: comment.id || comment.url || `comment-${index}`, author: comment.author || comment.user || 'synced comment', body: comment.body || comment.text || comment.message || '', createdAt: comment.createdAt || comment.created_at || comment.updatedAt || '' });
}

function IssueViewSwitcher({ model, repo = null, project = null, view = 'kanban' }) {
  const base = repo ? `/repositories/${repo}/issues` : project ? `/agents/projects/${project}/issues` : '/inbox';
  return <nav className="issueViewSwitcher" aria-label="Issue view"><a aria-current={view !== 'list' ? 'page' : undefined} href={modelHref(model, `${base}?view=kanban`)}>Kanban</a><a aria-current={view === 'list' ? 'page' : undefined} href={modelHref(model, `${base}?view=list`)}>List</a></nav>;
}

function IssueKanbanView({ model, issues, repo = null, project = null }) {
  const columns = ['triage', 'ready', 'blocked', 'done'];
  return <div className="boardColumns issueColumns">{columns.map((column) => { const columnIssues = issues.filter((issue) => issueColumn(issue) === column); return <section key={column}><h4>{column}</h4>{columnIssues.map((issue) => <IssueCard key={issue.metadata?.name} model={model} issue={issue} repo={repo} project={project} />)}{columnIssues.length ? null : <p className="emptyText">No {column} issues.</p>}</section>; })}</div>;
}

function IssueListView({ model, issues, repo = null, project = null }) {
  if (!issues.length) return <EmptyState title="No scoped issues" text="Create or sync an issue with matching project and repository metadata to show it here." />;
  return <ul className="resourceList issueList">{issues.map((issue) => <li key={issue.metadata?.name}><a href={issueDetailHref(model, issue, { repo, project })}><strong>{issue.spec?.title || issue.metadata?.name}</strong></a><span>{issue.status?.phase || issue.spec?.status || 'Open'}</span><small>{issueLabels(issue).join(', ') || 'no labels'} · repos: {issueRepositoryRefs(issue).join(', ') || 'none'}</small></li>)}</ul>;
}

function IssueCard({ model, issue, repo = null, project = null }) {
  const repositories = issueRepositoryRefs(issue);
  const projects = issueProjectRefs(issue);
  return <article><a href={issueDetailHref(model, issue, { repo, project })}><strong>{issue.spec?.title || issue.metadata?.name}</strong></a><small>{issue.status?.phase || issue.spec?.status || 'Open'} · {issue.metadata?.name}</small><small>Repos: {repositories.join(', ') || 'none'}</small>{projects.length ? <small>Projects: {projects.join(', ')}</small> : null}</article>;
}

function IssueComments({ comments }) {
  return <div className="card issueComments"><div className="cardTitle"><h3>Comments</h3><StatusPill tone={comments.length ? 'good' : 'neutral'}>{comments.length}</StatusPill></div>{comments.length ? <ul className="conversation">{comments.map((comment) => <li key={comment.id}><strong>{comment.author}</strong><p>{sanitizeCopy(comment.body)}</p><small>{comment.createdAt || 'synced comment'}</small></li>)}</ul> : <p className="emptyText">No comments have been synced for this issue yet.</p>}</div>;
}

function IssueSyncSummary({ model, repo = null, project = null, issue = null }) {
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

const WORKFLOW_COLUMNS = [
  { id: 'todo', label: 'Todo', color: '#6b7280' },
  { id: 'in-progress', label: 'In Progress', color: '#eab308' },
  { id: 'review', label: 'Review', color: '#3b82f6' },
  { id: 'done', label: 'Done', color: '#22c55e' },
];

function KanbanBoard({ project, items = [], org = 'default' }) {
  const columns = WORKFLOW_COLUMNS.map((col) => ({
    ...col,
    items: items.filter((item) => (item.status?.column || 'todo') === col.id),
  }));
  const hasItems = items.length > 0;
  return <div className="kanbanBoard" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', minHeight: '20rem' }}>
    {columns.map((col) => <section key={col.id} className="kanbanColumn" style={{ background: 'var(--surface-muted, #f9fafb)', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{col.label}</h3>
        <span style={{ background: col.color, color: '#fff', borderRadius: '9999px', padding: '0.125rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>{col.items.length}</span>
      </div>
      {col.items.length ? col.items.map((item) => <div key={item.metadata?.name || item.spec?.title} className="kanbanCard" style={{ background: '#fff', borderRadius: '0.375rem', padding: '0.625rem 0.75rem', borderLeft: `4px solid ${col.color}`, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
        <strong style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem' }}>{item.spec?.title || item.metadata?.name}</strong>
        {item.spec?.priority ? <span className="pill neutral" style={{ fontSize: '0.6875rem', marginRight: '0.25rem' }}>{item.spec.priority}</span> : null}
        {item.spec?.assignee ? <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>{item.spec.assignee}</small> : null}
        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
          {item.status?.linkedSessions ? <small style={{ color: '#9ca3af', fontSize: '0.6875rem' }}>{item.status.linkedSessions} sessions</small> : null}
          {item.status?.linkedWorkspaces ? <small style={{ color: '#9ca3af', fontSize: '0.6875rem' }}>{item.status.linkedWorkspaces} workspaces</small> : null}
        </div>
      </div>) : <p style={{ color: '#9ca3af', fontSize: '0.8125rem', textAlign: 'center', margin: 'auto 0', padding: '1rem 0' }}>No items</p>}
    </section>)}
    {!hasItems ? <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0', color: '#9ca3af' }}>
      <p style={{ fontSize: '0.875rem' }}>Link issues to this project to populate the board</p>
    </div> : null}
  </div>;
}

// ── Resolved approvals helper ─────────────────────────────────────────────────

function ResolvedApprovalsSection({ resolved }) {
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

// ── Page exports ──────────────────────────────────────────────────────────────

export async function AgentsDashboardPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { stacks: { count: 0 }, runs: { count: 0, active: [] }, rules: { count: 0 }, approvals: { count: 0, pending: [] } };
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent orchestration" title="Agent stacks, runs, and rules" text="View agent stacks, dispatch runs, trigger rules, and pending approvals from one place." actions={[['/agents/stacks', 'View stacks'], ['/agents/runs', 'View runs']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
      <DispatchButton org={activeOrg} stacks={(agentView.stacks?.items || []).map(s => s.metadata?.name).filter(Boolean)} />
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
        </dl><div style={{ marginTop: 12 }}><StackActions org={activeOrg} stackName={name} /></div></> : <EmptyState title={`Stack ${name} not found`} text="This agent stack does not exist in the current workspace. Create it through Krate resource definitions." />}
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
  const atlasBaseUrl = process.env.ATLAS_BASE_URL || 'https://atlas-staging.a5c.ai';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent stack" title="New agent stack" text="Build an agent stack from Atlas knowledge-graph layers. Select models, providers, runtimes, tools, and more from the live catalog." actions={[['/agents/stacks', 'All stacks'], ['/agents', 'Overview']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/stacks', 'Stacks'], ['/agents/stacks/new', 'New']]}>
    <DegradedBanner model={ui.model} />
    <GraphStackBuilder org={activeOrg} atlasBaseUrl={atlasBaseUrl} />
  </PageFrame>;
}

export async function AgentRunsPage({ org = null, linkToDetail = false } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { runs: { count: 0, items: [] }, stacks: { count: 0, items: [] } };
  const runs = agentView.runs.items || [];
  const phaseTone = (phase) => {
    if (!phase || phase === 'Queued' || phase === 'Pending') return 'neutral';
    if (phase === 'Running') return 'warn';
    if (phase === 'Completed' || phase === 'Succeeded') return 'good';
    if (phase === 'Failed') return 'danger';
    return 'neutral';
  };
  const availableStacks = (agentView.stacks?.items || []).map(s => s.metadata?.name).filter(Boolean);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent dispatch runs" title="Dispatch runs" text="Track agent dispatch runs across stacks, repositories, and phases. Each run represents a dispatched agent task." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/runs', 'Dispatch runs']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
      <ManualDispatchButton org={activeOrg} stacks={availableStacks} />
      <DispatchButton org={activeOrg} stacks={availableStacks} />
      <LiveUpdates org={activeOrg} />
    </div>
    <div className="card">
      <div className="cardTitle"><h2>Dispatch runs</h2><StatusPill tone={runs.length ? 'good' : 'neutral'}>{runs.length} runs</StatusPill></div>
      {runs.length ? <ul className="resourceList runList">{runs.map((run) => <li key={run.metadata?.name}>
        {linkToDetail ? <a href={orgHref(activeOrg, `/agents/runs/${run.metadata?.name}`)}><strong>{run.metadata?.name}</strong></a> : <strong>{run.metadata?.name}</strong>}
        <StatusPill tone={phaseTone(run.status?.phase)}>{run.status?.phase || 'Pending'}</StatusPill>
        <span>{run.spec?.stackRef || 'unassigned'} / {run.spec?.repository || 'no repository'}</span>
        <small>Phase: {run.status?.phase || 'Pending'}{run.status?.startedAt ? ` / Started: ${run.status.startedAt}` : ''}</small>
        <RunActions org={activeOrg} runName={run.metadata?.name} stackRef={run.spec?.stackRef || run.spec?.agentStack} phase={run.status?.phase} />
      </li>)}</ul> : <EmptyState title="No dispatch runs" text="Dispatch runs appear when agent stacks are triggered by rules or manual dispatch. Configure trigger rules or dispatch manually to create runs."><DispatchButton org={activeOrg} stacks={availableStacks} /></EmptyState>}
    </div>
  </PageFrame>;
}

export async function AgentRunDetailPage({ org = null, runId } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { runs: { items: [] }, stacks: { items: [] }, sessions: { items: [] } };
  const run = (agentView.runs.items || []).find((r) => r.metadata?.name === runId) || null;
  const stackName = run?.spec?.stackRef || run?.spec?.targetStack || null;
  const attempts = (agentView.attempts?.items || []).filter((a) => a.spec?.dispatchRun === runId || a.spec?.runRef === runId);
  const contextDigest = run?.spec?.contextBundle?.digest || run?.status?.contextDigest || null;
  const contextSourceCount = run?.spec?.contextBundle?.sourceCount ?? run?.spec?.contextBundle?.sources?.length ?? null;
  const permissionDecision = run?.spec?.permission?.decision || run?.status?.permissionDecision || null;
  const repository = run?.spec?.repository || null;
  const phases = run?.status?.phaseTransitions || run?.status?.history || [];
  const runTranscripts = agentView.transcripts?.items || [];
  const phaseTone = (phase) => {
    if (!phase || phase === 'Queued' || phase === 'Pending') return 'neutral';
    if (phase === 'Running') return 'warn';
    if (phase === 'Completed' || phase === 'Succeeded') return 'good';
    if (phase === 'Failed') return 'danger';
    return 'neutral';
  };
  const permissionTone = (decision) => {
    if (!decision) return 'neutral';
    if (decision === 'allowed' || decision === 'Allowed') return 'good';
    if (decision === 'denied' || decision === 'Denied') return 'danger';
    if (decision === 'requires-approval' || decision === 'RequiresApproval') return 'warn';
    return 'neutral';
  };
  const attemptStatusTone = (status) => {
    if (!status) return 'neutral';
    if (status === 'Running' || status === 'Active') return 'warn';
    if (status === 'Completed' || status === 'Succeeded') return 'good';
    if (status === 'Failed' || status === 'Errored') return 'danger';
    return 'neutral';
  };
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`dispatch run / ${runId}`} title={runId || 'Run detail'} text={run ? `Dispatch run on ${stackName || 'unknown stack'} with phase ${run.status?.phase || 'Pending'}.` : 'This dispatch run was not found in the current workspace.'} actions={[['/agents/runs', 'All runs'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/runs', 'Dispatch runs'], [`/agents/runs/${runId}`, runId || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    {run ? <>
      <section className="routeGrid two">
        <div className="card">
          <div className="cardTitle"><h3>{runId}</h3><StatusPill tone={phaseTone(run.status?.phase)}>{run.status?.phase || 'Pending'}</StatusPill></div>
          {stackName ? <p>Agent stack: <a href={orgHref(activeOrg, `/agents/stacks/${stackName}`)}>{stackName}</a></p> : <p>Agent stack: not assigned</p>}
          <div style={{ marginTop: '0.75rem' }}>
            <RunActions org={activeOrg} runName={runId} stackRef={stackName} phase={run.status?.phase} />
          </div>
        </div>
      </section>
      <section className="routeGrid two">
        <div className="card">
          <div className="cardTitle"><h3>Context bundle</h3><StatusPill tone={contextDigest ? 'good' : 'neutral'}>{contextDigest ? 'available' : 'none'}</StatusPill></div>
          <dl className="kv">
            <dt>Digest</dt><dd>{contextDigest ? contextDigest.substring(0, 12) : 'not available'}</dd>
            <dt>Source count</dt><dd>{contextSourceCount != null ? contextSourceCount : 'not available'}</dd>
          </dl>
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Permission</h3><StatusPill tone={permissionTone(permissionDecision)}>{permissionDecision || 'not evaluated'}</StatusPill></div>
          <dl className="kv">
            <dt>Decision</dt><dd>{permissionDecision || 'not evaluated'}</dd>
          </dl>
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Agent</h3><StatusPill tone={stackName ? 'good' : 'neutral'}>{stackName ? 'linked' : 'unassigned'}</StatusPill></div>
          <dl className="kv">
            <dt>Stack</dt><dd>{stackName ? <a href={orgHref(activeOrg, `/agents/stacks/${stackName}`)}>{stackName}</a> : 'not assigned'}</dd>
          </dl>
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Repository</h3><StatusPill tone={repository ? 'good' : 'neutral'}>{repository ? 'linked' : 'none'}</StatusPill></div>
          <dl className="kv">
            <dt>Repository</dt><dd>{repository || 'not specified'}</dd>
          </dl>
        </div>
      </section>
      <section className="routeGrid two">
        <div className="card">
          <div className="cardTitle"><h3>Attempts</h3><StatusPill tone={attempts.length ? 'good' : 'neutral'}>{attempts.length} attempts</StatusPill></div>
          {attempts.length ? <ul className="resourceList">{attempts.map((attempt, index) => {
            const attemptNumber = attempt.spec?.attemptNumber ?? (index + 1);
            const reason = attempt.spec?.reason || 'initial';
            const status = attempt.status?.phase || attempt.status?.status || 'Pending';
            const queuedAt = attempt.status?.queuedAt || attempt.metadata?.creationTimestamp || null;
            const startedAt = attempt.status?.startedAt || null;
            const completedAt = attempt.status?.completedAt || null;
            const sessionRef = attempt.spec?.sessionRef || attempt.status?.sessionRef || null;
            return <li key={attempt.metadata?.name || index}>
              <strong>Attempt {attemptNumber}</strong>
              <StatusPill tone={attemptStatusTone(status)}>{status}</StatusPill>
              <span>Reason: {reason}</span>
              <small>{queuedAt ? `Queued: ${queuedAt}` : ''}{startedAt ? ` / Started: ${startedAt}` : ''}{completedAt ? ` / Completed: ${completedAt}` : ''}</small>
              {sessionRef ? <small>Session: <a href={orgHref(activeOrg, `/agents/sessions/${sessionRef}`)}>{sessionRef}</a></small> : null}
            </li>;
          })}</ul> : <p className="emptyText">No attempt records found for this dispatch run.</p>}
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Timeline</h3><StatusPill tone={phases.length ? 'good' : 'neutral'}>{phases.length} transitions</StatusPill></div>
          {phases.length ? <ul className="compactList">{phases.map((entry, index) => <li key={index}>{entry.timestamp || entry.time || 'unknown'}: {entry.phase || entry.status || 'unknown'}{entry.reason ? ` / ${entry.reason}` : ''}</li>)}</ul> : <p className="emptyText">No phase transitions recorded. Transitions appear as the run progresses through its lifecycle.</p>}
        </div>
      </section>
      <section className="routeGrid one">
        <div className="card">
          <div className="cardTitle"><h3>Execution flow</h3><StatusPill tone={run ? 'good' : 'neutral'}>segments</StatusPill></div>
          <FlowVisualization runs={[run]} transcripts={runTranscripts} />
        </div>
      </section>
    </> : <EmptyState title={`Run ${runId} not found`} text="This dispatch run does not exist in the current workspace. Dispatch runs are created when agent stacks are triggered by rules or manual dispatch." />}
  </PageFrame>;
}

export async function AgentRulesPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { rules: { count: 0, items: [] } };
  const rules = agentView.rules.items || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent trigger rules" title="Trigger rules" text="Trigger rules define which events dispatch agent runs and which stack handles them." actions={[['/agents/rules/new', 'Create rule'], ['/agents', 'Overview'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/rules', 'Trigger rules']]}>
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
  const ui = await loadKrateUi(org);
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
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`trigger rule / ${ruleName}`} title={ruleName || 'Rule detail'} text={rule ? `Trigger rule targeting ${agentStack || 'unknown stack'} with ${sources.length ? sources.join(', ') : 'all'} sources.` : 'This trigger rule was not found in the current workspace.'} actions={[['/agents/rules', 'All rules'], ['/agents/rules/new', 'New rule'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/rules', 'Trigger rules'], [`/agents/rules/${ruleName}`, ruleName || 'Detail']]}>
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
        </div>)}</div> : <EmptyState title="No trigger executions yet" text="Execution records appear when events match this trigger rule. Each execution shows the event, decision, and any dispatched run." />}
      </div>
    </> : <EmptyState title={`Rule ${ruleName} not found`} text="This trigger rule does not exist in the current workspace. Trigger rules are created through resource definitions." />}
  </PageFrame>;
}

export async function AgentRuleBuilderPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { stacks: { items: [] } };
  const stacks = (agentView.stacks?.items || []).map(s => s.metadata?.name).filter(Boolean);
  const exampleYaml = `apiVersion: krate.a5c.ai/v1alpha1
kind: AgentTriggerRule
metadata:
  name: my-trigger-rule
  namespace: krate-system
spec:
  organizationRef: ${activeOrg}
  sources:
    - push
  agentStack: my-diagnostic-stack
  taskKind: diagnostic`;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="new trigger rule" title="Create trigger rule" text="Define which events dispatch agent runs and which stack handles them." actions={[['/agents/rules', 'All rules'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/rules', 'Trigger rules'], ['/agents/rules/new', 'New rule']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two">
      <TriggerRuleForm org={activeOrg} stacks={stacks} />
      <div className="card">
        <div className="cardTitle"><h3>Resource definition</h3><StatusPill tone="neutral">example</StatusPill></div>
        <pre style={{ background: '#1e1e2e', color: '#cdd6f4', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', lineHeight: '1.6', overflow: 'auto' }}><code>{exampleYaml}</code></pre>
      </div>
    </section>
  </PageFrame>;
}

export async function AgentApprovalsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { approvals: { count: 0, items: [], pending: [] } };
  const allApprovals = agentView.approvals?.items || [];
  const pending = agentView.approvals?.pending || allApprovals.filter(a => !a.status?.phase || a.status.phase === 'Pending');
  const resolved = allApprovals.filter(a => a.status?.phase && a.status.phase !== 'Pending');
  const approvedCount = resolved.filter(a => a.status?.phase === 'Approved').length;
  const deniedCount = resolved.filter(a => a.status?.phase === 'Denied').length;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent approvals" title="Approval inbox" text="Review and act on pending agent approval requests. Agents pause here when they need human authorization for tools, secrets, write-back, or release actions." actions={[['/agents', 'Overview'], ['/agents/runs', 'Dispatch runs']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/approvals', 'Approvals']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}><LiveUpdates org={activeOrg} /></div>
    <section className="routeGrid three">
      <div className="card"><div className="cardTitle"><h3>Pending</h3><StatusPill tone={pending.length ? 'warn' : 'neutral'}>{pending.length}</StatusPill></div><p className="emptyText">Awaiting human decision</p></div>
      <div className="card"><div className="cardTitle"><h3>Approved</h3><StatusPill tone={approvedCount ? 'good' : 'neutral'}>{approvedCount}</StatusPill></div><p className="emptyText">Actions authorized</p></div>
      <div className="card"><div className="cardTitle"><h3>Denied</h3><StatusPill tone={deniedCount ? 'danger' : 'neutral'}>{deniedCount}</StatusPill></div><p className="emptyText">Actions rejected</p></div>
    </section>
    <div className="card" style={{ borderLeft: pending.length ? '3px solid var(--color-warn, #e8a735)' : undefined }}>
      <div className="cardTitle"><h2>Pending approvals</h2><StatusPill tone={pending.length ? 'warn' : 'neutral'}>{pending.length} pending</StatusPill></div>
      {pending.length ? <div className="stack">{pending.map((approval) => {
        const name = approval.metadata?.name || 'unknown';
        const action = approval.spec?.action || 'Unknown action';
        const requestedBy = approval.spec?.requestedBy || approval.spec?.stackRef || 'unknown agent';
        const dispatchRun = approval.spec?.dispatchRun || null;
        const requestedAt = approval.metadata?.creationTimestamp || approval.spec?.requestedAt || null;
        const description = approval.spec?.description || approval.spec?.reason || `Agent requests permission to perform: ${action}`;
        return <div key={name} className="card" style={{ background: 'var(--surface-warn, #fffbeb)', border: '1px solid var(--border-warn, #f5d060)' }}>
          <div className="cardTitle"><h3>{action}</h3><StatusPill tone="warn">pending</StatusPill></div>
          <dl className="kv">
            <dt>Requesting agent</dt><dd>{requestedBy}</dd>
            {dispatchRun ? <><dt>Dispatch run</dt><dd><a href={orgHref(activeOrg, `/agents/runs/${dispatchRun}`)}>{dispatchRun}</a></dd></> : null}
            {requestedAt ? <><dt>Requested</dt><dd><time dateTime={requestedAt}>{relativeTime(requestedAt)}</time></dd></> : null}
            <dt>Description</dt><dd>{description}</dd>
          </dl>
          <ApprovalDecisionButtons org={activeOrg} approvalName={name} />
        </div>;
      })}</div> : <EmptyState title="All clear!" text="No pending approval requests. When an agent needs human authorization, pending items appear here." info />}
    </div>
    <ResolvedApprovalsSection resolved={resolved} />
  </PageFrame>;
}

export async function AgentWorkspacesPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { workspaces: { count: 0, items: [] } };
  const workspaces = agentView.workspaces?.items || [];
  const phaseTone = (phase) => {
    if (!phase || phase === 'Pending' || phase === 'Provisioning') return 'neutral';
    if (phase === 'Active') return 'good';
    if (phase === 'Archived') return 'warn';
    if (phase === 'Failed') return 'danger';
    return 'neutral';
  };
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent workspaces" title="Agent workspaces" text="Volume-backed git workspaces with PVC lifecycle, repo binding, and runner mount specs. Workspaces are reusable across runs." actions={[['/agents', 'Overview'], ['/agents/sessions', 'Sessions']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/workspaces', 'Workspaces']]}>
    <DegradedBanner model={ui.model} />
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
          {ws.status?.runRef ? <small style={{ color: '#2563eb' }}>mounted: {ws.status.runRef}</small> : null}
        </a>
        <ResourceActions org={activeOrg} apiPath={`agents/workspaces/${ws.metadata?.name}`} actions={ws.status?.phase === 'Archived' ? ['delete'] : ws.status?.phase === 'InUse' ? ['release', 'delete'] : ['sync', 'delete']} />
      </div>)}</div> : <EmptyState title="No agent workspaces" text="Workspaces are provisioned when runs start. Configure agent stacks and dispatch runs to begin provisioning." info />}
    </div>
  </PageFrame>;
}

export async function AgentWorkspaceDetailPage({ org = null, workspaceId } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { workspaces: { items: [] }, sessions: { items: [] } };
  const workspace = (agentView.workspaces?.items || []).find((w) => w.metadata?.name === workspaceId) || null;
  const runtimes = (ui.model.resources || []).find((r) => r.kind === 'KrateWorkspaceRuntime');
  const runtimeItems = runtimes?.items || [];
  const runtime = runtimeItems.find((r) => r.spec?.workspaceRef === workspaceId) || null;
  const boundSessions = workspace?.status?.boundSessions || [];
  const allWorkItemLinks = (ui.model.resources || []).find((r) => r.kind === 'WorkItemWorkspaceLink');
  const workItemLinks = (allWorkItemLinks?.items || []).filter((link) => link.spec?.workspace === workspaceId);
  const phaseTone = (phase) => {
    if (!phase || phase === 'Pending' || phase === 'Provisioning') return 'neutral';
    if (phase === 'Active') return 'good';
    if (phase === 'Archived') return 'warn';
    if (phase === 'Failed') return 'danger';
    return 'neutral';
  };
  const truncatePath = (path, maxLen = 60) => {
    if (!path) return '—';
    return path.length > maxLen ? '…' + path.slice(path.length - maxLen + 1) : path;
  };
  const firstSessionRef = boundSessions.length ? (boundSessions[0]?.sessionRef || boundSessions[0]) : null;
  const firstSession = firstSessionRef ? (agentView.sessions?.items || []).find((s) => s.metadata?.name === firstSessionRef) || null : null;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`workspace / ${workspaceId}`} title={workspaceId || 'Workspace detail'} text={workspace ? `Agent workspace for ${workspace.spec?.repository || 'unknown repository'} with phase ${workspace.status?.phase || 'Pending'}.` : 'This agent workspace was not found in the current workspace.'} actions={[['/agents/workspaces', 'All workspaces'], ['/agents/sessions', 'Sessions']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/workspaces', 'Workspaces'], [`/agents/workspaces/${workspaceId}`, workspaceId || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    {workspace ? <WorkspacePanel workspace={workspace} runtime={runtime} session={firstSession} org={activeOrg} /> : <EmptyState title={`Workspace ${workspaceId} not found`} text="This agent workspace does not exist in the current workspace. Agent workspaces are provisioned when dispatch runs create git worktrees." />}
  </PageFrame>;
}

export async function AgentProjectsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
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
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent projects" title="Projects" text="Organize agent work into projects with kanban boards, linked stacks, and tracked issues." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/projects', 'Projects']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div>
        {projects.length ? <section className="routeGrid three" style={{ gridColumn: '1 / -1' }}>{projects.map((project) => {
          const name = project.metadata?.name;
          const displayName = project.spec?.displayName || name;
          const linkedStacks = (project.spec?.stackRefs || []).length || (stacks.filter((s) => s.spec?.projectRef === name).length);
          const phase = project.status?.phase || 'Active';
          const phaseTone = phase === 'Active' ? 'good' : phase === 'Archived' ? 'neutral' : 'warn';
          return <a key={name} href={orgHref(activeOrg, `/agents/projects/${name}`)} className="card quickAction" style={{ textDecoration: 'none' }}>
            <div className="cardTitle"><h3>{displayName}</h3><StatusPill tone={phaseTone}>{phase}</StatusPill></div>
            <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>{project.spec?.description || 'No description'}</p>
            <small>{linkedStacks} linked stack{linkedStacks === 1 ? '' : 's'}</small>
          </a>;
        })}</section> : <EmptyState title="No projects yet" text="Projects organize agent work into boards with columns. Use the form to create your first project." />}
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="KrateProject"
        title="Create project"
        fields={projectFields}
        successText="Project created"
      />
    </section>
  </PageFrame>;
}

export async function AgentProjectBoardPage({ org = null, projectId } = {}) {
  const ui = await loadKrateUi(org);
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
      (w) => w.spec?.boardItemRef === itemName || w.metadata?.labels?.['krate.a5c.ai/board-item'] === itemName
    );
    const sess = sessions.find(
      (s) => s.spec?.boardItemRef === itemName || s.metadata?.labels?.['krate.a5c.ai/board-item'] === itemName
    );
    return {
      ...item,
      workspaceRef: ws?.metadata?.name || item.workspaceRef || null,
      workspacePvcStatus: ws?.status?.pvcPhase || ws?.status?.storagePhase || (ws ? 'Unknown' : null),
      sessionRef: sess?.metadata?.name || item.sessionRef || null,
      sessionStatus: sess?.status?.phase || null,
    };
  });
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`project / ${displayName}`} title={displayName} text={project ? (project.spec?.description || `Kanban board for project ${displayName}.`) : 'This project was not found in the current workspace.'} actions={[[`/agents/projects/${projectId}/issues`, 'Issue view'], ['/agents/projects', 'All projects'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/projects', 'Projects'], [`/agents/projects/${projectId}`, displayName]]}>
    <DegradedBanner model={ui.model} />
    {project ? <div className="card">
      <div className="cardTitle"><h2>Board</h2><StatusPill tone={enrichedItems.length ? 'good' : 'neutral'}>{enrichedItems.length} items</StatusPill></div>
      <EnhancedKanbanBoard project={project} initialIssues={enrichedItems} org={activeOrg} workspaces={workspaces} sessions={sessions} />
    </div> : <EmptyState title={`Project ${projectId} not found`} text="This project does not exist in the current workspace. Create it through Krate resource definitions." />}
  </PageFrame>;
}

export async function IssueScopePage({ org = null, projectId, view = 'kanban' } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const project = (ui.model.agents?.projects?.items || []).find((item) => item.metadata?.name === projectId) || null;
  const displayName = project?.spec?.displayName || projectId || 'Project';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`project issues / ${displayName}`} title={`${displayName} issues`} text="Use the same issue workspace for project and repository triage. Issues may link to zero, one, or many repositories." actions={[[`/agents/projects/${projectId}`, 'Project board'], [`/agents/projects/${projectId}/issues?view=kanban`, 'Kanban'], [`/agents/projects/${projectId}/issues?view=list`, 'List view']]} breadcrumbs={[[ '/', 'Krate' ], [ '/agents', 'Agents' ], [ '/agents/projects', 'Projects' ], [ `/agents/projects/${projectId}/issues`, `${displayName} issues` ]]}>
    <DegradedBanner model={ui.model} />
    <IssueWorkspace model={ui.model} resource={ui.issues} project={projectId} view={view} />
  </PageFrame>;
}

export async function IssueDetailPage({ org = null, repo = null, projectId = null, issueName }) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const scopedIssues = issuesForScope(ui.issues?.items || [], { repo, project: projectId });
  const issue = scopedIssues.find((item) => item.metadata?.name === issueName) || null;
  const parentHref = repo ? `/repositories/${repo}/issues` : projectId ? `/agents/projects/${projectId}/issues` : '/inbox';
  const parentLabel = repo || projectId || 'Issues';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath={repo ? '/repositories' : '/agents'} eyebrow={repo ? `repository issue / ${repo}` : `project issue / ${projectId}`} title={issue?.spec?.title || issueName} text="Edit the issue resource, review comments, and verify backend sync metadata from one full-page view." actions={[[parentHref, 'Back to issues'], [`${parentHref}?view=list`, 'List view']]} breadcrumbs={[[ '/', 'Krate' ], [ repo ? '/repositories' : '/agents/projects', repo ? 'Repositories' : 'Projects' ], [ parentHref, parentLabel ], [ `${parentHref}/${issueName}`, issueName ]]}>
    <DegradedBanner model={ui.model} />
    {issue ? <IssueDetailView model={ui.model} issue={issue} repo={repo} project={projectId} /> : <EmptyState title="Issue is not linked to this scope" text="This issue is not associated with the selected repository or project, so it is hidden from this issue view." />}
  </PageFrame>;
}

export async function AgentMemoryPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { repositories: { count: 0, items: [] }, snapshots: { count: 0 }, imports: { pending: 0, items: [] }, ontologies: { count: 0, items: [] } };
  const repoCount = memoryView.repositories?.count ?? (memoryView.repositories?.items?.length || 0);
  const snapshotCount = memoryView.snapshots?.count ?? 0;
  const pendingImports = memoryView.imports?.pending ?? 0;
  const ontologyCount = memoryView.ontologies?.count ?? (memoryView.ontologies?.items?.length || 0);
  const hasRepos = repoCount > 0;
  const memoryRepoFields = [
    { name: 'name', label: 'Name', placeholder: 'my-memory-repo', required: true },
    { name: 'repoUrl', label: 'Repository URL', type: 'url', placeholder: 'https://github.com/acme/memory', required: true },
    { name: 'description', label: 'Description', placeholder: 'What knowledge does this repo store?', required: false }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent memory" title="Memory repositories and imports" text="Manage agent memory repositories, search stored knowledge, review pending imports, and configure ontologies." actions={[['/agents/memory/search', 'Search'], ['/agents/memory/imports', 'Imports'], ['/agents/memory/ontology', 'Ontology']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory']]}>
    <DegradedBanner model={ui.model} />
    {hasRepos ? <>
      <section className="routeGrid four">
        <a href={orgHref(activeOrg, '/agents/memory')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Repositories</h3><StatusPill tone="good">{repoCount}</StatusPill></div>
          <p className="emptyText">Memory repositories configured</p>
        </a>
        <div className="card">
          <div className="cardTitle"><h3>Snapshots</h3><StatusPill tone={snapshotCount ? 'good' : 'neutral'}>{snapshotCount}</StatusPill></div>
          <p className="emptyText">Point-in-time snapshots</p>
        </div>
        <a href={orgHref(activeOrg, '/agents/memory/imports')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Pending imports</h3><StatusPill tone={pendingImports ? 'warn' : 'neutral'}>{pendingImports}</StatusPill></div>
          <p className="emptyText">Imports awaiting review</p>
        </a>
        <a href={orgHref(activeOrg, '/agents/memory/ontology')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Ontologies</h3><StatusPill tone={ontologyCount ? 'good' : 'neutral'}>{ontologyCount}</StatusPill></div>
          <p className="emptyText">Graph schema definitions</p>
        </a>
      </section>
      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <section className="routeGrid three" style={{ gridColumn: '1 / -1' }}>
          <a href={orgHref(activeOrg, '/agents/memory/search')} className="card quickAction" style={{ textDecoration: 'none' }}>
            <div className="cardTitle"><h3>Search memory</h3></div>
            <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Query structured records or full-text search across markdown documents.</p>
          </a>
          <a href={orgHref(activeOrg, '/agents/memory/imports')} className="card quickAction" style={{ textDecoration: 'none' }}>
            <div className="cardTitle"><h3>Review imports</h3></div>
            <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Inspect pending memory imports from agent runs and sessions.</p>
          </a>
          <a href={orgHref(activeOrg, '/agents/memory/ontology')} className="card quickAction" style={{ textDecoration: 'none' }}>
            <div className="cardTitle"><h3>Configure ontology</h3></div>
            <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Define node kinds, edge kinds, and graph schema for memory repositories.</p>
          </a>
        </section>
        <InlineCreateForm
          org={activeOrg}
          kind="AgentMemoryRepository"
          title="Add repository"
          fields={memoryRepoFields}
          buildSpec={buildMemoryRepoSpec}
          successText={(body) => `Added repository ${body.resource?.metadata?.name || ''}`}
        />
      </section>
    </> : <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <EmptyState title="No memory repositories configured" text="Memory repositories store structured knowledge extracted from agent runs. Add one using the form." />
      <InlineCreateForm
        org={activeOrg}
        kind="AgentMemoryRepository"
        title="Add repository"
        fields={memoryRepoFields}
        successText="Repository added"
      />
    </section>}
  </PageFrame>;
}

export async function AgentMemorySearchPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { repositories: { count: 0 } };
  const hasRepos = (memoryView.repositories?.count ?? 0) > 0;
  const exampleYaml = `apiVersion: krate.a5c.ai/v1alpha1
kind: AgentMemoryQuery
metadata:
  name: example-search
spec:
  repositoryRef: my-memory-repo
  mode: graph-and-grep
  graph:
    nodeKind: Service
    traverse:
      - edge: depends_on
        depth: 2
  grep:
    pattern: "deployment pipeline"
    fileGlob: "*.md"
  limit: 25`;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="memory search" title="Search agent memory" text="Query structured graph records or full-text search across markdown documents stored in memory repositories." actions={[['/agents/memory', 'Overview'], ['/agents/memory/imports', 'Imports']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory'], ['/agents/memory/search', 'Search']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <div className="cardTitle"><h2>Search</h2><StatusPill tone="good">live</StatusPill></div>
      <MemorySearchForm org={activeOrg} />
    </div>
    <section className="routeGrid three">
      <div className="card">
        <div className="cardTitle"><h3>Graph</h3><StatusPill tone="neutral">mode</StatusPill></div>
        <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Query structured records by node kind, traverse edges. Best for exploring relationships between services, teams, decisions, and runbooks.</p>
      </div>
      <div className="card">
        <div className="cardTitle"><h3>Grep</h3><StatusPill tone="neutral">mode</StatusPill></div>
        <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Full-text search across markdown documents. Best for finding specific content, code references, or text patterns in stored knowledge.</p>
      </div>
      <div className="card">
        <div className="cardTitle"><h3>Graph + Grep</h3><StatusPill tone="neutral">mode</StatusPill></div>
        <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Graph narrows candidates by node kind and edge traversal, then grep searches within matched documents. Best for targeted, precise queries.</p>
      </div>
    </section>
    <div className="card">
      <div className="cardTitle"><h3>Example AgentMemoryQuery resource</h3><StatusPill tone="neutral">reference</StatusPill></div>
      <pre style={{ background: '#1e1e2e', color: '#cdd6f4', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', lineHeight: '1.6', overflow: 'auto' }}><code>{exampleYaml}</code></pre>
    </div>
  </PageFrame>;
}

export async function AgentMemoryImportsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { imports: { items: [] } };
  const imports = memoryView.imports?.items || [];
  const awaitingReview = imports.filter((imp) => imp.status?.phase === 'AwaitingReview');
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="memory imports" title="Memory imports" text="Review agent run memory imports as they progress through collection, redaction, normalization, and review phases." actions={[['/agents/memory', 'Overview'], ['/agents/memory/search', 'Search']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory'], ['/agents/memory/imports', 'Imports']]}>
    <DegradedBanner model={ui.model} />
    {awaitingReview.length > 0 && (
      <div className="card">
        <div className="cardTitle"><h2>Pending review</h2><StatusPill tone="info">{awaitingReview.length} awaiting</StatusPill></div>
        <MemoryImportReview org={activeOrg} imports={awaitingReview} />
      </div>
    )}
    <div className="card">
      <div className="cardTitle"><h2>All imports</h2><StatusPill tone={imports.length ? 'good' : 'neutral'}>{imports.length} imports</StatusPill></div>
      {imports.length ? <div className="resourceTable">
        <div className="resourceRow" style={{ fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Name</span><span>Source</span><span>Phase</span><span>Repository</span><span>Created</span>
        </div>
        {imports.map((imp) => <a key={imp.metadata?.name} href={orgHref(activeOrg, `/agents/memory/imports/${imp.metadata?.name}`)} className="resourceRow" style={{ textDecoration: 'none' }}>
          <strong>{imp.metadata?.name}</strong>
          <span>{imp.spec?.source?.kind || 'unknown'}{imp.spec?.source?.runId ? ` / ${imp.spec.source.runId}` : ''}</span>
          <StatusPill tone={imp.status?.phase === 'AwaitingReview' ? 'info' : imp.status?.phase === 'Merged' ? 'good' : imp.status?.phase === 'Rejected' || imp.status?.phase === 'Failed' ? 'danger' : imp.status?.phase && ['Collecting','Redacting','Normalizing','Validating'].includes(imp.status.phase) ? 'warn' : 'neutral'}>{imp.status?.phase || 'Pending'}</StatusPill>
          <span>{imp.spec?.source?.repositoryRef || imp.spec?.repositoryRef || 'unassigned'}</span>
          <small>{imp.metadata?.creationTimestamp || ''}</small>
        </a>)}
      </div> : <EmptyState title="No memory imports yet" text="Memory imports appear when agent runs produce knowledge artifacts. Each import progresses through collection, redaction, normalization, validation, and review before merging into a memory repository." />}
    </div>
  </PageFrame>;
}

export async function AgentMemoryImportDetailPage({ org = null, importId } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { imports: { items: [] } };
  const imp = (memoryView.imports?.items || []).find((i) => i.metadata?.name === importId) || null;
  const importPhaseTone = (phase) => {
    if (!phase || phase === 'Pending') return 'neutral';
    if (phase === 'Collecting' || phase === 'Redacting' || phase === 'Normalizing' || phase === 'Validating') return 'warn';
    if (phase === 'AwaitingReview') return 'info';
    if (phase === 'Merged') return 'good';
    if (phase === 'Rejected' || phase === 'Failed') return 'danger';
    return 'neutral';
  };
  const source = imp?.spec?.source || {};
  const includeConfig = imp?.spec?.include || {};
  const phaseTransitions = imp?.status?.phaseTransitions || imp?.status?.history || [];
  const allPhases = ['Pending', 'Collecting', 'Redacting', 'Normalizing', 'Validating', 'AwaitingReview', 'Merged'];
  const currentPhaseIndex = allPhases.indexOf(imp?.status?.phase);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`memory import / ${importId}`} title={importId || 'Import detail'} text={imp ? `Memory import from ${source.kind || 'unknown source'} with phase ${imp.status?.phase || 'Pending'}.` : 'This memory import was not found in the current workspace.'} actions={[['/agents/memory/imports', 'All imports'], ['/agents/memory', 'Memory overview']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory'], ['/agents/memory/imports', 'Imports'], [`/agents/memory/imports/${importId}`, importId || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    {imp ? <>
      <section className="routeGrid two">
        <div className="card">
          <div className="cardTitle"><h3>{importId}</h3><StatusPill tone={importPhaseTone(imp.status?.phase)}>{imp.status?.phase || 'Pending'}</StatusPill></div>
          <dl className="kv">
            <dt>Name</dt><dd>{imp.metadata?.name}</dd>
            <dt>Namespace</dt><dd>{imp.metadata?.namespace || ui.model.namespace}</dd>
            <dt>Created</dt><dd>{imp.metadata?.creationTimestamp || 'unknown'}</dd>
          </dl>
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Source</h3><StatusPill tone="neutral">{source.kind || 'unknown'}</StatusPill></div>
          <dl className="kv">
            <dt>Kind</dt><dd>{source.kind || 'not specified'}</dd>
            <dt>Run ID</dt><dd>{source.runId || 'none'}</dd>
            <dt>Session ID</dt><dd>{source.sessionId || 'none'}</dd>
            <dt>Repository</dt><dd>{source.repositoryRef || imp.spec?.repositoryRef || 'unassigned'}</dd>
          </dl>
        </div>
      </section>
      <section className="routeGrid two">
        <div className="card">
          <div className="cardTitle"><h3>Include configuration</h3><StatusPill tone="neutral">spec</StatusPill></div>
          {Object.keys(includeConfig).length ? <ul className="compactList">{Object.entries(includeConfig).map(([key, value]) => <li key={key}><strong>{key}</strong>: {String(value)}</li>)}</ul> : <p className="emptyText">No include configuration specified. All available artifacts will be imported.</p>}
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Lifecycle</h3><StatusPill tone={phaseTransitions.length ? 'good' : 'neutral'}>{phaseTransitions.length || allPhases.length} phases</StatusPill></div>
          {phaseTransitions.length ? <ul className="compactList">{phaseTransitions.map((entry, index) => <li key={index}>{entry.timestamp || entry.time || 'unknown'}: {entry.phase || entry.status || 'unknown'}{entry.reason ? ` / ${entry.reason}` : ''}</li>)}</ul> : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>{allPhases.map((phase, index) => {
            const isComplete = currentPhaseIndex > index;
            const isCurrent = currentPhaseIndex === index;
            return <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isComplete ? '#22c55e' : isCurrent ? '#eab308' : '#d1d5db', flexShrink: 0 }} />
              <span style={{ color: isComplete || isCurrent ? '#111827' : '#9ca3af', fontWeight: isCurrent ? 600 : 400 }}>{phase}</span>
            </div>;
          })}</div>}
        </div>
      </section>
      <div className="card">
        <div className="cardTitle"><h3>Actions</h3><StatusPill tone={imp.status?.phase === 'AwaitingReview' ? 'info' : 'neutral'}>{imp.status?.phase === 'AwaitingReview' ? 'review required' : 'read-only'}</StatusPill></div>
        <MemoryImportReview org={activeOrg} imports={[imp]} />
      </div>
    </> : <EmptyState title={`Import ${importId} not found`} text="This memory import does not exist in the current workspace. Memory imports are created when agent runs produce knowledge artifacts." />}
  </PageFrame>;
}

export async function AgentMemoryOntologyPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { ontologies: { count: 0, items: [] } };
  const ontologies = memoryView.ontologies?.items || [];
  const primaryOntology = ontologies[0] || null;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="memory ontology" title="Memory ontology" text="Define graph schema for memory repositories, including supported node kinds and edge relationship types." actions={[['/agents/memory', 'Overview'], ['/agents/memory/search', 'Search']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory'], ['/agents/memory/ontology', 'Ontology']]}>
    <DegradedBanner model={ui.model} />
    {!primaryOntology && (
      <div className="card" style={{ borderLeft: '3px solid var(--color-info, #3b82f6)', marginBottom: '0.5rem' }}>
        <div className="cardTitle"><h3>No ontology configured</h3><StatusPill tone="neutral">new</StatusPill></div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No AgentMemoryOntology resource exists yet. Use the editor below to define node kinds and edge kinds, then save to create one.</p>
      </div>
    )}
    {primaryOntology && (
      <div className="card" style={{ marginBottom: '0.5rem' }}>
        <div className="cardTitle"><h2>{primaryOntology.metadata?.name || 'default'}</h2><StatusPill tone="good">{primaryOntology.status?.phase || 'Active'}</StatusPill></div>
        <dl className="kv">
          <dt>Namespace</dt><dd>{primaryOntology.metadata?.namespace || ui.model.namespace}</dd>
          <dt>Node kinds</dt><dd>{(primaryOntology.spec?.nodeKinds || []).length}</dd>
          <dt>Edge kinds</dt><dd>{(primaryOntology.spec?.edgeKinds || []).length}</dd>
        </dl>
      </div>
    )}
    <MemoryOntologyEditor org={activeOrg} initialOntology={primaryOntology} />
  </PageFrame>;
}

export async function AgentSettingsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { stacks: { count: 0 }, runs: { count: 0 }, rules: { count: 0 }, sessions: { count: 0 }, workspaces: { count: 0 }, approvals: { count: 0 }, adapters: { count: 0, items: [] }, providers: { count: 0, items: [] }, gateway: null };
  const gateway = agentView.gateway;
  const adapters = agentView.adapters?.items || [];
  const providers = agentView.providers?.items || [];
  const gatewayReady = gateway?.status?.conditions?.find((c) => c.type === 'Ready');
  const agentsEnabled = (agentView.stacks?.count || 0) > 0 || gateway != null;
  const agentMuxConnected = gateway != null && gatewayReady?.status === 'True';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent settings" title="Agent settings" text="Configure the gateway connection, adapter bindings, and provider credentials for this org." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/settings', 'Settings']]}>
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

export async function AgentSessionsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { sessions: { count: 0, items: [] } };
  const sessions = agentView.sessions?.items || [];
  const phaseTone = (phase) => {
    if (!phase || phase === 'Pending') return 'neutral';
    if (phase === 'Active' || phase === 'Running') return 'warn';
    if (phase === 'Completed' || phase === 'Succeeded') return 'good';
    if (phase === 'Failed' || phase === 'Errored') return 'danger';
    return 'neutral';
  };
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent sessions" title="Agent chat sessions" text="Each session represents an Agent Mux chat with lifecycle state, transcript, and cost tracking." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks'], ['/agents/runs', 'Dispatch runs']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/sessions', 'Sessions']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}><LiveUpdates org={activeOrg} /></div>
    <div className="card">
      <div className="cardTitle"><h2>Sessions</h2><StatusPill tone={sessions.length ? 'good' : 'neutral'}>{sessions.length} sessions</StatusPill></div>
      {sessions.length ? <div className="resourceTable">{sessions.map((session) => <div key={session.metadata?.name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a href={orgHref(activeOrg, `/agents/sessions/${session.metadata?.name}`)} style={{ textDecoration: 'none', display: 'contents' }}>
          <strong>{session.metadata?.name}</strong>
          <span>{session.spec?.agentStack || session.spec?.stackRef || 'unassigned'}</span>
          <StatusPill tone={phaseTone(session.status?.phase)}>{session.status?.phase || 'Pending'}</StatusPill>
        </a>
        {session.spec?.dispatchRun ? (
          <a href={orgHref(activeOrg, `/agents/runs/${session.spec.dispatchRun}`)} style={{ color: '#2563eb', fontSize: '0.875rem' }}>{session.spec.dispatchRun}</a>
        ) : (
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>no run</span>
        )}
        <a href={orgHref(activeOrg, `/agents/sessions/${session.metadata?.name}`)} style={{ textDecoration: 'none', display: 'contents' }}>
          <small>{session.status?.updatedAt || session.metadata?.creationTimestamp || ''}</small>
        </a>
        {(session.status?.phase !== 'Terminated' && session.status?.phase !== 'Completed' && session.status?.phase !== 'Succeeded') ? (
          <ResourceActions org={activeOrg} apiPath={`agents/sessions/${session.metadata?.name}`} actions={['terminate']} />
        ) : null}
      </div>)}</div> : <EmptyState title="No agent sessions" text="Sessions are created automatically when agents run. Configure agent stacks and trigger rules to start sessions." info />}
    </div>
  </PageFrame>;
}

export async function AgentSessionDetailPage({ org = null, sessionId } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { sessions: { items: [] }, transcripts: { items: [] }, runs: { items: [] }, stacks: { items: [] } };
  const session = (agentView.sessions?.items || []).find((s) => s.metadata?.name === sessionId) || null;
  const transcriptRecord = (agentView.transcripts?.items || []).find((t) => t.spec?.sessionRef === sessionId);
  const messages = transcriptRecord?.spec?.messages || [];
  const dispatchRunName = session?.spec?.dispatchRun || null;
  const stackName = session?.spec?.agentStack || session?.spec?.stackRef || null;
  const allRuns = agentView.runs?.items || [];
  const allTranscripts = agentView.transcripts?.items || [];
  const sessionRuns = allRuns.filter((r) => r.status?.sessionRef === sessionId || r.spec?.sessionRef === sessionId || r.metadata?.name === dispatchRunName);
  const phaseTone = (phase) => {
    if (!phase || phase === 'Pending') return 'neutral';
    if (phase === 'Active' || phase === 'Running') return 'warn';
    if (phase === 'Completed' || phase === 'Succeeded') return 'good';
    if (phase === 'Failed' || phase === 'Errored') return 'danger';
    return 'neutral';
  };
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`agent session / ${sessionId}`} title={sessionId || 'Session detail'} text={session ? `Agent session on ${stackName || 'unknown stack'} with phase ${session.status?.phase || 'Pending'}.` : 'This agent session was not found in the current workspace.'} actions={[['/agents/sessions', 'All sessions'], ['/agents/runs', 'Dispatch runs']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/sessions', 'Sessions'], [`/agents/sessions/${sessionId}`, sessionId || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
      <ApprovalModeToggle initialMode={session?.spec?.approvalMode || 'prompt'} />
      <SessionCost turns={transcriptRecord?.status?.turns || []} totalCost={session?.status?.cost ?? transcriptRecord?.status?.totalCost} compact />
    </div>
    <SessionShell
      session={session}
      messages={messages}
      runs={sessionRuns}
      transcripts={allTranscripts}
      transcriptRecord={transcriptRecord}
    />
  </PageFrame>;
}
