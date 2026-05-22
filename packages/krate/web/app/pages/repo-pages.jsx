import { loadKrateUi, orgHref, modelHref, publicResource, resourceJson, sanitizeCopy, sanitizeAction, displayKind, displayRole, displayCommand, deploymentKind, StatusPill, DegradedBanner, EmptyState, InfoList, PlanCard, ResourceTable } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { IssueWorkspace, IssueDetailView, issuesForScope, IssueDetailPage, IssueScopePage } from './agent-pages.jsx';
import { CodeEditor, LiveWatchPanel } from '../components/code-editor.jsx';
import { DeploymentManager, RepositoryManager, ResourceApplyPanel, UserManagementPanel } from '../components/resource-actions.jsx';
import { ResourceActions, InlineCreateForm } from '../components/resource-crud-actions.jsx';
import { RepoCodeBrowser } from '../components/repo-code-browser.jsx';
import { PullRequestList } from '../components/pull-request-list.jsx';
import { RepoRuns } from '../components/repo-runs.jsx';
import { WebhookManager } from '../components/webhook-manager.jsx';
import { DeploymentPipeline } from '../components/deployment-pipeline.jsx';
import { RunnerPoolManager } from '../components/runner-pool-manager.jsx';
import { ActivityFeed } from '../components/activity-feed.jsx';
import { HealthMonitor } from '../components/health-monitor.jsx';

// ── Internal helpers ─────────────────────────────────────────────────────────

function RepositoryHeader({ repo, repository, model }) {
  const visibility = repository?.spec?.visibility || 'private';
  const branch = repository?.spec?.defaultBranch || 'main';
  const stars = repository ? 12 : 0;
  const forks = repository ? 3 : 0;
  return <section className="repoHeader" aria-label="Repository header">
    <div className="repoTitleLine"><span className="repoOwner">krate</span><span>/</span><strong>{repo}</strong><StatusPill tone="neutral">{visibility}</StatusPill></div>
    <div className="repoMetaLine"><span>{branch}</span><span>{model.namespace}</span><span>{repository?.status?.phase || 'not connected'}</span></div>
    <div className="repoHeaderActions"><span className="repoBadge">Watch</span><span className="repoBadge">Fork <span>{forks}</span></span><span className="repoBadge">Star <span>{stars}</span></span></div>
  </section>;
}

function RepositoryCommandBar({ org = 'default', repo, repository, model }) {
  const disabled = !repository;
  return <section className="repoCommandBar" aria-label="Repository command bar"><a className="primaryCommand" href={orgHref(org, disabled ? '/repositories' : `/repositories/${repo}/code`)}>{disabled ? 'Create repository' : 'Clone / open code'}</a><a href={orgHref(org, disabled ? '/repositories' : `/repositories/${repo}/pull-requests`)}>Open review</a><a href={orgHref(org, '/deployments')}>Deploy</a><a href={orgHref(org, disabled ? '/repositories' : `/repositories/${repo}/settings`)}>Manage access</a><div><span>Readiness</span><code>{disabled ? 'Repository missing' : `Access checks in ${model.namespace}`}</code></div></section>;
}

function RepositoryLanding({ model, repositories }) {
  return <div className="card repoBrowser"><div className="cardTitle"><h3>Repository home</h3><StatusPill tone={repositories.length ? 'good' : 'warn'}>{repositories.length} repos</StatusPill></div><p>Create or import a repository, then move through code, reviews, runs, automations, and settings.</p>{repositories.length ? <ul className="resourceList">{repositories.map((repository) => <li key={repository.metadata?.name}><a href={modelHref(model, `/repositories/${repository.metadata?.name}/code`)}><strong>{repository.metadata?.name}</strong></a><span>{repository.spec?.visibility || 'internal'} · {repository.spec?.defaultBranch || 'main'}</span><small>Phase: {repository.status?.phase || 'Unknown'}</small></li>)}</ul> : <EmptyState title="Create or import your first repository" text="Use the form on this page. The advanced editor is available only when you need it." cta={modelHref(model, '/repositories')} ctaLabel="Create repository" /> }<InfoList title="Next best actions" items={model.views.dashboard.excellentFlows.slice(0, 4)} /></div>;
}

function ForgeFlowRail({ repository, model }) {
  const repoName = repository?.metadata?.name || repository?.name || '<repository>';
  const steps = [['Create', '/repositories', 'Create the repository'], ['Clone', `/repositories/${repoName}/code`, 'Copy clone URLs and branch'], ['Open review', `/repositories/${repoName}/pull-requests`, 'Review files and checks'], ['Merge', `/repositories/${repoName}/pull-requests`, 'Merge when policy is satisfied'], ['Deploy', '/deployments', 'Promote to an environment'], ['Observe', `/repositories/${repoName}/runs`, 'Follow runs and events']];
  return <section className="forgeFlowRail" aria-label="Forge workflow"><div><span className="eyebrow">guided flow</span><h2>Create → review → merge → deploy</h2><p>The default journey is task-led. Advanced resource details stay available on demand.</p></div><ol>{steps.map(([label, href, description]) => <li key={label}><a href={modelHref(model, href)}><strong>{label}</strong><span>{description}</span></a></li>)}</ol><StatusPill tone={model.status === 'ready' ? 'good' : 'warn'}>{model.status}</StatusPill></section>;
}

function QuickStart({ repository, org = 'default' }) {
  const repo = repository?.metadata?.name;
  const cards = [
    ['Create repository', '/repositories', 'Start code hosting, clone URLs, and default branch setup.'],
    ['Open a review', repo ? `/repositories/${repo}/pull-requests` : '/inbox', 'Check changed files, runs, policy, and merge readiness.'],
    ['Ship a deployment', '/deployments', 'Promote repository changes through releases and environments.']
  ];
  return <section className="routeGrid three">{cards.map(([title, href, text]) => <a className="card quickAction" key={title} href={orgHref(org, href)}><h3>{title}</h3><p>{text}</p></a>)}</section>;
}

function DashboardMetrics({ model }) {
  const cards = model.views.dashboard.cards;
  return <div className="card"><div className="cardTitle"><h2>Workspace counts</h2><StatusPill tone={model.status === 'ready' ? 'good' : 'warn'}>{model.status}</StatusPill></div><div className="metricGrid">{cards.map((card) => <a href={modelHref(model, card.href)} key={card.label}><strong>{card.value}</strong><span>{card.label}</span></a>)}</div><InfoList title="Readiness" items={model.validation.map((item) => `${item.passed ? 'Ready' : 'Needs attention'} ${sanitizeCopy(item.name)}: ${sanitizeCopy(item.evidence)}`)} /></div>;
}

