/**
 * @process methodologies/rpikit/rpikit-implement
 * @description RPIKit Implementation Phase - Disciplined execution of approved plans with step-by-step verification, stakes-based enforcement, phase checkpoints, and final code/security reviews.
 * @inputs { topic: string, planDocPath?: string, projectRoot?: string, useWorktree?: boolean }
 * @outputs { success: boolean, stepsCompleted: number, phasesCompleted: number, filesChanged: array, reviewResults: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const loadPlanTask = defineTask('rpikit-load-plan', async (args, _ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Load and Validate Approved Plan',
  labels: ['rpikit', 'implement', 'plan-load'],
  io: {
    inputs: { topic: 'string', planDocPath: 'string', projectRoot: 'string' },
    outputs: { planFound: 'boolean', approved: 'boolean', stakes: 'string', phases: 'array', tasks: 'array', planPath: 'string' }
  }
});

const setupWorktreeTask = defineTask('rpikit-setup-worktree', async (args, _ctx) => {
  return { worktree: args };
}, {
  kind: 'agent',
  title: 'Setup Git Worktree for Isolation',
  labels: ['rpikit', 'implement', 'worktree'],
  io: {
    inputs: { projectRoot: 'string', topic: 'string', stakes: 'string' },
    outputs: { worktreeCreated: 'boolean', worktreePath: 'string', branchName: 'string' }
  }
});

const executeStepTask = defineTask('rpikit-execute-step', async (args, _ctx) => {
  return { execution: args };
}, {
  kind: 'agent',
  title: 'Execute Plan Step with Verification',
  labels: ['rpikit', 'implement', 'execute'],
  io: {
    inputs: { step: 'object', phaseIndex: 'number', stepIndex: 'number', projectRoot: 'string' },
    outputs: { completed: 'boolean', filesModified: 'array', verificationPassed: 'boolean', verificationOutput: 'string', deviations: 'array' }
  }
});

const handleFailureTask = defineTask('rpikit-handle-failure', async (args, _ctx) => {
  return { resolution: args };
}, {
  kind: 'agent',
  title: 'Investigate and Resolve Step Failure',
  labels: ['rpikit', 'implement', 'failure-handling'],
  io: {
    inputs: { step: 'object', verificationOutput: 'string', context: 'object' },
    outputs: { diagnosis: 'string', proposedFix: 'string', requiresPlanChange: 'boolean', externalResearchNeeded: 'boolean' }
  }
});

const codeReviewTask = defineTask('rpikit-code-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Run Code Review on Changes',
  labels: ['rpikit', 'implement', 'code-review'],
  io: {
    inputs: { filesChanged: 'array', projectRoot: 'string' },
    outputs: { verdict: 'string', issues: 'array', positives: 'array', score: 'number' }
  }
});

const securityReviewTask = defineTask('rpikit-security-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Run Security Review on Changes',
  labels: ['rpikit', 'implement', 'security-review'],
  io: {
    inputs: { filesChanged: 'array', projectRoot: 'string' },
    outputs: { passed: 'boolean', vulnerabilities: 'array', recommendations: 'array', severity: 'string' }
  }
});

const completionSummaryTask = defineTask('rpikit-completion-summary', async (args, _ctx) => {
  return { summary: args };
}, {
  kind: 'agent',
  title: 'Generate Implementation Completion Summary',
  labels: ['rpikit', 'implement', 'summary'],
  io: {
    inputs: { topic: 'string', phasesCompleted: 'number', stepsCompleted: 'number', filesChanged: 'array', codeReview: 'object', securityReview: 'object' },
    outputs: { summary: 'string', successCriteriaMet: 'boolean', planDocUpdated: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * RPIKit Implementation Phase Process
 *
 * Executes approved plans with discipline: step-by-step verification,
 * phase checkpoints with human approval, failure investigation, and
 * mandatory code + security reviews before completion.
 *
 * Stakes enforcement:
 * - High: Requires approved plan; halt if missing
 * - Medium: Ask whether to plan first or proceed carefully
 * - Low: Proceed with inline planning
 *
 * Workflow:
 * 1. Load and validate the approved plan
 * 2. Optionally set up git worktree for isolation
 * 3. Execute steps with verification (read, modify, verify loop)
 * 4. Phase checkpoints with human approval
 * 5. Handle failures with investigation
 * 6. Run code review and security review
 * 7. Generate completion summary
 *
 * Attribution: Adapted from https://github.com/bostonaholic/rpikit by Matthew Boston
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.topic - The topic being implemented
 * @param {string} inputs.planDocPath - Path to the plan document
 * @param {string} inputs.projectRoot - Project root directory
 * @param {boolean} inputs.useWorktree - Whether to use git worktree isolation
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Implementation results with review outcomes
 */
