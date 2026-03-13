/**
 * @process specializations/robotics-simulation/field-testing-validation
 * @description Field Testing and Validation - Comprehensive field testing of robot systems in real-world
 * environments including test planning, environmental testing, long-duration runs, and certification support.
 * @inputs { robotName: string, testEnvironment?: string, testDuration?: string, outputDir?: string }
 * @outputs { success: boolean, fieldTestResults: object, validationReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/field-testing-validation', {
 *   robotName: 'field_robot',
 *   testEnvironment: 'warehouse',
 *   testDuration: '8-hours'
 * });
 *
 * @references
 * - Field Robotics: https://www.fieldrobotics.org/
 * - Robot Testing Standards: https://www.nist.gov/el/intelligent-systems-division-73500/test-methods-and-metrics
 * - Autonomous Vehicle Testing: https://www.sae.org/standards/content/j3016_202104/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    testEnvironment = 'indoor',
    testDuration = '4-hours',
    outputDir = 'field-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Field Testing for ${robotName}`);

  const testPlanning = await ctx.task(fieldTestPlanningTask, { robotName, testEnvironment, testDuration, outputDir });
  artifacts.push(...testPlanning.artifacts);

  const sitePreparation = await ctx.task(testSitePreparationTask, { robotName, testEnvironment, testPlanning, outputDir });
  artifacts.push(...sitePreparation.artifacts);

  const safetyProtocols = await ctx.task(fieldSafetyProtocolsTask, { robotName, testEnvironment, outputDir });
  artifacts.push(...safetyProtocols.artifacts);

  const environmentalTesting = await ctx.task(environmentalConditionTestingTask, { robotName, testEnvironment, outputDir });
  artifacts.push(...environmentalTesting.artifacts);

  const functionalTesting = await ctx.task(functionalFieldTestingTask, { robotName, testPlanning, outputDir });
  artifacts.push(...functionalTesting.artifacts);

  const longDurationRuns = await ctx.task(longDurationTestingTask, { robotName, testDuration, functionalTesting, outputDir });
  artifacts.push(...longDurationRuns.artifacts);

  const edgeCaseTesting = await ctx.task(edgeCaseFieldTestingTask, { robotName, testEnvironment, outputDir });
  artifacts.push(...edgeCaseTesting.artifacts);

  const dataCollection = await ctx.task(fieldDataCollectionTask, { robotName, longDurationRuns, outputDir });
  artifacts.push(...dataCollection.artifacts);

  const validationReport = await ctx.task(validationReportGenerationTask, { robotName, longDurationRuns, dataCollection, outputDir });
  artifacts.push(...validationReport.artifacts);

  await ctx.breakpoint({
    question: `Field Testing Complete for ${robotName}. Success rate: ${longDurationRuns.successRate}%, Uptime: ${longDurationRuns.uptime}%. Review validation report?`,
    title: 'Field Testing Complete',
    context: { runId: ctx.runId, successRate: longDurationRuns.successRate, uptime: longDurationRuns.uptime }
  });

  return {
    success: longDurationRuns.successRate >= 95 && longDurationRuns.uptime >= 98,
    robotName,
    fieldTestResults: { successRate: longDurationRuns.successRate, uptime: longDurationRuns.uptime, totalRuns: longDurationRuns.totalRuns },
    validationReport: { reportPath: validationReport.reportPath, recommendations: validationReport.recommendations },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/field-testing-validation', timestamp: startTime, outputDir }
  };
}

export const fieldTestPlanningTask = defineTask('field-test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Planning - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Plan field testing campaign', context: args, instructions: ['1. Define test objectives', '2. Create test scenarios', '3. Set success criteria', '4. Plan test schedule', '5. Document test plan'] },
    outputSchema: { type: 'object', required: ['testPlan', 'scenarios', 'artifacts'], properties: { testPlan: { type: 'object' }, scenarios: { type: 'array' }, successCriteria: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'planning']
}));

export const testSitePreparationTask = defineTask('test-site-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Site Preparation - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Prepare test site', context: args, instructions: ['1. Survey test environment', '2. Set up markers/references', '3. Configure ground truth', '4. Prepare safety equipment', '5. Document site setup'] },
    outputSchema: { type: 'object', required: ['siteConfig', 'groundTruth', 'artifacts'], properties: { siteConfig: { type: 'object' }, groundTruth: { type: 'object' }, safetySetup: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'site-prep']
}));

export const fieldSafetyProtocolsTask = defineTask('field-safety-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: `Safety Protocols - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Establish field safety protocols', context: args, instructions: ['1. Define safety zones', '2. Set up emergency stops', '3. Train safety observers', '4. Create incident protocols', '5. Document safety procedures'] },
    outputSchema: { type: 'object', required: ['safetyProtocols', 'emergencyProcedures', 'artifacts'], properties: { safetyProtocols: { type: 'object' }, emergencyProcedures: { type: 'array' }, safetyZones: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'safety']
}));

export const environmentalConditionTestingTask = defineTask('environmental-condition-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Environmental Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test under various conditions', context: args, instructions: ['1. Test in different lighting', '2. Test weather conditions', '3. Test surface types', '4. Test with obstacles', '5. Document conditions'] },
    outputSchema: { type: 'object', required: ['conditionTests', 'results', 'artifacts'], properties: { conditionTests: { type: 'array' }, results: { type: 'object' }, limitations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'environmental']
}));

export const functionalFieldTestingTask = defineTask('functional-field-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Functional Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Execute functional field tests', context: args, instructions: ['1. Run navigation tests', '2. Run manipulation tests', '3. Test task completion', '4. Measure accuracy', '5. Document results'] },
    outputSchema: { type: 'object', required: ['functionalResults', 'accuracy', 'artifacts'], properties: { functionalResults: { type: 'object' }, accuracy: { type: 'object' }, failedTests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'functional']
}));

export const longDurationTestingTask = defineTask('long-duration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Long Duration Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Execute long-duration tests', context: args, instructions: ['1. Run continuous operation', '2. Monitor system health', '3. Track interventions', '4. Measure uptime', '5. Calculate success rate'] },
    outputSchema: { type: 'object', required: ['successRate', 'uptime', 'totalRuns', 'artifacts'], properties: { successRate: { type: 'number' }, uptime: { type: 'number' }, totalRuns: { type: 'number' }, interventions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'long-duration']
}));

export const edgeCaseFieldTestingTask = defineTask('edge-case-field-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Edge Case Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test edge cases in the field', context: args, instructions: ['1. Test boundary conditions', '2. Test failure recovery', '3. Test unusual scenarios', '4. Test human interactions', '5. Document edge cases'] },
    outputSchema: { type: 'object', required: ['edgeCaseResults', 'discoveredIssues', 'artifacts'], properties: { edgeCaseResults: { type: 'array' }, discoveredIssues: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'edge-cases']
}));

export const fieldDataCollectionTask = defineTask('field-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Collection - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Collect and organize field data', context: args, instructions: ['1. Collect sensor logs', '2. Collect system telemetry', '3. Record video/photos', '4. Organize datasets', '5. Prepare for analysis'] },
    outputSchema: { type: 'object', required: ['datasets', 'dataSize', 'artifacts'], properties: { datasets: { type: 'array' }, dataSize: { type: 'string' }, dataQuality: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'data-collection']
}));

export const validationReportGenerationTask = defineTask('validation-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation Report - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Generate validation report', context: args, instructions: ['1. Analyze all test results', '2. Compare to requirements', '3. Identify gaps', '4. Make recommendations', '5. Generate final report'] },
    outputSchema: { type: 'object', required: ['reportPath', 'recommendations', 'artifacts'], properties: { reportPath: { type: 'string' }, recommendations: { type: 'array' }, complianceStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'field-testing', 'validation-report']
}));
