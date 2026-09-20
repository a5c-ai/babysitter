/**
 * @process methodologies/rpikit/rpikit-review
 * @description RPIKit Review Phase - Combined code quality and security review with structured verdicts. Scales review depth to change magnitude. Soft-gating with user autonomy.
 * @inputs { projectRoot?: string, reviewScope?: string, maxIssuesPerCategory?: number }
 * @outputs { success: boolean, codeReview: object, securityReview: object, overallVerdict: string }
   * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:qa-testing-automation]
 *   skillAreas: [skill-area:acceptance-testing, skill-area:integration-testing, skill-area:e2e-testing]
 *   workflows: [workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development]
 *   roles: [role:qa-engineer, role:tech-lead]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const identifyChangesTask = defineTask('rpikit-identify-changes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Modified Files and Change Magnitude',
  labels: ['rpikit', 'review', 'change-detection'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RPIKit Reviewer - Change Detection',
      task: 'Enumerate the modified files in the requested review scope and classify the magnitude of the change.',
      context: args,
      instructions: [
        'Honour reviewScope: staged, unstaged, branch or all',
        'List every modified file with its path and line counts',
        'Sum the total lines changed across all modified files',
        'Classify magnitude: under 200 lines is "small", 200-1000 is "medium", over 1000 is "large"',
        'Group the changes into categories (source, tests, config, docs, generated)'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['modifiedFiles', 'totalLinesChanged', 'magnitude', 'changeCategories']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const runCodeReviewTask = defineTask('rpikit-run-code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Structured Code Review',
  labels: ['rpikit', 'review', 'code-quality'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RPIKit Reviewer - Code Quality Specialist',
      task: 'Run a structured code review over the modified files, scaling review depth to the change magnitude.',
      context: args,
      instructions: [
        'Scale depth to magnitude: small means full detail, medium means focused, large means architectural level',
        'Assess whether the change fits the surrounding context and existing patterns',
        'Report correctness issues separately from design notes',
        'Assess test coverage for the changed behaviour',
        'Cap the reported issues per category at maxIssuesPerCategory, highest severity first',
        'Record genuine positives as well as issues',
        'Return verdict as exactly one of APPROVE, APPROVE_WITH_NITS or REQUEST_CHANGES',
        'Return REQUEST_CHANGES whenever a correctness issue remains unresolved'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'issues', 'positives', 'contextAssessment', 'correctnessIssues', 'designNotes', 'testCoverage']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const runSecurityReviewTask = defineTask('rpikit-run-security-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Security Vulnerability Assessment',
  labels: ['rpikit', 'review', 'security'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RPIKit Reviewer - Security Specialist',
      task: 'Assess the modified files for security vulnerabilities and map the findings to the OWASP Top 10.',
      context: args,
      instructions: [
        'Scan for injection, broken access control, and insecure deserialization',
        'Check secrets handling: no hardcoded credentials, proper env var usage',
        'Check input validation, output encoding and authorization on every new entry point',
        'Map each finding to its OWASP Top 10 category',
        'Give the overall severity as none, low, medium, high or critical',
        'Set passed to false when any high or critical vulnerability is found',
        'Never set passed to true to keep the workflow moving - an unverified change has not passed'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'vulnerabilities', 'recommendations', 'severity', 'owasp']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const synthesizeVerdictTask = defineTask('rpikit-synthesize-verdict', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Final Review Verdict',
  labels: ['rpikit', 'review', 'verdict'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RPIKit Reviewer - Verdict Synthesis',
      task: 'Combine the code quality and security reviews into one overall verdict with a must-fix list.',
      context: args,
      instructions: [
        'Return overallVerdict as exactly one of APPROVE, APPROVE_WITH_NITS or REQUEST_CHANGES',
        'Return REQUEST_CHANGES when the code review returned REQUEST_CHANGES or the security review did not pass',
        'List every blocking item in mustFix with the file and the change required',
        'List non-blocking improvements in suggestions',
        'Summarise the review in a few sentences a reviewer can act on'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['overallVerdict', 'summary', 'mustFix', 'suggestions']
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
    }, {
      label: 'Review Results - Action Required',
      breakpointId: 'rpikit.rpikit-review.verdict'
    });
  }

  return {
    success: verdict.overallVerdict !== 'REQUEST_CHANGES' && securityReview.passed === true,
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