export async function process(inputs, ctx) {
  const {
    topic,
    planDocPath = '',
    projectRoot = '.',
    useWorktree = false
  } = inputs;

  ctx.log('RPIKit Implement: Disciplined execution of approved plan');
  ctx.log('Principle: Follow the plan. Verify before declaring done.');

  // ============================================================================
  // STEP 1: LOAD PLAN
  // ============================================================================

  ctx.log('Step 1: Loading and validating approved plan');

  const plan = await ctx.task(loadPlanTask, {
    topic,
    planDocPath,
    projectRoot
  });

  if (!plan.planFound && plan.stakes === 'high') {
    await ctx.breakpoint({
      question: `HIGH STAKES: No approved plan found for "${topic}". Implementation halted. Run /rpikit:plan first.`,
      title: 'High Stakes - Plan Required',
      context: { runId: ctx.runId }
    });
    return { success: false, reason: 'High stakes implementation requires an approved plan' };
  }

  if (!plan.planFound && plan.stakes === 'medium') {
    await ctx.breakpoint({
      question: `MEDIUM STAKES: No plan found for "${topic}". Options: (1) Create plan first (recommended), (2) Proceed carefully, (3) Cancel.`,
      title: 'Medium Stakes - Plan Recommended',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 2: WORKTREE SETUP (OPTIONAL)
  // ============================================================================

  let workingRoot = projectRoot;
  if (useWorktree) {
    ctx.log('Step 2: Setting up git worktree for isolation');

    const worktree = await ctx.task(setupWorktreeTask, {
      projectRoot,
      topic,
      stakes: plan.stakes || 'medium'
    });

    if (worktree.worktreeCreated) {
      workingRoot = worktree.worktreePath;
      ctx.log(`Worktree created at: ${worktree.worktreePath}`);
    }
  }

  // ============================================================================
  // STEP 3-4: EXECUTE PHASES AND STEPS
  // ============================================================================

  const phases = plan.phases || [{ name: 'default', tasks: plan.tasks || [] }];
  let totalStepsCompleted = 0;
  let phasesCompleted = 0;
  const allFilesChanged = [];

  for (let pi = 0; pi < phases.length; pi++) {
    const phase = phases[pi];
    ctx.log(`Phase ${pi + 1}/${phases.length}: ${phase.name || 'Unnamed Phase'}`);

    const phaseTasks = phase.tasks || [];

    for (let si = 0; si < phaseTasks.length; si++) {
      const step = phaseTasks[si];
      ctx.log(`  Step ${si + 1}/${phaseTasks.length}: ${step.description || step.title || 'Step'}`);

      const execution = await ctx.task(executeStepTask, {
        step,
        phaseIndex: pi,
        stepIndex: si,
        projectRoot: workingRoot
      });

      if (!execution.verificationPassed) {
        ctx.log('  Verification FAILED - investigating');

        const failureResolution = await ctx.task(handleFailureTask, {
          step,
          verificationOutput: execution.verificationOutput,
          context: { phaseIndex: pi, stepIndex: si, filesModified: execution.filesModified }
        });

        if (failureResolution.requiresPlanChange) {
          await ctx.breakpoint({
            question: `Step verification failed and requires plan adjustment. Diagnosis: ${failureResolution.diagnosis}. Proposed fix: ${failureResolution.proposedFix}. Approve deviation?`,
            title: 'Plan Deviation Required',
            context: { runId: ctx.runId }
          });
        }
      }

      if (execution.filesModified) {
        allFilesChanged.push(...execution.filesModified);
      }
      totalStepsCompleted++;
    }

    phasesCompleted++;

    // Phase checkpoint
    if (pi < phases.length - 1) {
      await ctx.breakpoint({
        question: `Phase "${phase.name || pi + 1}" complete (${phaseTasks.length} steps). ${phases.length - pi - 1} phases remaining. Continue, review, or pause?`,
        title: `Phase Checkpoint ${pi + 1}/${phases.length}`,
        context: { runId: ctx.runId }
      });
    }
  }

  // ============================================================================
  // STEP 5: CODE REVIEW
  // ============================================================================

  ctx.log('Step 5: Running code review');

  const codeReview = await ctx.task(codeReviewTask, {
    filesChanged: allFilesChanged,
    projectRoot: workingRoot
  });

  if (codeReview.verdict === 'REQUEST_CHANGES') {
    await ctx.breakpoint({
      question: `Code review: REQUEST CHANGES. ${codeReview.issues.length} issues found. Address issues before proceeding? (Recommended)`,
      title: 'Code Review - Changes Requested',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 6: SECURITY REVIEW
  // ============================================================================

  ctx.log('Step 6: Running security review');

  const securityReview = await ctx.task(securityReviewTask, {
    filesChanged: allFilesChanged,
    projectRoot: workingRoot
  });

  if (!securityReview.passed) {
    await ctx.breakpoint({
      question: `SECURITY REVIEW FAILED. ${securityReview.vulnerabilities.length} vulnerabilities found (severity: ${securityReview.severity}). Must fix before completion.`,
      title: 'Security Review Failed',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 7: COMPLETION SUMMARY
  // ============================================================================

  ctx.log('Step 7: Generating completion summary');

  const summary = await ctx.task(completionSummaryTask, {
    topic,
    phasesCompleted,
    stepsCompleted: totalStepsCompleted,
    filesChanged: allFilesChanged,
    codeReview,
    securityReview
  });

  return {
    success: true,
    topic,
    stepsCompleted: totalStepsCompleted,
    phasesCompleted,
    filesChanged: [...new Set(allFilesChanged)],
    reviewResults: {
      codeReview: { verdict: codeReview.verdict, score: codeReview.score },
      securityReview: { passed: securityReview.passed, severity: securityReview.severity }
    },
    summary: summary.summary,
    metadata: {
      processId: 'methodologies/rpikit/rpikit-implement',
      attribution: 'https://github.com/bostonaholic/rpikit',
      author: 'Matthew Boston',
      timestamp: ctx.now()
    }
  };
}
