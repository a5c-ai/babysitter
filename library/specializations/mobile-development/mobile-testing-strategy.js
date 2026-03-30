/**
 * @process specializations/mobile-development/mobile-testing-strategy
 * @description Mobile App Testing Strategy - Comprehensive testing framework including unit tests,
 * integration tests, UI tests, E2E tests, and device testing across iOS and Android platforms.
 * @inputs { appName: string, platforms: array, framework?: string, testingFrameworks?: object }
 * @outputs { success: boolean, testingStrategy: object, testSuites: array, coverage: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/mobile-testing-strategy', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   framework: 'react-native',
 *   testingFrameworks: { unit: 'jest', e2e: 'detox', ui: 'maestro' }
 * });
 *
 * @references
 * - XCTest: https://developer.apple.com/documentation/xctest
 * - Espresso: https://developer.android.com/training/testing/espresso
 * - Detox: https://wix.github.io/Detox/
 * - Maestro: https://maestro.mobile.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    framework = 'native',
    testingFrameworks = { unit: 'jest', e2e: 'detox' },
    outputDir = 'testing-strategy'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Testing Strategy: ${appName}`);
  ctx.log('info', `Framework: ${framework}, Platforms: ${platforms.join(', ')}`);

  const phases = [
    { name: 'test-strategy-planning', title: 'Test Strategy Planning' },
    { name: 'unit-test-setup', title: 'Unit Test Framework Setup' },
    { name: 'integration-test-setup', title: 'Integration Test Setup' },
    { name: 'ui-test-setup', title: 'UI Test Framework Setup' },
    { name: 'e2e-test-setup', title: 'E2E Test Framework Setup' },
    { name: 'snapshot-testing', title: 'Snapshot Testing Setup' },
    { name: 'mock-setup', title: 'Mock and Stub Setup' },
    { name: 'device-testing', title: 'Device Testing Strategy' },
    { name: 'ci-integration', title: 'CI/CD Test Integration' },
    { name: 'coverage-setup', title: 'Code Coverage Setup' },
    { name: 'performance-testing', title: 'Performance Test Suite' },
    { name: 'accessibility-testing', title: 'Accessibility Test Suite' },
    { name: 'security-testing', title: 'Security Test Suite' },
    { name: 'test-documentation', title: 'Test Documentation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createTestingTask(phase.name, phase.title), {
      appName, platforms, framework, testingFrameworks, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Testing strategy complete for ${appName}. Ready to execute test suites?`,
    title: 'Testing Strategy Review',
    context: { runId: ctx.runId, appName, platforms, testingFrameworks }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    framework,
    testingStrategy: { status: 'configured', phases: phases.length },
    testSuites: ['unit', 'integration', 'ui', 'e2e', 'performance', 'accessibility', 'security'],
    coverage: { target: 80, current: 0 },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/mobile-testing-strategy', timestamp: startTime }
  };
}

function createTestingTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'mobile-testing' },
    agent: {
      name: 'mobile-qa-expert',
      prompt: {
        role: 'Mobile QA Engineer',
        task: `Configure ${title.toLowerCase()} for mobile testing`,
        context: args,
        instructions: [
          `1. Set up ${title.toLowerCase()} infrastructure`,
          `2. Configure for ${args.platforms.join(' and ')}`,
          `3. Create test templates and examples`,
          `4. Integrate with CI/CD pipeline`,
          `5. Document testing procedures`
        ],
        outputFormat: 'JSON with testing details'
      },
      outputSchema: {
        type: 'object',
        required: ['testConfig', 'artifacts'],
        properties: { testConfig: { type: 'object' }, testSuites: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'testing', name]
  });
}

export const testStrategyTask = createTestingTask('test-strategy-planning', 'Test Strategy Planning');
export const unitTestTask = createTestingTask('unit-test-setup', 'Unit Test Framework Setup');
export const integrationTestTask = createTestingTask('integration-test-setup', 'Integration Test Setup');
export const uiTestTask = createTestingTask('ui-test-setup', 'UI Test Framework Setup');
export const e2eTestTask = createTestingTask('e2e-test-setup', 'E2E Test Framework Setup');
export const snapshotTestTask = createTestingTask('snapshot-testing', 'Snapshot Testing Setup');
export const mockSetupTask = createTestingTask('mock-setup', 'Mock and Stub Setup');
export const deviceTestTask = createTestingTask('device-testing', 'Device Testing Strategy');
export const ciIntegrationTask = createTestingTask('ci-integration', 'CI/CD Test Integration');
export const coverageSetupTask = createTestingTask('coverage-setup', 'Code Coverage Setup');
export const performanceTestTask = createTestingTask('performance-testing', 'Performance Test Suite');
export const accessibilityTestTask = createTestingTask('accessibility-testing', 'Accessibility Test Suite');
export const securityTestTask = createTestingTask('security-testing', 'Security Test Suite');
export const testDocumentationTask = createTestingTask('test-documentation', 'Test Documentation');
