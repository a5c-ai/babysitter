/**
 * @process specializations/web-development/e2e-testing-playwright
 * @description End-to-End Testing with Playwright - Process for setting up E2E testing with Playwright including test authoring, CI integration, and visual testing.
 * @inputs { projectName: string, features?: object }
 * @outputs { success: boolean, testConfig: object, testSuites: array, artifacts: array }
 * @references - Playwright: https://playwright.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, features = { visual: true, parallel: true }, outputDir = 'e2e-testing-playwright' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting E2E Testing Setup: ${projectName}`);

  const playwrightSetup = await ctx.task(playwrightSetupTask, { projectName, features, outputDir });
  artifacts.push(...playwrightSetup.artifacts);

  const testPatternsSetup = await ctx.task(testPatternsTask, { projectName, outputDir });
  artifacts.push(...testPatternsSetup.artifacts);

  const pageObjectsSetup = await ctx.task(pageObjectsTask, { projectName, outputDir });
  artifacts.push(...pageObjectsSetup.artifacts);

  const ciSetup = await ctx.task(ciIntegrationTask, { projectName, outputDir });
  artifacts.push(...ciSetup.artifacts);

  await ctx.breakpoint({ question: `E2E testing setup complete for ${projectName}. Approve?`, title: 'E2E Testing Review', context: { runId: ctx.runId, suites: testPatternsSetup.suites } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, testConfig: playwrightSetup.config, testSuites: testPatternsSetup.suites, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/e2e-testing-playwright', timestamp: startTime } };
}

export const playwrightSetupTask = defineTask('playwright-setup', (args, taskCtx) => ({ kind: 'skill', title: `Playwright Setup - ${args.projectName}`, skill: { name: 'playwright-skill', prompt: { role: 'Playwright Developer', task: 'Set up Playwright', context: args, instructions: ['1. Install Playwright', '2. Configure browsers', '3. Set up test directories', '4. Configure base URL', '5. Set up fixtures', '6. Configure timeouts', '7. Set up reporters', '8. Configure screenshots', '9. Set up tracing', '10. Document setup'], outputFormat: 'JSON with Playwright setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'playwright', 'setup'] }));

export const testPatternsTask = defineTask('test-patterns', (args, taskCtx) => ({ kind: 'agent', title: `Test Patterns - ${args.projectName}`, agent: { name: 'e2e-testing-specialist', prompt: { role: 'E2E Testing Specialist', task: 'Create test patterns', context: args, instructions: ['1. Create auth tests', '2. Create navigation tests', '3. Create form tests', '4. Create API tests', '5. Create visual tests', '6. Create accessibility tests', '7. Create mobile tests', '8. Create performance tests', '9. Create cross-browser tests', '10. Document patterns'], outputFormat: 'JSON with test patterns' }, outputSchema: { type: 'object', required: ['suites', 'artifacts'], properties: { suites: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'playwright', 'patterns'] }));

export const pageObjectsTask = defineTask('page-objects', (args, taskCtx) => ({ kind: 'agent', title: `Page Objects - ${args.projectName}`, agent: { name: 'page-object-specialist', prompt: { role: 'Page Object Specialist', task: 'Create Page Object Model', context: args, instructions: ['1. Create base page class', '2. Create component objects', '3. Create page objects', '4. Set up locators', '5. Create action methods', '6. Create assertion methods', '7. Configure waits', '8. Create utilities', '9. Set up data factories', '10. Document POM'], outputFormat: 'JSON with page objects' }, outputSchema: { type: 'object', required: ['pageObjects', 'artifacts'], properties: { pageObjects: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'playwright', 'pom'] }));

export const ciIntegrationTask = defineTask('ci-integration', (args, taskCtx) => ({ kind: 'agent', title: `CI Integration - ${args.projectName}`, agent: { name: 'ci-specialist', prompt: { role: 'CI Integration Specialist', task: 'Set up CI integration', context: args, instructions: ['1. Configure GitHub Actions', '2. Set up Docker containers', '3. Configure sharding', '4. Set up artifact storage', '5. Configure reporting', '6. Set up retry logic', '7. Configure parallelism', '8. Set up notifications', '9. Configure caching', '10. Document CI setup'], outputFormat: 'JSON with CI integration' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'playwright', 'ci'] }));

export const documentationTask = defineTask('e2e-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate E2E documentation', context: args, instructions: ['1. Create README', '2. Document setup', '3. Create test guide', '4. Document page objects', '5. Create CI guide', '6. Document debugging', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'documentation'] }));
