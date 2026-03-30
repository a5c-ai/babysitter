/**
 * @process specializations/web-development/postgresql-database-design
 * @description PostgreSQL Database Design - Process for designing and implementing PostgreSQL databases with schemas,
 * migrations, indexes, constraints, relationships, and performance optimization.
 * @inputs { projectName: string, features?: object, orm?: string }
 * @outputs { success: boolean, schema: object, migrations: array, indexes: array, artifacts: array }
 *
 * @references
 * - PostgreSQL Documentation: https://www.postgresql.org/docs/
 * - Prisma: https://www.prisma.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    features = { fullTextSearch: true, jsonb: true },
    orm = 'prisma',
    outputDir = 'postgresql-database-design'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting PostgreSQL Database Design: ${projectName}`);

  const schemaDesign = await ctx.task(schemaDesignTask, { projectName, features, outputDir });
  artifacts.push(...schemaDesign.artifacts);

  const relationshipsSetup = await ctx.task(relationshipsSetupTask, { projectName, schemaDesign, outputDir });
  artifacts.push(...relationshipsSetup.artifacts);

  const indexesSetup = await ctx.task(indexesSetupTask, { projectName, schemaDesign, outputDir });
  artifacts.push(...indexesSetup.artifacts);

  const migrationsSetup = await ctx.task(migrationsSetupTask, { projectName, orm, outputDir });
  artifacts.push(...migrationsSetup.artifacts);

  const performanceSetup = await ctx.task(performanceSetupTask, { projectName, outputDir });
  artifacts.push(...performanceSetup.artifacts);

  await ctx.breakpoint({
    question: `PostgreSQL database design complete for ${projectName}. ${schemaDesign.tables.length} tables designed. Approve?`,
    title: 'Database Design Review',
    context: { runId: ctx.runId, tables: schemaDesign.tables, indexes: indexesSetup.indexes }
  });

  const documentation = await ctx.task(documentationTask, { projectName, schemaDesign, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    schema: schemaDesign.schema,
    migrations: migrationsSetup.migrations,
    indexes: indexesSetup.indexes,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/postgresql-database-design', timestamp: startTime }
  };
}

export const schemaDesignTask = defineTask('pg-schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Schema Design - ${args.projectName}`,
  agent: {
    name: 'database-architect',
    prompt: { role: 'Database Architect', task: 'Design PostgreSQL schema', context: args,
      instructions: ['1. Analyze requirements', '2. Design tables', '3. Define columns and types', '4. Set up constraints', '5. Configure defaults', '6. Design JSONB columns', '7. Set up enums', '8. Configure arrays', '9. Design audit columns', '10. Document schema'],
      outputFormat: 'JSON with schema design'
    },
    outputSchema: { type: 'object', required: ['schema', 'tables', 'artifacts'], properties: { schema: { type: 'object' }, tables: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'database', 'postgresql', 'schema']
}));

export const relationshipsSetupTask = defineTask('pg-relationships', (args, taskCtx) => ({
  kind: 'agent',
  title: `Relationships Setup - ${args.projectName}`,
  agent: {
    name: 'database-relationships-specialist',
    prompt: { role: 'Database Relationships Specialist', task: 'Design table relationships', context: args,
      instructions: ['1. Define foreign keys', '2. Configure cascade behavior', '3. Set up one-to-one', '4. Configure one-to-many', '5. Set up many-to-many', '6. Create junction tables', '7. Configure self-referential', '8. Set up polymorphic', '9. Configure soft deletes', '10. Document relationships'],
      outputFormat: 'JSON with relationships'
    },
    outputSchema: { type: 'object', required: ['relationships', 'artifacts'], properties: { relationships: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'database', 'postgresql', 'relationships']
}));

export const indexesSetupTask = defineTask('pg-indexes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Indexes Setup - ${args.projectName}`,
  agent: {
    name: 'database-index-specialist',
    prompt: { role: 'Database Index Specialist', task: 'Design database indexes', context: args,
      instructions: ['1. Analyze queries', '2. Create B-tree indexes', '3. Set up GiST indexes', '4. Configure GIN indexes', '5. Create partial indexes', '6. Set up composite indexes', '7. Configure unique indexes', '8. Set up expression indexes', '9. Plan index maintenance', '10. Document indexes'],
      outputFormat: 'JSON with indexes'
    },
    outputSchema: { type: 'object', required: ['indexes', 'artifacts'], properties: { indexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'database', 'postgresql', 'indexes']
}));

export const migrationsSetupTask = defineTask('pg-migrations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Migrations Setup - ${args.projectName}`,
  agent: {
    name: 'migrations-specialist',
    prompt: { role: 'Migrations Specialist', task: 'Set up database migrations', context: args,
      instructions: ['1. Configure migration tool', '2. Create initial migration', '3. Set up versioning', '4. Configure rollbacks', '5. Set up seed data', '6. Configure environments', '7. Create migration scripts', '8. Set up CI/CD integration', '9. Configure testing', '10. Document migrations'],
      outputFormat: 'JSON with migrations'
    },
    outputSchema: { type: 'object', required: ['migrations', 'artifacts'], properties: { migrations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'database', 'postgresql', 'migrations']
}));

export const performanceSetupTask = defineTask('pg-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Setup - ${args.projectName}`,
  agent: {
    name: 'database-performance-specialist',
    prompt: { role: 'Database Performance Specialist', task: 'Optimize database performance', context: args,
      instructions: ['1. Configure connection pooling', '2. Set up query optimization', '3. Configure caching', '4. Set up partitioning', '5. Configure vacuuming', '6. Set up monitoring', '7. Configure statistics', '8. Set up query plans', '9. Configure replication', '10. Document performance'],
      outputFormat: 'JSON with performance config'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'database', 'postgresql', 'performance']
}));

export const documentationTask = defineTask('pg-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: { role: 'Technical Writer', task: 'Generate database documentation', context: args,
      instructions: ['1. Create README', '2. Document schema', '3. Create ERD', '4. Document relationships', '5. Create index guide', '6. Document migrations', '7. Create performance guide', '8. Document queries', '9. Create troubleshooting', '10. Generate examples'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'database', 'documentation']
}));
