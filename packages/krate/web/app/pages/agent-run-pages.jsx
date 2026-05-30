// Routes: /orgs/[org]/agents/runs, /agents/runs/[name] — dispatch run list and detail.
import { loadKrateUi, orgHref, StatusPill, DegradedBanner, EmptyState } from '../lib/krate-ui.jsx';
import { resourceToYaml } from '@a5c-ai/krate-sdk';
import { PageFrame } from '../lib/page-frame.jsx';
import { DispatchButton } from '../components/agent/dispatch-button.jsx';
import { LiveUpdates } from '../components/agent/live-updates.jsx';
import { ManualDispatchButton, RunActions } from '../components/agent/run-actions.jsx';
import { CopyButton } from '../components/inference/inference-helpers.jsx';
import { phaseTone, FlowVisualization } from './agent-helpers.jsx';

export async function AgentRunsPage({ org = null, linkToDetail = false } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { runs: { count: 0, items: [] }, stacks: { count: 0, items: [] } };
  const allRuns = agentView.runs.items || [];
  const PAGE_SIZE = 25;
  const runs = allRuns.slice(0, PAGE_SIZE);
  const hasMore = allRuns.length > PAGE_SIZE;
  const availableStacks = (agentView.stacks?.items || []).map(s => s.metadata?.name).filter(Boolean);
  const stackResources = agentView.stacks?.items || [];
  const activeMeetings = agentView.meetings?.active || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent dispatch runs" title="Dispatch runs" text="Track agent dispatch runs across stacks, repositories, and phases. Each run represents a dispatched agent task." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/runs', 'Dispatch runs']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
      <ManualDispatchButton org={activeOrg} stacks={availableStacks} />
      <DispatchButton org={activeOrg} stacks={stackResources} meetings={activeMeetings} />
      <LiveUpdates org={activeOrg} />
    </div>
    <div className="card">
      <div className="cardTitle"><h2>Dispatch runs</h2><StatusPill tone={allRuns.length ? 'good' : 'neutral'}>{hasMore ? `${runs.length} of ${allRuns.length}` : allRuns.length} runs</StatusPill></div>
      {runs.length ? <ul className="resourceList runList">{runs.map((run) => <li key={run.metadata?.name}>
        {linkToDetail ? <a href={orgHref(activeOrg, `/agents/runs/${run.metadata?.name}`)}><strong>{run.metadata?.name}</strong></a> : <strong>{run.metadata?.name}</strong>}
        <StatusPill tone={phaseTone(run.status?.phase)}>{run.status?.phase || 'Pending'}</StatusPill>
        <span>{run.spec?.stackRef || 'unassigned'} / {run.spec?.repository || 'no repository'}</span>
        {run.spec?.meetingRef ? <small>Meeting: <a href={orgHref(activeOrg, `/meetings/${run.spec.meetingRef}`)}>{run.spec.meetingRef}</a></small> : null}
        <small>Phase: {run.status?.phase || 'Pending'}{run.status?.startedAt ? ` / Started: ${run.status.startedAt}` : ''}</small>
        <RunActions org={activeOrg} runName={run.metadata?.name} stackRef={run.spec?.stackRef || run.spec?.agentStack} phase={run.status?.phase} />
      </li>)}</ul> : <EmptyState title="No dispatch runs" text="Dispatch runs appear when agent stacks are triggered by rules or manual dispatch. Configure trigger rules or dispatch manually to create runs."><DispatchButton org={activeOrg} stacks={stackResources} meetings={activeMeetings} /></EmptyState>}
    </div>
  </PageFrame>;
}

export async function AgentRunDetailPage({ org = null, runId } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { runs: { items: [] }, stacks: { items: [] }, sessions: { items: [] } };
  const run = (agentView.runs.items || []).find((r) => r.metadata?.name === runId) || null;
  const stackName = run?.spec?.stackRef || run?.spec?.agentStack || run?.spec?.targetStack || null;
  const meetingRef = run?.spec?.meetingRef || null;
  const meetingUrl = run?.spec?.meetingContext?.roomUrl || null;
  const attempts = (agentView.attempts?.items || []).filter((a) => a.spec?.dispatchRun === runId || a.spec?.runRef === runId);
  const contextDigest = run?.spec?.contextBundle?.digest || run?.status?.contextDigest || null;
  const contextSourceCount = run?.spec?.contextBundle?.sourceCount ?? run?.spec?.contextBundle?.sources?.length ?? null;
  const permissionDecision = run?.spec?.permission?.decision || run?.status?.permissionDecision || null;
  const repository = run?.spec?.repository || null;
  const phases = run?.status?.phaseTransitions || run?.status?.history || [];
  const runTranscripts = agentView.transcripts?.items || [];
  const sessionRef = run?.status?.sessionRef || run?.spec?.sessionRef || null;
  const runTranscript = runTranscripts.find((t) => t.spec?.sessionRef === sessionRef || t.spec?.runRef === runId) || null;
  const runTranscriptMessages = runTranscript?.spec?.messages || [];
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
          {meetingRef ? <p>Meeting: <a href={orgHref(activeOrg, `/meetings/${meetingRef}`)}>{meetingRef}</a>{meetingUrl ? <> / <a href={meetingUrl}>join room</a></> : null}</p> : null}
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <RunActions org={activeOrg} runName={runId} stackRef={stackName} phase={run.status?.phase} />
            <CopyButton text={resourceToYaml(run)} label="Copy as YAML" />
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
      <section className="routeGrid one">
        <div className="card">
          <div className="cardTitle"><h3>Transcript</h3><StatusPill tone={runTranscriptMessages.length ? 'good' : 'neutral'}>{runTranscriptMessages.length} messages</StatusPill></div>
          {runTranscriptMessages.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflow: 'auto', padding: '0.5rem 0' }}>
            {runTranscriptMessages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isSystem = msg.role === 'system';
              const isTool = msg.role === 'tool' || msg.role === 'tool_result';
              return <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: isUser ? 'var(--surface-raised, rgba(37,99,235,0.05))' : isSystem ? 'var(--surface-overlay, rgba(0,0,0,0.02))' : isTool ? 'var(--surface-overlay, rgba(0,0,0,0.02))' : 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isUser ? 'var(--accent)' : isTool ? '#d97706' : 'var(--text-muted)' }}>{msg.role || 'unknown'}</span>
                  {msg.timestamp && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{msg.timestamp}</span>}
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text)' }}>{typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}</div>
                {msg.usage && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                  {msg.usage.input_tokens != null && <span>In: {msg.usage.input_tokens}</span>}
                  {msg.usage.output_tokens != null && <span>Out: {msg.usage.output_tokens}</span>}
                </div>}
              </div>;
            })}
          </div> : <p className="emptyText">No transcript messages recorded. Messages appear after the agent session produces output.</p>}
        </div>
      </section>
    </> : <EmptyState title={`Run ${runId} not found`} text="This dispatch run does not exist in the current workspace. Dispatch runs are created when agent stacks are triggered by rules or manual dispatch." cta={orgHref(activeOrg, '/agents/runs')} ctaLabel="View all runs" />}
  </PageFrame>;
}
