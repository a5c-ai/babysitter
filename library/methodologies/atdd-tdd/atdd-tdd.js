/**
 * @process methodologies/atdd-tdd
 * @description Test-Driven Development combining Acceptance Test-Driven Development (ATDD) and Test-Driven Development (TDD)
 * @inputs { feature: string, acceptanceCriteria?: array, testFramework?: string, iterationCount?: number }
 * @outputs { success: boolean, feature: object, acceptanceTests: array, unitTests: array, implementation: object, coverage: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * ATDD/TDD Combined Process
 *
 * Methodology: Outside-in development with acceptance tests driving unit-level TDD
 *
 * ATDD Layer (Acceptance Level):
 * 1. Define Acceptance Criteria - Customer/stakeholder collaboration
 * 2. Create Acceptance Tests - Executable specifications (failing)
 * 3. Verify Acceptance - Run acceptance tests (should pass after TDD cycles)
 *
 * TDD Layer (Unit Level - Red-Green-Refactor):
 * 4. Write Unit Test - Minimal failing test for one aspect
 * 5. Implement Code - Simplest code to make test pass
 * 6. Refactor - Improve design while maintaining passing tests
 * 7. Repeat until acceptance tests pass
 *
 * Benefits:
 * - ATDD ensures building the right thing (external quality)
 * - TDD ensures building it right (internal quality)
 * - Tests serve as living documentation
 * - Continuous feedback and validation
 * - Design emerges from tests
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.feature - Feature or user story to implement
 * @param {Array<string>} inputs.acceptanceCriteria - Pre-defined acceptance criteria (optional)
 * @param {string} inputs.testFramework - Test framework to use (default: 'jest')
 * @param {number} inputs.iterationCount - Max TDD iterations (default: 10)
 * @param {boolean} inputs.includeIntegrationTests - Include integration tests (default: true)
 * @param {Object} inputs.existingCode - Existing codebase context (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with tests and implementation
 */
