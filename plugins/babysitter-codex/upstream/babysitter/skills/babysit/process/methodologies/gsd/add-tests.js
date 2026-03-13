/**
 * @process gsd/add-tests
 * @description Generate unit and E2E tests from UAT criteria for a completed phase
 * @inputs { phaseId: string, phaseName: string, projectDir: string, targetCoverage: number }
 * @outputs { success: boolean, testsGenerated: number, testsPassed: number, testsFailed: number, coveragePercent: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Add Tests Process
 *
 * GSD Methodology: Generate unit and E2E tests for a completed phase based on
 * UAT criteria and actual implementation. Reads phase SUMMARY.md, UAT.md, and
 * implementation files to produce test files that verify phase deliverables.
 *
 * Agents referenced from agents/ directory:
 *   - gsd-executor: Writes test files with atomic commits
 *   - gsd-verifier: Validates test quality and coverage
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config, path operations
 *   - state-management: STATE.md test coverage tracking
 *   - template-scaffolding: Test plan and test file templates
 *   - git-integration: Atomic commits for test files
 *   - verification-suite: Test coverage analysis
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.phaseId - Phase identifier
 * @param {string} inputs.phaseName - Phase name
 * @param {string} inputs.projectDir - Project root directory (default: '.')
 * @param {number} inputs.targetCoverage - Target test coverage percentage (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with test generation outcome
 */
