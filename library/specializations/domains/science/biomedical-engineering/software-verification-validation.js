/**
 * @process specializations/domains/science/biomedical-engineering/software-verification-validation
 * @description Medical Device Software V&V - Conduct comprehensive software verification and validation
 * ensuring medical device software meets specified requirements and intended use per IEC 62304 and FDA guidance.
 * @inputs { softwareName: string, safetyClass: string, softwareRequirements: object[], testStrategy?: string }
 * @outputs { success: boolean, vvPlan: object, testProtocols: object[], vvReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/software-verification-validation', {
 *   softwareName: 'Infusion Pump Controller Software',
 *   safetyClass: 'Class C',
 *   softwareRequirements: [{ id: 'SRS-001', requirement: 'Calculate dose rate', priority: 'critical' }],
 *   testStrategy: 'Risk-based'
 * });
 *
 * @references
 * - IEC 62304:2006/AMD1:2015 Software Verification (Section 5.7)
 * - FDA General Principles of Software Validation
 * - GAMP 5 Guide for Validation of Automated Systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    softwareName,
    safetyClass,
    softwareRequirements,
    testStrategy = 'Risk-based'
  } = inputs;

  // Phase 1: V&V Planning
  const vvPlanning = await ctx.task(vvPlanningTask, {
    softwareName,
    safetyClass,
    softwareRequirements,
    testStrategy
  });

  // Phase 2: Unit Test Development
  const unitTestDevelopment = await ctx.task(unitTestTask, {
    softwareName,
    safetyClass,
    vvPlanning
  });

  // Phase 3: Integration Testing
  const integrationTesting = await ctx.task(integrationTestTask, {
    softwareName,
    safetyClass,
    vvPlanning,
    unitTestDevelopment
  });

  // Phase 4: System Testing
  const systemTesting = await ctx.task(systemTestTask, {
    softwareName,
    softwareRequirements,
    vvPlanning
  });

  // Breakpoint: Review system test results
  await ctx.breakpoint({
    question: `Review system test results for ${softwareName}. Are all requirements verified?`,
    title: 'System Test Review',
    context: {
      runId: ctx.runId,
      softwareName,
      testCoverage: systemTesting.coverage,
      files: [{
        path: `artifacts/phase4-system-testing.json`,
        format: 'json',
        content: systemTesting
      }]
    }
  });

  // Phase 5: Validation Planning
  const validationPlanning = await ctx.task(validationPlanningTask, {
    softwareName,
    safetyClass,
    softwareRequirements
  });

  // Phase 6: User Acceptance Testing
  const userAcceptanceTesting = await ctx.task(userAcceptanceTask, {
    softwareName,
    validationPlanning
  });

  // Phase 7: Traceability Matrix Completion
  const traceabilityMatrix = await ctx.task(traceabilityTask, {
    softwareName,
    softwareRequirements,
    unitTestDevelopment,
    integrationTesting,
    systemTesting,
    userAcceptanceTesting
  });

  // Phase 8: V&V Report Compilation
  const vvReports = await ctx.task(vvReportTask, {
    softwareName,
    safetyClass,
    vvPlanning,
    unitTestDevelopment,
    integrationTesting,
    systemTesting,
    validationPlanning,
    userAcceptanceTesting,
    traceabilityMatrix
  });

  // Final Breakpoint: V&V Approval
  await ctx.breakpoint({
    question: `Software V&V complete for ${softwareName}. Traceability coverage: ${traceabilityMatrix.coverage}%. Approve V&V?`,
    title: 'V&V Approval',
    context: {
      runId: ctx.runId,
      softwareName,
      traceabilityCoverage: traceabilityMatrix.coverage,
      files: [
        { path: `artifacts/vv-reports.json`, format: 'json', content: vvReports }
      ]
    }
  });

  return {
    success: true,
    softwareName,
    vvPlan: vvPlanning.plan,
    testProtocols: {
      unit: unitTestDevelopment.protocols,
      integration: integrationTesting.protocols,
      system: systemTesting.protocols,
      validation: userAcceptanceTesting.protocols
    },
    vvReports: vvReports.reports,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/software-verification-validation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const vvPlanningTask = defineTask('vv-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: V&V Planning - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software V&V Manager',
      task: 'Create comprehensive software V&V plan',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        softwareRequirements: args.softwareRequirements,
        testStrategy: args.testStrategy
      },
      instructions: [
        '1. Define V&V scope and objectives',
        '2. Define test levels (unit, integration, system)',
        '3. Establish test coverage criteria',
        '4. Define acceptance criteria',
        '5. Identify test tools and environment',
        '6. Define test data requirements',
        '7. Establish traceability requirements',
        '8. Define roles and responsibilities',
        '9. Create V&V schedule',
        '10. Create V&V plan document'
      ],
      outputFormat: 'JSON object with V&V plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'testLevels', 'coverageCriteria'],
      properties: {
        plan: { type: 'object' },
        testLevels: { type: 'array', items: { type: 'string' } },
        coverageCriteria: { type: 'object' },
        schedule: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-vv', 'planning', 'iec-62304']
}));

export const unitTestTask = defineTask('unit-test-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Unit Testing - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Test Engineer',
      task: 'Develop and execute unit tests',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        vvPlanning: args.vvPlanning
      },
      instructions: [
        '1. Identify units to be tested',
        '2. Develop unit test cases',
        '3. Define test input data',
        '4. Define expected outputs',
        '5. Establish code coverage targets',
        '6. Execute unit tests',
        '7. Measure code coverage',
        '8. Document unit test results',
        '9. Manage test anomalies',
        '10. Create unit test report'
      ],
      outputFormat: 'JSON object with unit testing'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'results', 'coverage'],
      properties: {
        protocols: { type: 'array', items: { type: 'object' } },
        results: { type: 'object' },
        coverage: { type: 'object' },
        anomalies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-vv', 'unit-testing', 'iec-62304']
}));

export const integrationTestTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Integration Testing - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Test Engineer',
      task: 'Plan and execute integration testing',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        vvPlanning: args.vvPlanning,
        unitTestDevelopment: args.unitTestDevelopment
      },
      instructions: [
        '1. Define integration test strategy',
        '2. Identify integration points',
        '3. Develop integration test cases',
        '4. Define interface tests',
        '5. Plan incremental integration',
        '6. Execute integration tests',
        '7. Verify data flow between modules',
        '8. Document integration results',
        '9. Manage anomalies',
        '10. Create integration test report'
      ],
      outputFormat: 'JSON object with integration testing'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'results', 'integrationPoints'],
      properties: {
        protocols: { type: 'array', items: { type: 'object' } },
        results: { type: 'object' },
        integrationPoints: { type: 'array', items: { type: 'object' } },
        anomalies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-vv', 'integration-testing', 'iec-62304']
}));

export const systemTestTask = defineTask('system-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: System Testing - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'System Test Engineer',
      task: 'Plan and execute system testing',
      context: {
        softwareName: args.softwareName,
        softwareRequirements: args.softwareRequirements,
        vvPlanning: args.vvPlanning
      },
      instructions: [
        '1. Derive test cases from requirements',
        '2. Define system test environment',
        '3. Develop system test protocols',
        '4. Define acceptance criteria',
        '5. Execute functional tests',
        '6. Execute performance tests',
        '7. Execute boundary tests',
        '8. Document system test results',
        '9. Calculate requirement coverage',
        '10. Create system test report'
      ],
      outputFormat: 'JSON object with system testing'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'results', 'coverage'],
      properties: {
        protocols: { type: 'array', items: { type: 'object' } },
        results: { type: 'object' },
        coverage: { type: 'number' },
        anomalies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-vv', 'system-testing', 'iec-62304']
}));

export const validationPlanningTask = defineTask('validation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Validation Planning - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Specialist',
      task: 'Plan software validation activities',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        softwareRequirements: args.softwareRequirements
      },
      instructions: [
        '1. Define validation objectives',
        '2. Plan validation in intended environment',
        '3. Define user representative testing',
        '4. Plan simulated use testing',
        '5. Define clinical workflow testing',
        '6. Establish validation criteria',
        '7. Plan data migration testing if applicable',
        '8. Define regression testing',
        '9. Plan installation verification',
        '10. Create validation plan'
      ],
      outputFormat: 'JSON object with validation planning'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'validationEnvironment', 'criteria'],
      properties: {
        plan: { type: 'object' },
        validationEnvironment: { type: 'object' },
        criteria: { type: 'array', items: { type: 'object' } },
        userTesting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-vv', 'validation', 'iec-62304']
}));

export const userAcceptanceTask = defineTask('user-acceptance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: User Acceptance Testing - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UAT Coordinator',
      task: 'Plan and execute user acceptance testing',
      context: {
        softwareName: args.softwareName,
        validationPlanning: args.validationPlanning
      },
      instructions: [
        '1. Define UAT scope',
        '2. Identify user representatives',
        '3. Develop UAT test cases',
        '4. Define workflow scenarios',
        '5. Prepare UAT environment',
        '6. Execute UAT sessions',
        '7. Collect user feedback',
        '8. Document UAT results',
        '9. Address user findings',
        '10. Create UAT report'
      ],
      outputFormat: 'JSON object with user acceptance testing'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'results', 'userFeedback'],
      properties: {
        protocols: { type: 'array', items: { type: 'object' } },
        results: { type: 'object' },
        userFeedback: { type: 'array', items: { type: 'object' } },
        acceptance: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-vv', 'uat', 'validation']
}));

export const traceabilityTask = defineTask('traceability-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Traceability Matrix - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer',
      task: 'Complete and verify traceability matrix',
      context: {
        softwareName: args.softwareName,
        softwareRequirements: args.softwareRequirements,
        unitTestDevelopment: args.unitTestDevelopment,
        integrationTesting: args.integrationTesting,
        systemTesting: args.systemTesting,
        userAcceptanceTesting: args.userAcceptanceTesting
      },
      instructions: [
        '1. Map requirements to design',
        '2. Map design to implementation',
        '3. Map requirements to test cases',
        '4. Map test cases to results',
        '5. Identify untested requirements',
        '6. Verify bidirectional traceability',
        '7. Calculate coverage metrics',
        '8. Document gaps',
        '9. Create traceability report',
        '10. Obtain traceability approval'
      ],
      outputFormat: 'JSON object with traceability matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'coverage', 'gaps'],
      properties: {
        matrix: { type: 'object' },
        coverage: { type: 'number' },
        gaps: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-vv', 'traceability', 'iec-62304']
}));

export const vvReportTask = defineTask('vv-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: V&V Reports - ${args.softwareName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'V&V Documentation Manager',
      task: 'Compile comprehensive V&V reports',
      context: {
        softwareName: args.softwareName,
        safetyClass: args.safetyClass,
        vvPlanning: args.vvPlanning,
        unitTestDevelopment: args.unitTestDevelopment,
        integrationTesting: args.integrationTesting,
        systemTesting: args.systemTesting,
        validationPlanning: args.validationPlanning,
        userAcceptanceTesting: args.userAcceptanceTesting,
        traceabilityMatrix: args.traceabilityMatrix
      },
      instructions: [
        '1. Compile verification summary',
        '2. Compile validation summary',
        '3. Document all test results',
        '4. Include anomaly resolution',
        '5. Include traceability matrix',
        '6. Document coverage metrics',
        '7. Include conclusions',
        '8. Obtain required approvals',
        '9. Archive V&V records',
        '10. Create V&V summary report'
      ],
      outputFormat: 'JSON object with V&V reports'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'summary', 'approvals'],
      properties: {
        reports: { type: 'object' },
        summary: { type: 'object' },
        approvals: { type: 'array', items: { type: 'object' } },
        conclusions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-vv', 'documentation', 'iec-62304']
}));
