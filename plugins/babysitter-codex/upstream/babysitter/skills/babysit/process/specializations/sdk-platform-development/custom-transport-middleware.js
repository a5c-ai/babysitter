/**
 * @process specializations/sdk-platform-development/custom-transport-middleware
 * @description Implements custom transport layers and middleware systems for SDKs,
 *              enabling pluggable HTTP clients, custom protocols, request/response
 *              interceptors, and transport-agnostic architecture.
 * @inputs {
 *   sdkName: string,
 *   languages: string[],
 *   transportTypes: string[],
 *   middlewareFeatures: string[],
 *   protocolSupport: string[]
 * }
 * @outputs {
 *   transportArchitecture: object,
 *   middlewareSystem: object,
 *   customTransports: object,
 *   integrationGuide: object
 * }
 * @example
 *   inputs: {
 *     sdkName: "api-sdk",
 *     languages: ["typescript", "python", "java", "go"],
 *     transportTypes: ["http", "websocket", "grpc", "custom"],
 *     middlewareFeatures: ["retry", "caching", "logging", "auth", "compression"],
 *     protocolSupport: ["REST", "GraphQL", "gRPC", "WebSocket"]
 *   }
 * @references
 *   - https://axios-http.com/docs/interceptors
 *   - https://grpc.io/docs/guides/
 *   - https://docs.python.org/3/library/http.client.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { sdkName, languages, transportTypes, middlewareFeatures, protocolSupport } = inputs;

  ctx.log.info('Starting custom transport and middleware implementation', {
    sdkName,
    languages,
    transportTypes
  });

  // Phase 1: Transport Architecture Design
  ctx.log.info('Phase 1: Designing transport architecture');
  const transportArchitecture = await ctx.task(transportArchitectureDesignTask, {
    sdkName,
    languages,
    transportTypes
  });

  // Phase 2: Middleware System Implementation
  ctx.log.info('Phase 2: Implementing middleware system');
  const middlewareSystem = await ctx.task(middlewareSystemImplementationTask, {
    sdkName,
    languages,
    middlewareFeatures,
    architecture: transportArchitecture.result
  });

  // Phase 3: Built-in Middleware Creation
  ctx.log.info('Phase 3: Creating built-in middleware');
  const builtInMiddleware = await ctx.task(builtInMiddlewareCreationTask, {
    sdkName,
    languages,
    middlewareFeatures,
    middlewareSystem: middlewareSystem.result
  });

  // Phase 4: Custom Transport Implementation
  ctx.log.info('Phase 4: Implementing custom transports');
  const customTransports = await ctx.task(customTransportImplementationTask, {
    sdkName,
    languages,
    transportTypes,
    protocolSupport
  });

  // Phase 5: Transport Testing and Documentation
  ctx.log.info('Phase 5: Creating testing and documentation');
  const testingDocs = await ctx.task(transportTestingDocsTask, {
    sdkName,
    languages,
    transportArchitecture: transportArchitecture.result,
    middlewareSystem: middlewareSystem.result
  });

  // Quality Gate
  await ctx.breakpoint('transport-middleware-review', {
    question: 'Review the transport and middleware implementation. Is the architecture flexible and performant?',
    context: {
      transportArchitecture: transportArchitecture.result,
      middlewareSystem: middlewareSystem.result,
      customTransports: customTransports.result
    }
  });

  ctx.log.info('Custom transport and middleware implementation completed');

  return {
    transportArchitecture: transportArchitecture.result,
    middlewareSystem: {
      design: middlewareSystem.result,
      builtInMiddleware: builtInMiddleware.result
    },
    customTransports: customTransports.result,
    integrationGuide: testingDocs.result
  };
}

export const transportArchitectureDesignTask = defineTask('transport-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design transport architecture',
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK transport architecture specialist',
      task: `Design transport architecture for ${args.sdkName}`,
      context: {
        languages: args.languages,
        transportTypes: args.transportTypes
      },
      instructions: [
        'Design transport-agnostic interface',
        'Define request/response abstractions',
        'Create transport factory and configuration',
        'Design connection pooling and management',
        'Plan timeout and cancellation handling',
        'Define streaming support patterns',
        'Create transport selection strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        transportInterface: { type: 'object' },
        requestResponseAbstraction: { type: 'object' },
        factoryConfig: { type: 'object' },
        connectionPooling: { type: 'object' },
        timeoutCancellation: { type: 'object' },
        streamingPatterns: { type: 'object' }
      },
      required: ['transportInterface', 'requestResponseAbstraction']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'transport', 'architecture']
}));

export const middlewareSystemImplementationTask = defineTask('middleware-system-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement middleware system',
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK middleware engineer',
      task: `Implement middleware system for ${args.sdkName}`,
      context: {
        languages: args.languages,
        middlewareFeatures: args.middlewareFeatures,
        architecture: args.architecture
      },
      instructions: [
        'Design middleware chain/pipeline pattern',
        'Create request and response interceptors',
        'Implement middleware ordering and priority',
        'Design middleware context and state passing',
        'Create middleware error handling and short-circuiting',
        'Implement async middleware support',
        'Add middleware composition and nesting'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        middlewarePipeline: { type: 'object' },
        interceptorPatterns: { type: 'object' },
        orderingPriority: { type: 'object' },
        contextPassing: { type: 'object' },
        errorHandling: { type: 'object' },
        composition: { type: 'object' }
      },
      required: ['middlewarePipeline', 'interceptorPatterns']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'middleware', 'implementation']
}));

export const builtInMiddlewareCreationTask = defineTask('built-in-middleware-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create built-in middleware',
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK middleware developer',
      task: `Create built-in middleware for ${args.sdkName}`,
      context: {
        languages: args.languages,
        middlewareFeatures: args.middlewareFeatures,
        middlewareSystem: args.middlewareSystem
      },
      instructions: [
        'Implement retry middleware with backoff strategies',
        'Create caching middleware with TTL and invalidation',
        'Implement logging middleware with request/response capture',
        'Create authentication middleware (API key, Bearer, OAuth)',
        'Implement compression middleware (gzip, brotli)',
        'Create rate limiting middleware (client-side)',
        'Implement request signing middleware'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        retryMiddleware: { type: 'object' },
        cachingMiddleware: { type: 'object' },
        loggingMiddleware: { type: 'object' },
        authMiddleware: { type: 'object' },
        compressionMiddleware: { type: 'object' },
        rateLimitingMiddleware: { type: 'object' }
      },
      required: ['retryMiddleware', 'authMiddleware', 'loggingMiddleware']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'middleware', 'built-in']
}));

export const customTransportImplementationTask = defineTask('custom-transport-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement custom transports',
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'Transport protocol engineer',
      task: `Implement custom transports for ${args.sdkName}`,
      context: {
        languages: args.languages,
        transportTypes: args.transportTypes,
        protocolSupport: args.protocolSupport
      },
      instructions: [
        'Implement HTTP transport with fetch/axios/etc adapters',
        'Create WebSocket transport with reconnection',
        'Implement gRPC transport with streaming',
        'Design custom protocol transport interface',
        'Create mock transport for testing',
        'Implement offline/queue transport',
        'Add transport health checking'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        httpTransport: { type: 'object' },
        webSocketTransport: { type: 'object' },
        grpcTransport: { type: 'object' },
        customTransportInterface: { type: 'object' },
        mockTransport: { type: 'object' },
        offlineTransport: { type: 'object' }
      },
      required: ['httpTransport', 'customTransportInterface']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'transport', 'custom']
}));

export const transportTestingDocsTask = defineTask('transport-testing-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create transport testing and documentation',
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'SDK documentation and testing specialist',
      task: `Create testing and documentation for ${args.sdkName} transport`,
      context: {
        languages: args.languages,
        transportArchitecture: args.transportArchitecture,
        middlewareSystem: args.middlewareSystem
      },
      instructions: [
        'Create transport testing utilities and mocks',
        'Design middleware testing helpers',
        'Write transport configuration documentation',
        'Create middleware development guide',
        'Design integration testing patterns',
        'Write custom transport implementation guide',
        'Create troubleshooting documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        testingUtilities: { type: 'object' },
        middlewareTestHelpers: { type: 'object' },
        configurationDocs: { type: 'object' },
        middlewareDevGuide: { type: 'object' },
        integrationTestPatterns: { type: 'object' },
        troubleshootingGuide: { type: 'object' }
      },
      required: ['testingUtilities', 'configurationDocs']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'transport', 'documentation']
}));