export async function process(inputs, ctx) {
  const {
    phaseId,
    phaseName,
    projectDir = '.',
    targetCoverage = 80
  } = inputs;

  // ============================================================================
  // PHASE 1: ANALYZE PHASE
  // ============================================================================

  ctx.log(`Analyzing phase "${phaseName}" for test generation...`);

  const analyzeResult = await ctx.task(analyzePhaseTask, {
    phaseId,
    phaseName,
    projectDir
  });

  const deliverables = analyzeResult.deliverables || [];
  const uatCriteria = analyzeResult.uatCriteria || [];
  const requirements = analyzeResult.requirements || [];

  ctx.log(`Found ${deliverables.length} deliverables, ${uatCriteria.length} UAT criteria`);

  // ============================================================================
  // PHASE 2: SCAN IMPLEMENTATION
  // ============================================================================

  ctx.log('Scanning implementation files...');

  const scanResult = await ctx.task(scanImplementationTask, {
    phaseId,
    phaseName,
    deliverables,
    projectDir
  });

  const testableUnits = scanResult.testableUnits || [];
  const e2eFlows = scanResult.e2eFlows || [];

  ctx.log(`Found ${testableUnits.length} testable units, ${e2eFlows.length} E2E flows`);

  // ============================================================================
  // PHASE 3: GENERATE TEST PLAN
  // ============================================================================

  ctx.log('Generating test plan...');

  const testPlanResult = await ctx.task(generateTestPlanTask, {
    phaseId,
    phaseName,
    deliverables,
    uatCriteria,
    requirements,
    testableUnits,
    e2eFlows,
    targetCoverage,
    projectDir
  });

  const unitTests = testPlanResult.unitTests || [];
  const e2eTests = testPlanResult.e2eTests || [];
  const totalPlanned = unitTests.length + e2eTests.length;

  ctx.log(`Test plan: ${unitTests.length} unit tests, ${e2eTests.length} E2E tests`);

  // ============================================================================
  // PHASE 4: BREAKPOINT REVIEW
  // ============================================================================

  await ctx.breakpoint({
    question: `Test plan for phase "${phaseName}":\n\n` +
      `- ${unitTests.length} unit tests covering ${testableUnits.length} units\n` +
      `- ${e2eTests.length} E2E tests covering ${e2eFlows.length} flows\n` +
      `- Target coverage: ${targetCoverage}%\n\n` +
      `Review the plan. Add, remove, or reprioritize tests as needed.`,
    title: `Test Plan Review: ${phaseName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `.planning/${phaseId}/TEST-PLAN.md`, format: 'markdown', label: 'Test Plan' },
        { path: `.planning/${phaseId}/SUMMARY.md`, format: 'markdown', label: 'Phase Summary' }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: WRITE TESTS (quality-gated convergence)
  // ============================================================================

  ctx.log('Writing test files...');

  let converged = false;
  let iteration = 0;
  const maxIterations = 3;
  let testsGenerated = 0;
  let testsPassed = 0;
  let testsFailed = 0;
  let coveragePercent = 0;
  let testResults = [];

  while (!converged && iteration < maxIterations) {
    iteration++;
    ctx.log(`Test writing iteration ${iteration}/${maxIterations}`);

    // Write tests in parallel batches: unit tests and E2E tests
    const [unitWriteResult, e2eWriteResult] = await ctx.parallel.all([
      () => ctx.task(writeUnitTestsTask, {
        phaseId,
        phaseName,
        unitTests,
        testableUnits,
        iteration,
        previousResults: testResults,
        projectDir
      }),
      () => ctx.task(writeE2ETestsTask, {
        phaseId,
        phaseName,
        e2eTests,
        e2eFlows,
        iteration,
        previousResults: testResults,
        projectDir
      })
    ]);

    testsGenerated = (unitWriteResult.testsWritten || 0) + (e2eWriteResult.testsWritten || 0);

    // ============================================================================
    // PHASE 6: RUN TESTS
    // ============================================================================

    ctx.log(`Running ${testsGenerated} generated tests...`);

    const runResult = await ctx.task(runTestsTask, {
      phaseId,
      phaseName,
      testFiles: [
        ...(unitWriteResult.testFiles || []),
        ...(e2eWriteResult.testFiles || [])
      ],
      projectDir
    });

    testsPassed = runResult.passed;
    testsFailed = runResult.failed;
    coveragePercent = runResult.coveragePercent || 0;
    testResults = runResult.results || [];

    ctx.log(`Results: ${testsPassed} passed, ${testsFailed} failed, ${coveragePercent}% coverage`);

    // Converge if no failures and coverage target met
    if (testsFailed === 0 && coveragePercent >= targetCoverage) {
      converged = true;
    } else if (iteration < maxIterations) {
      // Fix straightforward failures before next iteration
      if (testsFailed > 0) {
        ctx.log(`Fixing ${testsFailed} test failures...`);

        await ctx.task(fixTestFailuresTask, {
          phaseId,
          phaseName,
          failedTests: testResults.filter(r => !r.passed),
          projectDir
        });
      }
    }
  }

  if (!converged) {
    await ctx.breakpoint({
      question: `Test generation did not fully converge after ${maxIterations} iterations.\n\n` +
        `- Generated: ${testsGenerated} tests\n` +
        `- Passed: ${testsPassed}, Failed: ${testsFailed}\n` +
        `- Coverage: ${coveragePercent}% (target: ${targetCoverage}%)\n\n` +
        `Review remaining failures and decide: accept current state or fix manually.`,
      title: `Test Convergence Incomplete: ${phaseName}`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `.planning/${phaseId}/TEST-RESULTS.md`, format: 'markdown', label: 'Test Results' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 7: UPDATE STATE
  // ============================================================================

  ctx.log('Updating state with test coverage info...');

  const [stateResult, summaryUpdateResult] = await ctx.parallel.all([
    () => ctx.task(updateTestStateTask, {
      phaseId,
      phaseName,
      testsGenerated,
      testsPassed,
      testsFailed,
      coveragePercent,
      targetCoverage,
      projectDir
    }),
    () => ctx.task(updatePhaseSummaryTask, {
      phaseId,
      phaseName,
      testsGenerated,
      testsPassed,
      coveragePercent,
      testFiles: testResults.map(r => r.file).filter(Boolean),
      projectDir
    })
  ]);

  return {
    success: converged,
    phaseId,
    phaseName,
    testsGenerated,
    testsPassed,
    testsFailed,
    coveragePercent,
    targetCoverage,
    converged,
    iterations: iteration,
    testResults,
    artifacts: {
      testPlan: `.planning/${phaseId}/TEST-PLAN.md`,
      testResults: `.planning/${phaseId}/TEST-RESULTS.md`
    },
    metadata: {
      processId: 'gsd/add-tests',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const analyzePhaseTask = defineTask('analyze-phase', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Analyze phase: ${args.phaseName}`,
  description: 'Read SUMMARY.md, UAT.md, REQUIREMENTS.md; map deliverables to testable behaviors',

  orchestratorTask: {
    payload: {
      skill: 'verification-suite',
      operation: 'analyze-phase',
      phaseId: args.phaseId,
      phaseName: args.phaseName,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'add-tests', 'analyze']
}));

export const scanImplementationTask = defineTask('scan-implementation', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Scan implementation: ${args.phaseName}`,
  description: 'Scan modified files, identify functions, endpoints, components to test',

  orchestratorTask: {
    payload: {
      skill: 'verification-suite',
      operation: 'scan-implementation',
      phaseId: args.phaseId,
      phaseName: args.phaseName,
      deliverables: args.deliverables,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'add-tests', 'scan']
}));

export const generateTestPlanTask = defineTask('generate-test-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test plan: ${args.phaseName}`,
  description: 'Create test plan mapping UAT criteria to specific test cases',

  agent: {
    name: 'gsd-verifier',
    prompt: {
      role: 'Senior QA Engineer and Test Architect',
      task: 'Create a comprehensive test plan mapping UAT criteria to unit and E2E test cases',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        deliverables: args.deliverables,
        uatCriteria: args.uatCriteria,
        requirements: args.requirements,
        testableUnits: args.testableUnits,
        e2eFlows: args.e2eFlows,
        targetCoverage: args.targetCoverage
      },
      instructions: [
        'Map each UAT criterion to one or more test cases',
        'Separate unit tests from E2E tests',
        'For unit tests: specify function/method, inputs, expected output',
        'For E2E tests: specify user flow, steps, assertions',
        'Prioritize tests by requirement criticality',
        'Identify test framework and patterns from existing project tests',
        'Write TEST-PLAN.md with full test specification',
        'Include estimated coverage contribution per test'
      ],
      outputFormat: 'JSON with unitTests (array), e2eTests (array), estimatedCoverage (number), testPlanMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['unitTests', 'e2eTests'],
      properties: {
        unitTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              targetFile: { type: 'string' },
              targetFunction: { type: 'string' },
              inputs: { type: 'array' },
              expectedOutput: { type: 'string' },
              uatCriterion: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        e2eTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              flow: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              assertions: { type: 'array', items: { type: 'string' } },
              uatCriterion: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        estimatedCoverage: { type: 'number' },
        testPlanMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'add-tests', 'plan']
}));

