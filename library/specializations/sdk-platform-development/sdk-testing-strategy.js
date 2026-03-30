/**
 * @process specializations/sdk-platform-development/sdk-testing-strategy
 * @description SDK Testing Strategy - Implement comprehensive testing approach for SDK quality assurance
 * including unit tests, integration tests, contract tests, and end-to-end test scenarios.
 * @inputs { projectName: string, sdkLanguages?: array, testingLevels?: array, contractTesting?: boolean }
 * @outputs { success: boolean, testStrategy: object, testSuites: array, coverageConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/sdk-testing-strategy', {
 *   projectName: 'CloudAPI SDK',
 *   sdkLanguages: ['typescript', 'python', 'go'],
 *   testingLevels: ['unit', 'integration', 'contract', 'e2e'],
 *   contractTesting: true
 * });
 *
 * @references
 * - Pact Contract Testing: https://docs.pact.io/
 * - Martin Fowler Testing: https://martinfowler.com/articles/microservice-testing/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sdkLanguages = ['typescript', 'python'],
    testingLevels = ['unit', 'integration', 'contract'],
    contractTesting = true,
    outputDir = 'sdk-testing-strategy'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SDK Testing Strategy: ${projectName}`);
  ctx.log('info', `Languages: ${sdkLanguages.join(', ')}`);

  // ============================================================================
  // PHASE 1: TESTING STRATEGY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining comprehensive testing strategy');

  const testStrategy = await ctx.task(testingStrategyTask, {
    projectName,
    sdkLanguages,
    testingLevels,
    outputDir
  });

  artifacts.push(...testStrategy.artifacts);

  // ============================================================================
  // PHASE 2: UNIT TEST SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating unit test suites for SDK components');

  const unitTestTasks = sdkLanguages.map(lang =>
    () => ctx.task(unitTestSetupTask, {
      projectName,
      language: lang,
      testStrategy,
      outputDir
    })
  );

  const unitTestSetups = await ctx.parallel.all(unitTestTasks);
  artifacts.push(...unitTestSetups.flatMap(t => t.artifacts));

  // ============================================================================
  // PHASE 3: INTEGRATION TEST SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing integration tests for API interactions');

  const integrationTests = await ctx.task(integrationTestSetupTask, {
    projectName,
    sdkLanguages,
    testStrategy,
    outputDir
  });

  artifacts.push(...integrationTests.artifacts);

  // ============================================================================
  // PHASE 4: CONTRACT TESTING
  // ============================================================================

  if (contractTesting) {
    ctx.log('info', 'Phase 4: Designing contract tests for API compatibility (Pact)');

    const contractTests = await ctx.task(contractTestSetupTask, {
      projectName,
      sdkLanguages,
      testStrategy,
      outputDir
    });

    artifacts.push(...contractTests.artifacts);
  }

  // Quality Gate: Testing Strategy Review
  await ctx.breakpoint({
    question: `Testing strategy defined for ${projectName}. Test levels: ${testingLevels.length}, Languages: ${sdkLanguages.length}. Approve testing strategy?`,
    title: 'Testing Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      testingLevels,
      sdkLanguages,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: E2E TEST SCENARIOS
  // ============================================================================

  ctx.log('info', 'Phase 5: Building end-to-end test scenarios');

  const e2eTests = await ctx.task(e2eTestSetupTask, {
    projectName,
    sdkLanguages,
    testStrategy,
    outputDir
  });

  artifacts.push(...e2eTests.artifacts);

  // ============================================================================
  // PHASE 6: COVERAGE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring test coverage requirements');

  const coverageConfig = await ctx.task(coverageConfigTask, {
    projectName,
    sdkLanguages,
    testStrategy,
    outputDir
  });

  artifacts.push(...coverageConfig.artifacts);

  // ============================================================================
  // PHASE 7: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating tests with CI/CD pipeline');

  const cicdIntegration = await ctx.task(testCicdIntegrationTask, {
    projectName,
    sdkLanguages,
    testStrategy,
    coverageConfig,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 8: TESTING DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating testing guidelines and documentation');

  const documentation = await ctx.task(testingDocumentationTask, {
    projectName,
    testStrategy,
    unitTestSetups,
    integrationTests,
    coverageConfig,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    testStrategy: testStrategy.strategy,
    testSuites: {
      unit: unitTestSetups.map(t => ({ language: t.language, config: t.config })),
      integration: integrationTests.config,
      contract: contractTesting ? { enabled: true } : { enabled: false },
      e2e: e2eTests.config
    },
    coverageConfig: coverageConfig.config,
    cicd: cicdIntegration.config,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/sdk-testing-strategy',
      timestamp: startTime,
      sdkLanguages,
      testingLevels
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const testingStrategyTask = defineTask('testing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Testing Strategy - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'QA Architect',
      task: 'Define comprehensive SDK testing strategy',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        testingLevels: args.testingLevels,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define testing pyramid for SDK',
        '2. Establish testing levels and responsibilities',
        '3. Define coverage targets per level',
        '4. Plan mocking and stubbing strategies',
        '5. Design test data management',
        '6. Plan test environment requirements',
        '7. Define test execution strategy',
        '8. Plan regression testing approach',
        '9. Design test reporting',
        '10. Generate testing strategy document'
      ],
      outputFormat: 'JSON with testing strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'testingPyramid', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        testingPyramid: { type: 'object' },
        coverageTargets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'testing', 'strategy']
}));

export const unitTestSetupTask = defineTask('unit-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Unit Tests - ${args.language}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Test Engineer',
      task: `Set up unit test suite for ${args.language} SDK`,
      context: {
        projectName: args.projectName,
        language: args.language,
        testStrategy: args.testStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Configure ${args.language} test framework`,
        '2. Set up test directory structure',
        '3. Create mock/stub utilities',
        '4. Define test naming conventions',
        '5. Create test helpers and fixtures',
        '6. Set up coverage collection',
        '7. Configure test parallelization',
        '8. Create example unit tests',
        '9. Set up snapshot testing if applicable',
        '10. Generate unit test configuration'
      ],
      outputFormat: 'JSON with unit test configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['language', 'config', 'artifacts'],
      properties: {
        language: { type: 'string' },
        config: { type: 'object' },
        framework: { type: 'string' },
        mockUtils: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'testing', 'unit-tests', args.language]
}));

export const integrationTestSetupTask = defineTask('integration-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Integration Tests - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Integration Test Engineer',
      task: 'Implement integration tests for API interactions',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        testStrategy: args.testStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design integration test architecture',
        '2. Set up test API environment',
        '3. Create API mocking strategy',
        '4. Design test data seeding',
        '5. Create authentication test fixtures',
        '6. Build request/response validation',
        '7. Design error scenario testing',
        '8. Create cleanup procedures',
        '9. Set up test isolation',
        '10. Generate integration test configuration'
      ],
      outputFormat: 'JSON with integration test configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'testEnvironment', 'artifacts'],
      properties: {
        config: { type: 'object' },
        testEnvironment: { type: 'object' },
        mockingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'testing', 'integration-tests']
}));

export const contractTestSetupTask = defineTask('contract-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Contract Tests - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Contract Test Engineer',
      task: 'Design contract tests for API compatibility (Pact)',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        testStrategy: args.testStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up Pact or similar framework',
        '2. Design consumer contract tests',
        '3. Configure Pact broker',
        '4. Create provider verification',
        '5. Design contract versioning',
        '6. Set up CI/CD integration',
        '7. Create can-i-deploy checks',
        '8. Design pending pacts handling',
        '9. Set up webhook notifications',
        '10. Generate contract test configuration'
      ],
      outputFormat: 'JSON with contract test configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'consumerTests', 'artifacts'],
      properties: {
        config: { type: 'object' },
        consumerTests: { type: 'array', items: { type: 'string' } },
        brokerConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'testing', 'contract-tests', 'pact']
}));

export const e2eTestSetupTask = defineTask('e2e-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: E2E Tests - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'E2E Test Engineer',
      task: 'Build end-to-end test scenarios',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        testStrategy: args.testStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design E2E test scenarios',
        '2. Create real API environment tests',
        '3. Build complete workflow tests',
        '4. Design authentication flow tests',
        '5. Create data consistency tests',
        '6. Build performance baseline tests',
        '7. Design failure recovery tests',
        '8. Create cross-SDK consistency tests',
        '9. Set up E2E test scheduling',
        '10. Generate E2E test configuration'
      ],
      outputFormat: 'JSON with E2E test configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'scenarios', 'artifacts'],
      properties: {
        config: { type: 'object' },
        scenarios: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'testing', 'e2e-tests']
}));

export const coverageConfigTask = defineTask('coverage-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Coverage Configuration - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Configure test coverage requirements',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        testStrategy: args.testStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define coverage thresholds',
        '2. Configure coverage tools per language',
        '3. Set up coverage reporting',
        '4. Design coverage gating',
        '5. Create coverage badges',
        '6. Plan coverage trend tracking',
        '7. Configure exclusion rules',
        '8. Set up coverage visualization',
        '9. Plan coverage alerts',
        '10. Generate coverage configuration'
      ],
      outputFormat: 'JSON with coverage configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'thresholds', 'artifacts'],
      properties: {
        config: { type: 'object' },
        thresholds: {
          type: 'object',
          properties: {
            line: { type: 'number' },
            branch: { type: 'number' },
            function: { type: 'number' }
          }
        },
        reporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'testing', 'coverage']
}));

export const testCicdIntegrationTask = defineTask('test-cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Integrate tests with CI/CD pipeline',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        testStrategy: args.testStrategy,
        coverageConfig: args.coverageConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure test stages in pipeline',
        '2. Set up parallel test execution',
        '3. Configure test result publishing',
        '4. Set up coverage reporting',
        '5. Configure test failure notifications',
        '6. Set up test caching',
        '7. Configure flaky test handling',
        '8. Set up test matrix',
        '9. Configure quality gates',
        '10. Generate CI/CD test configuration'
      ],
      outputFormat: 'JSON with CI/CD integration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'stages', 'artifacts'],
      properties: {
        config: { type: 'object' },
        stages: { type: 'array', items: { type: 'object' } },
        qualityGates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'testing', 'cicd']
}));

export const testingDocumentationTask = defineTask('testing-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Testing Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate testing guidelines and documentation',
      context: {
        projectName: args.projectName,
        testStrategy: args.testStrategy,
        unitTestSetups: args.unitTestSetups,
        integrationTests: args.integrationTests,
        coverageConfig: args.coverageConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create testing overview document',
        '2. Document testing pyramid',
        '3. Write unit test guidelines',
        '4. Document integration test patterns',
        '5. Write contract test guide',
        '6. Document E2E test scenarios',
        '7. Create coverage guidelines',
        '8. Write test debugging guide',
        '9. Document CI/CD test setup',
        '10. Generate all testing documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'artifacts'],
      properties: {
        paths: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            guidelines: { type: 'string' },
            coverage: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'testing', 'documentation']
}));
