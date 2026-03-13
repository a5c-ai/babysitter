/**
 * @process specializations/sdk-platform-development/error-handling-debugging-support
 * @description Implements comprehensive error handling and debugging support for SDKs,
 *              including structured error types, error codes, stack trace handling,
 *              debug modes, and developer-friendly error messages.
 * @inputs {
 *   sdkName: string,
 *   languages: string[],
 *   errorCategories: string[],
 *   debugFeatures: string[],
 *   existingPatterns?: object
 * }
 * @outputs {
 *   errorHandlingDesign: object,
 *   errorCatalog: object,
 *   debuggingTools: object,
 *   implementationGuide: object
 * }
 * @example
 *   inputs: {
 *     sdkName: "payment-sdk",
 *     languages: ["typescript", "python", "java"],
 *     errorCategories: ["validation", "network", "authentication", "business-logic"],
 *     debugFeatures: ["verbose-logging", "request-tracing", "mock-mode"]
 *   }
 * @references
 *   - https://www.baeldung.com/java-exceptions
 *   - https://docs.python.org/3/tutorial/errors.html
 *   - https://stripe.com/docs/error-codes
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { sdkName, languages, errorCategories, debugFeatures } = inputs;

  ctx.log.info('Starting error handling and debugging support implementation', {
    sdkName,
    languages,
    errorCategories
  });

  // Phase 1: Error Architecture Design
  ctx.log.info('Phase 1: Designing error architecture');
  const errorArchitecture = await ctx.task(errorArchitectureDesignTask, {
    sdkName,
    languages,
    errorCategories
  });

  // Phase 2: Error Catalog Creation
  ctx.log.info('Phase 2: Creating error catalog');
  const errorCatalog = await ctx.task(errorCatalogCreationTask, {
    sdkName,
    errorCategories,
    architecture: errorArchitecture.result
  });

  // Phase 3: Debug Mode Implementation
  ctx.log.info('Phase 3: Implementing debug modes');
  const debugModes = await ctx.task(debugModeImplementationTask, {
    sdkName,
    languages,
    debugFeatures
  });

  // Phase 4: Stack Trace and Context Handling
  ctx.log.info('Phase 4: Implementing stack trace handling');
  const stackTraceHandling = await ctx.task(stackTraceHandlingTask, {
    sdkName,
    languages,
    errorArchitecture: errorArchitecture.result
  });

  // Phase 5: Developer Tools Integration
  ctx.log.info('Phase 5: Creating developer debugging tools');
  const developerTools = await ctx.task(developerToolsIntegrationTask, {
    sdkName,
    languages,
    debugModes: debugModes.result,
    stackTraceHandling: stackTraceHandling.result
  });

  // Quality Gate
  await ctx.breakpoint('error-handling-review', {
    question: 'Review the error handling and debugging implementation. Are error messages clear and actionable?',
    context: {
      errorArchitecture: errorArchitecture.result,
      errorCatalog: errorCatalog.result,
      debugModes: debugModes.result
    }
  });

  ctx.log.info('Error handling and debugging support implementation completed');

  return {
    errorHandlingDesign: errorArchitecture.result,
    errorCatalog: errorCatalog.result,
    debuggingTools: {
      debugModes: debugModes.result,
      stackTraceHandling: stackTraceHandling.result,
      developerTools: developerTools.result
    },
    implementationGuide: {
      sdkName,
      languages,
      errorCategories,
      debugFeatures
    }
  };
}

export const errorArchitectureDesignTask = defineTask('error-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design error handling architecture',
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'SDK error handling architect',
      task: `Design comprehensive error handling architecture for ${args.sdkName}`,
      context: {
        languages: args.languages,
        errorCategories: args.errorCategories
      },
      instructions: [
        'Design error class hierarchy with base and specialized types',
        'Define error code structure (namespace, category, specific code)',
        'Create error message templates with i18n support',
        'Design error context/metadata capture mechanisms',
        'Plan error serialization for logging and transmission',
        'Define retry guidance per error type',
        'Create error wrapping strategy for underlying exceptions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        errorHierarchy: { type: 'object' },
        errorCodeStructure: { type: 'object' },
        messageTemplates: { type: 'object' },
        contextCapture: { type: 'object' },
        serializationFormat: { type: 'object' },
        retryGuidance: { type: 'object' }
      },
      required: ['errorHierarchy', 'errorCodeStructure', 'messageTemplates']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'error-handling', 'architecture']
}));

export const errorCatalogCreationTask = defineTask('error-catalog-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive error catalog',
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'SDK error documentation specialist',
      task: `Create comprehensive error catalog for ${args.sdkName}`,
      context: {
        errorCategories: args.errorCategories,
        architecture: args.architecture
      },
      instructions: [
        'Define all error codes with unique identifiers',
        'Write clear, actionable error messages',
        'Document cause and resolution for each error',
        'Include code examples showing error handling',
        'Create troubleshooting guides per error category',
        'Add links to relevant documentation',
        'Define error severity levels'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        errors: { type: 'array' },
        categorizedErrors: { type: 'object' },
        troubleshootingGuides: { type: 'object' },
        severityMatrix: { type: 'object' }
      },
      required: ['errors', 'categorizedErrors']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'error-catalog', 'documentation']
}));

export const debugModeImplementationTask = defineTask('debug-mode-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SDK debug modes',
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'SDK debugging specialist',
      task: `Implement debug modes for ${args.sdkName}`,
      context: {
        languages: args.languages,
        debugFeatures: args.debugFeatures
      },
      instructions: [
        'Design debug mode activation (environment variable, config, programmatic)',
        'Implement verbose logging with log levels',
        'Create request/response logging with sanitization',
        'Add timing and performance metrics in debug mode',
        'Implement mock mode for offline development',
        'Create debug output formatters (console, file, custom)',
        'Add debug assertions and invariant checks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        debugModeActivation: { type: 'object' },
        loggingImplementation: { type: 'object' },
        mockModeDesign: { type: 'object' },
        debugOutputFormats: { type: 'array' }
      },
      required: ['debugModeActivation', 'loggingImplementation']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'debugging', 'implementation']
}));

export const stackTraceHandlingTask = defineTask('stack-trace-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement stack trace handling',
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'Error diagnostics engineer',
      task: `Implement stack trace handling for ${args.sdkName}`,
      context: {
        languages: args.languages,
        errorArchitecture: args.errorArchitecture
      },
      instructions: [
        'Design stack trace capture and preservation',
        'Implement cross-language stack trace normalization',
        'Add source map support for minified code',
        'Create stack trace filtering (hide internal frames)',
        'Implement error cause chain preservation',
        'Add async stack trace support',
        'Design stack trace serialization for reporting'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        stackTraceCapture: { type: 'object' },
        normalization: { type: 'object' },
        sourceMapSupport: { type: 'object' },
        filteringRules: { type: 'array' },
        asyncSupport: { type: 'object' }
      },
      required: ['stackTraceCapture', 'filteringRules']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'stack-trace', 'diagnostics']
}));

export const developerToolsIntegrationTask = defineTask('developer-tools-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create developer debugging tools',
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Developer tools engineer',
      task: `Create debugging tools integration for ${args.sdkName}`,
      context: {
        languages: args.languages,
        debugModes: args.debugModes,
        stackTraceHandling: args.stackTraceHandling
      },
      instructions: [
        'Create IDE integration for debugging (VS Code, IntelliJ)',
        'Implement browser DevTools integration for JS SDKs',
        'Design CLI debugging tools and commands',
        'Create debug inspection endpoints',
        'Implement request replay functionality',
        'Add error reproduction helpers',
        'Create diagnostic report generation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        ideIntegration: { type: 'object' },
        browserDevTools: { type: 'object' },
        cliTools: { type: 'array' },
        diagnosticReports: { type: 'object' }
      },
      required: ['ideIntegration', 'cliTools']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-tools', 'debugging']
}));
