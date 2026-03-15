/**
 * @process specializations/cli-mcp-development/cli-unit-integration-testing
 * @description CLI Unit and Integration Testing - Implement comprehensive testing strategy for CLI applications
 * including argument parsing tests, command execution tests, and snapshot testing.
 * @inputs { projectName: string, language: string, testFramework?: string, testTypes?: array }
 * @outputs { success: boolean, testConfig: object, testSuites: array, coverageConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/cli-unit-integration-testing', {
 *   projectName: 'data-cli',
 *   language: 'typescript',
 *   testFramework: 'jest',
 *   testTypes: ['unit', 'integration', 'e2e', 'snapshot']
 * });
 *
 * @references
 * - Click Testing: https://click.palletsprojects.com/en/8.1.x/testing/
 * - oclif/test: https://github.com/oclif/test
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    testFramework = 'jest',
    testTypes = ['unit', 'integration', 'e2e', 'snapshot'],
    outputDir = 'cli-unit-integration-testing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CLI Unit and Integration Testing: ${projectName}`);
  ctx.log('info', `Test Framework: ${testFramework}`);

  // Phase implementations follow the same pattern as other processes
  const frameworkSetup = await ctx.task(testFrameworkSetupTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...frameworkSetup.artifacts);

  const argumentParsingTests = await ctx.task(argumentParsingTestsTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...argumentParsingTests.artifacts);

  const commandExecutionTests = await ctx.task(commandExecutionTestsTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...commandExecutionTests.artifacts);

  const inputOutputMocking = await ctx.task(inputOutputMockingTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...inputOutputMocking.artifacts);

  const fixtureManagement = await ctx.task(fixtureManagementTask, { projectName, language, outputDir });
  artifacts.push(...fixtureManagement.artifacts);

  const snapshotTesting = await ctx.task(snapshotTestingTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...snapshotTesting.artifacts);

  const crossPlatformTests = await ctx.task(crossPlatformTestsTask, { projectName, language, outputDir });
  artifacts.push(...crossPlatformTests.artifacts);

  const performanceBenchmarks = await ctx.task(performanceBenchmarksTask, { projectName, language, outputDir });
  artifacts.push(...performanceBenchmarks.artifacts);

  const e2eTests = await ctx.task(e2eTestsTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...e2eTests.artifacts);

  const ciPipeline = await ctx.task(ciPipelineTask, { projectName, testFramework, outputDir });
  artifacts.push(...ciPipeline.artifacts);

  const documentation = await ctx.task(testDocumentationTask, { projectName, testFramework, testTypes, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `CLI Testing setup complete with ${testTypes.length} test types. Review and approve?`,
    title: 'CLI Testing Complete',
    context: { runId: ctx.runId, summary: { projectName, testFramework, testTypes } }
  });

  return {
    success: true,
    projectName,
    testConfig: { framework: testFramework, configPath: frameworkSetup.configPath },
    testSuites: testTypes,
    coverageConfig: frameworkSetup.coverageConfig,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/cli-unit-integration-testing', timestamp: startTime }
  };
}

export const testFrameworkSetupTask = defineTask('test-framework-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Framework Setup - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: {
      role: 'CLI Testing Specialist',
      task: 'Set up test framework',
      context: args,
      instructions: ['1. Install test framework', '2. Configure test runner', '3. Set up coverage collection', '4. Configure test patterns', '5. Generate test configuration'],
      outputFormat: 'JSON with test framework setup'
    },
    outputSchema: { type: 'object', required: ['configPath', 'coverageConfig', 'artifacts'], properties: { configPath: { type: 'string' }, coverageConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'setup']
}));

export const argumentParsingTestsTask = defineTask('argument-parsing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Argument Parsing Tests - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'CLI Argument Testing Specialist', task: 'Create argument parsing tests', context: args, instructions: ['1. Test required arguments', '2. Test optional flags', '3. Test default values', '4. Test validation errors', '5. Generate argument tests'], outputFormat: 'JSON with argument tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, testCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'arguments']
}));

export const commandExecutionTestsTask = defineTask('command-execution-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Command Execution Tests - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'CLI Command Testing Specialist', task: 'Implement command execution tests', context: args, instructions: ['1. Test command success paths', '2. Test command error paths', '3. Test command output', '4. Test exit codes', '5. Generate execution tests'], outputFormat: 'JSON with execution tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, testCases: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'execution']
}));

export const inputOutputMockingTask = defineTask('io-mocking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Input/Output Mocking - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'CLI I/O Mocking Specialist', task: 'Add input/output mocking', context: args, instructions: ['1. Create stdin mock', '2. Create stdout/stderr capture', '3. Mock filesystem operations', '4. Mock network requests', '5. Generate mocking utilities'], outputFormat: 'JSON with I/O mocking' },
    outputSchema: { type: 'object', required: ['mockUtilsPath', 'artifacts'], properties: { mockUtilsPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'mocking']
}));

export const fixtureManagementTask = defineTask('fixture-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fixture Management - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Test Fixture Specialist', task: 'Create fixture management', context: args, instructions: ['1. Create test fixtures directory', '2. Add sample input files', '3. Create expected output fixtures', '4. Add fixture loading utilities', '5. Generate fixture management'], outputFormat: 'JSON with fixture management' },
    outputSchema: { type: 'object', required: ['fixturesPath', 'artifacts'], properties: { fixturesPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'fixtures']
}));

export const snapshotTestingTask = defineTask('snapshot-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Snapshot Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Snapshot Testing Specialist', task: 'Implement snapshot testing for output', context: args, instructions: ['1. Configure snapshot testing', '2. Create help output snapshots', '3. Create command output snapshots', '4. Add snapshot update workflow', '5. Generate snapshot tests'], outputFormat: 'JSON with snapshot testing' },
    outputSchema: { type: 'object', required: ['snapshotConfig', 'artifacts'], properties: { snapshotConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'snapshots']
}));

export const crossPlatformTestsTask = defineTask('cross-platform-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cross-Platform Tests - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Cross-Platform Testing Specialist', task: 'Add cross-platform tests', context: args, instructions: ['1. Test on Windows', '2. Test on macOS', '3. Test on Linux', '4. Test path handling', '5. Generate cross-platform tests'], outputFormat: 'JSON with cross-platform tests' },
    outputSchema: { type: 'object', required: ['platformTests', 'artifacts'], properties: { platformTests: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'cross-platform']
}));

export const performanceBenchmarksTask = defineTask('performance-benchmarks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Benchmarks - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'CLI Performance Testing Specialist', task: 'Create performance benchmarks', context: args, instructions: ['1. Benchmark startup time', '2. Benchmark command execution', '3. Benchmark memory usage', '4. Set performance thresholds', '5. Generate benchmark suite'], outputFormat: 'JSON with performance benchmarks' },
    outputSchema: { type: 'object', required: ['benchmarkPath', 'artifacts'], properties: { benchmarkPath: { type: 'string' }, thresholds: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'performance']
}));

export const e2eTestsTask = defineTask('e2e-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `E2E Tests - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'CLI E2E Testing Specialist', task: 'Implement E2E tests with real execution', context: args, instructions: ['1. Create E2E test scenarios', '2. Test full command workflows', '3. Test file I/O operations', '4. Test network operations', '5. Generate E2E test suite'], outputFormat: 'JSON with E2E tests' },
    outputSchema: { type: 'object', required: ['e2eTestPath', 'artifacts'], properties: { e2eTestPath: { type: 'string' }, scenarios: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'e2e']
}));

export const ciPipelineTask = defineTask('ci-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `CI Pipeline - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'CI/CD Specialist', task: 'Set up CI test pipeline', context: args, instructions: ['1. Create CI workflow file', '2. Configure test matrix', '3. Add coverage reporting', '4. Configure artifact uploads', '5. Generate CI configuration'], outputFormat: 'JSON with CI pipeline' },
    outputSchema: { type: 'object', required: ['ciConfigPath', 'artifacts'], properties: { ciConfigPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'ci']
}));

export const testDocumentationTask = defineTask('test-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Testing Documentation Specialist', task: 'Document testing patterns', context: args, instructions: ['1. Document test organization', '2. Document mocking patterns', '3. Document fixture usage', '4. Add testing best practices', '5. Generate documentation'], outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['testDocPath', 'artifacts'], properties: { testDocPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'testing', 'documentation']
}));
