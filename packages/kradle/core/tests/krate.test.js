import assert from 'node:assert/strict';
import test from 'node:test';
import { ControlPlane, GiteaGitService, GiteaRepositoryStore, RunnerScheduler, WebhookBus, createAdmissionPolicy, createAuthProviderConfig, buildAuthorizationRedirect, exchangeOAuthCodeForProfile, profileFromDelegatedHeaders, registerLoginProfile, createSessionCookie, parseSessionCookie, createInviteResource, createTeamResource, identityBackendSyncPlan, mapLoginProfileToKradleIdentity, createKradleApiController, createControllerUiModel, createKradleComponentCatalog, createKradleHandoffSummary, createKradleLifecycleSnapshot, createKradleMvpDemo, createPolicyRolloutModel, createResource, createKradleKubernetesReconciler, identityAccessReconciliationPlan, createKubernetesResourceClient, createKubernetesResourceGateway, createGiteaBackend, createGiteaRepositoryHosting, giteaIssueSyncPlan, githubProjectIssueSyncPlan, issueProjectRefs, issueRepositoryRefs, orgMemoryRepositoryName, createKradleGitOpsPlan, listResourceDefinitions, mapOidcIdentity, resourceSchemaForKind, resourceToYaml, runSmokeAssertions } from '../src/index.js';

const platform = mapOidcIdentity({ subject: 'platform', email: 'platform@example.com', groups: ['kradle:platform-engineers'] });
const developer = mapOidcIdentity({ subject: 'dev', email: 'dev@example.com', groups: ['kradle:developers'] });
const repoAdmin = mapOidcIdentity({ subject: 'admin', email: 'admin@example.com', groups: ['kradle:repo-admins'] });

function setOptionalEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}


test('Gitea backend maps Git hosting integrations to API-shaped calls', async () => {
  const calls = [];
  const backend = createGiteaBackend({ baseUrl: 'https://gitea.example.test', token: 'secret', fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, async json() { return { ok: true, url, method: options.method }; } };
  } });

  await backend.createOrganization({ name: 'kradle', fullName: 'Kradle' });
  await backend.createRepository({ owner: 'kradle', name: 'app', private: true, defaultBranch: 'main' });
  await backend.addUserSshKey({ title: 'alice', key: 'ssh-ed25519 USER' });
  await backend.addDeployKey({ owner: 'kradle', repo: 'app', title: 'argocd', key: 'ssh-ed25519 AAAA' });
  await backend.addCollaborator({ owner: 'kradle', repo: 'app', username: 'alice', permission: 'write' });
  await backend.createTeam({ org: 'kradle', name: 'maintainers', permission: 'admin' });
  await backend.createIssue({ owner: 'kradle', repo: 'app', title: 'Bug' });
  await backend.createPullRequest({ owner: 'kradle', repo: 'app', title: 'Change', head: 'feature', base: 'main' });
  await backend.protectBranch({ owner: 'kradle', repo: 'app', branch: 'main', statusChecks: ['ci/test'] });
  await backend.createWebhook({ owner: 'kradle', repo: 'app', url: 'https://hooks.example.test/kradle', secret: 'hook-secret' });

  assert.equal(backend.role, 'gitea-backend');
  assert.deepEqual(calls.map((call) => call.options.method), ['POST', 'POST', 'POST', 'POST', 'PUT', 'POST', 'POST', 'POST', 'POST', 'POST']);
  assert.ok(calls[0].url.endsWith('/api/v1/orgs'));
  assert.ok(calls[1].url.endsWith('/api/v1/orgs/kradle/repos'));
  assert.ok(calls[2].url.endsWith('/api/v1/user/keys'));
  assert.ok(calls[3].url.endsWith('/api/v1/repos/kradle/app/keys'));
  assert.ok(calls[4].url.endsWith('/api/v1/repos/kradle/app/collaborators/alice'));
  assert.ok(calls.some((call) => call.url.endsWith('/api/v1/repos/kradle/app/issues')));
  assert.ok(calls.some((call) => call.url.endsWith('/api/v1/repos/kradle/app/pulls')));
  assert.ok(calls[8].url.endsWith('/api/v1/repos/kradle/app/branch_protections'));
  assert.ok(JSON.parse(calls[9].options.body).config.secret === 'hook-secret');
});

test('Argo CD GitOps plan creates an automated Kradle Application', () => {
  const plan = createKradleGitOpsPlan({ repoURL: 'https://gitea.example.test/kradle/platform-config.git', namespace: 'kradle-system' });
  assert.equal(plan.engine, 'argocd');
  assert.equal(plan.application.apiVersion, 'argoproj.io/v1alpha1');
  assert.equal(plan.application.kind, 'Application');
  assert.equal(plan.application.spec.source.repoURL, 'https://gitea.example.test/kradle/platform-config.git');
  assert.equal(plan.application.spec.destination.namespace, 'kradle-system');
  assert.equal(plan.application.spec.syncPolicy.automated.prune, true);
  assert.equal(plan.application.spec.syncPolicy.automated.selfHeal, true);
  assert.ok(plan.requiredClusterResources.includes('Application.argoproj.io'));
});

