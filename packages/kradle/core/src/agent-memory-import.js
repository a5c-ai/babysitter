/**
 * Agent Memory Import & Snapshot — Slice 2.3c
 *
 * Provides:
 *  - parseJournalForImport: parse a babysitter .a5c journal into a summary-only import payload
 *  - validateMemoryImport: validate an AgentRunMemoryImport spec
 *  - createMemorySnapshot: create a dispatch-time memory snapshot pinning record refs
 *  - validateMemorySnapshot: validate an AgentMemorySnapshot
 *  - validateOntology: validate an AgentMemoryOntology spec
 *  - getOntologyNodeKinds: return nodeKinds array from an ontology spec
 *  - getOntologyEdgeKinds: return edgeKinds array from an ontology spec
 *
 * Boundary: agent-memory-import
 * - owns: journal parsing, summary extraction, snapshot creation, ontology validation
 * - delegatesTo: (none — pure data transformation)
 * - mustNotOwn: persistence, HTTP routing, Kubernetes resources, secret handling, git operations
 */

import { randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// Journal parsing
// ---------------------------------------------------------------------------

/**
 * Parse a babysitter .a5c journal array into a summary-only import payload.
 * Returns structural metadata only — no raw task content, no arbitrary effect payloads.
 *
 * @param {Array} journal - Array of journal event objects
 * @returns {{ summary: object, keyEvents: Array, effectSummary: object }}
 */
export function parseJournalForImport(journal) {
  if (!Array.isArray(journal) || journal.length === 0) {
    return {
      summary: {
        runId: null,
        processId: null,
        eventCount: 0,
        durationMs: 0,
        runStatus: null,
      },
      keyEvents: [],
      effectSummary: {
        successCount: 0,
        failureCount: 0,
        effectKinds: [],
      },
    };
  }

  // Extract run metadata from run_start event
  const runStart = journal.find(e => e.type === 'run_start');
  const runEnd = journal.find(e => e.type === 'run_end');

  const runId = runStart?.runId ?? null;
  const processId = runStart?.processId ?? null;
  const runStatus = runEnd?.status ?? null;

  // Compute duration from timestamps
  let durationMs = 0;
  if (runStart?.timestamp && runEnd?.timestamp) {
    const startMs = Date.parse(runStart.timestamp);
    const endMs = Date.parse(runEnd.timestamp);
    if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
      durationMs = endMs - startMs;
    }
  }

  // Extract key events (structural, no raw content)
  const keyEvents = [];
  let successCount = 0;
  let failureCount = 0;
  const effectKindSet = new Set();

  for (const event of journal) {
    switch (event.type) {
      case 'run_start':
        keyEvents.push({
          type: 'run_start',
          runId: event.runId ?? null,
          processId: event.processId ?? null,
          timestamp: event.timestamp ?? null,
        });
        break;

      case 'task_completed': {
        const keyEvent = {
          type: 'task_completed',
          taskId: event.taskId ?? null,
          title: event.title ?? null,
          status: event.status ?? null,
          timestamp: event.timestamp ?? null,
        };
        // Strip raw effect to summary-only (kind + result only)
        if (event.effect && typeof event.effect === 'object') {
          keyEvent.effect = {
            kind: event.effect.kind ?? null,
            result: event.effect.result ?? null,
          };
          if (event.effect.kind) effectKindSet.add(event.effect.kind);
          if (event.effect.result === 'success') successCount++;
          else if (event.effect.result === 'failure') failureCount++;
        } else if (event.status === 'success') {
          successCount++;
        } else if (event.status === 'failure') {
          failureCount++;
        }
        keyEvents.push(keyEvent);
        break;
      }

      case 'breakpoint':
        keyEvents.push({
          type: 'breakpoint',
          reason: event.reason ?? null,
          timestamp: event.timestamp ?? null,
        });
        break;

      case 'run_end':
        keyEvents.push({
          type: 'run_end',
          status: event.status ?? null,
          timestamp: event.timestamp ?? null,
        });
        break;

      default:
        // Include other event types with only structural metadata
        keyEvents.push({
          type: event.type,
          timestamp: event.timestamp ?? null,
        });
        break;
    }
  }

  return {
    summary: {
      runId,
      processId,
      eventCount: journal.length,
      durationMs,
      runStatus,
    },
    keyEvents,
    effectSummary: {
      successCount,
      failureCount,
      effectKinds: Array.from(effectKindSet),
    },
  };
}

// ---------------------------------------------------------------------------
// validateMemoryImport
// ---------------------------------------------------------------------------