export async function process(inputs, ctx) {
  const {
    feature,
    acceptanceCriteria: providedCriteria = [],
    testFramework = 'jest',
    iterationCount = 10,
    includeIntegrationTests = true,
    existingCode = null
  } = inputs;

  // ============================================================================
  // ATDD PHASE 1: DEFINE ACCEPTANCE CRITERIA
  // ============================================================================

  const criteriaResult = await ctx.task(defineAcceptanceCriteriaTask, {
    feature,
    providedCriteria,
    existingCode
  });

  // Breakpoint: Review acceptance criteria with stakeholders
  await ctx.breakpoint({
    question: `Review acceptance criteria for "${feature}". These define when the feature is "done" from a customer perspective. Do these criteria accurately capture business requirements?`,
    title: 'Acceptance Criteria Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/atdd-tdd/acceptance-criteria.md', format: 'markdown', label: 'Acceptance Criteria' },
        { path: 'artifacts/atdd-tdd/acceptance-criteria.json', format: 'json', label: 'Criteria JSON' }
      ]
    }
  });

  // ============================================================================
  // ATDD PHASE 2: CREATE ACCEPTANCE TESTS
  // ============================================================================

  const acceptanceTestsResult = await ctx.task(createAcceptanceTestsTask, {
    feature,
    acceptanceCriteria: criteriaResult.criteria,
    testFramework,
    existingCode
  });

  // Run acceptance tests (should fail initially - Red phase at acceptance level)
  const initialAcceptanceRunResult = await ctx.task(runAcceptanceTestsTask, {
    feature,
    acceptanceTests: acceptanceTestsResult.tests,
    testFramework,
    expectFailure: true
  });

  if (initialAcceptanceRunResult.allPassed) {
    // This shouldn't happen - tests should fail initially
    await ctx.breakpoint({
      question: `Warning: Acceptance tests passed on initial run. This suggests the feature may already be implemented, or tests are not correctly written. Review and decide: continue, revise tests, or abort?`,
      title: 'Unexpected Test Success',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/atdd-tdd/acceptance-tests/', format: 'code', label: 'Acceptance Tests' }
        ]
      }
    });
  }

  // Breakpoint: Review acceptance tests
  await ctx.breakpoint({
    question: `Review ${acceptanceTestsResult.tests.length} acceptance test(s) for "${feature}". Tests are currently failing as expected. These will guide TDD implementation. Approve to proceed with TDD cycles?`,
    title: 'Acceptance Tests Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/atdd-tdd/acceptance-tests/', format: 'code', label: 'Acceptance Test Files' },
        { path: 'artifacts/atdd-tdd/initial-acceptance-run.json', format: 'json', label: 'Initial Test Run' }
      ]
    }
  });

  // ============================================================================
  // TDD CYCLES: RED-GREEN-REFACTOR
  // ============================================================================

  const tddCycles = [];
  const allUnitTests = [];
  const implementationFiles = [];
  let acceptanceTestsPassing = false;
  let iteration = 0;

  while (!acceptanceTestsPassing && iteration < iterationCount) {
    iteration++;

    const cycleData = {
      iteration,
      startTime: ctx.now()
    };

    // -------------------------------------------------------------------------
    // TDD RED: Write failing unit test
    // -------------------------------------------------------------------------

    const unitTestResult = await ctx.task(createUnitTestTask, {
      feature,
      acceptanceCriteria: criteriaResult.criteria,
      acceptanceTests: acceptanceTestsResult.tests,
      previousCycles: tddCycles,
      existingTests: allUnitTests,
      existingImplementation: implementationFiles,
      testFramework,
      iteration
    });

    cycleData.unitTest = unitTestResult;
    allUnitTests.push(unitTestResult);

    // Run unit test (should fail - Red)
    const unitTestRunResult = await ctx.task(runUnitTestsTask, {
      feature,
      unitTests: allUnitTests,
      testFramework,
      expectFailure: true,
      focusTest: unitTestResult.testId
    });

    cycleData.unitTestRun = unitTestRunResult;

    if (unitTestRunResult.focused.passed) {
      // New test passed - possible issue
      await ctx.breakpoint({
        question: `Warning: New unit test passed immediately (expected to fail). This may indicate the test is not correctly written or the functionality already exists. Review test "${unitTestResult.testId}" and decide: revise test, continue, or skip?`,
        title: `TDD Cycle ${iteration} - Unexpected Pass`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/atdd-tdd/unit-tests/${unitTestResult.testId}.test.js`, format: 'code', label: 'Unit Test' }
          ]
        }
      });
    }

    // -------------------------------------------------------------------------
    // TDD GREEN: Implement minimum code to pass test
    // -------------------------------------------------------------------------

    const implementationResult = await ctx.task(implementCodeTask, {
      feature,
      unitTest: unitTestResult,
      allUnitTests,
      acceptanceCriteria: criteriaResult.criteria,
      existingImplementation: implementationFiles,
      testFramework,
      iteration
    });

    cycleData.implementation = implementationResult;

    // Update or add implementation file
    const existingFileIndex = implementationFiles.findIndex(
      f => f.filePath === implementationResult.filePath
    );
    if (existingFileIndex >= 0) {
      implementationFiles[existingFileIndex] = implementationResult;
    } else {
      implementationFiles.push(implementationResult);
    }

    // Run all unit tests (should all pass - Green)
    const postImplUnitTestRun = await ctx.task(runUnitTestsTask, {
      feature,
      unitTests: allUnitTests,
      testFramework,
      expectFailure: false
    });

    cycleData.postImplementationUnitTestRun = postImplUnitTestRun;

    if (!postImplUnitTestRun.allPassed) {
      // Implementation didn't make tests pass
      await ctx.breakpoint({
        question: `TDD Cycle ${iteration}: Implementation failed to make tests pass. ${postImplUnitTestRun.failedTests.length} test(s) still failing. Review implementation and decide: fix, revise approach, or abort?`,
        title: `TDD Cycle ${iteration} - Implementation Failed`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/atdd-tdd/implementation/${implementationResult.filePath}`, format: 'code', label: 'Implementation' },
            { path: `artifacts/atdd-tdd/cycle-${iteration}-failures.json`, format: 'json', label: 'Test Failures' }
          ]
        }
      });

      // Try to fix
      const fixResult = await ctx.task(implementCodeTask, {
        feature,
        unitTest: unitTestResult,
        allUnitTests,
        acceptanceCriteria: criteriaResult.criteria,
        existingImplementation: implementationFiles,
        testFramework,
        iteration,
        previousFailures: postImplUnitTestRun.failedTests
      });

      implementationFiles[implementationFiles.length - 1] = fixResult;
      cycleData.fixedImplementation = fixResult;
    }

    // -------------------------------------------------------------------------
    // TDD REFACTOR: Improve design while maintaining passing tests
    // -------------------------------------------------------------------------

    const refactorResult = await ctx.task(refactorCodeTask, {
      feature,
      implementationFiles,
      allUnitTests,
      acceptanceCriteria: criteriaResult.criteria,
      iteration
    });

    cycleData.refactor = refactorResult;

    if (refactorResult.refactored) {
      // Apply refactorings
      for (const refactoring of refactorResult.refactorings) {
        const fileIndex = implementationFiles.findIndex(
          f => f.filePath === refactoring.filePath
        );
        if (fileIndex >= 0) {
          implementationFiles[fileIndex].code = refactoring.refactoredCode;
        }
      }

      // Run tests again to ensure refactoring didn't break anything
      const postRefactorTestRun = await ctx.task(runUnitTestsTask, {
        feature,
        unitTests: allUnitTests,
        testFramework,
        expectFailure: false
      });

      cycleData.postRefactorTestRun = postRefactorTestRun;

      if (!postRefactorTestRun.allPassed) {
        // Refactoring broke tests - revert
        await ctx.breakpoint({
          question: `TDD Cycle ${iteration}: Refactoring broke ${postRefactorTestRun.failedTests.length} test(s). Reverting refactorings. Review and decide: continue with original code or fix refactoring?`,
          title: `TDD Cycle ${iteration} - Refactoring Broke Tests`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `artifacts/atdd-tdd/cycle-${iteration}-refactor-failures.json`, format: 'json', label: 'Failures' }
            ]
          }
        });

        // Revert refactorings
        for (const refactoring of refactorResult.refactorings) {
          const fileIndex = implementationFiles.findIndex(
            f => f.filePath === refactoring.filePath
          );
          if (fileIndex >= 0) {
            implementationFiles[fileIndex].code = refactoring.originalCode;
          }
        }
      }
    }

    cycleData.endTime = ctx.now();
    tddCycles.push(cycleData);

    // -------------------------------------------------------------------------
    // Check if acceptance tests pass yet
    // -------------------------------------------------------------------------

    const currentAcceptanceRun = await ctx.task(runAcceptanceTestsTask, {
      feature,
      acceptanceTests: acceptanceTestsResult.tests,
      implementationFiles,
      testFramework,
      expectFailure: false
    });

    cycleData.acceptanceTestRun = currentAcceptanceRun;
    acceptanceTestsPassing = currentAcceptanceRun.allPassed;

    if (acceptanceTestsPassing) {
      // Success! All acceptance tests pass
      await ctx.breakpoint({
        question: `TDD Cycle ${iteration} complete! All acceptance tests now pass. Feature "${feature}" is complete according to acceptance criteria. Review implementation and approve final deliverable?`,
        title: `Feature Complete - ${iteration} TDD Cycles`,
        context: {
          runId: ctx.runId,
          files: [
            { path: 'artifacts/atdd-tdd/acceptance-tests-final.json', format: 'json', label: 'Acceptance Tests (Passing)' },
            { path: 'artifacts/atdd-tdd/unit-tests-final.json', format: 'json', label: 'Unit Tests (Passing)' },
            { path: 'artifacts/atdd-tdd/implementation/', format: 'code', label: 'Implementation' }
          ]
        }
      });
    } else {
      // Continue iterating
      const passingCount = currentAcceptanceRun.passedTests.length;
      const totalCount = acceptanceTestsResult.tests.length;

      if (iteration % 3 === 0) {
        // Periodic checkpoint every 3 cycles
        await ctx.breakpoint({
          question: `TDD Cycle ${iteration} complete. Progress: ${passingCount}/${totalCount} acceptance tests passing. Continue with next TDD cycle?`,
          title: `TDD Cycle ${iteration} - Progress Check`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `artifacts/atdd-tdd/cycle-${iteration}-summary.md`, format: 'markdown', label: 'Cycle Summary' },
              { path: `artifacts/atdd-tdd/acceptance-progress.json`, format: 'json', label: 'Acceptance Test Progress' }
            ]
          }
        });
      }
    }
  }

  // Check if we hit iteration limit
  if (iteration >= iterationCount && !acceptanceTestsPassing) {
    await ctx.breakpoint({
      question: `Reached maximum TDD iterations (${iterationCount}) but acceptance tests are not all passing. ${acceptanceTestsResult.tests.length - (tddCycles[tddCycles.length - 1]?.acceptanceTestRun?.passedTests?.length || 0)} test(s) still failing. Review progress and decide: extend iterations, revise approach, or accept partial completion?`,
      title: 'Max Iterations Reached',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/atdd-tdd/final-status.json', format: 'json', label: 'Final Status' },
          { path: 'artifacts/atdd-tdd/implementation/', format: 'code', label: 'Current Implementation' }
        ]
      }
    });
  }

  // ============================================================================
  // OPTIONAL: INTEGRATION TESTS
  // ============================================================================

  let integrationTestsResult = null;
  if (includeIntegrationTests && acceptanceTestsPassing) {
    integrationTestsResult = await ctx.task(createIntegrationTestsTask, {
      feature,
      acceptanceCriteria: criteriaResult.criteria,
      implementationFiles,
      unitTests: allUnitTests,
      testFramework
    });

    const integrationRunResult = await ctx.task(runIntegrationTestsTask, {
      feature,
      integrationTests: integrationTestsResult.tests,
      testFramework
    });

    if (!integrationRunResult.allPassed) {
      await ctx.breakpoint({
        question: `Integration tests revealed ${integrationRunResult.failedTests.length} issue(s). Review failures and decide: fix integration issues or accept current state?`,
        title: 'Integration Test Failures',
        context: {
          runId: ctx.runId,
          files: [
            { path: 'artifacts/atdd-tdd/integration-test-results.json', format: 'json', label: 'Integration Results' }
          ]
        }
      });
    }
  }

  // ============================================================================
  // FINAL VALIDATION & METRICS
  // ============================================================================

  const coverageResult = await ctx.task(calculateCoverageTask, {
    feature,
    implementationFiles,
    unitTests: allUnitTests,
    acceptanceTests: acceptanceTestsResult.tests,
    integrationTests: integrationTestsResult?.tests || [],
    testFramework
  });

  // Final summary breakpoint
  await ctx.breakpoint({
    question: `ATDD/TDD process complete for "${feature}". Completed ${iteration} TDD cycles. All acceptance criteria met: ${acceptanceTestsPassing}. Code coverage: ${coverageResult.coverage}%. Review final deliverables and approve?`,
    title: 'ATDD/TDD Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/atdd-tdd/SUMMARY.md', format: 'markdown', label: 'Process Summary' },
        { path: 'artifacts/atdd-tdd/acceptance-criteria.md', format: 'markdown', label: 'Acceptance Criteria' },
        { path: 'artifacts/atdd-tdd/test-report.json', format: 'json', label: 'Test Report' },
        { path: 'artifacts/atdd-tdd/coverage-report.json', format: 'json', label: 'Coverage Report' },
        { path: 'artifacts/atdd-tdd/implementation/', format: 'code', label: 'Implementation' }
      ]
    }
  });

  return {
    success: acceptanceTestsPassing,
    feature,
    testFramework,
    acceptanceCriteria: criteriaResult,
    acceptanceTests: {
      tests: acceptanceTestsResult.tests,
      initialRun: initialAcceptanceRunResult,
      finalRun: tddCycles[tddCycles.length - 1]?.acceptanceTestRun,
      allPassed: acceptanceTestsPassing
    },
    tddCycles: {
      totalCycles: iteration,
      cycles: tddCycles,
      completedSuccessfully: acceptanceTestsPassing
    },
    unitTests: {
      tests: allUnitTests,
      totalTests: allUnitTests.length
    },
    integrationTests: integrationTestsResult ? {
      tests: integrationTestsResult.tests,
      results: integrationTestsResult
    } : null,
    implementation: {
      files: implementationFiles,
      totalFiles: implementationFiles.length
    },
    coverage: coverageResult,
    artifacts: {
      acceptanceCriteria: 'artifacts/atdd-tdd/acceptance-criteria.md',
      acceptanceTests: 'artifacts/atdd-tdd/acceptance-tests/',
      unitTests: 'artifacts/atdd-tdd/unit-tests/',
      integrationTests: includeIntegrationTests ? 'artifacts/atdd-tdd/integration-tests/' : null,
      implementation: 'artifacts/atdd-tdd/implementation/',
      summary: 'artifacts/atdd-tdd/SUMMARY.md',
      coverage: 'artifacts/atdd-tdd/coverage-report.json'
    },
    metadata: {
      processId: 'methodologies/atdd-tdd',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Define Acceptance Criteria
 *
 * Collaborate with stakeholders to define clear, testable acceptance criteria
 */
export const defineAcceptanceCriteriaTask = defineTask('define-acceptance-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define acceptance criteria: ${args.feature}`,
  description: 'Define clear, testable acceptance criteria from customer perspective',

  agent: {
    name: 'acceptance-criteria-analyst',
    prompt: {
      role: 'business analyst and product owner',
      task: 'Define acceptance criteria for the feature from a customer/stakeholder perspective',
      context: {
        feature: args.feature,
        providedCriteria: args.providedCriteria,
        existingCode: args.existingCode
      },
      instructions: [
        'Understand the feature from a business perspective',
        'Identify all scenarios where the feature should work',
        'Define "done" criteria that stakeholders would validate',
        'Make criteria specific, measurable, achievable, relevant, and testable (SMART)',
        'Include both positive scenarios (happy path) and negative scenarios (error cases)',
        'Use Given-When-Then format where appropriate',
        'Ensure criteria are independent and can be tested separately',
        'Consider edge cases and boundary conditions',
        'Prioritize criteria (must-have vs nice-to-have)'
      ],
      outputFormat: 'JSON with acceptance criteria array, scenarios, and priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'scenarios', 'priorities'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              given: { type: 'string' },
              when: { type: 'string' },
              then: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              testable: { type: 'boolean' }
            }
          }
        },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['happy-path', 'error-case', 'edge-case'] }
            }
          }
        },
        priorities: {
          type: 'object',
          properties: {
            mustHave: { type: 'array', items: { type: 'string' } },
            shouldHave: { type: 'array', items: { type: 'string' } },
            niceToHave: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'acceptance-criteria', 'atdd']
}));

