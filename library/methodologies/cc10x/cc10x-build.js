/**
 * @process methodologies/cc10x/cc10x-build
 * @description CC10X BUILD Workflow - TDD-enforced feature development with parallel code review, silent failure hunting, and integration verification
 * @inputs { request: string, projectRoot?: string, planFile?: string, memory?: object, confidenceThreshold?: number }
 * @outputs { success: boolean, tddEvidence: object, reviewResults: object, verificationResult: object, filesChanged: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const clarifyRequirementsTask = defineTask('cc10x-build-clarify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clarify Requirements Before Coding',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Component Builder - Requirements Phase',
      task: 'Analyze the request and clarify requirements before any code is written. If a plan file exists, read it first. Ask up to 4 clarifying questions if needed.',
      context: { ...args },
      instructions: [
        'If planFile is provided, read it and extract relevant phases and requirements',
        'Identify the specific components, APIs, or features to be built',
        'Determine testing strategy: what tests are needed, what coverage is expected',
        'Identify dependencies and potential architectural impacts',
        'If ambiguous, formulate up to 4 clarifying questions',
        'Output a structured requirements document with acceptance criteria'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'build', 'requirements']
}));

const tddRedTask = defineTask('cc10x-build-tdd-red', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TDD RED Phase - Write Failing Tests',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Component Builder - TDD RED Phase',
      task: 'Write failing tests that define the expected behavior. Tests MUST fail (exit code 1). Use run mode only, never watch mode.',
      context: { ...args },
      instructions: [
        'Write test files that cover the acceptance criteria from requirements',
        'Use CI=true npm test or --run flag to execute tests',
        'Tests MUST fail at this stage - exit code must be 1',
        'Use timeout guards (timeout 60s) as backup against hanging tests',
        'Never use watch mode - always use run mode',
        'Record exit code as evidence: RED phase requires exit code 1',
        'If test passes unexpectedly, the feature may already exist - investigate'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'build', 'tdd', 'red']
}));

const tddGreenTask = defineTask('cc10x-build-tdd-green', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TDD GREEN Phase - Minimal Implementation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Component Builder - TDD GREEN Phase',
      task: 'Write the minimal implementation code to make all failing tests pass. Code MUST achieve exit code 0. Use Write/Edit tools only for file modifications.',
      context: { ...args },
      instructions: [
        'Write minimal code to make tests pass - no gold plating',
        'Use Write/Edit tools for all file modifications - never Bash for file creation',
        'Run tests with CI=true npm test or --run flag',
        'Tests MUST pass at this stage - exit code must be 0',
        'If tests fail 3 consecutive times, report failure status',
        'Record exit code as evidence: GREEN phase requires exit code 0',
        'Check for scope creep: if >3 files need changes, flag for review'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'build', 'tdd', 'green']
}));

const tddRefactorTask = defineTask('cc10x-build-tdd-refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TDD REFACTOR Phase - Clean Up',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Component Builder - TDD REFACTOR Phase',
      task: 'Refactor the implementation for clarity and maintainability while keeping all tests green. Pattern-match against project conventions.',
      context: { ...args },
      instructions: [
        'Refactor for readability, DRY principles, and project patterns',
        'Check patterns.md for project conventions to follow',
        'Run tests after refactoring - must still pass (exit code 0)',
        'Run linter if available',
        'Do not change behavior - only improve code quality',
        'Record refactoring changes for memory persistence'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'build', 'tdd', 'refactor']
}));

const codeReviewTask = defineTask('cc10x-build-code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Code Review with Confidence Scoring',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Code Reviewer',
      task: 'Perform multi-dimensional code review. Only report issues with >=80% confidence. Include security, quality, performance, and maintainability dimensions.',
      context: { ...args },
      instructions: [
        'Review all changed files for security vulnerabilities',
        'Check code quality: naming, structure, patterns, error handling',
        'Assess performance: algorithmic complexity, resource usage',
        'Evaluate maintainability: readability, documentation, test coverage',
        'Only report issues with confidence >= 80%',
        'Classify each issue: critical, high, medium, low',
        'Include Router Contract in output: STATUS, BLOCKING, REQUIRES_REMEDIATION',
        'Zero tolerance for empty catch blocks'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'build', 'review']
}));

const silentFailureHuntTask = defineTask('cc10x-build-silent-failure-hunt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Silent Failure Detection',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Silent Failure Hunter',
      task: 'Hunt for error handling gaps, swallowed exceptions, and silent failures in changed code. Zero tolerance for empty catch blocks.',
      context: { ...args },
      instructions: [
        'Scan for empty catch blocks - zero tolerance',
        'Identify swallowed exceptions (caught but not logged or re-thrown)',
        'Check for missing error handling on async operations',
        'Find promises without rejection handling',
        'Detect potential null/undefined access without guards',
        'Check for missing timeout handling on network/IO operations',
        'Report each finding with file, line, and remediation suggestion',
        'Include confidence score (>=80% only) for each finding'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'build', 'silent-failure']
}));

const integrationVerifyTask = defineTask('cc10x-build-integration-verify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integration Verification with Evidence',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Integration Verifier',
      task: 'Run end-to-end verification of the implemented feature. All claims must be backed by exit codes, test output, or logs.',
      context: { ...args },
      instructions: [
        'Run the full test suite to verify no regressions',
        'Run integration/E2E tests if available',
        'Verify the feature works as specified in requirements',
        'Record all exit codes as evidence (zero = success)',
        'Check for any new warnings or deprecation notices',
        'Verify no unintended side effects on existing functionality',
        'Produce evidence report: test counts, pass/fail, exit codes, logs',
        'Include Router Contract: STATUS, BLOCKING, evidence summary'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'build', 'verification']
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * CC10X BUILD Workflow Process
 *
 * Implements the CC10X build workflow with strict TDD enforcement:
 * 1. Clarify requirements (read plan file if exists)
 * 2. TDD RED phase (write failing tests, exit code 1)
 * 3. TDD GREEN phase (minimal implementation, exit code 0)
 * 4. TDD REFACTOR phase (clean up, tests still pass)
 * 5. Code review + Silent failure hunting (PARALLEL)
 * 6. Integration verification with evidence
 *
 * Agent chain: component-builder -> [code-reviewer || silent-failure-hunter] -> integration-verifier
 *
 * Attribution: Adapted from https://github.com/romiluz13/cc10x by Rom Iluz
 */
