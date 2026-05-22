/**
 * Core Integration Tests — End-to-end data flow tests using mock kubectl gateway
 *
 * Tests the full data flow through the Krate API controller using a mock
 * resource gateway that stores resources in a Map instead of kubectl.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createKrateApiController,
  createResource,
  createAuditController,
  createAgentSecretGrantController,
  createAgentMemoryController,
  listGrantsForAgent,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// Mock resource gateway — stores resources in a Map instead of kubectl
// ---------------------------------------------------------------------------

function createMockGateway() {
  const store = new Map();
  return {
    namespace: 'krate-org-test',
    async apply(resource) {
      store.set(`${resource.kind}/${resource.metadata.name}`, resource);
      return { operation: 'apply', resource };
    },
    async list(kind) {
      return { items: [...store.values()].filter((r) => r.kind === kind) };
    },
    async get(kind, name) {
      return { resource: store.get(`${kind}/${name}`) || null };
    },
    async delete(kind, name) {
      store.delete(`${kind}/${name}`);
      return { operation: 'delete' };
    },
    async snapshot() {
      return { namespace: 'krate-org-test', resources: {} };
    },
    watch() {
      return { close: () => {} };
    },
    resourceDefinitions: [],
  };
}

// ---------------------------------------------------------------------------
// Test 1: Org/user/repo flow
// ---------------------------------------------------------------------------

test('full flow: create org → user → repository → list shows repo', async () => {
  const gw = createMockGateway();
  const controller = createKrateApiController({ resourceGateway: gw });

  // Create org
  const org = createResource('Organization', { name: 'test-org', namespace: 'krate-system' }, { displayName: 'Test Org', namespaceName: 'krate-org-test-org' });
  await controller.applyResource(org);

  // Create user
  const user = createResource('User', { name: 'alice', namespace: 'krate-org-test-org' }, { organizationRef: 'test-org', displayName: 'Alice', email: 'alice@example.com' });
  await controller.applyResource(user);

  // Create repository
  const repo = createResource('Repository', { name: 'my-repo', namespace: 'krate-org-test-org' }, { organizationRef: 'test-org', visibility: 'internal' });
  await controller.applyResource(repo);

  // List repositories — should include the new repo
  const result = await controller.listResource('Repository');
  assert.ok(Array.isArray(result.items), 'result.items must be an array');
  const found = result.items.find((r) => r.metadata?.name === 'my-repo');
  assert.ok(found, 'my-repo should appear in listResource(Repository)');
  assert.equal(found.spec?.organizationRef, 'test-org');
});

// ---------------------------------------------------------------------------
// Test 2: Agent stack + trigger rule flow
// ---------------------------------------------------------------------------

test('full flow: create agent stack → create trigger rule → both appear in list', async () => {
  const gw = createMockGateway();
  const controller = createKrateApiController({ resourceGateway: gw });

  // Create agent stack
  const stack = createResource(
    'AgentStack',
    { name: 'review-bot', namespace: 'krate-org-myorg' },
    { organizationRef: 'myorg', baseAgent: 'claude-code', adapter: 'default', runtimeIdentity: 'workspace' }
  );
  await controller.applyResource(stack);

  // Create trigger rule
  const rule = createResource(
    'AgentTriggerRule',
    { name: 'pr-trigger', namespace: 'krate-org-myorg' },
    { organizationRef: 'myorg', sources: [{ type: 'pull_request', events: ['opened'] }], agentStack: 'review-bot', taskKind: 'code-review' }
  );
  await controller.applyResource(rule);

  // Verify both appear
  const stackList = await controller.listResource('AgentStack');
  assert.ok(stackList.items.some((s) => s.metadata?.name === 'review-bot'), 'review-bot stack should appear');

  const ruleList = await controller.listResource('AgentTriggerRule');
  assert.ok(ruleList.items.some((r) => r.metadata?.name === 'pr-trigger'), 'pr-trigger rule should appear');
});

// ---------------------------------------------------------------------------
// Test 3: Workspace flow
// ---------------------------------------------------------------------------

test('full flow: create workspace → verify it appears in list', async () => {
  const gw = createMockGateway();
  const controller = createKrateApiController({ resourceGateway: gw });

  // Create workspace
  const workspace = createResource(
    'KrateWorkspace',
    { name: 'dev-workspace', namespace: 'krate-org-myorg' },
    { organizationRef: 'myorg', repository: 'my-repo', volumeSpec: { storageClass: 'standard', size: '10Gi' } }
  );
  await controller.applyResource(workspace);

  // List workspaces — should include the new one
  const result = await controller.listResource('KrateWorkspace');
  assert.ok(Array.isArray(result.items));
  const found = result.items.find((r) => r.metadata?.name === 'dev-workspace');
  assert.ok(found, 'dev-workspace should appear in listResource(KrateWorkspace)');
  assert.equal(found.spec?.repository, 'my-repo');
});

// ---------------------------------------------------------------------------
// Test 4: Secret grant flow
// ---------------------------------------------------------------------------

test('full flow: create secret grant → listGrantsForAgent returns it', async () => {
  const gw = createMockGateway();
  const ctrl = createAgentSecretGrantController();

  // Create a secret grant
  const result = ctrl.createSecretGrant({
    name: 'db-pass-grant',
    orgRef: 'myorg',
    secretName: 'db-password',
    grantedTo: 'review-bot',
    permissions: ['read'],
    namespace: 'krate-org-myorg',
  });

  assert.ok(result.grant, 'createSecretGrant must return a grant');
  assert.equal(result.grant.kind, 'AgentSecretGrant');
  assert.equal(result.grant.metadata.name, 'db-pass-grant');
  assert.equal(result.grant.spec.grantedTo, 'review-bot');

  // Apply the grant resource via mock gateway
  await gw.apply(result.grant);

  // List grants and filter for this agent
  const list = await gw.list('AgentSecretGrant');
  const agentGrants = listGrantsForAgent(list.items, 'review-bot');
  assert.ok(agentGrants.length >= 1, 'listGrantsForAgent should return at least 1 grant for review-bot');
  assert.equal(agentGrants[0].metadata.name, 'db-pass-grant');
});

// ---------------------------------------------------------------------------
// Test 5: External flow — syncExternalBinding
// ---------------------------------------------------------------------------

test('full flow: syncExternalBinding creates resource with external envelope', async () => {
  const gw = createMockGateway();
  const controller = createKrateApiController({ resourceGateway: gw });

  const result = await controller.syncExternalBinding('github-binding', {
    kind: 'Repository',
    localName: 'synced-repo',
    namespace: 'default',
    spec: { organizationRef: 'default', visibility: 'private' },
    externalEnvelope: {
      nativeId: 'gh-repo-42',
      url: 'https://github.com/org/synced-repo',
      etag: '"abc123"',
      providerRef: 'github-provider',
    },
  });

  assert.ok(result, 'syncExternalBinding must return a result');
  assert.ok(result.resource, 'result must include the upserted resource');
  assert.equal(
    result.resource.status?.external?.nativeId || result.resource?.status?.external?.nativeId,
    'gh-repo-42',
    'upserted resource must have correct nativeId'
  );
});

// ---------------------------------------------------------------------------
// Test 6: Memory flow — create repository source → verify in list
// ---------------------------------------------------------------------------

test('full flow: create memory repository → apply → appears in list', async () => {
  const gw = createMockGateway();
  const controller = createKrateApiController({ resourceGateway: gw });

  // Create a memory repository resource
  const memRepo = createResource(
    'AgentMemoryRepository',
    { name: 'org-brain', namespace: 'krate-org-myorg' },
    { organizationRef: 'myorg', repositoryRef: 'memory-repo', defaultBranch: 'main', layoutProfile: 'standard' }
  );
  await controller.applyResource(memRepo);

  // Create a memory source
  const memSource = createResource(
    'AgentMemorySource',
    { name: 'codebase-source', namespace: 'krate-org-myorg' },
    {
      organizationRef: 'myorg',
      repositoryRef: 'org-brain',
      appliesTo: { stacks: ['review-bot'] },
      include: ['decisions/', 'patterns/'],
    }
  );
  await controller.applyResource(memSource);

  // Verify both appear in their lists
  const repoList = await controller.listResource('AgentMemoryRepository');
  assert.ok(repoList.items.some((r) => r.metadata?.name === 'org-brain'), 'org-brain memory repo should appear');

  const sourceList = await controller.listResource('AgentMemorySource');
  assert.ok(sourceList.items.some((s) => s.metadata?.name === 'codebase-source'), 'codebase-source should appear');
});

// ---------------------------------------------------------------------------
// Test 7: Audit flow — apply resource → audit log contains event
// ---------------------------------------------------------------------------

test('full flow: apply resource with onAuditEvent → audit log contains the event', async () => {
  const gw = createMockGateway();
  const audit = createAuditController();

  const controller = createKrateApiController({
    resourceGateway: gw,
    onAuditEvent: (evt) => audit.log({
      org: evt.org || 'audited',
      actor: 'system',
      action: evt.operation || 'apply',
      resource: { kind: evt.kind, name: evt.name },
      timestamp: evt.timestamp,
    }),
  });

  // Apply a resource
  const repo = createResource(
    'Repository',
    { name: 'audited-repo', namespace: 'krate-org-audited' },
    { organizationRef: 'audited', visibility: 'private' }
  );
  await controller.applyResource(repo);

  // Verify audit log contains the event
  const { events, total } = audit.query({ org: 'audited' });
  assert.ok(total >= 1, 'audit log must contain at least 1 event after apply');
  assert.equal(events[0].action, 'apply', 'audit event action must be "apply"');
  assert.equal(events[0].org, 'audited', 'audit event org must match');
});