function ResourceList({ model }) {
  return <details className="card"><summary><span><h3>Advanced resource records</h3><p>Expand to inspect the records behind this workspace.</p></span></summary><div className="resourceTable">{model.resources.map((resource) => <div key={displayKind(resource.kind)} className="resourceRow"><strong>{displayKind(resource.kind)}</strong><span>{resource.count} items</span><code>{displayCommand(resource, 'list')}</code></div>)}</div></details>;
}

function PeopleAdmin({ model, repositories }) {
  return <div className="routeGrid wideLeft"><UserManagementPanel namespace={model.namespace} org={model.org?.slug || 'default'} identity={model.identity} repositories={repositories} /><div className="stack"><IdentitySummary identity={model.identity} /><ResourceTable resource={model.resources.find((resource) => resource.kind === 'User')} /><ResourceTable resource={model.resources.find((resource) => resource.kind === 'IdentityMapping')} /></div></div>;
}

function IdentitySummary({ identity = {} }) {
  const counts = identity.counts || {};
  const readiness = identity.reconciliation?.statuses || [];
  const readinessItems = readiness.slice(0, 5).map((item) => `${item.kind} ${item.name}: ${item.phase}`);
  return <div className="card"><div className="cardTitle"><h3>Access overview</h3><StatusPill tone="neutral">Krate managed</StatusPill></div><div className="metricGrid"><a href={orgHref(identity.org || 'default', '/people')}><strong>{counts.users || 0}</strong><span>Users</span></a><a href={orgHref(identity.org || 'default', '/people')}><strong>{counts.teams || 0}</strong><span>Teams</span></a><a href={orgHref(identity.org || 'default', '/people')}><strong>{counts.pendingInvites || 0}</strong><span>Invites</span></a><a href={orgHref(identity.org || 'default', '/people')}><strong>{counts.repositoryGrants || 0}</strong><span>Access grants</span></a></div><InfoList title="Access readiness" items={readinessItems.length ? readinessItems : ['No access resources need attention']} /><InfoList title="Sign-in methods" items={(identity.providers || []).map((provider) => `${provider.label}: ${provider.enabled ? provider.phase : 'disabled'}`)} /></div>;
}

function ArchitectureMap({ model, compact = false }) {
  const lanes = Object.values(model.controller.architecture || {});
  return <details className={`card architectureMap ${compact ? 'compactArchitecture' : ''}`}><summary><span><h3>Advanced architecture details</h3><p>Expand only when troubleshooting workspace internals.</p></span><StatusPill tone="neutral">collapsed</StatusPill></summary><div className="architectureLanes">{lanes.map((lane) => <article key={lane.role}><strong>{displayRole(lane.role)}</strong><p>{sanitizeCopy(lane.scope)}</p><small>{lane.namespace ? `workspace: ${lane.namespace}` : sanitizeCopy(lane.boundary || `owns: ${(lane.owns || []).join(', ')}`)}</small></article>)}</div></details>;
}

function DeploymentCenter({ model, deployments, releases }) {
  const deploymentItems = deployments?.items || [];
  return <div className="card"><div className="cardTitle"><h3>Krate deployment center</h3><StatusPill tone={deploymentItems.length ? 'good' : 'neutral'}>{deploymentItems.length} deployments</StatusPill></div><p>Promote repository changes through environments, releases, policies, and automation runs without leaving Krate.</p><div className="metricGrid"><a href={modelHref(model, '/repositories')}><strong>{model.metrics.repositories}</strong><span>Repositories</span></a><a href={modelHref(model, '/deployments')}><strong>{deploymentItems.length}</strong><span>Deployments</span></a><a href={modelHref(model, '/deployments')}><strong>{releases?.count || 0}</strong><span>Releases</span></a></div>{deploymentItems.length ? <ul className="resourceList">{deploymentItems.map((item) => <li key={item.metadata?.name}><strong>{item.metadata?.name}</strong><span>{item.status?.status || item.status?.phase || 'Pending'}</span><small>{(item.status?.services || []).length} services · {(item.status?.appliedResources || []).length} managed resources</small></li>)}</ul> : <EmptyState title="No deployments yet" text="Choose a repository and create a deployment to start a release flow." />}</div>;
}

function InboxFlow({ model }) {
  const review = model.views.pullRequestReview;
  const issueResource = model.resources.find((resource) => resource.kind === 'Issue');
  return <div className="card inboxCard"><div className="cardTitle"><h3>Review inbox</h3><StatusPill tone={review ? 'good' : 'neutral'}>{review ? 'ready' : 'empty'}</StatusPill></div>{review ? <PullRequestReviewSummary review={review} /> : <EmptyState title="No pull requests waiting" text="Open a review from a repository to see files, checks, and merge readiness here." />}<div className="workQueue"><article><strong>Reviews</strong><span>{model.resources.find((resource) => resource.kind === 'PullRequest')?.count || 0}</span></article><article><strong>Issues</strong><span>{issueResource?.count || 0}</span></article><article><strong>Policy warnings</strong><span>{model.events.filter((event) => String(event.message || '').toLowerCase().includes('policy')).length}</span></article></div></div>;
}

function PullRequestReviewPanel({ model, repo }) {
  const review = model.views.pullRequestReview;
  if (!review) return <EmptyState title="No reviewable pull request" text={`No reviews are waiting for ${repo}. Create a review from code changes to populate this surface.`} />;
  return <div className="card reviewShell"><PullRequestReviewSummary review={review} /><div className="diffBlock"><code>{(review.changedFiles.length ? review.changedFiles : ['README.md', 'src/app.js']).map((file) => `diff -- ${file}\n+ reviewed through Krate policy and runs\n`).join('\n')}</code></div><div className="mutationBar"><span>{review.keyboardShortcuts.join(' · ')}</span><a className="actionButton" href={modelHref({ org: { slug: review.org || 'default' } }, '/advanced-plans')}>Advanced details</a></div></div>;
}

