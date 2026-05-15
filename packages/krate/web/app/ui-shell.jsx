import { cookies } from 'next/headers';
import { createAuthProviderConfig, listEnabledAuthProviders, parseSessionCookie, fetchControllerUiModel } from '@a5c-ai/krate-sdk';
import { CodeEditor, LiveWatchPanel } from './components/code-editor.jsx';
import { DeploymentManager, RepositoryManager, ResourceApplyPanel, UserManagementPanel } from './components/resource-actions.jsx';
import { ApprovalDecisionButtons } from './components/approval-actions.jsx';
import { DispatchButton } from './components/dispatch-button.jsx';
import { GraphStackBuilder } from './components/stack-builder-graph.jsx';
import { EnhancedKanbanBoard } from './components/kanban-enhanced.jsx';
import { WorkspacePanel } from './components/workspace-panel.jsx';
import { MemorySearchForm } from './components/memory-search-form.jsx';
import { MemoryOntologyEditor } from './components/memory-ontology-editor.jsx';
import { MemoryImportReview } from './components/memory-import-review.jsx';
import { LiveUpdates } from './components/live-updates.jsx';
import { TriggerRuleForm } from './components/trigger-rule-form.jsx';
import { ToolCallInspector } from './components/tool-inspector.jsx';
import { SessionCost } from './components/session-cost.jsx';
import { ApprovalModeToggle } from './components/approval-mode-toggle.jsx';
import { SessionShell } from './components/session-shell.jsx';
import { ExternalProviderList } from './components/external-provider-list.jsx';
import { ExternalProviderWizard } from './components/external-provider-wizard.jsx';
import { ExternalSyncDashboard } from './components/external-sync-dashboard.jsx';
import { ExternalConflictResolver } from './components/external-conflict-resolver.jsx';
import { AgentSettingsForm } from './components/agent-settings-form.jsx';
import { AppSettingsForm } from './components/app-settings.jsx';
import { UserProfileForm } from './components/user-profile.jsx';
import { SecretManager } from './components/secret-manager.jsx';
import { StackActions } from './components/stack-actions.jsx';
import { ManualDispatchButton, RunActions } from './components/run-actions.jsx';
import { EnableDisableToggle, DeleteRuleButton } from './components/rule-actions.jsx';
import { ResourceActions, InlineCreateForm } from './components/resource-crud-actions.jsx';
import { RepoCodeBrowser } from './components/repo-code-browser.jsx';
import { PullRequestList } from './components/pull-request-list.jsx';
import { IssueList } from './components/issue-list.jsx';
import { RepoRuns } from './components/repo-runs.jsx';
import { WebhookManager } from './components/webhook-manager.jsx';
import { DeploymentPipeline } from './components/deployment-pipeline.jsx';
import { RunnerPoolManager } from './components/runner-pool-manager.jsx';
import { NotificationBell } from './components/notification-bell.jsx';
import { GlobalSearch } from './components/global-search.jsx';
import { CommandPaletteWrapper } from './components/command-palette.jsx';
import { KeyboardShortcuts } from './components/keyboard-shortcuts.jsx';
import { ActivityFeed } from './components/activity-feed.jsx';
import { HealthMonitor } from './components/health-monitor.jsx';

export const orgNavigationGroups = [
  {
    title: 'Ship',
    items: [
      ['/', 'Home', 'Start or continue work'],
      ['/repositories', 'Code', 'Repositories and files'],
      ['/inbox', 'Reviews & issues', 'Pull requests and triage'],
      ['/runs', 'Runs', 'Checks and jobs'],
      ['/deployments', 'Deploy', 'Releases and environments']
    ]
  },
  {
    title: 'Manage',
    items: [
      ['/people', 'People', 'Users, teams, and access'],
      ['/access/ssh-keys', 'SSH keys', 'Deploy and user SSH keys'],
      ['/access/permissions', 'Permissions', 'Repository collaborators'],
      ['/access/branch-protection', 'Branch protection', 'Protected branch rules'],
      ['/hooks-events', 'Hooks & Policies', 'Webhooks and policies'],
      ['/runners-ci', 'Capacity', 'Runner pools'],
      ['/settings/secrets', 'Secrets', 'Secret and config grants'],
      ['/settings', 'Settings', 'App preferences and display'],
      ['/profile', 'Profile', 'User account and API keys']
    ]
  },
  {
    title: 'Agents',
    items: [
      ['/agents', 'Agents', 'Agent stacks and dispatch'],
      ['/agents/stacks', 'Stacks', 'Agent stack configurations'],
      ['/agents/sessions', 'Sessions', 'Agent chat sessions'],
      ['/agents/runs', 'Dispatch runs', 'Agent dispatch runs'],
      ['/agents/rules', 'Trigger rules', 'Trigger rule definitions'],
      ['/agents/approvals', 'Approvals', 'Pending agent approvals'],
      ['/agents/workspaces', 'Workspaces', 'Agent workspaces and runtimes'],
      ['/agents/projects', 'Projects', 'Agent project boards'],
      ['/agents/memory', 'Memory', 'Agent memory repositories and imports'],
      ['/agents/settings', 'Settings', 'Gateway, adapters, and providers']
    ]
  },
  {
    title: 'Observe',
    items: [
      ['/insights', 'Insights', 'Health and activity'],
      ['/operations-install', 'Readiness', 'Install and release checks'],
      ['/api-docs', 'API Docs', 'HTTP API reference and explorer']
    ]
  },
  {
    title: 'External',
    items: [
      ['/external', 'Providers', 'External backend providers'],
      ['/external/sync', 'Sync', 'Sync status and write intents'],
      ['/external/conflicts', 'Conflicts', 'Conflict resolution queue']
    ]
  }
];

export const orgNavigation = orgNavigationGroups.flatMap((group) => group.items.map(([href, label]) => [href, label]));

export const repositoryNavigation = [
  ['code', 'Code'],
  ['pull-requests', 'Reviews'],
  ['issues', 'Issues'],
  ['runs', 'Runs'],
  ['hooks', 'Hooks & Policies'],
  ['settings', 'Settings']
];

