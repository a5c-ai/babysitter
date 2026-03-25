/**
 * @process methodologies/metaswarm/metaswarm-pr-shepherd
 * @description Metaswarm PR Shepherd - Monitors PR lifecycle from creation through merge: CI monitoring, review comment handling, thread resolution, and merge readiness verification
 * @inputs { prNumber: number, prUrl?: string, projectRoot?: string, autoResolve?: boolean }
 * @outputs { success: boolean, merged: boolean, ciStatus: object, commentsHandled: number, threadsResolved: number, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const monitorCiTask = defineTask('metaswarm-monitor-ci', async (args, _ctx) => {
  return { ci: args };
}, {
  kind: 'agent',
  title: 'Monitor CI Pipeline Status',
  labels: ['metaswarm', 'pr-shepherd', 'ci'],
  io: {
    inputs: { prNumber: 'number', projectRoot: 'string' },
    outputs: { status: 'string', checks: 'array', failures: 'array', duration: 'number' }
  }
});

const handleReviewCommentsTask = defineTask('metaswarm-handle-comments', async (args, _ctx) => {
  return { handling: args };
}, {
  kind: 'agent',
  title: 'Handle PR Review Comments',
  labels: ['metaswarm', 'pr-shepherd', 'comments'],
  io: {
    inputs: { prNumber: 'number', comments: 'array', autoResolve: 'boolean' },
    outputs: { responses: 'array', codeChanges: 'array', threadsResolved: 'number', needsHumanInput: 'array' }
  }
});

const verifyMergeReadinessTask = defineTask('metaswarm-verify-merge', async (args, _ctx) => {
  return { readiness: args };
}, {
  kind: 'agent',
  title: 'Verify PR Merge Readiness (gtg check)',
  labels: ['metaswarm', 'pr-shepherd', 'merge-readiness'],
  io: {
    inputs: { prNumber: 'number', projectRoot: 'string' },
    outputs: { ready: 'boolean', blockers: 'array', approvals: 'number', ciGreen: 'boolean', threadsOpen: 'number', coverageMet: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Metaswarm PR Shepherd Process
 *
 * Monitors the PR from creation through merge. Handles CI failures,
 * responds to review comments, resolves threads, and verifies merge readiness.
 *
 * Attribution: Adapted from https://github.com/dsifry/metaswarm by David Sifry
 *
 * @param {Object} inputs - Process inputs
 * @param {number} inputs.prNumber - PR number to shepherd
 * @param {string} inputs.prUrl - PR URL
 * @param {string} inputs.projectRoot - Project root directory
 * @param {boolean} inputs.autoResolve - Auto-resolve simple comments
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Shepherding results
 */
export async function process(inputs, ctx) {
  const {
    prNumber,
    prUrl = '',
    projectRoot = '.',
    autoResolve = true
  } = inputs;

  ctx.log('PR Shepherd: Monitoring PR lifecycle', { prNumber });

  // Step 1: Monitor CI
  ctx.log('Step 1: Monitoring CI pipeline');

  const ciResult = await ctx.task(monitorCiTask, {
    prNumber,
    projectRoot
  });

  if (ciResult.status === 'failed') {
    await ctx.breakpoint({
      question: `CI failed for PR #${prNumber}. Failures: ${ciResult.failures.join(', ')}. Review and decide whether to fix automatically or intervene.`,
      title: `PR Shepherd: CI Failed (#${prNumber})`,
      context: { runId: ctx.runId }
    });
  }

  // Step 2: Handle review comments
  ctx.log('Step 2: Handling review comments');

  const commentsResult = await ctx.task(handleReviewCommentsTask, {
    prNumber,
    comments: [],
    autoResolve
  });

  if (commentsResult.needsHumanInput.length > 0) {
    await ctx.breakpoint({
      question: `PR #${prNumber} has ${commentsResult.needsHumanInput.length} comments requiring human input. Please review and respond.`,
      title: `PR Shepherd: Human Input Needed (#${prNumber})`,
      context: { runId: ctx.runId }
    });
  }

  // Step 3: Verify merge readiness
  ctx.log('Step 3: Verifying merge readiness');

  const readinessResult = await ctx.task(verifyMergeReadinessTask, {
    prNumber,
    projectRoot
  });

  if (!readinessResult.ready) {
    await ctx.breakpoint({
      question: `PR #${prNumber} is not merge-ready. Blockers: ${readinessResult.blockers.join(', ')}. Open threads: ${readinessResult.threadsOpen}.`,
      title: `PR Shepherd: Not Merge Ready (#${prNumber})`,
      context: { runId: ctx.runId }
    });
  }

  return {
    success: true,
    merged: readinessResult.ready,
    ciStatus: { status: ciResult.status, checks: ciResult.checks },
    commentsHandled: commentsResult.responses.length,
    threadsResolved: commentsResult.threadsResolved,
    summary: {
      prNumber,
      prUrl,
      ciGreen: readinessResult.ciGreen,
      approvals: readinessResult.approvals,
      coverageMet: readinessResult.coverageMet,
      mergeReady: readinessResult.ready
    },
    metadata: {
      processId: 'methodologies/metaswarm/metaswarm-pr-shepherd',
      attribution: 'https://github.com/dsifry/metaswarm',
      author: 'David Sifry',
      timestamp: ctx.now()
    }
  };
}
