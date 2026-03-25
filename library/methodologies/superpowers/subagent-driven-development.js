/**
 * @process methodologies/superpowers/subagent-driven-development
 * @description Subagent-Driven Development - Fresh agent per task with two-stage review (spec compliance then code quality)
 * @inputs { planPath: string, worktreePath?: string, maxReviewAttempts?: number }
 * @outputs { success: boolean, completedTasks: number, totalTasks: number, taskResults: array, finalReview: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentLoadPlanTask = defineTask('sdd-load-plan', async (args, ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Load Plan and Extract Tasks',
  labels: ['superpowers', 'subagent-driven', 'plan-loading'],
  io: {
    inputs: { planPath: 'string' },
    outputs: { tasks: 'array', planContent: 'string', totalTasks: 'number' }
  }
});

const agentImplementerTask = defineTask('sdd-implementer', async (args, ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'Implementer Subagent',
  labels: ['superpowers', 'subagent-driven', 'implementation'],
  io: {
    inputs: {
      taskSpec: 'object',
      taskIndex: 'number',
      sceneContext: 'string',
      worktreePath: 'string',
      fixInstructions: 'object'
    },
    outputs: {
      filesChanged: 'array',
      testsWritten: 'array',
      testResults: 'object',
      committed: 'boolean',
      selfReview: 'object',
      questions: 'array',
      summary: 'string',
      baseSha: 'string',
      headSha: 'string'
    }
  }
});

const agentSpecReviewerTask = defineTask('sdd-spec-reviewer', async (args, ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Spec Compliance Reviewer',
  labels: ['superpowers', 'subagent-driven', 'spec-review'],
  io: {
    inputs: { taskSpec: 'object', implementerReport: 'object' },
    outputs: {
      compliant: 'boolean',
      missingRequirements: 'array',
      extraWork: 'array',
      misunderstandings: 'array'
    }
  }
});

const agentCodeQualityReviewerTask = defineTask('sdd-code-quality-reviewer', async (args, ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Code Quality Reviewer',
  labels: ['superpowers', 'subagent-driven', 'quality-review'],
  io: {
    inputs: {
      whatWasImplemented: 'string',
      planOrRequirements: 'string',
      baseSha: 'string',
      headSha: 'string',
      description: 'string'
    },
    outputs: {
      approved: 'boolean',
      strengths: 'array',
      issues: 'array',
      assessment: 'string'
    }
  }
});

const agentFinalCodeReviewTask = defineTask('sdd-final-review', async (args, ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Final Code Review (Entire Implementation)',
  labels: ['superpowers', 'subagent-driven', 'final-review'],
  io: {
    inputs: { planPath: 'string', baseSha: 'string', headSha: 'string', taskSummaries: 'array' },
    outputs: { approved: 'boolean', overallAssessment: 'string', issues: 'array', readyToMerge: 'boolean' }
  }
});

const agentSyncPersistenceTask = defineTask('sdd-sync-persistence', async (args, ctx) => {
  return { synced: args };
}, {
  kind: 'agent',
  title: 'Sync Task Persistence',
  labels: ['superpowers', 'subagent-driven', 'persistence'],
  io: {
    inputs: { tasksJsonPath: 'string', taskId: 'number', status: 'string' },
    outputs: { synced: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Subagent-Driven Development Process
 *
 * Executes plan by dispatching fresh subagent per task with two-stage review:
 * 1. Implementer subagent - implements, tests, commits, self-reviews
 * 2. Spec reviewer subagent - verifies code matches spec (nothing more, nothing less)
 * 3. Code quality reviewer subagent - verifies implementation quality
 *
 * Key principles:
 * - Fresh subagent per task (no context pollution)
 * - Controller provides full task text (subagent never reads plan file)
 * - Spec compliance MUST pass before code quality review
 * - Review loops: if reviewer finds issues, implementer fixes, reviewer re-reviews
 * - Never skip reviews, never proceed with unfixed issues
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.planPath - Path to implementation plan
 * @param {string} inputs.worktreePath - Worktree path
 * @param {number} inputs.maxReviewAttempts - Max review-fix cycles per stage (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Results with per-task review status
 */