export const writeUnitTestsTask = defineTask('write-unit-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write unit tests: ${args.phaseName} (iter ${args.iteration})`,
  description: 'Generate unit test files with atomic commits',

  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'Senior Software Engineer with testing expertise',
      task: 'Write unit test files based on the test plan',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        unitTests: args.unitTests,
        testableUnits: args.testableUnits,
        iteration: args.iteration,
        previousResults: args.previousResults
      },
      instructions: [
        'Read existing tests to match project testing patterns (framework, style)',
        'Write unit test files for each planned test case',
        'Use describe/it blocks with clear test names',
        'Include setup/teardown where needed',
        'Mock external dependencies appropriately',
        'If iteration > 1, fix tests that failed in previous run',
        'Create atomic git commit for test files via git-integration skill',
        'Return list of test files created/modified'
      ],
      outputFormat: 'JSON with testFiles (array of paths), testsWritten (number), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testsWritten'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        testsWritten: { type: 'number' },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'add-tests', 'unit', `iteration-${args.iteration}`]
}));

export const writeE2ETestsTask = defineTask('write-e2e-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write E2E tests: ${args.phaseName} (iter ${args.iteration})`,
  description: 'Generate E2E test files with atomic commits',

  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'Senior Software Engineer with E2E testing expertise',
      task: 'Write E2E test files based on the test plan',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        e2eTests: args.e2eTests,
        e2eFlows: args.e2eFlows,
        iteration: args.iteration,
        previousResults: args.previousResults
      },
      instructions: [
        'Read existing E2E tests to match project patterns',
        'Write E2E test files following user flow specifications',
        'Include proper page object patterns if project uses them',
        'Set appropriate timeouts for async operations',
        'Include data setup and cleanup steps',
        'If iteration > 1, fix tests that failed in previous run',
        'Create atomic git commit for E2E test files via git-integration skill',
        'Return list of test files created/modified'
      ],
      outputFormat: 'JSON with testFiles (array of paths), testsWritten (number), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testsWritten'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        testsWritten: { type: 'number' },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'add-tests', 'e2e', `iteration-${args.iteration}`]
}));

export const runTestsTask = defineTask('run-tests', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Run tests: ${args.phaseName}`,
  description: 'Execute generated tests and collect results with coverage',

  orchestratorTask: {
    payload: {
      skill: 'verification-suite',
      operation: 'run-tests',
      phaseId: args.phaseId,
      testFiles: args.testFiles,
      projectDir: args.projectDir,
      coverage: true
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'add-tests', 'run']
}));

export const fixTestFailuresTask = defineTask('fix-test-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix test failures: ${args.phaseName}`,
  description: 'Fix straightforward test failures before next iteration',

  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'Senior Software Engineer',
      task: 'Fix test failures that are straightforward to resolve',
      context: {
        phaseId: args.phaseId,
        phaseName: args.phaseName,
        failedTests: args.failedTests
      },
      instructions: [
        'Review each failed test and its error message',
        'Fix tests where the issue is in the test (wrong assertion, missing mock, typo)',
        'For tests where implementation is wrong, adjust the test to document the actual behavior and add a TODO',
        'Do NOT fix production code - only fix test code',
        'Create atomic git commit for test fixes'
      ],
      outputFormat: 'JSON with fixed (array of test names), skipped (array of test names with reasons), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'skipped'],
      properties: {
        fixed: { type: 'array', items: { type: 'string' } },
        skipped: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'add-tests', 'fix']
}));

export const updateTestStateTask = defineTask('update-test-state', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Update STATE.md with test coverage',
  description: 'Record test generation results in STATE.md',

  orchestratorTask: {
    payload: {
      skill: 'state-management',
      operation: 'update-test-coverage',
      phaseId: args.phaseId,
      phaseName: args.phaseName,
      testsGenerated: args.testsGenerated,
      testsPassed: args.testsPassed,
      testsFailed: args.testsFailed,
      coveragePercent: args.coveragePercent,
      targetCoverage: args.targetCoverage,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'add-tests', 'state']
}));

export const updatePhaseSummaryTask = defineTask('update-phase-summary', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Update SUMMARY.md: ${args.phaseName}`,
  description: 'Add test artifacts section to phase SUMMARY.md',

  orchestratorTask: {
    payload: {
      skill: 'state-management',
      operation: 'update-phase-summary-tests',
      phaseId: args.phaseId,
      phaseName: args.phaseName,
      testsGenerated: args.testsGenerated,
      testsPassed: args.testsPassed,
      coveragePercent: args.coveragePercent,
      testFiles: args.testFiles,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'add-tests', 'summary']
}));
