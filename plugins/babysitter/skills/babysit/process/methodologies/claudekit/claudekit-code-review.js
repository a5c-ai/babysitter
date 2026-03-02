/**
 * @process methodologies/claudekit/claudekit-code-review
 * @description ClaudeKit Code Review - 6-agent parallel code review with architecture, security, performance, testing, quality, and documentation analysis. Each agent scores independently and results are aggregated into a weighted final score.
 * @inputs { target: string, projectRoot?: string, changedFiles?: array, baseRef?: string, confidenceThreshold?: number, codebaseMap?: object }
 * @outputs { success: boolean, overallScore: number, dimensions: object, issues: array, agentReports: array, recommendation: string, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const detectChangedFilesTask = defineTask('claudekit-detect-changed-files', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect Changed Files for Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Change Detector',
      task: 'Identify all files changed relative to the base reference. Classify by type for targeted agent dispatch.',
      context: { ...args },
      instructions: [
        'If changedFiles provided, use those directly',
        'Otherwise run git diff against baseRef (default: main)',
        'Classify each file: source, test, config, documentation, asset',
        'Identify file language/framework for agent selection',
        'Return structured list with file paths, types, and change stats (insertions/deletions)'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'code-review', 'change-detection']
}));

const architectureReviewTask = defineTask('claudekit-review-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Architecture Review',
  agent: {
    ref: 'methodologies/claudekit/agents/architecture-reviewer',
    prompt: {
      role: 'ClaudeKit Architecture Reviewer',
      task: 'Evaluate architectural quality of changes. Assess module boundaries, dependency direction, separation of concerns, and design pattern adherence.',
      context: { ...args },
      instructions: [
        'Check module boundaries and encapsulation',
        'Verify dependency direction (no circular deps, proper layering)',
        'Assess separation of concerns across changed files',
        'Evaluate design pattern usage and consistency',
        'Check for architectural drift from established patterns',
        'Review import structure and package boundaries',
        'Score 0-100 with detailed findings per category',
        'Only report findings with confidence >= threshold'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'code-review', 'architecture']
}));

const securityReviewTask = defineTask('claudekit-review-security', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Security Review',
  agent: {
    ref: 'methodologies/claudekit/agents/security-analyst',
    prompt: {
      role: 'ClaudeKit Security Analyst',
      task: 'Perform thorough security analysis of code changes. Identify vulnerabilities, injection risks, authentication gaps, and secrets exposure.',
      context: { ...args },
      instructions: [
        'Scan for injection vulnerabilities (SQL, XSS, command, path traversal)',
        'Check authentication and authorization enforcement',
        'Review secrets handling (no hardcoded keys, proper env var usage)',
        'Assess input validation and output encoding',
        'Check for insecure cryptographic practices',
        'Review dependency security (known CVEs)',
        'Evaluate CORS, CSP, and security header configuration',
        'Score 0-100 with severity classification (critical/high/medium/low)',
        'Only report findings with confidence >= threshold'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'code-review', 'security']
}));

const performanceReviewTask = defineTask('claudekit-review-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Review',
  agent: {
    ref: 'methodologies/claudekit/agents/performance-analyst',
    prompt: {
      role: 'ClaudeKit Performance Analyst',
      task: 'Analyze performance characteristics of code changes. Identify algorithmic inefficiencies, resource leaks, and optimization opportunities.',
      context: { ...args },
      instructions: [
        'Identify algorithmic complexity issues (flag O(n^2) or worse)',
        'Check for memory leaks and resource cleanup',
        'Review database query patterns (N+1, missing indexes)',
        'Assess caching opportunities and cache invalidation',
        'Check for unnecessary synchronous operations',
        'Review bundle size impact for frontend changes',
        'Identify hot paths and bottleneck potential',
        'Score 0-100 with impact classification',
        'Only report findings with confidence >= threshold'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'code-review', 'performance']
}));

const testingReviewTask = defineTask('claudekit-review-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Testing Review',
  agent: {
    ref: 'methodologies/claudekit/agents/testing-specialist',
    prompt: {
      role: 'ClaudeKit Testing Specialist',
      task: 'Evaluate test coverage and quality for code changes. Assess test adequacy, edge cases, and testing patterns.',
      context: { ...args },
      instructions: [
        'Check that all changed source files have corresponding tests',
        'Evaluate test quality: meaningful assertions, not just coverage',
        'Identify missing edge case tests',
        'Review test isolation (no shared mutable state)',
        'Check for flaky test patterns (timing, network, random)',
        'Assess integration test coverage for API changes',
        'Verify error path testing (not just happy path)',
        'Score 0-100 with gap identification',
        'Only report findings with confidence >= threshold'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'code-review', 'testing']
}));

const qualityReviewTask = defineTask('claudekit-review-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Code Quality Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Quality Reviewer',
      task: 'Assess overall code quality: naming, readability, error handling, type safety, and adherence to project conventions.',
      context: { ...args },
      instructions: [
        'Check naming conventions for clarity and consistency',
        'Review function length and complexity (cyclomatic < 10)',
        'Assess error handling completeness (no empty catch blocks)',
        'Verify type safety (no any escapes, proper narrowing)',
        'Check for code duplication and DRY violations',
        'Review comment quality (explain why, not what)',
        'Assess readability: nesting depth, early returns, guard clauses',
        'Score 0-100 with specific code references',
        'Only report findings with confidence >= threshold'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'code-review', 'quality']
}));

const docsReviewTask = defineTask('claudekit-review-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Documentation Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Documentation Reviewer',
      task: 'Evaluate documentation completeness and accuracy for code changes. Check JSDoc, README updates, changelog entries, and inline documentation.',
      context: { ...args },
      instructions: [
        'Verify JSDoc/TSDoc for all public API changes',
        'Check that breaking changes are documented',
        'Review README updates if user-facing behavior changed',
        'Check for outdated documentation references',
        'Assess inline comment quality and necessity',
        'Verify type documentation matches implementation',
        'Score 0-100 with specific gaps identified',
        'Only report findings with confidence >= threshold'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'code-review', 'documentation']
}));

const aggregateReviewTask = defineTask('claudekit-aggregate-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate Review Results',
  agent: {
    ref: 'methodologies/claudekit/agents/code-review-coordinator',
    prompt: {
      role: 'ClaudeKit Review Coordinator',
      task: 'Aggregate results from all 6 review agents into a weighted final score and actionable recommendation.',
      context: { ...args },
      instructions: [
        'Collect scores from all 6 dimensions',
        'Apply weights: architecture 20%, security 25%, performance 15%, testing 15%, quality 15%, docs 10%',
        'Compute weighted overall score',
        'Deduplicate issues reported by multiple agents',
        'Rank issues by severity and confidence',
        'Generate recommendation: APPROVE, REQUEST_CHANGES, or REJECT',
        'APPROVE if overall >= 80 and no critical issues',
        'REQUEST_CHANGES if overall >= 60 or has critical issues',
        'REJECT if overall < 60',
        'Return comprehensive review report'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'code-review', 'aggregation']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

export async function process(inputs, ctx) {
  const {
    target,
    projectRoot = '.',
    changedFiles = null,
    baseRef = 'main',
    confidenceThreshold = 80,
    codebaseMap = null
  } = inputs;

  ctx.log('Starting ClaudeKit 6-Agent Parallel Code Review');

  // Phase 1: Detect changed files
  ctx.log('Phase 1: Detecting changed files');
  const changeSet = await ctx.task(detectChangedFilesTask, {
    target,
    projectRoot,
    changedFiles,
    baseRef
  });

  // Phase 2: Dispatch all 6 review agents in parallel
  ctx.log('Phase 2: Dispatching 6 review agents in parallel');
  const reviewContext = {
    changedFiles: changeSet.files,
    projectRoot,
    confidenceThreshold,
    codebaseMap,
    target
  };

  const [
    architectureResult,
    securityResult,
    performanceResult,
    testingResult,
    qualityResult,
    docsResult
  ] = await ctx.parallel.all([
    ctx.task(architectureReviewTask, reviewContext),
    ctx.task(securityReviewTask, reviewContext),
    ctx.task(performanceReviewTask, reviewContext),
    ctx.task(testingReviewTask, reviewContext),
    ctx.task(qualityReviewTask, reviewContext),
    ctx.task(docsReviewTask, reviewContext)
  ]);

  // Phase 3: Aggregate results
  ctx.log('Phase 3: Aggregating review results');
  const aggregatedReview = await ctx.task(aggregateReviewTask, {
    dimensions: {
      architecture: architectureResult,
      security: securityResult,
      performance: performanceResult,
      testing: testingResult,
      quality: qualityResult,
      documentation: docsResult
    },
    confidenceThreshold
  });

  // Phase 4: Human review gate for critical findings
  if (aggregatedReview.hasCriticalIssues) {
    ctx.log('Phase 4: Critical issues found - awaiting human review');
    await ctx.breakpoint({
      title: 'Critical Code Review Findings',
      description: 'The parallel code review identified critical issues that require human review before proceeding.',
      context: {
        overallScore: aggregatedReview.overallScore,
        criticalIssues: aggregatedReview.criticalIssues,
        recommendation: aggregatedReview.recommendation
      }
    });
  }

  ctx.log('ClaudeKit Code Review complete');

  return {
    success: aggregatedReview.recommendation !== 'REJECT',
    overallScore: aggregatedReview.overallScore,
    dimensions: {
      architecture: { score: architectureResult.score, issueCount: architectureResult.issueCount },
      security: { score: securityResult.score, issueCount: securityResult.issueCount },
      performance: { score: performanceResult.score, issueCount: performanceResult.issueCount },
      testing: { score: testingResult.score, issueCount: testingResult.issueCount },
      quality: { score: qualityResult.score, issueCount: qualityResult.issueCount },
      documentation: { score: docsResult.score, issueCount: docsResult.issueCount }
    },
    issues: aggregatedReview.rankedIssues,
    agentReports: [
      architectureResult,
      securityResult,
      performanceResult,
      testingResult,
      qualityResult,
      docsResult
    ],
    recommendation: aggregatedReview.recommendation,
    summary: {
      target,
      filesReviewed: changeSet.files.length,
      totalIssues: aggregatedReview.totalIssues,
      criticalIssues: aggregatedReview.criticalCount,
      recommendation: aggregatedReview.recommendation
    }
  };
}
