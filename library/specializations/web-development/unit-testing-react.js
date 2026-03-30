/**
 * @process specializations/web-development/unit-testing-react
 * @description Unit Testing for React Applications - Process for setting up unit testing with Jest/Vitest and React Testing Library.
 * @inputs { projectName: string, testFramework?: string }
 * @outputs { success: boolean, testConfig: object, testPatterns: array, artifacts: array }
 * @references - React Testing Library: https://testing-library.com/react
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, testFramework = 'vitest', outputDir = 'unit-testing-react' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Unit Testing Setup: ${projectName}`);

  const testingSetup = await ctx.task(testingSetupTask, { projectName, testFramework, outputDir });
  artifacts.push(...testingSetup.artifacts);

  const componentTests = await ctx.task(componentTestsTask, { projectName, outputDir });
  artifacts.push(...componentTests.artifacts);

  const hookTests = await ctx.task(hookTestsTask, { projectName, outputDir });
  artifacts.push(...hookTests.artifacts);

  const mockingSetup = await ctx.task(mockingSetupTask, { projectName, outputDir });
  artifacts.push(...mockingSetup.artifacts);

  const coverageSetup = await ctx.task(coverageSetupTask, { projectName, outputDir });
  artifacts.push(...coverageSetup.artifacts);

  await ctx.breakpoint({ question: `Unit testing setup complete for ${projectName}. Approve?`, title: 'Testing Review', context: { runId: ctx.runId, patterns: componentTests.patterns } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, testConfig: testingSetup.config, testPatterns: [...componentTests.patterns, ...hookTests.patterns], artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/unit-testing-react', timestamp: startTime } };
}

export const testingSetupTask = defineTask('testing-setup', (args, taskCtx) => ({ kind: 'skill', title: `Testing Setup - ${args.projectName}`, skill: { name: 'vitest-skill', prompt: { role: 'React Testing Developer', task: 'Set up testing infrastructure', context: args, instructions: ['1. Install testing libraries', '2. Configure test framework', '3. Set up test environment', '4. Configure jsdom', '5. Set up test utilities', '6. Configure matchers', '7. Set up test commands', '8. Configure watch mode', '9. Set up CI integration', '10. Document setup'], outputFormat: 'JSON with testing setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'react', 'setup'] }));

export const componentTestsTask = defineTask('component-tests', (args, taskCtx) => ({ kind: 'agent', title: `Component Tests - ${args.projectName}`, agent: { name: 'component-testing-specialist', prompt: { role: 'Component Testing Specialist', task: 'Create component test patterns', context: args, instructions: ['1. Create render patterns', '2. Test user interactions', '3. Test async rendering', '4. Test form components', '5. Test conditional rendering', '6. Test accessibility', '7. Test error states', '8. Test loading states', '9. Create test factories', '10. Document patterns'], outputFormat: 'JSON with component tests' }, outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'react', 'components'] }));

export const hookTestsTask = defineTask('hook-tests', (args, taskCtx) => ({ kind: 'agent', title: `Hook Tests - ${args.projectName}`, agent: { name: 'hook-testing-specialist', prompt: { role: 'Hook Testing Specialist', task: 'Create hook test patterns', context: args, instructions: ['1. Set up renderHook', '2. Test useState hooks', '3. Test useEffect hooks', '4. Test custom hooks', '5. Test async hooks', '6. Test hook dependencies', '7. Test hook errors', '8. Test context hooks', '9. Create hook factories', '10. Document patterns'], outputFormat: 'JSON with hook tests' }, outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'react', 'hooks'] }));

export const mockingSetupTask = defineTask('mocking-setup', (args, taskCtx) => ({ kind: 'agent', title: `Mocking Setup - ${args.projectName}`, agent: { name: 'mocking-specialist', prompt: { role: 'Mocking Specialist', task: 'Set up mocking patterns', context: args, instructions: ['1. Configure MSW', '2. Set up API mocks', '3. Create module mocks', '4. Mock browser APIs', '5. Set up mock factories', '6. Configure mock reset', '7. Create context mocks', '8. Mock third-party libs', '9. Set up spy utilities', '10. Document mocking'], outputFormat: 'JSON with mocking setup' }, outputSchema: { type: 'object', required: ['mocks', 'artifacts'], properties: { mocks: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'mocking'] }));

export const coverageSetupTask = defineTask('coverage-setup', (args, taskCtx) => ({ kind: 'agent', title: `Coverage Setup - ${args.projectName}`, agent: { name: 'coverage-specialist', prompt: { role: 'Coverage Specialist', task: 'Set up code coverage', context: args, instructions: ['1. Configure coverage tool', '2. Set up thresholds', '3. Configure reporters', '4. Set up CI reporting', '5. Configure exclusions', '6. Set up badges', '7. Configure branch coverage', '8. Set up trend tracking', '9. Configure enforcement', '10. Document coverage'], outputFormat: 'JSON with coverage setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'coverage'] }));

export const documentationTask = defineTask('testing-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate testing documentation', context: args, instructions: ['1. Create README', '2. Document patterns', '3. Create examples', '4. Document mocking', '5. Create coverage guide', '6. Document CI setup', '7. Create troubleshooting', '8. Document best practices', '9. Create cheatsheet', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'documentation'] }));
