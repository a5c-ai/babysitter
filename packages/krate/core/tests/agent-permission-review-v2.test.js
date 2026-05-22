import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPermissionReviewer } from '../src/agent-permission-review.js';
import { createResource } from '../src/resource-model.js';

// ---------- shared helpers ----------

function makeStack(name, specOverrides = {}) {
  return createResource('AgentStack', { name }, {
    organizationRef: 'org-a',
    baseAgent: 'claude-code',
    adapter: 'babysitter',
    runtimeIdentity: { serviceAccountRef: 'sa-agent' },
    ...specOverrides
  });
}

function makeServiceAccount(name, orgRef = 'org-a') {
  return createResource('AgentServiceAccount', { name }, {
    organizationRef: orgRef,
    namespace: 'krate-agents',
    serviceAccountName: name
  });
}

function makeRoleBinding(name, subject, orgRef = 'org-a') {
  return createResource('AgentRoleBinding', { name }, {
    organizationRef: orgRef,
    subject,
    roleRef: 'agent-role',
    scope: 'namespace'
  });
}

function makeSecretGrant(name, subject, purpose, overrides = {}) {
  return createResource('AgentSecretGrant', { name }, {
    organizationRef: 'org-a',
    subject,
    secretRef: 'api-keys',
    purpose,
    ...overrides
  });
}

function makeWorkspacePolicy(name, specOverrides = {}) {
  return createResource('KrateWorkspacePolicy', { name }, {
    organizationRef: 'org-a',
    mode: 'ephemeral',
    retentionPolicy: 'delete-on-completion',
    ...specOverrides
  });
}

function fullyGrantedResources(stackOverrides = {}) {
  return {
    AgentStack: [makeStack('test-stack', stackOverrides)],
    AgentServiceAccount: [makeServiceAccount('sa-agent')],
    AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-agent')],
    AgentSecretGrant: [makeSecretGrant('sg-model', 'sa-agent', 'model-provider')],
    AgentConfigGrant: [],
    AgentMcpServer: [],
    KrateWorkspacePolicy: []
  };
}

const baseInput = {
  repository: 'org-a/my-repo',
  ref: 'refs/heads/main',
  actor: 'user-1',
  agentStack: 'test-stack',
  triggerSource: 'manual',
  taskKind: 'fix'
};

// ==========================================================
// Group 1 — Cross-org denial
// ==========================================================

describe('agent permission review v2 — cross-org denial', () => {
  it('allows access when agent org matches repository org', () => {
    const reviewer = createPermissionReviewer();
    const resources = fullyGrantedResources({ organizationRef: 'org-a' });
    const result = reviewer.reviewPermissions({
      ...baseInput,
      repository: 'org-a/my-repo',
      resources
    });
    assert.equal(result.decision, 'allowed');
    assert.ok(Array.isArray(result.crossOrgDenials), 'crossOrgDenials should be present');
    assert.equal(result.crossOrgDenials.length, 0, 'no cross-org denials expected');
  });

  it('denies access and populates crossOrgDenials when agent org differs from repository org', () => {
    const reviewer = createPermissionReviewer();
    // stack is in org-a but repository is in org-b
    const resources = fullyGrantedResources({ organizationRef: 'org-a' });
    const result = reviewer.reviewPermissions({
      ...baseInput,
      repository: 'org-b/their-repo',
      resources
    });
    assert.equal(result.decision, 'denied');
    assert.ok(Array.isArray(result.crossOrgDenials), 'crossOrgDenials must be an array');
    assert.ok(result.crossOrgDenials.length > 0, 'should have at least one cross-org denial entry');
    const denial = result.crossOrgDenials[0];
    assert.ok(denial.agentOrg, 'denial should include agentOrg');
    assert.ok(denial.resourceOrg, 'denial should include resourceOrg');
  });

  it('cross-org denial error is reflected in the reasons array with severity error', () => {
    const reviewer = createPermissionReviewer();
    const resources = fullyGrantedResources({ organizationRef: 'org-a' });
    const result = reviewer.reviewPermissions({
      ...baseInput,
      repository: 'org-z/external-repo',
      resources
    });
    assert.ok(
      result.reasons.some((r) => r.severity === 'error' && r.message.toLowerCase().includes('org')),
      'reasons should contain an error mentioning org mismatch'
    );
  });
});