function PullRequestReviewSummary({ review }) {
  return <div><h3>{review.pullRequest.spec?.title || review.pullRequest.metadata?.name}</h3><div className="phaseBadges"><span>{review.pullRequest.status?.phase || 'Open'}</span><span>{review.pipelineRuns.length} runs</span><span>{review.jobs.length} jobs</span></div><ul className="compactList"><li>Changed files: {review.changedFiles.length || 'reported by status when available'}</li><li>Merge gate: checks, review decision, branch policy, policy preview</li><li>Decision: ready when checks and policy agree</li></ul></div>;
}

function RunCenter({ model, pipelines, repositories = [], repo = null }) {
  const allItems = pipelines?.items || [];
  const items = repo ? allItems.filter((run) => run.spec?.repository === repo || run.metadata?.labels?.repository === repo) : allItems;
  const counts = runPhaseCounts(items);
  const failing = repo ? items.find((run) => run.status?.phase === 'Failed') : model.views.failingRun?.pipeline;
  const recent = items.slice(0, 6);
  const totalRepositories = repo ? 1 : repositories.length;
  return <div className="card runCard"><div className="cardTitle"><h2>{repo ? 'Repository runs' : 'Workspace runs'}</h2><StatusPill tone={failing ? 'danger' : items.length ? 'good' : 'neutral'}>{failing ? 'needs attention' : `${items.length} runs`}</StatusPill></div><p>Runs are the human workflow: checks, jobs, retries, and merge or release gates. Krate stores them as Pipeline resources, but this page stays focused on status and next action.</p><div className="metricGrid"><a href={modelHref(model, repo ? `/repositories/${repo}/pull-requests` : '/inbox')}><strong>{counts.Running || 0}</strong><span>Running</span></a><a href={modelHref(model, '/runs')}><strong>{counts.Failed || 0}</strong><span>Failed</span></a><a href={modelHref(model, '/runs')}><strong>{counts.Succeeded || 0}</strong><span>Succeeded</span></a><a href={modelHref(model, '/repositories')}><strong>{totalRepositories}</strong><span>Repositories</span></a></div>{failing ? <RunAttention model={model} run={failing} /> : <RunEmptyOrRecent runs={recent} repo={repo} />}<div className="stateStrip"><span>Queued by repository events</span><span>Scheduled onto runner capacity</span><span>Streams job status and events</span><span>Feeds review and release gates</span></div></div>;
}

function RunAttention({ model, run }) {
  const currentStep = run.status?.currentStep || run.spec?.resumeFrom || 'failed step';
  return <div className="runAttention"><h3>{run.metadata?.name}</h3><p>{sanitizeCopy(run.spec?.repository || 'repository')} at {sanitizeCopy(run.spec?.ref || 'ref')} needs attention around <strong>{sanitizeCopy(currentStep)}</strong>.</p><div className="heroActions"><a href={modelHref(model, `/api/watch/orgs/${model.org?.slug || 'default'}/pipelines`)}>Watch events</a><a href={modelHref(model, '/runners-ci')}>Check capacity</a><a href={modelHref(model, '/inbox')}>Review gate</a></div></div>;
}

function RunEmptyOrRecent({ runs, repo }) {
  if (!runs.length) return <EmptyState title="No runs yet" text={repo ? 'Open a review or trigger repository automation to create the first run.' : 'Runs appear after pull requests, repository automation, or deployment checks start.'} />;
  return <ul className="resourceList runList">{runs.map((run) => <li key={run.metadata?.name}><strong>{run.metadata?.name}</strong><span>{sanitizeCopy(run.spec?.repository || repo || 'workspace')} · {sanitizeCopy(run.spec?.ref || 'ref')}</span><small>{sanitizeCopy(run.status?.phase || 'Pending')} {run.status?.currentStep ? `· ${sanitizeCopy(run.status.currentStep)}` : ''}</small></li>)}</ul>;
}

function RunEventStream({ org = 'default', resource, events }) {
  const watchResource = resource?.plural || 'pipelines';
  return <div className="card runCard"><div className="cardTitle"><h3>Run debugger</h3><StatusPill tone="neutral">live</StatusPill></div><p>Run event stream updates are grouped by the run they belong to.</p><LiveWatchPanel org={org} resource={watchResource} initialEvents={events || []} /><details><summary><span><h3>Advanced run records</h3><p>Expand only when you need advanced resource records.</p></span></summary><ResourceTable resource={resource} /></details></div>;
}

function RunnerCapacitySnapshot({ model, resource }) {
  const pools = resource?.items || [];
  const warm = pools.reduce((total, pool) => total + Number(pool.spec?.warmReplicas || 0), 0);
  const max = pools.reduce((total, pool) => total + Number(pool.spec?.maxReplicas || 0), 0);
  return <div className="card"><div className="cardTitle"><h3>Runner capacity</h3><StatusPill tone={pools.length ? 'good' : 'neutral'}>{pools.length} pools</StatusPill></div><div className="settingsGrid"><span>Warm runners</span><strong>{warm}</strong><span>Max runners</span><strong>{max}</strong><span>Trust tiers</span><strong>{pools.map((pool) => pool.spec?.trustTier).filter(Boolean).join(', ') || 'not configured'}</strong></div><div className="heroActions"><a href={modelHref(model, '/runners-ci')}>Manage capacity</a></div></div>;
}

function runPhaseCounts(items) {
  return items.reduce((counts, run) => {
    const phase = run.status?.phase || 'Pending';
    counts[phase] = (counts[phase] || 0) + 1;
    return counts;
  }, {});
}

function RunnerPoolDesigner({ org = 'default', resource }) {
  const pool = resource?.items?.[0];
  return <div className="card"><div className="cardTitle"><h3>Capacity designer</h3><StatusPill tone={pool ? 'good' : 'neutral'}>{pool ? pool.metadata?.name : 'empty'}</StatusPill></div><div className="settingsGrid"><span>Image</span><strong>{pool?.spec?.image || 'configure in capacity settings'}</strong><span>Warm replicas</span><strong>{pool?.spec?.warmReplicas ?? 'unset'}</strong><span>Max replicas</span><strong>{pool?.spec?.maxReplicas ?? 'unset'}</strong><span>Trust tier</span><strong>{pool?.spec?.trustTier || 'workspace policy'}</strong></div><div className="heroActions" aria-label="Capacity links"><a href={`/api/watch/orgs/${org}/runnerpools`}>Open live capacity feed</a><a href={orgHref(org, '/advanced-plans')}>Open capacity details</a></div></div>;
}

