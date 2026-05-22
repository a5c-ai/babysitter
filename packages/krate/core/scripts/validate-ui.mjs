import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createControllerUiModel } from '../src/index.js';

const required = [
  'apps/web/app/layout.jsx',
  'apps/web/app/globals.css',
  'apps/web/app/page.jsx',
  'apps/web/app/ui-shell.jsx',
  'apps/web/app/lib/krate-ui.jsx',
  'apps/web/app/lib/page-frame.jsx',
  'apps/web/app/pages/repo-pages.jsx',
  'apps/web/app/pages/manage-pages.jsx',
  'apps/web/app/pages/agent-pages.jsx',
  'apps/web/app/pages/settings-pages.jsx',
  'apps/web/app/pages/external-pages.jsx',
  'apps/web/proxy.js',
  'apps/web/app/components/app-settings.jsx',
  'apps/web/app/components/code-editor.jsx',
  'apps/web/app/components/resource-actions.jsx',
  'apps/web/app/components/issue-editor.jsx',
  'apps/web/app/components/repo-code-browser.jsx',
  'apps/web/app/components/repo-runs.jsx',
  'apps/web/app/components/krate-loading.jsx',
  'apps/web/app/components/theme-runtime.jsx',
  'apps/web/app/loading.jsx',
  'apps/web/app/api/controller/route.js',
  'apps/web/app/api/orgs/[org]/resources/route.js',
  'apps/web/app/api/orgs/[org]/resources/[kind]/[name]/route.js',
  'apps/web/app/api/orgs/[org]/repositories/route.js',
  'apps/web/app/api/orgs/[org]/repositories/[name]/route.js',
  'apps/web/app/api/orgs/[org]/pipelines/[name]/logs/route.js',
  'apps/web/app/api/orgs/[org]/policies/route.js',
  'apps/web/app/api/orgs/[org]/policy-reports/route.js',
  'apps/web/app/api/orgs/[org]/policy-exception-requests/route.js',
  'apps/web/app/api/watch/[[...resource]]/route.js',
  'apps/web/app/api/git-proxy/route.js',
  'apps/web/app/api/auth/[provider]/route.js',
  'apps/web/app/api/auth/callback/[provider]/route.js',
  'apps/web/app/api/auth/logout/route.js',
  'apps/web/app/api/auth/delegated/route.js',
  'apps/web/app/api/orgs/[org]/agents/events/stream/route.js',
  'src/api-controller.js',
  'src/kubernetes-resource-gateway.js',
  'src/kubernetes-controller.js',
  'src/controller-client.js',
  'src/controller-ui.js',
  'src/http-server.js',
  'src/gitea-backend.js',
  '../sdk/src/index.js',
  '../charts/crds/agent-resources.yaml',
  '../charts/crds/aggregated-resources.yaml'
];
function resolveRequiredFile(file) {
  if (existsSync(file)) return file;
  if (file.startsWith('apps/web/')) {
    const packageRelative = path.join('..', 'web', file.slice('apps/web/'.length));
    if (existsSync(packageRelative)) return packageRelative;
  }
  return file;
}

const files = Object.fromEntries(required.map((file) => [file, readFileSync(resolveRequiredFile(file), 'utf8')]));
function webUiSource() {
  return Object.entries(files)
    .filter(([file]) => file.startsWith('apps/web/app/'))
    .map(([, source]) => source)
    .join('\n');
}
const failures = [];

