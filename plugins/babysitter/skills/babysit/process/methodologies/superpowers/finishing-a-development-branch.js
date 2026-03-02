/**
 * @process methodologies/superpowers/finishing-a-development-branch
 * @description Finishing a Development Branch - Verify tests, present structured options, execute chosen workflow, clean up
 * @inputs { branchName: string, baseBranch?: string, worktreePath?: string, action?: string }
 * @outputs { success: boolean, action: string, prUrl: string, merged: boolean, cleanedUp: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentVerifyTestsTask = defineTask('finish-verify-tests', async (args, ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify All Tests Pass Before Finishing',
  labels: ['superpowers', 'finishing', 'verification'],
  io: {
    inputs: { worktreePath: 'string', branchName: 'string' },
    outputs: { allPass: 'boolean', testOutput: 'string', failCount: 'number', testCommand: 'string' }
  }
});

const agentDetermineBaseBranchTask = defineTask('finish-determine-base', async (args, ctx) => {
  return { base: args };
}, {
  kind: 'agent',
  title: 'Determine Base Branch for Merge',
  labels: ['superpowers', 'finishing', 'branch-analysis'],
  io: {
    inputs: { branchName: 'string', worktreePath: 'string' },
    outputs: { baseBranch: 'string', commitsBehind: 'number', commitsAhead: 'number', conflictsLikely: 'boolean' }
  }
});

const agentExecuteFinishAction = defineTask('finish-execute-action', async (args, ctx) => {
  return { result: args };
}, {
  kind: 'agent',
  title: 'Execute Finish Action (merge/PR/keep/discard)',
  labels: ['superpowers', 'finishing', 'branch-management'],
  io: {
    inputs: { action: 'string', branchName: 'string', baseBranch: 'string', worktreePath: 'string' },
    outputs: { action: 'string', prUrl: 'string', merged: 'boolean', cleanedUp: 'boolean', summary: 'string' }
  }
});

const agentCleanupWorktreeTask = defineTask('finish-cleanup-worktree', async (args, ctx) => {
  return { cleanup: args };
}, {
  kind: 'agent',
  title: 'Clean Up Worktree After Finishing',
  labels: ['superpowers', 'finishing', 'cleanup'],
  io: {
    inputs: { worktreePath: 'string', branchName: 'string', removeBranch: 'boolean' },
    outputs: { worktreeRemoved: 'boolean', branchRemoved: 'boolean', summary: 'string' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Finishing a Development Branch Process
 *
 * Structured completion workflow:
 * 1. Verify all tests pass (STOP if they fail)
 * 2. Determine base branch
 * 3. Present exactly 4 options to the user
 * 4. Execute chosen option
 * 5. Clean up worktree (Options 1 and 4 only)
 *
 * Options:
 * 1. Merge back to base branch locally
 * 2. Push and create a Pull Request
 * 3. Keep the branch as-is
 * 4. Discard this work (requires typed confirmation)
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.branchName - Name of the development branch
 * @param {string} inputs.baseBranch - Base branch to merge into (auto-detected if not provided)
 * @param {string} inputs.worktreePath - Path to the worktree directory
 * @param {string} inputs.action - Pre-selected action: 'merge' | 'pr' | 'keep' | 'discard'
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Finish results
 */
export async function process(inputs, ctx) {
  const {
    branchName,
    baseBranch = null,
    worktreePath = null,
    action = null
  } = inputs;

  ctx.log('Starting Finishing a Development Branch', { branchName });

  // ============================================================================
  // STEP 1: VERIFY ALL TESTS PASS
  // ============================================================================

  ctx.log('Step 1: Verifying all tests pass before finishing');

  const testResult = await ctx.task(agentVerifyTestsTask, {
    worktreePath: worktreePath || ctx.runDir,
    branchName
  });

  if (!testResult.allPass) {
    await ctx.breakpoint({
      question: `Tests are failing (${testResult.failCount} failures). You MUST fix tests before finishing the branch. Review the output and resolve failures.`,
      title: 'Tests Failing - Cannot Finish',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/finish/test-output.txt', format: 'text', label: 'Test Output' }
        ]
      }
    });
  }

  // ============================================================================
  // STEP 2: DETERMINE BASE BRANCH
  // ============================================================================

  ctx.log('Step 2: Determining base branch');

  const baseResult = await ctx.task(agentDetermineBaseBranchTask, {
    branchName,
    worktreePath: worktreePath || ctx.runDir
  });

  const resolvedBaseBranch = baseBranch || baseResult.baseBranch || 'main';

  // ============================================================================
  // STEP 3: PRESENT OPTIONS
  // ============================================================================

  let selectedAction = action;

  if (!selectedAction) {
    await ctx.breakpoint({
      question: `Branch "${branchName}" is ready to finish (${baseResult.commitsAhead} commits ahead of ${resolvedBaseBranch}). Choose an option:\n\n1. **Merge** back to ${resolvedBaseBranch} locally\n2. **Push and create a Pull Request**\n3. **Keep** the branch as-is\n4. **Discard** this work (type DISCARD to confirm)\n\nWhich option?`,
      title: 'Finish Development Branch',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/finish/branch-status.md', format: 'markdown', label: 'Branch Status' }
        ]
      }
    });
  }

  // ============================================================================
  // STEP 4: EXECUTE CHOSEN ACTION
  // ============================================================================

  ctx.log('Step 4: Executing finish action', { action: selectedAction || 'user-selected' });

  const finishResult = await ctx.task(agentExecuteFinishAction, {
    action: selectedAction || 'pr',
    branchName,
    baseBranch: resolvedBaseBranch,
    worktreePath: worktreePath || ctx.runDir
  });

  // ============================================================================
  // STEP 5: CLEAN UP WORKTREE (merge and discard only)
  // ============================================================================

  let cleanupResult = null;
  const actionTaken = finishResult.action || selectedAction || 'pr';

  if (actionTaken === 'merge' || actionTaken === 'discard') {
    ctx.log('Step 5: Cleaning up worktree');

    cleanupResult = await ctx.task(agentCleanupWorktreeTask, {
      worktreePath: worktreePath || ctx.runDir,
      branchName,
      removeBranch: actionTaken === 'discard'
    });
  }

  return {
    success: true,
    branchName,
    baseBranch: resolvedBaseBranch,
    action: actionTaken,
    prUrl: finishResult.prUrl || null,
    merged: finishResult.merged || false,
    cleanedUp: cleanupResult ? cleanupResult.worktreeRemoved : false,
    testsVerified: testResult.allPass,
    metadata: {
      processId: 'methodologies/superpowers/finishing-a-development-branch',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
