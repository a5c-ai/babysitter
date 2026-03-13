/**
 * @process specializations/code-migration-modernization/migration-testing-strategy
 * @description Migration Testing Strategy - Comprehensive process for planning and implementing testing
 * strategies specific to migration projects, ensuring functional equivalence, data validation, performance
 * verification, and quality throughout the migration lifecycle.
 * @inputs { projectName: string, legacySystemAccess?: object, functionalRequirements?: array, performanceRequirements?: object, migrationTimeline?: object }
 * @outputs { success: boolean, testStrategy: object, characterizationTests: object, regressionPlan: object, dataValidation: object, performancePlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/migration-testing-strategy', {
 *   projectName: 'CRM Migration Testing',
 *   legacySystemAccess: { url: 'https://legacy.example.com', type: 'api' },
 *   functionalRequirements: ['user-management', 'reporting', 'integrations'],
 *   performanceRequirements: { responseTime: '200ms', throughput: '1000 tps' },
 *   migrationTimeline: { phases: 4, duration: '6 months' }
 * });
 *
 * @references
 * - Characterization Testing: https://michaelfeathers.silvrback.com/characterization-testing
 * - Approval Tests: https://approvaltests.com/
 * - Golden Master Testing: https://blog.thecodewhisperer.com/permalink/surviving-legacy-code-with-golden-master-and-sampling
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    legacySystemAccess = {},
    functionalRequirements = [],
    performanceRequirements = {},
    migrationTimeline = {},
    testAutomationTarget = 80,
    outputDir = 'migration-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Migration Testing Strategy for ${projectName}`);

  // ============================================================================
  // PHASE 1: TEST SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining test scope');
  const testScope = await ctx.task(testScopeDefinitionTask, {
    projectName,
    functionalRequirements,
    performanceRequirements,
    migrationTimeline,
    outputDir
  });

  artifacts.push(...testScope.artifacts);

  // ============================================================================
  // PHASE 2: CHARACTERIZATION TEST DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing characterization tests');
  const characterizationTests = await ctx.task(characterizationTestDevelopmentTask, {
    projectName,
    legacySystemAccess,
    testScope,
    outputDir
  });

  artifacts.push(...characterizationTests.artifacts);

  // Breakpoint: Characterization baseline approval
  await ctx.breakpoint({
    question: `Characterization tests developed for ${projectName}. Test count: ${characterizationTests.testCount}. Coverage: ${characterizationTests.coverage}%. Approve baselines before proceeding?`,
    title: 'Characterization Test Baseline Approval',
    context: {
      runId: ctx.runId,
      projectName,
      testCount: characterizationTests.testCount,
      coverage: characterizationTests.coverage,
      files: characterizationTests.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: REGRESSION TEST PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning regression tests');
  const regressionPlan = await ctx.task(regressionTestPlanningTask, {
    projectName,
    testScope,
    characterizationTests,
    testAutomationTarget,
    outputDir
  });

  artifacts.push(...regressionPlan.artifacts);

  // ============================================================================
  // PHASE 4: DATA VALIDATION TEST DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing data validation tests');
  const dataValidationDesign = await ctx.task(dataValidationTestDesignTask, {
    projectName,
    testScope,
    outputDir
  });

  artifacts.push(...dataValidationDesign.artifacts);

  // ============================================================================
  // PHASE 5: INTEGRATION TEST PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning integration tests');
  const integrationTestPlan = await ctx.task(integrationTestPlanningTask, {
    projectName,
    testScope,
    outputDir
  });

  artifacts.push(...integrationTestPlan.artifacts);

  // ============================================================================
  // PHASE 6: PERFORMANCE TEST DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing performance tests');
  const performanceTestDesign = await ctx.task(performanceTestDesignTask, {
    projectName,
    performanceRequirements,
    testScope,
    outputDir
  });

  artifacts.push(...performanceTestDesign.artifacts);

  // ============================================================================
  // PHASE 7: TEST AUTOMATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up test automation');
  const automationSetup = await ctx.task(testAutomationSetupTask, {
    projectName,
    characterizationTests,
    regressionPlan,
    dataValidationDesign,
    performanceTestDesign,
    testAutomationTarget,
    outputDir
  });

  artifacts.push(...automationSetup.artifacts);

  // Breakpoint: Automation framework review
  await ctx.breakpoint({
    question: `Test automation framework ready for ${projectName}. Automation coverage: ${automationSetup.automationCoverage}%. CI/CD integrated: ${automationSetup.cicdIntegrated}. Approve automation setup?`,
    title: 'Test Automation Framework Review',
    context: {
      runId: ctx.runId,
      projectName,
      automationSetup,
      recommendation: 'Ensure CI/CD pipeline runs tests on every commit'
    }
  });

  // ============================================================================
  // PHASE 8: TEST EXECUTION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 8: Planning test execution');
  const executionPlan = await ctx.task(testExecutionPlanningTask, {
    projectName,
    migrationTimeline,
    testScope,
    regressionPlan,
    dataValidationDesign,
    integrationTestPlan,
    performanceTestDesign,
    outputDir
  });

  artifacts.push(...executionPlan.artifacts);

  // ============================================================================
  // PHASE 9: DEFECT MANAGEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up defect management');
  const defectManagement = await ctx.task(defectManagementSetupTask, {
    projectName,
    outputDir
  });

  artifacts.push(...defectManagement.artifacts);

  // ============================================================================
  // PHASE 10: TEST REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up test reporting');
  const testReporting = await ctx.task(testReportingSetupTask, {
    projectName,
    testScope,
    executionPlan,
    outputDir
  });

  artifacts.push(...testReporting.artifacts);

  // Final Breakpoint: Testing Strategy Approval
  await ctx.breakpoint({
    question: `Migration Testing Strategy complete for ${projectName}. Total test cases: ${testScope.totalTestCases}. Automation target: ${testAutomationTarget}%. Approve testing strategy?`,
    title: 'Migration Testing Strategy Approval',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        totalTestCases: testScope.totalTestCases,
        characterizationTests: characterizationTests.testCount,
        automationCoverage: automationSetup.automationCoverage,
        executionPhases: executionPlan.phases.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    testStrategy: {
      scope: testScope,
      totalTestCases: testScope.totalTestCases,
      automationTarget: testAutomationTarget
    },
    characterizationTests: {
      testCount: characterizationTests.testCount,
      coverage: characterizationTests.coverage,
      baselinesCaptured: characterizationTests.baselinesCaptured
    },
    regressionPlan: {
      testCases: regressionPlan.totalCases,
      coverageGaps: regressionPlan.coverageGaps,
      automationRatio: regressionPlan.automationRatio
    },
    dataValidation: {
      validationSuites: dataValidationDesign.validationSuites,
      reconciliationStrategy: dataValidationDesign.reconciliationStrategy
    },
    integrationTests: {
      integrationPoints: integrationTestPlan.integrationPoints,
      contractTests: integrationTestPlan.contractTests
    },
    performancePlan: {
      baselines: performanceTestDesign.baselines,
      scenarios: performanceTestDesign.scenarios,
      thresholds: performanceTestDesign.thresholds
    },
    automationFramework: {
      coverage: automationSetup.automationCoverage,
      cicdIntegrated: automationSetup.cicdIntegrated,
      tools: automationSetup.tools
    },
    executionPlan: {
      phases: executionPlan.phases,
      schedule: executionPlan.schedule
    },
    defectManagement: defectManagement,
    reportingDashboard: testReporting.dashboardUrl,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/migration-testing-strategy',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const testScopeDefinitionTask = defineTask('test-scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Test Scope Definition - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'QA Architect',
      task: 'Define comprehensive test scope for migration',
      context: args,
      instructions: [
        '1. Identify critical functionality to test',
        '2. Define test boundaries and exclusions',
        '3. Prioritize test coverage areas',
        '4. Determine test types needed',
        '5. Identify test data requirements',
        '6. Define acceptance criteria',
        '7. Map requirements to test cases',
        '8. Estimate test case count',
        '9. Define risk-based prioritization',
        '10. Create test scope document'
      ],
      outputFormat: 'JSON with totalTestCases, criticalAreas, testTypes, acceptanceCriteria, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTestCases', 'criticalAreas', 'artifacts'],
      properties: {
        totalTestCases: { type: 'number' },
        criticalAreas: { type: 'array', items: { type: 'object' } },
        testTypes: { type: 'array', items: { type: 'string' } },
        acceptanceCriteria: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'scope', 'planning']
}));

export const characterizationTestDevelopmentTask = defineTask('characterization-test-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Characterization Test Development - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'Test Developer',
      task: 'Develop characterization tests to capture legacy behavior',
      context: args,
      instructions: [
        '1. Capture existing system behavior',
        '2. Create golden master baselines',
        '3. Write approval tests',
        '4. Document edge cases',
        '5. Capture error behaviors',
        '6. Record API responses',
        '7. Capture state transitions',
        '8. Document timing behaviors',
        '9. Calculate coverage metrics',
        '10. Generate test suite'
      ],
      outputFormat: 'JSON with testCount, coverage, baselinesCaptured, edgeCases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        baselinesCaptured: { type: 'number' },
        edgeCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'characterization', 'baseline']
}));

export const regressionTestPlanningTask = defineTask('regression-test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Regression Test Planning - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'Test Lead',
      task: 'Plan regression test suite for migration',
      context: args,
      instructions: [
        '1. Inventory existing test cases',
        '2. Identify test coverage gaps',
        '3. Plan new test development',
        '4. Set coverage targets',
        '5. Prioritize by risk',
        '6. Plan automation strategy',
        '7. Identify manual tests needed',
        '8. Create test matrix',
        '9. Estimate effort',
        '10. Generate regression plan'
      ],
      outputFormat: 'JSON with totalCases, coverageGaps, automationRatio, newTestsNeeded, matrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCases', 'automationRatio', 'artifacts'],
      properties: {
        totalCases: { type: 'number' },
        coverageGaps: { type: 'array', items: { type: 'object' } },
        automationRatio: { type: 'number' },
        newTestsNeeded: { type: 'number' },
        matrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'regression', 'planning']
}));

export const dataValidationTestDesignTask = defineTask('data-validation-test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Data Validation Test Design - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Design data validation test suite',
      context: args,
      instructions: [
        '1. Define data comparison queries',
        '2. Create row count validations',
        '3. Design checksum validations',
        '4. Plan sample verification',
        '5. Define referential integrity checks',
        '6. Design business rule validations',
        '7. Create data quality metrics',
        '8. Plan reconciliation reports',
        '9. Define acceptance thresholds',
        '10. Generate validation suite'
      ],
      outputFormat: 'JSON with validationSuites, reconciliationStrategy, acceptanceThresholds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationSuites', 'reconciliationStrategy', 'artifacts'],
      properties: {
        validationSuites: { type: 'array', items: { type: 'object' } },
        reconciliationStrategy: { type: 'object' },
        acceptanceThresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'data-validation', 'design']
}));

export const integrationTestPlanningTask = defineTask('integration-test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Integration Test Planning - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'Integration Test Lead',
      task: 'Plan integration tests for migration',
      context: args,
      instructions: [
        '1. Map integration points',
        '2. Design contract tests',
        '3. Plan end-to-end scenarios',
        '4. Define test environments',
        '5. Plan service virtualization',
        '6. Design API tests',
        '7. Plan message queue tests',
        '8. Define integration patterns',
        '9. Estimate effort',
        '10. Generate integration test plan'
      ],
      outputFormat: 'JSON with integrationPoints, contractTests, scenarios, environments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationPoints', 'contractTests', 'artifacts'],
      properties: {
        integrationPoints: { type: 'array', items: { type: 'object' } },
        contractTests: { type: 'array', items: { type: 'object' } },
        scenarios: { type: 'array', items: { type: 'object' } },
        environments: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'integration', 'planning']
}));

export const performanceTestDesignTask = defineTask('performance-test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Performance Test Design - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'Performance Engineer',
      task: 'Design performance test suite for migration',
      context: args,
      instructions: [
        '1. Define performance baselines',
        '2. Create load test scenarios',
        '3. Plan stress testing',
        '4. Set performance thresholds',
        '5. Design endurance tests',
        '6. Plan scalability tests',
        '7. Define monitoring metrics',
        '8. Plan benchmark comparisons',
        '9. Select tools',
        '10. Generate performance test plan'
      ],
      outputFormat: 'JSON with baselines, scenarios, thresholds, tools, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['baselines', 'scenarios', 'thresholds', 'artifacts'],
      properties: {
        baselines: { type: 'array', items: { type: 'object' } },
        scenarios: { type: 'array', items: { type: 'object' } },
        thresholds: { type: 'object' },
        tools: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'performance', 'design']
}));

export const testAutomationSetupTask = defineTask('test-automation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Automation Setup - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Set up test automation framework',
      context: args,
      instructions: [
        '1. Select automation tools',
        '2. Set up test infrastructure',
        '3. Implement CI/CD integration',
        '4. Configure test reporting',
        '5. Create test data management',
        '6. Set up parallel execution',
        '7. Configure retry logic',
        '8. Implement notifications',
        '9. Calculate automation coverage',
        '10. Generate automation setup report'
      ],
      outputFormat: 'JSON with automationCoverage, cicdIntegrated, tools, infrastructure, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['automationCoverage', 'cicdIntegrated', 'artifacts'],
      properties: {
        automationCoverage: { type: 'number' },
        cicdIntegrated: { type: 'boolean' },
        tools: { type: 'array', items: { type: 'string' } },
        infrastructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'automation', 'setup']
}));

export const testExecutionPlanningTask = defineTask('test-execution-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Test Execution Planning - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'Test Manager',
      task: 'Plan test execution aligned with migration phases',
      context: args,
      instructions: [
        '1. Define test execution phases',
        '2. Align with migration phases',
        '3. Plan parallel testing',
        '4. Set acceptance criteria per phase',
        '5. Define resource allocation',
        '6. Create execution schedule',
        '7. Plan test environment usage',
        '8. Define go/no-go criteria',
        '9. Plan for rework cycles',
        '10. Generate execution plan'
      ],
      outputFormat: 'JSON with phases, schedule, resources, goNoGoCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'schedule', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        resources: { type: 'array', items: { type: 'object' } },
        goNoGoCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'execution', 'planning']
}));

export const defectManagementSetupTask = defineTask('defect-management-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Defect Management Setup - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'QA Manager',
      task: 'Set up defect management process',
      context: args,
      instructions: [
        '1. Define severity classifications',
        '2. Establish triage process',
        '3. Set up tracking system',
        '4. Define fix/no-fix criteria',
        '5. Create defect workflow',
        '6. Define escalation procedures',
        '7. Set up metrics tracking',
        '8. Create report templates',
        '9. Define SLAs',
        '10. Generate defect management process'
      ],
      outputFormat: 'JSON with severityLevels, triageProcess, workflow, slas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['severityLevels', 'triageProcess', 'artifacts'],
      properties: {
        severityLevels: { type: 'array', items: { type: 'object' } },
        triageProcess: { type: 'object' },
        workflow: { type: 'object' },
        slas: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'defect-management', 'process']
}));

export const testReportingSetupTask = defineTask('test-reporting-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Test Reporting Setup - ${args.projectName}`,
  agent: {
    name: 'migration-testing-strategist',
    prompt: {
      role: 'Test Reporting Specialist',
      task: 'Set up test reporting and dashboards',
      context: args,
      instructions: [
        '1. Define reporting metrics',
        '2. Create dashboards',
        '3. Set up automated reports',
        '4. Plan stakeholder communications',
        '5. Define report frequency',
        '6. Create executive summaries',
        '7. Set up trend analysis',
        '8. Configure alerts',
        '9. Create report templates',
        '10. Generate reporting framework'
      ],
      outputFormat: 'JSON with dashboardUrl, metrics, reportTemplates, schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardUrl', 'metrics', 'artifacts'],
      properties: {
        dashboardUrl: { type: 'string' },
        metrics: { type: 'array', items: { type: 'object' } },
        reportTemplates: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-testing', 'reporting', 'dashboards']
}));
