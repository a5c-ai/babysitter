/**
 * Deterministic result merge for multi-hook fan-out.
 *
 * Implements spec sections 12.4-12.7: merges an ordered array of
 * UnifiedHookResult into a single MergedExecutionResult with
 * configurable conflict policies.
 */

import type { UnifiedHookResult } from '../types/result';
import {
  type MergeDiagnostics,
  createDiagnostics,
  recordConflict,
} from './diagnostics';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface MergeOptions {
  conflictPolicy?: 'last-writer-wins' | 'fail-on-conflict' | 'protected-prefixes' | 'namespace-required';
  protectedPrefixes?: string[];
  systemMessageStrategy?: 'concatenate' | 'keep-first';
}

export type DecisionVerb = 'deny' | 'ask' | 'allow' | 'continue' | 'noop';

export interface MergedExecutionResult {
  decision: DecisionVerb;
  reason: string;
  persistEnv: Record<string, string>;
  unsetEnv: string[];
  contextVars: Record<string, string>;
  additionalContext: string;
  systemMessage: string;
  toolMutation?: { mode: 'replace' | 'patch'; value: unknown };
  continueSession: boolean;
  stopReason: string;
  suppressOutput: boolean;
  followUpMessage: string;
  metadata: Record<string, unknown>;
  diagnostics: MergeDiagnostics;
}

// ---------------------------------------------------------------------------
// Decision precedence
// ---------------------------------------------------------------------------

const DECISION_PRECEDENCE: Record<DecisionVerb, number> = {
  deny: 0,
  ask: 1,
  allow: 2,
  continue: 3,
  noop: 4,
};