/**
 * Validate an AgentRunMemoryImport spec.
 *
 * @param {object} importSpec
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMemoryImport(importSpec) {
  const errors = [];

  if (!importSpec || typeof importSpec !== 'object') {
    return { valid: false, errors: ['importSpec must be a non-null object'] };
  }

  if (!importSpec.name || typeof importSpec.name !== 'string' || importSpec.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!importSpec.organizationRef || typeof importSpec.organizationRef !== 'string' || importSpec.organizationRef.trim() === '') {
    errors.push('organizationRef is required and must be a non-empty string');
  }

  if (!importSpec.runId || typeof importSpec.runId !== 'string' || importSpec.runId.trim() === '') {
    errors.push('runId is required and must be a non-empty string');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// createMemorySnapshot
// ---------------------------------------------------------------------------

/**
 * Create a dispatch-time memory snapshot pinning record refs.
 *
 * @param {object} params
 * @param {string} params.sessionRef        - The agent session reference (required)
 * @param {string} params.organizationRef   - Organization reference
 * @param {Array}  params.recordRefs        - Array of record reference strings
 * @param {object} [params.queryCriteria]   - Optional query criteria used to select records
 * @returns {object} snapshot
 */
export function createMemorySnapshot({ sessionRef, organizationRef, recordRefs = [], queryCriteria }) {
  const snapshotId = `snap-${randomBytes(8).toString('hex')}`;
  const createdAt = new Date().toISOString();

  const snapshot = {
    snapshotId,
    sessionRef: sessionRef ?? null,
    organizationRef: organizationRef ?? null,
    recordRefs: Array.isArray(recordRefs) ? [...recordRefs] : [],
    createdAt,
  };

  if (queryCriteria !== undefined && queryCriteria !== null) {
    snapshot.queryCriteria = { ...queryCriteria };
  }

  return snapshot;
}

// ---------------------------------------------------------------------------
// validateMemorySnapshot
// ---------------------------------------------------------------------------

/**
 * Validate an AgentMemorySnapshot object.
 *
 * @param {object} snapshot
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMemorySnapshot(snapshot) {
  const errors = [];

  if (!snapshot || typeof snapshot !== 'object') {
    return { valid: false, errors: ['snapshot must be a non-null object'] };
  }

  if (!snapshot.snapshotId || typeof snapshot.snapshotId !== 'string' || snapshot.snapshotId.trim() === '') {
    errors.push('snapshotId is required and must be a non-empty string');
  }

  if (!snapshot.sessionRef || typeof snapshot.sessionRef !== 'string' || snapshot.sessionRef.trim() === '') {
    errors.push('sessionRef is required and must be a non-empty string');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// validateOntology (standalone)
// ---------------------------------------------------------------------------

/**
 * Validate an AgentMemoryOntology spec.
 *
 * @param {object} ontologySpec
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateOntology(ontologySpec) {
  const errors = [];

  if (!ontologySpec || typeof ontologySpec !== 'object') {
    return { valid: false, errors: ['ontologySpec must be a non-null object'] };
  }

  if (!ontologySpec.name || typeof ontologySpec.name !== 'string' || ontologySpec.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!ontologySpec.organizationRef || typeof ontologySpec.organizationRef !== 'string' || ontologySpec.organizationRef.trim() === '') {
    errors.push('organizationRef is required and must be a non-empty string');
  }

  // nodeKinds must be a non-empty array
  const nodeKinds = ontologySpec.nodeKinds;
  if (!Array.isArray(nodeKinds) || nodeKinds.length === 0) {
    errors.push('nodeKinds must be a non-empty array');
  } else {
    // Check for duplicate nodeKind names
    const seen = new Set();
    for (const nk of nodeKinds) {
      const kindName = nk?.name;
      if (kindName !== undefined && kindName !== null) {
        if (seen.has(kindName)) {
          errors.push(`Duplicate nodeKind name: "${kindName}"`);
        } else {
          seen.add(kindName);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// getOntologyNodeKinds
// ---------------------------------------------------------------------------

/**
 * Return the nodeKinds array from an ontology spec.
 *
 * @param {object} ontologySpec
 * @returns {Array}
 */
export function getOntologyNodeKinds(ontologySpec) {
  if (!ontologySpec || !Array.isArray(ontologySpec.nodeKinds)) {
    return [];
  }
  return [...ontologySpec.nodeKinds];
}

// ---------------------------------------------------------------------------
// getOntologyEdgeKinds
// ---------------------------------------------------------------------------

/**
 * Return the edgeKinds array from an ontology spec.
 *
 * @param {object} ontologySpec
 * @returns {Array}
 */
export function getOntologyEdgeKinds(ontologySpec) {
  if (!ontologySpec || !Array.isArray(ontologySpec.edgeKinds)) {
    return [];
  }
  return [...ontologySpec.edgeKinds];
}
