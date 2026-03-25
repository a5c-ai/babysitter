/**
 * @process methodologies/cc10x/cc10x-review
 * @description CC10X REVIEW Workflow - Multi-dimensional code analysis with confidence-gated reporting (>=80%), covering security, quality, performance, and maintainability
 * @inputs { request: string, projectRoot?: string, targetFiles?: array, memory?: object, confidenceThreshold?: number }
 * @outputs { success: boolean, dimensions: object, issues: array, overallScore: number, routerContract: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const securityReviewTask = defineTask('cc10x-review-security', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Security Dimension Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Code Reviewer - Security Specialist',
      task: 'Perform security-focused code review. Only report findings with >=80% confidence. Zero tolerance for empty catch blocks.',
      context: { ...args },
      instructions: [
        'Scan for injection vulnerabilities (SQL, XSS, command injection)',
        'Check authentication and authorization patterns',
        'Review secrets handling (no hardcoded credentials, proper env var usage)',
        'Assess input validation and sanitization',
        'Check for insecure dependencies or patterns',
        'Identify empty catch blocks - zero tolerance',
        'Only report issues with confidence >= 80%',
        'Classify: critical, high, medium, low with remediation suggestions'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'review', 'security']
}));

const qualityReviewTask = defineTask('cc10x-review-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality Dimension Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Code Reviewer - Quality Specialist',
      task: 'Perform code quality review. Focus on naming, structure, patterns, error handling, and adherence to project conventions.',
      context: { ...args },
      instructions: [
        'Check naming conventions: meaningful, consistent, following project patterns',
        'Review code structure: SRP, cohesion, coupling, modularity',
        'Assess error handling completeness and correctness',
        'Check for code duplication and DRY violations',
        'Verify adherence to project patterns from patterns.md',
        'Review type safety (no any escapes, proper narrowing)',
        'Only report issues with confidence >= 80%',
        'Classify: critical, high, medium, low'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'review', 'quality']
}));

const performanceReviewTask = defineTask('cc10x-review-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Dimension Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Code Reviewer - Performance Specialist',
      task: 'Perform performance-focused code review. Identify algorithmic inefficiencies, resource leaks, and optimization opportunities.',
      context: { ...args },
      instructions: [
        'Check algorithmic complexity (O(n^2) or worse patterns)',
        'Identify potential memory leaks or resource leaks',
        'Review database query efficiency (N+1 queries, missing indices)',
        'Check for unnecessary synchronous operations that could be async',
        'Assess caching opportunities',
        'Review bundle size impact for frontend code',
        'Only report issues with confidence >= 80%',
        'Classify: critical, high, medium, low'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'review', 'performance']
}));

const maintainabilityReviewTask = defineTask('cc10x-review-maintainability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Maintainability Dimension Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Code Reviewer - Maintainability Specialist',
      task: 'Assess code maintainability: documentation, test coverage, readability, and long-term sustainability.',
      context: { ...args },
      instructions: [
        'Check documentation: JSDoc/TSDoc for public APIs, inline comments for complex logic',
        'Assess test coverage adequacy for changed code',
        'Review readability: function length, nesting depth, cognitive complexity',
        'Check for TODOs, FIXMEs, and tech debt markers',
        'Verify backward compatibility and migration paths',
        'Assess dependency health and version pinning',
        'Only report issues with confidence >= 80%',
        'Classify: critical, high, medium, low'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'review', 'maintainability']
}));

const synthesizeReviewTask = defineTask('cc10x-review-synthesize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Review Results',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Review Synthesizer',
      task: 'Combine all dimension reviews into a unified report with overall score and Router Contract.',
      context: { ...args },
      instructions: [
        'Merge issues from all four dimensions, deduplicating overlaps',
        'Calculate overall score (0-100) weighted: security 30%, quality 25%, performance 20%, maintainability 25%',
        'Rank issues by severity and actionability',
        'Generate Router Contract: STATUS (PASS if score >=80, FAIL otherwise), BLOCKING (if critical issues), REQUIRES_REMEDIATION',
        'Count critical and high issues separately',
        'Provide executive summary suitable for memory persistence'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'review', 'synthesis']
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * CC10X REVIEW Workflow Process
 *
 * Multi-dimensional code analysis with confidence-gated reporting:
 * 1. Parallel review across 4 dimensions (security, quality, performance, maintainability)
 * 2. Synthesize results into unified report with scoring
 * 3. Generate Router Contract for workflow validation
 *
 * Agent: code-reviewer (single agent, multi-dimensional)
 *
 * Attribution: Adapted from https://github.com/romiluz13/cc10x by Rom Iluz
 */
export async function process(inputs, ctx) {
  const {
    request,
    projectRoot = '.',
    targetFiles = [],
    memory = {},
    confidenceThreshold = 80
  } = inputs;

  ctx.log('CC10X REVIEW: Starting multi-dimensional code analysis', { request });

  // ========================================================================
  // STEP 1: PARALLEL DIMENSION REVIEWS
  // ========================================================================

  ctx.log('Step 1: Running parallel dimension reviews');

  const [securityResult, qualityResult, performanceResult, maintainabilityResult] = await ctx.parallel.all([
    ctx.task(securityReviewTask, { request, targetFiles, projectRoot, memory, confidenceThreshold }),
    ctx.task(qualityReviewTask, { request, targetFiles, projectRoot, memory, confidenceThreshold }),
    ctx.task(performanceReviewTask, { request, targetFiles, projectRoot, memory, confidenceThreshold }),
    ctx.task(maintainabilityReviewTask, { request, targetFiles, projectRoot, memory, confidenceThreshold })
  ]);

  // ========================================================================
  // STEP 2: SYNTHESIZE RESULTS
  // ========================================================================

  ctx.log('Step 2: Synthesizing review results');

  const synthesis = await ctx.task(synthesizeReviewTask, {
    securityResult,
    qualityResult,
    performanceResult,
    maintainabilityResult,
    confidenceThreshold
  });

  return {
    success: synthesis.overallScore >= confidenceThreshold,
    dimensions: {
      security: securityResult,
      quality: qualityResult,
      performance: performanceResult,
      maintainability: maintainabilityResult
    },
    issues: synthesis.issues || [],
    overallScore: synthesis.overallScore,
    routerContract: synthesis.routerContract || {
      status: synthesis.overallScore >= confidenceThreshold ? 'PASS' : 'FAIL',
      blocking: (synthesis.criticalCount || 0) > 0,
      requiresRemediation: (synthesis.criticalCount || 0) + (synthesis.highCount || 0) > 0
    },
    metadata: {
      processId: 'methodologies/cc10x/cc10x-review',
      attribution: 'https://github.com/romiluz13/cc10x',
      author: 'Rom Iluz',
      timestamp: ctx.now()
    }
  };
}
