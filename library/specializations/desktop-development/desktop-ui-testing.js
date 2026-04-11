/**
 * @process specializations/desktop-development/desktop-ui-testing
 * @description Desktop UI Testing Workflow - Set up UI/component testing using frameworks like Testing Library,
 * Spectron, or Playwright; implement visual regression testing.
 * @inputs { projectName: string, framework: string, uiTestFramework: string, visualRegressionEnabled?: boolean, outputDir?: string }
 * @outputs { success: boolean, testConfig: object, visualConfig?: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/desktop-ui-testing', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   uiTestFramework: 'Playwright',
 *   visualRegressionEnabled: true
 * });
 *
 * @references
 * - Playwright Electron: https://playwright.dev/docs/api/class-electron
 * - Testing Library: https://testing-library.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    uiTestFramework = 'Playwright',
    visualRegressionEnabled = true,
    outputDir = 'desktop-ui-testing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Desktop UI Testing Setup: ${projectName}`);

  const requirements = await ctx.task(uiTestingRequirementsTask, { projectName, framework, uiTestFramework, visualRegressionEnabled, outputDir });
  artifacts.push(...requirements.artifacts);

  const frameworkSetup = await ctx.task(setupUiTestFrameworkTask, { projectName, framework, uiTestFramework, outputDir });
  artifacts.push(...frameworkSetup.artifacts);

  const componentTesting = await ctx.task(setupComponentTestingTask, { projectName, framework, uiTestFramework, outputDir });
  artifacts.push(...componentTesting.artifacts);

  let visualRegression = null;
  if (visualRegressionEnabled) {
    visualRegression = await ctx.task(setupVisualRegressionTask, { projectName, uiTestFramework, outputDir });
    artifacts.push(...visualRegression.artifacts);
  }

  await ctx.breakpoint({
    question: `UI testing configured with ${uiTestFramework}. Visual regression: ${visualRegressionEnabled ? 'enabled' : 'disabled'}. Review?`,
    title: 'UI Testing Setup Review',
    context: { runId: ctx.runId, uiTestFramework, visualRegressionEnabled }
  });

  const pageObjects = await ctx.task(createPageObjectsTask, { projectName, framework, uiTestFramework, outputDir });
  artifacts.push(...pageObjects.artifacts);

  const sampleTests = await ctx.task(createUiSampleTestsTask, { projectName, framework, uiTestFramework, visualRegressionEnabled, outputDir });
  artifacts.push(...sampleTests.artifacts);

  const validation = await ctx.task(validateUiTestSetupTask, { projectName, uiTestFramework, frameworkSetup, componentTesting, visualRegression, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    testConfig: { framework: uiTestFramework, configPath: frameworkSetup.configPath },
    componentTesting: { setup: true, utilities: componentTesting.utilities },
    visualConfig: visualRegression ? { enabled: true, baseline: visualRegression.baselinePath } : null,
    pageObjects: pageObjects.objects,
    sampleTests: sampleTests.tests,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/desktop-ui-testing', timestamp: startTime }
  };
}

export const uiTestingRequirementsTask = defineTask('ui-testing-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `UI Testing Requirements - ${args.projectName}`,
  agent: {
    name: 'ui-test-analyst',
    prompt: { role: 'UI Testing Analyst', task: 'Analyze UI testing requirements', context: args, instructions: ['1. Analyze UI testing needs', '2. Identify testable components', '3. Plan visual testing strategy', '4. Define test scenarios', '5. Plan accessibility testing', '6. Identify cross-platform needs', '7. Plan CI integration', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ui-testing', 'requirements']
}));

export const setupUiTestFrameworkTask = defineTask('setup-ui-test-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `UI Test Framework - ${args.projectName}`,
  skill: {
    name: 'playwright-electron-setup',
  },
  agent: {
    name: 'desktop-e2e-test-architect',
    prompt: { role: 'UI Test Framework Developer', task: 'Set up UI testing framework', context: args, instructions: ['1. Install UI testing dependencies', '2. Configure Playwright/framework', '3. Set up Electron app testing', '4. Configure test scripts', '5. Set up fixtures', '6. Configure timeouts', '7. Set up reporters', '8. Generate framework configuration'] },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ui-testing', 'framework']
}));

export const setupComponentTestingTask = defineTask('setup-component-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Component Testing - ${args.projectName}`,
  agent: {
    name: 'component-test-developer',
    prompt: { role: 'Component Test Developer', task: 'Set up component testing', context: args, instructions: ['1. Configure Testing Library', '2. Set up render utilities', '3. Create query helpers', '4. Configure user events', '5. Set up cleanup', '6. Configure JSDOM/happy-dom', '7. Create component fixtures', '8. Generate component test utilities'] },
    outputSchema: { type: 'object', required: ['utilities', 'artifacts'], properties: { utilities: { type: 'array' }, configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ui-testing', 'component']
}));

export const setupVisualRegressionTask = defineTask('setup-visual-regression', (args, taskCtx) => ({
  kind: 'agent',
  title: `Visual Regression - ${args.projectName}`,
  skill: {
    name: 'visual-snapshot-comparator',
  },
  agent: {
    name: 'desktop-e2e-test-architect',
    prompt: { role: 'Visual Regression Developer', task: 'Set up visual regression testing', context: args, instructions: ['1. Configure visual testing tool', '2. Set up baseline images', '3. Configure threshold', '4. Handle dynamic content', '5. Configure viewport sizes', '6. Set up CI integration', '7. Create comparison reports', '8. Generate visual testing configuration'] },
    outputSchema: { type: 'object', required: ['baselinePath', 'artifacts'], properties: { baselinePath: { type: 'string' }, threshold: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ui-testing', 'visual-regression']
}));

export const createPageObjectsTask = defineTask('create-page-objects', (args, taskCtx) => ({
  kind: 'agent',
  title: `Page Objects - ${args.projectName}`,
  agent: {
    name: 'page-object-developer',
    prompt: { role: 'Page Object Developer', task: 'Create page object models', context: args, instructions: ['1. Create base page object', '2. Create main window PO', '3. Create dialog POs', '4. Create component POs', '5. Add selectors', '6. Add interaction methods', '7. Add assertion helpers', '8. Generate page object files'] },
    outputSchema: { type: 'object', required: ['objects', 'artifacts'], properties: { objects: { type: 'array' }, basePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ui-testing', 'page-objects']
}));

export const createUiSampleTestsTask = defineTask('create-ui-sample-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `UI Sample Tests - ${args.projectName}`,
  agent: {
    name: 'ui-sample-developer',
    prompt: { role: 'UI Sample Test Developer', task: 'Create sample UI tests', context: args, instructions: ['1. Create window tests', '2. Create navigation tests', '3. Create interaction tests', '4. Create form tests', '5. Create visual tests', '6. Create accessibility tests', '7. Add test documentation', '8. Generate sample test files'] },
    outputSchema: { type: 'object', required: ['tests', 'artifacts'], properties: { tests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ui-testing', 'samples']
}));

export const validateUiTestSetupTask = defineTask('validate-ui-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate UI Test Setup - ${args.projectName}`,
  agent: {
    name: 'ui-test-validator',
    prompt: { role: 'UI Test Validator', task: 'Validate UI testing setup', context: args, instructions: ['1. Run sample UI tests', '2. Verify visual testing', '3. Check component tests', '4. Verify CI integration', '5. Test cross-platform', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'ui-testing', 'validation']
}));
