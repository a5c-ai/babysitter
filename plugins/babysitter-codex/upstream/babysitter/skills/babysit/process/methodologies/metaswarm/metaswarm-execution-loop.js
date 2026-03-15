/**
 * @process methodologies/metaswarm/metaswarm-execution-loop
 * @description Metaswarm Orchestrated Execution Loop - The 4-phase cycle per work unit: Implement (TDD) -> Validate (independent quality gates) -> Adversarial Review (fresh, binary PASS/FAIL) -> Commit
 * @inputs { workUnit: object, projectRoot?: string, coverageThresholds?: object, maxRetries?: number, projectContext?: object }
 * @outputs { success: boolean, commitHash: string, attempts: number, qualityGateResults: array, reviewResults: array, filesModified: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const tddImplementTask = defineTask('metaswarm-tdd-implement', async (args, _ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'TDD Implementation: Write Tests First, Then Implement',
  labels: ['metaswarm', 'tdd', 'implementation'],
  io: {
    inputs: { workUnit: 'object', projectContext: 'object', fileScope: 'array', previousFailures: 'array' },
    outputs: { testsWritten: 'array', filesModified: 'array', dodItemsCompleted: 'array', completionReport: 'object' }
  }
});

const independentValidateTask = defineTask('metaswarm-independent-validate', async (args, _ctx) => {
  return { validation: args };
}, {
  kind: 'agent',
  title: 'Independent Quality Gate Execution (Never Trust Subagent)',
  labels: ['metaswarm', 'validation', 'quality-gates', 'independent'],
  io: {
    inputs: { projectRoot: 'string', coverageThresholds: 'object', workUnitId: 'string' },
    outputs: {
      typeCheck: 'object', linting: 'object', testResults: 'object',
      coverageResults: 'object', allPassed: 'boolean', failures: 'array',
      gateDetails: 'object'
    }
  }
});

const freshAdversarialReviewTask = defineTask('metaswarm-fresh-adversarial', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Fresh Adversarial Review (No Memory of Previous Reviews)',
  labels: ['metaswarm', 'adversarial', 'fresh-reviewer'],
  io: {
    inputs: { workUnit: 'object', filesModified: 'array', dodItems: 'array' },
    outputs: { verdict: 'string', evidence: 'array', specCompliance: 'object', fileLineReferences: 'array' }
  }
});

const scopedCommitTask = defineTask('metaswarm-scoped-commit', async (args, _ctx) => {
  return { commit: args };
}, {
  kind: 'agent',
  title: 'Commit Within Declared File Scope with DoD Verification',
  labels: ['metaswarm', 'commit', 'scoped'],
  io: {
    inputs: { workUnitId: 'string', filesModified: 'array', fileScope: 'array', dodItemsCompleted: 'array' },
    outputs: { commitHash: 'string', filesCommitted: 'array', scopeViolations: 'array', serviceInventoryUpdated: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Metaswarm Orchestrated Execution Loop
 *
 * The 4-phase cycle embodies: "Trust nothing. Verify everything. Review adversarially."
 *
 * 1. IMPLEMENT - Coder executes via TDD against spec with enumerated DoD items
 * 2. VALIDATE - Orchestrator independently runs tsc, eslint, vitest (NEVER trusts subagent claims)
 * 3. ADVERSARIAL REVIEW - Fresh reviewer (no memory of previous) checks spec compliance: binary PASS/FAIL
 * 4. COMMIT - Only after adversarial PASS, within declared file scope
 *
 * On FAIL: fix -> re-validate -> spawn fresh reviewer (max 3 attempts -> escalate)
 *
 * Anti-patterns enforced against:
 * - Self-certifying (trusting subagent claims)
 * - Combining phases into single steps
 * - Reusing reviewers after FAIL
 * - Passing previous review findings to new reviewers
 * - Treating quality gate failures as advisory
 *
 * Attribution: Adapted from https://github.com/dsifry/metaswarm by David Sifry
 *
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.workUnit - Work unit with id, title, definitionOfDone, fileScope
 * @param {string} inputs.projectRoot - Project root directory
 * @param {Object} inputs.coverageThresholds - Coverage requirements
 * @param {number} inputs.maxRetries - Max retry cycles (default: 3)
 * @param {Object} inputs.projectContext - Codebase context for implementation
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Execution results
 */