test('Gitea repository hosting plan includes Argo CD deploy key and webhook integration', () => {
  const hosting = createGiteaRepositoryHosting({ namespace: 'kradle-system', repository: 'platform-config' });
  assert.equal(hosting.backend, 'gitea');
  assert.match(hosting.httpUrl, /platform-config\.git$/);
  assert.ok(hosting.integrationPlan.operations.some((step) => step.action === 'addDeployKey' && step.title === 'kradle-argocd'));
  assert.ok(hosting.integrationPlan.operations.some((step) => step.action === 'createWebhook'));
  assert.equal(hosting.forgeRecords.issues, 'Gitea /repos/kradle/_kradle-system_/issues');
  assert.equal(hosting.issueSync.repo, '_kradle-system_');
  assert.ok(hosting.issueSync.actions.some((step) => step.action === 'ensureOrgMemoryRepository'));
});
test('resource catalog exposes all ontology kinds and storage boundaries', () => {
  const definitions = listResourceDefinitions();
  assert.equal(definitions.length, 98);
  assert.deepEqual(definitions.filter((definition) => definition.storage === 'etcd').map((definition) => definition.kind), ['Organization', 'OrgNamespaceBinding', 'User', 'Team', 'Invite', 'IdentityMapping', 'AuthProvider', 'Repository', 'SSHKey', 'RepositoryPermission', 'WebhookSubscription', 'RefPolicy', 'BranchProtection', 'PolicyProfile', 'PolicyTemplate', 'PolicyBinding', 'PolicyExceptionRequest', 'View', 'Selector', 'RunnerPool', 'AgentStack', 'AgentPersona', 'AgentSoul', 'AgentAppearance', 'AgentVoiceProfile', 'AgentDefinition', 'AgentSubagent', 'AgentToolProfile', 'AgentMcpServer', 'AgentSkill', 'AgentTriggerRule', 'AgentContextLabel', 'KradleWorkspacePolicy', 'AgentServiceAccount', 'AgentRoleBinding', 'AgentSecretGrant', 'AgentConfigGrant', 'KradleWorkspace', 'AgentAdapter', 'AgentTransportBinding', 'AgentProviderConfig', 'KradleProject', 'AgentGatewayConfig', 'AgentMemoryRepository', 'AgentMemorySource', 'AgentMemoryOntology', 'AgentMemoryAssociation', 'GitProvider', 'CiProvider', 'IssueTrackerProvider', 'AppHostingProvider', 'ArtifactRegistryProvider', 'ExternalBackendBinding', 'ExternalBackendSyncPolicy', 'ExternalProviderCapabilityManifest', 'ArtifactRegistry', 'ArtifactFeed', 'ArtifactAccessPolicy', 'KradleInferenceService', 'KradleServingRuntime', 'ExternalWebhookConfig', 'JitsiMeetProvider', 'JitsiMeetingTemplate', 'KradleModelRoute', 'KradleVirtualModel']);
  assert.deepEqual(definitions.filter((definition) => definition.storage === 'postgres').map((definition) => definition.kind), ['PullRequest', 'Issue', 'Review', 'Pipeline', 'Job', 'WebhookDelivery', 'AgentDispatchRun', 'AgentDispatchAttempt', 'AgentSession', 'AgentContextBundle', 'KradleArtifact', 'AgentApproval', 'AgentTriggerExecution', 'AgentCapabilityRequirement', 'WorkItemSessionLink', 'WorkItemWorkspaceLink', 'AgentSessionTranscript', 'AgentSessionAttachment', 'KradleWorkspaceRuntime', 'AgentMemorySnapshot', 'AgentMemoryQuery', 'AgentMemoryUpdate', 'AgentRunMemoryImport', 'ExternalWebhookDelivery', 'ExternalSyncEvent', 'ExternalSyncState', 'ExternalWriteIntent', 'ExternalSyncConflict', 'ExternalObjectLink', 'ArtifactVersion', 'ArtifactDownload', 'JitsiMeeting', 'JitsiRecording']);
  assert.equal(resourceSchemaForKind('Organization').plural, 'organizations');
  assert.equal(resourceSchemaForKind('User').plural, 'users');
  assert.equal(resourceSchemaForKind('Team').plural, 'teams');
  assert.equal(resourceSchemaForKind('Invite').plural, 'invites');
  assert.equal(resourceSchemaForKind('IdentityMapping').plural, 'identitymappings');
  assert.equal(resourceSchemaForKind('AuthProvider').plural, 'authproviders');
  assert.equal(resourceSchemaForKind('SSHKey').plural, 'sshkeys');
  assert.equal(resourceSchemaForKind('RepositoryPermission').plural, 'repositorypermissions');
  assert.equal(resourceSchemaForKind('KradleProject').plural, 'kradleprojects');
  const schema = resourceSchemaForKind('PullRequest');
  assert.deepEqual(schema.required.spec, ['organizationRef', 'repository', 'title']);
  assert.match(resourceToYaml(createResource('Repository', { name: 'yaml-demo' }, { organizationRef: 'default', visibility: 'private' })), /kind: Repository/);
  assert.match(resourceToYaml(createResource('SSHKey', { name: 'alice-key' }, { organizationRef: 'default', scope: 'user', key: 'ssh-ed25519 AAAA' })), /kind: SSHKey/);
  assert.match(resourceToYaml(createResource('KradleProject', { name: 'triage' }, { organizationRef: 'default', displayName: 'Triage', repositories: ['app'] })), /kind: KradleProject/);
  assert.match(resourceToYaml({ apiVersion: 'core.oam.dev/v1beta1', kind: 'Application', spec: { components: [{ name: 'web', properties: { image: 'kradle/mvp-model:0.1.0' }, traits: [{ type: 'scaler', properties: { replicas: 1 } }] }] } }), /components:\n    - name: web\n      properties:\n        image: kradle\/mvp-model:0.1.0\n      traits:\n        - type: scaler/);
});



test('issue project and repository associations are normalized for scoped views', () => {
  const issue = createResource('Issue', { name: 'bug-1', annotations: { 'kradle.a5c.ai/repositories': 'app, docs', 'kradle.a5c.ai/projects': 'planning' } }, {
    organizationRef: 'default',
    title: 'Bug',
    repositoryRefs: [{ name: 'api' }, { repository: 'ui' }],
    repositories: ['worker'],
    projectRef: { name: 'release' },
    projects: ['roadmap']
  });
  assert.deepEqual(issueRepositoryRefs(issue).sort(), ['api', 'app', 'docs', 'ui', 'worker']);
  assert.deepEqual(issueProjectRefs(issue).sort(), ['planning', 'release', 'roadmap']);

  const gitea = giteaIssueSyncPlan({ org: 'default', project: 'release', issue, repositories: issueRepositoryRefs(issue) });
  assert.equal(orgMemoryRepositoryName('default'), '_default_');
  assert.equal(gitea.repo, '_default_');
  assert.deepEqual(gitea.metadataKeys, ['kradle.a5c.ai/project', 'kradle.a5c.ai/repositories']);
  assert.ok(gitea.actions.some((step) => step.action === 'writeIssueRepositoryMetadata'));

  const github = githubProjectIssueSyncPlan({ org: 'default', project: 'release', issue, repositories: issueRepositoryRefs(issue) });
  assert.equal(github.project, 'release');
  assert.ok(github.actions.includes('syncProjectItem'));
});


test('Kradle auth resources map sign-in, teams, invites, and repository identities', () => {
  const config = createAuthProviderConfig({
    KRADLE_AUTH_GITHUB_ENABLED: 'true',
    KRADLE_AUTH_GITHUB_CLIENT_ID: 'gh-client',
    KRADLE_AUTH_GITHUB_CLIENT_SECRET: 'secret',
    KRADLE_AUTH_SSO_ENABLED: 'true',
    KRADLE_AUTH_SSO_PROVIDER_NAME: 'Company SSO',
    KRADLE_AUTH_SSO_CLIENT_ID: 'sso-client',
    KRADLE_AUTH_SSO_CLIENT_SECRET: 'secret',
    KRADLE_AUTH_SSO_AUTHORIZATION_URL: 'https://idp.example.test/authorize',
    KRADLE_AUTH_SSO_TOKEN_URL: 'https://idp.example.test/token',
    KRADLE_AUTH_SSO_USERINFO_URL: 'https://idp.example.test/userinfo',
    KRADLE_AUTH_DELEGATED_IDENTITY_ENABLED: 'true'
  });
  const redirect = buildAuthorizationRedirect({ provider: config.providers.sso, requestUrl: 'https://kradle.example.test/login', state: 'state' });
  const mapped = mapLoginProfileToKradleIdentity({ provider: 'sso', subject: 'user-1', email: 'alice@example.com', displayName: 'Alice', username: 'alice', teams: ['maintainers'], admin: true, namespace: 'kradle-test' });
  const team = createTeamResource({ name: 'maintainers', members: ['alice'], repositoryGrants: [{ repository: 'app', permission: 'admin' }], namespace: 'kradle-test' });
  const invite = createInviteResource({ email: 'bob@example.com', teams: ['maintainers'], namespace: 'kradle-test' });
  const plan = identityBackendSyncPlan({ users: [mapped.user], teams: [team], invites: [invite], mappings: [mapped.mapping], permissions: [createResource('RepositoryPermission', { name: 'app-alice', namespace: 'kradle-test' }, { organizationRef: 'default', repository: 'app', subject: 'alice', subjectKind: 'user', permission: 'admin' })] });

  assert.equal(config.providers.github.enabled, true);
  assert.equal(config.providers.sso.label, 'Company SSO');
  assert.equal(config.delegatedIdentity.enabled, true);
  assert.ok(redirect.url.includes('client_id=sso-client'));
  assert.equal(mapped.user.kind, 'User');
  assert.equal(mapped.mapping.spec.repositoryIdentity.username, 'alice');
  assert.equal(team.kind, 'Team');
  assert.equal(invite.kind, 'Invite');
  assert.deepEqual(plan.mappings.map((entry) => entry.action), ['link-identity']);
  assert.deepEqual(plan.permissions.map((entry) => entry.action), ['sync-repository-permission']);
});

