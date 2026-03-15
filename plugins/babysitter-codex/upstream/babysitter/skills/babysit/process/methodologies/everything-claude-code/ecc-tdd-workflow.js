/**
 * @process methodologies/everything-claude-code/ecc-tdd-workflow
 * @description Everything Claude Code TDD Workflow - Test-driven development with Red-Green-Refactor cycles, coverage enforcement, and convergence verification
 * @inputs { request: string, projectRoot?: string, testFramework?: string, coverageThreshold?: number, maxIterations?: number, architecture?: object }
 * @outputs { success: boolean, redResult: object, greenResult: object, refactorResult: object, coverageResult: object, evidence: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const analyzeTestStrategyTask = defineTask('ecc-tdd-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Test Strategy',
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'ECC TDD Guide - Strategy Phase',
      task: 'Analyze the request and architecture to determine the optimal testing strategy. Identify test boundaries, mocking needs, and coverage targets.',
      context: { ...args },
      instructions: [
        'Review architecture and identify testable components',
        'Determine test pyramid: unit, integration, E2E proportions',
        'Identify external dependencies that need mocking',
        'Define test file organization matching source structure',
        'Select appropriate test framework and assertion library',
        'Plan test data fixtures and factories',
        'Set coverage targets per module (minimum 80% overall)',
        'Output a structured test plan with file-to-test mapping'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'tdd', 'strategy']
}));

const redPhaseTask = defineTask('ecc-tdd-red', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TDD RED Phase - Write Failing Tests',
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'ECC TDD Guide - RED Phase',
      task: 'Write comprehensive failing tests that define the expected behavior. Tests MUST fail at this stage (exit code 1).',
      context: { ...args },
      instructions: [
        'Write test files matching the test plan structure',
        'Include unit tests for each public API surface',
        'Include integration tests for component interactions',
        'Use descriptive test names: "should [expected behavior] when [condition]"',
        'Use CI=true npm test or --run flag to execute',
        'Tests MUST fail - exit code must be 1',
        'Apply timeout guards (timeout 60s) to prevent hanging',
        'Never use watch mode - always run mode',
        'Record failing test output as RED evidence',
        'If any test passes unexpectedly, investigate - feature may already exist'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'tdd', 'red']
}));

const greenPhaseTask = defineTask('ecc-tdd-green', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TDD GREEN Phase - Minimal Implementation',
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'ECC TDD Guide - GREEN Phase',
      task: 'Write the minimal implementation to make all failing tests pass. Do not over-engineer - only write code required by the tests.',
      context: { ...args },
      instructions: [
        'Read failing test output to understand expected behavior',
        'Implement the minimal code to make each test pass',
        'Do NOT add features not covered by tests',
        'Do NOT optimize prematurely - that is for REFACTOR phase',
        'Run tests after each implementation change',
        'All tests MUST pass - exit code must be 0',
        'Apply timeout guards for test execution',
        'Record passing test output as GREEN evidence',
        'If a test still fails, analyze the error and adjust implementation'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'tdd', 'green']
}));

const refactorPhaseTask = defineTask('ecc-tdd-refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TDD REFACTOR Phase - Improve Quality',
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'ECC TDD Guide - REFACTOR Phase',
      task: 'Refactor the implementation for quality, readability, and maintainability while keeping all tests green.',
      context: { ...args },
      instructions: [
        'Apply SOLID principles and clean code patterns',
        'Improve naming for clarity',
        'Extract common patterns into shared utilities',
        'Reduce coupling between components',
        'Apply immutability where appropriate',
        'Remove code duplication (DRY)',
        'Add JSDoc comments to public APIs',
        'Run tests after EACH refactoring step',
        'All tests MUST remain passing (exit code 0)',
        'Record before/after evidence for each refactoring'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'tdd', 'refactor']
}));

const coverageCheckTask = defineTask('ecc-tdd-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coverage Analysis and Gap Detection',
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'ECC TDD Guide - Coverage Analysis',
      task: 'Analyze test coverage and identify gaps. Report coverage per module and overall. Flag any module below the threshold.',
      context: { ...args },
      instructions: [
        'Run test coverage tool (c8, istanbul, or framework-specific)',
        'Parse coverage report: statements, branches, functions, lines',
        'Calculate per-module coverage percentages',
        'Identify uncovered branches and edge cases',
        'Flag modules below the coverage threshold',
        'Suggest specific tests to close coverage gaps',
        'Record coverage evidence with numerical proof'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'tdd', 'coverage']
}));

const additionalTestsTask = defineTask('ecc-tdd-additional', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write Additional Tests for Coverage Gaps',
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'ECC TDD Guide - Gap Closure',
      task: 'Write additional tests to close coverage gaps identified in the coverage analysis. Target the specific uncovered branches and edge cases.',
      context: { ...args },
      instructions: [
        'Review the coverage gap report',
        'Write tests for each uncovered branch',
        'Focus on edge cases: null inputs, empty arrays, boundary values',
        'Add error path tests: exceptions, timeouts, network failures',
        'Run tests to verify new tests pass',
        'Re-check coverage to confirm gaps are closed',
        'Record updated coverage numbers as evidence'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'tdd', 'gap-closure']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

/**
 * Everything Claude Code TDD Workflow
 *
 * Executes a full TDD cycle with convergence: analyze strategy -> RED (failing tests) ->
 * GREEN (minimal implementation) -> REFACTOR (quality improvement) -> coverage check ->
 * gap closure loop until threshold met.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.request - Feature or component to implement via TDD
 * @param {string} inputs.projectRoot - Project root directory (default: '.')
 * @param {string} inputs.testFramework - Test framework override (default: auto-detect)
 * @param {number} inputs.coverageThreshold - Minimum coverage percentage (default: 80)
 * @param {number} inputs.maxIterations - Max coverage improvement iterations (default: 3)
 * @param {Object} inputs.architecture - Architecture design to implement against
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    request,
    projectRoot = '.',
    testFramework,
    coverageThreshold = 80,
    maxIterations = 3,
    architecture
  } = inputs;

  ctx.log('info', `ECC TDD Workflow starting for: ${request}`);

  // ── Phase 1: Test Strategy Analysis ─────────────────────────────────
  ctx.log('info', 'Phase 1: Analyzing test strategy');
  const strategyResult = await ctx.task(analyzeTestStrategyTask, {
    request,
    projectRoot,
    testFramework,
    architecture,
    coverageThreshold
  });

  // ── Phase 2: RED - Write Failing Tests ──────────────────────────────
  ctx.log('info', 'Phase 2: RED - Writing failing tests');
  const redResult = await ctx.task(redPhaseTask, {
    request,
    projectRoot,
    testStrategy: strategyResult,
    architecture
  });

  if (redResult.exitCode === 0) {
    ctx.log('warn', 'Tests passed in RED phase - feature may already exist');
  }

  // ── Phase 3: GREEN - Minimal Implementation ─────────────────────────
  ctx.log('info', 'Phase 3: GREEN - Implementing minimal code to pass tests');
  const greenResult = await ctx.task(greenPhaseTask, {
    request,
    projectRoot,
    redEvidence: redResult,
    architecture
  });

  if (greenResult.exitCode !== 0) {
    ctx.log('error', 'Tests still failing after GREEN phase');
  }

  // ── Phase 4: Parallel REFACTOR + Coverage Baseline ───────────────────
  ctx.log('info', 'Phase 4: REFACTOR and coverage baseline (parallel)');
  const [refactorResult, initialCoverageResult] = await ctx.parallel.all([
    ctx.task(refactorPhaseTask, {
      request,
      projectRoot,
      greenEvidence: greenResult,
      architecture
    }),
    ctx.task(coverageCheckTask, {
      projectRoot,
      coverageThreshold
    })
  ]);

  // ── Phase 5: Coverage Convergence Loop ──────────────────────────────
  ctx.log('info', 'Phase 5: Coverage convergence (post-refactor)');
  let coverageResult = initialCoverageResult;

  let iteration = 0;
  while (
    coverageResult.overallCoverage < coverageThreshold &&
    iteration < maxIterations
  ) {
    iteration++;
    ctx.log('info', `Coverage iteration ${iteration}/${maxIterations}: ${coverageResult.overallCoverage}% < ${coverageThreshold}%`);

    const additionalResult = await ctx.task(additionalTestsTask, {
      projectRoot,
      coverageGaps: coverageResult.gaps,
      coverageThreshold
    });

    coverageResult = await ctx.task(coverageCheckTask, {
      projectRoot,
      coverageThreshold
    });

    ctx.log('info', `Coverage after iteration ${iteration}: ${coverageResult.overallCoverage}%`);
  }

  // ── Breakpoint: TDD cycle complete ──────────────────────────────────
  const coverageMet = coverageResult.overallCoverage >= coverageThreshold;
  if (!coverageMet) {
    ctx.log('warn', `Coverage ${coverageResult.overallCoverage}% below threshold ${coverageThreshold}% after ${maxIterations} iterations`);
    await ctx.breakpoint({
      title: 'Coverage Threshold Not Met',
      description: `Coverage is ${coverageResult.overallCoverage}% but threshold is ${coverageThreshold}%. Review and decide whether to proceed.`,
      data: { coverageResult, iterations: iteration }
    });
  }

  // ── Evidence Summary ────────────────────────────────────────────────
  const evidence = {
    redExitCode: redResult.exitCode,
    greenExitCode: greenResult.exitCode,
    refactorExitCode: refactorResult.exitCode,
    coveragePercentage: coverageResult.overallCoverage,
    coverageMet,
    convergenceIterations: iteration,
    testCount: greenResult.testCount || 'unknown'
  };

  ctx.log('info', `TDD Workflow complete: ${JSON.stringify(evidence)}`);

  return {
    success: greenResult.exitCode === 0 && coverageMet,
    redResult,
    greenResult,
    refactorResult,
    coverageResult,
    evidence
  };
}
