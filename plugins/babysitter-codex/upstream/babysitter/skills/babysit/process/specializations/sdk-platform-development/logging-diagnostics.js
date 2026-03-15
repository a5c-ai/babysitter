/**
 * @process specializations/sdk-platform-development/logging-diagnostics
 * @description Implements comprehensive logging and diagnostics capabilities for SDKs,
 *              including structured logging, log levels, log sinks, and diagnostic
 *              data collection for troubleshooting.
 * @inputs {
 *   sdkName: string,
 *   languages: string[],
 *   logLevels: string[],
 *   logSinks: string[],
 *   diagnosticFeatures: string[]
 * }
 * @outputs {
 *   loggingFramework: object,
 *   diagnosticTools: object,
 *   integrationGuide: object,
 *   configurationOptions: object
 * }
 * @example
 *   inputs: {
 *     sdkName: "analytics-sdk",
 *     languages: ["typescript", "python", "go"],
 *     logLevels: ["trace", "debug", "info", "warn", "error", "fatal"],
 *     logSinks: ["console", "file", "cloud", "custom"],
 *     diagnosticFeatures: ["health-checks", "connectivity-tests", "performance-profiling"]
 *   }
 * @references
 *   - https://www.slf4j.org/
 *   - https://docs.python.org/3/library/logging.html
 *   - https://pkg.go.dev/log/slog
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { sdkName, languages, logLevels, logSinks, diagnosticFeatures } = inputs;

  ctx.log.info('Starting logging and diagnostics implementation', {
    sdkName,
    languages,
    logLevels
  });

  // Phase 1: Logging Framework Design
  ctx.log.info('Phase 1: Designing logging framework');
  const loggingFramework = await ctx.task(loggingFrameworkDesignTask, {
    sdkName,
    languages,
    logLevels
  });

  // Phase 2: Log Sink Implementation
  ctx.log.info('Phase 2: Implementing log sinks');
  const logSinkImplementation = await ctx.task(logSinkImplementationTask, {
    sdkName,
    languages,
    logSinks,
    framework: loggingFramework.result
  });

  // Phase 3: Structured Logging Setup
  ctx.log.info('Phase 3: Setting up structured logging');
  const structuredLogging = await ctx.task(structuredLoggingSetupTask, {
    sdkName,
    languages,
    framework: loggingFramework.result
  });

  // Phase 4: Diagnostic Tools Creation
  ctx.log.info('Phase 4: Creating diagnostic tools');
  const diagnosticTools = await ctx.task(diagnosticToolsCreationTask, {
    sdkName,
    languages,
    diagnosticFeatures
  });

  // Phase 5: Configuration System
  ctx.log.info('Phase 5: Implementing configuration system');
  const configSystem = await ctx.task(loggingConfigurationTask, {
    sdkName,
    languages,
    logLevels,
    logSinks
  });

  // Quality Gate
  await ctx.breakpoint('logging-diagnostics-review', {
    question: 'Review the logging and diagnostics implementation. Is the logging framework comprehensive and performant?',
    context: {
      loggingFramework: loggingFramework.result,
      structuredLogging: structuredLogging.result,
      diagnosticTools: diagnosticTools.result
    }
  });

  ctx.log.info('Logging and diagnostics implementation completed');

  return {
    loggingFramework: {
      design: loggingFramework.result,
      logSinks: logSinkImplementation.result,
      structuredLogging: structuredLogging.result
    },
    diagnosticTools: diagnosticTools.result,
    integrationGuide: {
      sdkName,
      languages,
      supportedLogLevels: logLevels,
      availableSinks: logSinks
    },
    configurationOptions: configSystem.result
  };
}

export const loggingFrameworkDesignTask = defineTask('logging-framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design logging framework',
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'SDK logging architect',
      task: `Design comprehensive logging framework for ${args.sdkName}`,
      context: {
        languages: args.languages,
        logLevels: args.logLevels
      },
      instructions: [
        'Design logger interface compatible with all target languages',
        'Define log level hierarchy and filtering',
        'Create logger factory and configuration patterns',
        'Design log context propagation (correlation IDs, request context)',
        'Plan logger inheritance and child logger patterns',
        'Define performance requirements (async logging, buffering)',
        'Create integration points with popular logging frameworks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        loggerInterface: { type: 'object' },
        logLevelHierarchy: { type: 'object' },
        factoryPatterns: { type: 'object' },
        contextPropagation: { type: 'object' },
        performanceConfig: { type: 'object' }
      },
      required: ['loggerInterface', 'logLevelHierarchy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'logging', 'framework-design']
}));

export const logSinkImplementationTask = defineTask('log-sink-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement log sinks',
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Logging infrastructure engineer',
      task: `Implement log sinks for ${args.sdkName}`,
      context: {
        languages: args.languages,
        logSinks: args.logSinks,
        framework: args.framework
      },
      instructions: [
        'Implement console sink with color and formatting options',
        'Create file sink with rotation and retention policies',
        'Design cloud sink adapters (CloudWatch, Stackdriver, Azure Monitor)',
        'Implement custom sink interface for extensibility',
        'Add sink multiplexing (write to multiple destinations)',
        'Create sink filtering (different levels to different sinks)',
        'Design async sink with batching and backpressure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        consoleSink: { type: 'object' },
        fileSink: { type: 'object' },
        cloudSinks: { type: 'array' },
        customSinkInterface: { type: 'object' },
        multiplexingConfig: { type: 'object' }
      },
      required: ['consoleSink', 'customSinkInterface']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'logging', 'sinks']
}));

export const structuredLoggingSetupTask = defineTask('structured-logging-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup structured logging',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Observability engineer',
      task: `Setup structured logging for ${args.sdkName}`,
      context: {
        languages: args.languages,
        framework: args.framework
      },
      instructions: [
        'Define structured log format (JSON, logfmt)',
        'Create standard field definitions (timestamp, level, message, etc.)',
        'Implement contextual fields (user ID, request ID, operation)',
        'Design sensitive data masking/redaction',
        'Add metric extraction from structured logs',
        'Create log parsing and querying helpers',
        'Implement log correlation across SDK calls'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        logFormat: { type: 'object' },
        standardFields: { type: 'array' },
        contextualFields: { type: 'object' },
        dataMasking: { type: 'object' },
        correlationSetup: { type: 'object' }
      },
      required: ['logFormat', 'standardFields']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'structured-logging', 'observability']
}));

export const diagnosticToolsCreationTask = defineTask('diagnostic-tools-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create diagnostic tools',
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'SDK diagnostics specialist',
      task: `Create diagnostic tools for ${args.sdkName}`,
      context: {
        languages: args.languages,
        diagnosticFeatures: args.diagnosticFeatures
      },
      instructions: [
        'Implement health check endpoints and methods',
        'Create connectivity test utilities',
        'Design configuration validation diagnostics',
        'Add performance profiling tools',
        'Implement diagnostic report generation',
        'Create self-test functionality',
        'Add dependency verification checks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        healthChecks: { type: 'object' },
        connectivityTests: { type: 'object' },
        configValidation: { type: 'object' },
        performanceProfiling: { type: 'object' },
        diagnosticReports: { type: 'object' }
      },
      required: ['healthChecks', 'diagnosticReports']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'diagnostics', 'tools']
}));

export const loggingConfigurationTask = defineTask('logging-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement logging configuration',
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK configuration engineer',
      task: `Implement logging configuration system for ${args.sdkName}`,
      context: {
        languages: args.languages,
        logLevels: args.logLevels,
        logSinks: args.logSinks
      },
      instructions: [
        'Design configuration file formats (YAML, JSON, TOML)',
        'Implement environment variable configuration',
        'Create programmatic configuration API',
        'Add runtime reconfiguration support',
        'Design configuration validation and defaults',
        'Implement configuration inheritance/merging',
        'Create configuration documentation generator'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        configFormats: { type: 'array' },
        environmentVariables: { type: 'object' },
        programmaticAPI: { type: 'object' },
        runtimeReconfiguration: { type: 'object' },
        validationRules: { type: 'object' }
      },
      required: ['configFormats', 'programmaticAPI']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'logging', 'configuration']
}));
