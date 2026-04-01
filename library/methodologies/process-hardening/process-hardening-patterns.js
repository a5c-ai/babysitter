/**
 * @process methodologies/process-hardening-patterns
 * @description Reusable patterns for hardening babysitter processes: error recovery with deviation
 *   tracking (safeTask), circuit breaker for runaway implementation loops, and verification-blocks-delivery
 *   gate for downstream phase protection. These patterns compose naturally and can be imported into any
 *   babysitter process to improve robustness.
 * @inputs { feature: string, targetQuality?: number, maxIterations?: number }
 * @outputs { success: boolean, iterations: number, finalQuality: number }
 *
 * Extracted from a process retrospect of superpowers-feature-development.js.
 * Score improvement: 68.5 -> 84.3/100.
 *
 * Usage:
 *   import { safeTask, circuitBreaker, verificationGate } from './process-hardening-patterns.js';
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// PATTERN 1: SAFE TASK - Error Recovery with Deviation Tracking
// ============================================================================

/**
 * Wraps ctx.task with try/catch to capture errors with phase context into a
 * shared deviations array. Re-throws after logging so the caller's try/catch
 * can handle the error (typically preserving partial results).
 *
 * @param {Object} ctx - The babysitter process context
 * @param {Object} taskDef - A defineTask definition to execute
 * @param {Object} args - Arguments to pass to the task
 * @param {Object} opts - Options
 * @param {string} opts.phase - Phase name for error context (e.g., 'prerequisites', 'planning')
 * @param {Object} opts.results - Shared results object with a `deviations` array
 * @param {number} [opts.retries=1] - Number of retry attempts before giving up
 * @returns {Promise<*>} The task result on success
 * @throws {Error} Re-throws the original error after logging and recording deviation
 *
 * @example
 * const results = { deviations: [], artifacts: {} };
 * try {
 *   const prereqs = await safeTask(ctx, checkPrerequisitesTask, { testCommand }, { phase: 'prerequisites', results });
 *   const plan = await safeTask(ctx, writePlanTask, { featureName }, { phase: 'planning', results });
 * } catch (err) {
 *   return { success: false, error: err.message, ...results };
 * }
 */
export async function safeTask(ctx, taskDef, args, { phase, results, retries = 1 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await ctx.task(taskDef, args);
    } catch (err) {
      ctx.log(`Error in ${phase || 'unknown'}: ${err.message}`, { attempt, retries });
      if (attempt === retries) {
        if (results?.deviations) {
          results.deviations.push({
            phase,
            issue: `Task failed after ${retries} attempt(s): ${err.message}`
          });
        }
        throw err;
      }
      // Retry on next iteration
    }
  }
}

// ============================================================================
// PATTERN 2: CIRCUIT BREAKER - Halt Runaway Implementation Loops
// ============================================================================

/**
 * Checks whether an implementation loop should be halted due to excessive failures.
 * Call this at the top of each loop iteration, before attempting the next task.
 *
 * When triggered, records a deviation, fires a ctx.breakpoint for user decision,
 * and returns true (caller should `break` out of the loop).
 *
 * @param {Object} ctx - The babysitter process context
 * @param {Object} opts - Configuration
 * @param {Array} opts.taskResults - Array of task result objects with { passed, skipped } fields
 * @param {Object} opts.results - Shared results object with a `deviations` array
 * @param {number} opts.currentIndex - Current task index in the loop
 * @param {number} opts.totalTasks - Total number of tasks in the loop
 * @param {number} [opts.minFailures=3] - Minimum number of failures before circuit breaker can trigger
 * @param {number} [opts.failureRateThreshold=0.5] - Failure rate threshold (0-1)
 * @returns {Promise<boolean>} true if circuit breaker triggered (caller should break), false otherwise
 *
 * @example
 * for (let i = 0; i < tasks.length; i++) {
 *   const shouldBreak = await circuitBreaker(ctx, {
 *     taskResults: results.taskResults,
 *     results,
 *     currentIndex: i,
 *     totalTasks: tasks.length,
 *     minFailures: 3,
 *     failureRateThreshold: 0.5
 *   });
 *   if (shouldBreak) break;
 *
 *   // ... proceed with task implementation
 * }
 */
export async function circuitBreaker(ctx, {
  taskResults,
  results,
  currentIndex,
  totalTasks,
  minFailures = 3,
  failureRateThreshold = 0.5
} = {}) {
  const failedSoFar = taskResults.filter(t => !t.passed && !t.skipped).length;
  const attemptedSoFar = taskResults.filter(t => !t.skipped).length;

  if (failedSoFar >= minFailures && attemptedSoFar > 0 && failedSoFar / attemptedSoFar > failureRateThreshold) {
    const failureRate = Math.round(failedSoFar / attemptedSoFar * 100);
    const remaining = totalTasks - currentIndex;

    ctx.log(`Circuit breaker triggered: ${failedSoFar}/${attemptedSoFar} tasks failed (${failureRate}%)`, {
      failedSoFar,
      attemptedSoFar,
      failureRate,
      remaining
    });

    if (results?.deviations) {
      results.deviations.push({
        phase: 'implementation',
        issue: `Circuit breaker: ${failedSoFar}/${attemptedSoFar} tasks failed (${failureRate}%)`
      });
    }

    await ctx.breakpoint({
      title: 'Implementation Circuit Breaker',
      description: `${failedSoFar} of ${attemptedSoFar} tasks have failed (${failureRate}%). The implementation plan may need revision.\n\nRemaining tasks: ${remaining}`,
      context: { failedSoFar, attemptedSoFar, failureRate, remaining }
    });

    return true; // Caller should break
  }

  return false; // Continue normally
}

