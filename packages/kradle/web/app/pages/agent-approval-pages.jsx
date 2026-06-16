// Routes: /orgs/[org]/agents/approvals — pending and resolved agent approval views.
import { loadKradleUi, orgHref, StatusPill, DegradedBanner, EmptyState } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { ApprovalDecisionButtons } from '../components/agent/approval-actions.jsx';
import { LiveUpdates } from '../components/agent/live-updates.jsx';
import { relativeTime, ResolvedApprovalsSection } from './agent-helpers.jsx';

export async function AgentApprovalsPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const agentView = ui.model.agents || { approvals: { count: 0, items: [], pending: [] } };
  const allApprovals = agentView.approvals?.items || [];
  const pending = agentView.approvals?.pending || allApprovals.filter(a => !a.status?.phase || a.status.phase === 'Pending');
  const resolved = allApprovals.filter(a => a.status?.phase && a.status.phase !== 'Pending');
  const approvedCount = resolved.filter(a => a.status?.phase === 'Approved').length;
  const deniedCount = resolved.filter(a => a.status?.phase === 'Denied').length;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent approvals" title="Approval inbox" text="Review and act on pending agent approval requests. Agents pause here when they need human authorization for tools, secrets, write-back, or release actions." actions={[['/agents', 'Overview'], ['/agents/runs', 'Dispatch runs']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/approvals', 'Approvals']]}>
    <DegradedBanner model={ui.model} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}><LiveUpdates org={activeOrg} /></div>
    <section className="routeGrid three">
      <div className="card"><div className="cardTitle"><h3>Pending</h3><StatusPill tone={pending.length ? 'warn' : 'neutral'}>{pending.length}</StatusPill></div><p className="emptyText">Awaiting human decision</p></div>
      <div className="card"><div className="cardTitle"><h3>Approved</h3><StatusPill tone={approvedCount ? 'good' : 'neutral'}>{approvedCount}</StatusPill></div><p className="emptyText">Actions authorized</p></div>
      <div className="card"><div className="cardTitle"><h3>Denied</h3><StatusPill tone={deniedCount ? 'danger' : 'neutral'}>{deniedCount}</StatusPill></div><p className="emptyText">Actions rejected</p></div>
    </section>
    <div className="card" style={{ borderLeft: pending.length ? '3px solid var(--warning)' : undefined }}>
      <div className="cardTitle"><h2>Pending approvals</h2><StatusPill tone={pending.length ? 'warn' : 'neutral'}>{pending.length} pending</StatusPill></div>
      {pending.length ? <div className="stack">{pending.map((approval) => {
        const name = approval.metadata?.name || 'unknown';
        const action = approval.spec?.action || 'Unknown action';
        const requestedBy = approval.spec?.requestedBy || approval.spec?.stackRef || 'unknown agent';
        const dispatchRun = approval.spec?.dispatchRun || null;
        const requestedAt = approval.metadata?.creationTimestamp || approval.spec?.requestedAt || null;
        const description = approval.spec?.description || approval.spec?.reason || `Agent requests permission to perform: ${action}`;
        return <div key={name} className="card" style={{ background: 'rgb(219 163 68 / 0.12)', border: '1px solid rgb(219 163 68 / 0.45)' }}>
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