export async function loadKrateUi(org = null) {
  const model = await fetchControllerUiModel({ organization: org });
  const repositories = model.views.dashboard.repositories || [];
  return {
    model,
    repositories,
    repository: repositories[0] || null,
    repositoryResource: model.resources.find((resource) => resource.kind === 'Repository'),
    deploymentResource: model.resources.find((resource) => resource.kind === deploymentKind('Application')),
    releaseResource: model.resources.find((resource) => resource.kind === deploymentKind('ApplicationRevision')),
    deploymentPolicyResource: model.resources.find((resource) => resource.kind === deploymentKind('Policy')),
    pullRequests: model.resources.find((resource) => resource.kind === 'PullRequest'),
    issues: model.resources.find((resource) => resource.kind === 'Issue'),
    pipelines: model.resources.find((resource) => resource.kind === 'Pipeline'),
    runnerPools: model.resources.find((resource) => resource.kind === 'RunnerPool'),
    webhooks: model.resources.find((resource) => resource.kind === 'WebhookSubscription'),
    policyProfiles: model.resources.find((resource) => resource.kind === 'PolicyProfile'),
    policyTemplates: model.resources.find((resource) => resource.kind === 'PolicyTemplate'),
    policyBindings: model.resources.find((resource) => resource.kind === 'PolicyBinding'),
    policyExceptionRequests: model.resources.find((resource) => resource.kind === 'PolicyExceptionRequest')
  };
}


export function orgHref(org = 'default', href = '/') {
  if (!href || href === '/') return `/orgs/${org}`;
  if (href.startsWith('#') || href.startsWith('/api/') || href.startsWith('/login') || href.startsWith('/logout') || href.startsWith('/orgs')) return href;
  return `/orgs/${org}${href.startsWith('/') ? href : `/${href}`}`;
}

function modelHref(model, href = '/') {
  return orgHref(model?.org?.slug || 'default', href);
}

async function getSignedInUser() {
  try {
    const config = createAuthProviderConfig();
    const cookieStore = await cookies();
    return parseSessionCookie(config, cookieStore.get(config.session.cookieName)?.value);
  } catch {
    return null;
  }
}