for (const [file, source] of Object.entries(files)) {
  if (!source.trim()) failures.push(`${file} is empty`);
}
if (!/\.appBody\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*none;/.test(files['apps/web/app/globals.css'])) {
  failures.push('app shell body must use the full viewport width');
}
if (/\.appBody\s*\{[^}]*width:\s*min\(100%,\s*\d+px\)/.test(files['apps/web/app/globals.css'])) {
  failures.push('app shell body is capped to a centered max width');
}
if (!/\.appTopbar,\s*\.appBody,\s*\.appContent,\s*\.routeMain\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*none;[\s\S]*?margin-left:\s*0;[\s\S]*?margin-right:\s*0;/.test(files['apps/web/app/globals.css'])) {
  failures.push('authenticated app shell must override centered layout caps at the final cascade layer');
}
if (!/\.loginMain\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*none;[\s\S]*?margin:\s*0;/.test(files['apps/web/app/globals.css'])) {
  failures.push('login shell must use the full viewport width');
}
if (/\.loginMain\s*\{[^}]*width:\s*min\([^;]*720px\)/.test(files['apps/web/app/globals.css'])) {
  failures.push('login shell is capped to a centered card width');
}
if (!/\.loginCard\s*\{[\s\S]*?width:\s*min\(100%,\s*720px\)/.test(files['apps/web/app/globals.css'])) {
  failures.push('login card must own the readable sign-in width cap');
}
for (const file of ['apps/web/app/api/controller/route.js', 'apps/web/app/api/watch/[[...resource]]/route.js', 'src/controller-client.js']) {
  if (files[file].includes('createKrateUiDemoRuntime')) failures.push(`${file} imports or calls createKrateUiDemoRuntime`);
  if (files[file].includes('createKrateRuntime()')) failures.push(`${file} creates an in-memory runtime fallback`);
}
for (const file of ['apps/web/app/page.jsx', 'apps/web/app/ui-shell.jsx']) {
  if (files[file].includes('krate-demo')) failures.push(`${file} hardcodes krate-demo demo navigation`);
}
for (const [file, source] of Object.entries(files)) {
  if (source.includes('sampleResource') || source.includes('exampleResource')) failures.push(`${file} synthesizes sample/example Krate resources`);
  if (source.includes('new-repository') && file !== 'apps/web/app/components/resource-actions.jsx') failures.push(`${file} hardcodes synthetic Repository data`);
}
for (const token of ['export function proxy', 'NextResponse.redirect', 'KRATE_AUTH_COOKIE_NAME', 'krate_session', '/login', '/api/auth', 'matcher']) {
  if (!files['apps/web/proxy.js'].includes(token)) failures.push(`web proxy missing ${token}`);
}
for (const token of ['spawnSync', 'spawn(', 'kubectl', 'getControllerSnapshot', 'listResource', 'getResource', 'applyResource', 'deleteResource', 'createRepository', 'watchResource', 'auth', 'can-i']) {
  if (!files['src/kubernetes-controller.js'].includes(token)) failures.push(`kubernetes controller missing ${token}`);
}
for (const token of ['getControllerSnapshotAsync', 'fallbackSnapshot', 'controller.snapshot()', 'createControllerUiModel']) {
  if (!files['src/controller-client.js'].includes(token)) failures.push(`controller client missing ${token}`);
}
for (const token of ['createKrateApiController', 'resourceGateway', 'withArchitecture', 'krate-api-controller', 'kubernetes-resource-gateway', 'kubernetes-resource-client', 'git-data-plane', 'never owns Kubernetes reconciliation loops', 'KRATE_API_CONTROLLER_BOUNDARY', 'listRepositoriesForForge', 'getRepositoryForgeView', 'krate-kubernetes-reconciler']) {
  if (!files['src/api-controller.js'].includes(token)) failures.push(`api controller boundary missing ${token}`);
}
for (const token of ['createKubernetesResourceClient', 'repositoryManifest', 'async list', 'async get', 'async apply', 'async delete', 'watch(resourcePath', 'KUBERNETES_RESOURCE_GATEWAY_BOUNDARY', 'mustNotOwn']) {
  if (!files['src/kubernetes-resource-gateway.js'].includes(token)) failures.push(`kubernetes resource gateway missing ${token}`);
}
for (const token of ['GET', 'POST', 'DELETE', 'controller.listResource', 'controller.getResource', 'controller.applyResource', 'controller.deleteResource', 'controller.createRepository']) {
  const joinedRoutes = files['apps/web/app/api/orgs/[org]/resources/route.js'] + files['apps/web/app/api/orgs/[org]/resources/[kind]/[name]/route.js'] + files['apps/web/app/api/orgs/[org]/repositories/route.js'] + files['apps/web/app/api/orgs/[org]/repositories/[name]/route.js'];
  if (!joinedRoutes.includes(token)) failures.push(`resource management routes missing ${token}`);
}
const policyRoutes = files['apps/web/app/api/orgs/[org]/policies/route.js'] + files['apps/web/app/api/orgs/[org]/policy-reports/route.js'] + files['apps/web/app/api/orgs/[org]/policy-exception-requests/route.js'];
for (const token of ['GET', 'POST', 'createKrateApiController', 'createControllerUiModel', 'policyEngine', 'controller.applyResource', 'PolicyBinding', 'PolicyExceptionRequest']) {
  if (!policyRoutes.includes(token)) failures.push(`policy management routes missing ${token}`);
}
for (const token of ['--watch', 'text/event-stream', 'controller.watchResource', 'krate-error', 'request.signal']) {
  if (!files['apps/web/app/api/watch/[[...resource]]/route.js'].includes(token)) failures.push(`watch route missing ${token}`);
}
for (const token of ['RepositoryManager', 'DeploymentManager', 'ResourceApplyPanel', '/api/orgs/${org}/repositories', '/api/orgs/${org}/resources', 'fetch(', 'Save changes', 'InviteReviewList', 'UserReviewList', 'PermissionReviewList', 'Mark accepted', 'Revoke invite', 'Disable user', 'Restore user', 'Revoke grant', 'SshKeyReviewList', 'Save SSH key', 'Revoke SSH key', 'Create deployment', 'Prepare deployment']) {
  if (!(files['apps/web/app/components/resource-actions.jsx'] + webUiSource()).includes(token)) failures.push(`UI management surface missing ${token}`);
}
for (const token of ['DegradedBanner', 'No repositories are available yet.', 'No resource selected yet.', 'Access checks', 'Krate repositories']) {
  if (!(webUiSource() + files['apps/web/app/components/resource-actions.jsx']).includes(token)) failures.push(`truthful degraded/empty UI missing ${token}`);
}
for (const token of ['KrateControllerRecovery', 'KrateLoadingView', 'KRATE_LOADING_MESSAGES', '/api/controller', 'setRecovered(true)', 'router.refresh()', 'sessionStorage']) {
  if (!(webUiSource() + files['apps/web/app/components/krate-loading.jsx']).includes(token)) failures.push(`recovery loading UI missing ${token}`);
}
for (const token of ['KrateRouteLoadingOverlay', 'krate-route-loading-refresh']) {
  if ((webUiSource() + files['apps/web/app/components/krate-loading.jsx']).includes(token)) failures.push(`route transitions must not render recovery loading UI token ${token}`);
}
if (!files['apps/web/app/loading.jsx'].includes('routeLoading') || !files['apps/web/app/loading.jsx'].includes('krateLoadingBar animated')) failures.push('route loading UI must render immediate non-overlay loading feedback');
if (files['apps/web/app/loading.jsx'].includes('KrateDelayedRouteLoading') || files['apps/web/app/loading.jsx'].includes('return null')) failures.push('route loading UI must not delay or render a blank fallback');
if (!files['apps/web/app/globals.css'].includes('krateRouteLoadingProgress') || !files['apps/web/app/globals.css'].includes('krateRouteLoadingPhase')) failures.push('route loading UI must animate progress and phase text without client hydration');
if (!files['apps/web/app/lib/krate-ui.jsx'].includes('useCache: true') || files['apps/web/app/lib/krate-ui.jsx'].includes('useCache: false')) failures.push('Krate page loader must use cached controller snapshots');
for (const token of ['KrateProject', 'Issue', 'syncHydratedModel', 'model.agents']) {
  if (!files['apps/web/app/lib/krate-ui.jsx'].includes(token)) failures.push(`Krate page model hydration missing ${token}`);
  if (!files['apps/web/app/api/controller/route.js'].includes(token === 'syncHydratedModel' ? 'KrateProject' : token)) failures.push(`controller API hydration missing ${token}`);
}
for (const token of ['ThemeRuntime', 'themeInitScript', 'krate-theme', 'suppressHydrationWarning']) {
  if (!files['apps/web/app/layout.jsx'].includes(token)) failures.push(`root layout missing persistent theme token ${token}`);
}
for (const token of ['THEME_STORAGE_KEY', 'krate-theme', 'applyTheme', 'storeTheme', "window.addEventListener('storage'", 'prefers-color-scheme: dark']) {
  if (!files['apps/web/app/components/theme-runtime.jsx'].includes(token)) failures.push(`theme runtime missing ${token}`);
}
for (const token of ['[style*="#374151"]', '[style*="#fafafa"]', 'outline: 3px solid #79c0ff', '::placeholder', 'background: #4d1512', '.pill.good { color: #7ee787', 'background: #ffb4ab', '[data-theme="dark"] h4', '.repoCommandBar > a', 'routeMain:has(.repoHeader) .repoCommandBar > a']) {
  if (!files['apps/web/app/globals.css'].includes(token)) failures.push(`dark mode accessibility override missing ${token}`);
}
if (!files['apps/web/app/components/app-settings.jsx'].includes('storeTheme(newTheme)') || files['apps/web/app/components/app-settings.jsx'].includes("localStorage.setItem('krate-theme'")) failures.push('settings theme changes must go through the shared theme runtime');
if ((webUiSource() + files['apps/web/app/components/krate-loading.jsx']).includes('Krate workspace degraded or empty')) failures.push('degraded workspace copy should be replaced by recovery loading UI');
if ((webUiSource() + files['apps/web/app/components/krate-loading.jsx']).includes('window.location.reload')) failures.push('recovery loading UI must not reload the page');
for (const token of ['text/event-stream', 'globalEventBus', 'KRATE_CONTROLLER_URL', "type: 'connected'"]) {
  if (!files['apps/web/app/api/orgs/[org]/agents/events/stream/route.js'].includes(token)) failures.push(`events stream route missing ${token}`);
}
if (!/\.krateRecoveryOverlay\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;/.test(files['apps/web/app/globals.css'])) failures.push('recovery loading UI must be fixed overlay');
for (const token of ['duplex', 'KRATE_GITEA_HTTP_URL', 'fetch(target', 'degraded']) {
  if (!files['apps/web/app/api/git-proxy/route.js'].includes(token)) failures.push(`git proxy route missing ${token}`);
}
for (const token of ['orgResourceCollectionMatch', 'orgRepositoryCollectionMatch', 'orgNamespaceName', 'createKubernetesResourceGateway', 'scopedController.listResource', 'scopedController.getResource', 'scopedController.applyResource', 'scopedController.deleteResource']) {
  if (!files['src/http-server.js'].includes(token)) failures.push(`http controller missing ${token}`);
}
const pageContracts = {
  'apps/web/app/orgs/[org]/controller-api/page.jsx': 'ControllerApiPage',
  'apps/web/app/orgs/[org]/repositories/page.jsx': 'RepositoriesPage',
  'apps/web/app/orgs/[org]/inbox/page.jsx': 'InboxPage',
  'apps/web/app/orgs/[org]/runs/page.jsx': 'RunsPage',
  'apps/web/app/orgs/[org]/runners-ci/page.jsx': 'RunnersCiPage',
  'apps/web/app/orgs/[org]/hooks-events/page.jsx': 'HooksEventsPage',
  'apps/web/app/orgs/[org]/insights/page.jsx': 'InsightsPage',
  'apps/web/app/orgs/[org]/operations-install/page.jsx': 'OperationsInstallPage',
  'apps/web/app/orgs/[org]/advanced-plans/page.jsx': 'AdvancedPlansPage',
  'apps/web/app/orgs/[org]/people/page.jsx': 'PeoplePage',
  'apps/web/app/login/page.jsx': 'LoginPage',
  'apps/web/app/logout/page.jsx': 'LogoutPage',
  'apps/web/app/orgs/[org]/repositories/[repo]/code/page.jsx': 'RepositoryCodePage',
  'apps/web/app/orgs/[org]/repositories/[repo]/pull-requests/page.jsx': 'RepositoryPullRequestsPage',
  'apps/web/app/orgs/[org]/repositories/[repo]/issues/page.jsx': 'RepositoryIssuesPage',
  'apps/web/app/orgs/[org]/repositories/[repo]/issues/[issue]/page.jsx': 'RepositoryIssueDetailPage',
  'apps/web/app/orgs/[org]/agents/projects/[projectId]/issues/page.jsx': 'ProjectIssuesPage',
  'apps/web/app/orgs/[org]/agents/projects/[projectId]/issues/[issue]/page.jsx': 'ProjectIssueDetailPage',
  'apps/web/app/orgs/[org]/repositories/[repo]/runs/page.jsx': 'RepositoryRunsPage',
  'apps/web/app/orgs/[org]/repositories/[repo]/hooks/page.jsx': 'RepositoryHooksPage',
  'apps/web/app/orgs/[org]/repositories/[repo]/settings/page.jsx': 'RepositorySettingsPage'
};
for (const file of Object.keys(pageContracts)) {
  files[file] = readFileSync(resolveRequiredFile(file), 'utf8');
}
for (const [file, component] of Object.entries(pageContracts)) {
  if (!files[file].includes(component)) failures.push(`${file} does not use dedicated ${component} route component`);
}
if (required.some((file) => file.includes('/pipelines') && !file.includes('/api/'))) failures.push('legacy pipelines route is still required');
for (const token of ['KrateProject', 'issues', 'issueSync', 'issueRepositoryRefs', 'issueProjectRefs']) {
  if (!files['src/controller-ui.js'].includes(token)) failures.push(`controller UI issue scoping missing ${token}`);
}
for (const token of ['giteaIssueSyncPlan', 'githubProjectIssueSyncPlan', 'orgMemoryRepositoryName', 'ensureOrgMemoryRepository', 'writeIssueRepositoryMetadata']) {
  if (!files['src/gitea-backend.js'].includes(token)) failures.push(`backend issue sync plan missing ${token}`);
}
for (const [file, token] of [['../charts/crds/agent-resources.yaml', 'repositoryRefs'], ['../charts/crds/aggregated-resources.yaml', 'repositoryRefs'], ['../sdk/src/index.js', 'issueRepositoryRefs'], ['apps/web/app/api/orgs/[org]/resources/[kind]/[name]/route.js', 'PATCH'], ['apps/web/app/api/orgs/[org]/resources/[kind]/[name]/route.js', 'applyResourceForOrg'], ['apps/web/app/components/issue-editor.jsx', 'IssueCreateForm'], ['apps/web/app/components/issue-editor.jsx', 'IssueEditor'], ['apps/web/app/components/issue-editor.jsx', 'Create scoped issue'], ['apps/web/app/components/issue-editor.jsx', 'Add comment']]) {
  if (!files[file].includes(token)) failures.push(`${file} missing project issue scoping token ${token}`);
}

for (const token of ['ControllerApiPage', 'RepositoriesPage', 'InboxPage', 'RunsPage', 'RunnersCiPage', 'HooksEventsPage', 'InsightsPage', 'OperationsInstallPage', 'AdvancedPlansPage', 'PeoplePage', 'LoginPage', 'LogoutPage', 'RepositoryCodePage', 'RepositoryPullRequestsPage', 'RepositoryIssuesPage', 'RepositoryIssueDetailPage', 'ProjectIssuesPage', 'ProjectIssueDetailPage', 'IssueScopePage', 'RepositoryRunsPage', 'RepositoryHooksPage', 'RepositorySettingsPage']) {
  if (!webUiSource().includes(token)) failures.push(`ui shell missing dedicated flow component ${token}`);
}
for (const token of ['IssueWorkspace', 'IssueCreateForm', 'IssueViewSwitcher', 'IssueDetailPage', 'IssueDetailView', 'IssueEditor', 'IssueComments', 'issuesForScope', 'issueRepositoryRefs', 'issueProjectRefs', 'Invite people', 'identity links', 'repository permissions', 'Access overview', 'Access readiness', 'Use workspace identity', 'Sign in to Krate', 'Repository home', 'Review inbox', 'Run debugger', 'Capacity designer', 'Automation inspector', 'Clone and refs', 'Repository settings map', 'Advanced architecture details', 'ResourceList', 'PlanCard', 'ForgeFlowRail', 'RepositoryCommandBar', 'breadcrumbs', 'Create → review → merge → deploy', 'Advanced resource details']) {
  if (!webUiSource().includes(token)) failures.push(`ui shell missing forge UX affordance ${token}`);
}

const model = createControllerUiModel({
  source: 'kubernetes',
  namespace: 'krate-org-default',
  generatedAt: 'test-time',
  correlationId: 'validation',
  kubectl: { available: true, context: 'kind-krate', clientVersion: 'v1.test', errors: [] },
  apiService: { metadata: { name: 'v1alpha1.krate.a5c.ai' } },
  crds: [{ metadata: { name: 'repositories.krate.a5c.ai' } }],
  storage: { etcd: 'etcd', postgres: 'postgres', repositories: 'rwx', objects: 'object' },
  commands: [],
  permissions: [],
  events: [],
  resources: {
    Organization: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'Organization', metadata: { name: 'default', namespace: 'krate-system' }, spec: { slug: 'default', namespaceName: 'krate-org-default', displayName: 'Default org' } }],
    Repository: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'Repository', metadata: { name: 'live-repo', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', visibility: 'internal', defaultBranch: 'main' }, status: { phase: 'Ready' } }],
    KrateProject: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'KrateProject', metadata: { name: 'default-project', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', displayName: 'Default project', repositories: ['live-repo'] }, status: { phase: 'Ready' } }],
    Issue: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'Issue', metadata: { name: 'issue-live', namespace: 'krate-org-default', annotations: { 'krate.a5c.ai/repositories': 'live-repo' } }, spec: { organizationRef: 'default', project: 'default-project', title: 'Scoped issue', repositoryRefs: [{ name: 'live-repo' }] }, status: { phase: 'Open', comments: [{ author: 'alice', body: 'linked to live repo' }] } }],
    User: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'User', metadata: { name: 'alice', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', email: 'alice@example.com', username: 'alice' }, status: { phase: 'Active' } }],
    RepositoryPermission: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'RepositoryPermission', metadata: { name: 'live-repo-alice', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', repository: 'live-repo', subject: 'alice', subjectKind: 'user', permission: 'write' }, status: { phase: 'Synced' } }],
    SSHKey: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'SSHKey', metadata: { name: 'alice-laptop', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', owner: 'alice', title: 'laptop', scope: 'user', key: 'ssh-ed25519 AAAA' }, status: { phase: 'Synced' } }],
    PolicyProfile: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'PolicyProfile', metadata: { name: 'default-profile', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', displayName: 'Default profile', mode: 'audit' }, status: { phase: 'Ready' } }],
    PolicyTemplate: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'PolicyTemplate', metadata: { name: 'require-pr-description', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', displayName: 'Require PR description', targetKinds: ['PullRequest'], kyverno: { kind: 'ValidatingPolicy' } }, status: { phase: 'Ready' } }],
    PolicyBinding: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'PolicyBinding', metadata: { name: 'require-pr-description-audit', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', templateRef: 'require-pr-description', mode: 'audit' }, status: { phase: 'Bound' } }],
    PolicyExceptionRequest: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'PolicyExceptionRequest', metadata: { name: 'temporary-bypass', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', policyRef: { name: 'require-pr-description' }, justification: 'migration window', expiresAt: '2026-06-01T00:00:00Z' }, status: { phase: 'Requested' } }],
    PullRequest: [],
    Pipeline: [],
    RunnerPool: [],
    WebhookSubscription: []
  },
  kyverno: {
    enabled: true,
    detected: true,
    mode: 'byo',
    namespace: 'kyverno',
    policyNamespace: 'krate-system',
    health: 'ready',
    degraded: [],
    reports: {
      policyReports: [{ metadata: { name: 'repo-policy', namespace: 'krate-org-default' }, results: [{ policy: 'require-pr-description', rule: 'description', result: 'fail', message: 'description required', resources: [{ kind: 'PullRequest', name: 'pr-1' }] }] }],
      clusterPolicyReports: [],
      results: [{ report: 'repo-policy', namespace: 'krate-org-default', policy: 'require-pr-description', rule: 'description', result: 'fail', message: 'description required', resource: { kind: 'PullRequest', name: 'pr-1' } }],
      violations: [{ report: 'repo-policy', namespace: 'krate-org-default', policy: 'require-pr-description', rule: 'description', result: 'fail', message: 'description required', resource: { kind: 'PullRequest', name: 'pr-1' } }]
    },
    resources: { PolicyReport: [], ClusterPolicyReport: [], KyvernoPolicyException: [] }
  }
});
if (model.controller.mode !== 'krate-workspace') failures.push('controller mode is not krate-workspace');
if (model.status !== 'ready') failures.push('model did not become ready for available Krate snapshot');
if (!model.resources.find((resource) => resource.kind === 'User')) failures.push('model missing User identity resource');
if (!model.identity || typeof model.identity.counts?.users !== 'number') failures.push('model missing identity admin projection');
if (model.identity.counts.sshKeys !== 1) failures.push('model missing SSH key identity projection');
if (!model.identity.reconciliation?.statuses?.some((status) => status.kind === 'SSHKey' && status.phase === 'Synced')) failures.push('model missing identity reconciliation projection');
if (!model.resources.find((resource) => resource.kind === 'Repository')?.action?.list?.includes('Open Repository records')) failures.push('repository model missing Krate action list command');
if (!model.controller.endpoints.some((endpoint) => endpoint.method === 'GET' && endpoint.path === '/api/orgs/:org/resources')) failures.push('model missing resource list endpoint');
if (!model.controller.endpoints.some((endpoint) => endpoint.method === 'POST' && endpoint.path === '/api/orgs/:org/resources')) failures.push('model missing resource apply endpoint');
if (!model.controller.endpoints.some((endpoint) => endpoint.method === 'GET' && endpoint.path === '/api/orgs/:org/policies')) failures.push('model missing policy center endpoint');
if (!model.controller.endpoints.some((endpoint) => endpoint.method === 'GET' && endpoint.path === '/api/orgs/:org/policy-exception-requests')) failures.push('model missing policy exception list endpoint');
if (model.controller.architecture?.apiController?.role !== 'krate-api-controller') failures.push('model missing API controller architecture boundary');
if (model.controller.architecture?.resourceGateway?.role !== 'krate-resource-gateway') failures.push('model missing resource gateway architecture boundary');
if (model.controller.architecture?.resourceClient?.role !== 'krate-resource-client') failures.push('model missing Krate client architecture boundary');
if (model.controller.architecture?.deliveryReconciler?.role !== 'krate-delivery-reconciler') failures.push('model missing delivery reconciler architecture boundary');
if (!model.controller.architecture?.apiController?.delegatesTo?.includes('krate-resource-gateway')) failures.push('API controller does not delegate to resource gateway');
if (model.resources.find((resource) => resource.kind === 'Repository')?.items?.[0]?.metadata?.name !== 'live-repo') failures.push('repository model missing live items');
if (model.resources.find((resource) => resource.kind === 'KrateProject')?.count !== 1) failures.push('project model missing live KrateProject items');
if (model.resources.find((resource) => resource.kind === 'Issue')?.count !== 1) failures.push('issue model missing live issue items');
if (model.views.dashboard.issueSync?.gitea?.repo !== '_default_') failures.push('issue sync view missing org memory repository');
if (!model.validation.some((item) => item.evidence.includes('/api/orgs/:org/repositories'))) failures.push('validation missing repository management evidence');
if (model.policyEngine.health !== 'ready') failures.push('policy engine did not project ready Kyverno health');
if (model.policyEngine.violations.length !== 1) failures.push('policy engine did not normalize Kyverno violations');
if (!model.policyEngine.exceptionRequests.some((request) => request.name === 'temporary-bypass')) failures.push('policy engine missing exception request projection');
const emptyModel = createControllerUiModel({ source: 'kubernetes', namespace: 'krate-org-default', kubectl: { available: true, context: 'kind-krate', errors: [] }, apiService: { metadata: { name: 'v1alpha1.krate.a5c.ai' } }, crds: [{ metadata: { name: 'repositories.krate.a5c.ai' } }], resources: { Repository: [] }, commands: [], events: [], permissions: [], storage: {} });
if (emptyModel.resources.find((resource) => resource.kind === 'Repository')?.yaml !== null) failures.push('empty Krate repository model synthesized plan');

if (failures.length) fail(failures);
console.log(JSON.stringify({
  status: 'success',
  checked: required,
  contract: 'krate-task-led-controller-ui',
  resources: model.metrics.resources,
  endpoints: model.controller.endpoints.length,
  validations: model.metrics.totalChecks
}, null, 2));

function fail(failures) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2));
  process.exit(1);
}
