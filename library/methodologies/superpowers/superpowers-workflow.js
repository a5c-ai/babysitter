/**
 * @process methodologies/superpowers/superpowers-workflow
 * @description Superpowers Extended - Full development lifecycle: brainstorm -> plan -> execute -> review -> finish
 * @inputs { task: string, mode?: string, skipBrainstorm?: boolean, planPath?: string, executionMode?: string, qualityThreshold?: number }
 * @outputs { success: boolean, designDoc: object, plan: object, implementation: object, review: object, completionStatus: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentBrainstormTask = defineTask('superpowers-brainstorm', async (args, ctx) => {
  return { design: args };
}, {
  kind: 'agent',
  title: 'Brainstorm and Design',
  labels: ['superpowers', 'brainstorming', 'design'],
  io: {
    inputs: { task: 'string', projectContext: 'string', iteration: 'number' },
    outputs: { design: 'object', questions: 'array', approaches: 'array', approved: 'boolean' }
  }
});

const agentExploreContextTask = defineTask('superpowers-explore-context', async (args, ctx) => {
  return { context: args };
}, {
  kind: 'agent',
  title: 'Explore Project Context',
  labels: ['superpowers', 'brainstorming', 'context-exploration'],
  io: {
    inputs: { task: 'string', projectRoot: 'string' },
    outputs: { files: 'array', recentCommits: 'array', existingPatterns: 'array', techStack: 'object' }
  }
});

const agentProposeApproachesTask = defineTask('superpowers-propose-approaches', async (args, ctx) => {
  return { approaches: args };
}, {
  kind: 'agent',
  title: 'Propose Design Approaches',
  labels: ['superpowers', 'brainstorming', 'approaches'],
  io: {
    inputs: { task: 'string', context: 'object', constraints: 'array' },
    outputs: { approaches: 'array', recommendation: 'object', tradeoffs: 'array' }
  }
});

const agentWriteDesignDocTask = defineTask('superpowers-write-design-doc', async (args, ctx) => {
  return { doc: args };
}, {
  kind: 'agent',
  title: 'Write Design Document',
  labels: ['superpowers', 'brainstorming', 'documentation'],
  io: {
    inputs: { design: 'object', task: 'string', approaches: 'array' },
    outputs: { docPath: 'string', content: 'string', committed: 'boolean' }
  }
});

const agentWritePlanTask = defineTask('superpowers-write-plan', async (args, ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Write Implementation Plan',
  labels: ['superpowers', 'writing-plans', 'planning'],
  io: {
    inputs: { designDoc: 'object', task: 'string', techStack: 'object' },
    outputs: { planPath: 'string', tasks: 'array', dependencies: 'object', totalTasks: 'number' }
  }
});

const agentSetupWorktreeTask = defineTask('superpowers-setup-worktree', async (args, ctx) => {
  return { worktree: args };
}, {
  kind: 'agent',
  title: 'Setup Git Worktree',
  labels: ['superpowers', 'git-worktrees', 'workspace-isolation'],
  io: {
    inputs: { branchName: 'string', projectRoot: 'string' },
    outputs: { worktreePath: 'string', branchCreated: 'boolean', testsPass: 'boolean', testCount: 'number' }
  }
});

const agentImplementTaskItem = defineTask('superpowers-implement-task', async (args, ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'Implement Plan Task',
  labels: ['superpowers', 'executing-plans', 'implementation'],
  io: {
    inputs: { taskSpec: 'object', taskIndex: 'number', planPath: 'string', worktreePath: 'string' },
    outputs: { filesChanged: 'array', testsWritten: 'array', testResults: 'object', committed: 'boolean', selfReview: 'object' }
  }
});

const agentSpecReviewTask = defineTask('superpowers-spec-review', async (args, ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Spec Compliance Review',
  labels: ['superpowers', 'code-review', 'spec-compliance'],
  io: {
    inputs: { taskSpec: 'object', implementerReport: 'object', baseSha: 'string', headSha: 'string' },
    outputs: { compliant: 'boolean', missingRequirements: 'array', extraWork: 'array', misunderstandings: 'array' }
  }
});

const agentCodeQualityReviewTask = defineTask('superpowers-code-quality-review', async (args, ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Code Quality Review',
  labels: ['superpowers', 'code-review', 'code-quality'],
  io: {
    inputs: { whatWasImplemented: 'string', planOrRequirements: 'string', baseSha: 'string', headSha: 'string', description: 'string' },
    outputs: { approved: 'boolean', strengths: 'array', issues: 'array', assessment: 'string', severity: 'string' }
  }
});

const agentFinalReviewTask = defineTask('superpowers-final-review', async (args, ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Final Implementation Review',
  labels: ['superpowers', 'code-review', 'final-review'],
  io: {
    inputs: { planPath: 'string', baseSha: 'string', headSha: 'string', taskSummaries: 'array' },
    outputs: { approved: 'boolean', overallAssessment: 'string', issues: 'array', readyToMerge: 'boolean' }
  }
});

const agentVerifyCompletionTask = defineTask('superpowers-verify-completion', async (args, ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify Completion',
  labels: ['superpowers', 'verification', 'completion'],
  io: {
    inputs: { planPath: 'string', worktreePath: 'string', requirements: 'array' },
    outputs: { allTestsPass: 'boolean', testOutput: 'string', requirementsMet: 'array', gaps: 'array' }
  }
});

const agentFinishBranchTask = defineTask('superpowers-finish-branch', async (args, ctx) => {
  return { finish: args };
}, {
  kind: 'agent',
  title: 'Finish Development Branch',
  labels: ['superpowers', 'finishing', 'branch-management'],
  io: {
    inputs: { branchName: 'string', baseBranch: 'string', worktreePath: 'string', action: 'string' },
    outputs: { action: 'string', prUrl: 'string', merged: 'boolean', cleanedUp: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Superpowers Extended Workflow Process
 *
 * Full development lifecycle from the Superpowers Extended methodology:
 * 1. Brainstorming - Socratic design refinement with user approval gates
 * 2. Writing Plans - Detailed bite-sized task plans with TDD steps
 * 3. Workspace Setup - Git worktree isolation for safe development
 * 4. Execution - Subagent-driven or batch execution with two-stage review
 * 5. Verification - Evidence-based completion verification
 * 6. Finishing - Branch management (merge/PR/keep/discard)
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Description of the work to accomplish
 * @param {string} inputs.mode - Execution mode: 'full' | 'plan-only' | 'execute-only' (default: 'full')
 * @param {boolean} inputs.skipBrainstorm - Skip brainstorming phase (default: false)
 * @param {string} inputs.planPath - Path to existing plan (for execute-only mode)
 * @param {string} inputs.executionMode - 'subagent' | 'batch' (default: 'subagent')
 * @param {number} inputs.qualityThreshold - Minimum quality score 0-100 (default: 80)
 * @param {number} inputs.batchSize - Tasks per batch in batch mode (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Complete workflow results
 */
