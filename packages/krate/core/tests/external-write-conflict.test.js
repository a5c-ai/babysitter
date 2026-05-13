import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWriteController,
  getIdempotencyKey,
  validateWriteIntent
} from '../src/external/write-controller.js';
import {
  createConflictController,
  validateConflict
} from '../src/external/conflict-controller.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 3.5 — Write & Conflict Controllers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWriteController() {
  return createWriteController();
}

function makeConflictController() {
  return createConflictController();
}

function makeWriteIntentInput(overrides = {}) {
  return {
    interfaceKey: 'issueTracking',
    operation: 'createIssue',
    payload: { title: 'Test Issue', body: 'desc' },
    resourceRef: 'org/repo#issue-1',
    requiresApproval: true,
    maxRetries: 3,
    ...overrides
  };
}

function makeConflictInput(overrides = {}) {
  return {
    resourceRef: 'org/repo#issue-1',
    fieldPath: 'spec.title',
    localValue: 'Local Title',
    externalValue: 'External Title',
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// WRITE CONTROLLER TESTS
// ---------------------------------------------------------------------------

// Test 1
test('createWriteIntent creates intent with PendingApproval status when approval is required', () => {
  const controller = makeWriteController();
  const result = controller.createWriteIntent(makeWriteIntentInput({ requiresApproval: true }));

  assert.ok(result.intent, 'must return an intent object');
  assert.equal(result.intent.status.phase, 'PendingApproval', 'phase must be PendingApproval when approval required');
  assert.ok(result.intent.metadata?.name, 'intent must have a name');
  assert.equal(result.intent.spec.interfaceKey, 'issueTracking', 'spec must contain interfaceKey');
  assert.equal(result.intent.spec.operation, 'createIssue', 'spec must contain operation');
});

// Test 2
test('createWriteIntent with no approval required starts as ReadyToSend', () => {
  const controller = makeWriteController();
  const result = controller.createWriteIntent(makeWriteIntentInput({ requiresApproval: false }));

  assert.ok(result.intent, 'must return an intent object');
  assert.equal(result.intent.status.phase, 'ReadyToSend', 'phase must be ReadyToSend when no approval required');
});

// Test 3
test('approveWriteIntent transitions PendingApproval intent to ReadyToSend', () => {
  const controller = makeWriteController();
  const { intent } = controller.createWriteIntent(makeWriteIntentInput({ requiresApproval: true }));
  assert.equal(intent.status.phase, 'PendingApproval');

  const result = controller.approveWriteIntent({ intentName: intent.metadata.name, approvedBy: 'user-1', resources: { ExternalWriteIntent: [intent] } });

  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.equal(result.intent.status.phase, 'ReadyToSend', 'approved intent must be ReadyToSend');
  assert.equal(result.intent.status.approvedBy, 'user-1', 'must record approver');
});

// Test 4
test('rejectWriteIntent transitions PendingApproval intent to Rejected', () => {
  const controller = makeWriteController();
  const { intent } = controller.createWriteIntent(makeWriteIntentInput({ requiresApproval: true }));

  const result = controller.rejectWriteIntent({ intentName: intent.metadata.name, rejectedBy: 'user-2', reason: 'not allowed', resources: { ExternalWriteIntent: [intent] } });

  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.equal(result.intent.status.phase, 'Rejected', 'rejected intent must be Rejected');
  assert.equal(result.intent.status.rejectedBy, 'user-2', 'must record rejecter');
  assert.equal(result.intent.status.rejectionReason, 'not allowed', 'must record rejection reason');
});

// Test 5
test('executeWriteIntent transitions to Sending then Succeeded on success', async () => {
  const controller = makeWriteController();
  const { intent } = controller.createWriteIntent(makeWriteIntentInput({ requiresApproval: false }));
  assert.equal(intent.status.phase, 'ReadyToSend');

  const phases = [];
  const result = await controller.executeWriteIntent({
    intentName: intent.metadata.name,
    resources: { ExternalWriteIntent: [intent] },
    executor: async () => ({ id: 'issue-123', url: 'https://example.com/issue/123' }),
    onPhaseChange: (phase) => phases.push(phase)
  });

  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.equal(result.intent.status.phase, 'Succeeded', 'succeeded intent must be Succeeded');
  assert.ok(phases.includes('Sending'), 'must pass through Sending phase');
  assert.ok(result.intent.status.externalResult, 'must record external result');
});

// Test 6
test('executeWriteIntent with failure transitions to Retrying', async () => {
  const controller = makeWriteController();
  const { intent } = controller.createWriteIntent(makeWriteIntentInput({ requiresApproval: false, maxRetries: 3 }));

  let callCount = 0;
  const result = await controller.executeWriteIntent({
    intentName: intent.metadata.name,
    resources: { ExternalWriteIntent: [intent] },
    executor: async () => {
      callCount++;
      if (callCount === 1) throw new Error('transient failure');
      return { id: 'issue-456' };
    }
  });

  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.equal(result.intent.status.phase, 'Succeeded', 'must eventually succeed after retry');
  assert.ok(result.intent.status.retryCount >= 1, 'must record retry count');
});

// Test 7
test('executeWriteIntent respects maxRetries and transitions to Failed when exhausted', async () => {
  const controller = makeWriteController();
  const { intent } = controller.createWriteIntent(makeWriteIntentInput({ requiresApproval: false, maxRetries: 2 }));

  const result = await controller.executeWriteIntent({
    intentName: intent.metadata.name,
    resources: { ExternalWriteIntent: [intent] },
    executor: async () => { throw new Error('permanent failure'); }
  });

  assert.ok(!result.error || result.intent, 'must return intent even on failure');
  assert.equal(result.intent.status.phase, 'Failed', 'must be Failed after exhausting retries');
  assert.ok(result.intent.status.retryCount >= 2, 'must record exhausted retries');
  assert.ok(result.intent.status.lastError, 'must record last error');
});

// Test 8
test('getIdempotencyKey generates consistent key for same operation', () => {
  const input = { interfaceKey: 'issueTracking', operation: 'createIssue', resourceRef: 'org/repo#issue-1', payload: { title: 'Test' } };
  const key1 = getIdempotencyKey(input);
  const key2 = getIdempotencyKey(input);

  assert.equal(typeof key1, 'string', 'key must be a string');
  assert.ok(key1.length > 0, 'key must be non-empty');
  assert.equal(key1, key2, 'same input must produce same key');
});

// Test 9 (bonus: different inputs → different keys)
test('getIdempotencyKey generates different keys for different operations', () => {
  const input1 = { interfaceKey: 'issueTracking', operation: 'createIssue', resourceRef: 'org/repo#issue-1', payload: { title: 'A' } };
  const input2 = { interfaceKey: 'issueTracking', operation: 'createIssue', resourceRef: 'org/repo#issue-2', payload: { title: 'B' } };
  const key1 = getIdempotencyKey(input1);
  const key2 = getIdempotencyKey(input2);

  assert.notEqual(key1, key2, 'different resourceRefs must produce different keys');
});

// Test 10
test('validateWriteIntent rejects missing interfaceKey', () => {
  const result = validateWriteIntent({ operation: 'createIssue', payload: {}, resourceRef: 'org/repo#1' });

  assert.equal(result.valid, false, 'must be invalid');
  assert.ok(result.errors.some((e) => /interface/i.test(e)), 'error must mention interfaceKey');
});

// Test 11
test('validateWriteIntent rejects missing operation', () => {
  const result = validateWriteIntent({ interfaceKey: 'issueTracking', payload: {}, resourceRef: 'org/repo#1' });

  assert.equal(result.valid, false, 'must be invalid');
  assert.ok(result.errors.some((e) => /operation/i.test(e)), 'error must mention operation');
});

// Test 12 (bonus)
test('validateWriteIntent accepts a complete valid intent input', () => {
  const result = validateWriteIntent(makeWriteIntentInput());

  assert.equal(result.valid, true, 'valid input must pass validation');
  assert.equal(result.errors.length, 0, 'no errors for valid input');
});

// ---------------------------------------------------------------------------
// CONFLICT CONTROLLER TESTS
// ---------------------------------------------------------------------------

// Test 13
test('detectConflict creates conflict when local and external values differ', () => {
  const controller = makeConflictController();
  const result = controller.detectConflict(makeConflictInput({ localValue: 'A', externalValue: 'B' }));

  assert.ok(result.conflict, 'must return a conflict');
  assert.equal(result.conflict.status.phase, 'Open', 'new conflict must be Open');
  assert.equal(result.conflict.spec.localValue, 'A', 'must record local value');
  assert.equal(result.conflict.spec.externalValue, 'B', 'must record external value');
  assert.equal(result.conflict.spec.fieldPath, 'spec.title', 'must record fieldPath');
  assert.equal(result.conflict.spec.resourceRef, 'org/repo#issue-1', 'must record resourceRef');
});

// Test 14
test('detectConflict returns null when local and external values match', () => {
  const controller = makeConflictController();
  const result = controller.detectConflict(makeConflictInput({ localValue: 'Same', externalValue: 'Same' }));

  assert.equal(result.conflict, null, 'no conflict when values match');
});

// Test 15
test('resolveConflict with prefer-external strategy updates local value', () => {
  const controller = makeConflictController();
  const { conflict } = controller.detectConflict(makeConflictInput({ localValue: 'Local', externalValue: 'External' }));

  const result = controller.resolveConflict({
    conflictName: conflict.metadata.name,
    strategy: 'prefer-external',
    resources: { ExternalSyncConflict: [conflict] }
  });

  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.equal(result.conflict.status.phase, 'Resolved', 'conflict must be Resolved');
  assert.equal(result.resolution.chosenValue, 'External', 'chosen value must be external value');
  assert.equal(result.resolution.strategy, 'prefer-external', 'must record strategy');
});

// Test 16
test('resolveConflict with prefer-krate strategy keeps local value', () => {
  const controller = makeConflictController();
  const { conflict } = controller.detectConflict(makeConflictInput({ localValue: 'Local', externalValue: 'External' }));

  const result = controller.resolveConflict({
    conflictName: conflict.metadata.name,
    strategy: 'prefer-krate',
    resources: { ExternalSyncConflict: [conflict] }
  });

  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.equal(result.conflict.status.phase, 'Resolved', 'conflict must be Resolved');
  assert.equal(result.resolution.chosenValue, 'Local', 'chosen value must be local value');
});

// Test 17
test('resolveConflict with manual strategy requires explicit resolution value', () => {
  const controller = makeConflictController();
  const { conflict } = controller.detectConflict(makeConflictInput({ localValue: 'Local', externalValue: 'External' }));

  const result = controller.resolveConflict({
    conflictName: conflict.metadata.name,
    strategy: 'manual',
    resolvedValue: 'ManualChoice',
    resources: { ExternalSyncConflict: [conflict] }
  });

  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.equal(result.conflict.status.phase, 'Resolved', 'conflict must be Resolved');
  assert.equal(result.resolution.chosenValue, 'ManualChoice', 'chosen value must be manually provided value');
});

// Test 18
test('resolveConflict with ignore strategy marks conflict as Ignored', () => {
  const controller = makeConflictController();
  const { conflict } = controller.detectConflict(makeConflictInput());

  const result = controller.resolveConflict({
    conflictName: conflict.metadata.name,
    strategy: 'ignore',
    resources: { ExternalSyncConflict: [conflict] }
  });

  assert.ok(!result.error, `must not error: ${result.message}`);
  assert.equal(result.conflict.status.phase, 'Ignored', 'conflict must be Ignored');
});

// Test 19
test('supersededCheck marks old conflicts as Superseded when new sync arrives for same resource+field', () => {
  const controller = makeConflictController();
  const { conflict: old1 } = controller.detectConflict(makeConflictInput({ localValue: 'v1', externalValue: 'v2' }));
  const { conflict: old2 } = controller.detectConflict(makeConflictInput({ localValue: 'v2', externalValue: 'v3' }));

  const result = controller.supersededCheck({
    resourceRef: 'org/repo#issue-1',
    fieldPath: 'spec.title',
    resources: { ExternalSyncConflict: [old1, old2] }
  });

  assert.ok(Array.isArray(result.superseded), 'must return array of superseded conflicts');
  assert.ok(result.superseded.length >= 1, 'must mark at least one conflict as Superseded');
  assert.ok(result.superseded.every((c) => c.status.phase === 'Superseded'), 'all returned items must be Superseded');
});

// Test 20
test('getOpenConflicts returns only Open (non-resolved) conflicts', () => {
  const controller = makeConflictController();
  const { conflict: c1 } = controller.detectConflict(makeConflictInput({ localValue: 'A', externalValue: 'B', fieldPath: 'spec.title' }));
  const { conflict: c2 } = controller.detectConflict(makeConflictInput({ localValue: 'X', externalValue: 'Y', fieldPath: 'spec.body' }));

  // Resolve c2
  const resolved = controller.resolveConflict({
    conflictName: c2.metadata.name,
    strategy: 'prefer-external',
    resources: { ExternalSyncConflict: [c1, c2] }
  });

  const openResult = controller.getOpenConflicts({ resources: { ExternalSyncConflict: [c1, resolved.conflict] } });
  assert.ok(Array.isArray(openResult.conflicts), 'must return an array');
  assert.equal(openResult.conflicts.length, 1, 'must return exactly one open conflict');
  assert.equal(openResult.conflicts[0].metadata.name, c1.metadata.name, 'must return the open conflict');
});

// Test 21
test('validateConflict rejects missing resourceRef', () => {
  const result = validateConflict({ fieldPath: 'spec.title', localValue: 'A', externalValue: 'B' });

  assert.equal(result.valid, false, 'must be invalid');
  assert.ok(result.errors.some((e) => /resourceRef/i.test(e)), 'error must mention resourceRef');
});

// Test 22 (bonus)
test('validateConflict rejects missing fieldPath', () => {
  const result = validateConflict({ resourceRef: 'org/repo#1', localValue: 'A', externalValue: 'B' });

  assert.equal(result.valid, false, 'must be invalid');
  assert.ok(result.errors.some((e) => /fieldPath/i.test(e)), 'error must mention fieldPath');
});

// Test 23 (bonus)
test('validateConflict accepts valid conflict input', () => {
  const result = validateConflict(makeConflictInput());

  assert.equal(result.valid, true, 'valid conflict input must pass');
  assert.equal(result.errors.length, 0, 'no errors for valid input');
});