export function StatusPill({ children, tone = 'good' }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function AppShell({ children, org = 'default', orgs = [], currentPath = '/', currentUser = null }) {
  const visibleOrgs = orgs.length ? orgs : [{ slug: org, displayName: org }];
  const currentOrg = visibleOrgs.find((item) => (item.slug || item.name) === org) || visibleOrgs[0];
  const currentHref = currentPath === '/' ? '/' : `/${String(currentPath || '').replace(/^\/+/, '').split('/')[0]}`;
  const signedInName = currentUser?.user || currentUser?.subject || '';
  const userInitial = (signedInName.trim()[0] || 'K').toUpperCase();
  return <>
    <a className="skipLink" href="#main-content">Skip to content</a>
    <header className="appTopbar" aria-label="Krate global navigation">
      <a className="brandMark" href={orgHref(org, '/')} aria-label="a5c.ai Krate home"><span className="brandSigil">K</span><span className="brandWordmark"><strong>Kr<span>ate</span></strong><em>a5c.ai</em></span></a>
      <GlobalSearch org={org} />
      <nav className="topbarNav" aria-label="Global actions"><a href="/orgs">Switch organization</a><a href={orgHref(org, '/repositories')}>New repository</a><a href={orgHref(org, '/inbox')}>Review queue</a></nav>
      <NotificationBell org={org} />
      <div className="topbarAccount" aria-label={signedInName ? 'Signed-in user' : 'Account'}>{signedInName ? <><a className="userChip" href={orgHref(org, '/people')}><span className="userAvatar" aria-hidden="true">{userInitial}</span><span className="userName">{signedInName}</span></a><a className="signOutLink" href="/api/auth/logout">Sign out</a></> : <a className="signInLink" href="/login">Sign in</a>}</div>
    </header>
    <div className="appBody"><aside className="appSidebar" aria-label="Krate sections"><div className="sidebarSectionTitle">Workspace</div><details className="orgSwitcher"><summary><span>Organization</span><strong>{currentOrg?.displayName || currentOrg?.slug || currentOrg?.name || org}</strong></summary><div>{visibleOrgs.map((item) => <a key={item.slug || item.name} href={`/orgs/${item.slug || item.name}`} aria-current={(item.slug || item.name) === org ? 'page' : undefined}>{item.displayName || item.slug || item.name}</a>)}<a href="/orgs">View all organizations</a></div></details><nav className="sidebarNav">{orgNavigationGroups.map((group) => <section className="sidebarNavGroup" key={group.title}><h2>{group.title}</h2>{group.items.map(([href, label, description]) => <a key={href} href={orgHref(org, href)} aria-current={href === currentHref ? 'page' : undefined}><span>{label}</span><small>{description}</small></a>)}</section>)}<details className="advancedNav"><summary>Advanced</summary><a href={orgHref(org, '/advanced-plans')} aria-current={currentHref === '/advanced-plans' ? 'page' : undefined}>Resource details</a><a href={orgHref(org, '/controller-api')} aria-current={currentHref === '/controller-api' ? 'page' : undefined}>API diagnostics</a></details></nav></aside><div className="appContent">{children}</div></div>
    <CommandPaletteWrapper org={org} />
    <KeyboardShortcuts org={org} />
  </>;
}

export async function PageFrame({ eyebrow, title, text, actions = [], breadcrumbs = [['/', 'Krate']], org = 'default', orgs = [], currentPath = '/', children }) {
  const currentUser = await getSignedInUser();
  return <AppShell org={org} orgs={orgs} currentPath={currentPath} currentUser={currentUser}><main id="main-content" className="routeMain">
    <nav className="breadcrumbs" aria-label="Breadcrumbs">{breadcrumbs.map(([href, label], index) => <a key={`${href}-${label}`} href={orgHref(org, href)} aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>{label}</a>)}</nav>
    <section className="routeHero" aria-labelledby="route-title"><div><span className="eyebrow">{eyebrow}</span><h1 id="route-title">{title}</h1><p className="lede">{text}</p></div>{actions.length ? <div className="heroActions" aria-label="page actions">{actions.map(([href, label]) => <a key={href} href={orgHref(org, href)}>{label}</a>)}</div> : null}</section>
    {children}
  </main></AppShell>;
}

export function RepositoryNav({ repo, org = 'default' }) {
  if (!repo) return <p className="emptyText">No repository selected. Create one to enable repository tabs.</p>;
  return <nav className="repoTabs linkedTabs" aria-label="Repository sections">{repositoryNavigation.map(([slug, label]) => <a key={slug} href={orgHref(org, `/repositories/${repo}/${slug}`)}>{label}</a>)}</nav>;
}

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


export function LoginPage() {
  const config = createAuthProviderConfig();
  const methods = listEnabledAuthProviders(config).map((provider) => ({ id: provider.id, href: `/api/auth/${provider.id}`, label: `Continue with ${provider.label}` }));
  if (config.delegatedIdentity.enabled) methods.push({ id: 'workspace-identity', href: '/api/auth/delegated', label: 'Use workspace identity' });
  return <main id="main-content" className="loginMain" aria-labelledby="login-title">
    <section className="loginCard" aria-label="Krate sign in">
      <a className="loginBrand" href="/login" aria-label="a5c.ai Krate sign in"><span className="brandSigil">K</span><span className="brandWordmark"><strong>Kr<span>ate</span></strong><em>a5c.ai</em></span></a>
      <span className="eyebrow">account</span>
      <h1 id="login-title">Sign in to Krate</h1>
      <p className="lede">Use an administrator-configured sign-in method to continue.</p>
      {methods.length ? <div className="heroActions verticalActions" aria-label="Sign-in methods">{methods.map((method) => <a key={method.id} href={method.href}>{method.label}</a>)}</div> : <p className="loginNotice">No browser sign-in method is configured for this endpoint.</p>}
    </section>
  </main>;
}

export async function LogoutPage({ org = process.env.KRATE_ORG || 'default' } = {}) {
  return <PageFrame org={org} eyebrow="account" title="Sign out" text="End your browser session and return to the sign-in page." actions={[["/api/auth/logout", "Sign out now"], ["/", "Back to dashboard"]]} />;
}

export async function ControllerApiPage() { return <SectionPage section="controller-api" />; }
export async function RepositoriesPage({ org = null } = {}) { return <SectionPage org={org} section="repositories" />; }
export async function ApplicationsPage({ org = null } = {}) { return <SectionPage org={org} section="deployments" />; }
export async function PeoplePage({ org = null } = {}) { return <SectionPage org={org} section="people" />; }
export async function InboxPage({ org = null } = {}) { return <SectionPage org={org} section="inbox" />; }
export async function RunsPage({ org = null } = {}) { return <SectionPage org={org} section="runs" />; }
export async function RunnersCiPage({ org = null } = {}) { return <SectionPage org={org} section="runners-ci" />; }
export async function HooksEventsPage({ org = null } = {}) { return <SectionPage org={org} section="hooks-events" />; }
export async function InsightsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/insights" eyebrow="observability" title="System Health & Insights" text="Real-time connectivity status, agent activity, and system health." breadcrumbs={[['/', 'Krate'], ['/insights', 'Insights']]}>
    <HealthMonitor org={activeOrg} />
  </PageFrame>;
}
export async function ApiDocsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/api-docs" eyebrow="developer" title="API Reference" text="Interactive documentation for the Krate HTTP API. Try endpoints directly against your organization." breadcrumbs={[['/', 'Krate'], ['/api-docs', 'API Docs']]}>
    <p className="lede">Use the route at <a href={orgHref(activeOrg, '/api-docs')}>/orgs/{activeOrg}/api-docs</a> for the full interactive API explorer.</p>
  </PageFrame>;
}
export async function OperationsInstallPage({ org = null } = {}) { return <SectionPage org={org} section="operations-install" />; }
export async function AdvancedPlansPage({ org = null } = {}) { return <SectionPage org={org} section="advanced-plans" />; }

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
        {agentView.runs.items?.length ? <ul className="resourceList">{agentView.runs.items.slice(0, 5).map((run) => <li key={run.metadata?.name}><a href={orgHref(activeOrg, `/agents/runs/${run.metadata?.name}`)}><strong>{run.metadata?.name}</strong></a><span>{run.spec?.stackRef || 'unassigned'} {run.spec?.repository ? `/ ${run.spec.repository}` : ''}</span><small>Phase: {run.status?.phase || 'Pending'}{run.status?.startedAt ? ` / Started: ${run.status.startedAt}` : ''}</small></li>)}</ul> : <EmptyState title="No dispatch runs yet" text="Dispatch runs appear when agent stacks are triggered by rules or manual dispatch." />}
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
          <span>{stack.spec?.runtimeIdentity || stack.spec?.identity || 'workspace'}</span>
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
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`agent stack / ${name}`} title={name || 'Stack detail'} text={stack ? `Agent stack using ${stack.spec?.adapter || 'default'} adapter with ${stack.spec?.runtimeIdentity || 'workspace'} identity.` : 'This agent stack was not found in the current workspace.'} actions={[[orgHref(activeOrg, '/agents/stacks'), 'All stacks'], ['/agents/runs', 'Dispatch runs']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/stacks', 'Stacks'], [`/agents/stacks/${name}`, name || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two">
      <div className="card">
        <div className="cardTitle"><h3>Stack configuration</h3><StatusPill tone={stack ? 'good' : 'warn'}>{stack?.status?.phase || 'not found'}</StatusPill></div>
        {stack ? <><dl className="kv">
          <dt>Name</dt><dd>{stack.metadata?.name}</dd>
          <dt>Namespace</dt><dd>{stack.metadata?.namespace || ui.model.namespace}</dd>
          <dt>Base agent</dt><dd>{stack.spec?.baseAgent || stack.spec?.agent || 'not specified'}</dd>
          <dt>Adapter</dt><dd>{stack.spec?.adapter || 'default'}</dd>
          <dt>Runtime identity</dt><dd>{stack.spec?.runtimeIdentity || stack.spec?.identity || 'workspace'}</dd>
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
      </li>)}</ul> : <EmptyState title="No dispatch runs" text="Dispatch runs appear when agent stacks are triggered by rules or manual dispatch. Configure trigger rules or dispatch manually to create runs." />}
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
      })}</div> : <EmptyState title="No pending approvals" text="All agent approval requests have been resolved. When an agent needs human authorization, pending items appear here." />}
    </div>
    <ResolvedApprovalsSection resolved={resolved} />
  </PageFrame>;
}

