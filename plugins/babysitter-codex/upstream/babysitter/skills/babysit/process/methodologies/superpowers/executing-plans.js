/**
 * @process methodologies/superpowers/executing-plans
 * @description Executing Plans - Load plan, execute tasks in batches with checkpoints, verify between batches, finish branch
 * @inputs { planPath: string, batchSize?: number, worktreePath?: string, resumeFromTask?: number }
 * @outputs { success: boolean, completedTasks: number, totalTasks: number, batchReports: array, verificationResult: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentLoadPlanTask = defineTask('execute-load-plan', async (args, ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Load and Review Plan',
  labels: ['superpowers', 'executing-plans', 'plan-loading'],
  io: {
    inputs: { planPath: 'string' },
    outputs: { tasks: 'array', concerns: 'array', planContent: 'string', tasksJson: 'object' }
  }
});

const agentSetupWorktreeTask = defineTask('execute-setup-worktree', async (args, ctx) => {
  return { worktree: args };
}, {
  kind: 'agent',
  title: 'Setup or Verify Worktree',
  labels: ['superpowers', 'executing-plans', 'worktree'],
  io: {
    inputs: { planPath: 'string', branchName: 'string' },
    outputs: { worktreePath: 'string', isExisting: 'boolean', testsPass: 'boolean' }
  }
});

const agentExecuteTaskStepTask = defineTask('execute-task-step', async (args, ctx) => {
  return { result: args };
}, {
  kind: 'agent',
  title: 'Execute Plan Task',
  labels: ['superpowers', 'executing-plans', 'implementation'],
  io: {
    inputs: { taskSpec: 'object', taskIndex: 'number', worktreePath: 'string' },
    outputs: { filesChanged: 'array', testResults: 'object', committed: 'boolean', verificationOutput: 'string' }
  }
});

const agentSyncTaskPersistenceTask = defineTask('execute-sync-persistence', async (args, ctx) => {
  return { synced: args };
}, {
  kind: 'agent',
  title: 'Sync Task Persistence File',
  labels: ['superpowers', 'executing-plans', 'persistence'],
  io: {
    inputs: { tasksJsonPath: 'string', taskId: 'number', status: 'string' },
    outputs: { synced: 'boolean' }
  }
});

const agentBatchReportTask = defineTask('execute-batch-report', async (args, ctx) => {
  return { report: args };
}, {
  kind: 'agent',
  title: 'Generate Batch Report',
  labels: ['superpowers', 'executing-plans', 'reporting'],
  io: {
    inputs: { batchNum: 'number', taskResults: 'array', totalTasks: 'number' },
    outputs: { report: 'string', implementedFeatures: 'array', verificationOutputs: 'array' }
  }
});

const agentFinishBranchTask = defineTask('execute-finish-branch', async (args, ctx) => {
  return { finish: args };
}, {
  kind: 'agent',
  title: 'Finish Development Branch',
  labels: ['superpowers', 'executing-plans', 'finishing'],
  io: {
    inputs: { worktreePath: 'string', action: 'string' },
    outputs: { action: 'string', prUrl: 'string', merged: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Executing Plans Process
 *
 * Batch execution with human checkpoints:
 * 1. Load plan and .tasks.json (resume support)
 * 2. Setup/verify worktree
 * 3. Execute tasks in batches (default 3)
 * 4. Report after each batch, wait for feedback
 * 5. Sync .tasks.json after every status change
 * 6. Finish branch after all tasks complete
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.planPath - Path to implementation plan
 * @param {number} inputs.batchSize - Tasks per batch (default: 3)
 * @param {string} inputs.worktreePath - Existing worktree path (optional)
 * @param {number} inputs.resumeFromTask - Task index to resume from (default: 0)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Execution results with batch reports
 */
