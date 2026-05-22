/**
 * @process contrib/joe-habu/superbabysitter/quality-gated-development
 * @description Unified six-phase quality-gated development workflow. Distilled
 *   from joe-habu/superbabysitter@531a39c1 into a single self-contained process
 *   that reuses shared library components instead of the source repo's custom
 *   babysitter-state MCP plugin.
 *
 *   Phases: design → planning → implementation (subagent-TDD) → verification
 *   → debugging (conditional) → finishing. Each phase is gated by a canonical
 *   breakpointId so users can auto-approve via rules. Reviewer/fixer loops
 *   use `nStrikesEscalation` (robust rejection; never silently approves).
 *
 *   Diffs vs source:
 *   - No MCP state plugin. Replay journal handles cross-iteration continuity.
 *   - Breakpoints read `result.approved`. Rejection loops back with feedback.
 *   - Explicit `outcome` per completed task.
 *   - `stableKey` on every per-attempt task to keep replay identity stable.
 *   - Reviewer context carries implementer `concerns` + `selfReviewFindings`.
 *   - Every task declares `labels` for observer-dashboard filtering.
  * @graph
 *   domains: [domain:software-engineering]
 *   workflows: [workflow:code-review]
 */
import { defineTask } from '@a5c-ai/babysitter-sdk';
import { buildSceneContext, appendToManifest } from '../../../processes/shared/scene-context-builder.js';
import { nStrikesEscalation } from '../../../processes/shared/n-strikes-escalation.js';
import {
  designPhaseTask,
  planningPhaseTask,
  implementationPhaseTask,
  specReviewerTask,
  qualityReviewerTask,
  fixerTask,
  verificationPhaseTask,
  debuggingPhaseTask,
  finishingPhaseTask,
} from '../../../methodologies/quality-gated-six-phase.js';

/**
 * @param {object} inputs
 * @param {string} inputs.request - user request / feature description
 * @param {number} [inputs.maxAttempts=3] - spec/quality review attempts before escalation
 * @param {object} ctx
 */