// ==========================================================
// Group 2 — Approval mode validation
// ==========================================================

describe('agent permission review v2 — approval mode', () => {
  it("approvalMode 'yolo' auto-approves and decision is allowed when permissions are otherwise valid", () => {
    const reviewer = createPermissionReviewer();
    const resources = fullyGrantedResources({ approvalMode: 'yolo' });
    const result = reviewer.reviewPermissions({
      ...baseInput,
      resources
    });
    assert.equal(result.decision, 'allowed');
    assert.equal(result.approvalMode, 'yolo');
  });

  it("approvalMode 'deny' blocks all requests and returns denied", () => {
    const reviewer = createPermissionReviewer();
    const resources = fullyGrantedResources({ approvalMode: 'deny' });
    const result = reviewer.reviewPermissions({
      ...baseInput,
      resources
    });
    assert.equal(result.decision, 'denied');
    assert.equal(result.approvalMode, 'deny');
    assert.ok(
      result.reasons.some((r) => r.severity === 'error' && r.message.toLowerCase().includes('deny')),
      'reason should mention deny mode'
    );
  });

  it("approvalMode 'prompt' keeps requires-approval when grants need approval", () => {
    const reviewer = createPermissionReviewer();
    const mcpServer = createResource('AgentMcpServer', { name: 'mcp-prod' }, {
      organizationRef: 'org-a',
      transport: 'stdio',
      scope: 'workspace',
      secretRef: 'prod-secret'
    });
    const stack = makeStack('test-stack', {
      approvalMode: 'prompt',
      mcpServerRefs: ['mcp-prod']
    });
    const mcpGrant = makeSecretGrant('sg-prod', 'sa-agent', 'mcp-server:mcp-prod', {
      requiredApproval: 'always'
    });
    const resources = {
      AgentStack: [stack],
      AgentServiceAccount: [makeServiceAccount('sa-agent')],
      AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-agent')],
      AgentSecretGrant: [mcpGrant, makeSecretGrant('sg-model', 'sa-agent', 'model-provider')],
      AgentConfigGrant: [],
      AgentMcpServer: [mcpServer],
      KrateWorkspacePolicy: []
    };
    const result = reviewer.reviewPermissions({ ...baseInput, resources });
    assert.equal(result.decision, 'requires-approval');
    assert.equal(result.approvalMode, 'prompt');
  });

  it('invalid approvalMode value causes denied with validation error', () => {
    const reviewer = createPermissionReviewer();
    const resources = fullyGrantedResources({ approvalMode: 'auto-accept-everything' });
    const result = reviewer.reviewPermissions({
      ...baseInput,
      resources
    });
    assert.equal(result.decision, 'denied');
    assert.ok(
      result.reasons.some((r) => r.severity === 'error' && r.message.toLowerCase().includes('approvalmode')),
      'reasons should flag invalid approvalMode'
    );
  });
});

// ==========================================================
// Group 3 — Workspace policy enforcement
// ==========================================================

