/**
 * @process specializations/sdk-platform-development/plugin-extension-architecture
 * @description Designs and implements plugin and extension architecture for SDKs,
 *              enabling third-party extensions, middleware patterns, and hook systems
 *              for SDK customization.
 * @inputs {
 *   sdkName: string,
 *   languages: string[],
 *   extensionPoints: string[],
 *   pluginTypes: string[],
 *   securityRequirements: object
 * }
 * @outputs {
 *   pluginArchitecture: object,
 *   extensionPoints: object,
 *   hookSystem: object,
 *   pluginRegistry: object
 * }
 * @example
 *   inputs: {
 *     sdkName: "extensible-sdk",
 *     languages: ["typescript", "python", "java"],
 *     extensionPoints: ["authentication", "serialization", "transport", "caching"],
 *     pluginTypes: ["middleware", "interceptor", "provider", "adapter"],
 *     securityRequirements: { sandboxed: true, permissionBased: true }
 *   }
 * @references
 *   - https://plugins.gradle.org/docs/
 *   - https://docs.nestjs.com/fundamentals/dynamic-modules
 *   - https://webpack.js.org/concepts/plugins/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { sdkName, languages, extensionPoints, pluginTypes, securityRequirements } = inputs;

  ctx.log.info('Starting plugin and extension architecture design', {
    sdkName,
    languages,
    extensionPoints
  });

  // Phase 1: Plugin Architecture Design
  ctx.log.info('Phase 1: Designing plugin architecture');
  const pluginArchitecture = await ctx.task(pluginArchitectureDesignTask, {
    sdkName,
    languages,
    pluginTypes
  });

  // Phase 2: Extension Points Definition
  ctx.log.info('Phase 2: Defining extension points');
  const extensionPointsDesign = await ctx.task(extensionPointsDefinitionTask, {
    sdkName,
    languages,
    extensionPoints,
    architecture: pluginArchitecture.result
  });

  // Phase 3: Hook System Implementation
  ctx.log.info('Phase 3: Implementing hook system');
  const hookSystem = await ctx.task(hookSystemImplementationTask, {
    sdkName,
    languages,
    extensionPoints: extensionPointsDesign.result
  });

  // Phase 4: Plugin Security
  ctx.log.info('Phase 4: Implementing plugin security');
  const pluginSecurity = await ctx.task(pluginSecurityImplementationTask, {
    sdkName,
    languages,
    securityRequirements,
    architecture: pluginArchitecture.result
  });

  // Phase 5: Plugin Registry and Discovery
  ctx.log.info('Phase 5: Creating plugin registry');
  const pluginRegistry = await ctx.task(pluginRegistryCreationTask, {
    sdkName,
    languages,
    pluginTypes,
    security: pluginSecurity.result
  });

  // Quality Gate
  await ctx.breakpoint('plugin-architecture-review', {
    question: 'Review the plugin architecture. Is the extension system flexible yet secure?',
    context: {
      pluginArchitecture: pluginArchitecture.result,
      extensionPointsDesign: extensionPointsDesign.result,
      hookSystem: hookSystem.result,
      pluginSecurity: pluginSecurity.result
    }
  });

  ctx.log.info('Plugin and extension architecture design completed');

  return {
    pluginArchitecture: pluginArchitecture.result,
    extensionPoints: extensionPointsDesign.result,
    hookSystem: hookSystem.result,
    pluginRegistry: pluginRegistry.result,
    security: pluginSecurity.result
  };
}

export const pluginArchitectureDesignTask = defineTask('plugin-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design plugin architecture',
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK plugin architecture specialist',
      task: `Design plugin architecture for ${args.sdkName}`,
      context: {
        languages: args.languages,
        pluginTypes: args.pluginTypes
      },
      instructions: [
        'Design plugin interface contract and lifecycle',
        'Define plugin manifest/descriptor format',
        'Create plugin loading and initialization patterns',
        'Design plugin dependency resolution',
        'Plan plugin isolation and sandboxing',
        'Define plugin versioning and compatibility',
        'Create plugin debugging and testing infrastructure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        pluginInterface: { type: 'object' },
        manifestFormat: { type: 'object' },
        loadingPatterns: { type: 'object' },
        dependencyResolution: { type: 'object' },
        isolation: { type: 'object' },
        versioning: { type: 'object' }
      },
      required: ['pluginInterface', 'manifestFormat', 'loadingPatterns']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'plugin', 'architecture']
}));

export const extensionPointsDefinitionTask = defineTask('extension-points-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define extension points',
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK extensibility specialist',
      task: `Define extension points for ${args.sdkName}`,
      context: {
        languages: args.languages,
        extensionPoints: args.extensionPoints,
        architecture: args.architecture
      },
      instructions: [
        'Identify all extension points in SDK lifecycle',
        'Design middleware/interceptor chain patterns',
        'Create provider interfaces for swappable components',
        'Define adapter patterns for external integrations',
        'Design event emission points for observers',
        'Create extension point documentation',
        'Define extension point stability levels (stable, experimental)'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        extensionPointCatalog: { type: 'array' },
        middlewareChains: { type: 'object' },
        providerInterfaces: { type: 'object' },
        adapterPatterns: { type: 'object' },
        eventEmissionPoints: { type: 'array' },
        stabilityLevels: { type: 'object' }
      },
      required: ['extensionPointCatalog', 'middlewareChains']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'extension-points', 'extensibility']
}));

export const hookSystemImplementationTask = defineTask('hook-system-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement hook system',
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK hook system engineer',
      task: `Implement hook system for ${args.sdkName}`,
      context: {
        languages: args.languages,
        extensionPoints: args.extensionPoints
      },
      instructions: [
        'Design hook registration and invocation API',
        'Implement synchronous and asynchronous hooks',
        'Create hook priority and ordering system',
        'Design hook context and data passing',
        'Implement hook error handling and fallback',
        'Create waterfall, parallel, and bail hook patterns',
        'Add hook debugging and tracing'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        hookAPI: { type: 'object' },
        hookTypes: { type: 'array' },
        prioritySystem: { type: 'object' },
        contextPassing: { type: 'object' },
        errorHandling: { type: 'object' },
        hookPatterns: { type: 'object' }
      },
      required: ['hookAPI', 'hookTypes', 'hookPatterns']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'hooks', 'extensibility']
}));

export const pluginSecurityImplementationTask = defineTask('plugin-security-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement plugin security',
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Plugin security engineer',
      task: `Implement plugin security for ${args.sdkName}`,
      context: {
        languages: args.languages,
        securityRequirements: args.securityRequirements,
        architecture: args.architecture
      },
      instructions: [
        'Design plugin permission system',
        'Implement capability-based security',
        'Create plugin sandboxing mechanisms',
        'Design plugin code signing and verification',
        'Implement plugin source verification (trusted registries)',
        'Create security audit logging for plugins',
        'Design plugin resource limits and quotas'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        permissionSystem: { type: 'object' },
        capabilityBasedSecurity: { type: 'object' },
        sandboxing: { type: 'object' },
        codeSigning: { type: 'object' },
        sourceVerification: { type: 'object' },
        resourceLimits: { type: 'object' }
      },
      required: ['permissionSystem', 'sandboxing']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'plugin', 'security']
}));

export const pluginRegistryCreationTask = defineTask('plugin-registry-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create plugin registry',
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Plugin ecosystem engineer',
      task: `Create plugin registry for ${args.sdkName}`,
      context: {
        languages: args.languages,
        pluginTypes: args.pluginTypes,
        security: args.security
      },
      instructions: [
        'Design plugin registry API (publish, search, download)',
        'Create plugin discovery mechanisms',
        'Implement plugin versioning and updates',
        'Design plugin ratings and reviews',
        'Create plugin documentation hosting',
        'Implement plugin deprecation and removal',
        'Add plugin analytics and download tracking'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        registryAPI: { type: 'object' },
        discoveryMechanisms: { type: 'array' },
        versioningUpdates: { type: 'object' },
        ratingsReviews: { type: 'object' },
        deprecationPolicy: { type: 'object' },
        analytics: { type: 'object' }
      },
      required: ['registryAPI', 'discoveryMechanisms']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'plugin', 'registry']
}));
