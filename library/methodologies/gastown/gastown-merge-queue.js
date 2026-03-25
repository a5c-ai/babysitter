/**
 * @process methodologies/gastown/gastown-merge-queue
 * @description Gas Town Refinery Merge Queue - Collect, detect conflicts, resolve, merge, and verify integration of agent work
 * @inputs { convoyId?: string, branches?: array, targetBranch?: string, conflictStrategy?: string, verifyTests?: boolean }
 * @outputs { success: boolean, mergedBranches: array, conflicts: array, verificationResult: object, integrationReport: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const collectChangesTask = defineTask('gastown-collect-changes', async (args, _ctx) => {
  return { changes: args };
}, {
  kind: 'agent',
  title: 'Collect All Pending Changes from Agents',
  labels: ['gastown', 'merge-queue', 'collection'],
  io: {
    inputs: { convoyId: 'string', branches: 'array', targetBranch: 'string' },
    outputs: { pendingChanges: 'array', branchDiffs: 'array', fileConflicts: 'array', mergeOrder: 'array' }
  }
});

const detectConflictsTask = defineTask('gastown-detect-conflicts', async (args, _ctx) => {
  return { conflicts: args };
}, {
  kind: 'agent',
  title: 'Detect Merge Conflicts Between Branches',
  labels: ['gastown', 'merge-queue', 'conflict-detection'],
  io: {
    inputs: { branches: 'array', targetBranch: 'string', branchDiffs: 'array' },
    outputs: { conflicts: 'array', conflictPairs: 'array', severity: 'object', autoResolvable: 'array', manualRequired: 'array' }
  }
});

const resolveConflictsTask = defineTask('gastown-resolve-conflicts', async (args, _ctx) => {
  return { resolution: args };
}, {
  kind: 'agent',
  title: 'Resolve Detected Merge Conflicts',
  labels: ['gastown', 'merge-queue', 'conflict-resolution'],
  io: {
    inputs: { conflicts: 'array', conflictStrategy: 'string', context: 'object' },
    outputs: { resolved: 'array', unresolved: 'array', resolutionLog: 'array', patchFiles: 'array' }
  }
});

const mergeChangesTask = defineTask('gastown-merge-changes', async (args, _ctx) => {
  return { merge: args };
}, {
  kind: 'agent',
  title: 'Merge Resolved Changes into Target Branch',
  labels: ['gastown', 'merge-queue', 'merge'],
  io: {
    inputs: { mergeOrder: 'array', targetBranch: 'string', patchFiles: 'array', convoyId: 'string' },
    outputs: { mergedBranches: 'array', mergeCommits: 'array', failedMerges: 'array', attribution: 'object' }
  }
});

const verifyIntegrationTask = defineTask('gastown-verify-integration', async (args, _ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify Integration - Tests and Quality Checks',
  labels: ['gastown', 'merge-queue', 'verification'],
  io: {
    inputs: { targetBranch: 'string', mergeCommits: 'array', testSuites: 'array', qualityCriteria: 'object' },
    outputs: { allPassed: 'boolean', testResults: 'object', lintResults: 'object', buildResult: 'object', qualityScore: 'number' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Gas Town Refinery Merge Queue Process
 *
 * Implements the Refinery pattern from Gas Town: a per-rig merge queue processor
 * that collects completed work from agents, detects and resolves conflicts,
 * merges in dependency order, and verifies integration.
 *
 * Workflow:
 * 1. Collect all pending changes from agent branches
 * 2. Detect conflicts between branches and target
 * 3. Resolve conflicts (auto where possible, escalate manual)
 * 4. Merge changes in dependency order
 * 5. Verify integration with tests and quality checks
 *
 * Attribution: Adapted from https://github.com/steveyegge/gastown by Steve Yegge
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.convoyId - Convoy being merged
 * @param {Array} inputs.branches - Branch names to merge
 * @param {string} inputs.targetBranch - Target branch for merge (default: 'main')
 * @param {string} inputs.conflictStrategy - 'auto', 'manual', 'theirs', 'ours' (default: 'auto')
 * @param {boolean} inputs.verifyTests - Run test suite after merge (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Merge queue results
 */
