/**
 * @process specializations/desktop-development/desktop-unit-testing
 * @description Desktop Unit Testing Setup - Configure unit testing for desktop applications using appropriate
 * frameworks (Jest, Mocha, xUnit); set up mocking for native APIs and IPC communication.
 * @inputs { projectName: string, framework: string, testingFramework: string, coverageTarget?: number, outputDir?: string }
 * @outputs { success: boolean, testConfig: object, mocks: array, coverageConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/desktop-unit-testing', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   testingFramework: 'Jest',
 *   coverageTarget: 80
 * });
 *
 * @references
 * - Jest: https://jestjs.io/docs/getting-started
 * - Electron testing: https://www.electronjs.org/docs/latest/tutorial/testing-overview
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    testingFramework = 'Jest',
    coverageTarget = 80,
    outputDir = 'desktop-unit-testing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Desktop Unit Testing Setup: ${projectName}`);

  const requirements = await ctx.task(testingRequirementsTask, { projectName, framework, testingFramework, coverageTarget, outputDir });
  artifacts.push(...requirements.artifacts);

  const frameworkSetup = await ctx.task(setupTestFrameworkTask, { projectName, framework, testingFramework, outputDir });
  artifacts.push(...frameworkSetup.artifacts);

  const mocks = await ctx.task(createNativeApiMocksTask, { projectName, framework, testingFramework, outputDir });
  artifacts.push(...mocks.artifacts);

  const ipcMocks = await ctx.task(createIpcMocksTask, { projectName, framework, testingFramework, outputDir });
  artifacts.push(...ipcMocks.artifacts);

  const coverageConfig = await ctx.task(configureCoverageTask, { projectName, testingFramework, coverageTarget, outputDir });
  artifacts.push(...coverageConfig.artifacts);

  await ctx.breakpoint({
    question: `Unit testing configured with ${testingFramework}. Coverage target: ${coverageTarget}%. ${mocks.mockCount} mocks created. Review?`,
    title: 'Unit Testing Setup Review',
    context: { runId: ctx.runId, testingFramework, coverageTarget, mockCount: mocks.mockCount }
  });

  const testHelpers = await ctx.task(createTestHelpersTask, { projectName, framework, testingFramework, outputDir });
  artifacts.push(...testHelpers.artifacts);

  const sampleTests = await ctx.task(createSampleTestsTask, { projectName, framework, testingFramework, outputDir });
  artifacts.push(...sampleTests.artifacts);

  const validation = await ctx.task(validateTestSetupTask, { projectName, testingFramework, frameworkSetup, mocks, coverageConfig, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    testConfig: { framework: testingFramework, configPath: frameworkSetup.configPath },
    mocks: [...mocks.mocks, ...ipcMocks.mocks],
    coverageConfig: { target: coverageTarget, configPath: coverageConfig.configPath },
    helpers: testHelpers.helpers,
    sampleTests: sampleTests.tests,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/desktop-unit-testing', timestamp: startTime }
  };
}

export const testingRequirementsTask = defineTask('testing-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Testing Requirements - ${args.projectName}`,
  agent: {
    name: 'test-analyst',
    prompt: { role: 'Testing Requirements Analyst', task: 'Analyze unit testing requirements', context: args, instructions: ['1. Analyze testing needs', '2. Identify testable components', '3. Plan mock requirements', '4. Define coverage targets', '5. Plan test organization', '6. Identify testing challenges', '7. Plan CI integration', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'testing', 'requirements']
}));

export const setupTestFrameworkTask = defineTask('setup-test-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Framework Setup - ${args.projectName}`,
  skill: {
    name: 'jest-electron-setup',
  },
  agent: {
    name: 'desktop-test-engineer',
    prompt: { role: 'Test Framework Developer', task: 'Set up testing framework', context: args, instructions: ['1. Install testing dependencies', '2. Create configuration file', '3. Configure test environment', '4. Set up test scripts', '5. Configure module resolution', '6. Set up TypeScript support', '7. Configure watch mode', '8. Generate framework configuration'] },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, scripts: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'testing', 'framework']
}));

export const createNativeApiMocksTask = defineTask('create-native-api-mocks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Native API Mocks - ${args.projectName}`,
  skill: {
    name: 'electron-mock-generator',
  },
  agent: {
    name: 'desktop-test-engineer',
    prompt: { role: 'Mock Developer', task: 'Create mocks for native APIs', context: args, instructions: ['1. Mock Electron APIs', '2. Mock dialog module', '3. Mock clipboard', '4. Mock shell module', '5. Mock app module', '6. Mock BrowserWindow', '7. Create mock factory', '8. Generate mock modules'] },
    outputSchema: { type: 'object', required: ['mocks', 'mockCount', 'artifacts'], properties: { mocks: { type: 'array' }, mockCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'testing', 'mocks']
}));

export const createIpcMocksTask = defineTask('create-ipc-mocks', (args, taskCtx) => ({
  kind: 'agent',
  title: `IPC Mocks - ${args.projectName}`,
  skill: {
    name: 'ipc-mock-factory',
  },
  agent: {
    name: 'desktop-test-engineer',
    prompt: { role: 'IPC Mock Developer', task: 'Create mocks for IPC communication', context: args, instructions: ['1. Mock ipcMain', '2. Mock ipcRenderer', '3. Create IPC test utilities', '4. Mock contextBridge', '5. Create channel matchers', '6. Mock invoke/handle', '7. Create event simulators', '8. Generate IPC mocks'] },
    outputSchema: { type: 'object', required: ['mocks', 'artifacts'], properties: { mocks: { type: 'array' }, utilities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'testing', 'ipc-mocks']
}));

export const configureCoverageTask = defineTask('configure-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Coverage Configuration - ${args.projectName}`,
  agent: {
    name: 'coverage-developer',
    prompt: { role: 'Coverage Developer', task: 'Configure test coverage', context: args, instructions: ['1. Configure coverage collection', '2. Set coverage thresholds', '3. Configure reporters', '4. Set up coverage paths', '5. Exclude test files', '6. Configure branch coverage', '7. Set up CI reporting', '8. Generate coverage configuration'] },
    outputSchema: { type: 'object', required: ['configPath', 'thresholds', 'artifacts'], properties: { configPath: { type: 'string' }, thresholds: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'testing', 'coverage']
}));

export const createTestHelpersTask = defineTask('create-test-helpers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Helpers - ${args.projectName}`,
  agent: {
    name: 'helper-developer',
    prompt: { role: 'Test Helper Developer', task: 'Create test helper utilities', context: args, instructions: ['1. Create render helpers', '2. Create async utilities', '3. Create wait utilities', '4. Create event helpers', '5. Create fixture loaders', '6. Create cleanup utilities', '7. Create assertion helpers', '8. Generate helper modules'] },
    outputSchema: { type: 'object', required: ['helpers', 'artifacts'], properties: { helpers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'testing', 'helpers']
}));

export const createSampleTestsTask = defineTask('create-sample-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sample Tests - ${args.projectName}`,
  agent: {
    name: 'sample-test-developer',
    prompt: { role: 'Sample Test Developer', task: 'Create sample unit tests', context: args, instructions: ['1. Create component tests', '2. Create service tests', '3. Create utility tests', '4. Create IPC tests', '5. Create integration tests', '6. Add test documentation', '7. Create test patterns', '8. Generate sample test files'] },
    outputSchema: { type: 'object', required: ['tests', 'artifacts'], properties: { tests: { type: 'array' }, patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'testing', 'samples']
}));

export const validateTestSetupTask = defineTask('validate-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Test Setup - ${args.projectName}`,
  agent: {
    name: 'test-validator',
    prompt: { role: 'Test Setup Validator', task: 'Validate testing setup', context: args, instructions: ['1. Run sample tests', '2. Verify mocks work', '3. Check coverage collection', '4. Verify CI integration', '5. Test watch mode', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, testsRun: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'testing', 'validation']
}));
