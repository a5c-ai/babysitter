/**
 * @process specializations/web-development/mongodb-schema-design
 * @description MongoDB Schema Design - Process for designing MongoDB document schemas with Mongoose, embedding vs referencing strategies, indexes, and validation.
 * @inputs { projectName: string, features?: object }
 * @outputs { success: boolean, schemas: array, indexes: array, artifacts: array }
 * @references
 * - MongoDB Documentation: https://docs.mongodb.com/
 * - Mongoose: https://mongoosejs.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, features = { aggregation: true, transactions: false }, outputDir = 'mongodb-schema-design' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MongoDB Schema Design: ${projectName}`);

  const schemaDesign = await ctx.task(schemaDesignTask, { projectName, features, outputDir });
  artifacts.push(...schemaDesign.artifacts);

  const embeddingStrategy = await ctx.task(embeddingStrategyTask, { projectName, outputDir });
  artifacts.push(...embeddingStrategy.artifacts);

  const indexesSetup = await ctx.task(indexesSetupTask, { projectName, outputDir });
  artifacts.push(...indexesSetup.artifacts);

  const validationSetup = await ctx.task(validationSetupTask, { projectName, outputDir });
  artifacts.push(...validationSetup.artifacts);

  await ctx.breakpoint({ question: `MongoDB schema design complete for ${projectName}. ${schemaDesign.schemas.length} schemas. Approve?`, title: 'MongoDB Schema Review', context: { runId: ctx.runId, schemas: schemaDesign.schemas } });

  const documentation = await ctx.task(documentationTask, { projectName, schemaDesign, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, schemas: schemaDesign.schemas, indexes: indexesSetup.indexes, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/mongodb-schema-design', timestamp: startTime } };
}

export const schemaDesignTask = defineTask('mongo-schema', (args, taskCtx) => ({ kind: 'skill', title: `Schema Design - ${args.projectName}`, skill: { name: 'mongodb-skill', prompt: { role: 'MongoDB Architect', task: 'Design MongoDB schemas', context: args, instructions: ['1. Analyze data models', '2. Design document structure', '3. Define schema types', '4. Set up virtuals', '5. Configure methods', '6. Set up statics', '7. Configure hooks', '8. Design subdocuments', '9. Set up discriminators', '10. Document schemas'], outputFormat: 'JSON with schemas' }, outputSchema: { type: 'object', required: ['schemas', 'artifacts'], properties: { schemas: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'mongodb', 'schema'] }));

export const embeddingStrategyTask = defineTask('mongo-embedding', (args, taskCtx) => ({ kind: 'agent', title: `Embedding Strategy - ${args.projectName}`, agent: { name: 'mongodb-specialist', prompt: { role: 'MongoDB Specialist', task: 'Design embedding vs referencing strategy', context: args, instructions: ['1. Analyze relationships', '2. Decide embedding', '3. Configure references', '4. Set up population', '5. Handle denormalization', '6. Configure cascading', '7. Set up arrays', '8. Handle growth patterns', '9. Configure sharding', '10. Document strategy'], outputFormat: 'JSON with strategy' }, outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'mongodb', 'embedding'] }));

export const indexesSetupTask = defineTask('mongo-indexes', (args, taskCtx) => ({ kind: 'agent', title: `Indexes Setup - ${args.projectName}`, agent: { name: 'mongodb-index-specialist', prompt: { role: 'MongoDB Index Specialist', task: 'Design indexes', context: args, instructions: ['1. Analyze queries', '2. Create single field indexes', '3. Set up compound indexes', '4. Configure text indexes', '5. Set up geospatial indexes', '6. Configure TTL indexes', '7. Set up unique indexes', '8. Configure sparse indexes', '9. Plan index maintenance', '10. Document indexes'], outputFormat: 'JSON with indexes' }, outputSchema: { type: 'object', required: ['indexes', 'artifacts'], properties: { indexes: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'mongodb', 'indexes'] }));

export const validationSetupTask = defineTask('mongo-validation', (args, taskCtx) => ({ kind: 'agent', title: `Validation Setup - ${args.projectName}`, agent: { name: 'mongodb-validation-specialist', prompt: { role: 'MongoDB Validation Specialist', task: 'Set up schema validation', context: args, instructions: ['1. Configure Mongoose validation', '2. Set up required fields', '3. Configure custom validators', '4. Set up async validation', '5. Configure error messages', '6. Set up pre-save hooks', '7. Configure type casting', '8. Set up sanitization', '9. Configure defaults', '10. Document validation'], outputFormat: 'JSON with validation' }, outputSchema: { type: 'object', required: ['validation', 'artifacts'], properties: { validation: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'mongodb', 'validation'] }));

export const documentationTask = defineTask('mongo-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate MongoDB documentation', context: args, instructions: ['1. Create README', '2. Document schemas', '3. Create ERD equivalent', '4. Document indexes', '5. Create query patterns', '6. Document validation', '7. Create performance guide', '8. Document aggregations', '9. Create troubleshooting', '10. Generate examples'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'database', 'documentation'] }));
