/**
 * @process specializations/desktop-development/cross-platform-testing
 * @description Cross-Platform Testing Process - Establish testing strategy across Windows, macOS, and Linux;
 * set up CI matrix builds and platform-specific test suites.
 * @inputs { projectName: string, framework: string, targetPlatforms: array, ciPlatform: string, outputDir?: string }
 * @outputs { success: boolean, testMatrix: object, platformTests: array, ciConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/cross-platform-testing', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   targetPlatforms: ['windows', 'macos', 'linux'],
 *   ciPlatform: 'GitHub Actions'
 * });
 *
 * @references
 * - GitHub Actions matrix: https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs
 * - Cross-platform testing: https://www.electronjs.org/docs/latest/tutorial/testing-overview
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    targetPlatforms = ['windows', 'macos', 'linux'],
    ciPlatform = 'GitHub Actions',
    outputDir = 'cross-platform-testing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cross-Platform Testing Setup: ${projectName}`);

  const requirements = await ctx.task(crossPlatformRequirementsTask, { projectName, framework, targetPlatforms, ciPlatform, outputDir });
  artifacts.push(...requirements.artifacts);

  const testMatrix = await ctx.task(configureTestMatrixTask, { projectName, framework, targetPlatforms, ciPlatform, outputDir });
  artifacts.push(...testMatrix.artifacts);

  const platformTasks = targetPlatforms.map(platform =>
    () => ctx.task(createPlatformTestSuiteTask, { projectName, framework, platform, outputDir })
  );
  const platformTests = await ctx.parallel.all(platformTasks);
  artifacts.push(...platformTests.flatMap(t => t.artifacts));

  await ctx.breakpoint({
    question: `Cross-platform test matrix configured. Platforms: ${targetPlatforms.join(', ')}. CI: ${ciPlatform}. Review?`,
    title: 'Cross-Platform Testing Review',
    context: { runId: ctx.runId, targetPlatforms, ciPlatform }
  });

  const ciConfig = await ctx.task(configureCiMatrixTask, { projectName, framework, targetPlatforms, ciPlatform, testMatrix, outputDir });
  artifacts.push(...ciConfig.artifacts);

  const parallelization = await ctx.task(configureParallelExecutionTask, { projectName, targetPlatforms, ciPlatform, outputDir });
  artifacts.push(...parallelization.artifacts);

  const reporting = await ctx.task(configureTestReportingTask, { projectName, targetPlatforms, ciPlatform, outputDir });
  artifacts.push(...reporting.artifacts);

  const validation = await ctx.task(validateCrossPlatformTestingTask, { projectName, framework, targetPlatforms, testMatrix, platformTests, ciConfig, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    testMatrix: { platforms: targetPlatforms, configurations: testMatrix.configurations },
    platformTests: platformTests.map(t => ({ platform: t.platform, tests: t.testCount })),
    ciConfig: { platform: ciPlatform, workflowPath: ciConfig.workflowPath },
    parallelization: parallelization.config,
    reporting: reporting.config,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/cross-platform-testing', timestamp: startTime }
  };
}

export const crossPlatformRequirementsTask = defineTask('cross-platform-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cross-Platform Requirements - ${args.projectName}`,
  agent: {
    name: 'platform-test-analyst',
    prompt: { role: 'Cross-Platform Testing Analyst', task: 'Analyze cross-platform testing requirements', context: args, instructions: ['1. Analyze platform-specific tests', '2. Identify shared tests', '3. Plan test matrix', '4. Document platform dependencies', '5. Plan CI resources', '6. Identify flaky test handling', '7. Plan reporting', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'cross-platform', 'requirements']
}));

export const configureTestMatrixTask = defineTask('configure-test-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Matrix Configuration - ${args.projectName}`,
  skill: {
    name: 'ci-matrix-generator',
  },
  agent: {
    name: 'cross-platform-test-orchestrator',
    prompt: { role: 'Test Matrix Developer', task: 'Configure test matrix', context: args, instructions: ['1. Define OS versions', '2. Define architectures', '3. Define Node versions', '4. Configure include/exclude', '5. Set up fail-fast', '6. Configure retry logic', '7. Optimize for speed', '8. Generate matrix configuration'] },
    outputSchema: { type: 'object', required: ['configurations', 'artifacts'], properties: { configurations: { type: 'array' }, totalJobs: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'cross-platform', 'matrix']
}));

export const createPlatformTestSuiteTask = defineTask('create-platform-test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `${args.platform} Test Suite - ${args.projectName}`,
  agent: {
    name: 'platform-test-developer',
    prompt: { role: 'Platform Test Developer', task: `Create ${args.platform}-specific test suite`, context: args, instructions: [`1. Create ${args.platform} test directory`, '2. Add platform-specific tests', '3. Test native features', '4. Test file paths', '5. Test shortcuts/hotkeys', '6. Test notifications', '7. Add smoke tests', '8. Generate test suite'] },
    outputSchema: { type: 'object', required: ['platform', 'testCount', 'artifacts'], properties: { platform: { type: 'string' }, testCount: { type: 'number' }, tests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'cross-platform', args.platform]
}));

export const configureCiMatrixTask = defineTask('configure-ci-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `CI Matrix Configuration - ${args.projectName}`,
  skill: {
    name: 'github-actions-workflow-generator',
  },
  agent: {
    name: 'desktop-ci-architect',
    prompt: { role: 'CI Matrix Developer', task: 'Configure CI matrix builds', context: args, instructions: ['1. Create workflow file', '2. Configure matrix strategy', '3. Set up platform-specific steps', '4. Configure caching', '5. Set up artifacts', '6. Configure test sharding', '7. Set up notifications', '8. Generate CI configuration'] },
    outputSchema: { type: 'object', required: ['workflowPath', 'artifacts'], properties: { workflowPath: { type: 'string' }, jobs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'cross-platform', 'ci']
}));

export const configureParallelExecutionTask = defineTask('configure-parallel-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parallel Execution - ${args.projectName}`,
  agent: {
    name: 'parallel-developer',
    prompt: { role: 'Parallel Execution Developer', task: 'Configure parallel test execution', context: args, instructions: ['1. Configure test sharding', '2. Set up parallel workers', '3. Balance test distribution', '4. Configure merge strategy', '5. Handle shared resources', '6. Configure test isolation', '7. Optimize for speed', '8. Generate parallel configuration'] },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, shards: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'cross-platform', 'parallel']
}));

export const configureTestReportingTask = defineTask('configure-test-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Reporting - ${args.projectName}`,
  agent: {
    name: 'reporting-developer',
    prompt: { role: 'Test Reporting Developer', task: 'Configure cross-platform test reporting', context: args, instructions: ['1. Configure report aggregation', '2. Set up HTML reports', '3. Configure JUnit reports', '4. Set up coverage merge', '5. Configure platform comparison', '6. Set up trend tracking', '7. Configure notifications', '8. Generate reporting configuration'] },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, reportTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'cross-platform', 'reporting']
}));

export const validateCrossPlatformTestingTask = defineTask('validate-cross-platform-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Cross-Platform Testing - ${args.projectName}`,
  agent: {
    name: 'cross-platform-validator',
    prompt: { role: 'Cross-Platform Testing Validator', task: 'Validate cross-platform testing setup', context: args, instructions: ['1. Verify test matrix', '2. Test platform-specific tests', '3. Verify CI configuration', '4. Test parallel execution', '5. Verify reporting', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'cross-platform', 'validation']
}));
