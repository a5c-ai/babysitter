/**
 * @process specializations/web-development/graphql-api-apollo
 * @description GraphQL API Development with Apollo Server - Comprehensive process for building GraphQL APIs with Apollo Server,
 * schema design, resolvers, data loaders, subscriptions, and integration with databases.
 * @inputs { projectName: string, database?: string, features?: object, subscriptions?: boolean }
 * @outputs { success: boolean, schema: object, resolvers: array, dataloaders: array, artifacts: array }
 *
 * @references
 * - GraphQL Specification: https://graphql.org/
 * - Apollo Server Documentation: https://www.apollographql.com/docs/apollo-server/
 * - DataLoader: https://github.com/graphql/dataloader
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    database = 'postgresql',
    features = { federation: false, caching: true },
    subscriptions = false,
    outputDir = 'graphql-api-apollo'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GraphQL API Development: ${projectName}`);

  const projectSetup = await ctx.task(projectSetupTask, { projectName, outputDir });
  artifacts.push(...projectSetup.artifacts);

  const schemaDesign = await ctx.task(schemaDesignTask, { projectName, database, outputDir });
  artifacts.push(...schemaDesign.artifacts);

  const resolversSetup = await ctx.task(resolversSetupTask, { projectName, schemaDesign, outputDir });
  artifacts.push(...resolversSetup.artifacts);

  const dataloadersSetup = await ctx.task(dataloadersSetupTask, { projectName, schemaDesign, outputDir });
  artifacts.push(...dataloadersSetup.artifacts);

  const contextSetup = await ctx.task(contextSetupTask, { projectName, outputDir });
  artifacts.push(...contextSetup.artifacts);

  if (subscriptions) {
    const subscriptionsSetup = await ctx.task(subscriptionsSetupTask, { projectName, outputDir });
    artifacts.push(...subscriptionsSetup.artifacts);
  }

  const authSetup = await ctx.task(authSetupTask, { projectName, outputDir });
  artifacts.push(...authSetup.artifacts);

  await ctx.breakpoint({
    question: `GraphQL API setup complete for ${projectName}. Schema with ${schemaDesign.types.length} types, ${resolversSetup.resolvers.length} resolvers. Approve?`,
    title: 'GraphQL API Review',
    context: { runId: ctx.runId, types: schemaDesign.types, resolvers: resolversSetup.resolvers }
  });

  const testingSetup = await ctx.task(testingSetupTask, { projectName, outputDir });
  artifacts.push(...testingSetup.artifacts);

  const documentation = await ctx.task(documentationTask, { projectName, schemaDesign, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    schema: schemaDesign.schema,
    resolvers: resolversSetup.resolvers,
    dataloaders: dataloadersSetup.loaders,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/graphql-api-apollo', timestamp: startTime }
  };
}

export const projectSetupTask = defineTask('graphql-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `GraphQL Setup - ${args.projectName}`,
  skill: {
    name: 'graphql-skill',
    prompt: {
      role: 'GraphQL Developer',
      task: 'Set up Apollo Server project',
      context: args,
      instructions: ['1. Initialize Apollo Server', '2. Configure TypeScript', '3. Set up folder structure', '4. Configure plugins', '5. Set up error handling', '6. Configure CORS', '7. Set up logging', '8. Configure environment', '9. Set up introspection', '10. Document setup'],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'apollo', 'setup']
}));

export const schemaDesignTask = defineTask('graphql-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: `GraphQL Schema Design - ${args.projectName}`,
  agent: {
    name: 'api-developer-agent',
    prompt: {
      role: 'GraphQL Schema Architect',
      task: 'Design GraphQL schema',
      context: args,
      instructions: ['1. Design type definitions', '2. Create input types', '3. Define queries', '4. Create mutations', '5. Design subscriptions', '6. Set up enums', '7. Create interfaces', '8. Implement unions', '9. Design custom scalars', '10. Document schema'],
      outputFormat: 'JSON with schema design'
    },
    outputSchema: { type: 'object', required: ['schema', 'types', 'artifacts'], properties: { schema: { type: 'object' }, types: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'schema']
}));

export const resolversSetupTask = defineTask('graphql-resolvers', (args, taskCtx) => ({
  kind: 'agent',
  title: `GraphQL Resolvers - ${args.projectName}`,
  agent: {
    name: 'graphql-resolver-developer',
    prompt: {
      role: 'GraphQL Resolver Developer',
      task: 'Implement resolvers',
      context: args,
      instructions: ['1. Create query resolvers', '2. Implement mutation resolvers', '3. Create field resolvers', '4. Implement N+1 prevention', '5. Set up resolver chains', '6. Create error handling', '7. Implement authorization', '8. Set up validation', '9. Create resolver utilities', '10. Document resolvers'],
      outputFormat: 'JSON with resolvers'
    },
    outputSchema: { type: 'object', required: ['resolvers', 'artifacts'], properties: { resolvers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'resolvers']
}));

export const dataloadersSetupTask = defineTask('graphql-dataloaders', (args, taskCtx) => ({
  kind: 'agent',
  title: `DataLoaders Setup - ${args.projectName}`,
  agent: {
    name: 'dataloader-specialist',
    prompt: {
      role: 'DataLoader Specialist',
      task: 'Implement DataLoaders for batching',
      context: args,
      instructions: ['1. Create DataLoader factory', '2. Implement batch functions', '3. Set up caching', '4. Create per-request loaders', '5. Implement cache key functions', '6. Set up error handling', '7. Create composite loaders', '8. Implement priming', '9. Set up monitoring', '10. Document patterns'],
      outputFormat: 'JSON with dataloaders'
    },
    outputSchema: { type: 'object', required: ['loaders', 'artifacts'], properties: { loaders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'dataloader']
}));

export const contextSetupTask = defineTask('graphql-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `GraphQL Context Setup - ${args.projectName}`,
  agent: {
    name: 'graphql-context-specialist',
    prompt: {
      role: 'GraphQL Context Specialist',
      task: 'Set up request context',
      context: args,
      instructions: ['1. Create context factory', '2. Set up authentication', '3. Initialize dataloaders', '4. Add database connection', '5. Set up request tracking', '6. Add user context', '7. Configure permissions', '8. Set up utilities', '9. Add logging', '10. Document context'],
      outputFormat: 'JSON with context setup'
    },
    outputSchema: { type: 'object', required: ['context', 'artifacts'], properties: { context: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'context']
}));

export const subscriptionsSetupTask = defineTask('graphql-subscriptions', (args, taskCtx) => ({
  kind: 'agent',
  title: `GraphQL Subscriptions - ${args.projectName}`,
  agent: {
    name: 'subscriptions-specialist',
    prompt: {
      role: 'GraphQL Subscriptions Specialist',
      task: 'Implement subscriptions',
      context: args,
      instructions: ['1. Set up WebSocket server', '2. Create subscription resolvers', '3. Implement PubSub', '4. Set up authentication', '5. Create subscription filters', '6. Implement connection handling', '7. Set up Redis PubSub', '8. Create subscription utilities', '9. Handle disconnections', '10. Document subscriptions'],
      outputFormat: 'JSON with subscriptions setup'
    },
    outputSchema: { type: 'object', required: ['subscriptions', 'artifacts'], properties: { subscriptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'subscriptions']
}));

export const authSetupTask = defineTask('graphql-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `GraphQL Authentication - ${args.projectName}`,
  agent: {
    name: 'auth-specialist-agent',
    prompt: {
      role: 'GraphQL Auth Specialist',
      task: 'Implement authentication and authorization',
      context: args,
      instructions: ['1. Set up JWT handling', '2. Create auth directives', '3. Implement field-level auth', '4. Set up role-based access', '5. Create auth middleware', '6. Implement API keys', '7. Set up rate limiting', '8. Create auth utilities', '9. Implement refresh tokens', '10. Document auth'],
      outputFormat: 'JSON with auth setup'
    },
    outputSchema: { type: 'object', required: ['auth', 'artifacts'], properties: { auth: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'authentication']
}));

export const testingSetupTask = defineTask('graphql-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `GraphQL Testing - ${args.projectName}`,
  agent: {
    name: 'graphql-testing-specialist',
    prompt: {
      role: 'GraphQL Testing Specialist',
      task: 'Set up GraphQL testing',
      context: args,
      instructions: ['1. Configure test server', '2. Create query tests', '3. Implement mutation tests', '4. Set up resolver tests', '5. Create mock context', '6. Test subscriptions', '7. Set up coverage', '8. Create fixtures', '9. Implement integration tests', '10. Document testing'],
      outputFormat: 'JSON with testing setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'testing']
}));

export const documentationTask = defineTask('graphql-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `GraphQL Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate GraphQL documentation',
      context: args,
      instructions: ['1. Create README', '2. Document schema', '3. Create query examples', '4. Document mutations', '5. Create authentication guide', '6. Document subscriptions', '7. Create error handling guide', '8. Document best practices', '9. Create playground guide', '10. Generate SDL docs'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'graphql', 'documentation']
}));
