/**
 * @process specializations/web-development/eslint-prettier-configuration
 * @description ESLint and Prettier Configuration - Process for configuring ESLint and Prettier with custom rules, plugins, and formatting standards.
 * @inputs { projectName: string, framework?: string }
 * @outputs { success: boolean, lintConfig: object, rules: array, artifacts: array }
 * @references - ESLint: https://eslint.org/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'react', outputDir = 'eslint-prettier-configuration' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ESLint and Prettier Configuration: ${projectName}`);

  const eslintSetup = await ctx.task(eslintSetupTask, { projectName, framework, outputDir });
  artifacts.push(...eslintSetup.artifacts);

  const prettierSetup = await ctx.task(prettierSetupTask, { projectName, outputDir });
  artifacts.push(...prettierSetup.artifacts);

  const pluginsSetup = await ctx.task(pluginsSetupTask, { projectName, framework, outputDir });
  artifacts.push(...pluginsSetup.artifacts);

  const integrationSetup = await ctx.task(integrationSetupTask, { projectName, outputDir });
  artifacts.push(...integrationSetup.artifacts);

  await ctx.breakpoint({ question: `ESLint and Prettier configuration complete for ${projectName}. Approve?`, title: 'Linting Review', context: { runId: ctx.runId, rules: eslintSetup.rules } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, lintConfig: eslintSetup.config, rules: eslintSetup.rules, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/eslint-prettier-configuration', timestamp: startTime } };
}

export const eslintSetupTask = defineTask('eslint-setup', (args, taskCtx) => ({ kind: 'agent', title: `ESLint Setup - ${args.projectName}`, agent: { name: 'eslint-architect', prompt: { role: 'ESLint Architect', task: 'Configure ESLint', context: args, instructions: ['1. Create eslint.config.js', '2. Configure parser', '3. Set up extends', '4. Configure plugins', '5. Set up rules', '6. Configure env', '7. Set up globals', '8. Configure overrides', '9. Set up ignores', '10. Document setup'], outputFormat: 'JSON with ESLint setup' }, outputSchema: { type: 'object', required: ['config', 'rules', 'artifacts'], properties: { config: { type: 'object' }, rules: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'eslint', 'setup'] }));

export const prettierSetupTask = defineTask('prettier-setup', (args, taskCtx) => ({ kind: 'agent', title: `Prettier Setup - ${args.projectName}`, agent: { name: 'prettier-specialist', prompt: { role: 'Prettier Specialist', task: 'Configure Prettier', context: args, instructions: ['1. Create prettier.config.js', '2. Configure printWidth', '3. Set up tabWidth', '4. Configure semi', '5. Set up singleQuote', '6. Configure trailingComma', '7. Set up arrowParens', '8. Configure endOfLine', '9. Set up plugins', '10. Document setup'], outputFormat: 'JSON with Prettier setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'prettier', 'setup'] }));

export const pluginsSetupTask = defineTask('plugins-setup', (args, taskCtx) => ({ kind: 'agent', title: `Plugins Setup - ${args.projectName}`, agent: { name: 'linting-plugins-specialist', prompt: { role: 'Linting Plugins Specialist', task: 'Configure linting plugins', context: args, instructions: ['1. Configure React plugin', '2. Set up TypeScript plugin', '3. Configure import plugin', '4. Set up jsx-a11y', '5. Configure React Hooks', '6. Set up Tailwind plugin', '7. Configure testing plugin', '8. Set up unicorn', '9. Configure sonarjs', '10. Document plugins'], outputFormat: 'JSON with plugins' }, outputSchema: { type: 'object', required: ['plugins', 'artifacts'], properties: { plugins: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'eslint', 'plugins'] }));

export const integrationSetupTask = defineTask('integration-setup', (args, taskCtx) => ({ kind: 'agent', title: `Integration Setup - ${args.projectName}`, agent: { name: 'linting-integration-specialist', prompt: { role: 'Linting Integration Specialist', task: 'Configure integration', context: args, instructions: ['1. Configure IDE integration', '2. Set up VS Code settings', '3. Configure format on save', '4. Set up lint-staged', '5. Configure husky', '6. Set up commit hooks', '7. Configure CI lint', '8. Set up auto-fix', '9. Configure scripts', '10. Document integration'], outputFormat: 'JSON with integration' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'linting', 'integration'] }));

export const documentationTask = defineTask('linting-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate linting documentation', context: args, instructions: ['1. Create README', '2. Document ESLint', '3. Create Prettier guide', '4. Document plugins', '5. Create integration guide', '6. Document rules', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'linting', 'documentation'] }));