function WebhookInspector({ model, repo }) {
  const inspector = model.views.webhookInspector;
  const deliveries = inspector?.deliveries || model.resources.find((resource) => resource.kind === 'WebhookDelivery')?.items || [];
  return <div className="card"><div className="cardTitle"><h3>Automation inspector</h3><StatusPill tone={deliveries.length ? 'good' : 'neutral'}>{deliveries.length} deliveries</StatusPill></div><div className="webhookGrid"><div><strong>Subscription</strong><span>{inspector?.subscription?.metadata?.name || repo || 'not configured'}</span></div><div><strong>Replay</strong><span>durable queue action</span></div><div><strong>Signature</strong><span>verified per delivery</span></div></div>{deliveries.length ? <ul className="compactList">{deliveries.map((delivery) => <li key={delivery.metadata?.name}>{delivery.metadata?.name}: {delivery.status?.phase || 'Pending'} · attempts {delivery.status?.attempts || 0}</li>)}</ul> : <p className="emptyText">No delivery records yet. Deliveries appear here after automations run.</p>}</div>;
}

function CloneAndRefs({ repo, repository }) {
  const router = repository?.spec?.gitHosting?.httpUrl || `<repository-service>/${repo}.git`;
  return <div className="card"><h3>Clone and refs</h3><div className="terminal"><span>git clone {router}</span><span>git remote add origin {router}</span><span>git push origin {repository?.spec?.defaultBranch || 'main'}</span></div><InfoList title="Ref controls" items={['Branch protection guards merge paths', 'Receive policies protect restricted refs', 'Repository streaming is available when the service is connected']} /></div>;
}