export async function process(inputs, ctx) {
  const {
    planPath,
    worktreePath = '.',
    maxReviewAttempts = 3
  } = inputs;

  ctx.log('Starting Subagent-Driven Development', { planPath });

  // ============================================================================
  // STEP 1: LOAD PLAN AND EXTRACT ALL TASKS
  // ============================================================================

  const planResult = await ctx.task(agentLoadPlanTask, { planPath });
  const tasks = planResult.tasks || [];
  const tasksJsonPath = `${planPath}.tasks.json`;

  ctx.log('Plan loaded', { totalTasks: tasks.length });

  // ============================================================================
  // STEP 2: EXECUTE EACH TASK WITH TWO-STAGE REVIEW
  // ============================================================================

  const taskResults = [];

  for (let i = 0; i < tasks.length; i++) {
    const taskSpec = tasks[i];
    const taskName = taskSpec.subject || `Task ${i + 1}`;
    ctx.log(`Task ${i + 1}/${tasks.length}: ${taskName}`);

    // Mark in_progress
    await ctx.task(agentSyncPersistenceTask, {
      tasksJsonPath,
      taskId: i,
      status: 'in_progress'
    });

    // --- IMPLEMENTER SUBAGENT ---
    let implResult = await ctx.task(agentImplementerTask, {
      taskSpec,
      taskIndex: i,
      sceneContext: `Task ${i + 1} of ${tasks.length} in plan: ${planPath}`,
      worktreePath
    });

    // Handle implementer questions
    if (implResult.questions && implResult.questions.length > 0) {
      await ctx.breakpoint({
        question: `Implementer has questions about Task ${i + 1}:\n${implResult.questions.map((q, j) => `${j + 1}. ${q}`).join('\n')}\n\nPlease answer to continue.`,
        title: `Implementer Questions - Task ${i + 1}`,
        context: { runId: ctx.runId }
      });

      // Re-dispatch implementer with answers
      implResult = await ctx.task(agentImplementerTask, {
        taskSpec,
        taskIndex: i,
        sceneContext: `Task ${i + 1} of ${tasks.length} - questions answered`,
        worktreePath
      });
    }

    // --- SPEC COMPLIANCE REVIEW (Stage 1) ---
    let specCompliant = false;
    let specAttempts = 0;

    while (!specCompliant && specAttempts < maxReviewAttempts) {
      specAttempts++;
      ctx.log(`Spec review attempt ${specAttempts}/${maxReviewAttempts}`, { task: taskName });

      const specReview = await ctx.task(agentSpecReviewerTask, {
        taskSpec,
        implementerReport: implResult
      });

      if (specReview.compliant) {
        specCompliant = true;
        ctx.log('Spec compliance: PASSED', { task: taskName });
      } else {
        ctx.log('Spec compliance: FAILED', {
          task: taskName,
          missing: specReview.missingRequirements,
          extra: specReview.extraWork
        });

        if (specAttempts < maxReviewAttempts) {
          // Implementer fixes spec issues
          implResult = await ctx.task(agentImplementerTask, {
            taskSpec,
            taskIndex: i,
            sceneContext: `Fixing spec compliance issues`,
            worktreePath,
            fixInstructions: {
              type: 'spec-compliance',
              issues: specReview
            }
          });
        }
      }
    }

    if (!specCompliant) {
      await ctx.breakpoint({
        question: `Task ${i + 1} failed spec compliance after ${maxReviewAttempts} attempts. Decide: fix manually, skip, or abort.`,
        title: `Spec Compliance Failure - Task ${i + 1}`,
        context: { runId: ctx.runId }
      });
    }

    // --- CODE QUALITY REVIEW (Stage 2 - only after spec passes) ---
    let qualityApproved = false;
    let qualityAttempts = 0;

    while (!qualityApproved && qualityAttempts < maxReviewAttempts) {
      qualityAttempts++;
      ctx.log(`Quality review attempt ${qualityAttempts}/${maxReviewAttempts}`, { task: taskName });

      const qualityReview = await ctx.task(agentCodeQualityReviewerTask, {
        whatWasImplemented: implResult.summary || taskName,
        planOrRequirements: JSON.stringify(taskSpec),
        baseSha: implResult.baseSha || 'HEAD~1',
        headSha: implResult.headSha || 'HEAD',
        description: taskName
      });

      if (qualityReview.approved) {
        qualityApproved = true;
        ctx.log('Code quality: APPROVED', { task: taskName });
      } else {
        ctx.log('Code quality: ISSUES FOUND', {
          task: taskName,
          issues: qualityReview.issues
        });

        if (qualityAttempts < maxReviewAttempts) {
          implResult = await ctx.task(agentImplementerTask, {
            taskSpec,
            taskIndex: i,
            sceneContext: `Fixing code quality issues`,
            worktreePath,
            fixInstructions: {
              type: 'code-quality',
              issues: qualityReview
            }
          });
        }
      }
    }

    // Mark task completed
    await ctx.task(agentSyncPersistenceTask, {
      tasksJsonPath,
      taskId: i,
      status: 'completed'
    });

    taskResults.push({
      taskIndex: i,
      subject: taskName,
      specCompliant,
      specAttempts,
      qualityApproved,
      qualityAttempts,
      filesChanged: implResult.filesChanged || [],
      summary: implResult.summary
    });

    ctx.log(`Task ${i + 1} complete`, { specCompliant, qualityApproved });
  }

  // ============================================================================
  // STEP 3: FINAL CODE REVIEW (Entire Implementation)
  // ============================================================================

  ctx.log('Dispatching final code review for entire implementation');

  const finalReview = await ctx.task(agentFinalCodeReviewTask, {
    planPath,
    baseSha: 'main',
    headSha: 'HEAD',
    taskSummaries: taskResults
  });

  ctx.log('Final review complete', { approved: finalReview.approved });

  return {
    success: true,
    completedTasks: taskResults.length,
    totalTasks: tasks.length,
    taskResults,
    finalReview,
    allSpecCompliant: taskResults.every(r => r.specCompliant),
    allQualityApproved: taskResults.every(r => r.qualityApproved),
    metadata: {
      processId: 'methodologies/superpowers/subagent-driven-development',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
