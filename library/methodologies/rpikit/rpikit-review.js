/**
 * @process methodologies/rpikit/rpikit-review
 * @description RPIKit Review Phase - Combined code quality and security review with structured verdicts. Scales review depth to change magnitude. Soft-gating with user autonomy.
 * @inputs { projectRoot?: string, reviewScope?: string, maxIssuesPerCategory?: number }
 * @outputs { success: boolean, codeReview: object, securityReview: object, overallVerdict: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const identifyChangesTask = defineTask('rpikit-identify-changes', async (args, _ctx) => {
  return { changes: args };
}, {
  kind: 'agent',
  title: 'Identify Modified Files and Change Magnitude',
  labels: ['rpikit', 'review', 'change-detection'],
  io: {
    inputs: { projectRoot: 'string', reviewScope: 'string' },
    outputs: { modifiedFiles: 'array', totalLinesChanged: 'number', magnitude: 'string', changeCategories: 'object' }
  }
});

const runCodeReviewTask = defineTask('rpikit-run-code-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Execute Structured Code Review',
  labels: ['rpikit', 'review', 'code-quality'],
  io: {
    inputs: { modifiedFiles: 'array', magnitude: 'string', maxIssuesPerCategory: 'number' },
    outputs: { verdict: 'string', issues: 'array', positives: 'array', contextAssessment: 'string', correctnessIssues: 'array', designNotes: 'array', testCoverage: 'string' }
  }
});

const runSecurityReviewTask = defineTask('rpikit-run-security-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Execute Security Vulnerability Assessment',
  labels: ['rpikit', 'review', 'security'],
  io: {
    inputs: { modifiedFiles: 'array', magnitude: 'string' },
    outputs: { passed: 'boolean', vulnerabilities: 'array', recommendations: 'array', severity: 'string', owasp: 'array' }
  }
});

const synthesizeVerdictTask = defineTask('rpikit-synthesize-verdict', async (args, _ctx) => {
  return { verdict: args };
}, {
  kind: 'agent',
  title: 'Synthesize Final Review Verdict',
  labels: ['rpikit', 'review', 'verdict'],
  io: {
    inputs: { codeReview: 'object', securityReview: 'object', magnitude: 'string' },
    outputs: { overallVerdict: 'string', summary: 'string', mustFix: 'array', suggestions: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * RPIKit Review Phase Process
 *
 * Combined code quality and security review. Scales depth to change magnitude:
 * - Under 200 lines: full detail review
 * - 200-1000 lines: focused review
 * - Over 1000 lines: architectural-level review
 *
 * Verdicts: APPROVE, APPROVE_WITH_NITS, REQUEST_CHANGES
 * Reviews are soft gates - user retains autonomy to proceed.
 *
 * Attribution: Adapted from https://github.com/bostonaholic/rpikit by Matthew Boston
 */
export async function process(inputs, ctx) {
  const {
    projectRoot = '.',
    reviewScope = 'staged',
    maxIssuesPerCategory = 5
  } = inputs;

  ctx.log('RPIKit Review: Running code quality and security assessment');

  // Step 1: Identify changes
  const changes = await ctx.task(identifyChangesTask, {
    projectRoot,
    reviewScope
  });

  ctx.log(`Change magnitude: ${changes.magnitude} (${changes.totalLinesChanged} lines across ${changes.modifiedFiles.length} files)`);

  // Step 2-3: Run reviews in parallel
  const [codeReview, securityReview] = await ctx.parallel.all([
    ctx.task(runCodeReviewTask, {
      modifiedFiles: changes.modifiedFiles,
      magnitude: changes.magnitude,
      maxIssuesPerCategory
    }),
    ctx.task(runSecurityReviewTask, {
      modifiedFiles: changes.modifiedFiles,
      magnitude: changes.magnitude
    })
  ]);

  // Step 4: Synthesize verdict
  const verdict = await ctx.task(synthesizeVerdictTask, {
    codeReview,
    securityReview,
    magnitude: changes.magnitude
  });

  if (verdict.overallVerdict === 'REQUEST_CHANGES' || !securityReview.passed) {
    await ctx.breakpoint({
      question: `Review verdict: ${verdict.overallVerdict}. ${verdict.mustFix.length} must-fix items. Security: ${securityReview.passed ? 'PASSED' : 'FAILED'}. Address issues or override to proceed.`,
      title: 'Review Results - Action Required',
      context: { runId: ctx.runId }
    });
  }

  return {
    success: true,
    codeReview: {
      verdict: codeReview.verdict,
      issueCount: codeReview.issues.length,
      positiveCount: codeReview.positives.length
    },
    securityReview: {
      passed: securityReview.passed,
      vulnerabilityCount: securityReview.vulnerabilities.length,
      severity: securityReview.severity
    },
    overallVerdict: verdict.overallVerdict,
    summary: verdict.summary,
    metadata: {
      processId: 'methodologies/rpikit/rpikit-review',
      attribution: 'https://github.com/bostonaholic/rpikit',
      author: 'Matthew Boston',
      timestamp: ctx.now()
    }
  };
}