/**
 * Task: Create Acceptance Tests
 *
 * Convert acceptance criteria into executable acceptance tests
 */
export const createAcceptanceTestsTask = defineTask('create-acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create acceptance tests: ${args.feature}`,
  description: 'Generate executable acceptance tests from criteria',

  agent: {
    name: 'acceptance-test-writer',
    prompt: {
      role: 'ATDD test automation engineer',
      task: 'Create executable acceptance tests from acceptance criteria',
      context: {
        feature: args.feature,
        acceptanceCriteria: args.acceptanceCriteria,
        testFramework: args.testFramework,
        existingCode: args.existingCode
      },
      instructions: [
        `Generate acceptance tests using ${args.testFramework}`,
        'Each criterion should map to one or more test cases',
        'Use Given-When-Then structure in test names',
        'Tests should validate from user/customer perspective (black-box)',
        'Setup test fixtures and mock external dependencies',
        'Write clear assertions that validate expected outcomes',
        'Tests should initially fail (feature not implemented yet)',
        'Include setup and teardown as needed',
        'Make tests independent and idempotent',
        'Add descriptive test names and comments'
      ],
      outputFormat: 'JSON with test files, test cases, and test framework setup'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'testFiles', 'setup'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              criterionId: { type: 'string' },
              testName: { type: 'string' },
              description: { type: 'string' },
              given: { type: 'string' },
              when: { type: 'string' },
              then: { type: 'string' },
              testCode: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filePath: { type: 'string' },
              code: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        setup: {
          type: 'object',
          properties: {
            configFiles: { type: 'array', items: { type: 'string' } },
            dependencies: { type: 'array', items: { type: 'string' } },
            fixtures: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'acceptance-tests', 'atdd', 'test-creation']
}));

/**
 * Task: Run Acceptance Tests
 *
 * Execute acceptance test suite and report results
 */
export const runAcceptanceTestsTask = defineTask('run-acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run acceptance tests: ${args.feature}`,
  description: 'Execute acceptance test suite',

  agent: {
    name: 'test-runner-acceptance',
    prompt: {
      role: 'test execution engineer',
      task: 'Run acceptance tests and report results',
      context: {
        feature: args.feature,
        acceptanceTests: args.acceptanceTests,
        implementationFiles: args.implementationFiles,
        testFramework: args.testFramework,
        expectFailure: args.expectFailure
      },
      instructions: [
        `Execute acceptance tests using ${args.testFramework}`,
        'Run all acceptance test cases',
        'Collect pass/fail results for each test',
        'Capture error messages and stack traces for failures',
        'Calculate overall pass rate',
        args.expectFailure ? 'Note: Tests are expected to fail initially (Red phase)' : 'Verify all tests pass (Green phase)',
        'Report execution time',
        'Identify which acceptance criteria are satisfied'
      ],
      outputFormat: 'JSON with test results, pass/fail counts, and detailed failures'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'totalTests', 'passedTests', 'failedTests'],
      properties: {
        allPassed: { type: 'boolean' },
        totalTests: { type: 'number' },
        passedTests: {
          type: 'array',
          items: { type: 'string' }
        },
        failedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              testName: { type: 'string' },
              error: { type: 'string' },
              stackTrace: { type: 'string' }
            }
          }
        },
        executionTime: { type: 'number' },
        criteriaMetCount: { type: 'number' },
        criteriaTotalCount: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'test-execution', 'atdd', 'acceptance-tests']
}));