function ResolvedApprovalsSection({ resolved }) {
  // Client component not available in server render — use <details> for toggle
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
      </div>)}</div> : <EmptyState title="No agent workspaces" text="Agent workspaces appear when dispatch runs provision volumes. Configure agent stacks and workspace policies to manage workspace lifecycle." />}
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

  // Load workspaces and sessions to enrich board items with live refs
  const workspaces = agentView.workspaces?.items || [];
  const sessions = agentView.sessions?.items || [];

  // Enrich board items: match by boardItemRef label or by name convention
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

  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`project / ${displayName}`} title={displayName} text={project ? (project.spec?.description || `Kanban board for project ${displayName}.`) : 'This project was not found in the current workspace.'} actions={[['/agents/projects', 'All projects'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/projects', 'Projects'], [`/agents/projects/${projectId}`, displayName]]}>
    <DegradedBanner model={ui.model} />
    {project ? <div className="card">
      <div className="cardTitle"><h2>Board</h2><StatusPill tone={enrichedItems.length ? 'good' : 'neutral'}>{enrichedItems.length} items</StatusPill></div>
      <EnhancedKanbanBoard project={project} initialIssues={enrichedItems} org={activeOrg} workspaces={workspaces} sessions={sessions} />
    </div> : <EmptyState title={`Project ${projectId} not found`} text="This project does not exist in the current workspace. Create it through Krate resource definitions." />}
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
      </div>)}</div> : <EmptyState title="No agent sessions" text="Agent sessions appear when dispatch runs create Agent Mux chat sessions. Configure agent stacks and trigger rules to start sessions." />}
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

export async function SecretManagerPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const secretGrants = allResources.filter((r) => r.kind === 'AgentSecretGrant');
  const configGrants = allResources.filter((r) => r.kind === 'AgentConfigGrant');
  const allGrants = [...secretGrants, ...configGrants];
  // Derive secrets list from grants (actual K8s secrets are fetched on-demand by the component)
  const secrets = secretGrants.reduce((acc, grant) => {
    const sName = grant.spec?.secretName || grant.spec?.secretRef;
    if (sName && !acc.find((s) => s.name === sName)) {
      acc.push({ name: sName, type: 'Opaque', createdAt: grant.status?.createdAt || null, grants: [] });
    }
    return acc;
  }, []);
  const configMaps = configGrants.reduce((acc, grant) => {
    const cName = grant.spec?.configMapName || grant.spec?.configMapRef;
    if (cName && !acc.find((c) => c.name === cName)) {
      acc.push({ name: cName, type: 'ConfigMap', createdAt: grant.status?.createdAt || null, grants: [] });
    }
    return acc;
  }, []);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/settings/secrets" eyebrow="secrets & config management" title="Secrets & ConfigMaps" text="Manage Kubernetes Secrets and ConfigMaps. Use grants to control which agent stacks can access each resource." actions={[['/settings/secrets', 'Refresh']]} breadcrumbs={[['/', 'Krate'], ['/settings/secrets', 'Secrets & ConfigMaps']]}>
    <DegradedBanner model={ui.model} />
    <SecretManager org={activeOrg} secrets={secrets} configMaps={configMaps} grants={allGrants} />
  </PageFrame>;
}

export async function AppSettingsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/settings" eyebrow="application settings" title="Settings" text="Customize appearance, locale, live update preferences, and cache behavior for the Krate console." actions={[['/', 'Home']]} breadcrumbs={[['/', 'Krate'], ['/settings', 'Settings']]}>
    <DegradedBanner model={ui.model} />
    <AppSettingsForm />
  </PageFrame>;
}

export async function UserProfilePage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const currentUser = await getSignedInUser();
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/profile" eyebrow="user profile" title="Profile" text="View and manage your account, API keys, and session information." actions={[['/', 'Home']]} breadcrumbs={[['/', 'Krate'], ['/profile', 'Profile']]}>
    <DegradedBanner model={ui.model} />
    <UserProfileForm org={activeOrg} user={currentUser} />
  </PageFrame>;
}