export async function process(inputs, ctx) {
  const { request, maxAttempts = 3 } = inputs;

  // Phase 1: Design
  const design = await ctx.task(designPhaseTask, { request });
  const designGate = await ctx.breakpoint({
    breakpointId: 'qg6.design.gate',
    title: 'Approve design',
    question: `Design complete. Goals: ${design.goals.join(', ')}\n\nApprove to continue to planning.`,
  });
  if (!designGate.approved) {
    return { status: 'aborted', phase: 'design', feedback: designGate.feedback };
  }

  // Phase 2: Planning
  const plan = await ctx.task(planningPhaseTask, { design });
  const planGate = await ctx.breakpoint({
    breakpointId: 'qg6.planning.gate',
    title: 'Approve plan',
    question: `Plan has ${plan.tasks.length} tasks. Approve to begin implementation.`,
  });
  if (!planGate.approved) {
    return { status: 'aborted', phase: 'planning', feedback: planGate.feedback };
  }

  // Phase 3: Implementation (subagent-TDD)
  const completedTasks = [];
  let buildManifest = [];

  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[i];
    const taskNumber = i + 1;
    const scene = buildSceneContext({
      task,
      taskIndex: i,
      allTasks: plan.tasks,
      buildManifest,
    });

    const implResult = await ctx.task(implementationPhaseTask, {
      task,
      scene,
    }, {
      stableKey: `impl-task-${taskNumber}`,
    });

    // Spec review escalation
    const specOutcome = await nStrikesEscalation({
      ctx,
      maxAttempts,
      breakpointId: 'qg6.spec-escalation',
      breakpointTitle: `Spec Review Escalation (task ${taskNumber})`,
      initialState: implResult,
      runCheck: async (attempt, state) =>
        ctx.task(specReviewerTask, {
          implementation: state,
          task,
          scene,
          concerns: state.concerns || [],
          selfReviewFindings: state.selfReviewFindings || [],
        }, { stableKey: `spec-review-${taskNumber}-${attempt}` }),
      runFix: async (attempt, priorImpl, issues) =>
        ctx.task(fixerTask, {
          priorImplementation: priorImpl,
          issues,
          task,
          scene,
        }, { stableKey: `spec-fix-${taskNumber}-${attempt}` }),
    });

    if (!specOutcome.passed) {
      completedTasks.push({
        taskNumber,
        name: task.name,
        outcome: 'spec-escalation-rejected',
        issues: specOutcome.issues,
        feedback: specOutcome.feedback,
      });
      return { status: 'halted', phase: 'implementation', completedTasks };
    }

    const afterSpec = specOutcome.state;

    // Quality review escalation
    const qualityOutcome = await nStrikesEscalation({
      ctx,
      maxAttempts,
      breakpointId: 'qg6.quality-escalation',
      breakpointTitle: `Quality Review Escalation (task ${taskNumber})`,
      initialState: afterSpec,
      runCheck: async (attempt, state) =>
        ctx.task(qualityReviewerTask, {
          implementation: state,
          task,
          scene,
        }, { stableKey: `quality-review-${taskNumber}-${attempt}` }),
      runFix: async (attempt, priorImpl, issues) =>
        ctx.task(fixerTask, {
          priorImplementation: priorImpl,
          issues,
          task,
          scene,
        }, { stableKey: `quality-fix-${taskNumber}-${attempt}` }),
    });

    if (!qualityOutcome.passed) {
      completedTasks.push({
        taskNumber,
        name: task.name,
        outcome: 'quality-escalation-rejected',
        issues: qualityOutcome.issues,
        feedback: qualityOutcome.feedback,
      });
      return { status: 'halted', phase: 'implementation', completedTasks };
    }

    const finalImpl = qualityOutcome.state;
    buildManifest = appendToManifest(buildManifest, taskNumber, task.name, finalImpl);
    completedTasks.push({
      taskNumber,
      name: task.name,
      outcome:
        specOutcome.outcome === 'passed' && qualityOutcome.outcome === 'passed'
          ? 'passed'
          : 'escalation-approved',
      specAttempts: specOutcome.attempts,
      qualityAttempts: qualityOutcome.attempts,
    });
  }

  // Phase 4: Verification
  let verification = await ctx.task(verificationPhaseTask, { completedTasks, buildManifest });

  // Phase 5: Debugging (conditional)
  const debuggingRounds = [];
  let debugAttempt = 0;
  while (!verification.passed && debugAttempt < maxAttempts) {
    debugAttempt++;
    const debugResult = await ctx.task(debuggingPhaseTask, {
      failures: verification.failures,
      buildManifest,
    }, { stableKey: `debug-attempt-${debugAttempt}` });
    debuggingRounds.push(debugResult);
    verification = await ctx.task(verificationPhaseTask, {
      completedTasks,
      buildManifest,
    }, { stableKey: `verify-after-debug-${debugAttempt}` });
  }

  if (!verification.passed) {
    const bp = await ctx.breakpoint({
      breakpointId: 'qg6.debugging.escalation',
      title: 'Debugging failed after N attempts',
      question: `Verification still failing after ${debugAttempt} debug rounds. Remaining failures:\n${verification.failures.join('\n')}`,
    });
    if (!bp.approved) {
      return {
        status: 'halted',
        phase: 'debugging',
        completedTasks,
        verification,
        debuggingRounds,
        feedback: bp.feedback,
      };
    }
  }

  // Phase 6: Finishing
  const finishing = await ctx.task(finishingPhaseTask, {
    completedTasks,
    buildManifest,
    verification,
  });

  const finishGate = await ctx.breakpoint({
    breakpointId: 'qg6.finishing.gate',
    title: 'Approve finishing',
    question: `Docs updated: ${(finishing.docsUpdated || []).join(', ')}. Commit: ${finishing.commitSha}.`,
  });

  return {
    status: finishGate.approved ? 'completed' : 'finishing-rejected',
    completedTasks,
    buildManifest,
    verification,
    debuggingRounds,
    finishing,
    feedback: finishGate.approved ? undefined : finishGate.feedback,
  };
}