export async function process(inputs, ctx) {
  const {
    planPath,
    batchSize = 3,
    worktreePath = null,
    resumeFromTask = 0
  } = inputs;

  ctx.log('Starting Executing Plans process', { planPath, batchSize });

  // ============================================================================
  // STEP 0: LOAD PLAN AND PERSISTED TASKS
  // ============================================================================

  ctx.log('Step 0: Loading plan and task persistence');

  const planResult = await ctx.task(agentLoadPlanTask, { planPath });

  const tasks = planResult.tasks || [];
  const tasksJsonPath = `${planPath}.tasks.json`;

  if (planResult.concerns && planResult.concerns.length > 0) {
    await ctx.breakpoint({
      question: `Plan review found ${planResult.concerns.length} concern(s) before starting execution:\n${planResult.concerns.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nProceed with execution or address concerns first?`,
      title: 'Plan Review Concerns',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 0.5: VERIFY/SETUP WORKTREE
  // ============================================================================

  let activeWorktreePath = worktreePath;

  if (!activeWorktreePath) {
    ctx.log('Step 0.5: Setting up worktree');

    const worktreeResult = await ctx.task(agentSetupWorktreeTask, {
      planPath,
      branchName: `feature/${planPath.replace(/[^a-z0-9]/gi, '-').slice(0, 40)}`
    });

    activeWorktreePath = worktreeResult.worktreePath;

    if (!worktreeResult.testsPass) {
      await ctx.breakpoint({
        question: `Baseline tests failing in worktree. Investigate before proceeding?`,
        title: 'Worktree Baseline Failure',
        context: { runId: ctx.runId }
      });
    }
  }

  // ============================================================================
  // STEP 2: EXECUTE IN BATCHES
  // ============================================================================

  const batchReports = [];
  const taskResults = [];
  let startIndex = resumeFromTask;

  for (let batchStart = startIndex; batchStart < tasks.length; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, tasks.length);
    const batch = tasks.slice(batchStart, batchEnd);
    const batchNum = Math.floor(batchStart / batchSize) + 1;

    ctx.log(`Batch ${batchNum}: Executing tasks ${batchStart + 1}-${batchEnd} of ${tasks.length}`);

    // Execute each task in batch sequentially
    for (let j = 0; j < batch.length; j++) {
      const taskSpec = batch[j];
      const globalIndex = batchStart + j;

      // Mark in_progress
      await ctx.task(agentSyncTaskPersistenceTask, {
        tasksJsonPath,
        taskId: globalIndex,
        status: 'in_progress'
      });

      // Execute task following plan steps exactly
      const taskResult = await ctx.task(agentExecuteTaskStepTask, {
        taskSpec,
        taskIndex: globalIndex,
        worktreePath: activeWorktreePath
      });

      // Mark completed
      await ctx.task(agentSyncTaskPersistenceTask, {
        tasksJsonPath,
        taskId: globalIndex,
        status: 'completed'
      });

      taskResults.push({
        taskIndex: globalIndex,
        subject: taskSpec.subject || `Task ${globalIndex + 1}`,
        ...taskResult
      });
    }

    // Generate batch report
    const report = await ctx.task(agentBatchReportTask, {
      batchNum,
      taskResults: taskResults.slice(batchStart, batchEnd),
      totalTasks: tasks.length
    });

    batchReports.push(report);

    // Batch checkpoint (unless this is the last batch)
    if (batchEnd < tasks.length) {
      await ctx.breakpoint({
        question: `Batch ${batchNum} complete (Tasks ${batchStart + 1}-${batchEnd} of ${tasks.length}).\n\nImplemented: ${report.implementedFeatures ? report.implementedFeatures.join(', ') : 'See report'}\n\nReady for feedback. Continue to next batch?`,
        title: `Batch ${batchNum} Checkpoint`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/batch-${batchNum}-report.md`, format: 'markdown', label: `Batch ${batchNum} Report` }
          ]
        }
      });
    }
  }

  // ============================================================================
  // STEP 5: FINISH BRANCH
  // ============================================================================

  ctx.log('All tasks complete. Finishing development branch.');

  await ctx.breakpoint({
    question: `All ${tasks.length} tasks complete. Choose how to finish:\n1. Merge back to base branch locally\n2. Push and create a Pull Request\n3. Keep the branch as-is\n4. Discard this work`,
    title: 'Finish Development Branch',
    context: { runId: ctx.runId }
  });

  const finishResult = await ctx.task(agentFinishBranchTask, {
    worktreePath: activeWorktreePath,
    action: inputs.finishAction || 'pr'
  });

  return {
    success: true,
    planPath,
    completedTasks: taskResults.length,
    totalTasks: tasks.length,
    batchReports,
    taskResults,
    finishResult,
    metadata: {
      processId: 'methodologies/superpowers/executing-plans',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