function RepoSettingsPanel({ repository, model, org = 'default', repo }) {
  const repoName = repo || repository?.metadata?.name;
  const visibility = repository?.spec?.visibility || 'private';
  const defaultBranch = repository?.spec?.defaultBranch || 'main';
  const bpItems = (model.resources || []).find((r) => r.kind === 'BranchProtection')?.items || [];
  const repoBps = bpItems.filter((bp) => {
    const refs = bp.spec?.refs || [];
    return !repoName || refs.some((ref) => String(ref).includes(repoName) || String(ref).includes('*'));
  });

  return (
    <div className="stack">
      <div className="card securitySettings">
        <div className="cardTitle">
          <h3>Repository settings map</h3>
          <StatusPill tone={repository ? 'good' : 'warn'}>{repository ? 'connected' : 'missing'}</StatusPill>
        </div>
        <dl className="kv">
          <dt>Name</dt><dd><code>{repoName || '—'}</code></dd>
          <dt>Visibility</dt>
          <dd>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: visibility === 'public' ? '#22c55e' : visibility === 'internal' ? '#3b82f6' : '#6b7280', flexShrink: 0 }} />
              {visibility}
            </span>
          </dd>
          <dt>Default branch</dt><dd><code>{defaultBranch}</code></dd>
          <dt>Workspace</dt><dd>{repository?.metadata?.namespace || model.namespace}</dd>
          <dt>Phase</dt><dd>{repository?.status?.phase || 'Unknown'}</dd>
        </dl>
        <div className="heroActions" aria-label="Repository settings links">
          {repoName ? <a href={orgHref(org, `/repositories/${repoName}/runs`)}>View runs</a> : null}
          <a href={orgHref(org, '/people')}>Manage access</a>
          <a href={orgHref(org, '/advanced-plans')}>Advanced details</a>
        </div>
      </div>

      {repository ? (
        <InlineCreateForm
          org={org}
          kind="Repository"
          title="Update repository settings"
          fields={[
            { name: 'visibility', label: 'Visibility', type: 'select', options: ['public', 'internal', 'private'], required: true },
            { name: 'defaultBranch', label: 'Default branch', placeholder: defaultBranch, required: false },
          ]}
          successText="Repository settings updated"
        />
      ) : null}

      <div className="card">
        <div className="cardTitle">
          <h3>Branch protection rules</h3>
          <StatusPill tone={repoBps.length ? 'good' : 'neutral'}>{repoBps.length} rules</StatusPill>
        </div>
        {repoBps.length ? (
          <div className="resourceTable">
            {repoBps.map((bp) => {
              const bpName = bp.metadata?.name || 'unknown';
              const refs = bp.spec?.refs || [];
              const phase = bp.status?.phase || 'Pending';
              const phaseTone = phase === 'Active' || phase === 'Ready' ? 'good' : phase === 'Failed' ? 'danger' : 'neutral';
              return (
                <div key={bpName} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <strong>{bpName}</strong>
                  <span>{Array.isArray(refs) ? refs.join(', ') : String(refs)}</span>
                  <StatusPill tone={phaseTone}>{phase}</StatusPill>
                  <ResourceActions org={org} apiPath={`branchprotections/${bpName}`} actions={['delete']} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="emptyText">No branch protection rules for this repository. Add rules in <a href={orgHref(org, '/access/branch-protection')}>Branch protection</a>.</p>
        )}
      </div>

      <div className="card">
        <div className="cardTitle">
          <h3>Collaborators</h3>
          <StatusPill tone="neutral">access control</StatusPill>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>
          Collaborators are managed through Krate user and team grants. Use the People page to add or remove repository access.
        </p>
        <div className="heroActions">
          <a href={orgHref(org, '/people')}>Manage collaborators</a>
          <a href={orgHref(org, '/access/permissions')}>View permissions</a>
        </div>
      </div>

      <div className="card" style={{ borderLeft: '3px solid #ef4444' }}>
        <div className="cardTitle">
          <h3>Danger zone</h3>
          <StatusPill tone="danger">destructive</StatusPill>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.375rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ fontSize: '0.875rem' }}>Transfer repository</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>Transfer ownership to another organization or user.</p>
            </div>
            <button disabled title="Coming soon — transfer requires org admin approval" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '0.375rem', cursor: 'not-allowed', flexShrink: 0 }}>
              Transfer (coming soon)
            </button>
          </div>
          {repository && repoName ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.375rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Delete this repository</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>Permanently delete <code>{repoName}</code> and all its data. This action cannot be undone.</p>
              </div>
              <ResourceActions org={org} apiPath={`repositories/${repoName}`} actions={['delete']} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DeploymentPipelineSection({ model, org, repositories, deploymentResource, releaseResource }) {
  const kubeVelaResources = (model.resources || []).filter((r) => String(r.kind || '').startsWith('KubeVela'));
  const hasKubeVela = kubeVelaResources.length > 0 || model.delivery?.installed || model.delivery?.available;
  const firstRepo = repositories?.[0]?.metadata?.name || null;
  if (hasKubeVela) {
    return <DeploymentManager namespace={model.namespace} org={org} repositories={repositories.map(publicResource)} delivery={model.delivery} />;
  }
  return <DeploymentPipeline org={org} repository={firstRepo} kubeVelaAvailable={false} />;
}

function KubeVelaRequiredBanner({ model }) {
  const kubeVelaResources = (model.resources || []).filter((r) => String(r.kind || '').startsWith('KubeVela'));
  const hasKubeVela = kubeVelaResources.length > 0 || model.delivery?.installed || model.delivery?.available;
  if (hasKubeVela) return null;
  return <section className="card" style={{ borderLeft: '3px solid var(--color-info, #3b82f6)', marginBottom: '0.75rem' }}>
    <div className="cardTitle"><h3>KubeVela not detected</h3><StatusPill tone="neutral">optional dependency</StatusPill></div>
    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0' }}>Deployments require KubeVela. Install KubeVela to enable application deployment management, release tracking, and environment promotion.</p>
    <p style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Krate will automatically discover KubeVela CRDs once installed. Webhook and repository features remain available without KubeVela.</p>
  </section>;
}

function KyvernoRequiredBanner({ model }) {
  const engine = model.policyEngine || {};
  const hasKyverno = engine.detected || engine.health === 'ready' || (engine.controllers || []).length > 0;
  if (hasKyverno) return null;
  return <section className="card" style={{ borderLeft: '3px solid var(--color-info, #3b82f6)', marginBottom: '0.75rem' }}>
    <div className="cardTitle"><h3>Kyverno not detected</h3><StatusPill tone="neutral">optional dependency</StatusPill></div>
    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0' }}>Policy management requires Kyverno. Install Kyverno to enable policy enforcement, admission control, and policy reporting.</p>
    <p style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Krate will automatically discover Kyverno CRDs once installed. Webhook subscriptions and hook management remain available without Kyverno.</p>
  </section>;
}

function EndpointPanel({ model }) {
  return <details className="card"><summary><span><h3>Advanced endpoints</h3><p>Expand to inspect live API endpoints.</p></span></summary><div className="endpointList">{model.controller.endpoints.map((endpoint) => <a key={`${endpoint.method}-${endpoint.path}`} href={endpoint.path.includes(':') ? modelHref(model, '/controller-api') : endpoint.path.replace('*', 'repositories')}><span>{endpoint.method}</span> <code>{endpoint.path}</code><small>{sanitizeCopy(endpoint.purpose)}</small></a>)}</div></details>;
}

function PermissionPanel({ model }) {
  return <div className="card"><h3>Access checks</h3>{model.permissions?.length ? <div className="resourceTable">{model.permissions.map((permission) => <div key={displayKind(permission.kind)} className="resourceRow"><strong>{displayKind(permission.kind)}</strong><span>{Object.entries(permission.verbs).filter(([, allowed]) => allowed).map(([verb]) => verb).join(', ') || 'no allowed verbs reported'}</span></div>)}</div> : <p className="emptyText">No access check results returned yet.</p>}</div>;
}

function PolicyCenter({ org = 'default', model, profiles, templates, bindings, exceptionRequests }) {
  const engine = model.policyEngine || { health: 'disabled', mode: 'disabled', violations: [], degraded: [], controllers: [], reports: {}, emptyState: 'Kyverno is disabled.' };
  const tone = engine.health === 'ready' ? 'good' : engine.health === 'disabled' ? 'neutral' : 'warn';
  const templateItems = (engine.templates || []).slice(0, 5).map((item) => `${item.displayName || item.name}: ${(item.targetKinds || []).join(', ') || 'Krate resources'}`);
  const bindingItems = (engine.bindings || []).slice(0, 5).map((item) => `${item.displayName || item.name}: ${item.mode} · ${item.phase}`);
  const violationItems = (engine.violations || []).slice(0, 6).map((item) => `${item.policy || 'policy'} / ${item.rule || 'rule'}: ${item.result || 'violation'} ${item.message || ''}`.trim());
  return <div className="stack policyCenter"><section className="card"><div className="cardTitle"><h3>Kyverno policy engine</h3><StatusPill tone={tone}>{engine.health}</StatusPill></div><dl className="kv"><dt>Mode</dt><dd>{engine.mode}</dd><dt>Kyverno namespace</dt><dd>{engine.namespace}</dd><dt>Policy namespace</dt><dd>{engine.policyNamespace}</dd><dt>Reports</dt><dd>{engine.reports?.policyReports || 0} namespaced / {engine.reports?.clusterPolicyReports || 0} cluster</dd></dl>{engine.emptyState ? <p className="emptyText">{engine.emptyState}</p> : null}{engine.degraded?.length ? <InfoList title="Policy dependency issues" items={engine.degraded} /> : null}</section><section className="routeGrid two"><div className="card"><h3>Policy templates</h3><InfoList title="Available templates" items={templateItems.length ? templateItems : ['No policy templates have been installed yet.']} /></div><div className="card"><h3>Policy bindings</h3><InfoList title="Active bindings" items={bindingItems.length ? bindingItems : ['No policy bindings yet. Start in audit mode.']} /></div></section><section className="routeGrid two"><div className="card"><h3>Violations</h3><InfoList title="Recent Kyverno results" items={violationItems.length ? violationItems : ['No policy report violations are visible.']} /><div className="heroActions"><a href={orgHref(org, '/api/orgs/' + org + '/policy-reports')}>Open reports API</a></div></div><ResourceApplyPanel org={org} resource={publicResource(bindings?.items?.[0] || templates?.items?.[0] || profiles?.items?.[0] || null)} /></section><section className="card"><h3>Exception requests</h3><p>Developers request temporary exceptions here; platform engineers approve them into Kyverno PolicyException resources.</p><InfoList title="Requests" items={(engine.exceptionRequests || []).length ? engine.exceptionRequests.map((item) => `${item.displayName || item.name}: ${item.phase}`) : ['No exception requests are pending.']} /><div className="heroActions"><a href={orgHref(org, '/api/orgs/' + org + '/policy-exception-requests')}>Open exception API</a></div></section></div>;
}

function PolicyPanel({ org = 'default', model, repo, resource }) {
  const engine = model?.policyEngine || {};
  const repoViolations = (engine.violations || []).filter((item) => !repo || item.resource?.name === repo || item.resource?.namespace === repo || String(item.message || '').includes(repo));
  return <div className="card soft"><div className="cardTitle"><h3>Repository policy rollout</h3><StatusPill tone={engine.health === 'ready' ? 'good' : 'neutral'}>{engine.health || 'disabled'}</StatusPill></div><p>Move repository policies from audit to enforcement when reports are clean. Raw Krate and Kyverno YAML remains available for review.</p><InfoList title="Repo policy signals" items={[`Kyverno mode: ${engine.mode || 'disabled'}`, `Bindings: ${(engine.bindings || []).length}`, `Visible violations: ${repoViolations.length}`, `Exceptions: ${(engine.exceptionRequests || []).length}`]} /><ResourceApplyPanel org={org} resource={publicResource(resource?.items?.[0] || null)} /></div>;
}

function EventPanel({ events }) {
  return <div className="card"><h3>Krate events</h3>{events?.length ? <ul className="compactList">{events.map((event) => <li key={`${event.type}-${event.resource}-${event.message}`}>{sanitizeCopy(event.type)}: {sanitizeCopy(event.resource)} {sanitizeCopy(event.message)}</li>)}</ul> : <p className="emptyText">No workspace events returned.</p>}</div>;
}

function OperationsPanel({ model }) {
  return <div className="card"><h3>Readiness handoff</h3><dl className="kv"><dt>Image</dt><dd>{model.operations.image}</dd><dt>Package</dt><dd>{model.operations.chart}</dd><dt>Config store</dt><dd>ready when connected</dd><dt>Automation store</dt><dd>ready when connected</dd></dl><InfoList title="Release gates" items={model.operations.releaseGates} /><InfoList title="Setup actions" items={model.operations.installCommands.map(sanitizeCopy)} /></div>;
}

function SecurityPosture({ model }) {
  return <div className="card securitySettings"><h3>Identity, access, and availability</h3><ul className="compactList"><li>Credentials stay server-side and never appear in browser JavaScript.</li><li>Disabled actions are backed by Krate access checks, not local role flags.</li><li>Denied messages include the action, resource, workspace, and next step.</li><li>Unavailable banners include correlation IDs and health links: {model.correlationId || 'pending'}.</li><li>Repository streaming remains disabled until Krate repository access is connected.</li></ul></div>;
}

function CodeBrowser({ org = 'default', repo, plan, exists, repository }) {
  const branch = repository?.spec?.defaultBranch || 'main';
  const cloneUrl = repository?.spec?.gitHosting?.httpUrl || `<repository-service>/${repo}.git`;
  const files = [
    ['dir', '.github', 'workflow gates and repository automation', '2 days ago'],
    ['dir', 'charts', 'release chart and environment templates', '3 days ago'],
    ['dir', 'src', 'forge runtime source', 'yesterday'],
    ['dir', 'tests', 'lifecycle and policy coverage', 'yesterday'],
    ['file', 'README.md', 'document repository bootstrap and local flow', '6 hours ago'],
    ['file', 'package.json', 'wire UI and service scripts', '6 hours ago'],
    ['file', 'examples/deployment.krate', 'add deployment example', '4 hours ago']
  ];
  const code = exists ? `git clone ${cloneUrl}
cd ${repo}
git checkout ${branch}` : `Create repository ${repo}
Open a review
Use repository settings when ready`;
  return <section className="repoFileBrowser" aria-label="Repository code browser">
    <div className="repoBrowserToolbar"><span className="branchLabel">{branch}</span><nav className="repoPath" aria-label="Repository path"><a href={orgHref(org, `/repositories/${repo}/code`)}>{repo}</a><span>/</span></nav><div className="repoToolbarActions"><a href={orgHref(org, '/advanced-plans')}>Advanced details</a></div></div>
    <div className="commitBanner"><strong>{exists ? 'krate-service' : 'repository setup'}</strong><span>{exists ? 'Update forge resources and repository metadata' : 'Repository resource is not connected yet'}</span><small>{exists ? 'latest commit - status projected by Krate' : 'create this repository to browse code'}</small></div>
    <div className="fileList" role="table" aria-label="Files">{files.map(([type, name, message, time]) => <a role="row" key={name} href={name.endsWith('.md') ? '#readme' : orgHref(org, `/repositories/${repo}/code`)} className="fileRow"><span className={`fileIcon ${type}`}>{type === 'dir' ? 'folder' : 'file'}</span><strong>{name}</strong><span>{message}</span><time>{time}</time></a>)}</div>
    <article id="readme" className="readmePanel"><div className="readmeHeader"><strong>README.md</strong><span>Rendered repository overview</span></div><h2>{repo}</h2><p>This repository is managed by Krate as a workspace repository. This page behaves like a forge home: browse files, choose a branch, copy clone commands, inspect status, and open advanced details only when needed.</p><CodeEditor language="javascript" label="Repository file viewer" value={code} /><PlanCard title="Repository details" plan={plan} command="Save repository changes" /></article>
  </section>;
}

function LiveRunCard({ org = 'default', resource, events }) {
  const watchResource = resource?.plural || 'pipelines';
  return <div className="card runCard"><div className="cardTitle"><h3>Krate live stream</h3><StatusPill tone="neutral">live</StatusPill></div><p>Follow updates for {watchResource}. If the stream disconnects, Krate resumes from the current list state.</p><LiveWatchPanel org={org} resource={watchResource} initialEvents={events || []} /><ResourceTable resource={resource} /></div>;
}

function EmptyIfNone({ resource, noun }) {
  return resource?.count ? <ResourceTable resource={resource} /> : <EmptyState title={`No ${noun} resources`} text={`Create ${noun} through the Krate flow; advanced details are available if needed.`} />;
}

function sectionContent(section, ui, activeOrg) {
  const { model, repositories, repositoryResource, deploymentResource, releaseResource, deploymentPolicyResource, pullRequests, issues, pipelines, runnerPools, webhooks, policyProfiles, policyTemplates, policyBindings, policyExceptionRequests } = ui;
  const pages = {
    'controller-api': { eyebrow: 'Krate workspace API', title: 'Krate API and access checks', text: 'Inspect live endpoints, permissions, and workspace health only when troubleshooting.', actions: [['/api/controller', 'Open diagnostics'], [`/api/watch/orgs/${activeOrg}/repositories`, 'Open live stream']], body: <div className="routeGrid wideLeft"><ArchitectureMap model={model} /><div className="stack"><EndpointPanel model={model} /><PermissionPanel model={model} /></div></div> },
    repositories: { eyebrow: 'repository workspace', title: 'Create, clone, and manage repositories', text: 'Create a repository, copy clone commands, review changes, and manage access without leaving the Krate flow.', actions: [['/repositories', 'New repository'], ['/advanced-plans', 'Advanced details']], body: <><ForgeFlowRail repository={repositories[0]} model={model} /><div className="routeGrid wideLeft"><RepositoryLanding model={model} repositories={repositories.map(publicResource)} /><div className="stack"><RepositoryManager namespace={model.namespace} org={activeOrg} repositories={repositories.map(publicResource)} /><ResourceTable resource={repositoryResource} /></div></div></> },
    people: { eyebrow: 'people and access', title: 'Invite people, identity links, and access', text: 'Admins can invite teammates, link identities, organize teams, and manage repository permissions from one place.', actions: [['/login', 'Preview sign in'], ['/repositories', 'Open repositories']], body: <PeopleAdmin model={model} repositories={repositories.map(publicResource)} /> },
    deployments: { eyebrow: 'delivery workspace', title: 'Deployments, releases, and environments', text: 'Choose a repository, promote a release, inspect managed services, and adjust policies from one Krate experience.', actions: [['/repositories', 'Choose repository'], ['/advanced-plans', 'Advanced details'], ['/deployments', 'Create deployment']], body: <div className="routeGrid wideLeft"><div className="stack"><KubeVelaRequiredBanner model={model} /><DeploymentPipelineSection model={model} org={activeOrg} repositories={repositories} deploymentResource={deploymentResource} releaseResource={releaseResource} /><DeploymentCenter model={model} deployments={deploymentResource} releases={releaseResource} /></div><div className="stack"><ResourceTable resource={deploymentResource} /><ResourceTable resource={deploymentPolicyResource} /></div></div> },
    inbox: { eyebrow: 'review queue', title: 'Reviews, issues, and triage', text: 'Review changes, triage issues, and see merge readiness with policy and run status in one place.', actions: [[`/api/watch/orgs/${activeOrg}/pullrequests`, 'Watch reviews'], ['/repositories', 'Open repositories']], body: <div className="routeGrid wideLeft"><InboxFlow model={model} /><div className="stack"><ResourceTable resource={pullRequests} /><ResourceTable resource={issues} /></div></div> },
    runs: { eyebrow: 'run lifecycle', title: 'Runs', text: 'Track repository checks, merge gates, and deployment work as user-facing runs. This page is about what is running and what needs attention; advanced run records stay collapsed until needed.', actions: [[`/api/watch/orgs/${activeOrg}/pipelines`, 'Watch run events'], ['/runners-ci', 'Runner capacity']], body: <div className="routeGrid wideLeft"><RunCenter model={model} pipelines={pipelines} repositories={repositories.map(publicResource)} /><div className="stack"><RunEventStream org={activeOrg} resource={pipelines} events={model.events} /><RunnerCapacitySnapshot model={model} resource={runnerPools} /></div></div> },
    'runners-ci': { eyebrow: 'capacity controls', title: 'Runner capacity', text: 'Adjust warm capacity, limits, and trust tier before enabling more jobs.', actions: [[`/api/watch/orgs/${activeOrg}/runnerpools`, 'Watch capacity'], ['/advanced-plans', 'Advanced details']], body: <div className="routeGrid wideLeft"><div className="stack"><RunnerPoolManager org={activeOrg} pools={runnerPools?.items || []} /><RunnerPoolDesigner org={activeOrg} resource={runnerPools} /></div><ResourceApplyPanel org={activeOrg} resource={publicResource(runnerPools?.items?.[0] || null)} /></div> },
    'hooks-events': { eyebrow: 'hooks and policies', title: 'Hooks & Policies', text: 'Manage outbound hooks, admission policy posture, Kyverno reports, and exception requests from one Krate-native policy center.', actions: [[`/api/watch/orgs/${activeOrg}/webhooksubscriptions`, 'Watch subscriptions'], [`/api/orgs/${activeOrg}/policy-reports`, 'Policy reports']], body: <div className="routeGrid wideLeft"><><KyvernoRequiredBanner model={model} /><PolicyCenter org={activeOrg} model={model} profiles={policyProfiles} templates={policyTemplates} bindings={policyBindings} exceptionRequests={policyExceptionRequests} /></><div className="stack"><WebhookManager org={activeOrg} webhooks={webhooks?.items || []} /><WebhookInspector model={model} /><ResourceTable resource={webhooks} /></div></div> },
    insights: { eyebrow: 'workspace insights', title: 'Health, activity, and access', text: 'See counts, recent events, access checks, and readiness signals for the workspace.', actions: [['/api/controller', 'Refresh data'], ['/controller-api', 'Krate API']], body: <div className="routeGrid wideLeft"><DashboardMetrics model={model} /><div className="stack"><EventPanel events={model.events} /><ArchitectureMap model={model} compact /></div></div> },
    'operations-install': { eyebrow: 'release readiness', title: 'Readiness checklist', text: 'Confirm package, image, access, and repository readiness before handing off a release.', actions: [['/insights', 'View health'], ['/advanced-plans', 'Advanced details']], body: <div className="routeGrid wideLeft"><OperationsPanel model={model} /><div className="stack"><SecurityPosture model={model} /><ArchitectureMap model={model} compact /></div></div> },
    'advanced-plans': { eyebrow: 'advanced workspace details', title: 'Advanced resource details', text: 'Use this only when you need direct resource editing. Krate keeps it collapsed elsewhere so everyday work stays task-focused.', actions: [['/repositories', 'Repository form'], ['/applications', 'Deployment center']], body: <div className="routeGrid two"><ResourceApplyPanel org={activeOrg} resource={publicResource(repositoryResource?.items?.[0] || null)} /><PlanCard title="Live repository details" plan={repositoryResource?.yaml} command="Save repository changes" initiallyOpen /></div> }
  };
  return pages[section] || pages.repositories;
}

function repositorySectionContent(section, repo, repository, ui, activeOrg, view = 'kanban') {
  const plan = repository ? resourceJson(repository) : null;
  const empty = !repository;
  const pages = {
    code: { title: repo, text: empty ? 'Create this repository to start browsing files and cloning code.' : 'Browse files, copy clone commands, and branch from the default ref.', body: <div className="repoCodePage">{!empty ? <RepoCodeBrowser org={activeOrg} repo={repo} defaultBranch={repository?.spec?.defaultBranch || 'main'} /> : <div className="card"><h3>Repository not connected</h3><p>Create this repository to start browsing files and cloning code.</p></div>}<CloneAndRefs repo={repo} repository={repository} /></div> },
    'pull-requests': { title: 'Reviews', text: 'Review, merge, or close pull requests for this repository.', body: <div className="routeGrid wideLeft"><PullRequestList org={activeOrg} repo={repo} pullRequests={ui.pullRequests} /><PullRequestReviewPanel model={ui.model} repo={repo} /></div> },
    issues: { title: 'Issues', text: 'Triage only issues linked to this repository, with project context, comments, and backend sync metadata.', body: <IssueWorkspace model={ui.model} resource={ui.issues} repo={repo} view={view} /> },
    runs: { title: 'Runs', text: 'Trigger and monitor pipeline runs for this repository.', body: <div className="routeGrid wideLeft"><RepoRuns org={activeOrg} repo={repo} runs={ui.pipelines} /><RunEventStream org={activeOrg} resource={ui.pipelines} events={ui.model.events} /></div> },
    hooks: { title: 'Hooks & Policies', text: 'Inspect subscriptions, replay deliveries, and adjust repository admission policies.', body: <div className="routeGrid wideLeft"><WebhookInspector model={ui.model} repo={repo} /><PolicyPanel org={activeOrg} model={ui.model} repo={repo} resource={ui.model.resources.find((resource) => resource.kind === 'RefPolicy')} /></div> },
    settings: { title: 'Settings', text: 'Update visibility, default branch, access, and policy checks from one settings map.', body: <div className="routeGrid wideLeft"><RepoSettingsPanel repository={repository} model={ui.model} org={activeOrg} repo={repo} /><div className="stack"><ResourceApplyPanel org={activeOrg} resource={publicResource(repository)} /><PlanCard title="Repository details" plan={plan} command="Save repository changes" /></div></div> }
  };
  return pages[section] || pages.code;
}

// ── Page exports ──────────────────────────────────────────────────────────────

export function RepositoryNav({ repo, org = 'default' }) {
  if (!repo) return <p className="emptyText">No repository selected. Create one to enable repository tabs.</p>;
  const tabs = [['code', 'Code'], ['pull-requests', 'Reviews'], ['issues', 'Issues'], ['runs', 'Runs'], ['hooks', 'Hooks & Policies'], ['settings', 'Settings']];
  return <nav className="repoTabs linkedTabs" aria-label="Repository sections">{tabs.map(([slug, label]) => <a key={slug} href={orgHref(org, `/repositories/${repo}/${slug}`)}>{label}</a>)}</nav>;
}

export async function SectionPage({ org = null, section }) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const page = sectionContent(section, ui, activeOrg);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath={`/${section}`} eyebrow={page.eyebrow} title={page.title} text={page.text} actions={page.actions} breadcrumbs={page.breadcrumbs || [['/', 'Krate'], ['/' + section, page.title]]}><DegradedBanner model={ui.model} />{page.body}</PageFrame>;
}

