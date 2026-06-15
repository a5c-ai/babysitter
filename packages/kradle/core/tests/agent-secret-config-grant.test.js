import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAgentSecretGrantController,
  createAgentConfigGrantController,
  validateAgentSecretGrant,
  validateAgentConfigGrant,
  listGrantsForAgent,
  revokeGrant
} from '../src/agent-secret-config-grant-controller.js';

// ---------------------------------------------------------------------------
// validateAgentSecretGrant
// ---------------------------------------------------------------------------

test('validateAgentSecretGrant returns valid for complete input', () => {
  const result = validateAgentSecretGrant({
    name: 'grant-db-password',
    orgRef: 'acme',
    secretName: 'db-password',
    grantedTo: 'agent-stack-1',
    permissions: ['read']
  });
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateAgentSecretGrant rejects missing name', () => {
  const result = validateAgentSecretGrant({
    orgRef: 'acme',
    secretName: 'db-password',
    grantedTo: 'agent-stack-1',
    permissions: ['read']
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('name')));
});

test('validateAgentSecretGrant rejects invalid permissions', () => {
  const result = validateAgentSecretGrant({
    name: 'grant-1',
    orgRef: 'acme',
    secretName: 'db-password',
    grantedTo: 'agent-stack-1',
    permissions: ['delete']
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('invalid permissions')));
});

test('validateAgentSecretGrant rejects empty permissions array', () => {
  const result = validateAgentSecretGrant({
    name: 'grant-1',
    orgRef: 'acme',
    secretName: 'db-password',
    grantedTo: 'agent-stack-1',
    permissions: []
  });
  assert.equal(result.valid, false);
});

// ---------------------------------------------------------------------------
// validateAgentConfigGrant
// ---------------------------------------------------------------------------

test('validateAgentConfigGrant returns valid for complete input', () => {
  const result = validateAgentConfigGrant({
    name: 'grant-app-config',
    orgRef: 'acme',
    configMapName: 'app-config',
    grantedTo: 'agent-stack-2'
  });
  assert.equal(result.valid, true);
});

test('validateAgentConfigGrant rejects missing configMapName', () => {
  const result = validateAgentConfigGrant({
    name: 'grant-1',
    orgRef: 'acme',
    grantedTo: 'agent-stack-2'
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('configMapName')));
});

// ---------------------------------------------------------------------------
// createAgentSecretGrantController
// ---------------------------------------------------------------------------

test('createSecretGrant creates AgentSecretGrant resource with Active status', () => {
  const controller = createAgentSecretGrantController();
  const result = controller.createSecretGrant({
    name: 'grant-api-key',
    orgRef: 'acme',
    secretName: 'api-key',
    grantedTo: 'agent-stack-1',
    permissions: ['read', 'mount']
  });

  assert.ok(!result.error, 'Should succeed');
  assert.ok(result.grant, 'Should return a grant resource');
  assert.equal(result.grant.kind, 'AgentSecretGrant');
  assert.equal(result.grant.status.phase, 'Active');
  assert.equal(result.grant.spec.secretName, 'api-key');
  assert.equal(result.grant.spec.grantedTo, 'agent-stack-1');
  assert.deepEqual(result.grant.spec.permissions, ['read', 'mount']);
});

test('createSecretGrant returns error for invalid input', () => {
  const controller = createAgentSecretGrantController();
  const result = controller.createSecretGrant({
    name: '',
    orgRef: 'acme',
    secretName: 'key',
    grantedTo: 'agent-1',
    permissions: ['read']
  });
  assert.ok(result.error, 'Should return an error');
  assert.ok(result.message);
});

test('createSecretGrant calls persistFn', async () => {
  const persisted = [];
  const controller = createAgentSecretGrantController({ persistFn: (r) => persisted.push(r) });
  controller.createSecretGrant({
    name: 'grant-persist-test',
    orgRef: 'acme',
    secretName: 'my-secret',
    grantedTo: 'agent-stack-1',
    permissions: ['read']
  });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].kind, 'AgentSecretGrant');
});

