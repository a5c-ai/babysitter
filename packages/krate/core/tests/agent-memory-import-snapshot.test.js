/**
 * Tests for agent-memory-import.js — Slice 2.3c
 *
 * Covers:
 *  - parseJournalForImport: key event extraction, summary shape, effect results, empty journal,
 *    summary-only mode (no raw task content)
 *  - validateMemoryImport: valid import, missing runId
 *  - createMemorySnapshot: basic snapshot with timestamp and record refs, query criteria filtering
 *  - validateMemorySnapshot: missing sessionRef
 *  - validateOntology (standalone): valid ontology, empty nodeKinds, duplicate nodeKind names
 *  - getOntologyNodeKinds: returns nodeKinds from spec
 *  - getOntologyEdgeKinds: returns edgeKinds from spec
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseJournalForImport,
  validateMemoryImport,
  createMemorySnapshot,
  validateMemorySnapshot,
  validateOntology,
  getOntologyNodeKinds,
  getOntologyEdgeKinds,
} from '../src/agent-memory-import.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeJournal() {
  return [
    {
      type: 'run_start',
      runId: 'run-abc123',
      processId: 'proc-deploy-v2',
      timestamp: '2026-05-13T10:00:00Z',
    },
    {
      type: 'task_completed',
      taskId: 'task-1',
      title: 'Build Docker image',
      status: 'success',
      timestamp: '2026-05-13T10:05:00Z',
      effect: { kind: 'docker-build', result: 'success', image: 'myapp:v2' },
    },
    {
      type: 'task_completed',
      taskId: 'task-2',
      title: 'Run tests',
      status: 'success',
      timestamp: '2026-05-13T10:08:00Z',
      effect: { kind: 'test-run', result: 'success', passed: 42, failed: 0 },
    },
    {
      type: 'task_completed',
      taskId: 'task-3',
      title: 'Deploy to staging',
      status: 'failure',
      timestamp: '2026-05-13T10:12:00Z',
      effect: { kind: 'deployment', result: 'failure', reason: 'timeout' },
    },
    {
      type: 'breakpoint',
      reason: 'Awaiting approval for production deploy',
      timestamp: '2026-05-13T10:13:00Z',
    },
    {
      type: 'run_end',
      status: 'partial',
      timestamp: '2026-05-13T10:20:00Z',
    },
  ];
}

function makeOntologySpec() {
  return {
    name: 'acme-ontology',
    organizationRef: 'acme',
    nodeKinds: [
      { name: 'Service', description: 'A microservice' },
      { name: 'Team', description: 'An engineering team' },
      { name: 'Runbook', description: 'A runbook document' },
    ],
    edgeKinds: [
      { name: 'depends-on', description: 'Service dependency' },
      { name: 'owned-by', description: 'Ownership relation' },
      { name: 'references', description: 'Documentation reference' },
    ],
  };
}

// ---------------------------------------------------------------------------
// parseJournalForImport tests
// ---------------------------------------------------------------------------

test('parseJournalForImport extracts key events from a journal array', () => {
  const journal = makeJournal();
  const result = parseJournalForImport(journal);

  assert.ok(result, 'result must be truthy');
  assert.ok(Array.isArray(result.keyEvents), 'result must have keyEvents array');
  // Should include run_start, task_completed events, breakpoints, run_end
  const eventTypes = result.keyEvents.map(e => e.type);
  assert.ok(eventTypes.includes('run_start'), 'must include run_start event');
  assert.ok(eventTypes.includes('task_completed'), 'must include task_completed events');
  assert.ok(eventTypes.includes('run_end'), 'must include run_end event');
});

test('parseJournalForImport returns summary with runId, processId, eventCount, duration', () => {
  const journal = makeJournal();
  const result = parseJournalForImport(journal);

  assert.ok(result.summary, 'result must have summary object');
  assert.equal(result.summary.runId, 'run-abc123', 'summary.runId must match journal run_start');
  assert.equal(result.summary.processId, 'proc-deploy-v2', 'summary.processId must match journal run_start');
  assert.ok(typeof result.summary.eventCount === 'number', 'summary.eventCount must be a number');
  assert.ok(result.summary.eventCount > 0, 'summary.eventCount must be positive');
  assert.ok(typeof result.summary.durationMs === 'number', 'summary.durationMs must be a number');
  assert.ok(result.summary.durationMs > 0, 'summary.durationMs must be positive (start to end)');
});

test('parseJournalForImport extracts effect results (success/failure counts)', () => {
  const journal = makeJournal();
  const result = parseJournalForImport(journal);

  assert.ok(result.effectSummary, 'result must have effectSummary');
  assert.equal(typeof result.effectSummary.successCount, 'number', 'effectSummary.successCount must be a number');
  assert.equal(typeof result.effectSummary.failureCount, 'number', 'effectSummary.failureCount must be a number');
  // 2 successes (docker-build, test-run), 1 failure (deployment)
  assert.equal(result.effectSummary.successCount, 2, 'should count 2 successful effects');
  assert.equal(result.effectSummary.failureCount, 1, 'should count 1 failed effect');
});

test('parseJournalForImport handles empty journal', () => {
  const result = parseJournalForImport([]);

  assert.ok(result, 'result must be truthy for empty journal');
  assert.ok(Array.isArray(result.keyEvents), 'keyEvents must be an array');
  assert.equal(result.keyEvents.length, 0, 'keyEvents must be empty for empty journal');
  assert.ok(result.summary, 'summary must be present');
  assert.equal(result.summary.eventCount, 0, 'eventCount must be 0 for empty journal');
  assert.equal(result.summary.runId, null, 'runId must be null for empty journal');
  assert.equal(result.summary.processId, null, 'processId must be null for empty journal');
  assert.equal(result.summary.durationMs, 0, 'durationMs must be 0 for empty journal');
  assert.ok(result.effectSummary, 'effectSummary must be present');
  assert.equal(result.effectSummary.successCount, 0, 'effectSummary.successCount must be 0 for empty journal');
  assert.equal(result.effectSummary.failureCount, 0, 'effectSummary.failureCount must be 0 for empty journal');
});

test('parseJournalForImport filters to summary-only mode (no raw task content)', () => {
  const journal = makeJournal();
  const result = parseJournalForImport(journal);

  // Summary-only mode: keyEvents must not include raw task content/body
  // Each keyEvent should only contain structural fields (type, timestamp, taskId, status, effectKind)
  // — NOT inline effect details or user-visible content strings from task execution
  for (const event of result.keyEvents) {
    if (event.type === 'task_completed') {
      // Should have structured fields but NOT the raw effect object with arbitrary content
      assert.ok(!('rawContent' in event), 'keyEvent must not include rawContent');
      // effect data (if present) should be summarized, not the full effect object
      if ('effect' in event) {
        // effect should be stripped of arbitrary nested data — only kind and result allowed
        const effectKeys = Object.keys(event.effect);
        assert.ok(effectKeys.every(k => ['kind', 'result'].includes(k)),
          'effect in keyEvent must only contain kind and result (no arbitrary payload)');
      }
    }
  }
});

// ---------------------------------------------------------------------------
// validateMemoryImport tests
// ---------------------------------------------------------------------------

test('validateMemoryImport accepts valid import (name, orgRef, runId, summary)', () => {
  const importSpec = {
    name: 'import-run-abc123',
    organizationRef: 'acme',
    runId: 'run-abc123',
    summary: { eventCount: 6, successCount: 2, failureCount: 1 },
  };

  const result = validateMemoryImport(importSpec);

  assert.ok(result, 'result must be truthy');
  assert.equal(result.valid, true, 'valid import spec must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must have errors array');
  assert.equal(result.errors.length, 0, 'errors must be empty for valid import');
});

test('validateMemoryImport rejects missing runId', () => {
  const importSpec = {
    name: 'import-no-run',
    organizationRef: 'acme',
    // runId is intentionally missing
    summary: { eventCount: 3 },
  };

  const result = validateMemoryImport(importSpec);

  assert.equal(result.valid, false, 'import without runId must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some(e => /runId/i.test(e)),
    'at least one error must mention "runId"'
  );
});

test('validateMemoryImport rejects missing name', () => {
  const importSpec = {
    // name is intentionally missing
    organizationRef: 'acme',
    runId: 'run-abc123',
    summary: { eventCount: 3 },
  };

  const result = validateMemoryImport(importSpec);

  assert.equal(result.valid, false, 'import without name must fail validation');
  assert.ok(result.errors.some(e => /name/i.test(e)), 'error must mention "name"');
});

test('validateMemoryImport rejects missing organizationRef', () => {
  const importSpec = {
    name: 'import-no-org',
    // organizationRef missing
    runId: 'run-abc123',
    summary: { eventCount: 3 },
  };

  const result = validateMemoryImport(importSpec);

  assert.equal(result.valid, false, 'import without organizationRef must fail');
  assert.ok(result.errors.some(e => /organizationRef/i.test(e)), 'error must mention "organizationRef"');
});

// ---------------------------------------------------------------------------
// createMemorySnapshot tests
// ---------------------------------------------------------------------------

test('createMemorySnapshot creates a snapshot with timestamp and record refs', () => {
  const snapshot = createMemorySnapshot({
    sessionRef: 'session-xyz',
    organizationRef: 'acme',
    recordRefs: ['record/auth-api', 'record/user-db'],
  });

  assert.ok(snapshot, 'snapshot must be truthy');
  assert.ok(snapshot.snapshotId, 'snapshot must have a snapshotId');
  assert.ok(snapshot.createdAt, 'snapshot must have a createdAt timestamp');
  assert.ok(typeof snapshot.createdAt === 'string', 'createdAt must be a string');
  // Should be a valid ISO date
  assert.ok(!isNaN(Date.parse(snapshot.createdAt)), 'createdAt must be a valid ISO date string');
  assert.equal(snapshot.sessionRef, 'session-xyz', 'snapshot must include sessionRef');
  assert.equal(snapshot.organizationRef, 'acme', 'snapshot must include organizationRef');
  assert.deepEqual(snapshot.recordRefs, ['record/auth-api', 'record/user-db'],
    'snapshot must include recordRefs');
});

test('createMemorySnapshot accepts query criteria for filtering records', () => {
  const snapshot = createMemorySnapshot({
    sessionRef: 'session-xyz',
    organizationRef: 'acme',
    recordRefs: ['record/auth-api'],
    queryCriteria: {
      kinds: ['Service'],
      textQuery: 'auth',
      maxRecords: 50,
    },
  });

  assert.ok(snapshot.queryCriteria, 'snapshot must include queryCriteria when provided');
  assert.deepEqual(snapshot.queryCriteria.kinds, ['Service'], 'queryCriteria.kinds must be preserved');
  assert.equal(snapshot.queryCriteria.textQuery, 'auth', 'queryCriteria.textQuery must be preserved');
  assert.equal(snapshot.queryCriteria.maxRecords, 50, 'queryCriteria.maxRecords must be preserved');
});

test('createMemorySnapshot generates unique snapshotIds for concurrent calls', () => {
  const s1 = createMemorySnapshot({ sessionRef: 'session-1', organizationRef: 'acme', recordRefs: [] });
  const s2 = createMemorySnapshot({ sessionRef: 'session-2', organizationRef: 'acme', recordRefs: [] });

  assert.notEqual(s1.snapshotId, s2.snapshotId, 'concurrent snapshots must have unique IDs');
});

// ---------------------------------------------------------------------------
// validateMemorySnapshot tests
// ---------------------------------------------------------------------------

test('validateMemorySnapshot rejects missing sessionRef', () => {
  const snapshot = {
    snapshotId: 'snap-001',
    // sessionRef is missing
    organizationRef: 'acme',
    recordRefs: [],
    createdAt: new Date().toISOString(),
  };

  const result = validateMemorySnapshot(snapshot);

  assert.equal(result.valid, false, 'snapshot without sessionRef must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some(e => /sessionRef/i.test(e)),
    'at least one error must mention "sessionRef"'
  );
});

test('validateMemorySnapshot accepts valid snapshot', () => {
  const snapshot = {
    snapshotId: 'snap-001',
    sessionRef: 'session-xyz',
    organizationRef: 'acme',
    recordRefs: ['record/auth-api'],
    createdAt: new Date().toISOString(),
  };

  const result = validateMemorySnapshot(snapshot);

  assert.equal(result.valid, true, 'valid snapshot must pass validation');
  assert.equal(result.errors.length, 0, 'errors must be empty for valid snapshot');
});

test('validateMemorySnapshot rejects missing snapshotId', () => {
  const snapshot = {
    // snapshotId missing
    sessionRef: 'session-xyz',
    organizationRef: 'acme',
    recordRefs: [],
    createdAt: new Date().toISOString(),
  };

  const result = validateMemorySnapshot(snapshot);

  assert.equal(result.valid, false, 'snapshot without snapshotId must fail validation');
  assert.ok(result.errors.some(e => /snapshotId/i.test(e)), 'error must mention "snapshotId"');
});

// ---------------------------------------------------------------------------
// validateOntology (standalone) tests
// ---------------------------------------------------------------------------

test('validateOntology accepts valid ontology (name, orgRef, nodeKinds, edgeKinds)', () => {
  const ontologySpec = makeOntologySpec();

  const result = validateOntology(ontologySpec);

  assert.ok(result, 'result must be truthy');
  assert.equal(result.valid, true, 'valid ontology spec must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must have errors array');
  assert.equal(result.errors.length, 0, 'errors must be empty for valid ontology');
});

test('validateOntology rejects empty nodeKinds array', () => {
  const ontologySpec = {
    ...makeOntologySpec(),
    nodeKinds: [],
  };

  const result = validateOntology(ontologySpec);

  assert.equal(result.valid, false, 'ontology with empty nodeKinds must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some(e => /nodeKinds/i.test(e)),
    'at least one error must mention "nodeKinds"'
  );
});

test('validateOntology rejects duplicate nodeKind names', () => {
  const ontologySpec = {
    ...makeOntologySpec(),
    nodeKinds: [
      { name: 'Service', description: 'A service' },
      { name: 'Team', description: 'A team' },
      { name: 'Service', description: 'Duplicate service' }, // duplicate
    ],
  };

  const result = validateOntology(ontologySpec);

  assert.equal(result.valid, false, 'ontology with duplicate nodeKind names must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some(e => /duplicate/i.test(e) || /nodeKind/i.test(e)),
    'error must mention duplicate or nodeKind'
  );
});

test('validateOntology rejects missing name', () => {
  const ontologySpec = {
    // name missing
    organizationRef: 'acme',
    nodeKinds: [{ name: 'Service', description: 'A service' }],
    edgeKinds: [],
  };

  const result = validateOntology(ontologySpec);

  assert.equal(result.valid, false, 'ontology without name must fail validation');
  assert.ok(result.errors.some(e => /name/i.test(e)), 'error must mention "name"');
});

test('validateOntology rejects missing organizationRef', () => {
  const ontologySpec = {
    name: 'my-ontology',
    // organizationRef missing
    nodeKinds: [{ name: 'Service', description: 'A service' }],
    edgeKinds: [],
  };

  const result = validateOntology(ontologySpec);

  assert.equal(result.valid, false, 'ontology without organizationRef must fail validation');
  assert.ok(result.errors.some(e => /organizationRef/i.test(e)), 'error must mention "organizationRef"');
});

// ---------------------------------------------------------------------------
// getOntologyNodeKinds tests
// ---------------------------------------------------------------------------

test('getOntologyNodeKinds returns node kinds from spec', () => {
  const ontologySpec = makeOntologySpec();

  const nodeKinds = getOntologyNodeKinds(ontologySpec);

  assert.ok(Array.isArray(nodeKinds), 'getOntologyNodeKinds must return an array');
  assert.equal(nodeKinds.length, 3, 'must return all 3 nodeKinds');
  const names = nodeKinds.map(k => k.name);
  assert.ok(names.includes('Service'), 'must include Service');
  assert.ok(names.includes('Team'), 'must include Team');
  assert.ok(names.includes('Runbook'), 'must include Runbook');
});

test('getOntologyNodeKinds returns empty array when nodeKinds is absent', () => {
  const ontologySpec = {
    name: 'empty-ontology',
    organizationRef: 'acme',
    edgeKinds: [],
  };

  const nodeKinds = getOntologyNodeKinds(ontologySpec);

  assert.ok(Array.isArray(nodeKinds), 'must return an array');
  assert.equal(nodeKinds.length, 0, 'must return empty array when no nodeKinds');
});

// ---------------------------------------------------------------------------
// getOntologyEdgeKinds tests
// ---------------------------------------------------------------------------

test('getOntologyEdgeKinds returns edge kinds from spec', () => {
  const ontologySpec = makeOntologySpec();

  const edgeKinds = getOntologyEdgeKinds(ontologySpec);

  assert.ok(Array.isArray(edgeKinds), 'getOntologyEdgeKinds must return an array');
  assert.equal(edgeKinds.length, 3, 'must return all 3 edgeKinds');
  const names = edgeKinds.map(k => k.name);
  assert.ok(names.includes('depends-on'), 'must include depends-on');
  assert.ok(names.includes('owned-by'), 'must include owned-by');
  assert.ok(names.includes('references'), 'must include references');
});

test('getOntologyEdgeKinds returns empty array when edgeKinds is absent', () => {
  const ontologySpec = {
    name: 'edge-less-ontology',
    organizationRef: 'acme',
    nodeKinds: [{ name: 'Service', description: 'A service' }],
  };

  const edgeKinds = getOntologyEdgeKinds(ontologySpec);

  assert.ok(Array.isArray(edgeKinds), 'must return an array');
  assert.equal(edgeKinds.length, 0, 'must return empty array when no edgeKinds');
});
