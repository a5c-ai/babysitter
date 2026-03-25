/**
 * @process methodologies/superpowers/requesting-code-review
 * @description Requesting Code Review - Dispatch code-reviewer agent to catch issues: get SHAs, dispatch reviewer, act on feedback
 * @inputs { description: string, planPath?: string, baseSha?: string, headSha?: string, reviewType?: string }
 * @outputs { success: boolean, specReview: object, qualityReview: object, allApproved: boolean, issues: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentGetReviewContextTask = defineTask('review-request-context', async (args, ctx) => {
  return { context: args };
}, {
  kind: 'agent',
  title: 'Get Review Context (SHAs, changed files)',
  labels: ['superpowers', 'code-review', 'context'],
  io: {
    inputs: { baseSha: 'string', headSha: 'string' },
    outputs: { baseSha: 'string', headSha: 'string', changedFiles: 'array', diffStats: 'object' }
  }
});

const agentSpecComplianceReviewTask = defineTask('review-request-spec', async (args, ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Spec Compliance Review',
  labels: ['superpowers', 'code-review', 'spec-compliance'],
  io: {
    inputs: { description: 'string', planPath: 'string', baseSha: 'string', headSha: 'string' },
    outputs: { compliant: 'boolean', missingRequirements: 'array', extraWork: 'array', misunderstandings: 'array' }
  }
});

const agentCodeQualityReviewTask = defineTask('review-request-quality', async (args, ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Code Quality Review',
  labels: ['superpowers', 'code-review', 'code-quality'],
  io: {
    inputs: { description: 'string', planPath: 'string', baseSha: 'string', headSha: 'string' },
    outputs: { approved: 'boolean', strengths: 'array', issues: 'array', assessment: 'string', severity: 'string' }
  }
});

const agentActOnFeedbackTask = defineTask('review-request-act', async (args, ctx) => {
  return { actions: args };
}, {
  kind: 'agent',
  title: 'Act on Review Feedback',
  labels: ['superpowers', 'code-review', 'feedback-action'],
  io: {
    inputs: { specReview: 'object', qualityReview: 'object' },
    outputs: { criticalFixes: 'array', importantFixes: 'array', minorNotes: 'array', allResolved: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Requesting Code Review Process
 *
 * When to Request:
 * - After each task in subagent-driven development
 * - After completing major features
 * - Before merge to main
 *
 * Process:
 * 1. Get git SHAs (base and head)
 * 2. Dispatch spec compliance review
 * 3. Dispatch code quality review
 * 4. Act on feedback (Critical: fix immediately, Important: fix before proceeding, Minor: note for later)
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.description - What was implemented
 * @param {string} inputs.planPath - Path to the plan/requirements
 * @param {string} inputs.baseSha - Base commit SHA (auto-detected if not provided)
 * @param {string} inputs.headSha - Head commit SHA (default: HEAD)
 * @param {string} inputs.reviewType - 'full' | 'spec-only' | 'quality-only' (default: 'full')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Review results
 */
export async function process(inputs, ctx) {
  const {
    description,
    planPath = null,
    baseSha = null,
    headSha = 'HEAD',
    reviewType = 'full'
  } = inputs;

  ctx.log('Starting Requesting Code Review', { description, reviewType });

  // ============================================================================
  // STEP 1: GET REVIEW CONTEXT
  // ============================================================================

  ctx.log('Step 1: Getting review context (SHAs, changed files)');

  const reviewContext = await ctx.task(agentGetReviewContextTask, {
    baseSha: baseSha || 'HEAD~1',
    headSha
  });

  const resolvedBaseSha = reviewContext.baseSha || baseSha || 'HEAD~1';
  const resolvedHeadSha = reviewContext.headSha || headSha;

  // ============================================================================
  // STEP 2: SPEC COMPLIANCE REVIEW
  // ============================================================================

  let specReview = null;

  if (reviewType === 'full' || reviewType === 'spec-only') {
    ctx.log('Step 2: Running spec compliance review');

    specReview = await ctx.task(agentSpecComplianceReviewTask, {
      description,
      planPath: planPath || '',
      baseSha: resolvedBaseSha,
      headSha: resolvedHeadSha
    });

    if (!specReview.compliant) {
      ctx.log('Spec compliance review failed', {
        missing: specReview.missingRequirements,
        extra: specReview.extraWork
      });
    }
  }

  // ============================================================================
  // STEP 3: CODE QUALITY REVIEW
  // ============================================================================

  let qualityReview = null;

  if (reviewType === 'full' || reviewType === 'quality-only') {
    ctx.log('Step 3: Running code quality review');

    qualityReview = await ctx.task(agentCodeQualityReviewTask, {
      description,
      planPath: planPath || '',
      baseSha: resolvedBaseSha,
      headSha: resolvedHeadSha
    });

    if (!qualityReview.approved) {
      ctx.log('Code quality review raised issues', {
        severity: qualityReview.severity,
        issueCount: qualityReview.issues.length
      });
    }
  }

  // ============================================================================
  // STEP 4: ACT ON FEEDBACK
  // ============================================================================

  const allIssues = [];
  if (specReview && !specReview.compliant) {
    allIssues.push(...(specReview.missingRequirements || []).map(r => ({ type: 'spec', severity: 'critical', detail: r })));
    allIssues.push(...(specReview.misunderstandings || []).map(m => ({ type: 'spec', severity: 'important', detail: m })));
  }
  if (qualityReview && !qualityReview.approved) {
    allIssues.push(...(qualityReview.issues || []).map(i => ({ type: 'quality', severity: i.severity || 'important', detail: i })));
  }

  const allApproved = (specReview ? specReview.compliant : true) && (qualityReview ? qualityReview.approved : true);

  if (!allApproved) {
    ctx.log('Step 4: Acting on review feedback', { issueCount: allIssues.length });

    const actions = await ctx.task(agentActOnFeedbackTask, {
      specReview,
      qualityReview
    });

    await ctx.breakpoint({
      question: `Code review found ${allIssues.length} issue(s):\n- Critical (fix now): ${actions.criticalFixes.length}\n- Important (fix before proceeding): ${actions.importantFixes.length}\n- Minor (note for later): ${actions.minorNotes.length}\n\nReview details and proceed with fixes?`,
      title: 'Code Review Results',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/review/review-results.md', format: 'markdown', label: 'Review Results' }
        ]
      }
    });
  }

  return {
    success: allApproved,
    description,
    specReview,
    qualityReview,
    allApproved,
    issues: allIssues,
    changedFiles: reviewContext.changedFiles || [],
    metadata: {
      processId: 'methodologies/superpowers/requesting-code-review',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
