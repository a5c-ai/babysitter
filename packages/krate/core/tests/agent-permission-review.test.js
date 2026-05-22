import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPermissionReviewer } from '../src/agent-permission-review.js';
import { createResource } from '../src/resource-model.js';

function makeStack(name, overrides = {}) {
  return createResource('AgentStack', { name }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'babysitter',
    runtimeIdentity: { serviceAccountRef: overrides.serviceAccountRef || 'sa-agent' },
    ...(overrides.spec || {})
  });
}

function makeServiceAccount(name) {
  return createResource('AgentServiceAccount', { name }, {
    organizationRef: 'default',
    namespace: 'krate-agents',
    serviceAccountName: name
  });
}

function makeRoleBinding(name, subject) {
  return createResource('AgentRoleBinding', { name }, {
    organizationRef: 'default',
    subject,
    roleRef: 'agent-role',
    scope: 'namespace'
  });
}

function makeSecretGrant(name, subject, purpose, overrides = {}) {
  return createResource('AgentSecretGrant', { name }, {
    organizationRef: 'default',
    subject,
    secretRef: 'api-keys',
    purpose,
    ...overrides
  });
}

function makeMcpServer(name, overrides = {}) {
  return createResource('AgentMcpServer', { name }, {
    organizationRef: 'default',
    transport: 'stdio',
    scope: 'workspace',
    ...overrides
  });
}

function makeModelProviderGrant(subject) {
  return makeSecretGrant('sg-model', subject, 'model-provider');
}

const baseInput = {
  repository: 'my-repo',
  ref: 'refs/heads/main',
  actor: 'user-1',
  agentStack: 'test-stack',
  triggerSource: 'manual',
  taskKind: 'fix'
};