export async function process(inputs, ctx) {
  const {
    request,
    projectRoot = '.',
    planFile = null,
    memory = {},
    confidenceThreshold = 80
  } = inputs;

  ctx.log('CC10X BUILD: Starting TDD-enforced development workflow', { request });

  // ========================================================================
  // STEP 1: CLARIFY REQUIREMENTS
  // ========================================================================

  ctx.log('Step 1: Clarifying requirements');

  const requirements = await ctx.task(clarifyRequirementsTask, {
    request,
    planFile,
    memory,
    projectRoot
  });

  if (requirements.clarificationQuestions && requirements.clarificationQuestions.length > 0) {
    await ctx.breakpoint({
      question: `Requirements clarification needed: ${requirements.clarificationQuestions.join('; ')}`,
      title: 'CC10X BUILD - Requirements Clarification',
      context: { runId: ctx.runId }
    });
  }

  // ========================================================================
  // STEP 2: TDD RED - Write Failing Tests
  // ========================================================================

  ctx.log('Step 2: TDD RED phase - writing failing tests');

  const redResult = await ctx.task(tddRedTask, {
    requirements,
    projectRoot,
    memory
  });

  // Verify RED evidence
  if (redResult.exitCode !== 1 && redResult.exitCode !== undefined) {
    ctx.log('WARNING: RED phase did not produce exit code 1', { exitCode: redResult.exitCode });
  }

  // ========================================================================
  // STEP 3: TDD GREEN - Minimal Implementation
  // ========================================================================

  ctx.log('Step 3: TDD GREEN phase - minimal implementation');

  const greenResult = await ctx.task(tddGreenTask, {
    requirements,
    redResult,
    projectRoot,
    memory
  });

  // Decision checkpoint for scope creep
  if (greenResult.filesChanged && greenResult.filesChanged.length > 3) {
    await ctx.breakpoint({
      question: `Scope creep detected: ${greenResult.filesChanged.length} files changed (threshold: 3). Review changes and approve to continue.`,
      title: 'CC10X BUILD - Scope Creep Check',
      context: { runId: ctx.runId }
    });
  }

  // ========================================================================
  // STEP 4: TDD REFACTOR
  // ========================================================================

  ctx.log('Step 4: TDD REFACTOR phase');

  const refactorResult = await ctx.task(tddRefactorTask, {
    requirements,
    greenResult,
    projectRoot,
    memory
  });

  // ========================================================================
  // STEP 5: PARALLEL REVIEW (code-reviewer || silent-failure-hunter)
  // ========================================================================

  ctx.log('Step 5: Parallel code review and silent failure hunting');

  const [reviewResult, silentFailureResult] = await ctx.parallel.all([
    ctx.task(codeReviewTask, {
      requirements,
      changedFiles: refactorResult.filesChanged || greenResult.filesChanged || [],
      projectRoot,
      confidenceThreshold
    }),
    ctx.task(silentFailureHuntTask, {
      changedFiles: refactorResult.filesChanged || greenResult.filesChanged || [],
      projectRoot,
      confidenceThreshold
    })
  ]);

  // ========================================================================
  // STEP 6: INTEGRATION VERIFICATION
  // ========================================================================

  ctx.log('Step 6: Integration verification');

  const verificationResult = await ctx.task(integrationVerifyTask, {
    requirements,
    reviewResult,
    silentFailureResult,
    projectRoot
  });

  return {
    success: verificationResult.status === 'PASS' || verificationResult.exitCode === 0,
    tddEvidence: {
      red: { exitCode: redResult.exitCode, testFiles: redResult.testFiles },
      green: { exitCode: greenResult.exitCode, filesChanged: greenResult.filesChanged },
      refactor: { exitCode: refactorResult.exitCode, improvements: refactorResult.improvements }
    },
    reviewResults: {
      codeReview: reviewResult,
      silentFailures: silentFailureResult
    },
    verificationResult,
    filesChanged: refactorResult.filesChanged || greenResult.filesChanged || [],
    metadata: {
      processId: 'methodologies/cc10x/cc10x-build',
      attribution: 'https://github.com/romiluz13/cc10x',
      author: 'Rom Iluz',
      timestamp: ctx.now()
    }
  };
}