test('session cookies parse into the signed-in Kradle user', () => {
  const config = createAuthProviderConfig({ KRADLE_AUTH_COOKIE_NAME: 'kradle_session' });
  const cookie = createSessionCookie(config, { provider: 'sso', subject: 'alice-subject', username: 'alice' });
  const cookieValue = cookie.match(/kradle_session=([^;]+)/)?.[1];

  assert.deepEqual(parseSessionCookie(config, cookieValue), {
    cookieName: 'kradle_session',
    provider: 'sso',
    subject: 'alice-subject',
    user: 'alice'
  });
  assert.equal(parseSessionCookie(config, 'not-json'), null);
});

test('OAuth callbacks and delegated identity auto-register Kradle users and mappings', async () => {
  const config = createAuthProviderConfig({
    KRADLE_AUTH_GITHUB_ENABLED: 'true',
    KRADLE_AUTH_GITHUB_CLIENT_ID: 'gh-client',
    KRADLE_AUTH_GITHUB_CLIENT_SECRET: 'gh-secret',
    KRADLE_AUTH_DELEGATED_IDENTITY_ENABLED: 'true'
  });
  const calls = [];
  const profile = await exchangeOAuthCodeForProfile({
    provider: config.providers.github,
    code: 'oauth-code',
    requestUrl: 'https://kradle.example.test/api/auth/callback/github',
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      if (String(url).includes('access_token')) return { ok: true, status: 200, async json() { return { access_token: 'token' }; } };
      return { ok: true, status: 200, async json() { return { id: 42, login: 'alice', email: 'alice@example.com', name: 'Alice' }; } };
    }
  });
  const applied = [];
  const registration = await registerLoginProfile({
    namespace: 'kradle-test',
    profile,
    controller: { async applyResource(resource) { applied.push(resource); return { operation: 'apply', resource }; } }
  });
  const delegated = profileFromDelegatedHeaders({ 'x-forwarded-user': 'bob', 'x-forwarded-email': 'bob@example.com', 'x-forwarded-groups': 'kradle:repo-admins,team:release' }, config);

  assert.equal(profile.username, 'alice');
  assert.equal(calls.length, 2);
  assert.deepEqual(applied.map((resource) => resource.kind), ['User', 'IdentityMapping']);
  assert.equal(registration.mapping.spec.repositoryIdentity.username, 'alice');
  assert.equal(delegated.admin, true);
  assert.equal(delegated.email, 'bob@example.com');
  assert.equal(delegated.delegatedIdentitySource, 'proxy-header');
});


test('OAuth callback route completes fake SSO exchange and registers Kradle identity', async () => {
  const previous = {
    enabled: process.env.KRADLE_AUTH_SSO_ENABLED,
    providerName: process.env.KRADLE_AUTH_SSO_PROVIDER_NAME,
    clientId: process.env.KRADLE_AUTH_SSO_CLIENT_ID,
    clientSecret: process.env.KRADLE_AUTH_SSO_CLIENT_SECRET,
    authorizationUrl: process.env.KRADLE_AUTH_SSO_AUTHORIZATION_URL,
    tokenUrl: process.env.KRADLE_AUTH_SSO_TOKEN_URL,
    userInfoUrl: process.env.KRADLE_AUTH_SSO_USERINFO_URL,
    scopes: process.env.KRADLE_AUTH_SSO_SCOPES,
    namespace: process.env.KRADLE_NAMESPACE
  };
  Object.assign(process.env, {
    KRADLE_AUTH_SSO_ENABLED: 'true',
    KRADLE_AUTH_SSO_PROVIDER_NAME: 'Test Workspace SSO',
    KRADLE_AUTH_SSO_CLIENT_ID: 'fake-client',
    KRADLE_AUTH_SSO_CLIENT_SECRET: 'fake-secret',
    KRADLE_AUTH_SSO_AUTHORIZATION_URL: 'https://idp.example.test/authorize',
    KRADLE_AUTH_SSO_TOKEN_URL: 'https://idp.example.test/token',
    KRADLE_AUTH_SSO_USERINFO_URL: 'https://idp.example.test/userinfo',
    KRADLE_AUTH_SSO_SCOPES: 'openid profile email groups',
    KRADLE_NAMESPACE: 'kradle-test'
  });
  const applied = [];
  const fetchCalls = [];
  const controller = { async applyResource(resource) { applied.push(resource); return { operation: 'apply', resource }; } };
  const fetchImpl = async (url, options = {}) => {
    fetchCalls.push({ url: String(url), options });
    if (String(url).endsWith('/token')) {
      const body = new URLSearchParams(String(options.body));
      assert.equal(body.get('code'), 'fake-code');
      assert.equal(body.get('client_id'), 'fake-client');
      assert.equal(body.get('client_secret'), 'fake-secret');
      assert.equal(body.get('redirect_uri'), 'https://kradle.example.test/api/auth/callback/sso');
      return { ok: true, status: 200, async json() { return { access_token: 'fake-access-token' }; } };
    }
    assert.equal(options.headers.Authorization, 'Bearer fake-access-token');
    return { ok: true, status: 200, async json() { return { sub: 'user-123', email: 'route@example.test', preferred_username: 'route-alice', name: 'Route Alice', groups: ['kradle:repo-admins', 'team:platform'] }; } };
  };

  try {
    const { createOAuthCallbackHandler } = await import(`../../web/app/api/auth/callback/[provider]/route.js?test=${Date.now()}`);
    const handler = createOAuthCallbackHandler({ controller, fetchImpl });
    const response = await handler(new Request('https://kradle.example.test/api/auth/callback/sso?code=fake-code&state=state'), { params: { provider: 'sso' } });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/orgs/default/people');
    assert.equal(response.headers.get('x-kradle-user'), 'route-alice');
    assert.match(response.headers.get('set-cookie'), /kradle_session=/);
    assert.deepEqual(fetchCalls.map((call) => call.url), ['https://idp.example.test/token', 'https://idp.example.test/userinfo']);
    assert.deepEqual(applied.map((resource) => resource.kind), ['User', 'IdentityMapping']);
    assert.equal(applied[0].metadata.name, 'route-alice');
    assert.equal(applied[0].spec.admin, true);
    assert.equal(applied[1].spec.provider, 'sso');
    assert.equal(applied[1].spec.repositoryIdentity.username, 'route-alice');
  } finally {
    setOptionalEnv('KRADLE_AUTH_SSO_ENABLED', previous.enabled);
    setOptionalEnv('KRADLE_AUTH_SSO_PROVIDER_NAME', previous.providerName);
    setOptionalEnv('KRADLE_AUTH_SSO_CLIENT_ID', previous.clientId);
    setOptionalEnv('KRADLE_AUTH_SSO_CLIENT_SECRET', previous.clientSecret);
    setOptionalEnv('KRADLE_AUTH_SSO_AUTHORIZATION_URL', previous.authorizationUrl);
    setOptionalEnv('KRADLE_AUTH_SSO_TOKEN_URL', previous.tokenUrl);
    setOptionalEnv('KRADLE_AUTH_SSO_USERINFO_URL', previous.userInfoUrl);
    setOptionalEnv('KRADLE_AUTH_SSO_SCOPES', previous.scopes);
    setOptionalEnv('KRADLE_NAMESPACE', previous.namespace);
  }
});