describe('agent permission review', () => {
  it('fully granted stack returns allowed', () => {
    const reviewer = createPermissionReviewer();
    const resources = {
      AgentStack: [makeStack('test-stack')],
      AgentServiceAccount: [makeServiceAccount('sa-agent')],
      AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-agent')],
      AgentSecretGrant: [makeModelProviderGrant('sa-agent')],
      AgentConfigGrant: [],
      AgentMcpServer: []
    };
    const result = reviewer.reviewPermissions({ ...baseInput, resources });
    assert.equal(result.decision, 'allowed');
    assert.ok(result.grants.length > 0, 'should have at least one grant');
    assert.ok(result.grants.some((g) => g.kind === 'AgentServiceAccount' && g.status === 'bound'));
    assert.ok(result.grants.some((g) => g.kind === 'AgentRoleBinding' && g.status === 'bound'));
    assert.ok(typeof result.digest === 'string' && result.digest.length > 0);
  });

  it('missing service account returns denied with missing-runtime-identity reason', () => {
    const reviewer = createPermissionReviewer();
    const resources = {
      AgentStack: [makeStack('test-stack', { serviceAccountRef: 'nonexistent-sa' })],
      AgentServiceAccount: [],
      AgentRoleBinding: [],
      AgentSecretGrant: [],
      AgentConfigGrant: [],
      AgentMcpServer: []
    };
    const result = reviewer.reviewPermissions({ ...baseInput, resources });
    assert.equal(result.decision, 'denied');
    assert.ok(result.reasons.some((r) => r.severity === 'error' && r.message.includes('Missing AgentServiceAccount')));
  });

  it('missing secret grant returns denied with missingGrants information', () => {
    const reviewer = createPermissionReviewer();
    const mcpServer = makeMcpServer('mcp-github', { secretRef: 'github-token' });
    const stack = makeStack('test-stack', {
      spec: {
        organizationRef: 'default',
        baseAgent: 'claude-code',
        adapter: 'babysitter',
        runtimeIdentity: { serviceAccountRef: 'sa-agent' },
        mcpServerRefs: ['mcp-github']
      }
    });
    const resources = {
      AgentStack: [stack],
      AgentServiceAccount: [makeServiceAccount('sa-agent')],
      AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-agent')],
      AgentSecretGrant: [],
      AgentConfigGrant: [],
      AgentMcpServer: [mcpServer]
    };
    const result = reviewer.reviewPermissions({ ...baseInput, resources });
    assert.equal(result.decision, 'denied');
    assert.ok(result.reasons.some((r) => r.severity === 'error' && r.message.includes('Missing AgentSecretGrant')));
  });

  it('grant requiring approval returns requires-approval', () => {
    const reviewer = createPermissionReviewer();
    const mcpServer = makeMcpServer('mcp-prod', { secretRef: 'prod-secret' });
    const stack = makeStack('test-stack', {
      spec: {
        organizationRef: 'default',
        baseAgent: 'claude-code',
        adapter: 'babysitter',
        runtimeIdentity: { serviceAccountRef: 'sa-agent' },
        mcpServerRefs: ['mcp-prod']
      }
    });
    const mcpGrant = makeSecretGrant('sg-prod', 'sa-agent', 'mcp-server:mcp-prod', {
      requiredApproval: 'always'
    });
    const resources = {
      AgentStack: [stack],
      AgentServiceAccount: [makeServiceAccount('sa-agent')],
      AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-agent')],
      AgentSecretGrant: [mcpGrant, makeModelProviderGrant('sa-agent')],
      AgentConfigGrant: [],
      AgentMcpServer: [mcpServer]
    };
    const result = reviewer.reviewPermissions({ ...baseInput, resources });
    assert.equal(result.decision, 'requires-approval');
    assert.ok(result.grants.some((g) => g.status === 'requires-approval' && g.requiredApproval === 'always'));
  });

  it('empty capabilities stack returns allowed', () => {
    const reviewer = createPermissionReviewer();
    const stack = makeStack('test-stack');
    const resources = {
      AgentStack: [stack],
      AgentServiceAccount: [makeServiceAccount('sa-agent')],
      AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-agent')],
      AgentSecretGrant: [makeModelProviderGrant('sa-agent')],
      AgentConfigGrant: [],
      AgentMcpServer: []
    };
    const result = reviewer.reviewPermissions({
      ...baseInput,
      toolRefs: [],
      skillRefs: [],
      mcpServerRefs: [],
      contextLabelRefs: [],
      resources
    });
    assert.equal(result.decision, 'allowed');
  });

  it('same input produces deterministic digest', () => {
    const reviewer = createPermissionReviewer();
    const resources = {
      AgentStack: [makeStack('test-stack')],
      AgentServiceAccount: [makeServiceAccount('sa-agent')],
      AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-agent')],
      AgentSecretGrant: [makeModelProviderGrant('sa-agent')],
      AgentConfigGrant: [],
      AgentMcpServer: []
    };
    const result1 = reviewer.reviewPermissions({ ...baseInput, resources });
    const result2 = reviewer.reviewPermissions({ ...baseInput, resources });
    assert.equal(result1.digest, result2.digest);
    assert.ok(typeof result1.digest === 'string' && result1.digest.length === 64, 'digest should be a 64-char hex SHA-256');
  });

  it('createPermissionSnapshot returns frozen object with timestamp', () => {
    const reviewer = createPermissionReviewer();
    const resources = {
      AgentStack: [makeStack('test-stack')],
      AgentServiceAccount: [makeServiceAccount('sa-agent')],
      AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-agent')],
      AgentSecretGrant: [makeModelProviderGrant('sa-agent')],
      AgentConfigGrant: [],
      AgentMcpServer: []
    };
    const review = reviewer.reviewPermissions({ ...baseInput, resources });
    const snapshot = reviewer.createPermissionSnapshot(review);
    assert.ok(Object.isFrozen(snapshot), 'snapshot should be frozen');
    assert.ok(typeof snapshot.snapshotAt === 'string' && snapshot.snapshotAt.length > 0, 'snapshot should have a timestamp');
    assert.equal(snapshot.frozen, true);
    assert.equal(snapshot.digest, review.digest);
    assert.equal(snapshot.decision, review.decision);
    assert.throws(() => { snapshot.decision = 'denied'; }, TypeError);
  });
});