export async function RepositorySectionPage({ org = null, repo, section = 'code', view = 'kanban' }) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const repository = ui.repositories.find((item) => item.metadata?.name === repo) || null;
  const page = repositorySectionContent(section, repo, repository, ui, activeOrg, view);
  const actions = repository ? [[`/repositories/${repo}/pull-requests`, 'Open reviews'], [`/repositories/${repo}/runs`, 'View runs'], [`/repositories/${repo}/settings`, 'Settings']] : [['/repositories', 'Create repository'], ['/advanced-plans', 'Advanced details']];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/repositories" eyebrow={`repository / ${repo}`} title={page.title} text={page.text} actions={actions} breadcrumbs={[[ '/', 'Krate' ], [ '/repositories', 'Repositories' ], [ `/repositories/${repo}/code`, repo ], [ `/repositories/${repo}/${section}`, page.title ]] }><RepositoryHeader repo={repo} repository={repository} model={ui.model} /><DegradedBanner model={ui.model} /><RepositoryNav org={activeOrg} repo={repository ? repo : null} /><RepositoryCommandBar org={activeOrg} repo={repo} repository={repository} model={ui.model} />{page.body}</PageFrame>;
}

export async function RepositoryCodePage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="code" />; }
export async function RepositoryPullRequestsPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="pull-requests" />; }
export async function RepositoryIssuesPage({ org = null, repo, view = 'kanban' }) { return <RepositorySectionPage org={org} repo={repo} section="issues" view={view} />; }
export async function RepositoryIssueDetailPage({ org = null, repo, issue }) { return <IssueDetailPage org={org} repo={repo} issueName={issue} />; }
export async function ProjectIssuesPage({ org = null, projectId, view = 'kanban' }) { return <IssueScopePage org={org} projectId={projectId} view={view} />; }
export async function ProjectIssueDetailPage({ org = null, projectId, issue }) { return <IssueDetailPage org={org} projectId={projectId} issueName={issue} />; }
export async function RepositoryRunsPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="runs" />; }
export async function RepositoryHooksPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="hooks" />; }
export async function RepositorySettingsPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="settings" />; }

export async function DashboardPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const { model, repository, repositoryResource, repositories } = ui;
  const repoName = repository?.metadata?.name;
  const activeOrg = model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={model.orgs} currentPath="/" eyebrow="a5c.ai Krate workspace" title="What do you want to ship today?" text="Start with code, reviews, issues, or deployments. Advanced resource details stay collapsed until you need them." actions={repoName ? [[`/repositories/${repoName}/code`, 'Open repository'], ['/deployments', 'Deploy']] : [['/repositories', 'Create repository'], ['/deployments', 'Start deployment']]}>
    <DegradedBanner model={model} />
    <QuickStart repository={repository} org={activeOrg} />
    <section className="routeGrid two"><DashboardMetrics model={model} /><RepositoryManager namespace={model.namespace} org={activeOrg} repositories={repositories.map(publicResource)} /></section>
    <ForgeFlowRail repository={repository} model={model} />
    <section className="routeGrid two"><ResourceList model={model} /><PlanCard title="Repository details" plan={repositoryResource?.yaml} command="Save repository changes" /></section>
    <section style={{ marginTop: '1.5rem' }}>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--ink-pigment)' }}>Live Activity</h3>
      <ActivityFeed org={activeOrg} />
    </section>
  </PageFrame>;
}