// ============================================================================
// PATTERN 3: VERIFICATION-BLOCKS-DELIVERY GATE
// ============================================================================

/**
 * Gates a downstream phase (typically PR delivery) on verification success.
 * When verification fails (not all claims verified), fires a ctx.breakpoint
 * that requires explicit override to proceed. If not overridden, returns an
 * abort result that the caller should return from the process function.
 *
 * @param {Object} ctx - The babysitter process context
 * @param {Object} opts - Configuration
 * @param {Object} opts.verificationResult - Result from verification task with { allVerified, evidenceGaps, verifications }
 * @param {Object} opts.results - Shared results object with a `deviations` array
 * @param {string} [opts.blockedPhase='PR delivery'] - Name of the phase being blocked
 * @returns {Promise<{blocked: boolean, abortResult?: Object}>}
 *   - blocked=false: verification passed or user overrode, proceed normally
 *   - blocked=true + abortResult: verification failed and user did not override, return abortResult from process
 *
 * @example
 * const verificationResult = await ctx.task(verifyCompletionTask, { claims, testCommand });
 * const gate = await verificationGate(ctx, { verificationResult, results });
 * if (gate.blocked) {
 *   return gate.abortResult;
 * }
 * // Proceed to delivery...
 */
export async function verificationGate(ctx, {
  verificationResult,
  results,
  blockedPhase = 'PR delivery'
} = {}) {
  if (verificationResult.allVerified) {
    return { blocked: false };
  }

  // Record the gap
  if (results?.deviations) {
    results.deviations.push({
      phase: 'verification',
      issue: 'Not all claims verified',
      gaps: verificationResult.evidenceGaps
    });
  }

  const gaps = verificationResult.evidenceGaps || [];
  ctx.log(`Verification gate: ${gaps.length} evidence gap(s) found`, { gaps });

  const breakpointResponse = await ctx.breakpoint({
    title: `Verification Failed - ${blockedPhase} Blocked`,
    description: [
      `Verification found ${gaps.length} evidence gap(s) that block ${blockedPhase}.`,
      '',
      'Gaps:',
      ...gaps.map((g, i) => `  ${i + 1}. ${typeof g === 'string' ? g : g.description || JSON.stringify(g)}`),
      '',
      `Override to proceed with ${blockedPhase} despite unverified claims.`
    ].join('\n'),
    context: { verificationResult, gaps }
  });

  if (breakpointResponse?.override) {
    if (results?.deviations) {
      results.deviations.push({
        phase: 'verification',
        issue: `User override: proceeding with ${blockedPhase} despite verification gaps`
      });
    }
    return { blocked: false };
  }

  return {
    blocked: true,
    abortResult: {
      success: false,
      abortReason: 'verification-failed',
      verificationResult,
      ...(results || {})
    }
  };
}

// ============================================================================
// DEMONSTRATION PROCESS
// ============================================================================

/**
 * Demonstration process showing all three patterns composed together.
 * This is not meant for production use - it illustrates how to integrate
 * safeTask, circuitBreaker, and verificationGate into a multi-phase process.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.feature - Feature description
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const { feature = 'demo' } = inputs;
  const results = { deviations: [], taskResults: [], artifacts: {} };

  ctx.log('Process hardening patterns demo', { feature });

  // Top-level try/catch preserves partial results (pattern: safeTask)
  try {
    // Example Phase: Implementation loop with circuit breaker
    const tasks = [/* would be loaded from a plan */];
    for (let i = 0; i < tasks.length; i++) {
      // Pattern 2: Circuit breaker
      const shouldBreak = await circuitBreaker(ctx, {
        taskResults: results.taskResults,
        results,
        currentIndex: i,
        totalTasks: tasks.length
      });
      if (shouldBreak) break;

      // Pattern 1: safeTask for error-decorated execution
      // const implResult = await safeTask(ctx, implementerTask, { task: tasks[i] }, { phase: 'implementation', results });
    }

    // Example Phase: Verification gate before delivery
    // const verificationResult = await safeTask(ctx, verifyTask, { ... }, { phase: 'verification', results });
    // const gate = await verificationGate(ctx, { verificationResult, results });
    // if (gate.blocked) return gate.abortResult;

    return { success: true, ...results };
  } catch (err) {
    ctx.log('Process failed with partial results', { error: err.message });
    return { success: false, error: err.message, ...results };
  }
}
