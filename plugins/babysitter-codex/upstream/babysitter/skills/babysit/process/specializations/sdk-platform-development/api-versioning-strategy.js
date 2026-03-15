/**
 * @process specializations/sdk-platform-development/api-versioning-strategy
 * @description API Versioning Strategy - Define and implement API versioning approach for backward compatibility
 * including deprecation policies, migration guides, and version negotiation.
 * @inputs { projectName: string, versioningMethod?: string, deprecationPolicy?: object, supportedVersions?: number }
 * @outputs { success: boolean, strategy: object, migrationTemplates: array, gatewayConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/api-versioning-strategy', {
 *   projectName: 'CloudAPI',
 *   versioningMethod: 'url-path',
 *   deprecationPolicy: { warningPeriod: '6 months', sunsetPeriod: '12 months' },
 *   supportedVersions: 2
 * });
 *
 * @references
 * - Semantic Versioning: https://semver.org/
 * - API Evolution: https://www.mnot.net/blog/2012/12/04/api-evolution
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    versioningMethod = 'url-path',
    deprecationPolicy = { warningPeriod: '6 months', sunsetPeriod: '12 months' },
    supportedVersions = 2,
    outputDir = 'api-versioning-strategy'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting API Versioning Strategy: ${projectName}`);
  ctx.log('info', `Versioning Method: ${versioningMethod}`);

  // ============================================================================
  // PHASE 1: VERSIONING METHOD SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting and defining versioning method');

  const methodSelection = await ctx.task(versioningMethodTask, {
    projectName,
    versioningMethod,
    outputDir
  });

  artifacts.push(...methodSelection.artifacts);

  // ============================================================================
  // PHASE 2: VERSION FORMAT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing version format and naming');

  const versionFormat = await ctx.task(versionFormatTask, {
    projectName,
    versioningMethod,
    methodSelection,
    outputDir
  });

  artifacts.push(...versionFormat.artifacts);

  // ============================================================================
  // PHASE 3: DEPRECATION POLICY
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining deprecation policies and timelines');

  const deprecationPolicyDesign = await ctx.task(deprecationPolicyTask, {
    projectName,
    deprecationPolicy,
    supportedVersions,
    outputDir
  });

  artifacts.push(...deprecationPolicyDesign.artifacts);

  // ============================================================================
  // PHASE 4: MIGRATION GUIDE TEMPLATES
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating migration guide templates');

  const migrationTemplates = await ctx.task(migrationTemplatesTask, {
    projectName,
    versionFormat,
    deprecationPolicyDesign,
    outputDir
  });

  artifacts.push(...migrationTemplates.artifacts);

  // Quality Gate: Strategy Review
  await ctx.breakpoint({
    question: `Versioning strategy defined for ${projectName}. Method: ${versioningMethod}, Supported versions: ${supportedVersions}. Approve strategy?`,
    title: 'Versioning Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      versioningMethod,
      deprecationPolicy,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 5: VERSION NEGOTIATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing version negotiation');

  const versionNegotiation = await ctx.task(versionNegotiationTask, {
    projectName,
    versioningMethod,
    versionFormat,
    outputDir
  });

  artifacts.push(...versionNegotiation.artifacts);

  // ============================================================================
  // PHASE 6: API GATEWAY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring API gateway for versioning');

  const gatewayConfig = await ctx.task(gatewayVersioningTask, {
    projectName,
    versioningMethod,
    versionNegotiation,
    outputDir
  });

  artifacts.push(...gatewayConfig.artifacts);

  // ============================================================================
  // PHASE 7: BREAKING CHANGE POLICY
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining breaking change policy');

  const breakingChangePolicy = await ctx.task(breakingChangePolicyTask, {
    projectName,
    deprecationPolicyDesign,
    outputDir
  });

  artifacts.push(...breakingChangePolicy.artifacts);

  // ============================================================================
  // PHASE 8: VERSION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating versioning documentation');

  const documentation = await ctx.task(versioningDocumentationTask, {
    projectName,
    methodSelection,
    versionFormat,
    deprecationPolicyDesign,
    migrationTemplates,
    versionNegotiation,
    breakingChangePolicy,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    strategy: {
      method: versioningMethod,
      format: versionFormat.format,
      deprecationPolicy: deprecationPolicyDesign.policy,
      supportedVersions
    },
    migrationTemplates: migrationTemplates.templates,
    versionNegotiation: versionNegotiation.config,
    gatewayConfig: gatewayConfig.config,
    breakingChangePolicy: breakingChangePolicy.policy,
    documentation: {
      strategyDoc: documentation.strategyDocPath,
      migrationGuide: documentation.migrationGuidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/api-versioning-strategy',
      timestamp: startTime,
      versioningMethod
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const versioningMethodTask = defineTask('versioning-method', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Versioning Method - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Architect',
      task: 'Select and define API versioning method',
      context: {
        projectName: args.projectName,
        versioningMethod: args.versioningMethod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate URL path versioning (/v1/)',
        '2. Evaluate header-based versioning',
        '3. Evaluate query parameter versioning',
        '4. Evaluate content negotiation',
        '5. Assess caching implications',
        '6. Consider client compatibility',
        '7. Evaluate discoverability',
        '8. Assess documentation impact',
        '9. Document method selection rationale',
        '10. Generate versioning method specification'
      ],
      outputFormat: 'JSON with versioning method selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMethod', 'rationale', 'artifacts'],
      properties: {
        selectedMethod: { type: 'string' },
        rationale: { type: 'string' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
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
  labels: ['sdk', 'api-versioning', 'method-selection']
}));

export const versionFormatTask = defineTask('version-format', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Version Format - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Designer',
      task: 'Design version format and naming conventions',
      context: {
        projectName: args.projectName,
        versioningMethod: args.versioningMethod,
        methodSelection: args.methodSelection,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define version number format (v1, 2024-01-01, etc.)',
        '2. Establish major/minor versioning rules',
        '3. Define version comparison logic',
        '4. Plan version ordering',
        '5. Design version validation',
        '6. Define default version behavior',
        '7. Plan preview/beta version naming',
        '8. Design experimental feature flags',
        '9. Document version lifecycle states',
        '10. Generate version format specification'
      ],
      outputFormat: 'JSON with version format specification'
    },
    outputSchema: {
      type: 'object',
      required: ['format', 'lifecycle', 'artifacts'],
      properties: {
        format: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            examples: { type: 'array', items: { type: 'string' } },
            validation: { type: 'string' }
          }
        },
        lifecycle: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-versioning', 'format']
}));

export const deprecationPolicyTask = defineTask('deprecation-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Deprecation Policy - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Architect',
      task: 'Define deprecation policies and timelines',
      context: {
        projectName: args.projectName,
        deprecationPolicy: args.deprecationPolicy,
        supportedVersions: args.supportedVersions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define deprecation announcement period',
        '2. Establish warning header requirements',
        '3. Define sunset timeline',
        '4. Plan communication strategy',
        '5. Design deprecation notices in docs',
        '6. Define support level during deprecation',
        '7. Plan SDK deprecation warnings',
        '8. Design API response deprecation headers',
        '9. Define exception handling for extensions',
        '10. Generate deprecation policy document'
      ],
      outputFormat: 'JSON with deprecation policy'
    },
    outputSchema: {
      type: 'object',
      required: ['policy', 'timeline', 'artifacts'],
      properties: {
        policy: {
          type: 'object',
          properties: {
            warningPeriod: { type: 'string' },
            sunsetPeriod: { type: 'string' },
            supportedVersions: { type: 'number' }
          }
        },
        timeline: { type: 'array', items: { type: 'object' } },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-versioning', 'deprecation']
}));

export const migrationTemplatesTask = defineTask('migration-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Migration Templates - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Create migration guide templates',
      context: {
        projectName: args.projectName,
        versionFormat: args.versionFormat,
        deprecationPolicyDesign: args.deprecationPolicyDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create migration guide template structure',
        '2. Define breaking changes section',
        '3. Create code migration examples',
        '4. Design before/after comparisons',
        '5. Create automated migration scripts template',
        '6. Design deprecation mapping tables',
        '7. Create SDK upgrade guide template',
        '8. Design compatibility matrix template',
        '9. Create rollback instructions template',
        '10. Generate migration template files'
      ],
      outputFormat: 'JSON with migration templates'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              sections: { type: 'array', items: { type: 'string' } }
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
  labels: ['sdk', 'api-versioning', 'migration']
}));

export const versionNegotiationTask = defineTask('version-negotiation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Version Negotiation - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Engineer',
      task: 'Implement version negotiation mechanism',
      context: {
        projectName: args.projectName,
        versioningMethod: args.versioningMethod,
        versionFormat: args.versionFormat,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design version detection logic',
        '2. Implement default version fallback',
        '3. Design version range support',
        '4. Implement version validation',
        '5. Design unsupported version handling',
        '6. Implement version response headers',
        '7. Design SDK version detection',
        '8. Implement client version reporting',
        '9. Design version telemetry',
        '10. Generate version negotiation configuration'
      ],
      outputFormat: 'JSON with version negotiation config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            detection: { type: 'string' },
            defaultVersion: { type: 'string' },
            fallbackBehavior: { type: 'string' },
            responseHeaders: { type: 'array', items: { type: 'string' } }
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
  labels: ['sdk', 'api-versioning', 'negotiation']
}));

export const gatewayVersioningTask = defineTask('gateway-versioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Gateway Configuration - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Platform Engineer',
      task: 'Configure API gateway for versioning',
      context: {
        projectName: args.projectName,
        versioningMethod: args.versioningMethod,
        versionNegotiation: args.versionNegotiation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure version-based routing',
        '2. Set up version header injection',
        '3. Configure deprecation warning headers',
        '4. Implement version-based rate limiting',
        '5. Set up version metrics and logging',
        '6. Configure version-specific caching',
        '7. Implement version health checks',
        '8. Set up version traffic splitting',
        '9. Configure version sunset blocking',
        '10. Generate gateway configuration'
      ],
      outputFormat: 'JSON with gateway configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            routing: { type: 'object' },
            headers: { type: 'array', items: { type: 'string' } },
            rateLimiting: { type: 'object' }
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
  labels: ['sdk', 'api-versioning', 'gateway']
}));

export const breakingChangePolicyTask = defineTask('breaking-change-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Breaking Change Policy - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Architect',
      task: 'Define breaking change policy',
      context: {
        projectName: args.projectName,
        deprecationPolicyDesign: args.deprecationPolicyDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define what constitutes a breaking change',
        '2. Categorize breaking change types',
        '3. Define additive change guidelines',
        '4. Establish backward compatibility rules',
        '5. Define breaking change approval process',
        '6. Plan breaking change communication',
        '7. Design impact assessment process',
        '8. Define customer notification requirements',
        '9. Plan breaking change testing',
        '10. Generate breaking change policy document'
      ],
      outputFormat: 'JSON with breaking change policy'
    },
    outputSchema: {
      type: 'object',
      required: ['policy', 'categories', 'artifacts'],
      properties: {
        policy: {
          type: 'object',
          properties: {
            definition: { type: 'string' },
            approvalProcess: { type: 'string' },
            communicationPlan: { type: 'string' }
          }
        },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' }
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
  labels: ['sdk', 'api-versioning', 'breaking-changes']
}));

export const versioningDocumentationTask = defineTask('versioning-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Versioning Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate versioning documentation',
      context: {
        projectName: args.projectName,
        methodSelection: args.methodSelection,
        versionFormat: args.versionFormat,
        deprecationPolicyDesign: args.deprecationPolicyDesign,
        migrationTemplates: args.migrationTemplates,
        versionNegotiation: args.versionNegotiation,
        breakingChangePolicy: args.breakingChangePolicy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create versioning strategy overview',
        '2. Document version format and naming',
        '3. Write deprecation policy guide',
        '4. Create migration guide documentation',
        '5. Document version negotiation behavior',
        '6. Write breaking change policy',
        '7. Create changelog template',
        '8. Document SDK versioning alignment',
        '9. Create developer FAQ',
        '10. Generate all documentation artifacts'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['strategyDocPath', 'migrationGuidePath', 'artifacts'],
      properties: {
        strategyDocPath: { type: 'string' },
        migrationGuidePath: { type: 'string' },
        changelogTemplatePath: { type: 'string' },
        faqPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-versioning', 'documentation']
}));