test('Delegated identity supports localhost development fallback without proxy headers', () => {
  const config = createAuthProviderConfig({
    KRADLE_AUTH_DELEGATED_IDENTITY_ENABLED: 'true',
    KRADLE_AUTH_DELEGATED_LOCAL_USER: 'Dev Alice',
    KRADLE_AUTH_DELEGATED_LOCAL_EMAIL: 'alice@example.test',
    KRADLE_AUTH_DELEGATED_LOCAL_GROUPS: 'kradle:repo-admins,team:local'
  });

  const profile = profileFromDelegatedHeaders({}, config, { requestUrl: 'http://localhost:3000/api/auth/delegated' });

  assert.equal(profile.username, 'dev-alice');
  assert.equal(profile.email, 'alice@example.test');
  assert.equal(profile.admin, true);
  assert.equal(profile.delegatedIdentitySource, 'local-development');
  assert.deepEqual(profile.groups, ['kradle:repo-admins', 'team:local']);
});

test('Delegated identity localhost fallback stays disabled for production unless explicitly enabled', () => {
  const config = createAuthProviderConfig({ KRADLE_AUTH_DELEGATED_IDENTITY_ENABLED: 'true', NODE_ENV: 'production' });

  assert.equal(config.delegatedIdentity.localDevelopment.enabled, false);
  assert.throws(
    () => profileFromDelegatedHeaders({}, config, { requestUrl: 'https://kradle.example.test/api/auth/delegated' }),
    /Delegated identity header x-forwarded-user is missing/
  );
  assert.throws(
    () => profileFromDelegatedHeaders({}, config, { requestUrl: 'http://localhost:3000/api/auth/delegated' }),
    /Delegated identity header x-forwarded-user is missing/
  );

  const explicitConfig = createAuthProviderConfig({
    KRADLE_AUTH_DELEGATED_IDENTITY_ENABLED: 'true',
    KRADLE_AUTH_DELEGATED_LOCAL_DEVELOPMENT: 'true',
    NODE_ENV: 'production'
  });
  const profile = profileFromDelegatedHeaders({}, explicitConfig, { requestUrl: 'http://localhost:3000/api/auth/delegated' });
  assert.equal(profile.username, 'local-developer');
  assert.equal(profile.delegatedIdentitySource, 'local-development');
  const boundAddressProfile = profileFromDelegatedHeaders({}, explicitConfig, { requestUrl: 'http://0.0.0.0:8080/api/auth/delegated' });
  assert.equal(boundAddressProfile.username, 'local-developer');
});

test('Delegated identity route redirects localhost fallback even when Kubernetes registration is unavailable', async () => {
  const previous = {
    delegated: process.env.KRADLE_AUTH_DELEGATED_IDENTITY_ENABLED,
    kubectl: process.env.KRADLE_KUBECTL,
    timeout: process.env.KRADLE_KUBECTL_TIMEOUT_MS
  };
  process.env.KRADLE_AUTH_DELEGATED_IDENTITY_ENABLED = 'true';
  process.env.KRADLE_KUBECTL = 'kradle-missing-kubectl';
  process.env.KRADLE_KUBECTL_TIMEOUT_MS = '50';
  try {
    const { GET } = await import(`../../web/app/api/auth/delegated/route.js?test=${Date.now()}`);
    const response = await GET(new Request('http://localhost:3000/api/auth/delegated?user=Route%20Alice&email=route@example.test&groups=kradle:developers'));

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/orgs/default/people');
    assert.equal(response.headers.get('x-kradle-user'), 'route-alice');
    assert.match(response.headers.get('set-cookie'), /kradle_session=/);
  } finally {
    setOptionalEnv('KRADLE_AUTH_DELEGATED_IDENTITY_ENABLED', previous.delegated);
    setOptionalEnv('KRADLE_KUBECTL', previous.kubectl);
    setOptionalEnv('KRADLE_KUBECTL_TIMEOUT_MS', previous.timeout);
  }
});



test('controller UI model keeps namespace-scoped resources visible for their org', () => {
  const model = createControllerUiModel({
    source: 'kubernetes',
    namespace: 'kradle-system',
    generatedAt: 'test-time',
    kubectl: { available: true, context: 'kind-kradle', errors: [] },
    crds: [],
    resources: {
      Organization: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'Organization', metadata: { name: 'default', namespace: 'kradle-system' }, spec: { slug: 'default', namespaceName: 'kradle-org-default' } }],
      RunnerPool: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'RunnerPool', metadata: { name: 'default', namespace: 'kradle-org-default' }, spec: { image: 'ubuntu:24.04' } }]
    },
    events: [],
    permissions: [],
    storage: {},
    commands: []
  }, { organization: 'default' });

  assert.equal(model.metrics.runnerPools, 1);
  assert.deepEqual(model.resources.find((resource) => resource.kind === 'RunnerPool').names, ['default']);
});

