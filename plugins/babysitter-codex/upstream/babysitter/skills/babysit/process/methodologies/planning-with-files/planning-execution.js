/**
 * @process methodologies/planning-with-files/planning-execution
 * @description Planning with Files - Task execution with 2-action rule, error logging, and findings capture
 * @inputs { taskDescription: string, projectPath: string, phase: object, errorHistory?: array, maxActions?: number }
 * @outputs { success: boolean, completedGoals: array, findings: array, decisions: array, errors: array, actionCount: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Planning with Files - Task Execution Engine
 *
 * Adapted from Planning with Files (https://github.com/OthmanAdi/planning-with-files)
 * Handles task execution within a plan phase, enforcing the 2-Action Rule
 * (save findings after every 2 view/browser operations), comprehensive
 * error logging, and systematic findings capture.
 *
 * Key Rules Enforced:
 * - 2-Action Rule: save findings after every 2 view/browser ops
 * - Log ALL errors: avoid repetition by tracking in files
 * - Never repeat failures: check history, mutate approach
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.taskDescription - Overall task description
 * @param {string} inputs.projectPath - Root path for planning files
 * @param {Object} inputs.phase - Phase object with name, goals, and dependencies
 * @param {Array} inputs.errorHistory - Previous errors to avoid repeating
 * @param {number} inputs.maxActions - Maximum actions per execution (default: 20)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Execution results with goals, findings, decisions, and errors
 */
export async function process(inputs, ctx) {
  const {
    taskDescription,
    projectPath,
    phase,
    errorHistory = [],
    maxActions = 20
  } = inputs;

  ctx.log(`Executing phase: ${phase.name}`);
  ctx.log(`Goals to complete: ${phase.goals.length}`);
  ctx.log(`Known error patterns to avoid: ${errorHistory.length}`);

  // --- Step 1: Pre-execution plan review (Attention Manipulation) ---
  const planState = await ctx.task(preExecutionReviewTask, {
    projectPath,
    phaseName: phase.name,
    errorHistory
  });

  ctx.log(`Plan state loaded. ${planState.completedGoalCount} goals already done.`);

  // --- Step 2: Analyze error history for approach mutations ---
  let approachMutations = null;
  if (errorHistory.length > 0) {
    approachMutations = await ctx.task(analyzeErrorPatternsTask, {
      errorHistory,
      phase,
      taskDescription
    });
    ctx.log(`Error analysis complete. ${approachMutations.mutationCount} approach mutations suggested.`);
  }

  // --- Step 3: Execute goals with 2-action rule ---
  const executionResults = {
    completedGoals: [],
    findings: [],
    decisions: [],
    errors: [],
    actionCount: 0
  };

  const pendingGoals = phase.goals.filter(g => !planState.completedGoals.includes(g.id));

  for (const goal of pendingGoals) {
    if (executionResults.actionCount >= maxActions) {
      ctx.log(`Max actions reached (${maxActions}). Pausing execution.`);
      break;
    }

    ctx.log(`Working on goal: ${goal.description}`);

    // Execute goal with error avoidance
    const goalResult = await ctx.task(executeGoalTask, {
      projectPath,
      taskDescription,
      goal,
      phaseName: phase.name,
      approachMutations,
      currentFindings: executionResults.findings
    });

    executionResults.actionCount += goalResult.actionsUsed;

    if (goalResult.success) {
      executionResults.completedGoals.push(goal.id);
    }

    if (goalResult.findings.length > 0) {
      executionResults.findings.push(...goalResult.findings);
    }

    if (goalResult.decisions.length > 0) {
      executionResults.decisions.push(...goalResult.decisions);
    }

    if (goalResult.errors.length > 0) {
      executionResults.errors.push(...goalResult.errors);

      // Log errors immediately (Manus Principle 3: Error Persistence)
      await ctx.task(immediateErrorLogTask, {
        projectPath,
        phaseName: phase.name,
        goalId: goal.id,
        errors: goalResult.errors
      });
    }

    // 2-Action Rule: save findings after every 2 actions
    if (executionResults.actionCount % 2 === 0 && executionResults.findings.length > 0) {
      ctx.log('2-Action Rule: persisting findings to disk');
      await ctx.task(persistFindingsBatchTask, {
        projectPath,
        phaseName: phase.name,
        findings: executionResults.findings.slice(-2),
        actionCount: executionResults.actionCount
      });
    }
  }

  // --- Step 4: Final findings flush ---
  ctx.log('Flushing remaining findings to disk');
  await ctx.parallel.all([
    ctx.task(finalFindingsFlushTask, {
      projectPath,
      phaseName: phase.name,
      findings: executionResults.findings,
      decisions: executionResults.decisions
    }),
    ctx.task(finalProgressUpdateTask, {
      projectPath,
      phaseName: phase.name,
      completedGoals: executionResults.completedGoals,
      totalGoals: phase.goals.length,
      actionCount: executionResults.actionCount,
      errorCount: executionResults.errors.length
    })
  ]);

  return {
    success: executionResults.errors.length === 0 || executionResults.completedGoals.length > 0,
    completedGoals: executionResults.completedGoals,
    findings: executionResults.findings,
    decisions: executionResults.decisions,
    errors: executionResults.errors,
    actionCount: executionResults.actionCount
  };
}

