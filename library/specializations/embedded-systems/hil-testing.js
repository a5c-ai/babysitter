/**
 * @process specializations/embedded-systems/hil-testing
 * @description Hardware-in-the-Loop (HIL) Testing - Automated testing methodology that simulates real-world conditions
 * by interfacing embedded systems with test equipment to validate hardware-software integration, timing behavior, and
 * system responses.
 * @inputs { projectName: string, targetSystem: string, hilPlatform?: string, testScenarios?: array, outputDir?: string }
 * @outputs { success: boolean, testResults: object, coverage: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/hil-testing', {
 *   projectName: 'MotorControllerHIL',
 *   targetSystem: 'MotorController-v2',
 *   hilPlatform: 'NI-PXI',
 *   testScenarios: ['startup', 'normal-operation', 'fault-injection', 'boundary']
 * });
 *
 * @references
 * - Hardware-in-the-Loop Testing: https://www.ni.com/en-us/innovations/white-papers/06/hardware-in-the-loop.html
 * - HIL Best Practices: https://www.embedded.com/hardware-in-the-loop-testing-best-practices/
 * - Automotive HIL Testing: https://www.dspace.com/en/pub/home/applicationfields/stories/hil.cfm
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetSystem,
    hilPlatform = 'custom', // 'NI-PXI', 'dSPACE', 'custom'
    testScenarios = ['startup', 'normal-operation', 'fault-injection'],
    realTimeRequirements = true,
    faultInjection = true,
    automatedRegression = true,
    outputDir = 'hil-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HIL Testing: ${projectName}`);
  ctx.log('info', `Target: ${targetSystem}, Platform: ${hilPlatform}`);

  // ============================================================================
  // PHASE 1: HIL TEST ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up HIL Test Environment');

  const envSetup = await ctx.task(hilEnvironmentSetupTask, {
    projectName,
    targetSystem,
    hilPlatform,
    realTimeRequirements,
    outputDir
  });

  artifacts.push(...envSetup.artifacts);

  // ============================================================================
  // PHASE 2: PLANT MODEL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing Plant/Environment Models');

  const plantModel = await ctx.task(plantModelDevelopmentTask, {
    projectName,
    targetSystem,
    hilPlatform,
    outputDir
  });

  artifacts.push(...plantModel.artifacts);

  // ============================================================================
  // PHASE 3: I/O CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring I/O Interfaces');

  const ioConfig = await ctx.task(hilIoConfigurationTask, {
    projectName,
    targetSystem,
    hilPlatform,
    envSetup,
    outputDir
  });

  artifacts.push(...ioConfig.artifacts);

  // ============================================================================
  // PHASE 4: TEST SCENARIO DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing Test Scenarios');

  const scenarioDevelopment = await ctx.task(testScenarioDevelopmentTask, {
    projectName,
    testScenarios,
    plantModel,
    faultInjection,
    outputDir
  });

  artifacts.push(...scenarioDevelopment.artifacts);

  await ctx.breakpoint({
    question: `HIL test scenarios developed: ${scenarioDevelopment.scenarioCount} scenarios. Review before execution?`,
    title: 'Test Scenario Review',
    context: {
      runId: ctx.runId,
      scenarios: scenarioDevelopment.scenarios,
      files: scenarioDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Executing HIL Tests');

  const testExecution = await ctx.task(hilTestExecutionTask, {
    projectName,
    targetSystem,
    scenarioDevelopment,
    ioConfig,
    outputDir
  });

  artifacts.push(...testExecution.artifacts);

  // ============================================================================
  // PHASE 6: FAULT INJECTION TESTING
  // ============================================================================

  let faultTests = null;
  if (faultInjection) {
    ctx.log('info', 'Phase 6: Running Fault Injection Tests');

    faultTests = await ctx.task(faultInjectionTestingTask, {
      projectName,
      targetSystem,
      plantModel,
      ioConfig,
      outputDir
    });

    artifacts.push(...faultTests.artifacts);
  }

  // ============================================================================
  // PHASE 7: TIMING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing Timing Behavior');

  const timingAnalysis = await ctx.task(hilTimingAnalysisTask, {
    projectName,
    targetSystem,
    testExecution,
    realTimeRequirements,
    outputDir
  });

  artifacts.push(...timingAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: RESULTS ANALYSIS AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing Results and Generating Report');

  const resultsAnalysis = await ctx.task(hilResultsAnalysisTask, {
    projectName,
    testExecution,
    faultTests,
    timingAnalysis,
    outputDir
  });

  artifacts.push(...resultsAnalysis.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `HIL Testing Complete for ${projectName}. Pass rate: ${resultsAnalysis.passRate}%. Review results?`,
    title: 'HIL Testing Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalTests: resultsAnalysis.totalTests,
        passed: resultsAnalysis.passed,
        failed: resultsAnalysis.failed,
        passRate: resultsAnalysis.passRate
      },
      files: [
        { path: resultsAnalysis.reportPath, format: 'markdown', label: 'Test Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: resultsAnalysis.passRate >= 95,
    projectName,
    targetSystem,
    testResults: {
      totalTests: resultsAnalysis.totalTests,
      passed: resultsAnalysis.passed,
      failed: resultsAnalysis.failed,
      passRate: resultsAnalysis.passRate
    },
    coverage: {
      scenarioCoverage: scenarioDevelopment.scenarioCount,
      faultCoverage: faultTests?.faultsCovered || 0
    },
    timing: timingAnalysis.timingResults,
    reportPath: resultsAnalysis.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/hil-testing',
      timestamp: startTime,
      projectName,
      hilPlatform,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const hilEnvironmentSetupTask = defineTask('hil-environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: HIL Environment Setup - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'HIL Test Engineer',
      task: 'Set up HIL test environment',
      context: args,
      instructions: [
        '1. Configure HIL hardware platform',
        '2. Set up real-time operating system',
        '3. Configure signal conditioning',
        '4. Set up data acquisition',
        '5. Configure communication interfaces',
        '6. Set up target connection',
        '7. Configure timing and synchronization',
        '8. Set up logging infrastructure',
        '9. Configure safety interlocks',
        '10. Document environment setup'
      ],
      outputFormat: 'JSON with environment setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'interfaces', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        interfaces: { type: 'array', items: { type: 'object' } },
        timingConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hil', 'environment']
}));

export const plantModelDevelopmentTask = defineTask('plant-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Plant Model Development - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Systems Engineer',
      task: 'Develop plant/environment simulation models',
      context: args,
      instructions: [
        '1. Analyze system dynamics',
        '2. Create mathematical models',
        '3. Implement real-time models',
        '4. Add sensor models',
        '5. Create actuator models',
        '6. Model environmental conditions',
        '7. Add fault injection points',
        '8. Validate model accuracy',
        '9. Optimize for real-time execution',
        '10. Document model parameters'
      ],
      outputFormat: 'JSON with plant model details'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'parameters', 'artifacts'],
      properties: {
        models: { type: 'array', items: { type: 'object' } },
        parameters: { type: 'object' },
        sampleTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hil', 'plant-model']
}));

export const hilIoConfigurationTask = defineTask('hil-io-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: I/O Configuration - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'HIL Test Engineer',
      task: 'Configure I/O interfaces',
      context: args,
      instructions: [
        '1. Map analog inputs/outputs',
        '2. Configure digital I/O',
        '3. Set up communication buses (CAN, SPI, etc.)',
        '4. Configure signal scaling',
        '5. Set up load simulation',
        '6. Configure power supplies',
        '7. Add signal monitoring',
        '8. Set up fault injection I/O',
        '9. Validate I/O connections',
        '10. Document I/O mapping'
      ],
      outputFormat: 'JSON with I/O configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['ioMapping', 'channels', 'artifacts'],
      properties: {
        ioMapping: { type: 'object' },
        channels: { type: 'array', items: { type: 'object' } },
        communicationBuses: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hil', 'io-config']
}));

export const testScenarioDevelopmentTask = defineTask('test-scenario-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Test Scenarios - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'HIL Test Engineer',
      task: 'Develop test scenarios',
      context: args,
      instructions: [
        '1. Define test scenarios from requirements',
        '2. Create startup/initialization tests',
        '3. Create normal operation tests',
        '4. Create boundary condition tests',
        '5. Create fault injection scenarios',
        '6. Create stress test scenarios',
        '7. Define pass/fail criteria',
        '8. Create test sequences',
        '9. Set up automated execution',
        '10. Document test procedures'
      ],
      outputFormat: 'JSON with test scenario details'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'scenarioCount', 'artifacts'],
      properties: {
        scenarios: { type: 'array', items: { type: 'object' } },
        scenarioCount: { type: 'number' },
        passCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hil', 'scenarios']
}));

export const hilTestExecutionTask = defineTask('hil-test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Test Execution - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'HIL Test Engineer',
      task: 'Execute HIL tests',
      context: args,
      instructions: [
        '1. Initialize test environment',
        '2. Load test scenarios',
        '3. Execute test sequences',
        '4. Monitor real-time execution',
        '5. Collect measurement data',
        '6. Log all test events',
        '7. Handle test failures',
        '8. Execute regression tests',
        '9. Collect coverage data',
        '10. Generate execution report'
      ],
      outputFormat: 'JSON with test execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'executionTime', 'artifacts'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        executionTime: { type: 'string' },
        dataFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hil', 'execution']
}));

export const faultInjectionTestingTask = defineTask('fault-injection-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Fault Injection - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'HIL Test Engineer',
      task: 'Execute fault injection tests',
      context: args,
      instructions: [
        '1. Define fault categories',
        '2. Inject sensor faults',
        '3. Inject actuator faults',
        '4. Inject communication faults',
        '5. Inject power supply faults',
        '6. Test fault detection',
        '7. Test fault recovery',
        '8. Verify safe states',
        '9. Measure fault response time',
        '10. Document fault test results'
      ],
      outputFormat: 'JSON with fault injection results'
    },
    outputSchema: {
      type: 'object',
      required: ['faultsCovered', 'results', 'artifacts'],
      properties: {
        faultsCovered: { type: 'number' },
        results: { type: 'array', items: { type: 'object' } },
        detectionCoverage: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hil', 'fault-injection']
}));

export const hilTimingAnalysisTask = defineTask('hil-timing-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Timing Analysis - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'HIL Test Engineer',
      task: 'Analyze timing behavior',
      context: args,
      instructions: [
        '1. Measure response times',
        '2. Analyze loop execution times',
        '3. Check deadline compliance',
        '4. Measure jitter',
        '5. Analyze worst-case timing',
        '6. Check synchronization',
        '7. Measure interrupt latency',
        '8. Verify timing requirements',
        '9. Generate timing histograms',
        '10. Document timing results'
      ],
      outputFormat: 'JSON with timing analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['timingResults', 'deadlineCompliance', 'artifacts'],
      properties: {
        timingResults: { type: 'object' },
        deadlineCompliance: { type: 'boolean' },
        jitterAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hil', 'timing']
}));

export const hilResultsAnalysisTask = defineTask('hil-results-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Results Analysis - ${args.projectName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'HIL Test Engineer',
      task: 'Analyze test results and generate report',
      context: args,
      instructions: [
        '1. Aggregate all test results',
        '2. Calculate pass/fail rates',
        '3. Analyze failed tests',
        '4. Generate coverage metrics',
        '5. Create trend analysis',
        '6. Identify root causes',
        '7. Generate recommendations',
        '8. Create visual reports',
        '9. Generate executive summary',
        '10. Archive test data'
      ],
      outputFormat: 'JSON with analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passed', 'failed', 'passRate', 'reportPath', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        passRate: { type: 'number' },
        reportPath: { type: 'string' },
        failedTests: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'hil', 'analysis']
}));
