/**
 * @process Quantum Circuit Testing Framework
 * @id QC-SW-001
 * @description Establish testing frameworks for quantum circuits including unit tests, integration
 * tests, property-based testing, and simulation-based validation.
 * @category Quantum Computing - Software Engineering
 * @priority P0 - Critical
 * @inputs {{ project: object, circuitModules: array }}
 * @outputs {{ success: boolean, testSuite: object, coverage: object, cicdConfig: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-circuit-testing-framework', {
 *   project: { name: 'quantum-library', path: '/src' },
 *   circuitModules: ['grover', 'vqe', 'qaoa']
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    project,
    circuitModules = [],
    framework = 'pytest',
    quantumFramework = 'qiskit',
    coverageTarget = 80,
    includePropertyTests = true,
    includeIntegrationTests = true,
    outputDir = 'quantum-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Circuit Testing Framework Setup`);
  ctx.log('info', `Project: ${project.name}, Modules: ${circuitModules.join(', ')}`);

  // ============================================================================
  // PHASE 1: TEST ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Test Architecture Design');

  const architectureResult = await ctx.task(testArchitectureDesignTask, {
    project,
    circuitModules,
    framework,
    quantumFramework
  });

  artifacts.push(...(architectureResult.artifacts || []));

  await ctx.breakpoint({
    question: `Test architecture designed. Test categories: ${architectureResult.testCategories.length}, Estimated test count: ${architectureResult.estimatedTestCount}. Proceed with unit test implementation?`,
    title: 'Test Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: architectureResult,
      files: (architectureResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: UNIT TEST IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Unit Test Implementation');

  const unitTestResult = await ctx.task(unitTestImplementationTask, {
    circuitModules,
    testArchitecture: architectureResult,
    framework,
    quantumFramework
  });

  artifacts.push(...(unitTestResult.artifacts || []));

  ctx.log('info', `Unit tests created: ${unitTestResult.testCount}`);

  // ============================================================================
  // PHASE 3: INTEGRATION TEST IMPLEMENTATION
  // ============================================================================

  let integrationTestResult = null;
  if (includeIntegrationTests) {
    ctx.log('info', 'Phase 3: Integration Test Implementation');

    integrationTestResult = await ctx.task(integrationTestImplementationTask, {
      circuitModules,
      testArchitecture: architectureResult,
      framework,
      quantumFramework
    });

    artifacts.push(...(integrationTestResult.artifacts || []));

    ctx.log('info', `Integration tests created: ${integrationTestResult.testCount}`);
  }

  // ============================================================================
  // PHASE 4: PROPERTY-BASED TEST IMPLEMENTATION
  // ============================================================================

  let propertyTestResult = null;
  if (includePropertyTests) {
    ctx.log('info', 'Phase 4: Property-Based Test Implementation');

    propertyTestResult = await ctx.task(propertyBasedTestImplementationTask, {
      circuitModules,
      testArchitecture: architectureResult,
      framework,
      quantumFramework
    });

    artifacts.push(...(propertyTestResult.artifacts || []));

    ctx.log('info', `Property-based tests created: ${propertyTestResult.testCount}`);
  }

  // ============================================================================
  // PHASE 5: SIMULATION VALIDATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 5: Simulation Validation Tests');

  const simulationTestResult = await ctx.task(simulationValidationTestsTask, {
    circuitModules,
    testArchitecture: architectureResult,
    quantumFramework
  });

  artifacts.push(...(simulationTestResult.artifacts || []));

  await ctx.breakpoint({
    question: `Simulation validation tests created: ${simulationTestResult.testCount}. Review simulation test coverage?`,
    title: 'Simulation Tests Review',
    context: {
      runId: ctx.runId,
      simulationTests: simulationTestResult,
      files: (simulationTestResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: TEST FIXTURE AND MOCK CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Test Fixture and Mock Creation');

  const fixtureResult = await ctx.task(testFixtureCreationTask, {
    circuitModules,
    testArchitecture: architectureResult,
    framework,
    quantumFramework
  });

  artifacts.push(...(fixtureResult.artifacts || []));

  // ============================================================================
  // PHASE 7: CI/CD PIPELINE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: CI/CD Pipeline Configuration');

  const cicdResult = await ctx.task(cicdPipelineConfigurationTask, {
    project,
    testSuites: {
      unit: unitTestResult,
      integration: integrationTestResult,
      property: propertyTestResult,
      simulation: simulationTestResult
    },
    coverageTarget,
    framework,
    quantumFramework
  });

  artifacts.push(...(cicdResult.artifacts || []));

  // ============================================================================
  // PHASE 8: TEST EXECUTION AND COVERAGE
  // ============================================================================

  ctx.log('info', 'Phase 8: Test Execution and Coverage');

  const executionResult = await ctx.task(testExecutionCoverageTask, {
    project,
    testSuites: {
      unit: unitTestResult,
      integration: integrationTestResult,
      property: propertyTestResult,
      simulation: simulationTestResult
    },
    coverageTarget,
    framework
  });

  artifacts.push(...(executionResult.artifacts || []));

  await ctx.breakpoint({
    question: `Test execution complete. Passed: ${executionResult.passedTests}/${executionResult.totalTests}, Coverage: ${executionResult.coveragePercentage}%. Review test results?`,
    title: 'Test Execution Review',
    context: {
      runId: ctx.runId,
      execution: executionResult,
      files: (executionResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Documentation');

  const docResult = await ctx.task(testingDocumentationTask, {
    project,
    architectureResult,
    unitTestResult,
    integrationTestResult,
    propertyTestResult,
    simulationTestResult,
    fixtureResult,
    cicdResult,
    executionResult,
    outputDir
  });

  artifacts.push(...(docResult.artifacts || []));

  await ctx.breakpoint({
    question: `Testing framework setup complete. Total tests: ${executionResult.totalTests}, Coverage: ${executionResult.coveragePercentage}%. Approve framework?`,
    title: 'Testing Framework Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalTests: executionResult.totalTests,
        passedTests: executionResult.passedTests,
        coverage: executionResult.coveragePercentage,
        cicdConfigured: true
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    project: project.name,
    testSuite: {
      unitTests: unitTestResult.testCount,
      integrationTests: integrationTestResult?.testCount || 0,
      propertyTests: propertyTestResult?.testCount || 0,
      simulationTests: simulationTestResult.testCount,
      totalTests: executionResult.totalTests
    },
    coverage: {
      percentage: executionResult.coveragePercentage,
      target: coverageTarget,
      metTarget: executionResult.coveragePercentage >= coverageTarget,
      uncoveredAreas: executionResult.uncoveredAreas
    },
    execution: {
      passed: executionResult.passedTests,
      failed: executionResult.failedTests,
      skipped: executionResult.skippedTests,
      duration: executionResult.executionTime
    },
    cicdConfig: cicdResult.configuration,
    fixtures: fixtureResult.fixtures,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-SW-001',
      processName: 'Quantum Circuit Testing Framework',
      category: 'quantum-computing',
      timestamp: startTime,
      framework,
      quantumFramework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const testArchitectureDesignTask = defineTask('qc-test-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Architecture Design',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'Quantum Software Testing Architect',
      task: 'Design test architecture for quantum circuit project',
      context: args,
      instructions: [
        '1. Analyze circuit modules and structure',
        '2. Define test categories and hierarchy',
        '3. Design test naming conventions',
        '4. Plan test directory structure',
        '5. Define test coverage requirements',
        '6. Identify critical test areas',
        '7. Design mock/stub strategy',
        '8. Plan test data management',
        '9. Define success criteria',
        '10. Document test architecture'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testCategories', 'estimatedTestCount', 'directoryStructure'],
      properties: {
        testCategories: { type: 'array', items: { type: 'string' } },
        estimatedTestCount: { type: 'number' },
        directoryStructure: { type: 'object' },
        namingConventions: { type: 'object' },
        coverageRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'architecture']
}));

export const unitTestImplementationTask = defineTask('qc-unit-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Unit Test Implementation',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'Quantum Unit Test Specialist',
      task: 'Implement unit tests for quantum circuit components',
      context: args,
      instructions: [
        '1. Create tests for individual gates',
        '2. Test circuit construction functions',
        '3. Test parameter handling',
        '4. Test circuit composition',
        '5. Test measurement operations',
        '6. Test utility functions',
        '7. Add edge case tests',
        '8. Add error handling tests',
        '9. Ensure isolation of tests',
        '10. Document test purpose'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'testFiles'],
      properties: {
        testCount: { type: 'number' },
        testFiles: { type: 'array' },
        testsByModule: { type: 'object' },
        testCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'unit-tests']
}));

export const integrationTestImplementationTask = defineTask('qc-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integration Test Implementation',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'Quantum Integration Test Specialist',
      task: 'Implement integration tests for quantum algorithms',
      context: args,
      instructions: [
        '1. Test complete algorithm workflows',
        '2. Test module interactions',
        '3. Test end-to-end pipelines',
        '4. Test with realistic inputs',
        '5. Test hybrid quantum-classical flows',
        '6. Test backend integrations',
        '7. Add performance tests',
        '8. Test error propagation',
        '9. Add regression tests',
        '10. Document integration scenarios'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'testFiles'],
      properties: {
        testCount: { type: 'number' },
        testFiles: { type: 'array' },
        integrationScenarios: { type: 'array' },
        testCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'integration-tests']
}));

export const propertyBasedTestImplementationTask = defineTask('qc-property-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Property-Based Test Implementation',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'Property-Based Testing Specialist',
      task: 'Implement property-based tests for quantum circuits',
      context: args,
      instructions: [
        '1. Identify quantum properties to test',
        '2. Test unitarity preservation',
        '3. Test normalization of states',
        '4. Test gate inverse properties',
        '5. Test measurement probabilities sum to 1',
        '6. Test parameterized circuit properties',
        '7. Generate random test inputs',
        '8. Test commutativity where applicable',
        '9. Test scaling properties',
        '10. Document tested properties'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'testFiles', 'propertiesTested'],
      properties: {
        testCount: { type: 'number' },
        testFiles: { type: 'array' },
        propertiesTested: { type: 'array' },
        testCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'property-tests']
}));

export const simulationValidationTestsTask = defineTask('qc-simulation-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Validation Tests',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'Quantum Simulation Testing Specialist',
      task: 'Implement simulation-based validation tests',
      context: args,
      instructions: [
        '1. Test against statevector simulation',
        '2. Test expected output states',
        '3. Validate measurement distributions',
        '4. Test fidelity against known results',
        '5. Test noise model behavior',
        '6. Compare multiple simulators',
        '7. Test with reference implementations',
        '8. Validate algorithm correctness',
        '9. Test resource estimations',
        '10. Document validation criteria'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'testFiles'],
      properties: {
        testCount: { type: 'number' },
        testFiles: { type: 'array' },
        validationCriteria: { type: 'array' },
        testCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'simulation']
}));

export const testFixtureCreationTask = defineTask('qc-test-fixtures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Fixture Creation',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'Test Fixture Specialist',
      task: 'Create test fixtures and mocks for quantum testing',
      context: args,
      instructions: [
        '1. Create circuit fixtures',
        '2. Create mock backends',
        '3. Create test state fixtures',
        '4. Create parameter fixtures',
        '5. Create noise model fixtures',
        '6. Create measurement result fixtures',
        '7. Implement factory functions',
        '8. Create reusable test utilities',
        '9. Document fixture usage',
        '10. Ensure fixture cleanup'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['fixtures', 'fixtureFiles'],
      properties: {
        fixtures: { type: 'array' },
        fixtureFiles: { type: 'array' },
        mockBackends: { type: 'array' },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'fixtures']
}));

export const cicdPipelineConfigurationTask = defineTask('qc-cicd-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CI/CD Pipeline Configuration',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'CI/CD Configuration Specialist',
      task: 'Configure CI/CD pipeline for quantum code testing',
      context: args,
      instructions: [
        '1. Configure GitHub Actions / GitLab CI',
        '2. Set up test environments',
        '3. Configure parallel test execution',
        '4. Set up coverage reporting',
        '5. Configure test result reporting',
        '6. Set up quality gates',
        '7. Configure artifact storage',
        '8. Set up notifications',
        '9. Configure caching',
        '10. Document CI/CD setup'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'pipelineFile'],
      properties: {
        configuration: { type: 'object' },
        pipelineFile: { type: 'string' },
        environments: { type: 'array' },
        qualityGates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'cicd']
}));

export const testExecutionCoverageTask = defineTask('qc-test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Execution and Coverage',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'Test Execution Specialist',
      task: 'Execute test suite and measure coverage',
      context: args,
      instructions: [
        '1. Run all test suites',
        '2. Collect test results',
        '3. Measure code coverage',
        '4. Generate coverage report',
        '5. Identify uncovered areas',
        '6. Analyze test failures',
        '7. Measure test duration',
        '8. Generate test report',
        '9. Compare with targets',
        '10. Document execution results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'failedTests', 'coveragePercentage'],
      properties: {
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        skippedTests: { type: 'number' },
        coveragePercentage: { type: 'number' },
        uncoveredAreas: { type: 'array' },
        executionTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'execution']
}));

export const testingDocumentationTask = defineTask('qc-testing-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Testing Documentation',
  agent: {
    name: 'quantum-test-engineer',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'cirq-circuit-builder'],
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive testing framework documentation',
      context: args,
      instructions: [
        '1. Document test architecture',
        '2. Explain test categories',
        '3. Document how to run tests',
        '4. Explain fixture usage',
        '5. Document CI/CD integration',
        '6. Provide contribution guidelines',
        '7. Include coverage report',
        '8. Document test utilities',
        '9. Add troubleshooting guide',
        '10. Generate final documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath'],
      properties: {
        documentationPath: { type: 'string' },
        readmePath: { type: 'string' },
        contributingPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'testing', 'documentation']
}));