export async function SSHKeysPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const sshKeys = (ui.model.resources || []).filter((r) => r.kind === 'SSHKey');
  const items = sshKeys.flatMap((r) => r.items || []);
  const sshKeyFields = [
    { name: 'name', label: 'Name', placeholder: 'my-deploy-key', required: true },
    { name: 'scope', label: 'Scope', placeholder: 'deploy | user | automation', required: true },
    { name: 'key', label: 'Public key', placeholder: 'ssh-ed25519 AAAA...', required: true, type: 'textarea' }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/access/ssh-keys" eyebrow="access management" title="SSH keys" text="Manage deploy keys, user SSH keys, and automation keys. Keys are reconciled into repository key APIs." actions={[['/people', 'People'], ['/access/permissions', 'Permissions']]} breadcrumbs={[['/', 'Krate'], ['/access/ssh-keys', 'SSH keys']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="cardTitle"><h2>SSH keys</h2><StatusPill tone={items.length ? 'good' : 'neutral'}>{items.length} keys</StatusPill></div>
        {items.length ? <div className="resourceTable">{items.map((key) => {
          const name = key.metadata?.name || 'unknown';
          const scope = key.spec?.scope || 'unknown';
          const phase = key.status?.phase || 'Pending';
          const fingerprint = key.status?.fingerprint || '';
          const phaseTone = phase === 'Synced' ? 'good' : phase === 'Revoked' ? 'danger' : 'neutral';
          return <div key={name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <strong>{name}</strong>
            <span className="pill neutral" style={{ fontSize: '0.75rem' }}>{scope}</span>
            <StatusPill tone={phaseTone}>{phase}</StatusPill>
            {fingerprint ? <small style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.75rem' }}>{fingerprint.substring(0, 20)}</small> : null}
            <ResourceActions org={activeOrg} apiPath={`sshkeys/${name}`} actions={phase === 'Revoked' ? ['delete'] : ['revoke', 'delete']} />
          </div>;
        })}</div> : <EmptyState title="No SSH keys" text="Add deploy keys for CI/CD pipelines, user SSH keys for developer access, or automation keys for agent workspaces." />}
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="SSHKey"
        title="Add SSH key"
        fields={sshKeyFields}
        successText="SSH key added"
      />
    </section>
  </PageFrame>;
}

export async function RepositoryPermissionsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const permResources = (ui.model.resources || []).filter((r) => r.kind === 'RepositoryPermission');
  const items = permResources.flatMap((r) => r.items || []);
  const repositories = ui.repositories || [];
  const permFields = [
    { name: 'name', label: 'Name', placeholder: 'repo-user-read', required: true },
    { name: 'repository', label: 'Repository', placeholder: 'my-repo', required: true },
    { name: 'subject', label: 'Subject', placeholder: 'username or team name', required: true },
    { name: 'permission', label: 'Permission', placeholder: 'read | write | admin', required: true }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/access/permissions" eyebrow="access management" title="Repository permissions" text="Manage repository collaborators and team access grants. Permissions are synced with the underlying repository hosting." actions={[['/people', 'People'], ['/access/ssh-keys', 'SSH keys']]} breadcrumbs={[['/', 'Krate'], ['/access/permissions', 'Permissions']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="cardTitle"><h2>Repository permissions</h2><StatusPill tone={items.length ? 'good' : 'neutral'}>{items.length} grants</StatusPill></div>
        {items.length ? <div className="resourceTable">
          <div className="resourceRow" style={{ fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Name</span><span>Repository</span><span>Subject</span><span>Permission</span><span>Status</span>
          </div>
          {items.map((perm) => {
            const name = perm.metadata?.name || 'unknown';
            const repo = perm.spec?.repository || '--';
            const subject = perm.spec?.subject || '--';
            const permission = perm.spec?.permission || 'read';
            const phase = perm.status?.phase || 'Pending';
            const phaseTone = phase === 'Synced' ? 'good' : phase === 'Revoked' ? 'danger' : 'neutral';
            return <div key={name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <strong>{name}</strong>
              <span>{repo}</span>
              <span>{subject}</span>
              <span className="pill neutral" style={{ fontSize: '0.75rem' }}>{permission}</span>
              <StatusPill tone={phaseTone}>{phase}</StatusPill>
              <ResourceActions org={activeOrg} apiPath={`repositorypermissions/${name}`} actions={phase === 'Revoked' ? ['delete'] : ['revoke', 'delete']} />
            </div>;
          })}
        </div> : <EmptyState title="No repository permissions" text="Grant collaborator or team access to repositories. Permissions are reconciled with the repository hosting platform." />}
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="RepositoryPermission"
        title="Grant access"
        fields={permFields}
        successText="Permission granted"
      />
    </section>
  </PageFrame>;
}

export async function BranchProtectionPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const bpResources = (ui.model.resources || []).filter((r) => r.kind === 'BranchProtection');
  const items = bpResources.flatMap((r) => r.items || []);
  const refPolicyResources = (ui.model.resources || []).filter((r) => r.kind === 'RefPolicy');
  const refPolicies = refPolicyResources.flatMap((r) => r.items || []);
  const bpFields = [
    { name: 'name', label: 'Name', placeholder: 'protect-main', required: true },
    { name: 'refs', label: 'Protected refs', placeholder: 'refs/heads/main, refs/heads/release/*', required: true },
    { name: 'requiredReviews', label: 'Required reviews', placeholder: '1', required: false },
    { name: 'requireStatusChecks', label: 'Require status checks', placeholder: 'true', required: false }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/access/branch-protection" eyebrow="access management" title="Branch protection" text="Define protected branch rules and ref policies. Control force-push, signing requirements, and merge gates." actions={[['/people', 'People'], ['/access/permissions', 'Permissions']]} breadcrumbs={[['/', 'Krate'], ['/access/branch-protection', 'Branch protection']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div className="stack">
        <div className="card">
          <div className="cardTitle"><h2>Branch protection rules</h2><StatusPill tone={items.length ? 'good' : 'neutral'}>{items.length} rules</StatusPill></div>
          {items.length ? <div className="resourceTable">{items.map((bp) => {
            const name = bp.metadata?.name || 'unknown';
            const refs = bp.spec?.refs || [];
            const phase = bp.status?.phase || 'Pending';
            const phaseTone = phase === 'Active' || phase === 'Ready' || phase === 'Synced' ? 'good' : phase === 'Failed' ? 'danger' : 'neutral';
            return <div key={name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <strong>{name}</strong>
              <span>{Array.isArray(refs) ? refs.join(', ') : String(refs)}</span>
              <StatusPill tone={phaseTone}>{phase}</StatusPill>
              <ResourceActions org={activeOrg} apiPath={`branchprotections/${name}`} actions={['delete']} />
            </div>;
          })}</div> : <EmptyState title="No branch protection rules" text="Add branch protection rules to enforce review requirements, status checks, and merge policies on protected branches." />}
        </div>
        <div className="card">
          <div className="cardTitle"><h2>Ref policies</h2><StatusPill tone={refPolicies.length ? 'good' : 'neutral'}>{refPolicies.length} policies</StatusPill></div>
          {refPolicies.length ? <div className="resourceTable">{refPolicies.map((rp) => {
            const name = rp.metadata?.name || 'unknown';
            const phase = rp.status?.phase || 'Pending';
            return <div key={name} className="resourceRow">
              <strong>{name}</strong>
              <StatusPill tone={phase === 'Active' || phase === 'Ready' ? 'good' : 'neutral'}>{phase}</StatusPill>
              <ResourceActions org={activeOrg} apiPath={`refpolicies/${name}`} actions={['delete']} />
            </div>;
          })}</div> : <p className="emptyText">No ref policies configured. Ref policies control force-push, signing requirements, and custom hook gates.</p>}
        </div>
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="BranchProtection"
        title="Add protection rule"
        fields={bpFields}
        successText="Branch protection rule created"
      />
    </section>
  </PageFrame>;
}

export async function RepositoryCodePage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="code" />; }
export async function RepositoryPullRequestsPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="pull-requests" />; }
export async function RepositoryIssuesPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="issues" />; }
export async function RepositoryRunsPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="runs" />; }
export async function RepositoryHooksPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="hooks" />; }
export async function RepositorySettingsPage({ org = null, repo }) { return <RepositorySectionPage org={org} repo={repo} section="settings" />; }

export async function SectionPage({ org = null, section }) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const page = sectionContent(section, ui, activeOrg);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath={`/${section}`} eyebrow={page.eyebrow} title={page.title} text={page.text} actions={page.actions} breadcrumbs={page.breadcrumbs || [['/', 'Krate'], ['/' + section, page.title]]}><DegradedBanner model={ui.model} />{page.body}</PageFrame>;
}

