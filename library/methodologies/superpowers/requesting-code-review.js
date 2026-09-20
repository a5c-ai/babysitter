/**
 * @process methodologies/superpowers/requesting-code-review
 * @description Requesting Code Review - Dispatch code-reviewer agent to catch issues: get SHAs, dispatch reviewer, act on feedback
 * @inputs { description: string, planPath?: string, baseSha?: string, headSha?: string, reviewType?: string }
 * @outputs { success: boolean, specReview: object, qualityReview: object, allApproved: boolean, issues: array }
   * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:ai-agents-conversational]
 *   skillAreas: [skill-area:agentic-loops, skill-area:prompt-engineering, skill-area:multi-agent-coordination]
 *   workflows: [workflow:feature-development]
 *   topics: [topic:developer-experience]
 *   roles: [role:backend-engineer, role:platform-engineer, role:tech-lead]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentGetReviewContextTask = defineTask('review-request-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Get Review Context (SHAs, changed files)',
  labels: ['superpowers', 'code-review', 'context'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Review Coordinator - Review Context Collector',
      task: 'Resolve the base and head SHAs for the change under review and enumerate the changed files and diff statistics.',
      context: args,
      instructions: [
        'Resolve the base SHA: use the provided baseSha when it is set, otherwise the merge-base with the default branch',
        'Resolve the head SHA: use the provided headSha when it is set, otherwise HEAD',
        'List every file changed between the base and head SHAs',
        'Collect diff statistics: files changed, insertions, deletions',
        'Report the resolved SHAs verbatim so downstream reviewers examine the same range'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['baseSha', 'headSha', 'changedFiles', 'diffStats']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const agentSpecComplianceReviewTask = defineTask('review-request-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Spec Compliance Review',
  labels: ['superpowers', 'code-review', 'spec-compliance'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Reviewer - Spec Compliance Specialist',
      task: 'Review the diff between the base and head SHAs against the stated plan or requirements and report spec compliance.',
      context: args,
      instructions: [
        'Read the plan or requirements at planPath when one is provided',
        'Compare the diff against every stated requirement',
        'List requirements that are missing or only partially implemented',
        'List work present in the diff that no requirement asked for',
        'List places where the implementation misunderstood a requirement',
        'Set compliant to true only when nothing is missing and nothing is misunderstood'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'missingRequirements', 'extraWork', 'misunderstandings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const agentCodeQualityReviewTask = defineTask('review-request-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Code Quality Review',
  labels: ['superpowers', 'code-review', 'code-quality'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Reviewer - Code Quality Specialist',
      task: 'Review the diff between the base and head SHAs for correctness, structure, error handling and adherence to project conventions.',
      context: args,
      instructions: [
        'Check correctness: logic errors, off-by-one, unhandled edge cases',
        'Check error handling: no empty catch blocks, no silently swallowed failures',
        'Check structure, naming and consistency with the surrounding codebase',
        'Check test coverage for the changed behaviour',
        'Record genuine strengths as well as issues',
        'Classify each issue with a severity: critical, important or minor',
        'Set approved to false when any critical or important issue is present'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'strengths', 'issues', 'assessment', 'severity']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const agentActOnFeedbackTask = defineTask('review-request-act', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Act on Review Feedback',
  labels: ['superpowers', 'code-review', 'feedback-action'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Review Coordinator - Feedback Triage',
      task: 'Triage the spec compliance and code quality review findings into critical fixes, important fixes and minor notes.',
      context: args,
      instructions: [
        'Critical: fix immediately - correctness, security or missing requirements',
        'Important: fix before proceeding - quality issues that would block a merge',
        'Minor: note for later - style and preference items',
        'Keep each entry actionable: what to change and where',
        'Set allResolved to true only when no critical or important item remains open'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalFixes', 'importantFixes', 'minorNotes', 'allResolved']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

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
    }, {
      label: 'Code Review Results',
      breakpointId: 'superpowers.requesting-code-review.verdict'
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
