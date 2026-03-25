/**
 * @process specializations/performance-optimization/load-testing-framework-setup
 * @description Load Testing Framework Setup - Set up comprehensive load testing framework including tool selection,
 * test scenario design, threshold configuration, and CI/CD integration.
 * @inputs { projectName: string, testingTool?: string, targetEndpoints: array }
 * @outputs { success: boolean, framework: object, scenarios: array, thresholds: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/load-testing-framework-setup', {
 *   projectName: 'API Platform',
 *   testingTool: 'k6',
 *   targetEndpoints: ['/api/users', '/api/orders', '/api/products']
 * });
 *
 * @references
 * - k6 Documentation: https://k6.io/docs/
 * - Gatling: https://gatling.io/
 * - Locust: https://locust.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    testingTool = 'k6',
    targetEndpoints = [],
    outputDir = 'load-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Load Testing Framework Setup for ${projectName}`);

  // Phase 1: Select Load Testing Tools
  const toolSelection = await ctx.task(selectLoadTestingToolsTask, { projectName, testingTool, outputDir });
  artifacts.push(...toolSelection.artifacts);

  // Phase 2: Design Test Scenarios
  const scenarios = await ctx.task(designTestScenariosTask, { projectName, targetEndpoints, outputDir });
  artifacts.push(...scenarios.artifacts);

  // Phase 3: Create Load Profiles
  const loadProfiles = await ctx.task(createLoadProfilesTask, { projectName, scenarios, outputDir });
  artifacts.push(...loadProfiles.artifacts);

  await ctx.breakpoint({
    question: `Designed ${scenarios.scenarios.length} test scenarios with ${loadProfiles.profiles.length} load profiles. Configure thresholds?`,
    title: 'Load Test Design Review',
    context: { runId: ctx.runId, scenarios, loadProfiles }
  });

  // Phase 4: Configure Performance Thresholds
  const thresholds = await ctx.task(configurePerformanceThresholdsTask, { projectName, scenarios, outputDir });
  artifacts.push(...thresholds.artifacts);

  // Phase 5: Implement Test Scripts
  const scripts = await ctx.task(implementTestScriptsTask, { projectName, testingTool, scenarios, loadProfiles, thresholds, outputDir });
  artifacts.push(...scripts.artifacts);

  // Phase 6: Set Up Test Data Generation
  const testData = await ctx.task(setupTestDataGenerationTask, { projectName, scenarios, outputDir });
  artifacts.push(...testData.artifacts);

  // Phase 7: Integrate with CI/CD
  const cicdIntegration = await ctx.task(integrateWithCICDTask, { projectName, testingTool, scripts, outputDir });
  artifacts.push(...cicdIntegration.artifacts);

  // Phase 8: Document Framework
  const documentation = await ctx.task(documentLoadTestingFrameworkTask, { projectName, scenarios, loadProfiles, thresholds, scripts, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Load testing framework setup complete. ${scripts.scripts.length} test scripts created. CI/CD integrated: ${cicdIntegration.integrated}. Accept?`,
    title: 'Load Testing Framework Review',
    context: { runId: ctx.runId, scripts, cicdIntegration }
  });

  return {
    success: true,
    projectName,
    framework: { tool: testingTool, cicdIntegrated: cicdIntegration.integrated },
    scenarios: scenarios.scenarios,
    loadProfiles: loadProfiles.profiles,
    thresholds: thresholds.thresholds,
    scripts: scripts.scripts,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/load-testing-framework-setup', timestamp: startTime, outputDir }
  };
}

export const selectLoadTestingToolsTask = defineTask('select-load-testing-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Load Testing Tools - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Select load testing tools', context: args,
      instructions: ['1. Evaluate k6, Gatling, Locust', '2. Consider team skills', '3. Evaluate features', '4. Select primary tool', '5. Document selection'],
      outputFormat: 'JSON with tool selection' },
    outputSchema: { type: 'object', required: ['selectedTool', 'artifacts'], properties: { selectedTool: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-testing', 'tools']
}));

export const designTestScenariosTask = defineTask('design-test-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Test Scenarios - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Design load test scenarios', context: args,
      instructions: ['1. Define user journeys', '2. Create scenario flows', '3. Define think times', '4. Add data variation', '5. Document scenarios'],
      outputFormat: 'JSON with test scenarios' },
    outputSchema: { type: 'object', required: ['scenarios', 'artifacts'], properties: { scenarios: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-testing', 'scenarios']
}));

export const createLoadProfilesTask = defineTask('create-load-profiles', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Load Profiles - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Create load profiles', context: args,
      instructions: ['1. Define ramp-up patterns', '2. Create steady state', '3. Add spike tests', '4. Create stress tests', '5. Document profiles'],
      outputFormat: 'JSON with load profiles' },
    outputSchema: { type: 'object', required: ['profiles', 'artifacts'], properties: { profiles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-testing', 'profiles']
}));

export const configurePerformanceThresholdsTask = defineTask('configure-performance-thresholds', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Performance Thresholds - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Configure performance thresholds', context: args,
      instructions: ['1. Set response time thresholds', '2. Set error rate thresholds', '3. Set throughput requirements', '4. Configure pass/fail criteria', '5. Document thresholds'],
      outputFormat: 'JSON with thresholds' },
    outputSchema: { type: 'object', required: ['thresholds', 'artifacts'], properties: { thresholds: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-testing', 'thresholds']
}));

export const implementTestScriptsTask = defineTask('implement-test-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Test Scripts - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Implement load test scripts', context: args,
      instructions: ['1. Write test scripts', '2. Add scenario logic', '3. Include thresholds', '4. Add reporting', '5. Document scripts'],
      outputFormat: 'JSON with test scripts' },
    outputSchema: { type: 'object', required: ['scripts', 'artifacts'], properties: { scripts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-testing', 'scripts']
}));

export const setupTestDataGenerationTask = defineTask('setup-test-data-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Test Data Generation - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Setup test data generation', context: args,
      instructions: ['1. Identify data needs', '2. Create data generators', '3. Add data files', '4. Configure parameterization', '5. Document setup'],
      outputFormat: 'JSON with test data setup' },
    outputSchema: { type: 'object', required: ['dataSetup', 'artifacts'], properties: { dataSetup: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-testing', 'data']
}));

export const integrateWithCICDTask = defineTask('integrate-with-cicd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate with CI/CD - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Integrate load tests with CI/CD', context: args,
      instructions: ['1. Create pipeline stage', '2. Configure test execution', '3. Add result reporting', '4. Configure gates', '5. Document integration'],
      outputFormat: 'JSON with CI/CD integration' },
    outputSchema: { type: 'object', required: ['integrated', 'artifacts'], properties: { integrated: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-testing', 'cicd']
}));

export const documentLoadTestingFrameworkTask = defineTask('document-load-testing-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Framework - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Document load testing framework', context: args,
      instructions: ['1. Document architecture', '2. Document scenarios', '3. Add usage guide', '4. Include examples', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-testing', 'documentation']
}));