export async function process(inputs, ctx) {
  const {
    task,
    mode = 'full',
    skipBrainstorm = false,
    planPath = null,
    executionMode = 'subagent',
    qualityThreshold = 80,
    batchSize = 3
  } = inputs;

  const results = {
    task,
    mode,
    designDoc: null,
    plan: null,
    worktree: null,
    implementation: null,
    review: null,
    completionStatus: 'not-started'
  };

  ctx.log('Starting Superpowers Extended workflow', { task, mode, executionMode });

  // ============================================================================
  // PHASE 1: BRAINSTORMING (Design Before Code)
  // ============================================================================

  if ((mode === 'full' || mode === 'plan-only') && !skipBrainstorm) {
    ctx.log('Phase 1: Brainstorming - Exploring project context and refining design');

    // Step 1.1: Explore project context
    const contextResult = await ctx.task(agentExploreContextTask, {
      task,
      projectRoot: ctx.runDir
    });

    // Step 1.2: Propose 2-3 approaches with tradeoffs
    const approachesResult = await ctx.task(agentProposeApproachesTask, {
      task,
      context: contextResult,
      constraints: inputs.constraints || []
    });

    // Step 1.3: Present design for approval
    const designResult = await ctx.task(agentBrainstormTask, {
      task,
      projectContext: JSON.stringify(contextResult),
      iteration: 1,
      approaches: approachesResult.approaches,
      recommendation: approachesResult.recommendation
    });

    // HARD GATE: Human must approve design before proceeding
    await ctx.breakpoint({
      question: `Review the design for "${task}". The recommended approach has been presented with alternatives and tradeoffs. Do you approve this design to proceed to implementation planning?`,
      title: 'Design Approval Gate',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/design/approaches.md', format: 'markdown', label: 'Design Approaches' },
          { path: 'artifacts/design/recommendation.md', format: 'markdown', label: 'Recommended Approach' }
        ]
      }
    });

    // Step 1.4: Write and commit design document
    const designDocResult = await ctx.task(agentWriteDesignDocTask, {
      design: designResult,
      task,
      approaches: approachesResult.approaches
    });

    results.designDoc = designDocResult;
    ctx.log('Phase 1 complete: Design approved and documented', { docPath: designDocResult.docPath });
  }

  // ============================================================================
  // PHASE 2: WRITING PLANS (Bite-Sized TDD Tasks)
  // ============================================================================

  let planData = null;

  if (mode === 'full' || mode === 'plan-only') {
    ctx.log('Phase 2: Writing Plans - Creating detailed implementation plan');

    const planResult = await ctx.task(agentWritePlanTask, {
      designDoc: results.designDoc,
      task,
      techStack: results.designDoc ? results.designDoc.techStack : {},
      qualityThreshold
    });

    planData = planResult;
    results.plan = planResult;

    // Human review of plan before execution
    await ctx.breakpoint({
      question: `Implementation plan created with ${planResult.totalTasks} tasks. Each task follows TDD: write failing test -> verify fail -> implement -> verify pass -> commit. Choose execution mode: subagent-driven (fresh agent per task, two-stage review) or batch execution (3-task batches with checkpoints)?`,
      title: 'Plan Review and Execution Choice',
      context: {
        runId: ctx.runId,
        files: [
          { path: planResult.planPath, format: 'markdown', label: 'Implementation Plan' },
          { path: `${planResult.planPath}.tasks.json`, format: 'json', label: 'Task Persistence' }
        ]
      }
    });

    ctx.log('Phase 2 complete: Plan approved', { totalTasks: planResult.totalTasks });

    if (mode === 'plan-only') {
      results.completionStatus = 'plan-complete';
      return results;
    }
  } else if (mode === 'execute-only' && planPath) {
    planData = { planPath, tasks: inputs.tasks || [], totalTasks: inputs.totalTasks || 0 };
  }

  // ============================================================================
  // PHASE 3: WORKSPACE SETUP (Git Worktree Isolation)
  // ============================================================================

  ctx.log('Phase 3: Setting up isolated workspace via git worktree');

  const featureBranch = `feature/${task.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;

  const worktreeResult = await ctx.task(agentSetupWorktreeTask, {
    branchName: featureBranch,
    projectRoot: ctx.runDir
  });

  results.worktree = worktreeResult;

  if (!worktreeResult.testsPass) {
    await ctx.breakpoint({
      question: `Baseline tests failing in worktree (${worktreeResult.worktreePath}). This must be resolved before implementation. Investigate failures or proceed anyway?`,
      title: 'Worktree Baseline Failure',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/worktree/baseline-test-results.txt', format: 'text', label: 'Test Results' }
        ]
      }
    });
  }

  ctx.log('Phase 3 complete: Worktree ready', { worktreePath: worktreeResult.worktreePath });

  // ============================================================================
  // PHASE 4: EXECUTION (Subagent-Driven or Batch)
  // ============================================================================

  ctx.log('Phase 4: Executing plan', { executionMode, totalTasks: planData.totalTasks });

  const taskResults = [];
  const tasks = planData.tasks || [];

  if (executionMode === 'subagent') {
    // Subagent-Driven Development: fresh agent per task + two-stage review
    for (let i = 0; i < tasks.length; i++) {
      const taskSpec = tasks[i];
      ctx.log(`Task ${i + 1}/${tasks.length}: ${taskSpec.subject || taskSpec.title}`, { taskIndex: i });

      // Step 4.1: Dispatch implementer subagent
      const implResult = await ctx.task(agentImplementTaskItem, {
        taskSpec,
        taskIndex: i,
        planPath: planData.planPath,
        worktreePath: worktreeResult.worktreePath
      });

      // Step 4.2: Spec compliance review (MUST pass before code quality)
      // Uses qualityThreshold to determine required compliance level
      let specCompliant = false;
      let specAttempts = 0;
      const maxSpecAttempts = qualityThreshold >= 90 ? 5 : 3;

      while (!specCompliant && specAttempts < maxSpecAttempts) {
        specAttempts++;
        const specReview = await ctx.task(agentSpecReviewTask, {
          taskSpec,
          implementerReport: implResult,
          baseSha: implResult.baseSha || 'HEAD~1',
          headSha: implResult.headSha || 'HEAD',
          qualityThreshold
        });

        // Evaluate compliance against qualityThreshold:
        // - At threshold >= 90: strict mode, zero missing requirements allowed
        // - At threshold >= 70: standard mode, minor gaps acceptable if no misunderstandings
        // - Below 70: lenient mode, compliant if no critical misunderstandings
        const missingCount = (specReview.missingRequirements || []).length;
        const misunderstandingCount = (specReview.misunderstandings || []).length;

        if (specReview.compliant) {
          specCompliant = true;
        } else if (qualityThreshold < 70 && misunderstandingCount === 0) {
          ctx.log(`Spec review: accepting with minor gaps (threshold ${qualityThreshold} < 70)`, { missingCount });
          specCompliant = true;
        } else if (qualityThreshold < 90 && missingCount <= 1 && misunderstandingCount === 0) {
          ctx.log(`Spec review: accepting with 1 minor gap (threshold ${qualityThreshold} < 90)`, { missingCount });
          specCompliant = true;
        } else {
          ctx.log(`Spec review failed (attempt ${specAttempts}/${maxSpecAttempts}, threshold: ${qualityThreshold})`, {
            missing: specReview.missingRequirements,
            extra: specReview.extraWork
          });

          if (specAttempts < maxSpecAttempts) {
            // Dispatch fix subagent
            await ctx.task(agentImplementTaskItem, {
              taskSpec: { ...taskSpec, fixInstructions: specReview },
              taskIndex: i,
              planPath: planData.planPath,
              worktreePath: worktreeResult.worktreePath
            });
          }
        }
      }

      if (!specCompliant) {
        await ctx.breakpoint({
          question: `Task ${i + 1} failed spec compliance after ${maxSpecAttempts} attempts (quality threshold: ${qualityThreshold}). Review the issues and decide: fix manually, skip task, or abort?`,
          title: `Spec Compliance Failure - Task ${i + 1}`,
          context: { runId: ctx.runId }
        });
      }

      // Step 4.3: Code quality review (only after spec compliance passes)
      // Uses qualityThreshold to determine required quality level
      let qualityApproved = false;
      let qualityAttempts = 0;
      const maxQualityAttempts = qualityThreshold >= 90 ? 5 : 3;

      while (!qualityApproved && qualityAttempts < maxQualityAttempts) {
        qualityAttempts++;
        const qualityReview = await ctx.task(agentCodeQualityReviewTask, {
          whatWasImplemented: implResult.summary || `Task ${i + 1}: ${taskSpec.subject}`,
          planOrRequirements: JSON.stringify(taskSpec),
          baseSha: implResult.baseSha || 'HEAD~1',
          headSha: implResult.headSha || 'HEAD',
          description: taskSpec.subject || taskSpec.title,
          qualityThreshold
        });

        // Evaluate quality against qualityThreshold:
        // - Direct approval always accepted
        // - At threshold < 70: accept if no critical/high severity issues
        // - At threshold < 90: accept if no critical severity issues
        // - At threshold >= 90: require explicit approval
        const hasCritical = (qualityReview.issues || []).some(i => i.severity === 'critical');
        const hasHigh = (qualityReview.issues || []).some(i => i.severity === 'high');

        if (qualityReview.approved) {
          qualityApproved = true;
        } else if (qualityThreshold < 70 && !hasCritical && !hasHigh) {
          ctx.log(`Quality review: accepting with minor issues (threshold ${qualityThreshold} < 70)`);
          qualityApproved = true;
        } else if (qualityThreshold < 90 && !hasCritical) {
          ctx.log(`Quality review: accepting without critical issues (threshold ${qualityThreshold} < 90)`);
          qualityApproved = true;
        } else {
          ctx.log(`Quality review failed (attempt ${qualityAttempts}/${maxQualityAttempts}, threshold: ${qualityThreshold})`, {
            issues: qualityReview.issues
          });

          if (qualityAttempts < maxQualityAttempts) {
            await ctx.task(agentImplementTaskItem, {
              taskSpec: { ...taskSpec, qualityFixInstructions: qualityReview },
              taskIndex: i,
              planPath: planData.planPath,
              worktreePath: worktreeResult.worktreePath
            });
          }
        }
      }

      taskResults.push({
        taskIndex: i,
        subject: taskSpec.subject || taskSpec.title,
        specCompliant,
        qualityApproved,
        specAttempts,
        qualityAttempts,
        filesChanged: implResult.filesChanged || []
      });
    }
  } else {
    // Batch Execution with Checkpoints and Two-Stage Review
    for (let batchStart = 0; batchStart < tasks.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, tasks.length);
      const batch = tasks.slice(batchStart, batchEnd);
      const batchNum = Math.floor(batchStart / batchSize) + 1;

      ctx.log(`Batch ${batchNum}: Tasks ${batchStart + 1}-${batchEnd}`, { batchSize: batch.length });

      // Execute batch tasks sequentially (following plan order and dependencies)
      for (let j = 0; j < batch.length; j++) {
        const taskSpec = batch[j];
        const globalIndex = batchStart + j;

        const implResult = await ctx.task(agentImplementTaskItem, {
          taskSpec,
          taskIndex: globalIndex,
          planPath: planData.planPath,
          worktreePath: worktreeResult.worktreePath
        });

        taskResults.push({
          taskIndex: globalIndex,
          subject: taskSpec.subject || taskSpec.title,
          specCompliant: false,
          qualityApproved: false,
          filesChanged: implResult.filesChanged || [],
          _implResult: implResult
        });
      }

      // Two-stage review for the batch (spec compliance then code quality)
      ctx.log(`Batch ${batchNum}: Running two-stage review`, { tasksInBatch: batch.length });

      for (let j = 0; j < batch.length; j++) {
        const taskSpec = batch[j];
        const globalIndex = batchStart + j;
        const resultEntry = taskResults.find(r => r.taskIndex === globalIndex);
        const implResult = resultEntry._implResult;

        // Stage 1: Spec compliance review (uses qualityThreshold)
        let specCompliant = false;
        let specAttempts = 0;
        const maxBatchSpecAttempts = qualityThreshold >= 90 ? 5 : 3;

        while (!specCompliant && specAttempts < maxBatchSpecAttempts) {
          specAttempts++;
          const specReview = await ctx.task(agentSpecReviewTask, {
            taskSpec,
            implementerReport: implResult,
            baseSha: implResult.baseSha || 'HEAD~1',
            headSha: implResult.headSha || 'HEAD',
            qualityThreshold
          });

          const missingCount = (specReview.missingRequirements || []).length;
          const misunderstandingCount = (specReview.misunderstandings || []).length;

          if (specReview.compliant) {
            specCompliant = true;
          } else if (qualityThreshold < 70 && misunderstandingCount === 0) {
            ctx.log(`Batch spec review: accepting with minor gaps (threshold ${qualityThreshold} < 70)`, { missingCount });
            specCompliant = true;
          } else if (qualityThreshold < 90 && missingCount <= 1 && misunderstandingCount === 0) {
            ctx.log(`Batch spec review: accepting with 1 minor gap (threshold ${qualityThreshold} < 90)`, { missingCount });
            specCompliant = true;
          } else {
            ctx.log(`Batch ${batchNum} Task ${j + 1}: Spec review failed (attempt ${specAttempts}/${maxBatchSpecAttempts}, threshold: ${qualityThreshold})`, {
              missing: specReview.missingRequirements
            });

            if (specAttempts < maxBatchSpecAttempts) {
              await ctx.task(agentImplementTaskItem, {
                taskSpec: { ...taskSpec, fixInstructions: specReview },
                taskIndex: globalIndex,
                planPath: planData.planPath,
                worktreePath: worktreeResult.worktreePath
              });
            }
          }
        }

        // Stage 2: Code quality review (only after spec compliance, uses qualityThreshold)
        let qualityApproved = false;
        let qualityAttempts = 0;
        const maxBatchQualityAttempts = qualityThreshold >= 90 ? 5 : 3;

        while (!qualityApproved && qualityAttempts < maxBatchQualityAttempts) {
          qualityAttempts++;
          const qualityReview = await ctx.task(agentCodeQualityReviewTask, {
            whatWasImplemented: implResult.summary || `Task ${globalIndex + 1}: ${taskSpec.subject}`,
            planOrRequirements: JSON.stringify(taskSpec),
            baseSha: implResult.baseSha || 'HEAD~1',
            headSha: implResult.headSha || 'HEAD',
            description: taskSpec.subject || taskSpec.title,
            qualityThreshold
          });

          const hasCritical = (qualityReview.issues || []).some(i => i.severity === 'critical');
          const hasHigh = (qualityReview.issues || []).some(i => i.severity === 'high');

          if (qualityReview.approved) {
            qualityApproved = true;
          } else if (qualityThreshold < 70 && !hasCritical && !hasHigh) {
            ctx.log(`Batch quality review: accepting with minor issues (threshold ${qualityThreshold} < 70)`);
            qualityApproved = true;
          } else if (qualityThreshold < 90 && !hasCritical) {
            ctx.log(`Batch quality review: accepting without critical issues (threshold ${qualityThreshold} < 90)`);
            qualityApproved = true;
          } else {
            ctx.log(`Batch ${batchNum} Task ${j + 1}: Quality review failed (attempt ${qualityAttempts}/${maxBatchQualityAttempts}, threshold: ${qualityThreshold})`, {
              issues: qualityReview.issues
            });

            if (qualityAttempts < maxBatchQualityAttempts) {
              await ctx.task(agentImplementTaskItem, {
                taskSpec: { ...taskSpec, qualityFixInstructions: qualityReview },
                taskIndex: globalIndex,
                planPath: planData.planPath,
                worktreePath: worktreeResult.worktreePath
              });
            }
          }
        }

        // Update the result entry with review outcomes
        resultEntry.specCompliant = specCompliant;
        resultEntry.qualityApproved = qualityApproved;
        resultEntry.specAttempts = specAttempts;
        resultEntry.qualityAttempts = qualityAttempts;
        delete resultEntry._implResult;
      }

      // Batch checkpoint: human review
      if (batchEnd < tasks.length) {
        await ctx.breakpoint({
          question: `Batch ${batchNum} complete (Tasks ${batchStart + 1}-${batchEnd} of ${tasks.length}). Two-stage review done. Review implementation and provide feedback before next batch.`,
          title: `Batch ${batchNum} Checkpoint`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `artifacts/batch-${batchNum}-summary.md`, format: 'markdown', label: `Batch ${batchNum} Summary` }
            ]
          }
        });
      }
    }
  }

  results.implementation = {
    taskResults,
    totalTasks: tasks.length,
    completedTasks: taskResults.length,
    allSpecCompliant: taskResults.every(r => r.specCompliant),
    allQualityApproved: taskResults.every(r => r.qualityApproved)
  };

  ctx.log('Phase 4 complete: All tasks executed', {
    totalTasks: tasks.length,
    completedTasks: taskResults.length
  });

  // ============================================================================
  // PHASE 5: VERIFICATION (Evidence Before Claims)
  // ============================================================================

  ctx.log('Phase 5: Verification - Running full test suite and checking requirements');

  const verificationResult = await ctx.task(agentVerifyCompletionTask, {
    planPath: planData.planPath,
    worktreePath: worktreeResult.worktreePath,
    requirements: tasks.map(t => t.subject || t.title)
  });

  if (!verificationResult.allTestsPass) {
    await ctx.breakpoint({
      question: `Verification failed: tests are not passing. ${verificationResult.gaps.length} requirement gaps found. Fix issues before finishing?`,
      title: 'Verification Failure',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/verification/test-output.txt', format: 'text', label: 'Test Output' },
          { path: 'artifacts/verification/requirement-gaps.md', format: 'markdown', label: 'Requirement Gaps' }
        ]
      }
    });
  }

  // Final review of entire implementation
  const finalReview = await ctx.task(agentFinalReviewTask, {
    planPath: planData.planPath,
    baseSha: worktreeResult.baseSha || 'main',
    headSha: 'HEAD',
    taskSummaries: taskResults
  });

  results.review = {
    verification: verificationResult,
    finalReview
  };

  ctx.log('Phase 5 complete: Verification done', {
    testsPass: verificationResult.allTestsPass,
    approved: finalReview.approved
  });

  // ============================================================================
  // PHASE 6: FINISHING (Branch Management)
  // ============================================================================

  ctx.log('Phase 6: Finishing development branch');

  // Present completion options
  await ctx.breakpoint({
    question: `Implementation complete and verified. Choose how to finish:\n1. Merge back to base branch locally\n2. Push and create a Pull Request\n3. Keep the branch as-is\n4. Discard this work\n\nWhich option?`,
    title: 'Finish Development Branch',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/final-review/summary.md', format: 'markdown', label: 'Final Review Summary' }
      ]
    }
  });

  const finishResult = await ctx.task(agentFinishBranchTask, {
    branchName: featureBranch,
    baseBranch: 'main',
    worktreePath: worktreeResult.worktreePath,
    action: inputs.finishAction || 'pr'
  });

  results.completionStatus = finishResult.action;

  ctx.log('Superpowers Extended workflow complete', {
    task,
    completionStatus: results.completionStatus,
    totalTasks: tasks.length,
    testsPass: verificationResult.allTestsPass
  });

  return {
    success: true,
    ...results,
    metadata: {
      processId: 'methodologies/superpowers/superpowers-workflow',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