test('Kradle delivery resources surface through controller UI model', () => {
  const model = createControllerUiModel({
    source: 'kubernetes',
    namespace: 'kradle-system',
    generatedAt: 'test-time',
    kubectl: { available: true, context: 'kind-kradle', errors: [] },
    crds: [{ spec: { group: 'core.oam.dev', names: { plural: 'applications' } } }],
    resources: {
      Organization: [{ apiVersion: 'kradle.a5c.ai/v1alpha1', kind: 'Organization', metadata: { name: 'default', namespace: 'kradle-system' }, spec: { slug: 'default', namespaceName: 'kradle-org-default', displayName: 'Default org' } }],
      KubeVelaApplication: [{ apiVersion: 'core.oam.dev/v1beta1', kind: 'Application', metadata: { name: 'app', namespace: 'kradle-org-default', labels: { 'kradle.a5c.ai/org': 'default' } }, spec: { organizationRef: 'default', components: [{ name: 'web', type: 'webservice' }], workflow: { steps: [{ name: 'deploy', type: 'deploy' }] } }, status: { status: 'running', appliedResources: [{ apiVersion: 'apps/v1', kind: 'Deployment', namespace: 'kradle-org-default', name: 'web' }], workflow: { status: 'succeeded', finished: true, appRevision: 'app-v1', steps: [{ name: 'deploy', type: 'deploy', phase: 'succeeded' }] }, services: [{ name: 'web', namespace: 'kradle-system', healthy: true, message: 'Ready:1/1', workloadDefinition: { apiVersion: 'apps/v1', kind: 'Deployment' } }] } }],
      KubeVelaApplicationRevision: [{ metadata: { name: 'app-v1', labels: { 'app.oam.dev/name': 'app', 'kradle.a5c.ai/org': 'default' } }, spec: { organizationRef: 'default' }, status: { succeeded: true } }],
      KubeVelaComponentDefinition: [{ metadata: { name: 'webservice' } }],
      KubeVelaWorkloadDefinition: [{ metadata: { name: 'deployments.apps' } }],
      KubeVelaTraitDefinition: [{ metadata: { name: 'ingress' } }],
      KubeVelaScopeDefinition: [{ metadata: { name: 'healthscopes.core.oam.dev' } }],
      KubeVelaPolicyDefinition: [],
      KubeVelaPolicy: [{ metadata: { name: 'topology', labels: { 'kradle.a5c.ai/org': 'default' } }, spec: { organizationRef: 'default', type: 'topology' } }],
      KubeVelaWorkflowStepDefinition: [{ metadata: { name: 'deploy' } }],
      KubeVelaWorkflow: [{ metadata: { name: 'app', labels: { 'kradle.a5c.ai/org': 'default' } }, spec: { organizationRef: 'default' }, status: { phase: 'running' } }],
      KubeVelaResourceTracker: [{ metadata: { name: 'app-v1-kradle-system', labels: { 'app.oam.dev/name': 'app', 'kradle.a5c.ai/org': 'default' } }, spec: { organizationRef: 'default', type: 'versioned' } }]
    },
    events: [],
    permissions: [],
    storage: {},
    commands: []
  });
  assert.equal(model.delivery.installed, true);
  assert.equal(model.delivery.counts.applications, 1);
  assert.deepEqual(model.delivery.capabilityCatalog.components, ['webservice']);
  assert.deepEqual(model.delivery.capabilityCatalog.workloads, ['deployments.apps']);
  assert.deepEqual(model.delivery.capabilityCatalog.scopes, ['healthscopes.core.oam.dev']);
  assert.equal(model.delivery.specVersion, 'v0.3.0');
  assert.equal(model.delivery.counts.releases, 1);
  assert.equal(model.delivery.counts.managedResources, 1);
  assert.equal(model.delivery.applications[0].healthy, true);
  assert.deepEqual(model.delivery.applications[0].appliedResources.map((resource) => `${resource.kind}/${resource.namespace}/${resource.name}`), ['Deployment/kradle-org-default/web']);
  assert.equal(model.delivery.applications[0].workflow.status, 'succeeded');
  assert.deepEqual(model.delivery.runtime.managedResources.map((tracker) => tracker.name), ['app-v1-kradle-system']);
});

test('control plane keeps CRD config in etcd and aggregated records in Postgres', () => {
  const controlPlane = new ControlPlane();
  controlPlane.create(createResource('Repository', { name: 'app' }, { organizationRef: 'default', visibility: 'private' }), repoAdmin);
  controlPlane.create(createResource('PullRequest', { name: 'pr-1' }, { organizationRef: 'default', repository: 'app', title: 'Improve platform routing' }), developer);
  const report = controlPlane.storageReport();
  assert.deepEqual(report.etcd, ['Repository']);
  assert.deepEqual(report.postgres, ['PullRequest']);
});


test('API controller is an application facade over the Kubernetes resource gateway', async () => {
  const calls = [];
  const repository = createResource('Repository', { name: 'app', namespace: 'kradle-test' }, { organizationRef: 'default', visibility: 'internal', defaultBranch: 'main' });
  const resourceGateway = {
    role: 'kubernetes-resource-gateway',
    namespace: 'kradle-test',
    resourceDefinitions: listResourceDefinitions(),
    async snapshot() {
      calls.push(['snapshot']);
      return { source: 'kubernetes', namespace: 'kradle-test', resources: { Repository: [repository] }, commands: [], events: [], permissions: [], storage: {} };
    },
    async list(kind) {
      calls.push(['list', kind]);
      return { items: [repository] };
    },
    async get(kind, name) {
      calls.push(['get', kind, name]);
      return repository;
    },
    async apply(resource) {
      calls.push(['apply', resource.kind]);
      return { operation: 'apply', resource };
    },
    async delete(kind, name) {
      calls.push(['delete', kind, name]);
      return { operation: 'delete', resource: null };
    },
    async createRepository(input) {
      calls.push(['createRepository', input.name]);
      return { operation: 'apply', command: 'kubectl apply -f -', resource: repository };
    },
    watch(resourcePath) {
      calls.push(['watch', resourcePath]);
      return { command: 'kubectl get repositories.kradle.a5c.ai --watch -o json' };
    }
  };

  const controller = createKradleApiController({ resourceGateway });
  const snapshot = await controller.snapshot();
  const repositories = await controller.listRepositoriesForForge();
  const view = await controller.getRepositoryForgeView('app');
  const created = await controller.createRepository({ name: 'app', organizationRef: 'default' });

  assert.equal(controller.role, 'kradle-api-controller');
  assert.equal(snapshot.architecture.apiController.role, 'kradle-api-controller');
  assert.ok(snapshot.architecture.apiController.mustNotOwn.includes('Kubernetes reconciliation loops'));
  assert.equal(repositories[0].cloneUrl.endsWith('/app.git'), true);
  assert.equal(view.primaryFlow, 'browse-code-open-pr-review-merge');
  assert.equal(view.sections.some((section) => section.id === 'pull-requests'), true);
  assert.equal(created.repository.actions.settings, '/orgs/default/repositories/app/settings');
  assert.deepEqual(calls.map((call) => call[0]), ['snapshot', 'list', 'get', 'createRepository']);
});