/**
 * Task: Create Unit Test (TDD Red Phase)
 *
 * Write a minimal failing unit test for next aspect to implement
 */
export const createUnitTestTask = defineTask('create-unit-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD Red: Write unit test (iteration ${args.iteration})`,
  description: 'Write minimal failing unit test for next implementation step',

  agent: {
    name: 'tdd-test-writer',
    prompt: {
      role: 'TDD practitioner writing unit tests',
      task: 'Write one minimal unit test that will drive the next piece of implementation',
      context: {
        feature: args.feature,
        acceptanceCriteria: args.acceptanceCriteria,
        acceptanceTests: args.acceptanceTests,
        previousCycles: args.previousCycles,
        existingTests: args.existingTests,
        existingImplementation: args.existingImplementation,
        testFramework: args.testFramework,
        iteration: args.iteration
      },
      instructions: [
        'Analyze which acceptance tests are still failing',
        'Identify the next smallest unit of functionality needed',
        'Write ONE focused unit test for that unit',
        'Test should be minimal - test one thing only',
        'Follow TDD principle: write the simplest test that fails',
        'Use clear, descriptive test names',
        'Test should be independent of other tests',
        `Use ${args.testFramework} syntax`,
        'Test should fail initially (no implementation yet)',
        'Avoid testing implementation details - test behavior',
        'Consider: What is the next failing assertion that would drive implementation forward?'
      ],
      outputFormat: 'JSON with unit test code, test ID, description, and what it tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testId', 'testName', 'testCode', 'filePath', 'unitUnderTest'],
      properties: {
        testId: { type: 'string' },
        testName: { type: 'string' },
        description: { type: 'string' },
        testCode: { type: 'string' },
        filePath: { type: 'string' },
        unitUnderTest: { type: 'string' },
        focusArea: { type: 'string' },
        relatedAcceptanceCriteria: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'unit-test', 'tdd', 'red-phase', `iteration-${args.iteration}`]
}));

