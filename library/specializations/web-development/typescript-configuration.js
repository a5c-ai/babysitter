/**
 * @process specializations/web-development/typescript-configuration
 * @description TypeScript Configuration - Process for configuring TypeScript with strict type checking, path aliases, and build optimization.
 * @inputs { projectName: string, strictness?: string }
 * @outputs { success: boolean, tsConfig: object, types: array, artifacts: array }
 * @references - TypeScript: https://www.typescriptlang.org/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, strictness = 'strict', outputDir = 'typescript-configuration' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting TypeScript Configuration: ${projectName}`);

  const tsConfigSetup = await ctx.task(tsConfigSetupTask, { projectName, strictness, outputDir });
  artifacts.push(...tsConfigSetup.artifacts);

  const typeDefinitions = await ctx.task(typeDefinitionsTask, { projectName, outputDir });
  artifacts.push(...typeDefinitions.artifacts);

  const pathAliases = await ctx.task(pathAliasesTask, { projectName, outputDir });
  artifacts.push(...pathAliases.artifacts);

  const buildOptimization = await ctx.task(buildOptimizationTask, { projectName, outputDir });
  artifacts.push(...buildOptimization.artifacts);

  await ctx.breakpoint({ question: `TypeScript configuration complete for ${projectName}. Approve?`, title: 'TypeScript Review', context: { runId: ctx.runId, config: tsConfigSetup.config } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, tsConfig: tsConfigSetup.config, types: typeDefinitions.types, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/typescript-configuration', timestamp: startTime } };
}

export const tsConfigSetupTask = defineTask('tsconfig-setup', (args, taskCtx) => ({ kind: 'agent', title: `TSConfig Setup - ${args.projectName}`, agent: { name: 'typescript-architect', prompt: { role: 'TypeScript Architect', task: 'Configure tsconfig.json', context: args, instructions: ['1. Configure compilerOptions', '2. Set up strict mode', '3. Configure target', '4. Set up module', '5. Configure lib', '6. Set up jsx', '7. Configure moduleResolution', '8. Set up include/exclude', '9. Configure references', '10. Document setup'], outputFormat: 'JSON with tsconfig' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'typescript', 'config'] }));

export const typeDefinitionsTask = defineTask('type-definitions', (args, taskCtx) => ({ kind: 'agent', title: `Type Definitions - ${args.projectName}`, agent: { name: 'types-specialist', prompt: { role: 'TypeScript Types Specialist', task: 'Create type definitions', context: args, instructions: ['1. Create global types', '2. Define interfaces', '3. Create type utilities', '4. Configure type guards', '5. Set up generics', '6. Configure conditional types', '7. Create mapped types', '8. Set up branded types', '9. Configure declaration files', '10. Document types'], outputFormat: 'JSON with types' }, outputSchema: { type: 'object', required: ['types', 'artifacts'], properties: { types: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'typescript', 'types'] }));

export const pathAliasesTask = defineTask('path-aliases', (args, taskCtx) => ({ kind: 'agent', title: `Path Aliases - ${args.projectName}`, agent: { name: 'path-aliases-specialist', prompt: { role: 'Path Aliases Specialist', task: 'Configure path aliases', context: args, instructions: ['1. Configure baseUrl', '2. Set up paths', '3. Configure @/* alias', '4. Set up component paths', '5. Configure utility paths', '6. Set up type paths', '7. Configure test paths', '8. Set up bundler alias', '9. Configure IDE support', '10. Document aliases'], outputFormat: 'JSON with aliases' }, outputSchema: { type: 'object', required: ['aliases', 'artifacts'], properties: { aliases: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'typescript', 'aliases'] }));

export const buildOptimizationTask = defineTask('build-optimization', (args, taskCtx) => ({ kind: 'agent', title: `Build Optimization - ${args.projectName}`, agent: { name: 'ts-build-specialist', prompt: { role: 'TypeScript Build Specialist', task: 'Optimize TypeScript build', context: args, instructions: ['1. Configure incremental', '2. Set up composite', '3. Configure skipLibCheck', '4. Set up declaration', '5. Configure declarationMap', '6. Set up sourceMap', '7. Configure outDir', '8. Set up tsBuildInfoFile', '9. Configure project references', '10. Document optimization'], outputFormat: 'JSON with optimization' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'typescript', 'build'] }));

export const documentationTask = defineTask('ts-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate TypeScript documentation', context: args, instructions: ['1. Create README', '2. Document configuration', '3. Create types guide', '4. Document aliases', '5. Create build guide', '6. Document patterns', '7. Create migration guide', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'typescript', 'documentation'] }));
