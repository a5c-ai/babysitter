/**
 * @process specializations/mobile-development/graphql-apollo-integration
 * @description GraphQL and Apollo Client Integration - Implement GraphQL API layer with Apollo Client
 * including caching, optimistic updates, subscriptions, and code generation.
 * @inputs { appName: string, platforms: array, graphqlEndpoint?: string, framework?: string }
 * @outputs { success: boolean, apolloConfig: object, queries: array, mutations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/graphql-apollo-integration', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   graphqlEndpoint: 'https://api.example.com/graphql',
 *   framework: 'react-native'
 * });
 *
 * @references
 * - Apollo iOS: https://www.apollographql.com/docs/ios/
 * - Apollo Kotlin: https://www.apollographql.com/docs/kotlin/
 * - Apollo React Native: https://www.apollographql.com/docs/react/integrations/react-native/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    graphqlEndpoint = '',
    framework = 'native',
    outputDir = 'graphql-apollo'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GraphQL Apollo Integration: ${appName}`);
  ctx.log('info', `Framework: ${framework}, Platforms: ${platforms.join(', ')}`);

  const phases = [
    { name: 'schema-setup', title: 'GraphQL Schema Setup' },
    { name: 'apollo-client-config', title: 'Apollo Client Configuration' },
    { name: 'code-generation', title: 'Code Generation Setup' },
    { name: 'query-implementation', title: 'Query Implementation' },
    { name: 'mutation-implementation', title: 'Mutation Implementation' },
    { name: 'subscription-setup', title: 'Subscription Setup' },
    { name: 'cache-configuration', title: 'Cache Configuration' },
    { name: 'optimistic-updates', title: 'Optimistic UI Updates' },
    { name: 'pagination', title: 'Pagination Implementation' },
    { name: 'error-handling', title: 'Error Handling and Retry' },
    { name: 'authentication', title: 'Authentication Integration' },
    { name: 'offline-support', title: 'Offline Support' },
    { name: 'testing', title: 'GraphQL Testing Setup' },
    { name: 'documentation', title: 'GraphQL Documentation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createGraphQLTask(phase.name, phase.title), {
      appName, platforms, graphqlEndpoint, framework, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `GraphQL Apollo integration complete for ${appName}. Ready to test queries?`,
    title: 'GraphQL Review',
    context: { runId: ctx.runId, appName, graphqlEndpoint, framework }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    graphqlEndpoint,
    framework,
    apolloConfig: { status: 'configured', phases: phases.length },
    queries: [],
    mutations: [],
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/graphql-apollo-integration', timestamp: startTime }
  };
}

function createGraphQLTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'react-native-dev' },
    agent: {
      name: 'cross-platform-architect',
      prompt: {
        role: 'GraphQL Mobile Engineer',
        task: `Implement ${title.toLowerCase()} for Apollo integration`,
        context: args,
        instructions: [
          `1. Set up ${title.toLowerCase()} with Apollo`,
          `2. Configure for ${args.platforms.join(' and ')}`,
          `3. Integrate with ${args.framework} framework`,
          `4. Implement type-safe operations`,
          `5. Document implementation`
        ],
        outputFormat: 'JSON with GraphQL details'
      },
      outputSchema: {
        type: 'object',
        required: ['config', 'artifacts'],
        properties: { config: { type: 'object' }, operations: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'graphql', 'apollo', name]
  });
}

export const schemaSetupTask = createGraphQLTask('schema-setup', 'GraphQL Schema Setup');
export const apolloClientTask = createGraphQLTask('apollo-client-config', 'Apollo Client Configuration');
export const codeGenerationTask = createGraphQLTask('code-generation', 'Code Generation Setup');
export const queryImplementationTask = createGraphQLTask('query-implementation', 'Query Implementation');
export const mutationImplementationTask = createGraphQLTask('mutation-implementation', 'Mutation Implementation');
export const subscriptionSetupTask = createGraphQLTask('subscription-setup', 'Subscription Setup');
export const cacheConfigurationTask = createGraphQLTask('cache-configuration', 'Cache Configuration');
export const optimisticUpdatesTask = createGraphQLTask('optimistic-updates', 'Optimistic UI Updates');
export const paginationTask = createGraphQLTask('pagination', 'Pagination Implementation');
export const errorHandlingTask = createGraphQLTask('error-handling', 'Error Handling and Retry');
export const authenticationTask = createGraphQLTask('authentication', 'Authentication Integration');
export const offlineSupportTask = createGraphQLTask('offline-support', 'Offline Support');
export const testingTask = createGraphQLTask('testing', 'GraphQL Testing Setup');
export const documentationTask = createGraphQLTask('documentation', 'GraphQL Documentation');