/**
 * Task: Implement Code (TDD Green Phase)
 *
 * Write simplest code to make the failing test pass
 */
export const implementCodeTask = defineTask('implement-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD Green: Implement code (iteration ${args.iteration})`,
  description: 'Write simplest code to make test pass',

  agent: {
    name: 'tdd-implementer',
    prompt: {
      role: 'TDD practitioner implementing production code',
      task: 'Write the simplest possible code to make the current failing test pass',
      context: {
        feature: args.feature,
        unitTest: args.unitTest,
        allUnitTests: args.allUnitTests,
        acceptanceCriteria: args.acceptanceCriteria,
        existingImplementation: args.existingImplementation,
        previousFailures: args.previousFailures,
        testFramework: args.testFramework,
        iteration: args.iteration
      },
      instructions: [
        'Focus on making the current test pass',
        'Write the SIMPLEST code that works - no premature optimization',
        'No gold-plating or adding extra features',
        'Only implement what the test requires',
        'Ensure ALL existing tests still pass',
        'Follow YAGNI (You Aren\'t Gonna Need It)',
        'Use clear, readable code',
        'Add minimal comments if logic is complex',
        args.previousFailures ? 'Fix previous failures' : 'Make new test pass',
        'Think: What is the most straightforward way to satisfy this test?'
      ],
      outputFormat: 'JSON with implementation code, file path, and explanation'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'code', 'explanation', 'testsPassed'],
      properties: {
        filePath: { type: 'string' },
        code: { type: 'string' },
        explanation: { type: 'string' },
        testsPassed: { type: 'array', items: { type: 'string' } },
        changes: {
          type: 'object',
          properties: {
            functionsAdded: { type: 'array', items: { type: 'string' } },
            functionsModified: { type: 'array', items: { type: 'string' } },
            linesAdded: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'implementation', 'tdd', 'green-phase', `iteration-${args.iteration}`]
}));

/**
 * Task: Refactor Code (TDD Refactor Phase)
 *
 * Improve code design while maintaining all passing tests
 */
export const refactorCodeTask = defineTask('refactor-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD Refactor: Improve design (iteration ${args.iteration})`,
  description: 'Refactor to improve design while keeping tests green',

  agent: {
    name: 'tdd-refactorer',
    prompt: {
      role: 'TDD practitioner performing refactoring',
      task: 'Refactor code to improve design, remove duplication, and increase clarity',
      context: {
        feature: args.feature,
        implementationFiles: args.implementationFiles,
        allUnitTests: args.allUnitTests,
        acceptanceCriteria: args.acceptanceCriteria,
        iteration: args.iteration
      },
      instructions: [
        'Review current implementation for code smells',
        'Look for duplication (DRY principle)',
        'Improve naming for clarity',
        'Extract methods/functions for better organization',
        'Simplify complex conditionals',
        'Improve code structure and design patterns',
        'Ensure all tests remain passing after refactoring',
        'Make small, incremental refactorings',
        'If no refactoring needed, indicate so',
        'Think: Can this code be clearer? Is there duplication? Can structure be improved?'
      ],
      outputFormat: 'JSON with refactoring suggestions and refactored code'
    },
    outputSchema: {
      type: 'object',
      required: ['refactored', 'refactorings'],
      properties: {
        refactored: { type: 'boolean' },
        refactorings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filePath: { type: 'string' },
              originalCode: { type: 'string' },
              refactoredCode: { type: 'string' },
              reason: { type: 'string' },
              improvements: { type: 'array', items: { type: 'string' } }
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

  labels: ['agent', 'atdd-tdd', 'refactoring', 'tdd', 'refactor-phase', `iteration-${args.iteration}`]
}));

/**
 * Task: Run Unit Tests
 *
 * Execute unit test suite and report results
 */
export const runUnitTestsTask = defineTask('run-unit-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run unit tests: ${args.feature}`,
  description: 'Execute unit test suite',

  agent: {
    name: 'test-runner-unit',
    prompt: {
      role: 'test execution engineer',
      task: 'Run unit tests and report results',
      context: {
        feature: args.feature,
        unitTests: args.unitTests,
        testFramework: args.testFramework,
        expectFailure: args.expectFailure,
        focusTest: args.focusTest
      },
      instructions: [
        `Execute unit tests using ${args.testFramework}`,
        'Run all unit test cases',
        args.focusTest ? `Focus on test: ${args.focusTest}` : 'Run all tests',
        'Collect pass/fail results for each test',
        'Capture error messages for failures',
        'Calculate pass rate',
        args.expectFailure ? 'Note: Tests expected to fail (Red phase)' : 'Verify all tests pass (Green phase)',
        'Report execution time'
      ],
      outputFormat: 'JSON with test results and pass/fail status'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'totalTests', 'passedTests', 'failedTests'],
      properties: {
        allPassed: { type: 'boolean' },
        totalTests: { type: 'number' },
        passedTests: { type: 'array', items: { type: 'string' } },
        failedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              error: { type: 'string' }
            }
          }
        },
        focused: args.focusTest ? {
          type: 'object',
          properties: {
            testId: { type: 'string' },
            passed: { type: 'boolean' },
            error: { type: 'string' }
          }
        } : { type: 'null' },
        executionTime: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'test-execution', 'tdd', 'unit-tests']
}));

