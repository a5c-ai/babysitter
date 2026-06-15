// External Write Controller — Slice 3.5
// Manages WriteIntent lifecycle: creation, approval enforcement, idempotency,
// retry logic, and confirmation recording.

import { createResource, clone } from '../resource-model.js';

export const WRITE_CONTROLLER_BOUNDARY = {
  role: 'external-write-controller',
  scope: 'WriteIntent lifecycle — creation, approval, rejection, execution with retry',
  owns: ['WriteIntent creation', 'approval gate', 'retry logic', 'idempotency key'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['conflict resolution', 'sync state', 'external API client']
};

const VALID_PHASES = ['PendingApproval', 'ReadyToSend', 'Sending', 'Retrying', 'Succeeded', 'Failed', 'Rejected'];

// ---------------------------------------------------------------------------
// Idempotency key
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic idempotency key for a write operation.
 * The key is stable for the same (interfaceKey, operation, resourceRef, payload).
 *
 * @param {{ interfaceKey: string, operation: string, resourceRef: string, payload: object }} input
 * @returns {string}
 */
export function getIdempotencyKey({ interfaceKey, operation, resourceRef, payload }) {
  const canonical = JSON.stringify({ interfaceKey, operation, resourceRef, payload }, Object.keys({ interfaceKey, operation, resourceRef, payload }).sort());
  // Simple deterministic hash using djb2-style accumulation (no external deps)
  let hash = 5381;
  for (let i = 0; i < canonical.length; i++) {
    hash = ((hash << 5) + hash) ^ canonical.charCodeAt(i);
    hash = hash >>> 0; // keep 32-bit unsigned
  }
  return `idem-${interfaceKey}-${operation}-${hash.toString(16)}`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a WriteIntent input object.
 *
 * @param {object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateWriteIntent(input) {
  const errors = [];
  if (!input) {
    return { valid: false, errors: ['input must not be null or undefined'] };
  }
  if (!input.interfaceKey || typeof input.interfaceKey !== 'string') {
    errors.push('interfaceKey is required and must be a non-empty string');
  }
  if (!input.operation || typeof input.operation !== 'string') {
    errors.push('operation is required and must be a non-empty string');
  }
  if (!input.resourceRef || typeof input.resourceRef !== 'string') {
    errors.push('resourceRef is required and must be a non-empty string');
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

/**
 * Create a WriteController that manages ExternalWriteIntent resources.
 *
 * @param {{ persistFn?: (resource: object) => Promise<any> }} [opts]
 *   Optional persistFn is called (fire-and-forget) after intent state changes.
 * @returns {object}
 */
export function createWriteController({ persistFn } = {}) {
  /**
   * Fire-and-forget persistence helper.
   * @param {object} resource
   */
  function persist(resource) {
    if (typeof persistFn === 'function') {
      Promise.resolve(persistFn(resource)).catch(() => {});
    }
  }

  return {
    role: 'write-controller',

    /**
     * Create a new ExternalWriteIntent resource.
     * If requiresApproval is true, phase starts as PendingApproval.
     * If requiresApproval is false, phase starts as ReadyToSend.
     *
     * @param {{ interfaceKey, operation, payload, resourceRef, requiresApproval?, maxRetries?, namespace?, organizationRef? }} input
     * @returns {{ intent: object } | { error: true, message: string }}
     */
    createWriteIntent({
      interfaceKey,
      operation,
      payload = {},
      resourceRef,
      requiresApproval = false,
      maxRetries = 3,
      namespace = 'default',
      organizationRef = 'default'
    }) {
      const validation = validateWriteIntent({ interfaceKey, operation, resourceRef });
      if (!validation.valid) {
        return { error: true, message: validation.errors.join('; ') };
      }

      const idempotencyKey = getIdempotencyKey({ interfaceKey, operation, resourceRef, payload });
      const now = new Date().toISOString();
      const intentName = `write-intent-${idempotencyKey}-${Date.now()}`;
      const phase = requiresApproval ? 'PendingApproval' : 'ReadyToSend';

      const intent = createResource('ExternalWriteIntent', { name: intentName, namespace }, {
        organizationRef,
        interfaceKey,
        operation,
        payload,
        resourceRef,
        requiresApproval,
        maxRetries,
        idempotencyKey
      });
      intent.status = {
        phase,
        retryCount: 0,
        createdAt: now
      };

      persist(intent);
      return { intent };
    },

    /**
     * Approve a PendingApproval intent, transitioning it to ReadyToSend.
     *
     * @param {{ intentName, approvedBy, resources }} opts
     * @returns {{ intent: object } | { error: true, reason: string, message: string }}
     */
    approveWriteIntent({ intentName, approvedBy, resources = {} }) {
      if (!intentName) {
        return { error: true, reason: 'missing-name', message: 'intentName is required' };
      }
      if (!approvedBy) {
        return { error: true, reason: 'missing-approver', message: 'approvedBy is required' };
      }

      const intents = resources.ExternalWriteIntent || [];
      const found = intents.find((i) => i.metadata?.name === intentName);
      if (!found) {
        return { error: true, reason: 'not-found', message: `ExternalWriteIntent not found: ${intentName}` };
      }
      if (found.status?.phase !== 'PendingApproval') {
        return { error: true, reason: 'invalid-phase', message: `Intent is not in PendingApproval: ${found.status?.phase}` };
      }

      const updated = clone(found);
      updated.status = {
        ...updated.status,
        phase: 'ReadyToSend',
        approvedBy,
        approvedAt: new Date().toISOString()
      };

      persist(updated);
      return { intent: updated };
    },

    /**
     * Reject a PendingApproval intent, transitioning it to Rejected.
     *
     * @param {{ intentName, rejectedBy, reason, resources }} opts
     * @returns {{ intent: object } | { error: true, reason: string, message: string }}
     */
    rejectWriteIntent({ intentName, rejectedBy, reason = '', resources = {} }) {
      if (!intentName) {
        return { error: true, reason: 'missing-name', message: 'intentName is required' };
      }
      if (!rejectedBy) {
        return { error: true, reason: 'missing-rejecter', message: 'rejectedBy is required' };
      }

      const intents = resources.ExternalWriteIntent || [];
      const found = intents.find((i) => i.metadata?.name === intentName);
      if (!found) {
        return { error: true, reason: 'not-found', message: `ExternalWriteIntent not found: ${intentName}` };
      }
      if (found.status?.phase !== 'PendingApproval') {
        return { error: true, reason: 'invalid-phase', message: `Intent is not in PendingApproval: ${found.status?.phase}` };
      }

      const updated = clone(found);
      updated.status = {
        ...updated.status,
        phase: 'Rejected',
        rejectedBy,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      };

      persist(updated);
      return { intent: updated };
    },

    /**
     * Execute a WriteIntent by calling the provided executor function.
     * Handles Sending → Succeeded / Retrying → Failed lifecycle.
     *
     * @param {{ intentName, resources, executor, onPhaseChange? }} opts
     * @returns {Promise<{ intent: object } | { error: true, intent: object, message: string }>}
     */
    async executeWriteIntent({ intentName, resources = {}, executor, onPhaseChange }) {
      if (!intentName) {
        return { error: true, message: 'intentName is required' };
      }
      if (typeof executor !== 'function') {
        return { error: true, message: 'executor must be a function' };
      }

      const intents = resources.ExternalWriteIntent || [];
      const found = intents.find((i) => i.metadata?.name === intentName);
      if (!found) {
        return { error: true, message: `ExternalWriteIntent not found: ${intentName}` };
      }
      if (found.status?.phase !== 'ReadyToSend') {
        return { error: true, message: `Intent is not ReadyToSend: ${found.status?.phase}` };
      }

      const maxRetries = found.spec?.maxRetries ?? 3;
      let intent = clone(found);

      // Transition to Sending
      intent.status = { ...intent.status, phase: 'Sending', sendingAt: new Date().toISOString() };
      if (onPhaseChange) onPhaseChange('Sending');

      let lastError = null;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const externalResult = await executor();
          intent.status = {
            ...intent.status,
            phase: 'Succeeded',
            succeededAt: new Date().toISOString(),
            externalResult,
            retryCount: attempt
          };
          if (onPhaseChange) onPhaseChange('Succeeded');
          return { intent };
        } catch (err) {
          lastError = err;
          attempt++;
          if (attempt <= maxRetries) {
            intent.status = {
              ...intent.status,
              phase: 'Retrying',
              retryCount: attempt,
              lastError: err.message
            };
            if (onPhaseChange) onPhaseChange('Retrying');
          }
        }
      }

      // Exhausted retries
      intent.status = {
        ...intent.status,
        phase: 'Failed',
        failedAt: new Date().toISOString(),
        retryCount: attempt - 1,
        lastError: lastError?.message ?? 'unknown error'
      };
      if (onPhaseChange) onPhaseChange('Failed');
      return { error: true, intent, message: `Execution failed after ${attempt - 1} retries: ${lastError?.message}` };
    }
  };
}