describe('agent permission review v2 — workspace policy', () => {
  it('allowed when requested tool is in workspace policy allowedTools', () => {
    const reviewer = createPermissionReviewer();
    const policy = makeWorkspacePolicy('wp-1', { allowedTools: ['bash', 'read_file'] });
    const resources = {
      ...fullyGrantedResources(),
      KrateWorkspacePolicy: [policy]
    };
    const result = reviewer.reviewPermissions({
      ...baseInput,
      workspacePolicyRef: 'wp-1',
      toolRefs: ['bash'],
      resources
    });
    assert.equal(result.decision, 'allowed');
  });

  it('denied when requested tool is in workspace policy deniedTools', () => {
    const reviewer = createPermissionReviewer();
    const policy = makeWorkspacePolicy('wp-1', { deniedTools: ['bash'] });
    const resources = {
      ...fullyGrantedResources(),
      KrateWorkspacePolicy: [policy]
    };
    const result = reviewer.reviewPermissions({
      ...baseInput,
      workspacePolicyRef: 'wp-1',
      toolRefs: ['bash'],
      resources
    });
    assert.equal(result.decision, 'denied');
    assert.ok(
      result.reasons.some((r) => r.severity === 'error' && r.message.toLowerCase().includes('denied')),
      'reason should mention denied tool'
    );
  });

  it('denied when maxConcurrentSessions is 0 (no sessions allowed by policy)', () => {
    const reviewer = createPermissionReviewer();
    const policy = makeWorkspacePolicy('wp-strict', { maxConcurrentSessions: 0 });
    const resources = {
      ...fullyGrantedResources(),
      KrateWorkspacePolicy: [policy]
    };
    const result = reviewer.reviewPermissions({
      ...baseInput,
      workspacePolicyRef: 'wp-strict',
      resources
    });
    assert.equal(result.decision, 'denied');
    assert.ok(
      result.reasons.some((r) => r.severity === 'error' && r.message.toLowerCase().includes('maxconcurrentsessions')),
      'reason should mention maxConcurrentSessions'
    );
  });
});

// ==========================================================
// Group 4 — Untrusted fork detection
// ==========================================================

describe('agent permission review v2 — untrusted fork detection', () => {
  it('no untrustedForkWarnings when ref is from the canonical repository', () => {
    const reviewer = createPermissionReviewer();
    const resources = fullyGrantedResources();
    const result = reviewer.reviewPermissions({
      ...baseInput,
      repository: 'org-a/my-repo',
      ref: 'refs/heads/main',
      resources
    });
    assert.ok(Array.isArray(result.untrustedForkWarnings), 'untrustedForkWarnings must be present');
    assert.equal(result.untrustedForkWarnings.length, 0);
  });

  it('untrustedForkWarnings populated when ref indicates a fork (refs/pull/*/head from external fork)', () => {
    const reviewer = createPermissionReviewer();
    // A pull_request ref from a fork is commonly refs/pull/<n>/head where the head sha is from a fork
    const resources = fullyGrantedResources();
    const result = reviewer.reviewPermissions({
      ...baseInput,
      repository: 'org-a/my-repo',
      ref: 'refs/pull/42/head',
      isFork: true,
      resources
    });
    assert.ok(Array.isArray(result.untrustedForkWarnings), 'untrustedForkWarnings must be present');
    assert.ok(result.untrustedForkWarnings.length > 0, 'should have at least one fork warning');
  });

  it('privileged grants (ServiceAccount, Secret) are blocked for untrusted forks', () => {
    const reviewer = createPermissionReviewer();
    const resources = fullyGrantedResources();
    const result = reviewer.reviewPermissions({
      ...baseInput,
      repository: 'org-a/my-repo',
      ref: 'refs/pull/99/head',
      isFork: true,
      resources
    });
    // Privileged grants that existed should not be in the approved grants list
    // or the decision should downgrade
    const hasPrivilegedGrant = result.grants.some(
      (g) => (g.kind === 'AgentServiceAccount' || g.kind === 'AgentSecretGrant') && g.status === 'granted'
    );
    // Either the grants are stripped or decision is denied/requires-approval
    const isRestricted = !hasPrivilegedGrant || result.decision === 'denied' || result.decision === 'requires-approval';
    assert.ok(isRestricted, 'privileged grants must not be silently approved for untrusted forks');
    assert.ok(
      result.untrustedForkWarnings.some((w) => w.blockedKinds && w.blockedKinds.length > 0),
      'fork warning should list blocked kinds'
    );
  });
});