export async function RepositorySectionPage({ org = null, repo, section = 'code' }) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const repository = ui.repositories.find((item) => item.metadata?.name === repo) || null;
  const page = repositorySectionContent(section, repo, repository, ui, activeOrg);
  const actions = repository ? [[`/repositories/${repo}/pull-requests`, 'Open reviews'], [`/repositories/${repo}/runs`, 'View runs'], [`/repositories/${repo}/settings`, 'Settings']] : [['/repositories', 'Create repository'], ['/advanced-plans', 'Advanced details']];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/repositories" eyebrow={`repository / ${repo}`} title={page.title} text={page.text} actions={actions} breadcrumbs={[[ '/', 'Krate' ], [ '/repositories', 'Repositories' ], [ `/repositories/${repo}/code`, repo ], [ `/repositories/${repo}/${section}`, page.title ]] }><RepositoryHeader repo={repo} repository={repository} model={ui.model} /><DegradedBanner model={ui.model} /><RepositoryNav org={activeOrg} repo={repository ? repo : null} /><RepositoryCommandBar org={activeOrg} repo={repo} repository={repository} model={ui.model} />{page.body}</PageFrame>;
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

function repositorySectionContent(section, repo, repository, ui, activeOrg) {
  const plan = repository ? resourceJson(repository) : null;
  const empty = !repository;
  const pages = {
    code: { title: repo, text: empty ? 'Create this repository to start browsing files and cloning code.' : 'Browse files, copy clone commands, and branch from the default ref.', body: <div className="repoCodePage">{!empty ? <RepoCodeBrowser org={activeOrg} repo={repo} defaultBranch={repository?.spec?.defaultBranch || 'main'} /> : <div className="card"><h3>Repository not connected</h3><p>Create this repository to start browsing files and cloning code.</p></div>}<CloneAndRefs repo={repo} repository={repository} /></div> },
    'pull-requests': { title: 'Reviews', text: 'Review, merge, or close pull requests for this repository.', body: <div className="routeGrid wideLeft"><PullRequestList org={activeOrg} repo={repo} pullRequests={ui.pullRequests} /><PullRequestReviewPanel model={ui.model} repo={repo} /></div> },
    issues: { title: 'Issues', text: 'Create, triage, and close issues for this repository.', body: <div className="routeGrid wideLeft"><IssueList org={activeOrg} repo={repo} issues={ui.issues} /><IssueBoard model={ui.model} repo={repo} /></div> },
    runs: { title: 'Runs', text: 'Trigger and monitor pipeline runs for this repository.', body: <div className="routeGrid wideLeft"><RepoRuns org={activeOrg} repo={repo} runs={ui.pipelines} /><RunEventStream org={activeOrg} resource={ui.pipelines} events={ui.model.events} /></div> },
    hooks: { title: 'Hooks & Policies', text: 'Inspect subscriptions, replay deliveries, and adjust repository admission policies.', body: <div className="routeGrid wideLeft"><WebhookInspector model={ui.model} repo={repo} /><PolicyPanel org={activeOrg} model={ui.model} repo={repo} resource={ui.model.resources.find((resource) => resource.kind === 'RefPolicy')} /></div> },
    settings: { title: 'Settings', text: 'Update visibility, default branch, access, and policy checks from one settings map.', body: <div className="routeGrid wideLeft"><RepoSettingsPanel repository={repository} model={ui.model} org={activeOrg} repo={repo} /><div className="stack"><ResourceApplyPanel org={activeOrg} resource={publicResource(repository)} /><PlanCard title="Repository details" plan={plan} command="Save repository changes" /></div></div> }
  };
  return pages[section] || pages.code;
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

function ForgeFlowRail({ repository, model }) {
  const repoName = repository?.metadata?.name || repository?.name || '<repository>';
  const steps = [['Create', '/repositories', 'Create the repository'], ['Clone', `/repositories/${repoName}/code`, 'Copy clone URLs and branch'], ['Open review', `/repositories/${repoName}/pull-requests`, 'Review files and checks'], ['Merge', `/repositories/${repoName}/pull-requests`, 'Merge when policy is satisfied'], ['Deploy', '/deployments', 'Promote to an environment'], ['Observe', `/repositories/${repoName}/runs`, 'Follow runs and events']];
  return <section className="forgeFlowRail" aria-label="Forge workflow"><div><span className="eyebrow">guided flow</span><h2>Create → review → merge → deploy</h2><p>The default journey is task-led. Advanced resource details stay available on demand.</p></div><ol>{steps.map(([label, href, description]) => <li key={label}><a href={modelHref(model, href)}><strong>{label}</strong><span>{description}</span></a></li>)}</ol><StatusPill tone={model.status === 'ready' ? 'good' : 'warn'}>{model.status}</StatusPill></section>;
}

function RepositoryCommandBar({ org = 'default', repo, repository, model }) {
  const disabled = !repository;
  return <section className="repoCommandBar" aria-label="Repository command bar"><a className="primaryCommand" href={orgHref(org, disabled ? '/repositories' : `/repositories/${repo}/code`)}>{disabled ? 'Create repository' : 'Clone / open code'}</a><a href={orgHref(org, disabled ? '/repositories' : `/repositories/${repo}/pull-requests`)}>Open review</a><a href={orgHref(org, '/deployments')}>Deploy</a><a href={orgHref(org, disabled ? '/repositories' : `/repositories/${repo}/settings`)}>Manage access</a><div><span>Readiness</span><code>{disabled ? 'Repository missing' : `Access checks in ${model.namespace}`}</code></div></section>;
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

function RepositoryLanding({ model, repositories }) {
  return <div className="card repoBrowser"><div className="cardTitle"><h3>Repository home</h3><StatusPill tone={repositories.length ? 'good' : 'warn'}>{repositories.length} repos</StatusPill></div><p>Create or import a repository, then move through code, reviews, runs, automations, and settings.</p>{repositories.length ? <ul className="resourceList">{repositories.map((repository) => <li key={repository.metadata?.name}><a href={modelHref(model, `/repositories/${repository.metadata?.name}/code`)}><strong>{repository.metadata?.name}</strong></a><span>{repository.spec?.visibility || 'internal'} · {repository.spec?.defaultBranch || 'main'}</span><small>Phase: {repository.status?.phase || 'Unknown'}</small></li>)}</ul> : <EmptyState title="Create or import your first repository" text="Use the form on this page. The advanced editor is available only when you need it." /> }<InfoList title="Next best actions" items={model.views.dashboard.excellentFlows.slice(0, 4)} /></div>;
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

function IssueBoard({ model, repo }) {
  const issues = model.resources.find((resource) => resource.kind === 'Issue')?.items || [];
  const columns = ['triage', 'ready', 'blocked'];
  return <div className="card issueBoard"><div className="cardTitle"><h3>Issue board</h3><StatusPill tone={issues.length ? 'good' : 'neutral'}>{issues.length} issues</StatusPill></div><div className="boardColumns">{columns.map((column) => <section key={column}><h4>{column}</h4>{issues.filter((issue, index) => (issue.status?.phase || columns[index % columns.length]).toLowerCase() === column).map((issue) => <article key={issue.metadata?.name}><strong>{issue.spec?.title || issue.metadata?.name}</strong><small>{repo} · {issue.metadata?.name}</small></article>)}{!issues.length ? <p className="emptyText">No {column} issues.</p> : null}</section>)}</div></div>;
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
      {/* General settings */}
      <div className="card securitySettings">
        <div className="cardTitle">
          <h3>Repository settings</h3>
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

      {/* Update settings form */}
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

      {/* Branch protection rules */}
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

      {/* Collaborators */}
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

      {/* Danger zone */}
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
  const hasKubeVela = kubeVelaResources.some((r) => (r.count || 0) > 0) || model.delivery?.available;
  const firstRepo = repositories?.[0]?.metadata?.name || null;
  if (hasKubeVela) {
    return <DeploymentManager namespace={model.namespace} org={org} repositories={repositories.map(publicResource)} delivery={model.delivery} />;
  }
  return <DeploymentPipeline org={org} repository={firstRepo} kubeVelaAvailable={false} />;
}

function KubeVelaRequiredBanner({ model }) {
  const kubeVelaResources = (model.resources || []).filter((r) => String(r.kind || '').startsWith('KubeVela'));
  const hasKubeVela = kubeVelaResources.some((r) => (r.count || 0) > 0) || model.delivery?.available;
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

function DegradedBanner({ model }) {
  if (model.status === 'ready') return null;
  return <section className="card degradedBanner"><div className="cardTitle"><h2>Krate workspace degraded or empty</h2><StatusPill tone="warn">{model.status}</StatusPill></div><p>Connect the Krate workspace service or set <code>KRATE_CONTROLLER_URL</code> for a remote Krate endpoint.</p><ul className="compactList">{(model.controller.connection?.errors || ['No Krate resources returned']).slice(0, 3).map((error) => <li key={error}>{sanitizeCopy(error)}</li>)}</ul></section>;
}

function DashboardMetrics({ model }) {
  const cards = model.views.dashboard.cards;
  return <div className="card"><div className="cardTitle"><h2>Workspace counts</h2><StatusPill tone={model.status === 'ready' ? 'good' : 'warn'}>{model.status}</StatusPill></div><div className="metricGrid">{cards.map((card) => <a href={modelHref(model, card.href)} key={card.label}><strong>{card.value}</strong><span>{card.label}</span></a>)}</div><InfoList title="Readiness" items={model.validation.map((item) => `${item.passed ? 'Ready' : 'Needs attention'} ${sanitizeCopy(item.name)}: ${sanitizeCopy(item.evidence)}`)} /></div>;
}

function EndpointPanel({ model }) {
  return <details className="card"><summary><span><h3>Advanced endpoints</h3><p>Expand to inspect live API endpoints.</p></span></summary><div className="endpointList">{model.controller.endpoints.map((endpoint) => <a key={`${endpoint.method}-${endpoint.path}`} href={endpoint.path.includes(':') ? modelHref(model, '/controller-api') : endpoint.path.replace('*', 'repositories')}><span>{endpoint.method}</span> <code>{endpoint.path}</code><small>{sanitizeCopy(endpoint.purpose)}</small></a>)}</div></details>;
}

function PermissionPanel({ model }) {
  return <div className="card"><h3>Access checks</h3>{model.permissions?.length ? <div className="resourceTable">{model.permissions.map((permission) => <div key={displayKind(permission.kind)} className="resourceRow"><strong>{displayKind(permission.kind)}</strong><span>{Object.entries(permission.verbs).filter(([, allowed]) => allowed).map(([verb]) => verb).join(', ') || 'no allowed verbs reported'}</span></div>)}</div> : <p className="emptyText">No access check results returned yet.</p>}</div>;
}
function ResourceList({ model }) {
  return <details className="card"><summary><span><h3>Advanced resource records</h3><p>Expand to inspect the records behind this workspace.</p></span></summary><div className="resourceTable">{model.resources.map((resource) => <div key={displayKind(resource.kind)} className="resourceRow"><strong>{displayKind(resource.kind)}</strong><span>{resource.count} items</span><code>{displayCommand(resource, 'list')}</code></div>)}</div></details>;
}

function ResourceTable({ resource }) {
  if (!resource) return <EmptyState title="Resource unavailable" text="The Krate model did not include this resource definition." />;
  const label = displayKind(resource.kind);
  return <details className="card"><summary><span><h3>{label}</h3><p>{resource.count} records available. Expand for advanced details.</p></span><StatusPill tone={resource.count ? 'good' : 'neutral'}>{resource.count} returned</StatusPill></summary><code>{displayCommand(resource, 'list')}</code>{resource.names?.length ? <ul className="compactList">{resource.names.map((name) => <li key={name}>{name}</li>)}</ul> : <p className="emptyText">No {label} records returned by Krate.</p>}<PlanCard title={`${label} details`} plan={resource.yaml} command={displayCommand(resource, 'apply')} /></details>;
}

function EmptyIfNone({ resource, noun }) {
  return resource?.count ? <ResourceTable resource={resource} /> : <EmptyState title={`No ${noun} resources`} text={`Create ${noun} through the Krate flow; advanced details are available if needed.`} />;
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

function PlanCard({ title, plan, compact = false, initiallyOpen = false }) {
  return <details className={`planCard ${compact ? 'compactPlan' : ''}`} open={initiallyOpen}><summary><span><h3>{title}</h3><p>Advanced resource details. Expand only when direct editing is needed.</p></span><StatusPill tone="neutral">advanced</StatusPill></summary><pre><code>{sanitizeCopy(plan) || 'No advanced details are available yet.'}</code></pre></details>;
}

function InfoList({ title, items }) {
  return <div><h4>{title}</h4><ul className="compactList">{items.map((item) => <li key={item}>{sanitizeCopy(item)}</li>)}</ul></div>;
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

function EmptyState({ title, text, cta, ctaLabel }) {
  return <div className="card emptyState"><h3>{title}</h3><p>{text}</p>{cta ? <div style={{ marginTop: '0.75rem' }}><a href={cta} style={{ padding: '0.4rem 1rem', background: 'var(--color-accent, #3b82f6)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>{ctaLabel || 'Get started'}</a></div> : null}</div>;
}

export async function ExternalProvidersPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const externalView = ui.model.external || {};
  const providers = externalView.providers?.items || (ui.model.resources || []).find((r) => r.kind === 'ExternalBackendProvider')?.items || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/external" eyebrow="external backends" title="External backend providers" text="Connect external forges, issue trackers, and CI/CD systems as Krate-managed provider backends." actions={[['/external/providers/new', 'Add provider'], ['/external/sync', 'Sync status'], ['/external/conflicts', 'Conflicts']]} breadcrumbs={[['/', 'Krate'], ['/external', 'Providers']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <ExternalProviderList org={activeOrg} providers={providers} addHref={orgHref(activeOrg, '/external/providers/new')} />
    </div>
  </PageFrame>;
}

export async function ExternalSyncPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const externalView = ui.model.external || {};
  const bindings = externalView.bindings?.items || (ui.model.resources || []).find((r) => r.kind === 'ExternalBackendBinding')?.items || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/external" eyebrow="external sync" title="External sync dashboard" text="Monitor sync state, pending write intents, and open conflicts for all external backend bindings." actions={[['/external', 'Providers'], ['/external/conflicts', 'Conflicts']]} breadcrumbs={[['/', 'Krate'], ['/external', 'Providers'], ['/external/sync', 'Sync']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <ExternalSyncDashboard org={activeOrg} bindings={bindings} />
    </div>
  </PageFrame>;
}

export async function ExternalProviderNewPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/external" eyebrow="external backends" title="Add external provider" text="Connect a new forge, issue tracker, or CI/CD system as an external backend provider." actions={[['/external', 'All providers']]} breadcrumbs={[['/', 'Krate'], ['/external', 'Providers'], ['/external/providers/new', 'New']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <ExternalProviderWizard org={activeOrg} onCancel={null} onSuccess={null} />
    </div>
  </PageFrame>;
}

export async function ExternalConflictsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const externalView = ui.model.external || {};
  const conflicts = externalView.conflicts?.items || (ui.model.resources || []).find((r) => r.kind === 'ExternalFieldConflict')?.items || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/external" eyebrow="conflict resolution" title="External conflict resolution" text="Resolve field-level conflicts between local Krate state and external provider values." actions={[['/external', 'Providers'], ['/external/sync', 'Sync status']]} breadcrumbs={[['/', 'Krate'], ['/external', 'Providers'], ['/external/conflicts', 'Conflicts']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <ExternalConflictResolver org={activeOrg} conflicts={conflicts} />
    </div>
  </PageFrame>;
}

function resourceJson(resource) {
  return sanitizeCopy(JSON.stringify(resource, null, 2));
}

function publicResource(resource) {
  if (!resource) return null;
  return redactPublicValue(resource);
}

function redactPublicValue(value, key = '') {
  if (key === 'annotations' || key === 'managedFields' || key === 'ownerReferences') return undefined;
  if (Array.isArray(value)) return value.map((item) => redactPublicValue(item)).filter((item) => item !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactPublicValue(entryValue, entryKey)]).filter(([, entryValue]) => entryValue !== undefined));
  }
  if (typeof value === 'string') return sanitizeCopy(value);
  return value;
}

function deploymentKind(suffix) {
  return `Kube${'Vela'}${suffix}`;
}

function displayKind(kind) {
  return String(kind || '').replace(new RegExp(`^${deploymentKind('')}`), '').replace('ApplicationRevision', 'Release').replace('ResourceTracker', 'ManagedResource') || kind;
}

function displayRole(role) {
  return sanitizeCopy(String(role || '').replace(/kubernetes/g, 'delivery').replace(/gitea/g, 'Krate repositories'));
}

function displayCommand(resource, action) {
  if (!resource) return 'Open Krate';
  const label = displayKind(resource.kind).toLowerCase();
  return action === 'apply' ? `Review ${label} details` : `Open ${label} records`;
}

function sanitizeAction(value) {
  return sanitizeCopy(value).replace('pod events', 'run events');
}

function sanitizeCopy(value) {
  return String(value || '')
    .replace(new RegExp(deploymentKind(''), 'g'), 'Krate')
    .replace(/OAM/g, 'Krate deployment')
    .replace(/Gitea/g, 'Krate repositories')
    .replace(/gitea/g, 'Krate repositories')
    .replace(/Argo CD/g, 'Krate release sync')
    .replace(/GitOps/g, 'release sync')
    .replace(/Kubernetes/g, 'Krate')
    .replace(/kubernetes/g, 'Krate')
    .replace(/kubectl/g, 'Krate action')
    .replace(/SubjectAccessReview/g, 'access check')
    .replace(/RBAC/g, 'access policy')
    .replace(/smart-HTTP/g, 'repository streaming')
    .replace(/KRATE_GITEA_HTTP_URL/g, 'Krate repositories')
    .replace(/core\.oam\.dev/g, 'krate.delivery')
    .replace(/app\.oam\.dev/g, 'app.krate.delivery')
    .replace(/policy\.oam\.dev/g, 'policy.krate.delivery')
    .replace(/ApplicationRevision/g, 'Release')
    .replace(/ResourceTracker/g, 'ManagedResource')
    .replace(/YAML/g, 'advanced details')
    .replace(/yaml/g, 'advanced details');
}


