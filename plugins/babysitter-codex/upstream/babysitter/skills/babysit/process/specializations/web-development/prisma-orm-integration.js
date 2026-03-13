/**
 * @process specializations/web-development/prisma-orm-integration
 * @description Prisma ORM Integration - Process for integrating Prisma ORM with schema design, migrations, client generation, and type-safe database access.
 * @inputs { projectName: string, database?: string, features?: object }
 * @outputs { success: boolean, schema: object, migrations: array, client: object, artifacts: array }
 * @references
 * - Prisma Documentation: https://www.prisma.io/docs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, database = 'postgresql', features = { softDeletes: true, audit: true }, outputDir = 'prisma-orm-integration' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Prisma ORM Integration: ${projectName}`);

  const schemaSetup = await ctx.task(schemaSetupTask, { projectName, database, outputDir });
  artifacts.push(...schemaSetup.artifacts);

  const modelsSetup = await ctx.task(modelsSetupTask, { projectName, features, outputDir });
  artifacts.push(...modelsSetup.artifacts);

  const migrationsSetup = await ctx.task(migrationsSetupTask, { projectName, outputDir });
  artifacts.push(...migrationsSetup.artifacts);

  const clientSetup = await ctx.task(clientSetupTask, { projectName, outputDir });
  artifacts.push(...clientSetup.artifacts);

  const extensionsSetup = await ctx.task(extensionsSetupTask, { projectName, features, outputDir });
  artifacts.push(...extensionsSetup.artifacts);

  await ctx.breakpoint({ question: `Prisma integration complete for ${projectName}. ${modelsSetup.models.length} models. Approve?`, title: 'Prisma Review', context: { runId: ctx.runId, models: modelsSetup.models } });

  const documentation = await ctx.task(documentationTask, { projectName, schemaSetup, modelsSetup, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, schema: schemaSetup.schema, migrations: migrationsSetup.migrations, client: clientSetup.client, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/prisma-orm-integration', timestamp: startTime } };
}

export const schemaSetupTask = defineTask('prisma-schema', (args, taskCtx) => ({ kind: 'skill', title: `Prisma Schema - ${args.projectName}`, skill: { name: 'prisma-skill', prompt: { role: 'Prisma Developer', task: 'Set up Prisma schema', context: args, instructions: ['1. Initialize Prisma', '2. Configure datasource', '3. Set up generator', '4. Configure output', '5. Set up previewFeatures', '6. Configure binaryTargets', '7. Set up env variables', '8. Configure schema path', '9. Set up formatting', '10. Document schema setup'], outputFormat: 'JSON with schema setup' }, outputSchema: { type: 'object', required: ['schema', 'artifacts'], properties: { schema: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'prisma', 'setup'] }));

export const modelsSetupTask = defineTask('prisma-models', (args, taskCtx) => ({ kind: 'agent', title: `Prisma Models - ${args.projectName}`, agent: { name: 'prisma-model-specialist', prompt: { role: 'Prisma Model Specialist', task: 'Design Prisma models', context: args, instructions: ['1. Define models', '2. Set up fields', '3. Configure relations', '4. Set up indexes', '5. Configure unique constraints', '6. Set up default values', '7. Configure attributes', '8. Set up enums', '9. Configure composite types', '10. Document models'], outputFormat: 'JSON with models' }, outputSchema: { type: 'object', required: ['models', 'artifacts'], properties: { models: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'prisma', 'models'] }));

export const migrationsSetupTask = defineTask('prisma-migrations', (args, taskCtx) => ({ kind: 'agent', title: `Prisma Migrations - ${args.projectName}`, agent: { name: 'prisma-migrations-specialist', prompt: { role: 'Prisma Migrations Specialist', task: 'Set up Prisma migrations', context: args, instructions: ['1. Create initial migration', '2. Configure migration naming', '3. Set up seed data', '4. Configure reset scripts', '5. Set up CI/CD integration', '6. Configure production migrations', '7. Set up rollback strategy', '8. Configure baseline', '9. Set up testing', '10. Document migrations'], outputFormat: 'JSON with migrations' }, outputSchema: { type: 'object', required: ['migrations', 'artifacts'], properties: { migrations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'prisma', 'migrations'] }));

export const clientSetupTask = defineTask('prisma-client', (args, taskCtx) => ({ kind: 'agent', title: `Prisma Client - ${args.projectName}`, agent: { name: 'prisma-client-specialist', prompt: { role: 'Prisma Client Specialist', task: 'Configure Prisma Client', context: args, instructions: ['1. Generate client', '2. Set up singleton pattern', '3. Configure logging', '4. Set up error handling', '5. Configure connection pool', '6. Set up transactions', '7. Configure middleware', '8. Set up query extensions', '9. Configure types export', '10. Document client usage'], outputFormat: 'JSON with client' }, outputSchema: { type: 'object', required: ['client', 'artifacts'], properties: { client: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'prisma', 'client'] }));

export const extensionsSetupTask = defineTask('prisma-extensions', (args, taskCtx) => ({ kind: 'agent', title: `Prisma Extensions - ${args.projectName}`, agent: { name: 'prisma-extensions-specialist', prompt: { role: 'Prisma Extensions Specialist', task: 'Set up Prisma extensions', context: args, instructions: ['1. Create model extensions', '2. Set up soft delete', '3. Configure audit logging', '4. Set up computed fields', '5. Configure client extensions', '6. Set up custom methods', '7. Configure result extensions', '8. Set up query extensions', '9. Configure middleware', '10. Document extensions'], outputFormat: 'JSON with extensions' }, outputSchema: { type: 'object', required: ['extensions', 'artifacts'], properties: { extensions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'prisma', 'extensions'] }));

export const documentationTask = defineTask('prisma-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Prisma documentation', context: args, instructions: ['1. Create README', '2. Document schema', '3. Create model docs', '4. Document relations', '5. Create migration guide', '6. Document client usage', '7. Create query patterns', '8. Document extensions', '9. Create troubleshooting', '10. Generate examples'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'documentation'] }));
