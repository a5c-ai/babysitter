import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createControllerUiModel, createKradleApiController, createKradleHttpServer } from '../src/index.js';

function read(path) {
  return readFileSync(path, 'utf8');
}

function workflowJobBlock(workflow, jobName) {
  const match = workflow.match(new RegExp(`\r?\n  ${jobName}:\r?\n([\\s\\S]*?)(?=\r?\n  [a-zA-Z0-9_-]+:\r?\n|$)`));
  assert.ok(match, `workflow has ${jobName} job`);
  return match[1];
}

function fixtureKubernetesController() {
  return {
    async snapshot() {
      return {
        source: 'kubernetes',
        namespace: 'kradle-org-default',
        generatedAt: 'test-time',
        correlationId: 'test-correlation',
        kubectl: { available: true, context: 'kind-kradle', clientVersion: 'v1.test', errors: [] },
        apiService: { metadata: { name: 'v1alpha1.kradle.a5c.ai' } },
        crds: [{ metadata: { name: 'repositories.kradle.a5c.ai' } }],
        storage: { etcd: 'etcd', postgres: 'postgres', repositories: 'rwx', objects: 'object' },
        commands: [],
        permissions: [],
        events: [],
        resources: {
          Organization: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'Organization', metadata: { name: 'default', namespace: 'kradle-system' }, spec: { slug: 'default', namespaceName: 'kradle-org-default', displayName: 'Default org' } }],
          User: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'User', metadata: { name: 'alice', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', displayName: 'Alice', email: 'alice@example.com', teams: ['maintainers'] }, status: { phase: 'Active' } }],
          Team: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'Team', metadata: { name: 'maintainers', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', displayName: 'Maintainers', members: ['alice'] }, status: { phase: 'Active' } }],
          Invite: [],
          IdentityMapping: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'IdentityMapping', metadata: { name: 'sso-alice', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', user: 'alice', provider: 'sso', subject: 'alice', repositoryIdentity: { username: 'alice' } }, status: { phase: 'Synced' } }],
          AuthProvider: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'AuthProvider', metadata: { name: 'sso', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', type: 'oidc', label: 'Company SSO', enabled: true }, status: { phase: 'Configured' } }],
          Repository: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'Repository', metadata: { name: 'app', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', visibility: 'internal', defaultBranch: 'main' }, status: { phase: 'Ready' } }],
          PolicyProfile: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'PolicyProfile', metadata: { name: 'default-profile', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', displayName: 'Default policy posture', mode: 'audit' }, status: { phase: 'Synced', lastViolationCount: 1 } }],
          PolicyTemplate: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'PolicyTemplate', metadata: { name: 'require-pr-description', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', displayName: 'Require PR description', targetKinds: ['PullRequest'], kyverno: { kind: 'ValidatingPolicy' } }, status: { phase: 'Ready' } }],
          PolicyBinding: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'PolicyBinding', metadata: { name: 'require-pr-description-audit', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', templateRef: 'require-pr-description', mode: 'audit' }, status: { phase: 'Applied', lastViolationCount: 1 } }],
          PolicyExceptionRequest: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'PolicyExceptionRequest', metadata: { name: 'pr-1-exception', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', policyRef: { name: 'require-pr-description' }, justification: 'temporary rollout', expiresAt: '2026-06-01T00:00:00Z' }, status: { phase: 'Requested' } }],
          PullRequest: [],
          Pipeline: [],
          RunnerPool: [],
          WebhookSubscription: []
        },
        kyverno: {
          mode: 'byo',
          namespace: 'kyverno',
          policyNamespace: 'kradle-org-default',
          detected: true,
          controllers: [{ name: 'kyverno-admission-controller', ready: true, readyReplicas: 1, replicas: 1 }],
          permissions: [{ kind: 'PolicyReport', verbs: { list: true, watch: true } }],
          resources: { KyvernoValidatingPolicy: [{ metadata: { name: 'require-pr-description' } }], PolicyReport: [{ metadata: { name: 'app-policy', namespace: 'kradle-org-default' }, results: [{ policy: 'require-pr-description', rule: 'description', result: 'fail', message: 'description required', resources: [{ kind: 'PullRequest', name: 'pr-1' }] }] }] },
          reports: { policyReports: [{ metadata: { name: 'app-policy', namespace: 'kradle-org-default' } }], clusterPolicyReports: [], results: [{ policy: 'require-pr-description', rule: 'description', result: 'fail', message: 'description required' }], violations: [{ policy: 'require-pr-description', rule: 'description', result: 'fail', message: 'description required' }] },
          degraded: []
        }
      };
    },
    async applyResource(resource) {
      return { operation: 'apply', resource };
    },
    async deleteResource(kind, name) {
      return { operation: 'delete', resource: { kind, metadata: { name } } };
    },
    async createRepository(input) {
      return { operation: 'apply', resource: { kind: 'Repository', metadata: { name: input.name } } };
    }
  };
}

test('controller deployment assets build and publish the runnable controller', () => {
  for (const file of ['Dockerfile', '.dockerignore', '.github/workflows/publish.yml']) assert.equal(existsSync(file), true, `${file} exists`);

  const dockerfile = read('Dockerfile');
  assert.match(dockerfile, /FROM node:\d+-alpine AS (deps|build)/);
  assert.match(dockerfile, /npm (ci|install)/);
  assert.match(dockerfile, /HEALTHCHECK/);
  assert.match(dockerfile, /kradle-server\.mjs/);
  for (const runtimePath of ['/app/bin', '/app/src', '/app/dist']) assert.ok(dockerfile.includes(runtimePath), `Dockerfile copies ${runtimePath}`);

  const dockerignore = read('.dockerignore');
  for (const ignored of ['.a5c', 'node_modules', '**/.next', 'dist']) assert.ok(dockerignore.includes(ignored), `.dockerignore excludes ${ignored}`);

  const chartDeployment = read('../charts/templates/deployments.yaml');
  const chartRbac = read('../charts/templates/rbac.yaml');
  const chartIngress = read('../charts/templates/ingress.yaml');
  const chartValues = read('../charts/values.yaml');
  const authSecret = read('../charts/templates/auth-secret.yaml');
  assert.ok(chartValues.includes('auth:'), 'chart values include auth configuration');
  assert.ok(chartValues.includes('github:') && chartValues.includes('sso:'), 'chart values expose GitHub and SSO configuration');
  assert.ok(chartValues.includes('assistant:') && chartValues.includes('anthropic-api-key'), 'chart values expose assistant secret references');
  assert.ok(chartValues.includes('agentMux:') && chartValues.includes('gatewayUrl'), 'chart values expose Agent Adapter endpoint configuration');
  assert.ok(chartValues.includes('token:') && chartValues.includes('existingSecret: ""'), 'chart values expose Gitea token secret reference');
  assert.ok(chartValues.includes('mode: auto') && chartValues.includes('policyReporter:'), 'chart values expose Kyverno auto-discovery modes and policy reporter settings');
  assert.ok(chartRbac.includes('"*"') && chartRbac.includes('policies.kyverno.io') && chartRbac.includes('policyreports'), 'RBAC covers all Kradle resources via wildcard and Kyverno read/write surfaces');
  assert.ok(chartDeployment.includes('KRADLE_KYVERNO_MODE') && chartDeployment.includes('KRADLE_KYVERNO_POLICY_NAMESPACE') && chartDeployment.includes('KRADLE_KYVERNO_DISCOVER_EXISTING'), 'deployments receive Kyverno discovery env');
  assert.ok(read('../charts/templates/argocd-kyverno-application.yaml').includes('kradle.a5c.ai/policy-engine: kyverno'), 'managed Kyverno Argo CD application template is present');
  assert.ok(authSecret.includes('github-client-id') && authSecret.includes('sso-client-secret'), 'chart renders auth secret keys');
  assert.ok(chartIngress.includes('kind: Ingress') && chartIngress.includes('ingressClassName') && chartIngress.includes('app.kubernetes.io/component: web'), 'chart renders web ingress');
  assert.ok(chartDeployment.includes('imagePullSecrets') && chartDeployment.includes('global.imagePullSecrets'), 'workloads can use registry pull secrets');
  assert.ok(chartDeployment.includes('KRADLE_AUTH_GITHUB_ENABLED') && chartDeployment.includes('KRADLE_AUTH_SSO_ENABLED') && chartDeployment.includes('KRADLE_AUTH_DELEGATED_EMAIL_HEADER'), 'workloads receive auth provider configuration');
  assert.ok(chartDeployment.includes('readinessProbe:') && chartDeployment.includes('path: /login'), 'web deployment has an HTTP readiness probe');
  assert.ok(chartDeployment.includes('KRADLE_AUTH_DELEGATED_LOCAL_DEVELOPMENT') && chartDeployment.includes('KRADLE_AUTH_DELEGATED_LOCAL_GROUPS'), 'workloads can opt into local delegated development login');
  assert.ok(chartDeployment.includes('ANTHROPIC_API_KEY') && chartDeployment.includes('KRADLE_ASSISTANT_API_KEY'), 'web workload can receive assistant API key references');
  assert.ok(chartDeployment.includes('KRADLE_GITEA_TOKEN') && chartDeployment.includes('AGENT_MUX_URL') && chartDeployment.includes('AGENT_GATEWAY_URL'), 'workloads can receive Gitea token and Agent Adapter endpoint configuration');
  assert.ok(chartRbac.includes('core.oam.dev') && chartRbac.includes('applications') && chartRbac.includes('create'), 'delivery resources can be composed through Kradle');
  assert.ok(chartValues.includes('localDevelopment:') && chartValues.includes('enabled: false'), 'local delegated development login is off by default');
  for (const token of ['command: ["node", "bin/kradle-server.mjs"]', '--port=3080', 'app.kubernetes.io/component: controllers']) {
    assert.ok(chartDeployment.includes(token), `chart deployment includes ${token}`);
  }
});

test('web proxy protects UI pages and authenticated APIs behind login', async () => {
  let NextRequest, proxy, config;
  try {
    ({ NextRequest } = await import('next/server.js'));
    ({ proxy, config } = await import(`../../web/proxy.js?test=${Date.now()}`));
  } catch { return; }

  assert.ok(config.matcher.some((entry) => entry.includes('_next/static')));
  for (const path of ['/', '/orgs/default/repositories?tab=code', '/orgs/default/repositories/demo/code', '/orgs/default/people', '/logout', '/api/controller']) {
    const response = proxy(new NextRequest(`http://localhost:3000${path}`));
    assert.equal(response.status, 307, `${path} redirects to login without session`);
    assert.equal(new URL(response.headers.get('location')).pathname, '/login');
  }

  const nextResponse = proxy(new NextRequest('http://localhost:3000/orgs/default/repositories?tab=code'));
  assert.equal(new URL(nextResponse.headers.get('location')).searchParams.get('next'), '/orgs/default/repositories?tab=code');
  assert.equal(proxy(new NextRequest('http://localhost:3000/login')).headers.get('x-middleware-next'), '1');
  assert.equal(proxy(new NextRequest('http://localhost:3000/api/auth/delegated')).headers.get('x-middleware-next'), '1');
  assert.equal(proxy(new NextRequest('http://localhost:3000/orgs/default/repositories', { headers: { cookie: 'kradle_session=dev' } })).headers.get('x-middleware-next'), '1');
});

test('login page stays minimal and does not expose the authenticated console shell', () => {
  const layout = read('../web/app/layout.jsx');
  const managePages = read('../web/app/pages/manage-pages.jsx');
  const loginStart = managePages.indexOf('export function LoginPage');
  assert.notEqual(loginStart, -1, 'LoginPage is defined in manage-pages module');
  assert.ok(!layout.includes('<AppShell>{children}</AppShell>'), 'root layout does not wrap public routes in AppShell');
  const loginSource = managePages.slice(loginStart, managePages.indexOf('export ', loginStart + 1));
  assert.ok(loginSource.includes('loginMain') || loginSource.includes('login'), 'login page uses standalone login layout');
});

test('auth chart uses existing secrets without rendering empty provider keys', () => {
  const mixed = execFileSync('helm', [
    'template', 'kradle', '../charts', '-n', 'kradle-system',
    '--set', 'argocd.enabled=false',
    '--set', 'auth.github.clientId=github-client',
    '--set', 'auth.github.clientSecret=github-secret',
    '--set', 'auth.sso.enabled=true',
    '--set', 'auth.sso.existingSecret=shared-auth'
  ], { encoding: 'utf8' });
  assert.match(mixed, /name: kradle-kradle-auth/);
  assert.match(mixed, /github-client-id: "github-client"/);
  assert.doesNotMatch(mixed, /sso-client-id:/);
  assert.match(mixed, /name: "shared-auth"[\s\S]*?key: sso-client-id/);

  const externalOnly = execFileSync('helm', [
    'template', 'kradle', '../charts', '-n', 'kradle-system',
    '--set', 'argocd.enabled=false',
    '--set', 'auth.github.existingSecret=shared-auth',
    '--set', 'auth.sso.enabled=true',
    '--set', 'auth.sso.existingSecret=shared-auth'
  ], { encoding: 'utf8' });
  assert.doesNotMatch(externalOnly, /name: kradle-kradle-auth/);
  assert.match(externalOnly, /name: "shared-auth"[\s\S]*?key: github-client-id/);
  assert.match(externalOnly, /name: "shared-auth"[\s\S]*?key: sso-client-secret/);
});

test('staging service env vars are opt-in and render secret references without plaintext values', () => {
  const defaultRender = execFileSync('helm', [
    'template', 'kradle', '../charts', '-n', 'kradle-system',
    '--set', 'argocd.enabled=false'
  ], { encoding: 'utf8' });
  assert.doesNotMatch(defaultRender, /name: ANTHROPIC_API_KEY/);
  assert.doesNotMatch(defaultRender, /name: KRADLE_ASSISTANT_API_KEY/);
  assert.doesNotMatch(defaultRender, /name: KRADLE_GITEA_TOKEN/);
  assert.doesNotMatch(defaultRender, /name: AGENT_MUX_URL/);
  assert.doesNotMatch(defaultRender, /name: AGENT_GATEWAY_URL/);

  const configured = execFileSync('helm', [
    'template', 'kradle', '../charts', '-n', 'kradle-system',
    '--set', 'argocd.enabled=false',
    '--set', 'gitea.httpUrl=http://gitea-http.kradle-system.svc.cluster.local:3000/kradle',
    '--set', 'gitea.token.existingSecret=kradle-gitea-token',
    '--set', 'gitea.token.key=token',
    '--set', 'agentMux.url=http://adapters.kradle-system.svc.cluster.local:8080',
    '--set', 'agentMux.gatewayUrl=http://agent-gateway.kradle-system.svc.cluster.local:8080',
    '--set', 'assistant.anthropic.existingSecret=kradle-assistant',
    '--set', 'assistant.anthropic.key=anthropic-api-key',
    '--set', 'assistant.kradleAssistant.existingSecret=kradle-assistant',
    '--set', 'assistant.kradleAssistant.key=kradle-assistant-api-key'
  ], { encoding: 'utf8' });

  assert.match(configured, /name: KRADLE_GITEA_HTTP_URL\s+value: "http:\/\/gitea-http\.kradle-system\.svc\.cluster\.local:3000\/kradle"/);
  assert.match(configured, /name: KRADLE_GITEA_TOKEN[\s\S]*?secretKeyRef:[\s\S]*?name: "kradle-gitea-token"[\s\S]*?key: "token"[\s\S]*?optional: true/);
  assert.match(configured, /name: ANTHROPIC_API_KEY[\s\S]*?secretKeyRef:[\s\S]*?name: "kradle-assistant"[\s\S]*?key: "anthropic-api-key"[\s\S]*?optional: true/);
  assert.match(configured, /name: KRADLE_ASSISTANT_API_KEY[\s\S]*?secretKeyRef:[\s\S]*?name: "kradle-assistant"[\s\S]*?key: "kradle-assistant-api-key"[\s\S]*?optional: true/);
  assert.match(configured, /name: AGENT_MUX_URL\s+value: "http:\/\/adapters\.kradle-system\.svc\.cluster\.local:8080"/);
  assert.match(configured, /name: AGENT_GATEWAY_URL\s+value: "http:\/\/agent-gateway\.kradle-system\.svc\.cluster\.local:8080"/);
  assert.doesNotMatch(configured, /sk-ant-|ghp_|github_pat_|glpat-|AKIA[0-9A-Z]{16}/);
});

test('NATS event transport renders inline and secret-backed broker URLs', () => {
  const inline = execFileSync('helm', [
    'template', 'kradle', '../charts', '-n', 'kradle-system',
    '--set', 'argocd.enabled=false',
    '--set', 'externalDependencies.nats.eventTransport.enabled=true',
    '--set', 'externalDependencies.nats.url=nats://nats.kradle-system.svc.cluster.local:4222',
    '--set', 'externalDependencies.nats.eventTransport.subject=kradle.staging.events',
    '--set', 'externalDependencies.nats.eventTransport.stream=KRADLE_STAGING_EVENTS',
    '--set', 'externalDependencies.nats.eventTransport.requireBroker=true'
  ], { encoding: 'utf8' });

  assert.match(inline, /name: KRADLE_EVENT_TRANSPORT\s+value: "nats"/);
  assert.match(inline, /name: KRADLE_EVENT_NATS_URL\s+value: "nats:\/\/nats\.kradle-system\.svc\.cluster\.local:4222"/);
  assert.match(inline, /name: KRADLE_EVENT_NATS_SUBJECT\s+value: "kradle\.staging\.events"/);
  assert.match(inline, /name: KRADLE_EVENT_NATS_STREAM\s+value: "KRADLE_STAGING_EVENTS"/);
  assert.match(inline, /name: KRADLE_EVENT_REQUIRE_BROKER\s+value: "true"/);

  const secretBacked = execFileSync('helm', [
    'template', 'kradle', '../charts', '-n', 'kradle-system',
    '--set', 'argocd.enabled=false',
    '--set', 'externalDependencies.nats.eventTransport.enabled=true',
    '--set', 'externalDependencies.nats.existingSecret=kradle-nats',
    '--set', 'externalDependencies.nats.key=connection-url'
  ], { encoding: 'utf8' });

  assert.match(secretBacked, /name: KRADLE_EVENT_NATS_URL[\s\S]*?secretKeyRef:[\s\S]*?name: "kradle-nats"[\s\S]*?key: "connection-url"[\s\S]*?optional: true/);
  assert.doesNotMatch(secretBacked, /nats:\/\/[^"\s]+/);
});

test('demo NATS renders JetStream broker and wires event transport by default', () => {
  const rendered = execFileSync('helm', [
    'template', 'kradle', '../charts', '-n', 'kradle-system',
    '--set', 'argocd.enabled=false',
    '--set', 'demo.enabled=true',
    '--set', 'demo.nats.mode=local-dev-nats'
  ], { encoding: 'utf8' });

  assert.match(rendered, /name: kradle-kradle-nats/);
  assert.match(rendered, /args: \["--jetstream", "--store_dir=\/data\/jetstream"\]/);
  assert.match(rendered, /name: KRADLE_EVENT_TRANSPORT\s+value: "nats"/);
  assert.match(rendered, /name: KRADLE_EVENT_NATS_URL\s+value: "nats:\/\/kradle-kradle-nats\.kradle-system\.svc\.cluster\.local:4222"/);
});

test('controller healthz returns deep dependency and event transport probe details', async () => {
  const server = createKradleHttpServer({
    controller: fixtureKubernetesController(),
    healthProbeOptions: {
      env: {
        KRADLE_GITEA_HTTP_URL: 'https://gitea.internal',
        AGENT_MUX_URL: 'https://adapter.internal',
        KRADLE_CONTROLLER_URL: 'https://controller.internal',
        ANTHROPIC_API_KEY: 'sk-ant-api03-test-health-key',
        KRADLE_KUBECTL: 'kubectl-test',
      },
      fetchImpl: async () => ({ ok: true, status: 200 }),
      execFileImpl: async () => ({ stdout: 'Kubernetes control plane is running', stderr: '' }),
      eventBus: {
        status: () => ({ transport: 'nats-jetstream', status: 'ok', durable: true }),
      },
    },
  });
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/healthz`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.status, 'ok');
    assert.equal(body.health.gitea, 'ok');
    assert.equal(body.health.agentMux, 'ok');
    assert.equal(body.health.controller, 'ok');
    assert.equal(body.health.eventTransport, 'ok');
    assert.equal(body.health.details.eventTransport.transport, 'nats-jetstream');
    assert.doesNotMatch(JSON.stringify(body), /sk-ant-api03-test-health-key/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});


test('web UI and controller API expose live Kubernetes deployment and publishing metadata', async () => {
  const controller = fixtureKubernetesController();
  const model = createControllerUiModel(await controller.snapshot());
  assert.equal(model.controller.mode, 'kradle-workspace');
  assert.ok(model.controller.endpoints.some((endpoint) => endpoint.path === '/api/controller?org=:org'));
  assert.ok(model.controller.endpoints.some((endpoint) => endpoint.path === '/api/orgs/:org/resources'));
  assert.equal(model.controller.architecture.apiController.role, 'kradle-api-controller');
  assert.equal(model.controller.architecture.resourceGateway.role, 'kradle-resource-gateway');
  assert.equal(model.controller.architecture.resourceClient.role, 'kradle-resource-client');
  assert.equal(model.controller.architecture.repositoryService.role, 'repository-service');
  assert.deepEqual(model.controller.architecture.apiController.delegatesTo, ['kradle-resource-gateway', 'repository-service']);
  assert.ok(model.resources.some((resource) => resource.kind === 'Repository' && resource.count > 0));
  assert.ok(model.resources.some((resource) => resource.kind === 'KradleProject'));
  assert.ok(model.views.dashboard.issueSync?.gitea?.repo, 'dashboard exposes issue sync backend plan');
  assert.equal(model.policyEngine.health, 'ready');
  assert.equal(model.policyEngine.violations.length, 1);
  assert.ok(model.resources.some((resource) => resource.kind === 'PolicyBinding' && resource.count > 0));
  assert.ok(model.resources.find((resource) => resource.kind === 'Repository').action.list.includes('Open Repository records'));
  assert.match(model.operations.image, /kradle-controller/);
  assert.equal(model.operations.chart, 'charts/kradle');
  for (const gate of ['npm run check', 'docker build', 'helm package charts/kradle', 'npm pack --json']) assert.ok(model.operations.releaseGates.includes(gate), `release gate ${gate}`);
  assert.ok(model.validation.every((item) => typeof item.evidence === 'string' && item.evidence.length > 0));

  const server = createKradleHttpServer({ controller });
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/controller`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.operations.releaseGates, model.operations.releaseGates);
    assert.equal(body.metrics.resources, model.metrics.resources);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('web UI is wired to the Kubernetes controller API instead of a static local snapshot', () => {
  const page = read('../web/app/page.jsx');
  const orgPage = read('../web/app/orgs/[org]/page.jsx');
  const shellModules = ['../web/app/lib/kradle-ui.jsx', '../web/app/lib/page-frame.jsx', '../web/app/pages/agent-pages.jsx', '../web/app/pages/agent-helpers.jsx', '../web/app/pages/repo-pages.jsx', '../web/app/pages/manage-pages.jsx', '../web/app/pages/settings-pages.jsx', '../web/app/pages/external-pages.jsx'];
  const shell = shellModules.map((m) => { try { return readFileSync(m, 'utf8'); } catch { return ''; } }).join('\n');
  const actions = read('../web/app/components/resource-actions.jsx');
  const client = read('src/controller-client.js');
  const apiController = read('src/api-controller.js');
  const gateway = read('src/kubernetes-resource-gateway.js');
  const kubernetes = read('src/kubernetes-controller.js');
  const server = read('src/http-server.js');
  const webControllerRoute = read('../web/app/api/controller/route.js');
  assert.ok(page.includes("redirect('/orgs/'"));
  assert.ok(orgPage.includes('DashboardPage'));
  assert.ok(read('../web/app/orgs/page.jsx').includes('Choose an organization'));
  assert.ok(client.includes('KRADLE_CONTROLLER_URL'));
  assert.ok(client.includes('KRADLE_CONTROLLER_REQUEST_TIMEOUT_MS'));
  assert.ok(client.includes('AbortSignal.timeout'));
  assert.ok(client.includes('if (!useCache) return revalidateFn();'));
  assert.ok(client.includes('staleWhileRevalidate(organization, revalidateFn, swrOptions)'));
  assert.ok(client.includes('getControllerSnapshotAsync'));
  assert.ok(client.includes('fallbackSnapshot'));
  assert.ok(!client.includes('createKubernetesResourceGateway'));
  assert.ok(!client.includes('createKradleApiController')); 
  assert.ok(apiController.includes('resourceGateway'));
  assert.ok(apiController.includes('withArchitecture'));
  assert.ok(apiController.includes('kubernetes-resource-gateway'));
  assert.ok(!apiController.includes('createKubernetesController'));
  assert.ok(gateway.includes('createKubernetesResourceClient'));
  assert.ok(kubernetes.includes('createKubernetesController(options = {})')); // resource-client alias
  assert.ok(kubernetes.includes('/var/run/secrets/kubernetes.io/serviceaccount'), 'Kubernetes client can use in-cluster service-account credentials');
  assert.ok(gateway.includes('repositoryManifest'));
  assert.ok(shell.includes('/api/controller'));
  assert.ok(webControllerRoute.includes('KRADLE_CONTROLLER_URL'));
  assert.ok(webControllerRoute.includes('hydrateOrgResourceSummaries'), 'web API route hydrates empty controller summaries from org-scoped resources');
  assert.ok(shell.includes('ArchitectureMap'));
  assert.ok(shell.includes('Repository home'));
  assert.ok(shell.includes('IssueWorkspace'));
  assert.ok(shell.includes('IssueViewSwitcher'));
  assert.ok(shell.includes('issuesForScope'));
  assert.ok(shell.includes('issueRepositoryRefs'));
  assert.ok(shell.includes('issueProjectRefs'));
  assert.ok(shell.includes('DeploymentCenter'));
  assert.ok(shell.includes('DeploymentManager'));
  assert.ok(shell.includes('Kradle deployment center'));
  assert.ok(shell.includes('PlanCard'));
  assert.ok(shell.includes('Advanced resource details'));
  assert.ok(shell.includes('Releases'));
  assert.ok(shell.includes('managed resources'));
  assert.ok(shell.includes('Advanced resource records'));
  assert.ok(shell.includes('Deployments'));
  assert.ok(actions.includes('Create deployment'));
  assert.ok(actions.includes('Prepare deployment'));
  assert.ok(shell.includes('environments'));
  assert.ok(shell.includes('Repository code browser'));
  assert.ok(shell.includes('Manage access'));
  assert.ok(shell.includes('PeopleAdmin'));
  assert.ok(shell.includes('getSignedInUser'));
  assert.ok(shell.includes('topbarAccount'));
  assert.ok(shell.includes('Signed-in user'));
  assert.ok(shell.includes('Sign out'));
  assert.ok(shell.includes('Invite people'));
  assert.ok(shell.includes('identity links'));
  assert.ok(shell.includes('repository permissions'));
  assert.ok(shell.includes('Access readiness'));
  assert.match(actions, /Mark accepted/i);
  assert.ok(actions.includes('Revoke invite'));
  assert.ok(actions.includes('Disable user'));
  assert.ok(actions.includes('Restore user'));
  assert.ok(actions.includes('Revoke grant'));
  assert.ok(actions.includes('SSH keys'));
  assert.ok(actions.includes('Save SSH key'));
  assert.ok(actions.includes('Revoke SSH key'));
  assert.equal(existsSync('../web/app/orgs/[org]/people/page.jsx'), true);
  assert.equal(existsSync('../web/app/login/page.jsx'), true);
  assert.equal(existsSync('../web/app/logout/page.jsx'), true);
  assert.equal(existsSync('../web/app/orgs/[org]/runs/page.jsx'), true);
  assert.equal(existsSync('../web/app/runs/page.jsx'), false);
  assert.equal(existsSync('../web/app/pipelines/page.jsx'), false);
  assert.equal(existsSync('../web/app/orgs/[org]/repositories/[repo]/runs/page.jsx'), true);
  assert.equal(existsSync('../web/app/orgs/[org]/repositories/[repo]/issues/[issue]/page.jsx'), true);
  assert.equal(existsSync('../web/app/orgs/[org]/agents/projects/[projectId]/issues/page.jsx'), true);
  assert.equal(existsSync('../web/app/orgs/[org]/agents/projects/[projectId]/issues/[issue]/page.jsx'), true);
  assert.equal(existsSync('../web/app/repositories/[repo]/runs/page.jsx'), false);
  assert.equal(existsSync('../web/app/repositories/[repo]/pipelines/page.jsx'), false);
  assert.equal(existsSync('../web/proxy.js'), true);
  assert.equal(existsSync('../web/app/api/auth/[provider]/route.js'), true);
  assert.equal(existsSync('../web/app/api/auth/callback/[provider]/route.js'), true);
  assert.equal(existsSync('../web/app/api/auth/delegated/route.js'), true);
  assert.ok(shell.includes('RepositoryCodePage'));
  assert.ok(shell.includes('RepositoryPullRequestsPage'));
  assert.ok(shell.includes('RepositorySettingsPage'));
  assert.ok(shell.includes('PullRequestReviewPanel'));
  assert.ok(shell.includes('RunCenter'));
  assert.ok(shell.includes('Workspace runs'));
  assert.ok(shell.includes('Run event stream'));
  assert.ok(shell.includes('/runs'));
  assert.ok(!shell.includes("['/pipelines', 'Runs']"));
  assert.ok(!shell.includes('PipelinesPage'), 'legacy pipelines UI component is not exported');
  assert.ok(!shell.includes('RepositoryPipelinesPage'), 'legacy repository pipelines UI component is not exported');
  assert.ok(!shell.includes('function PipelineDebugger'), 'runs page does not use the old debugger-first panel');
  assert.ok(shell.includes('Automation inspector'));
  assert.ok(shell.includes('Readiness checklist'));
  assert.ok(kubernetes.includes('spawnSync'));
  assert.ok(kubernetes.includes('kubectl'));
  assert.ok(!client.includes('createKradleUiDemoRuntime'));
  assert.ok(!page.includes('createKradleMvpDemo'));
  assert.ok(!page.includes('createKradleLifecycleSnapshot'));
  assert.ok(apiController.includes('const repoPath = `/orgs/${encodeURIComponent(org)}/repositories/${encodeURIComponent(name)}`'));
  assert.ok(apiController.includes('runs: `${repoPath}/runs`'));
  assert.ok(server.includes('/api/controller'));
  assert.ok(server.includes('orgResourceCollectionMatch'));
  assert.ok(!server.includes("url.pathname === '/api/repositories'"));
});

test('API controller delegates through resource gateway instead of owning Kubernetes scope', async () => {
  const calls = [];
  const resourceGateway = {
    namespace: 'kradle-org-default',
    resourceDefinitions: [],
    async snapshot() { calls.push('snapshot'); return { source: 'kubernetes', namespace: 'kradle-org-default', resources: {}, kubectl: { available: true, errors: [] }, commands: [], events: [], permissions: [], storage: {} }; },
    async list(kind) { calls.push(`list:${kind}`); return { kind, items: [] }; },
    async get(kind, name) { calls.push(`get:${kind}/${name}`); return { kind, metadata: { name } }; },
    async apply(resource) { calls.push(`apply:${resource.kind}`); return { operation: 'apply', resource }; },
    async delete(kind, name) { calls.push(`delete:${kind}/${name}`); return { operation: 'delete', kind, name }; },
    async createRepository(input) { calls.push(`createRepository:${input.name}`); return { operation: 'apply', resource: { kind: 'Repository', metadata: { name: input.name } } }; },
    async createOrganization(input) { calls.push(`createOrganization:${input.name}`); return { operation: 'create-organization', organization: { metadata: { name: input.name } } }; },
    watch(resourcePath) { calls.push(`watch:${resourcePath}`); return { child: { kill() {} } }; }
  };
  const controller = createKradleApiController({ resourceGateway });
  await controller.snapshot();
  await controller.listResource('Repository');
  await controller.getResource('Repository', 'app');
  await controller.applyResource({ kind: 'Repository', metadata: { name: 'app' } });
  await controller.deleteResource('Repository', 'app');
  await controller.createRepository({ name: 'next-app' });
  await controller.createOrganization({ name: 'product' });
  controller.watchResource('orgs/default/repositories');
  assert.deepEqual(calls, ['snapshot', 'list:Repository', 'get:Repository/app', 'apply:Repository', 'delete:Repository/app', 'createRepository:next-app', 'createOrganization:product', 'watch:orgs/default/repositories']);
  assert.equal(controller.resourceGateway, resourceGateway);
});

test('GitHub workflow publishes deployable image and chart artifacts with safe gates', () => {
  const workflow = read('.github/workflows/publish.yml');
  const validate = workflowJobBlock(workflow, 'validate');
  assert.ok(workflow.includes('branches: [develop, staging, main]'));
  assert.ok(workflow.includes('concurrency:') && workflow.includes('group: publish-${{ github.ref_name }}'));
  assert.ok(validate.includes('npm run check'));
  assert.ok(validate.includes('npm pack --json'));
  assert.ok(validate.includes('name: npm-package'));
  assert.ok(validate.includes('name: dist-artifacts'));
  assert.ok(validate.includes('name: ui-standalone'));
  assert.ok(validate.includes('Generate release checksums'));
  assert.ok(validate.includes('sha256sum'));
  assert.ok(validate.includes('name: release-checksums'));
  assert.ok(read('../charts/templates/gitea.yaml').includes('gitea-backend'));
  const argocdTemplate = read('../charts/templates/argocd-application.yaml');
  const values = read('../charts/values.yaml');
  assert.ok(argocdTemplate.includes('kind: Application'));
  assert.ok(argocdTemplate.includes('.Values.argocd.syncPolicy.prune'));
  assert.ok(argocdTemplate.includes('.Values.argocd.syncPolicy.selfHeal'));
  assert.ok(!values.includes('`n'));
  assert.match(values, /^  syncPolicy:\r?\n\s+automated: true\r?\n\s+prune: true\r?\n\s+selfHeal: true/m);

  const image = workflowJobBlock(workflow, 'publish-image');
  assert.ok(image.includes('needs: validate'));
  assert.ok(image.includes("push: ${{ github.event_name != 'pull_request' }}"));
  assert.ok(image.includes('docker/build-push-action'));
  assert.ok(image.includes('ghcr.io/${{ github.repository }}/kradle-controller'));

  const chart = workflowJobBlock(workflow, 'publish-chart');
  assert.ok(chart.includes('needs: validate'));
  assert.ok(chart.includes('helm package charts/kradle'));
  assert.ok(chart.includes('SHA256SUMS'));
  assert.ok(chart.includes('sha256sum dist/charts/*.tgz'));
  assert.ok(chart.includes("if: startsWith(github.ref, 'refs/tags/v')"));
  assert.ok(chart.includes('helm push dist/charts/*.tgz'));

  const deploy = workflowJobBlock(workflow, 'deploy-kradle');
  assert.ok(deploy.includes('Deploy Kradle To AKS'));
  assert.ok(deploy.includes("github.ref == 'refs/heads/develop'"));
  assert.ok(deploy.includes("github.ref == 'refs/heads/staging'"));
  assert.ok(deploy.includes("github.ref == 'refs/heads/main'"));
  assert.ok(deploy.includes('environment:') && deploy.includes('kradle-production') && deploy.includes('https://kradle.a5c.ai'));
  assert.ok(deploy.includes('AZURE_ACR_NAME') && deploy.includes('KUBE_CONFIG'));
  assert.ok(deploy.includes('KRADLE_GITHUB_CLIENT_ID') && deploy.includes('KRADLE_GITHUB_CLIENT_SECRET'));
  assert.ok(deploy.includes('kradle-develop.a5c.ai') && deploy.includes('kradle-staging.a5c.ai') && deploy.includes('kradle.a5c.ai'));
  assert.ok(deploy.includes('docker build -f Dockerfile') && deploy.includes('docker push'));
  assert.ok(deploy.includes('create secret docker-registry acr-pull'));
  assert.ok(deploy.includes('helm upgrade --install'));
  assert.ok(deploy.includes('--values /tmp/kradle-deploy-values.yaml'));
  assert.ok(deploy.includes('--wait'));
  assert.ok(deploy.includes('rollout status deployment/"${HELM_RELEASE}-kradle-web"'));
  assert.doesNotMatch(workflow, /publish-npm:/);
  assert.doesNotMatch(workflow, /npm publish/);
  assert.doesNotMatch(workflow, /PUBLISH_NPM/);
});