// --- Task Definitions ---

const preExecutionReviewTask = defineTask('pwf-pre-execution-review', {
  kind: 'agent',
  title: 'Pre-Execution Plan Review (Attention Manipulation)',
  labels: ['planning-with-files', 'execution', 'attention'],
  io: {
    input: 'Project path, phase name, error history',
    output: 'Current plan state with completed goals and known issues'
  },
  agent: 'agents/execution-monitor',
  instructions: [
    'Re-read task_plan.md before execution (Manus Principle 2)',
    'Parse checkbox state for the target phase',
    'List already-completed goals',
    'Check progress.md for relevant error context',
    'Return structured plan state for execution decisions'
  ]
});

const analyzeErrorPatternsTask = defineTask('pwf-analyze-error-patterns', {
  kind: 'agent',
  title: 'Analyze Error Patterns for Approach Mutations',
  labels: ['planning-with-files', 'errors', 'analysis'],
  io: {
    input: 'Error history, phase details, task description',
    output: 'Approach mutations with mutation count and alternative strategies'
  },
  agent: 'agents/error-analyst',
  instructions: [
    'Never repeat failures: analyze error patterns (Rule 4)',
    'Group errors by type and identify recurring patterns',
    'For each pattern, suggest an alternative approach',
    'Rank mutations by likelihood of success',
    'Return mutation suggestions with rationale'
  ]
});

const executeGoalTask = defineTask('pwf-execute-goal', {
  kind: 'agent',
  title: 'Execute Single Goal with Error Avoidance',
  labels: ['planning-with-files', 'execution', 'goal'],
  io: {
    input: 'Project path, task description, goal, phase name, approach mutations, current findings',
    output: 'Goal result with success flag, findings, decisions, errors, actions used'
  },
  agent: 'agents/execution-monitor',
  instructions: [
    'Execute the goal using the best available approach',
    'If approach mutations exist for this goal type, use the mutated approach',
    'Capture all findings and decisions during execution',
    'Log any errors with full context',
    'Track action count for 2-action rule compliance',
    'Return comprehensive goal result'
  ]
});

const immediateErrorLogTask = defineTask('pwf-immediate-error-log', {
  kind: 'agent',
  title: 'Immediately Log Errors to Disk',
  labels: ['planning-with-files', 'errors', 'immediate'],
  io: {
    input: 'Project path, phase name, goal ID, errors',
    output: 'Error logging confirmation'
  },
  agent: 'agents/error-analyst',
  instructions: [
    'Log ALL errors immediately to progress.md (Rule 3)',
    'Include goal ID, phase name, error message, and timestamp',
    'Include reproduction steps and stack traces when available',
    'Tag with severity: critical, warning, or informational',
    'Error Persistence principle: never lose error context'
  ]
});

const persistFindingsBatchTask = defineTask('pwf-persist-findings-batch', {
  kind: 'agent',
  title: 'Persist Findings Batch (2-Action Rule)',
  labels: ['planning-with-files', 'findings', '2-action-rule'],
  io: {
    input: 'Project path, phase name, recent findings, action count',
    output: 'Findings persistence confirmation'
  },
  agent: 'agents/findings-curator',
  instructions: [
    '2-Action Rule: save findings after every 2 view/browser operations',
    'Append findings batch to findings.md under current phase section',
    'Include action count for audit trail',
    'Timestamp each finding entry',
    'Filesystem as Memory: persist to disk before continuing'
  ]
});

const finalFindingsFlushTask = defineTask('pwf-final-findings-flush', {
  kind: 'agent',
  title: 'Final Findings Flush to Disk',
  labels: ['planning-with-files', 'findings', 'flush'],
  io: {
    input: 'Project path, phase name, all findings, all decisions',
    output: 'Final findings persistence confirmation'
  },
  agent: 'agents/findings-curator',
  instructions: [
    'Write complete findings and decisions to findings.md',
    'Deduplicate against existing entries',
    'Organize by discovery order with timestamps',
    'Include decision rationale for each decision',
    'Ensure nothing is lost in context window'
  ]
});

const finalProgressUpdateTask = defineTask('pwf-final-progress-update', {
  kind: 'agent',
  title: 'Final Progress Update for Phase',
  labels: ['planning-with-files', 'progress', 'final'],
  io: {
    input: 'Project path, phase name, completed goals, total goals, action count, error count',
    output: 'Progress update confirmation'
  },
  agent: 'agents/execution-monitor',
  instructions: [
    'Update progress.md with phase completion summary',
    'Record completed goals count vs total',
    'Log total actions taken and errors encountered',
    'Add timestamp for session recovery support',
    'Update overall progress indicator'
  ]
});
