/**
 * @process specializations/mobile-development/rest-api-integration
 * @description REST API Integration for Mobile Apps - Implement robust API layer with networking,
 * caching, error handling, retry logic, and offline support for mobile applications.
 * @inputs { appName: string, platforms: array, apiBaseUrl?: string, authMethod?: string }
 * @outputs { success: boolean, apiConfig: object, endpoints: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/rest-api-integration', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   apiBaseUrl: 'https://api.example.com',
 *   authMethod: 'jwt'
 * });
 *
 * @references
 * - URLSession: https://developer.apple.com/documentation/foundation/urlsession
 * - Retrofit: https://square.github.io/retrofit/
 * - Axios: https://axios-http.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    apiBaseUrl = '',
    authMethod = 'jwt',
    outputDir = 'rest-api-integration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting REST API Integration: ${appName}`);
  ctx.log('info', `Auth Method: ${authMethod}, Platforms: ${platforms.join(', ')}`);

  const phases = [
    { name: 'api-architecture', title: 'API Architecture Design' },
    { name: 'networking-layer', title: 'Networking Layer Setup' },
    { name: 'api-client', title: 'API Client Implementation' },
    { name: 'authentication', title: 'Authentication Integration' },
    { name: 'request-interceptors', title: 'Request Interceptors' },
    { name: 'response-handling', title: 'Response Handling and Parsing' },
    { name: 'error-handling', title: 'Error Handling Strategy' },
    { name: 'retry-logic', title: 'Retry and Timeout Logic' },
    { name: 'caching-strategy', title: 'Response Caching Strategy' },
    { name: 'offline-queue', title: 'Offline Request Queue' },
    { name: 'rate-limiting', title: 'Rate Limiting Handling' },
    { name: 'logging-debugging', title: 'Logging and Debugging' },
    { name: 'testing', title: 'API Testing Setup' },
    { name: 'documentation', title: 'API Integration Documentation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createAPITask(phase.name, phase.title), {
      appName, platforms, apiBaseUrl, authMethod, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `REST API integration complete for ${appName}. Ready to test API calls?`,
    title: 'API Integration Review',
    context: { runId: ctx.runId, appName, apiBaseUrl, authMethod }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    apiBaseUrl,
    authMethod,
    apiConfig: { status: 'configured', phases: phases.length },
    endpoints: [],
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/rest-api-integration', timestamp: startTime }
  };
}

function createAPITask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'react-native-dev' },
    agent: {
      name: 'cross-platform-architect',
      prompt: {
        role: 'Mobile API Integration Engineer',
        task: `Implement ${title.toLowerCase()} for REST API integration`,
        context: args,
        instructions: [
          `1. Design ${title.toLowerCase()} architecture`,
          `2. Implement for ${args.platforms.join(' and ')}`,
          `3. Configure ${args.authMethod} authentication`,
          `4. Add comprehensive error handling`,
          `5. Document implementation`
        ],
        outputFormat: 'JSON with API details'
      },
      outputSchema: {
        type: 'object',
        required: ['implementation', 'artifacts'],
        properties: { implementation: { type: 'object' }, endpoints: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'api', 'rest', name]
  });
}

export const apiArchitectureTask = createAPITask('api-architecture', 'API Architecture Design');
export const networkingLayerTask = createAPITask('networking-layer', 'Networking Layer Setup');
export const apiClientTask = createAPITask('api-client', 'API Client Implementation');
export const authenticationTask = createAPITask('authentication', 'Authentication Integration');
export const requestInterceptorsTask = createAPITask('request-interceptors', 'Request Interceptors');
export const responseHandlingTask = createAPITask('response-handling', 'Response Handling and Parsing');
export const errorHandlingTask = createAPITask('error-handling', 'Error Handling Strategy');
export const retryLogicTask = createAPITask('retry-logic', 'Retry and Timeout Logic');
export const cachingStrategyTask = createAPITask('caching-strategy', 'Response Caching Strategy');
export const offlineQueueTask = createAPITask('offline-queue', 'Offline Request Queue');
export const rateLimitingTask = createAPITask('rate-limiting', 'Rate Limiting Handling');
export const loggingDebuggingTask = createAPITask('logging-debugging', 'Logging and Debugging');
export const testingTask = createAPITask('testing', 'API Testing Setup');
export const documentationTask = createAPITask('documentation', 'API Integration Documentation');
