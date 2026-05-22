// External Conflict Controller — Slice 3.5
// Detects field divergence between local Krate state and external provider state,
// manages resolution workflows, and handles superseded conflict cleanup.

import { createResource, clone } from '../resource-model.js';

export const CONFLICT_CONTROLLER_BOUNDARY = {
  role: 'external-conflict-controller',
  scope: 'Field-level conflict detection and resolution for ExternalSyncConflict resources',
  owns: ['conflict detection', 'resolution workflow', 'superseded cleanup', 'open conflict listing'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['write intent lifecycle', 'sync scheduling', 'external API client']
};

const VALID_STRATEGIES = ['prefer-external', 'prefer-krate', 'manual', 'ignore'];
const OPEN_PHASES = new Set(['Open']);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a conflict detection input object.
 *
 * @param {object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateConflict(input) {
  const errors = [];
  if (!input) {
    return { valid: false, errors: ['input must not be null or undefined'] };
  }
  if (!input.resourceRef || typeof input.resourceRef !== 'string') {
    errors.push('resourceRef is required and must be a non-empty string');
  }
  if (!input.fieldPath || typeof input.fieldPath !== 'string') {
    errors.push('fieldPath is required and must be a non-empty string');
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

/**
 * Create a ConflictController that manages ExternalSyncConflict resources.
 *
 * @param {{ persistFn?: (resource: object) => Promise<any> }} [opts]
 *   Optional persistFn is called (fire-and-forget) after conflict state changes.
 * @returns {object}
 */
export function createConflictController({ persistFn } = {}) {
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
    role: 'conflict-controller',

    /**
     * Detect a conflict between local and external field values.
     * Returns { conflict: null } when values match (no conflict).
     * Returns { conflict: ExternalSyncConflict } when values differ.
     *
     * @param {{ resourceRef, fieldPath, localValue, externalValue, namespace?, organizationRef? }} input
     * @returns {{ conflict: object|null }}
     */
    detectConflict({
      resourceRef,
      fieldPath,
      localValue,
      externalValue,
      namespace = 'default',
      organizationRef = 'default'
    }) {
      const validation = validateConflict({ resourceRef, fieldPath });
      if (!validation.valid) {
        return { conflict: null, error: true, message: validation.errors.join('; ') };
      }

      // Values match — no conflict
      if (localValue === externalValue) {
        return { conflict: null };
      }

      const now = new Date().toISOString();
      const conflictName = `conflict-${resourceRef.replace(/[^a-zA-Z0-9]/g, '-')}-${fieldPath.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;

      const conflict = createResource('ExternalSyncConflict', { name: conflictName, namespace }, {
        organizationRef,
        resourceRef,
        fieldPath,
        localValue,
        externalValue,
        detectedAt: now
      });
      conflict.status = {
        phase: 'Open',
        detectedAt: now
      };

      persist(conflict);
      return { conflict };
    },

    /**
     * Resolve an Open conflict using the specified strategy.
     *
     * Strategies:
     *   - prefer-external: choose externalValue, phase → Resolved
     *   - prefer-krate:    choose localValue, phase → Resolved
     *   - manual:          choose resolvedValue, phase → Resolved (requires resolvedValue)
     *   - ignore:          phase → Ignored (no value chosen)
     *
     * @param {{ conflictName, strategy, resolvedValue?, resources }} opts
     * @returns {{ conflict: object, resolution: object } | { error: true, message: string }}
     */
    resolveConflict({ conflictName, strategy, resolvedValue, resources = {} }) {
      if (!conflictName) {
        return { error: true, reason: 'missing-name', message: 'conflictName is required' };
      }
      if (!strategy || !VALID_STRATEGIES.includes(strategy)) {
        return {
          error: true,
          reason: 'invalid-strategy',
          message: `strategy must be one of: ${VALID_STRATEGIES.join(', ')}`
        };
      }

      const conflicts = resources.ExternalSyncConflict || [];
      const found = conflicts.find((c) => c.metadata?.name === conflictName);
      if (!found) {
        return { error: true, reason: 'not-found', message: `ExternalSyncConflict not found: ${conflictName}` };
      }
      if (found.status?.phase !== 'Open') {
        return { error: true, reason: 'invalid-phase', message: `Conflict is not Open: ${found.status?.phase}` };
      }

      const updated = clone(found);
      const now = new Date().toISOString();
      let chosenValue;
      let newPhase;

      if (strategy === 'ignore') {
        newPhase = 'Ignored';
        chosenValue = undefined;
      } else {
        newPhase = 'Resolved';
        if (strategy === 'prefer-external') {
          chosenValue = found.spec.externalValue;
        } else if (strategy === 'prefer-krate') {
          chosenValue = found.spec.localValue;
        } else if (strategy === 'manual') {
          if (resolvedValue === undefined) {
            return { error: true, reason: 'missing-resolved-value', message: 'resolvedValue is required for manual strategy' };
          }
          chosenValue = resolvedValue;
        }
      }

      updated.status = {
        ...updated.status,
        phase: newPhase,
        resolvedAt: now,
        strategy,
        chosenValue
      };

      const resolution = { strategy, chosenValue };

      persist(updated);
      return { conflict: updated, resolution };
    },

    /**
     * Mark all Open conflicts for a given (resourceRef, fieldPath) pair as Superseded.
     * Used when a new sync event arrives that makes old conflicts irrelevant.
     *
     * @param {{ resourceRef, fieldPath, resources }} opts
     * @returns {{ superseded: object[] }}
     */
    supersededCheck({ resourceRef, fieldPath, resources = {} }) {
      const conflicts = resources.ExternalSyncConflict || [];
      const now = new Date().toISOString();

      const superseded = [];
      for (const c of conflicts) {
        if (
          c.spec?.resourceRef === resourceRef &&
          c.spec?.fieldPath === fieldPath &&
          c.status?.phase === 'Open'
        ) {
          const updated = clone(c);
          updated.status = {
            ...updated.status,
            phase: 'Superseded',
            supersededAt: now
          };
          superseded.push(updated);
        }
      }

      return { superseded };
    },

    /**
     * Return all Open (non-resolved, non-ignored, non-superseded) conflicts.
     *
     * @param {{ resources }} opts
     * @returns {{ conflicts: object[] }}
     */
    getOpenConflicts({ resources = {} } = {}) {
      const conflicts = resources.ExternalSyncConflict || [];
      const open = conflicts.filter((c) => OPEN_PHASES.has(c.status?.phase));
      return { conflicts: open };
    }
  };
}