/**
 * Task: Create Integration Tests
 *
 * Create tests that verify components work together correctly
 */
export const createIntegrationTestsTask = defineTask('create-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create integration tests: ${args.feature}`,
  description: 'Generate integration tests for component interaction',

  agent: {
    name: 'integration-test-writer',
    prompt: {
      role: 'integration test engineer',
      task: 'Create integration tests to verify components work together',
      context: {
        feature: args.feature,
        acceptanceCriteria: args.acceptanceCriteria,
        implementationFiles: args.implementationFiles,
        unitTests: args.unitTests,
        testFramework: args.testFramework
      },
      instructions: [
        'Identify integration points between components',
        'Create tests that verify components interact correctly',
        'Test with real dependencies where possible',
        'Use appropriate test doubles (mocks/stubs) for external systems',
        `Generate tests using ${args.testFramework}`,
        'Focus on data flow and communication between units',
        'Verify error handling across component boundaries',
        'Test different integration scenarios'
      ],
      outputFormat: 'JSON with integration test files and test cases'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'testFiles'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              testName: { type: 'string' },
              description: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } },
              testCode: { type: 'string' }
            }
          }
        },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filePath: { type: 'string' },
              code: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'integration-tests', 'test-creation']
}));

/**
 * Task: Run Integration Tests
 *
 * Execute integration test suite
 */