test('Kubernetes resource gateway owns Kubernetes operations while reconciler owns status projection', async () => {
  const repository = createResource('Repository', { name: 'app', namespace: 'kradle-test' }, { organizationRef: 'default', visibility: 'internal' });
  const delegated = [];
  const resourceClient = {
    role: 'kubernetes-resource-client',
    namespace: 'kradle-test',
    resourceDefinitions: listResourceDefinitions(),
    async snapshot() { delegated.push('snapshot'); return { source: 'kubernetes', namespace: 'kradle-test', resources: { Repository: [repository] } }; },
    async listResource(kind) { delegated.push(`list:${kind}`); return { items: [repository] }; },
    async getResource(kind, name) { delegated.push(`get:${kind}:${name}`); return repository; },
    async applyResource(resource) { delegated.push(`apply:${resource.kind}`); return { operation: 'apply', resource }; },
    async deleteResource(kind, name) { delegated.push(`delete:${kind}:${name}`); return { operation: 'delete' }; },
    watchResource(resourcePath) { delegated.push(`watch:${resourcePath}`); return { command: 'kubectl get repositories.kradle.a5c.ai --watch -o json' }; }
  };
  const gateway = createKubernetesResourceGateway({ resourceClient });
  const reconciler = createKradleKubernetesReconciler({ namespace: 'kradle-test' });
  const applied = await gateway.createRepository({ name: 'app', organizationRef: 'default' });
  const plan = reconciler.reconcileRepository(repository);

  assert.equal(gateway.role, 'kubernetes-resource-gateway');
  assert.ok(gateway.mustNotOwn.includes('Next.js page flow decisions'));
  assert.equal(applied.resource.kind, 'Repository');
  assert.equal(delegated.includes('apply:Repository'), true);
  const client = createKubernetesResourceClient({ namespace: 'kradle-test' });
  assert.equal(client.role, 'kubernetes-resource-client');
  assert.equal(client.mustNotOwn.includes('forge DTO composition'), true);
  assert.equal(reconciler.role, 'kradle-kubernetes-reconciler');
  assert.ok(reconciler.mustNotOwn.includes('HTTP routes'));
  assert.equal(plan.kind, 'RepositoryReconciliationPlan');
  assert.equal(plan.syncIntents.some((intent) => intent.target === 'git-data-plane'), true);
  assert.equal(reconciler.describeReconciliationScope().resources.some((resource) => resource.kind === 'Repository'), true);
});

