/**
 * @process specializations/embedded-systems/embedded-unit-testing
 * @description Embedded Unit Testing with Mocking - Test-driven development for embedded systems using frameworks like
 * Unity and CMock to test firmware modules in isolation by mocking hardware dependencies and peripheral interfaces.
 * @inputs { projectName: string, testFramework?: string, modulesToTest?: array, mockingStrategy?: string, outputDir?: string }
 * @outputs { success: boolean, testResults: object, coverage: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/embedded-unit-testing', {
 *   projectName: 'SensorDriver',
 *   testFramework: 'Unity',
 *   modulesToTest: ['spi_driver', 'sensor_interface', 'data_processor'],
 *   mockingStrategy: 'CMock'
 * });
 *
 * @references
 * - Ceedling Test Framework: http://www.throwtheswitch.org/ceedling
 * - Unity Test Framework: http://www.throwtheswitch.org/unity
 * - CMock: http://www.throwtheswitch.org/cmock
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    testFramework = 'Unity', // 'Unity', 'GoogleTest', 'CppUTest'
    modulesToTest = [],
    mockingStrategy = 'CMock', // 'CMock', 'FFF', 'manual'
    coverageTarget = 80,
    tddApproach = true,
    ciIntegration = true,
    outputDir = 'unit-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Embedded Unit Testing: ${projectName}`);
  ctx.log('info', `Framework: ${testFramework}, Mocking: ${mockingStrategy}`);

  // ============================================================================
  // PHASE 1: TEST ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up Test Environment');

  const envSetup = await ctx.task(testEnvironmentSetupTask, {
    projectName,
    testFramework,
    mockingStrategy,
    ciIntegration,
    outputDir
  });

  artifacts.push(...envSetup.artifacts);

  // ============================================================================
  // PHASE 2: HARDWARE ABSTRACTION MOCKING
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating Hardware Abstraction Mocks');

  const mockCreation = await ctx.task(hardwareMockCreationTask, {
    projectName,
    mockingStrategy,
    modulesToTest,
    outputDir
  });

  artifacts.push(...mockCreation.artifacts);

  // ============================================================================
  // PHASE 3: TEST CASE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing Test Cases');

  const testDesign = await ctx.task(testCaseDesignTask, {
    projectName,
    modulesToTest,
    tddApproach,
    coverageTarget,
    outputDir
  });

  artifacts.push(...testDesign.artifacts);

  // ============================================================================
  // PHASE 4: TEST IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Tests');

  const testImplementation = await ctx.task(testImplementationTask, {
    projectName,
    testFramework,
    testDesign,
    mockCreation,
    outputDir
  });

  artifacts.push(...testImplementation.artifacts);

  // ============================================================================
  // PHASE 5: TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Executing Tests');

  const testExecution = await ctx.task(unitTestExecutionTask, {
    projectName,
    testFramework,
    testImplementation,
    outputDir
  });

  artifacts.push(...testExecution.artifacts);

  // ============================================================================
  // PHASE 6: COVERAGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing Code Coverage');

  const coverageAnalysis = await ctx.task(coverageAnalysisTask, {
    projectName,
    testExecution,
    coverageTarget,
    outputDir
  });

  artifacts.push(...coverageAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Test Report');

  const reportGeneration = await ctx.task(testReportGenerationTask, {
    projectName,
    testExecution,
    coverageAnalysis,
    outputDir
  });

  artifacts.push(...reportGeneration.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Unit Testing Complete for ${projectName}. Pass rate: ${testExecution.passRate}%, Coverage: ${coverageAnalysis.totalCoverage}%. Review?`,
    title: 'Unit Testing Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalTests: testExecution.totalTests,
        passed: testExecution.passed,
        passRate: testExecution.passRate,
        coverage: coverageAnalysis.totalCoverage
      },
      files: [
        { path: reportGeneration.reportPath, format: 'markdown', label: 'Test Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testExecution.passRate >= 95 && coverageAnalysis.totalCoverage >= coverageTarget,
    projectName,
    testResults: {
      totalTests: testExecution.totalTests,
      passed: testExecution.passed,
      failed: testExecution.failed,
      passRate: testExecution.passRate
    },
    coverage: {
      line: coverageAnalysis.lineCoverage,
      branch: coverageAnalysis.branchCoverage,
      total: coverageAnalysis.totalCoverage,
      target: coverageTarget
    },
    reportPath: reportGeneration.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/embedded-unit-testing',
      timestamp: startTime,
      projectName,
      testFramework,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const testEnvironmentSetupTask = defineTask('test-environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Test Environment - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Embedded Test Engineer',
      task: 'Set up unit test environment',
      context: args,
      instructions: [
        '1. Install test framework (Unity/CppUTest)',
        '2. Configure build system for tests',
        '3. Set up mocking framework',
        '4. Configure test runner',
        '5. Set up coverage tools',
        '6. Configure CI integration',
        '7. Create test directory structure',
        '8. Set up test configuration',
        '9. Configure reporting',
        '10. Document setup process'
      ],
      outputFormat: 'JSON with environment setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'tools', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        tools: { type: 'array', items: { type: 'string' } },
        buildConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'unit-testing', 'environment']
}));

export const hardwareMockCreationTask = defineTask('hardware-mock-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Hardware Mocks - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Embedded Test Engineer',
      task: 'Create hardware abstraction mocks',
      context: args,
      instructions: [
        '1. Identify hardware dependencies',
        '2. Create register mock structures',
        '3. Generate peripheral mocks',
        '4. Create HAL function mocks',
        '5. Implement fake timers',
        '6. Create interrupt simulation',
        '7. Add mock verification',
        '8. Create mock configuration',
        '9. Add mock reset functions',
        '10. Document mock usage'
      ],
      outputFormat: 'JSON with mock creation details'
    },
    outputSchema: {
      type: 'object',
      required: ['mocks', 'mockCount', 'artifacts'],
      properties: {
        mocks: { type: 'array', items: { type: 'object' } },
        mockCount: { type: 'number' },
        mockFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'unit-testing', 'mocking']
}));

export const testCaseDesignTask = defineTask('test-case-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Test Case Design - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Embedded Test Engineer',
      task: 'Design test cases for modules',
      context: args,
      instructions: [
        '1. Analyze module interfaces',
        '2. Design positive test cases',
        '3. Design negative test cases',
        '4. Create boundary tests',
        '5. Design state transition tests',
        '6. Create error handling tests',
        '7. Design timeout tests',
        '8. Plan coverage targets',
        '9. Create test data sets',
        '10. Document test strategy'
      ],
      outputFormat: 'JSON with test case design details'
    },
    outputSchema: {
      type: 'object',
      required: ['testCases', 'testCount', 'artifacts'],
      properties: {
        testCases: { type: 'array', items: { type: 'object' } },
        testCount: { type: 'number' },
        coverageStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'unit-testing', 'design']
}));

export const testImplementationTask = defineTask('test-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Test Implementation - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Embedded Test Engineer',
      task: 'Implement unit tests',
      context: args,
      instructions: [
        '1. Create test files structure',
        '2. Implement setUp/tearDown',
        '3. Implement test functions',
        '4. Add mock expectations',
        '5. Add assertions',
        '6. Implement test groups',
        '7. Add parameterized tests',
        '8. Create test fixtures',
        '9. Add test documentation',
        '10. Review test quality'
      ],
      outputFormat: 'JSON with test implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'implementedTests', 'artifacts'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        implementedTests: { type: 'number' },
        testGroups: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'unit-testing', 'implementation']
}));

export const unitTestExecutionTask = defineTask('unit-test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Test Execution - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Embedded Test Engineer',
      task: 'Execute unit tests',
      context: args,
      instructions: [
        '1. Build test executables',
        '2. Run all test suites',
        '3. Collect test results',
        '4. Identify failures',
        '5. Analyze failed tests',
        '6. Run specific test groups',
        '7. Execute with coverage',
        '8. Collect timing data',
        '9. Generate output logs',
        '10. Report execution status'
      ],
      outputFormat: 'JSON with test execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passed', 'failed', 'passRate', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        passRate: { type: 'number' },
        failedTests: { type: 'array', items: { type: 'object' } },
        executionTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'unit-testing', 'execution']
}));

export const coverageAnalysisTask = defineTask('coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Coverage Analysis - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Embedded Test Engineer',
      task: 'Analyze code coverage',
      context: args,
      instructions: [
        '1. Collect coverage data',
        '2. Calculate line coverage',
        '3. Calculate branch coverage',
        '4. Calculate function coverage',
        '5. Identify uncovered code',
        '6. Analyze coverage gaps',
        '7. Compare against target',
        '8. Generate coverage report',
        '9. Create coverage visualization',
        '10. Recommend improvements'
      ],
      outputFormat: 'JSON with coverage analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['lineCoverage', 'branchCoverage', 'totalCoverage', 'artifacts'],
      properties: {
        lineCoverage: { type: 'number' },
        branchCoverage: { type: 'number' },
        functionCoverage: { type: 'number' },
        totalCoverage: { type: 'number' },
        uncoveredFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'unit-testing', 'coverage']
}));

export const testReportGenerationTask = defineTask('test-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Report - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Embedded Test Engineer',
      task: 'Generate test report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document test results',
        '3. Include coverage metrics',
        '4. List failed tests',
        '5. Add root cause analysis',
        '6. Include recommendations',
        '7. Create trend charts',
        '8. Add test statistics',
        '9. Document next steps',
        '10. Format report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'unit-testing', 'reporting']
}));