function mostRestrictiveDecision(a: DecisionVerb, b: DecisionVerb): DecisionVerb {
  return DECISION_PRECEDENCE[a] <= DECISION_PRECEDENCE[b] ? a : b;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasProtectedPrefix(key: string, prefixes: string[]): boolean {
  return prefixes.some((p) => key.startsWith(p));
}

function hasNamespacePrefix(key: string): boolean {
  // Matches SOMETHING_ at the start (at least one char before underscore)
  return /^[A-Za-z][A-Za-z0-9]*_/.test(key);
}

/**
 * Naive deep merge of two plain objects.
 * Arrays are replaced (not concatenated) to keep semantics simple.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = out[key];
    if (
      tv !== null &&
      sv !== null &&
      typeof tv === 'object' &&
      typeof sv === 'object' &&
      !Array.isArray(tv) &&
      !Array.isArray(sv)
    ) {
      out[key] = deepMerge(
        tv as Record<string, unknown>,
        sv as Record<string, unknown>,
      );
    } else {
      out[key] = sv;
    }
  }
  return out;
}

/**
 * Extract a {@link DecisionVerb} from a handler result.
 * Reads directly from the typed `decision` field.
 */
function extractDecision(result: UnifiedHookResult): DecisionVerb {
  if (!result.decision) return 'noop';
  if (result.decision in DECISION_PRECEDENCE) {
    return result.decision;
  }
  return 'noop';
}

// ---------------------------------------------------------------------------
// Key-wise merge with conflict policy
// ---------------------------------------------------------------------------

function mergeKeywise(
  existing: Record<string, string>,
  incoming: Record<string, string>,
  fieldPrefix: string,
  existingIndex: number,
  incomingIndex: number,
  options: Required<Pick<MergeOptions, 'conflictPolicy' | 'protectedPrefixes'>>,
  diagnostics: MergeDiagnostics,
): Record<string, string> {
  const merged = { ...existing };

  for (const key of Object.keys(incoming)) {
    const incomingVal = incoming[key];

    // namespace-required: every key must have a namespace prefix
    if (options.conflictPolicy === 'namespace-required' && !hasNamespacePrefix(key)) {
      throw new MergeConflictError(
        `Key "${key}" in ${fieldPrefix} requires a namespace prefix (e.g. PLUGIN_X_${key})`,
      );
    }

    const existingVal = merged[key];
    const isConflict = existingVal !== undefined && existingVal !== incomingVal;

    if (!isConflict) {
      merged[key] = incomingVal;
      continue;
    }

    // Protected prefix check (applies to protected-prefixes policy)
    if (
      options.conflictPolicy === 'protected-prefixes' &&
      hasProtectedPrefix(key, options.protectedPrefixes)
    ) {
      recordConflict(diagnostics, {
        field: `${fieldPrefix}.${key}`,
        existingValue: existingVal,
        incomingValue: incomingVal,
        resolution: 'protected',
        existingHandlerIndex: existingIndex,
        incomingHandlerIndex: incomingIndex,
      });
      // Keep existing -- protected key cannot be overwritten
      continue;
    }

    if (options.conflictPolicy === 'fail-on-conflict') {
      recordConflict(diagnostics, {
        field: `${fieldPrefix}.${key}`,
        existingValue: existingVal,
        incomingValue: incomingVal,
        resolution: 'error',
        existingHandlerIndex: existingIndex,
        incomingHandlerIndex: incomingIndex,
      });
      throw new MergeConflictError(
        `Conflict on ${fieldPrefix}.${key}: "${String(existingVal)}" vs "${String(incomingVal)}"`,
      );
    }

    // last-writer-wins (default) or namespace-required with no prefix issue
    recordConflict(diagnostics, {
      field: `${fieldPrefix}.${key}`,
      existingValue: existingVal,
      incomingValue: incomingVal,
      resolution: 'last-writer-wins',
      existingHandlerIndex: existingIndex,
      incomingHandlerIndex: incomingIndex,
    });
    merged[key] = incomingVal;
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class MergeConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MergeConflictError';
  }
}

// ---------------------------------------------------------------------------
// Main merge function
// ---------------------------------------------------------------------------

/**
 * Merge an ordered array of {@link UnifiedHookResult} into a single
 * {@link MergedExecutionResult}.
 *
 * The results array is processed in order (index 0 = first handler).
 * Conflict resolution follows the supplied {@link MergeOptions}.
 */
export function mergeResults(
  results: UnifiedHookResult[],
  options?: MergeOptions,
): MergedExecutionResult {
  const opts = {
    conflictPolicy: options?.conflictPolicy ?? 'last-writer-wins',
    protectedPrefixes: options?.protectedPrefixes ?? ['AGENT_'],
    systemMessageStrategy: options?.systemMessageStrategy ?? 'concatenate',
  } as const;

  const diagnostics = createDiagnostics(results.length);

  // Accumulators
  let persistEnv: Record<string, string> = {};
  const unsetEnv: Set<string> = new Set();
  let contextVars: Record<string, string> = {};
  const additionalContextParts: string[] = [];
  const systemMessageParts: string[] = [];
  let decision: DecisionVerb = 'noop';
  let toolMutation: { mode: 'replace' | 'patch'; value: unknown } | undefined;
  let mutatingWriterCount = 0;
  let continueSession = true;
  let suppressOutput = false;
  const stopReasonParts: string[] = [];
  const reasonParts: string[] = [];
  const followUpParts: string[] = [];
  let metadata: Record<string, unknown> = {};

  // Track which handler last wrote each env/context key (for conflict diagnostics)
  const envKeyOwner: Record<string, number> = {};
  const ctxKeyOwner: Record<string, number> = {};

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const startTime = diagnostics.handlerTimings ? Date.now() : 0;

    // --- persistEnv (typed field) ---
    const rEnv = r.persistEnv ?? {};
    if (Object.keys(rEnv).length > 0) {
      persistEnv = mergeKeywise(
        persistEnv,
        rEnv,
        'persistEnv',
        envKeyOwner[Object.keys(rEnv)[0]] ?? i,
        i,
        opts,
        diagnostics,
      );
      for (const k of Object.keys(rEnv)) {
        envKeyOwner[k] = i;
      }
    }

    // --- unsetEnv (typed field) ---
    const rUnset = r.unsetEnv ?? [];
    for (const k of rUnset) unsetEnv.add(k);

    // --- contextVars (typed field) ---
    const rCtx = r.contextVars ?? {};
    if (Object.keys(rCtx).length > 0) {
      contextVars = mergeKeywise(
        contextVars,
        rCtx,
        'contextVars',
        ctxKeyOwner[Object.keys(rCtx)[0]] ?? i,
        i,
        opts,
        diagnostics,
      );
      for (const k of Object.keys(rCtx)) {
        ctxKeyOwner[k] = i;
      }
    }

    // --- additionalContext (typed field) ---
    if (r.additionalContext) additionalContextParts.push(r.additionalContext);

    // --- systemMessage (typed field) ---
    if (r.systemMessage) {
      if (opts.systemMessageStrategy === 'keep-first' && systemMessageParts.length > 0) {
        // skip -- keep first only
      } else {
        systemMessageParts.push(r.systemMessage);
      }
    }

    // --- decision (typed field) ---
    const handlerDecision = extractDecision(r);
    decision = mostRestrictiveDecision(decision, handlerDecision);

    // --- toolMutation (typed field, single writer) ---
    if (r.toolMutation) {
      mutatingWriterCount++;
      if (mutatingWriterCount > 1) {
        // Two replace-mode mutations are always a conflict
        if (toolMutation?.mode === 'replace' && r.toolMutation.mode === 'replace') {
          throw new MergeConflictError(
            'Multiple handlers produced toolMutation with mode=replace. Only one replace-mode writer is allowed.',
          );
        }
        throw new MergeConflictError(
          'Multiple handlers produced tool mutations. Only one mutating writer is allowed unless patch chaining is enabled.',
        );
      }
      toolMutation = r.toolMutation;
    }

    // --- continueSession (typed field) ---
    if (r.continueSession === false) {
      continueSession = false;
    }

    // --- suppressOutput (typed field) ---
    if (r.suppressOutput === true) {
      suppressOutput = true;
    }

    // --- stopReason (typed field) ---
    if (r.stopReason) stopReasonParts.push(r.stopReason);

    // --- reason (typed field) ---
    if (r.reason) reasonParts.push(r.reason);

    // --- followUpMessage (typed field) ---
    if (r.followUpMessage) followUpParts.push(r.followUpMessage);

    // --- metadata (typed field) ---
    const rMeta = r.metadata ?? {};
    if (Object.keys(rMeta).length > 0) {
      metadata = deepMerge(metadata, rMeta);
    }

    // --- per-handler timing ---
    if (diagnostics.handlerTimings) {
      diagnostics.handlerTimings.push({
        handlerIndex: i,
        durationMs: Date.now() - startTime,
      });
    }
  }

  // Build stop reason
  let stopReason = '';
  if (!continueSession && stopReasonParts.length > 0) {
    stopReason = stopReasonParts[0]; // first non-empty if stopping
  } else if (stopReasonParts.length > 0) {
    stopReason = stopReasonParts.join('; ');
  }

  return {
    decision,
    reason: reasonParts.join('; '),
    persistEnv,
    unsetEnv: [...unsetEnv],
    contextVars,
    additionalContext: additionalContextParts.join('\n---\n'),
    systemMessage: systemMessageParts.join('\n---\n'),
    toolMutation,
    continueSession,
    suppressOutput,
    stopReason,
    followUpMessage: followUpParts.join('\n---\n'),
    metadata,
    diagnostics,
  };
}
