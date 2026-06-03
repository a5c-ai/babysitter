/**
 * Validator Edge Cases — Test validateResource from core resource-model.js
 * against adversarial inputs (empty strings, wrong types, arrays, nulls, extras).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = path.resolve(webRoot, '..', 'core');
const resourceModelUrl = pathToFileURL(path.join(coreRoot, 'src', 'resource-model.js')).href;
const { validateResource } = await import(resourceModelUrl);

// Helper: minimal valid Organization resource
function validOrg(overrides = {}) {
  return {
    kind: 'Organization',
    metadata: { name: 'test-org' },
    spec: { displayName: 'Test Org', namespaceName: 'kradle-org-test' },
    status: {},
    ...overrides,
  };
}

// ── Empty string required field ─────────────────────────────────────────────

test('empty string required field throws', () => {
  assert.throws(
    () => validateResource({
      kind: 'Organization',
      metadata: { name: 'test-org' },
      spec: { displayName: '', namespaceName: 'kradle-org-test' },
      status: {},
    }),
    /displayName is required/
  );
});

// ── Wrong type: string for number ───────────────────────────────────────────

test('string value for numeric field throws with type message', () => {
  assert.throws(
    () => validateResource({
      kind: 'RunnerPool',
      metadata: { name: 'pool-1' },
      spec: { organizationRef: 'default', warmReplicas: 'three', maxReplicas: 5 },
      status: {},
    }),
    /must be a number/
  );
});

// ── Array where object expected ─────────────────────────────────────────────

test('array where object expected throws', () => {
  assert.throws(
    () => validateResource({
      kind: 'AgentStack',
      metadata: { name: 'stack-1' },
      spec: { organizationRef: 'default', baseAgent: 'claude-code', adapter: 'default', runtimeIdentity: ['not', 'an', 'object'] },
      status: {},
    }),
    /must be an object.*got array/
  );
});

// ── Extra unknown fields do NOT throw ───────────────────────────────────────

test('extra unknown fields in spec does not throw', () => {
  const resource = validOrg();
  resource.spec.extraField = 'should-be-ignored';
  resource.spec.anotherUnknown = 42;
  const result = validateResource(resource);
  assert.ok(result, 'should return the resource without error');
  assert.strictEqual(result.spec.extraField, 'should-be-ignored');
});

// ── Null spec field ─────────────────────────────────────────────────────────

test('null spec field throws', () => {
  assert.throws(
    () => validateResource({
      kind: 'Organization',
      metadata: { name: 'test-org' },
      spec: { displayName: null, namespaceName: 'kradle-org-test' },
      status: {},
    }),
    /displayName is required/
  );
});

// ── Valid resource with all required fields ──────────────────────────────────

test('valid resource with all required fields returns resource', () => {
  const resource = validOrg();
  const result = validateResource(resource);
  assert.ok(result, 'should return the resource');
  assert.strictEqual(result.kind, 'Organization');
  assert.strictEqual(result.metadata.name, 'test-org');
  assert.strictEqual(result.spec.displayName, 'Test Org');
});

// ── Non-object resource throws ──────────────────────────────────────────────

test('non-object resource throws', () => {
  assert.throws(
    () => validateResource(null),
    /resource must be an object/
  );
  assert.throws(
    () => validateResource('not-an-object'),
    /resource must be an object/
  );
});

// ── Missing metadata.name throws ────────────────────────────────────────────

test('missing metadata.name throws', () => {
  assert.throws(
    () => validateResource({
      kind: 'Organization',
      metadata: {},
      spec: { displayName: 'Test Org', namespaceName: 'kradle-org-test' },
      status: {},
    }),
    /metadata\.name is required/
  );
});

// ── String value where array expected ───────────────────────────────────────

test('string value where array expected throws', () => {
  assert.throws(
    () => validateResource({
      kind: 'AgentTriggerRule',
      metadata: { name: 'rule-1' },
      spec: { organizationRef: 'default', sources: 'not-an-array', agentStack: 'stack-1', taskKind: 'review' },
      status: {},
    }),
    /must be an array/
  );
});

// ── Numeric metadata.name throws ───────────────────────────────────────

test('resource with numeric metadata.name throws', () => {
  assert.throws(
    () => validateResource({
      kind: 'Organization',
      metadata: { name: 42 },
      spec: { displayName: 'Test Org', namespaceName: 'kradle-org-test' },
      status: {},
    }),
    /metadata\.name must be a string/
  );
});

// ── Kind not in ALL_KINDS throws ───────────────────────────────────────

test('resource with kind not in ALL_KINDS throws', () => {
  assert.throws(
    () => validateResource({
      kind: 'FakeKind',
      metadata: { name: 'test' },
      spec: {},
      status: {},
    }),
    /Unknown Kradle resource kind/
  );
});

// ── AgentTriggerRule with non-array sources throws ─────────────────────

test('AgentTriggerRule with non-array sources throws type error', () => {
  assert.throws(
    () => validateResource({
      kind: 'AgentTriggerRule',
      metadata: { name: 'rule-type-err' },
      spec: { organizationRef: 'default', sources: { webhook: true }, agentStack: 'stack-1', taskKind: 'review' },
      status: {},
    }),
    /must be an array/
  );
});

// ── KradleVirtualModel with non-array routes throws ─────────────────────

test('KradleVirtualModel with non-array routes throws type error', () => {
  assert.throws(
    () => validateResource({
      kind: 'KradleVirtualModel',
      metadata: { name: 'vm-bad-routes' },
      spec: { organizationRef: 'default', modelName: 'gpt-4', routes: 'route-a' },
      status: {},
    }),
    /must be an array/
  );
});

// ── validateResource returns the resource object on success ────────────

test('validateResource returns the resource object on success', () => {
  const resource = {
    kind: 'Organization',
    metadata: { name: 'ret-test' },
    spec: { displayName: 'Return Test', namespaceName: 'kradle-org-ret' },
    status: {},
  };
  const result = validateResource(resource);
  assert.strictEqual(result, resource, 'should return the same resource object reference');
  assert.strictEqual(result.kind, 'Organization');
  assert.strictEqual(result.metadata.name, 'ret-test');
});