export async function process(inputs, ctx) {
  const {
    workUnit,
    projectRoot = '.',
    coverageThresholds = { lines: 100, branches: 100, functions: 100, statements: 100 },
    maxRetries = 3,
    projectContext = {}
  } = inputs;

  ctx.log('Execution Loop: Starting 4-phase cycle', { workUnit: workUnit.id });
  ctx.log('Anti-pattern guard: Quality gates are BLOCKING state transitions.');

  const qualityGateResults = [];
  const reviewResults = [];
  let attempts = 0;
  let previousFailures = [];

  while (attempts < maxRetries) {
    attempts++;
    ctx.log(`Attempt ${attempts}/${maxRetries} for work unit: ${workUnit.title || workUnit.id}`);

    // ========================================================================
    // PHASE 1: IMPLEMENT (TDD mandatory)
    // ========================================================================

    ctx.log('Phase 1: TDD Implementation');

    const implResult = await ctx.task(tddImplementTask, {
      workUnit,
      projectContext: { ...projectContext, projectRoot },
      fileScope: workUnit.fileScope || [],
      previousFailures
    });

    // ========================================================================
    // PHASE 2: VALIDATE (independent - never trust subagent)
    // ========================================================================

    ctx.log('Phase 2: Independent Quality Gate Validation');
    ctx.log('NOTE: Orchestrator runs gates directly. Does NOT ask subagent "did tests pass?"');

    const validationResult = await ctx.task(independentValidateTask, {
      projectRoot,
      coverageThresholds,
      workUnitId: workUnit.id
    });

    qualityGateResults.push(validationResult);

    if (!validationResult.allPassed) {
      ctx.log('Quality gates FAILED (blocking)', { failures: validationResult.failures });
      previousFailures = validationResult.failures;

      if (attempts >= maxRetries) {
        await ctx.breakpoint({
          question: `Work unit "${workUnit.title}" failed quality gates after ${maxRetries} attempts. Failures: ${validationResult.failures.join(', ')}. Escalating to human for resolution.`,
          title: `Execution Loop Escalation: Quality Gates`,
          context: { runId: ctx.runId }
        });
      }
      continue;
    }

    // ========================================================================
    // PHASE 3: ADVERSARIAL REVIEW (fresh reviewer, binary verdict)
    // ========================================================================

    ctx.log('Phase 3: Fresh Adversarial Review');
    ctx.log('RULE: Fresh reviewer with no memory of previous reviews (prevents anchoring bias)');

    const reviewResult = await ctx.task(freshAdversarialReviewTask, {
      workUnit,
      filesModified: implResult.filesModified,
      dodItems: workUnit.definitionOfDone || []
    });

    reviewResults.push(reviewResult);

    if (reviewResult.verdict !== 'PASS') {
      ctx.log('Adversarial review: FAIL', { evidence: reviewResult.evidence });
      previousFailures = reviewResult.evidence;

      if (attempts >= maxRetries) {
        await ctx.breakpoint({
          question: `Work unit "${workUnit.title}" failed adversarial review after ${maxRetries} attempts. Evidence: ${reviewResult.evidence.join('; ')}. Escalating to human.`,
          title: `Execution Loop Escalation: Adversarial Review`,
          context: { runId: ctx.runId }
        });
      }
      continue;
    }

    // ========================================================================
    // PHASE 4: COMMIT (only after adversarial PASS)
    // ========================================================================

    ctx.log('Phase 4: Commit (adversarial PASS confirmed)');

    const commitResult = await ctx.task(scopedCommitTask, {
      workUnitId: workUnit.id,
      filesModified: implResult.filesModified,
      fileScope: workUnit.fileScope || [],
      dodItemsCompleted: implResult.dodItemsCompleted
    });

    return {
      success: true,
      commitHash: commitResult.commitHash,
      attempts,
      qualityGateResults,
      reviewResults,
      filesModified: implResult.filesModified,
      filesCommitted: commitResult.filesCommitted,
      scopeViolations: commitResult.scopeViolations,
      metadata: {
        processId: 'methodologies/metaswarm/metaswarm-execution-loop',
        attribution: 'https://github.com/dsifry/metaswarm',
        author: 'David Sifry',
        timestamp: ctx.now()
      }
    };
  }

  // All retries exhausted
  return {
    success: false,
    commitHash: null,
    attempts,
    qualityGateResults,
    reviewResults,
    filesModified: [],
    filesCommitted: [],
    scopeViolations: [],
    metadata: {
      processId: 'methodologies/metaswarm/metaswarm-execution-loop',
      attribution: 'https://github.com/dsifry/metaswarm',
      author: 'David Sifry',
      timestamp: ctx.now()
    }
  };
}