export const runIntegrationTestsTask = defineTask('run-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run integration tests: ${args.feature}`,
  description: 'Execute integration test suite',

  agent: {
    name: 'test-runner-integration',
    prompt: {
      role: 'test execution engineer',
      task: 'Run integration tests and report results',
      context: {
        feature: args.feature,
        integrationTests: args.integrationTests,
        testFramework: args.testFramework
      },
      instructions: [
        `Execute integration tests using ${args.testFramework}`,
        'Run all integration test cases',
        'Verify component interactions',
        'Collect pass/fail results',
        'Report any integration issues'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'totalTests', 'passedTests', 'failedTests'],
      properties: {
        allPassed: { type: 'boolean' },
        totalTests: { type: 'number' },
        passedTests: { type: 'array', items: { type: 'string' } },
        failedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              error: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'test-execution', 'integration-tests']
}));

/**
 * Task: Calculate Test Coverage
 *
 * Analyze test coverage metrics
 */
export const calculateCoverageTask = defineTask('calculate-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Calculate test coverage: ${args.feature}`,
  description: 'Analyze code coverage from all test types',

  agent: {
    name: 'coverage-analyzer',
    prompt: {
      role: 'test coverage analyst',
      task: 'Calculate code coverage from unit, acceptance, and integration tests',
      context: {
        feature: args.feature,
        implementationFiles: args.implementationFiles,
        unitTests: args.unitTests,
        acceptanceTests: args.acceptanceTests,
        integrationTests: args.integrationTests,
        testFramework: args.testFramework
      },
      instructions: [
        'Analyze code coverage from all tests',
        'Calculate line coverage percentage',
        'Calculate branch coverage percentage',
        'Identify uncovered code paths',
        'Report coverage by file',
        'Identify critical gaps in coverage',
        'Provide recommendations for improving coverage'
      ],
      outputFormat: 'JSON with coverage metrics and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['coverage', 'lineCoverage', 'branchCoverage'],
      properties: {
        coverage: { type: 'number' },
        lineCoverage: { type: 'number' },
        branchCoverage: { type: 'number' },
        filesCoverage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filePath: { type: 'string' },
              coverage: { type: 'number' },
              uncoveredLines: { type: 'array', items: { type: 'number' } }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'atdd-tdd', 'coverage', 'metrics']
}));