export async function process(inputs, ctx) {
  const {
    convoyId = 'unknown',
    branches = [],
    targetBranch = 'main',
    conflictStrategy = 'auto',
    verifyTests = true
  } = inputs;

  ctx.log('Refinery: Starting merge queue processing', { convoyId, branchCount: branches.length });

  // ============================================================================
  // STEP 1: COLLECT CHANGES
  // ============================================================================

  ctx.log('Step 1: Collecting pending changes');

  const collectResult = await ctx.task(collectChangesTask, {
    convoyId,
    branches,
    targetBranch
  });

  // ============================================================================
  // STEP 2: DETECT CONFLICTS
  // ============================================================================

  ctx.log('Step 2: Detecting merge conflicts');

  const conflictResult = await ctx.task(detectConflictsTask, {
    branches,
    targetBranch,
    branchDiffs: collectResult.branchDiffs
  });

  // ============================================================================
  // STEP 3: RESOLVE CONFLICTS
  // ============================================================================

  let resolveResult = { resolved: [], unresolved: [], resolutionLog: [], patchFiles: [] };

  if (conflictResult.conflicts.length > 0) {
    ctx.log('Step 3: Resolving conflicts', { count: conflictResult.conflicts.length });

    resolveResult = await ctx.task(resolveConflictsTask, {
      conflicts: conflictResult.conflicts,
      conflictStrategy,
      context: { convoyId, targetBranch }
    });

    if (resolveResult.unresolved.length > 0) {
      await ctx.breakpoint({
        question: `${resolveResult.unresolved.length} merge conflicts require manual resolution. Auto-resolved: ${resolveResult.resolved.length}. Review and resolve the remaining conflicts.`,
        title: `Manual Conflict Resolution: ${convoyId}`,
        context: { runId: ctx.runId }
      });
    }
  } else {
    ctx.log('Step 3: No conflicts detected, skipping resolution');
  }

  // ============================================================================
  // STEP 4: MERGE CHANGES
  // ============================================================================

  ctx.log('Step 4: Merging changes');

  const mergeResult = await ctx.task(mergeChangesTask, {
    mergeOrder: collectResult.mergeOrder,
    targetBranch,
    patchFiles: resolveResult.patchFiles,
    convoyId
  });

  // ============================================================================
  // STEP 5: VERIFY INTEGRATION
  // ============================================================================

  let verificationResult = { allPassed: true, testResults: {}, qualityScore: 100 };

  if (verifyTests) {
    ctx.log('Step 5: Verifying integration');

    verificationResult = await ctx.task(verifyIntegrationTask, {
      targetBranch,
      mergeCommits: mergeResult.mergeCommits,
      testSuites: inputs.testSuites || ['unit', 'integration'],
      qualityCriteria: inputs.qualityCriteria || { minScore: 80 }
    });

    if (!verificationResult.allPassed) {
      await ctx.breakpoint({
        question: `Integration verification failed. Quality score: ${verificationResult.qualityScore}. Test results available for review. Decide whether to revert or fix forward.`,
        title: `Integration Failure: ${convoyId}`,
        context: { runId: ctx.runId }
      });
    }
  }

  return {
    success: mergeResult.failedMerges.length === 0 && verificationResult.allPassed,
    convoyId,
    mergedBranches: mergeResult.mergedBranches,
    conflicts: {
      detected: conflictResult.conflicts.length,
      autoResolved: resolveResult.resolved.length,
      manualResolved: resolveResult.unresolved.length
    },
    verificationResult: {
      passed: verificationResult.allPassed,
      qualityScore: verificationResult.qualityScore
    },
    integrationReport: {
      mergeCommits: mergeResult.mergeCommits,
      attribution: mergeResult.attribution,
      failedMerges: mergeResult.failedMerges
    },
    metadata: {
      processId: 'methodologies/gastown/gastown-merge-queue',
      attribution: 'https://github.com/steveyegge/gastown',
      author: 'Steve Yegge',
      timestamp: ctx.now()
    }
  };
}
