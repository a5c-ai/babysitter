// Routes: /orgs/[org]/agents/sessions, /agents/sessions/[name] — agent session list and live detail.
import { loadKrateUi, orgHref, StatusPill, DegradedBanner, EmptyState } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { LiveUpdates } from '../components/agent/live-updates.jsx';
import { ApprovalModeToggle } from '../components/agent/approval-mode-toggle.jsx';
import { SessionShell } from '../components/agent/session-shell.jsx';
import { SessionCost } from '../components/agent/session-cost.jsx';
import { ResourceActions } from '../components/resource-crud-actions.jsx';
import { phaseTone } from './agent-helpers.jsx';
import { resolveSessionAgentIdentity, agentIdentityLabel } from '../lib/agent-identity.js';

export async function AgentSessionsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { sessions: { count: 0, items: [] } };
  const allSessions = agentView.sessions?.items || [];
  const PAGE_SIZE = 25;
  const sessions = allSessions.slice(0, PAGE_SIZE);
  const hasMore = allSessions.length > PAGE_SIZE;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent sessions" title="Agent chat sessions" text="Each session represents an Agent Mux chat with lifecycle state, transcript, and cost tracking." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks'], ['/agents/runs', 'Dispatch runs']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/sessions', 'Sessions']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}><LiveUpdates org={activeOrg} /></div>
    <div className="card">
      <div className="cardTitle"><h2>Sessions</h2><StatusPill tone={sessions.length ? 'good' : 'neutral'}>{sessions.length} sessions</StatusPill></div>
      {sessions.length ? <div className="resourceTable">{sessions.map((session) => {
        const identity = resolveSessionAgentIdentity(session, ui.model);
        return <div key={session.metadata?.name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a href={orgHref(activeOrg, `/agents/sessions/${session.metadata?.name}`)} style={{ textDecoration: 'none', display: 'contents' }}>
          <strong>{session.metadata?.name}</strong>
          <span>{agentIdentityLabel(identity, session.spec?.agentStack || session.spec?.stackRef || 'unassigned')}</span>
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
          <ResourceActions org={activeOrg} apiPath={`resources/AgentSession/${session.metadata?.name}`} actions={['terminate']} />
        ) : (
          <ResourceActions org={activeOrg} apiPath={`resources/AgentSession/${session.metadata?.name}`} actions={['delete']} />
        )}
      </div>;
      })}</div> : <EmptyState title="No agent sessions" text="Sessions are created automatically when agents run. Configure agent stacks and trigger rules to start sessions." cta={orgHref(activeOrg, '/agents/stacks/new')} ctaLabel="Create a stack" />}
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
  const identity = resolveSessionAgentIdentity(session, ui.model);
  const allRuns = agentView.runs?.items || [];
  const allTranscripts = agentView.transcripts?.items || [];
  const sessionRuns = allRuns.filter((r) => r.status?.sessionRef === sessionId || r.spec?.sessionRef === sessionId || r.metadata?.name === dispatchRunName);
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
      identity={identity}
    />
  </PageFrame>;
}
