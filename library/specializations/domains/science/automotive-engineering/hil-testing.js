/**
 * @process specializations/domains/science/automotive-engineering/hil-testing
 * @description Hardware-in-the-Loop Testing - Implement HIL testing infrastructure and test execution
 * for ECU validation including real-time simulation, fault injection, and automated test execution.
 * @inputs { projectName: string, ecuType: string, testScope?: string[], hilPlatform?: string }
 * @outputs { success: boolean, hilConfiguration: object, testResults: object, coverageReport: object, issueList: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/hil-testing', {
 *   projectName: 'VCU-HIL-Validation',
 *   ecuType: 'vehicle-control-unit',
 *   testScope: ['functional', 'fault-injection', 'integration', 'regression'],
 *   hilPlatform: 'dSPACE-SCALEXIO'
 * });
 *
 * @references
 * - dSPACE HIL Testing Guidelines
 * - National Instruments VeriStand
 * - ISO 26262 Part 6 Software Verification
 * - ASPICE SWE.4 Software Unit Verification
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    ecuType,
    testScope = [],
    hilPlatform = 'dSPACE-SCALEXIO'
  } = inputs;

  // Phase 1: HIL Infrastructure Setup
  const hilInfrastructure = await ctx.task(hilInfrastructureTask, {
    projectName,
    ecuType,
    hilPlatform
  });

  // Phase 2: Plant Model Development
  const plantModel = await ctx.task(plantModelTask, {
    projectName,
    ecuType,
    hilInfrastructure
  });

  // Breakpoint: Plant model validation review
  await ctx.breakpoint({
    question: `Review plant model for ${projectName}. Model accuracy: ${plantModel.accuracy}%. Approve for HIL integration?`,
    title: 'Plant Model Review',
    context: {
      runId: ctx.runId,
      projectName,
      plantModel,
      files: [{
        path: `artifacts/plant-model.json`,
        format: 'json',
        content: plantModel
      }]
    }
  });

  // Phase 3: Test Automation Development
  const testAutomation = await ctx.task(testAutomationTask, {
    projectName,
    hilInfrastructure,
    testScope
  });

  // Phase 4: Functional Testing
  const functionalTesting = await ctx.task(functionalTestingTask, {
    projectName,
    hilInfrastructure,
    testAutomation
  });

  // Phase 5: Fault Injection Testing
  const faultInjection = await ctx.task(faultInjectionTask, {
    projectName,
    hilInfrastructure,
    testAutomation
  });

  // Phase 6: Integration Testing
  const integrationTesting = await ctx.task(integrationTestingTask, {
    projectName,
    hilInfrastructure,
    functionalTesting
  });

  // Phase 7: Regression Testing
  const regressionTesting = await ctx.task(regressionTestingTask, {
    projectName,
    hilInfrastructure,
    testAutomation
  });

  // Phase 8: HIL Test Reporting
  const hilReporting = await ctx.task(hilReportingTask, {
    projectName,
    functionalTesting,
    faultInjection,
    integrationTesting,
    regressionTesting
  });

  // Final Breakpoint: HIL testing approval
  await ctx.breakpoint({
    question: `HIL Testing complete for ${projectName}. Pass rate: ${hilReporting.passRate}%. Test coverage: ${hilReporting.coverage}%. Approve?`,
    title: 'HIL Testing Approval',
    context: {
      runId: ctx.runId,
      projectName,
      hilReporting,
      files: [
        { path: `artifacts/hil-configuration.json`, format: 'json', content: hilInfrastructure },
        { path: `artifacts/test-results.json`, format: 'json', content: hilReporting }
      ]
    }
  });

  return {
    success: true,
    projectName,
    hilConfiguration: hilInfrastructure.configuration,
    testResults: hilReporting.results,
    coverageReport: hilReporting.coverageReport,
    issueList: hilReporting.issues,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/hil-testing',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const hilInfrastructureTask = defineTask('hil-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: HIL Infrastructure Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HIL Systems Engineer',
      task: 'Setup HIL testing infrastructure',
      context: args,
      instructions: [
        '1. Configure HIL simulator hardware',
        '2. Setup I/O signal conditioning',
        '3. Configure communication interfaces (CAN, LIN, Ethernet)',
        '4. Setup ECU power supply and load simulation',
        '5. Configure real-time target',
        '6. Setup signal breakout and measurement',
        '7. Configure automation interface',
        '8. Setup residual bus simulation',
        '9. Configure data logging',
        '10. Document HIL configuration'
      ],
      outputFormat: 'JSON object with HIL infrastructure'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'interfaces', 'capabilities'],
      properties: {
        configuration: { type: 'object' },
        interfaces: { type: 'array', items: { type: 'object' } },
        capabilities: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'HIL', 'infrastructure', 'testing']
}));

export const plantModelTask = defineTask('plant-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Plant Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Plant Model Engineer',
      task: 'Develop plant models for HIL simulation',
      context: args,
      instructions: [
        '1. Develop vehicle dynamics model',
        '2. Develop powertrain model',
        '3. Develop sensor simulation models',
        '4. Develop actuator models',
        '5. Integrate environmental models',
        '6. Validate model accuracy',
        '7. Optimize real-time performance',
        '8. Configure model parameterization',
        '9. Implement model variants',
        '10. Document model specifications'
      ],
      outputFormat: 'JSON object with plant model'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'accuracy', 'validation'],
      properties: {
        models: { type: 'array', items: { type: 'object' } },
        accuracy: { type: 'number' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'HIL', 'plant-model', 'simulation']
}));

export const testAutomationTask = defineTask('test-automation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Test Automation Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Develop HIL test automation framework',
      context: args,
      instructions: [
        '1. Define test automation architecture',
        '2. Develop test case templates',
        '3. Implement test sequencer',
        '4. Develop signal manipulation library',
        '5. Implement pass/fail evaluation',
        '6. Develop reporting framework',
        '7. Implement CI/CD integration',
        '8. Develop test management interface',
        '9. Implement parallel test execution',
        '10. Document automation framework'
      ],
      outputFormat: 'JSON object with test automation'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'templates', 'capabilities'],
      properties: {
        framework: { type: 'object' },
        templates: { type: 'array', items: { type: 'object' } },
        capabilities: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'HIL', 'automation', 'testing']
}));

export const functionalTestingTask = defineTask('functional-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Functional Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Functional Test Engineer',
      task: 'Execute functional HIL testing',
      context: args,
      instructions: [
        '1. Execute requirements-based tests',
        '2. Test normal operation scenarios',
        '3. Test boundary conditions',
        '4. Execute state machine tests',
        '5. Test timing requirements',
        '6. Execute interface tests',
        '7. Test calibration parameters',
        '8. Execute diagnostic tests',
        '9. Generate test evidence',
        '10. Document test results'
      ],
      outputFormat: 'JSON object with functional testing'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passRate', 'coverage'],
      properties: {
        results: { type: 'object' },
        passRate: { type: 'number' },
        coverage: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'HIL', 'functional', 'testing']
}));

export const faultInjectionTask = defineTask('fault-injection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Fault Injection Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fault Injection Engineer',
      task: 'Execute fault injection testing',
      context: args,
      instructions: [
        '1. Inject sensor faults',
        '2. Inject actuator faults',
        '3. Test communication faults',
        '4. Inject power supply faults',
        '5. Test signal integrity faults',
        '6. Inject memory faults',
        '7. Test timing faults',
        '8. Verify fault detection',
        '9. Verify fault reaction',
        '10. Document fault injection results'
      ],
      outputFormat: 'JSON object with fault injection'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'faultsCovered', 'detectionRate'],
      properties: {
        results: { type: 'object' },
        faultsCovered: { type: 'number' },
        detectionRate: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'HIL', 'fault-injection', 'safety']
}));

export const integrationTestingTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Integration Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Test Engineer',
      task: 'Execute HIL integration testing',
      context: args,
      instructions: [
        '1. Test ECU-to-ECU communication',
        '2. Test network message timing',
        '3. Validate gateway functionality',
        '4. Test diagnostic communication',
        '5. Validate security protocols',
        '6. Test OTA update interface',
        '7. Validate calibration interface',
        '8. Test end-to-end scenarios',
        '9. Validate system timing',
        '10. Document integration results'
      ],
      outputFormat: 'JSON object with integration testing'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passRate', 'issues'],
      properties: {
        results: { type: 'object' },
        passRate: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'HIL', 'integration', 'testing']
}));

export const regressionTestingTask = defineTask('regression-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Regression Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regression Test Engineer',
      task: 'Execute HIL regression testing',
      context: args,
      instructions: [
        '1. Execute baseline test suite',
        '2. Run automated regression',
        '3. Compare results to baseline',
        '4. Identify regressions',
        '5. Test fixed issues',
        '6. Validate software updates',
        '7. Run nightly regression',
        '8. Track regression metrics',
        '9. Maintain test suite',
        '10. Document regression results'
      ],
      outputFormat: 'JSON object with regression testing'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'regressions', 'stability'],
      properties: {
        results: { type: 'object' },
        regressions: { type: 'array', items: { type: 'object' } },
        stability: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'HIL', 'regression', 'testing']
}));

export const hilReportingTask = defineTask('hil-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: HIL Test Reporting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HIL Test Manager',
      task: 'Generate HIL test reports',
      context: args,
      instructions: [
        '1. Consolidate test results',
        '2. Calculate pass/fail metrics',
        '3. Calculate test coverage',
        '4. Document open issues',
        '5. Generate traceability report',
        '6. Create executive summary',
        '7. Generate ASPICE evidence',
        '8. Create trend analysis',
        '9. Document recommendations',
        '10. Generate final report'
      ],
      outputFormat: 'JSON object with HIL reporting'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passRate', 'coverage', 'coverageReport', 'issues'],
      properties: {
        results: { type: 'object' },
        passRate: { type: 'number' },
        coverage: { type: 'number' },
        coverageReport: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'HIL', 'reporting', 'ASPICE']
}));