test('identity access reconciler projects users permissions and SSH keys into Kradle status', () => {
  const user = createResource('User', { name: 'alice', namespace: 'kradle-test' }, { organizationRef: 'default', email: 'alice@example.com', username: 'alice', teams: ['maintainers'], admin: false });
  const disabledUser = createResource('User', { name: 'bob', namespace: 'kradle-test' }, { organizationRef: 'default', email: 'bob@example.com', username: 'bob', disabled: true });
  const permission = createResource('RepositoryPermission', { name: 'app-alice', namespace: 'kradle-test' }, { organizationRef: 'default', repository: 'app', subject: 'alice', subjectKind: 'user', permission: 'write', revoked: true });
  const sshKey = createResource('SSHKey', { name: 'alice-laptop', namespace: 'kradle-test' }, { organizationRef: 'default', owner: 'alice', title: 'laptop', scope: 'user', key: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKradleTest alice@example.com' });
  const reconciler = createKradleKubernetesReconciler({ namespace: 'kradle-test' });
  const activePlan = reconciler.reconcileIdentityAccess(user);
  const disabledPlan = identityAccessReconciliationPlan(disabledUser, { namespace: 'kradle-test' });
  const permissionPlan = reconciler.reconcileIdentityAccess(permission);
  const sshPlan = reconciler.reconcileIdentityAccess(sshKey);
  const aggregate = reconciler.reconcileIdentityAccessResources({ User: [user, disabledUser], RepositoryPermission: [permission], SSHKey: [sshKey] });

  assert.equal(activePlan.desiredStatus.phase, 'Active');
  assert.ok(activePlan.desiredStatus.groups.includes('team:maintainers'));
  assert.ok(activePlan.syncIntents.some((intent) => intent.action === 'ensure-repository-user'));
  assert.equal(disabledPlan.desiredStatus.phase, 'Disabled');
  assert.ok(disabledPlan.syncIntents.some((intent) => intent.action === 'suspend-user'));
  assert.equal(permissionPlan.desiredStatus.phase, 'Revoked');
  assert.equal(permissionPlan.syncIntents[0].action, 'revoke-repository-permission');
  assert.match(sshPlan.desiredStatus.fingerprint, /^sha256:[A-Za-z0-9_-]+$/);
  assert.equal(sshPlan.syncIntents[0].action, 'sync-ssh-key');
  assert.deepEqual(aggregate.counts, { User: 2, RepositoryPermission: 1, SSHKey: 1 });
  assert.equal(aggregate.desiredStatuses.filter((status) => status.phase === 'Revoked').length, 1);
  assert.ok(aggregate.syncIntents.some((intent) => intent.action === 'revoke-repository-permission'));
});

test('controller boundary source keeps kubectl out of API facade and UI flow out of reconciler', () => {
  const apiSource = readFileSync('src/api-controller.js', 'utf8');
  const gatewaySource = readFileSync('src/kubernetes-resource-gateway.js', 'utf8');
  const kubernetesSource = readFileSync('src/kubernetes-controller.js', 'utf8');

  assert.equal(apiSource.includes('node:child_process'), false);
  assert.equal(apiSource.includes('spawnSync'), false);
  assert.equal(apiSource.includes('KRADLE_API_CONTROLLER_BOUNDARY'), true);
  assert.equal(gatewaySource.includes('KUBERNETES_RESOURCE_GATEWAY_BOUNDARY'), true);
  assert.equal(kubernetesSource.includes('KRADLE_KUBERNETES_RECONCILER_BOUNDARY'), true);
  assert.equal(kubernetesSource.includes('Next.js page flows'), true);
  assert.equal(kubernetesSource.includes('/repositories/${repo}'), false);
});test('RBAC and admission enforce Kubernetes-style policy while supporting audit mode', () => {
  const controlPlane = new ControlPlane();
  controlPlane.addAdmissionPolicy(createAdmissionPolicy({ name: 'descriptive-pr-title', mode: 'enforce', match: ({ resource }) => resource.kind === 'PullRequest', validate: ({ resource }) => resource.spec.title?.length >= 8, message: 'title too short' }));
  assert.throws(() => controlPlane.create(createResource('PullRequest', { name: 'bad' }, { organizationRef: 'default', repository: 'app', title: 'tiny' }), developer), /title too short/);
  const accepted = controlPlane.create(createResource('PullRequest', { name: 'good' }, { organizationRef: 'default', repository: 'app', title: 'Implement policy preview flow' }), developer);
  assert.equal(accepted.status.storage, 'postgres');
  assert.throws(() => controlPlane.create(createResource('Repository', { name: 'denied' }, { organizationRef: 'default', visibility: 'private' }), developer), /RBAC denied/);
  const policyModel = createPolicyRolloutModel({ name: 'descriptive-pr-title', mode: 'audit' });
  assert.deepEqual(policyModel.rollout, ['preview', 'audit', 'enforce']);
});

test('watch events and audit-mode admission warnings remain inspectable', () => {
  const controlPlane = new ControlPlane();
  const events = [];
  const stop = controlPlane.watch('PullRequest', (event) => events.push(event));
  controlPlane.addAdmissionPolicy(createAdmissionPolicy({ name: 'audit-title', mode: 'audit', match: ({ resource }) => resource.kind === 'PullRequest', validate: ({ resource }) => resource.spec.title?.includes('audit'), message: 'title should mention audit' }));
  const pr = controlPlane.create(createResource('PullRequest', { name: 'audit-pr' }, { organizationRef: 'default', repository: 'app', title: 'Implement warning visibility' }), developer);
  stop();
  assert.equal(pr.status.storage, 'postgres');
  assert.equal(events.length, 1);
  assert.equal(controlPlane.auditLog.at(-1).warnings[0].policy, 'audit-title');
});

test('Gitea data plane keeps receive-pack warm and protected', () => {
  const controlPlane = new ControlPlane();
  const git = new GiteaGitService({ controlPlane, stores: [new GiteaRepositoryStore({ name: 'gitea-primary', receivePackReady: true })] });
  const repository = git.createRepository({ name: 'app' }, repoAdmin);
  controlPlane.create(createResource('BranchProtection', { name: 'main', namespace: 'kradle-org-default' }, { organizationRef: 'default', refs: ['refs/heads/main'], requirePullRequest: true }), repoAdmin);
  const route = git.route('app');
  assert.equal(route.backend, 'gitea');
  assert.equal(route.receivePackReady, true);
  assert.equal(repository.spec.gitHosting.backend, 'gitea');
  assert.equal(repository.spec.gitHosting.integrationPlan.backend, 'gitea');
  assert.ok(repository.spec.gitHosting.integrationPlan.operations.some((step) => step.action === 'addDeployKey'));
  assert.throws(() => git.receivePack({ repository: 'app', ref: 'refs/heads/main', newRev: '1'.repeat(40), actor: developer }), /requires pull request/);
  const event = git.receivePack({ repository: 'app', ref: 'refs/heads/main', newRev: '2'.repeat(40), actor: repoAdmin });
  assert.equal(event.backend, 'gitea');
  assert.equal(event.store, 'gitea-primary');
  assert.match(event.remoteUrl, /gitea/);
  controlPlane.create(createResource('RefPolicy', { name: 'deny-internal', namespace: 'kradle-org-default' }, { organizationRef: 'default', deny: ['refs/internal/'] }), repoAdmin);
  assert.throws(() => git.receivePack({ repository: 'app', ref: 'refs/internal/secret', newRev: '3'.repeat(40), actor: repoAdmin }), /RefPolicy deny-internal denied/);
  assert.equal(git.recordObject({ repository: 'app', key: 'lfs/abc', size: 128 }).storage, 'object-storage');
  assert.equal(git.enqueueSearchIndex({ repository: 'app', commit: '2'.repeat(40), paths: ['README.md'] }).status, 'queued');
});


test('runner scheduler isolates fork PR jobs and supports resume reruns', () => {
  const controlPlane = new ControlPlane();
  const runners = new RunnerScheduler({ controlPlane });
  const pool = runners.createRunnerPool({ name: 'trusted-linux', warmReplicas: 1, maxReplicas: 3 }, platform);
  assert.equal(runners.planReplicas(pool, 9), 3);
  const run = runners.startPipeline({ name: 'pr-2', repository: 'app', ref: 'refs/pull/2/head', actor: developer, fork: true, steps: ['checkout', 'test', 'publish'] }, developer);
  assert.equal(run.jobs[0].spec.serviceAccount.scopes.secrets, false);
  assert.equal(run.jobs[0].spec.serviceAccount.scopes.clusterApi, false);
  const rerun = runners.rerunFromStep(run.pipeline, 'test', developer);
  assert.equal(rerun.pipeline.spec.resumeFrom, 'test');
});

test('webhooks are signed, stored, inspectable, and replayable', () => {
  const controlPlane = new ControlPlane();
  const bus = new WebhookBus({ controlPlane, secret: 'test-secret' });
  bus.subscribe({ name: 'chatops', url: 'https://hooks.example.test', events: ['pullrequest.created'] }, repoAdmin);
  const first = bus.deliver({ subscriptionName: 'chatops', eventType: 'pullrequest.created', payload: { pr: 'pr-1' } }, repoAdmin);
  const failed = bus.deliver({ subscriptionName: 'chatops', eventType: 'pullrequest.created', payload: { pr: 'pr-2' }, response: { status: 503, body: 'downstream unavailable' } }, repoAdmin);
  const replay = bus.replay(first, repoAdmin);
  assert.equal(first.kind, 'WebhookDelivery');
  assert.equal(first.status.phase, 'Delivered');
  assert.equal(bus.inspect(failed).phase, 'Failed');
  assert.equal(bus.inspect(failed).replayable, true);
  assert.notEqual(first.spec.signature, replay.spec.signature);
  assert.equal(controlPlane.list('WebhookDelivery').items.length, 3);
});


test('component catalog and lifecycle snapshot cover every implementation area', () => {
  const demo = createKradleMvpDemo();
  demo.smoke = runSmokeAssertions(demo);
  const catalog = createKradleComponentCatalog(demo);
  const snapshot = createKradleLifecycleSnapshot(demo, { packageInfo: { version: 'test' }, generatedAt: 'test-time' });
  assert.equal(catalog.length, 7);
  assert.equal(snapshot.status, 'ready-for-local-development');
  assert.ok(snapshot.components.some((component) => component.id === 'control-plane' && component.implemented));
  assert.ok(snapshot.components.some((component) => component.id === 'runners-ci' && component.resources.includes('Pipeline')));
  assert.ok(snapshot.operations.releaseGates.includes('e2e package lifecycle tests'));
  assert.ok(snapshot.validation.every((assertion) => assertion.passed));
});
test('MVP smoke path covers resources, UI, operations, and release gates', () => {
  const demo = createKradleMvpDemo();
  const smoke = runSmokeAssertions(demo);
  assert.equal(smoke.ok, true);
  assert.ok(demo.ui.dashboard.excellentFlows.includes('Open and review a PR'));
  assert.ok(demo.operations.backupPlan.restoreOrder.includes('Postgres'));
  assert.ok(demo.operations.backupPlan.restoreOrder.includes('repository data'));
  assert.ok(demo.operations.installManifests.includes('kradle-gitea'));
  assert.ok(demo.operations.installManifests.includes('kind: Application'));
  assert.equal(demo.resources.repository.spec.gitHosting.backend, 'gitea');
  assert.ok(demo.operations.releaseGates.includes('docs and ontology coverage'));
  assert.ok(demo.operations.observability.alerts.includes('runner saturation'));
});

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('handoff summary and package metadata expose runnable lifecycle surfaces', () => {
  const packageInfo = JSON.parse(readFileSync('package.json', 'utf8'));
  const demo = createKradleMvpDemo();
  demo.smoke = runSmokeAssertions(demo);
  const summary = createKradleHandoffSummary(demo, { packageInfo, generatedAt: 'test-time' });
  assert.equal(packageInfo.main, './src/index.js');
  assert.equal(packageInfo.bin['kradle-demo'], './bin/kradle-demo.mjs');
  assert.equal(packageInfo.scripts.demo, 'node bin/kradle-demo.mjs');
  assert.equal(summary.entrypoints.cli, './bin/kradle-demo.mjs');
  assert.equal(summary.commands.check, 'npm run check');
  assert.ok(summary.docs.includes('docs/architecture-spec.md'));
  assert.ok(summary.releaseGates.includes('docs and ontology coverage'));
  assert.equal(summary.smoke.ok, true);
  assert.equal(summary.generatedAt, 'test-time');
});

test('CLI demo emits machine-readable MVP handoff summary', () => {
  const output = execFileSync(process.execPath, ['bin/kradle-demo.mjs', '--json'], { encoding: 'utf8' });
  const summary = JSON.parse(output);
  assert.equal(summary.project, 'Kradle');
  assert.equal(summary.entrypoints.library, './src/index.js');
  assert.equal(summary.commands.demo, 'npm run demo');
  assert.equal(summary.smoke.ok, true);
  assert.ok(summary.excellentFlows.includes('Open and review a PR'));
});



import { KradleRuntime, createKradleHttpServer, createKradleRuntime } from '../src/index.js';

test('runtime executes PR checks review and merge lifecycle with persisted resources', () => {
  const runtime = createKradleRuntime();
  const created = runtime.createPullRequest({ repository: 'kradle-demo', title: 'Ship runnable lifecycle implementation' });
  assert.equal(created.pullRequest.status.phase, 'Open');
  assert.throws(() => runtime.mergePullRequest({ pullRequest: created.pullRequest.metadata.name }), /not mergeable/);
  const checks = runtime.completePipeline({ pipeline: created.pipeline.metadata.name });
  assert.equal(checks.pipeline.status.phase, 'Succeeded');
  const review = runtime.addReview({ pullRequest: created.pullRequest.metadata.name, decision: 'approved' });
  assert.equal(review.status.phase, 'Approved');
  const merged = runtime.mergePullRequest({ pullRequest: created.pullRequest.metadata.name });
  assert.equal(merged.pullRequest.status.phase, 'Merged');
  assert.equal(merged.delivery.kind, 'WebhookDelivery');
  const snapshot = runtime.snapshot();
  assert.equal(snapshot.resources.PullRequest[0].status.phase, 'Merged');
  assert.ok(snapshot.events.some((event) => event.type === 'git.receive-pack' && event.resource.backend === 'gitea'));
  assert.equal(snapshot.resources.Repository[0].spec.gitHosting.backend, 'gitea');
});

test('runtime snapshot export restores durable state and continues lifecycle', () => {
  const runtime = createKradleRuntime();
  const created = runtime.createPullRequest({ repository: 'kradle-demo', title: 'Persist runtime lifecycle across restart' });
  runtime.completePipeline({ pipeline: created.pipeline.metadata.name });
  runtime.addReview({ pullRequest: created.pullRequest.metadata.name, decision: 'approved' });
  runtime.mergePullRequest({ pullRequest: created.pullRequest.metadata.name });
  const exported = runtime.exportSnapshot();
  const restored = KradleRuntime.fromSnapshot(exported);
  const restoredSnapshot = restored.snapshot();
  assert.equal(restoredSnapshot.resources.PullRequest[0].status.phase, 'Merged');
  assert.equal(restoredSnapshot.resources.WebhookDelivery.length, runtime.snapshot().resources.WebhookDelivery.length);
  const next = restored.createPullRequest({ repository: 'kradle-demo', title: 'Continue after snapshot import' });
  assert.equal(next.pullRequest.metadata.name, 'pr-2');
  assert.equal(restored.exportSnapshot().controlPlane.stores.postgres.some((resource) => resource.kind === 'PullRequest' && resource.metadata.name === 'pr-2'), true);
});

test('runtime snapshot preserves git object storage and search index data', () => {
  const runtime = createKradleRuntime();
  runtime.git.recordObject({ repository: 'kradle-demo', key: 'lfs/blob.bin', size: 512, mediaType: 'application/octet-stream' });
  runtime.git.enqueueSearchIndex({ repository: 'kradle-demo', commit: 'a'.repeat(40), paths: ['src/index.js', 'README.md'] });

  const exported = runtime.exportSnapshot();
  assert.equal(exported.git.backend.type, 'gitea');
  assert.equal(exported.git.integrationPlans['kradle-demo'].backend, 'gitea');
  assert.equal(exported.git.stores[0].objects['kradle-demo'][0].key, 'lfs/blob.bin');
  assert.deepEqual(exported.git.stores[0].searchIndex['kradle-demo'][0].paths, ['src/index.js', 'README.md']);

  const restored = KradleRuntime.fromSnapshot(exported);
  const restoredGit = restored.exportSnapshot().git;
  assert.equal(restoredGit.stores[0].objects['kradle-demo'][0].size, 512);
  assert.equal(restoredGit.stores[0].searchIndex['kradle-demo'][0].commit, 'a'.repeat(40));
  const restoredRoute = restored.git.uploadPack({ repository: 'kradle-demo' });
  assert.equal(restoredRoute.cacheable, true);
  assert.equal(restoredRoute.backend, 'gitea');
});

test('HTTP API exposes executable runtime endpoints', async () => {
  const runtime = createKradleRuntime();
  const server = createKradleHttpServer({ runtime });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const created = await fetchJson(`${base}/api/orgs/default/pullrequests`, { method: 'POST', body: { repository: 'kradle-demo', title: 'Exercise HTTP lifecycle runtime' } });
    assert.equal(created.pullRequest.kind, 'PullRequest');
    await fetchJson(`${base}/api/orgs/default/pullrequests/${created.pullRequest.metadata.name}/checks/complete`, { method: 'POST', body: {} });
    await fetchJson(`${base}/api/orgs/default/pullrequests/${created.pullRequest.metadata.name}/reviews`, { method: 'POST', body: { decision: 'approved' } });
    const merged = await fetchJson(`${base}/api/orgs/default/pullrequests/${created.pullRequest.metadata.name}/merge`, { method: 'POST', body: {} });
    assert.equal(merged.pullRequest.status.phase, 'Merged');
    const snapshot = await fetchJson(`${base}/api/orgs/default/snapshot`);
    assert.ok(snapshot.resources.WebhookDelivery.length >= 2);
    const restored = await fetchJson(`${base}/api/orgs/default/snapshot`, { method: 'POST', body: snapshot.export });
    assert.equal(restored.resources.PullRequest[0].status.phase, 'Merged');
    assert.equal(restored.export.controlPlane.stores.postgres.some((resource) => resource.kind === 'PullRequest'), true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});


test('HTTP API exposes Git object storage and search indexing runtime endpoints', async () => {
  const runtime = createKradleRuntime();
  const server = createKradleHttpServer({ runtime });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const object = await fetchJson(`${base}/api/orgs/default/repositories/kradle-demo/objects`, {
      method: 'POST',
      body: { key: 'lfs/http.bin', size: 1024, mediaType: 'application/octet-stream' }
    });
    assert.equal(object.repository, 'kradle-demo');
    assert.equal(object.storage, 'object-storage');

    const index = await fetchJson(`${base}/api/orgs/default/repositories/kradle-demo/search-index`, {
      method: 'POST',
      body: { commit: 'b'.repeat(40), paths: ['src/http-server.js', 'README.md'] }
    });
    assert.equal(index.status, 'queued');
    assert.deepEqual(index.paths, ['src/http-server.js', 'README.md']);

    const snapshot = await fetchJson(`${base}/api/orgs/default/snapshot`);
    assert.equal(snapshot.export.git.stores[0].objects['kradle-demo'][0].key, 'lfs/http.bin');
    assert.equal(snapshot.export.git.stores[0].searchIndex['kradle-demo'][0].commit, 'b'.repeat(40));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

async function fetchJson(url, { method = 'GET', body } = {}) {
  const response = await fetch(url, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const value = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(value)}`);
  return value;
}







