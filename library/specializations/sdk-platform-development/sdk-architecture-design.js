/**
 * @process specializations/sdk-platform-development/sdk-architecture-design
 * @description SDK Architecture Design - Design the overall SDK architecture including core components, service layers,
 * and extension points for building robust, maintainable developer tools.
 * @inputs { projectName: string, targetLanguages?: array, apiType?: string, authPatterns?: array, extensibility?: object }
 * @outputs { success: boolean, architecture: object, componentDiagrams: array, designDecisions: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/sdk-architecture-design', {
 *   projectName: 'CloudAPI SDK',
 *   targetLanguages: ['typescript', 'python', 'go'],
 *   apiType: 'REST',
 *   authPatterns: ['api-key', 'oauth2'],
 *   extensibility: { plugins: true, middleware: true, customTransports: true }
 * });
 *
 * @references
 * - Azure SDK Guidelines: https://azure.github.io/azure-sdk/
 * - Google API Design Guide: https://cloud.google.com/apis/design
 * - Stripe API Design: https://stripe.com/docs/api
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetLanguages = ['typescript', 'python'],
    apiType = 'REST',
    authPatterns = ['api-key'],
    extensibility = { plugins: true, middleware: true, customTransports: false },
    serializationFormats = ['json'],
    outputDir = 'sdk-architecture-design'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SDK Architecture Design: ${projectName}`);
  ctx.log('info', `Target Languages: ${targetLanguages.join(', ')}`);
  ctx.log('info', `API Type: ${apiType}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS AND CONSTRAINTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and constraints');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    targetLanguages,
    apiType,
    authPatterns,
    extensibility,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: COMPONENT HIERARCHY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing component hierarchy (Core, Service, Utility, Extension layers)');

  const componentHierarchy = await ctx.task(componentHierarchyTask, {
    projectName,
    targetLanguages,
    apiType,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...componentHierarchy.artifacts);

  // ============================================================================
  // PHASE 3: AUTHENTICATION INTEGRATION PATTERNS
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing authentication integration patterns');

  const authDesign = await ctx.task(authIntegrationTask, {
    projectName,
    authPatterns,
    apiType,
    componentHierarchy,
    outputDir
  });

  artifacts.push(...authDesign.artifacts);

  // ============================================================================
  // PHASE 4: SERIALIZATION AND TRANSPORT STRATEGIES
  // ============================================================================

  ctx.log('info', 'Phase 4: Planning serialization and transport strategies');

  const transportDesign = await ctx.task(transportStrategyTask, {
    projectName,
    apiType,
    serializationFormats,
    componentHierarchy,
    outputDir
  });

  artifacts.push(...transportDesign.artifacts);

  // ============================================================================
  // PHASE 5: EXTENSION AND PLUGIN ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 5: Establishing extension and plugin architecture');

  const extensionDesign = await ctx.task(extensionArchitectureTask, {
    projectName,
    extensibility,
    componentHierarchy,
    outputDir
  });

  artifacts.push(...extensionDesign.artifacts);

  // Quality Gate: Architecture Review
  await ctx.breakpoint({
    question: `SDK Architecture design complete for ${projectName}. Component layers: ${componentHierarchy.layers.length}, Auth patterns: ${authPatterns.length}, Extension points: ${extensionDesign.extensionPoints.length}. Approve architecture design?`,
    title: 'SDK Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      layers: componentHierarchy.layers,
      authPatterns,
      extensionPoints: extensionDesign.extensionPoints,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 6: ERROR HANDLING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing error handling strategy');

  const errorStrategy = await ctx.task(errorHandlingStrategyTask, {
    projectName,
    targetLanguages,
    apiType,
    componentHierarchy,
    outputDir
  });

  artifacts.push(...errorStrategy.artifacts);

  // ============================================================================
  // PHASE 7: CONFIGURATION MANAGEMENT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing configuration management');

  const configDesign = await ctx.task(configurationManagementTask, {
    projectName,
    targetLanguages,
    componentHierarchy,
    outputDir
  });

  artifacts.push(...configDesign.artifacts);

  // ============================================================================
  // PHASE 8: ARCHITECTURE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating architecture documentation');

  const documentation = await ctx.task(architectureDocumentationTask, {
    projectName,
    requirementsAnalysis,
    componentHierarchy,
    authDesign,
    transportDesign,
    extensionDesign,
    errorStrategy,
    configDesign,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `SDK Architecture Design complete for ${projectName}. Review all design artifacts and approve?`,
    title: 'Architecture Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        targetLanguages,
        apiType,
        componentLayers: componentHierarchy.layers.length,
        authPatterns: authPatterns.length,
        extensionPoints: extensionDesign.extensionPoints.length
      },
      files: [
        { path: documentation.architectureDocPath, format: 'markdown', label: 'Architecture Document' },
        { path: documentation.componentDiagramPath, format: 'markdown', label: 'Component Diagrams' },
        { path: documentation.designDecisionsPath, format: 'markdown', label: 'Design Decisions' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    architecture: {
      layers: componentHierarchy.layers,
      components: componentHierarchy.components,
      dependencies: componentHierarchy.dependencies
    },
    authDesign: {
      patterns: authDesign.patterns,
      flows: authDesign.flows
    },
    transportDesign: {
      strategies: transportDesign.strategies,
      serialization: transportDesign.serialization
    },
    extensionPoints: extensionDesign.extensionPoints,
    errorHandling: errorStrategy.strategy,
    configuration: configDesign.configStrategy,
    componentDiagrams: documentation.diagrams,
    designDecisions: documentation.decisions,
    documentation: {
      architectureDoc: documentation.architectureDocPath,
      componentDiagram: documentation.componentDiagramPath,
      designDecisions: documentation.designDecisionsPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/sdk-architecture-design',
      timestamp: startTime,
      targetLanguages,
      apiType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'Senior SDK Architect with expertise in developer tools and API design',
      task: 'Analyze requirements and constraints for SDK architecture',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        apiType: args.apiType,
        authPatterns: args.authPatterns,
        extensibility: args.extensibility,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze target language requirements and idioms',
        '2. Document API type constraints (REST, GraphQL, gRPC)',
        '3. Identify authentication and security requirements',
        '4. Assess extensibility and customization needs',
        '5. Evaluate performance and scalability requirements',
        '6. Document backward compatibility requirements',
        '7. Identify cross-language consistency needs',
        '8. Assess developer experience priorities',
        '9. Document integration constraints',
        '10. Generate requirements analysis report'
      ],
      outputFormat: 'JSON with requirements analysis and constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'constraints', 'artifacts'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              requirement: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        languageConsiderations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'architecture', 'requirements-analysis']
}));

export const componentHierarchyTask = defineTask('component-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Component Hierarchy Design - ${args.projectName}`,
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK Component Architect',
      task: 'Design SDK component hierarchy with Core, Service, Utility, and Extension layers',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        apiType: args.apiType,
        requirementsAnalysis: args.requirementsAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design Core layer (HTTP client, authentication, serialization)',
        '2. Design Service layer (resource clients, request builders)',
        '3. Design Utility layer (validators, formatters, helpers)',
        '4. Design Extension layer (middleware, plugins, interceptors)',
        '5. Define component interfaces and contracts',
        '6. Establish dependency relationships between layers',
        '7. Design component initialization and lifecycle',
        '8. Plan component testing strategy',
        '9. Create component interaction diagrams',
        '10. Document component hierarchy'
      ],
      outputFormat: 'JSON with component hierarchy design'
    },
    outputSchema: {
      type: 'object',
      required: ['layers', 'components', 'dependencies', 'artifacts'],
      properties: {
        layers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              layer: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              interfaces: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'architecture', 'components']
}));

export const authIntegrationTask = defineTask('auth-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Authentication Integration Design - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'SDK Security Architect',
      task: 'Design authentication integration patterns for SDK',
      context: {
        projectName: args.projectName,
        authPatterns: args.authPatterns,
        apiType: args.apiType,
        componentHierarchy: args.componentHierarchy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design API key authentication pattern',
        '2. Design OAuth 2.0 / OpenID Connect integration',
        '3. Design service account / JWT authentication',
        '4. Design credential storage and management',
        '5. Plan token refresh and rotation',
        '6. Design authentication error handling',
        '7. Plan multi-credential support',
        '8. Design authentication middleware/interceptors',
        '9. Plan secure credential injection',
        '10. Document authentication patterns'
      ],
      outputFormat: 'JSON with authentication design'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'flows', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              implementation: { type: 'string' },
              securityLevel: { type: 'string' }
            }
          }
        },
        flows: { type: 'array', items: { type: 'object' } },
        credentialManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'architecture', 'authentication', 'security']
}));

export const transportStrategyTask = defineTask('transport-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Transport Strategy Design - ${args.projectName}`,
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK Transport Architect',
      task: 'Plan serialization and transport strategies',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        serializationFormats: args.serializationFormats,
        componentHierarchy: args.componentHierarchy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design HTTP client abstraction layer',
        '2. Plan request/response serialization',
        '3. Design retry and backoff strategies',
        '4. Plan connection pooling and keep-alive',
        '5. Design timeout and cancellation handling',
        '6. Plan compression support',
        '7. Design streaming support for large payloads',
        '8. Plan custom transport injection',
        '9. Design request/response logging',
        '10. Document transport strategies'
      ],
      outputFormat: 'JSON with transport strategy design'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'serialization', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        serialization: {
          type: 'object',
          properties: {
            formats: { type: 'array', items: { type: 'string' } },
            customSerializers: { type: 'boolean' }
          }
        },
        retryStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'architecture', 'transport', 'serialization']
}));

export const extensionArchitectureTask = defineTask('extension-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Extension Architecture Design - ${args.projectName}`,
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK Extensibility Architect',
      task: 'Establish extension and plugin architecture',
      context: {
        projectName: args.projectName,
        extensibility: args.extensibility,
        componentHierarchy: args.componentHierarchy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design middleware/interceptor hooks',
        '2. Design plugin registration system',
        '3. Plan custom transport support',
        '4. Design extension points for authentication',
        '5. Plan lifecycle hooks (before/after request)',
        '6. Design configuration extension points',
        '7. Plan custom serializer injection',
        '8. Design event/callback system',
        '9. Plan extension versioning and compatibility',
        '10. Document extension architecture'
      ],
      outputFormat: 'JSON with extension architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['extensionPoints', 'pluginSystem', 'artifacts'],
      properties: {
        extensionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              interface: { type: 'string' }
            }
          }
        },
        pluginSystem: {
          type: 'object',
          properties: {
            registration: { type: 'string' },
            lifecycle: { type: 'array', items: { type: 'string' } },
            isolation: { type: 'string' }
          }
        },
        middlewareChain: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'architecture', 'extensibility', 'plugins']
}));

export const errorHandlingStrategyTask = defineTask('error-handling-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error Handling Strategy - ${args.projectName}`,
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'SDK Error Handling Specialist',
      task: 'Design comprehensive error handling strategy',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        apiType: args.apiType,
        componentHierarchy: args.componentHierarchy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design typed exception hierarchy',
        '2. Plan error categorization (network, auth, validation, server)',
        '3. Design actionable error messages',
        '4. Plan error codes and documentation',
        '5. Design retry-able vs non-retry-able errors',
        '6. Plan error context and debugging info',
        '7. Design language-specific error patterns',
        '8. Plan error logging and telemetry',
        '9. Design error recovery suggestions',
        '10. Document error handling strategy'
      ],
      outputFormat: 'JSON with error handling strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'exceptionHierarchy', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            categorization: { type: 'object' },
            retryPolicy: { type: 'object' },
            errorCodes: { type: 'array', items: { type: 'string' } }
          }
        },
        exceptionHierarchy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              parent: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'architecture', 'error-handling']
}));

export const configurationManagementTask = defineTask('configuration-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Configuration Management Design - ${args.projectName}`,
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK Configuration Specialist',
      task: 'Design configuration management approach',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        componentHierarchy: args.componentHierarchy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design configuration hierarchy (global, client, request)',
        '2. Plan configuration sources (code, env, file)',
        '3. Design sensible defaults strategy',
        '4. Plan configuration validation',
        '5. Design configuration immutability/mutability',
        '6. Plan environment-specific configuration',
        '7. Design configuration documentation',
        '8. Plan configuration migration',
        '9. Design language-specific configuration patterns',
        '10. Document configuration management'
      ],
      outputFormat: 'JSON with configuration management design'
    },
    outputSchema: {
      type: 'object',
      required: ['configStrategy', 'artifacts'],
      properties: {
        configStrategy: {
          type: 'object',
          properties: {
            hierarchy: { type: 'array', items: { type: 'string' } },
            sources: { type: 'array', items: { type: 'string' } },
            defaults: { type: 'object' },
            validation: { type: 'object' }
          }
        },
        configOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              default: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'architecture', 'configuration']
}));

export const architectureDocumentationTask = defineTask('architecture-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Architecture Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'SDK Technical Writer',
      task: 'Generate comprehensive architecture documentation',
      context: {
        projectName: args.projectName,
        requirementsAnalysis: args.requirementsAnalysis,
        componentHierarchy: args.componentHierarchy,
        authDesign: args.authDesign,
        transportDesign: args.transportDesign,
        extensionDesign: args.extensionDesign,
        errorStrategy: args.errorStrategy,
        configDesign: args.configDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SDK architecture overview document',
        '2. Generate component hierarchy diagrams',
        '3. Document design decisions with rationale',
        '4. Create authentication pattern documentation',
        '5. Document transport and serialization strategies',
        '6. Create extension point documentation',
        '7. Document error handling patterns',
        '8. Create configuration reference',
        '9. Generate API surface design document',
        '10. Create implementation guidelines'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['architectureDocPath', 'componentDiagramPath', 'designDecisionsPath', 'artifacts'],
      properties: {
        architectureDocPath: { type: 'string' },
        componentDiagramPath: { type: 'string' },
        designDecisionsPath: { type: 'string' },
        diagrams: { type: 'array', items: { type: 'string' } },
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              decision: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'architecture', 'documentation']
}));