// ---------------------------------------------------------------------------
// createAgentConfigGrantController
// ---------------------------------------------------------------------------

test('createConfigGrant creates AgentConfigGrant resource with Active status', () => {
  const controller = createAgentConfigGrantController();
  const result = controller.createConfigGrant({
    name: 'grant-app-cfg',
    orgRef: 'acme',
    configMapName: 'app-config',
    grantedTo: 'agent-stack-2'
  });

  assert.ok(!result.error, 'Should succeed');
  assert.ok(result.grant, 'Should return a grant resource');
  assert.equal(result.grant.kind, 'AgentConfigGrant');
  assert.equal(result.grant.status.phase, 'Active');
  assert.equal(result.grant.spec.configMapName, 'app-config');
  assert.equal(result.grant.spec.grantedTo, 'agent-stack-2');
});

test('createConfigGrant returns error for invalid input', () => {
  const controller = createAgentConfigGrantController();
  const result = controller.createConfigGrant({
    name: 'grant-bad',
    orgRef: 'acme',
    configMapName: '',
    grantedTo: 'agent-1'
  });
  assert.ok(result.error, 'Should return an error');
});

// ---------------------------------------------------------------------------
// listGrantsForAgent
// ---------------------------------------------------------------------------

test('listGrantsForAgent filters by grantedTo field', () => {
  const grants = [
    { metadata: { name: 'g1' }, spec: { grantedTo: 'agent-1' } },
    { metadata: { name: 'g2' }, spec: { grantedTo: 'agent-2' } },
    { metadata: { name: 'g3' }, spec: { grantedTo: 'agent-1' } }
  ];
  const result = listGrantsForAgent(grants, 'agent-1');
  assert.equal(result.length, 2);
  assert.ok(result.every((g) => g.spec.grantedTo === 'agent-1'));
});

test('listGrantsForAgent returns empty array for unknown agent', () => {
  const grants = [{ metadata: { name: 'g1' }, spec: { grantedTo: 'agent-1' } }];
  const result = listGrantsForAgent(grants, 'agent-unknown');
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// revokeGrant
// ---------------------------------------------------------------------------

test('revokeGrant transitions grant phase to Revoked', () => {
  const grants = [
    { metadata: { name: 'grant-1' }, spec: { secretName: 'key' }, status: { phase: 'Active' } }
  ];
  const result = revokeGrant(grants, 'grant-1');
  assert.ok(!result.error, 'Should succeed');
  assert.equal(result.grant.status.phase, 'Revoked');
  assert.ok(result.grant.status.revokedAt, 'Should set revokedAt timestamp');
});

test('revokeGrant returns error for unknown grant name', () => {
  const result = revokeGrant([], 'nonexistent-grant');
  assert.ok(result.error, 'Should return an error');
  assert.equal(result.reason, 'not-found');
});

test('revokeGrant returns error for already-revoked grant', () => {
  const grants = [
    { metadata: { name: 'grant-already' }, spec: {}, status: { phase: 'Revoked', revokedAt: new Date().toISOString() } }
  ];
  const result = revokeGrant(grants, 'grant-already');
  assert.ok(result.error, 'Should return an error');
  assert.equal(result.reason, 'already-revoked');
});

test('controller.revokeGrant works end-to-end via secret grant controller', () => {
  const controller = createAgentSecretGrantController();
  const { grant } = controller.createSecretGrant({
    name: 'grant-to-revoke',
    orgRef: 'acme',
    secretName: 'my-key',
    grantedTo: 'agent-stack-1',
    permissions: ['read']
  });
  const result = controller.revokeGrant('grant-to-revoke', [grant]);
  assert.ok(!result.error, 'Should succeed');
  assert.equal(result.grant.status.phase, 'Revoked');
});
