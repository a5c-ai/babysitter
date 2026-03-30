/**
 * @process specializations/web-development/storybook-component-testing
 * @description Storybook Component Testing - Process for setting up Storybook with component documentation, visual testing, and interaction testing.
 * @inputs { projectName: string, framework?: string }
 * @outputs { success: boolean, storybookConfig: object, stories: array, artifacts: array }
 * @references - Storybook: https://storybook.js.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'react', outputDir = 'storybook-component-testing' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Storybook Setup: ${projectName}`);

  const storybookSetup = await ctx.task(storybookSetupTask, { projectName, framework, outputDir });
  artifacts.push(...storybookSetup.artifacts);

  const storyPatterns = await ctx.task(storyPatternsTask, { projectName, outputDir });
  artifacts.push(...storyPatterns.artifacts);

  const addonsSetup = await ctx.task(addonsSetupTask, { projectName, outputDir });
  artifacts.push(...addonsSetup.artifacts);

  const interactionTests = await ctx.task(interactionTestsTask, { projectName, outputDir });
  artifacts.push(...interactionTests.artifacts);

  await ctx.breakpoint({ question: `Storybook setup complete for ${projectName}. Approve?`, title: 'Storybook Review', context: { runId: ctx.runId, stories: storyPatterns.stories } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, storybookConfig: storybookSetup.config, stories: storyPatterns.stories, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/storybook-component-testing', timestamp: startTime } };
}

export const storybookSetupTask = defineTask('storybook-setup', (args, taskCtx) => ({ kind: 'skill', title: `Storybook Setup - ${args.projectName}`, skill: { name: 'storybook-skill', prompt: { role: 'Storybook Developer', task: 'Set up Storybook', context: args, instructions: ['1. Install Storybook', '2. Configure framework', '3. Set up main.js', '4. Configure preview.js', '5. Set up decorators', '6. Configure parameters', '7. Set up theme', '8. Configure build', '9. Set up static files', '10. Document setup'], outputFormat: 'JSON with Storybook setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'storybook', 'setup'] }));

export const storyPatternsTask = defineTask('story-patterns', (args, taskCtx) => ({ kind: 'agent', title: `Story Patterns - ${args.projectName}`, agent: { name: 'story-specialist', prompt: { role: 'Story Specialist', task: 'Create story patterns', context: args, instructions: ['1. Create component stories', '2. Document props with args', '3. Create variants', '4. Set up controls', '5. Create compositions', '6. Document accessibility', '7. Create responsive stories', '8. Set up dark mode', '9. Create documentation', '10. Document patterns'], outputFormat: 'JSON with stories' }, outputSchema: { type: 'object', required: ['stories', 'artifacts'], properties: { stories: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'storybook', 'stories'] }));

export const addonsSetupTask = defineTask('addons-setup', (args, taskCtx) => ({ kind: 'agent', title: `Addons Setup - ${args.projectName}`, agent: { name: 'storybook-addons-specialist', prompt: { role: 'Storybook Addons Specialist', task: 'Configure addons', context: args, instructions: ['1. Set up a11y addon', '2. Configure Chromatic', '3. Set up design addon', '4. Configure docs addon', '5. Set up viewport addon', '6. Configure backgrounds', '7. Set up actions addon', '8. Configure measure addon', '9. Set up test runner', '10. Document addons'], outputFormat: 'JSON with addons' }, outputSchema: { type: 'object', required: ['addons', 'artifacts'], properties: { addons: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'storybook', 'addons'] }));

export const interactionTestsTask = defineTask('interaction-tests', (args, taskCtx) => ({ kind: 'agent', title: `Interaction Tests - ${args.projectName}`, agent: { name: 'interaction-testing-specialist', prompt: { role: 'Interaction Testing Specialist', task: 'Create interaction tests', context: args, instructions: ['1. Set up play functions', '2. Create user interactions', '3. Test form inputs', '4. Test async actions', '5. Create assertions', '6. Set up test runner', '7. Configure CI', '8. Create visual tests', '9. Set up coverage', '10. Document tests'], outputFormat: 'JSON with interaction tests' }, outputSchema: { type: 'object', required: ['tests', 'artifacts'], properties: { tests: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'storybook', 'interactions'] }));

export const documentationTask = defineTask('storybook-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Storybook documentation', context: args, instructions: ['1. Create README', '2. Document setup', '3. Create story guide', '4. Document addons', '5. Create testing guide', '6. Document deployment', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'documentation'] }));
