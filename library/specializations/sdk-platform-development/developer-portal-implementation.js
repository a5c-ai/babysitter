/**
 * @process specializations/sdk-platform-development/developer-portal-implementation
 * @description Developer Portal Implementation - Build unified developer portal for API exploration, self-service
 * credential management, and integrated support mechanisms.
 * @inputs { projectName: string, portalFramework?: string, features?: array, selfService?: boolean }
 * @outputs { success: boolean, portalConfig: object, features: array, integrations: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/developer-portal-implementation', {
 *   projectName: 'CloudAPI Portal',
 *   portalFramework: 'backstage',
 *   features: ['api-catalog', 'credentials', 'analytics', 'support'],
 *   selfService: true
 * });
 *
 * @references
 * - Backstage: https://backstage.io/
 * - Developer Portal Best Practices: https://www.developerrelations.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    portalFramework = 'custom',
    features = ['api-catalog', 'credentials', 'documentation', 'support'],
    selfService = true,
    outputDir = 'developer-portal-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Developer Portal Implementation: ${projectName}`);
  ctx.log('info', `Framework: ${portalFramework}`);

  // ============================================================================
  // PHASE 1: PORTAL ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing portal architecture');

  const architecture = await ctx.task(portalArchitectureTask, {
    projectName,
    portalFramework,
    features,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  // ============================================================================
  // PHASE 2: SERVICE CATALOG SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing service catalog and API discovery');

  const serviceCatalog = await ctx.task(serviceCatalogTask, {
    projectName,
    architecture,
    outputDir
  });

  artifacts.push(...serviceCatalog.artifacts);

  // ============================================================================
  // PHASE 3: CREDENTIAL MANAGEMENT
  // ============================================================================

  if (selfService) {
    ctx.log('info', 'Phase 3: Creating self-service credential management');

    const credentialManagement = await ctx.task(credentialManagementTask, {
      projectName,
      architecture,
      outputDir
    });

    artifacts.push(...credentialManagement.artifacts);
  }

  // ============================================================================
  // PHASE 4: API CONSOLE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Building interactive API console');

  const apiConsole = await ctx.task(apiConsoleTask, {
    projectName,
    serviceCatalog,
    outputDir
  });

  artifacts.push(...apiConsole.artifacts);

  // Quality Gate: Portal Features Review
  await ctx.breakpoint({
    question: `Portal core features implemented for ${projectName}. Service catalog: ready, API console: ready. Approve configuration?`,
    title: 'Portal Features Review',
    context: {
      runId: ctx.runId,
      projectName,
      features: features,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: ANALYTICS DASHBOARD
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up usage analytics dashboard');

  const analyticsDashboard = await ctx.task(analyticsDashboardTask, {
    projectName,
    architecture,
    outputDir
  });

  artifacts.push(...analyticsDashboard.artifacts);

  // ============================================================================
  // PHASE 6: SUPPORT INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating support and feedback mechanisms');

  const supportIntegration = await ctx.task(supportIntegrationTask, {
    projectName,
    architecture,
    outputDir
  });

  artifacts.push(...supportIntegration.artifacts);

  // ============================================================================
  // PHASE 7: AUTHENTICATION AND AUTHORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring portal authentication');

  const portalAuth = await ctx.task(portalAuthTask, {
    projectName,
    architecture,
    outputDir
  });

  artifacts.push(...portalAuth.artifacts);

  // ============================================================================
  // PHASE 8: PORTAL DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating portal documentation');

  const documentation = await ctx.task(portalDocumentationTask, {
    projectName,
    architecture,
    serviceCatalog,
    apiConsole,
    analyticsDashboard,
    supportIntegration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    portalConfig: {
      framework: portalFramework,
      architecture: architecture.design,
      baseUrl: architecture.baseUrl
    },
    features: features,
    serviceCatalog: serviceCatalog.config,
    apiConsole: apiConsole.config,
    analytics: analyticsDashboard.config,
    support: supportIntegration.config,
    integrations: {
      authentication: portalAuth.config,
      support: supportIntegration.integrations
    },
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/developer-portal-implementation',
      timestamp: startTime,
      portalFramework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const portalArchitectureTask = defineTask('portal-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Portal Architecture - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Developer Portal Architect',
      task: 'Design developer portal architecture',
      context: {
        projectName: args.projectName,
        portalFramework: args.portalFramework,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define portal component architecture',
        '2. Design navigation and information architecture',
        '3. Plan integration points with APIs',
        '4. Design authentication flow',
        '5. Plan content management approach',
        '6. Design personalization features',
        '7. Plan search and discovery',
        '8. Design responsive layout',
        '9. Plan performance optimization',
        '10. Generate architecture documentation'
      ],
      outputFormat: 'JSON with portal architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'baseUrl', 'components', 'artifacts'],
      properties: {
        design: { type: 'object' },
        baseUrl: { type: 'string' },
        components: { type: 'array', items: { type: 'string' } },
        integrations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-portal', 'architecture']
}));

export const serviceCatalogTask = defineTask('service-catalog', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Service Catalog - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Service Catalog Engineer',
      task: 'Implement service catalog and API discovery',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design service catalog schema',
        '2. Implement API registration workflow',
        '3. Create API versioning display',
        '4. Build search and filtering',
        '5. Implement dependency visualization',
        '6. Create API health status display',
        '7. Build API metrics dashboard',
        '8. Implement changelog integration',
        '9. Create subscription management',
        '10. Generate catalog configuration'
      ],
      outputFormat: 'JSON with service catalog configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'schema', 'artifacts'],
      properties: {
        config: { type: 'object' },
        schema: { type: 'object' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-portal', 'service-catalog']
}));

export const credentialManagementTask = defineTask('credential-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Credential Management - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Engineer',
      task: 'Create self-service credential management',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design API key management interface',
        '2. Implement key generation workflow',
        '3. Create key rotation mechanism',
        '4. Build OAuth application management',
        '5. Implement scope selection',
        '6. Create audit logging',
        '7. Build usage tracking per key',
        '8. Implement key revocation',
        '9. Create security notifications',
        '10. Generate credential management configuration'
      ],
      outputFormat: 'JSON with credential management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'features', 'artifacts'],
      properties: {
        config: { type: 'object' },
        features: { type: 'array', items: { type: 'string' } },
        securityPolicies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-portal', 'credentials', 'security']
}));

export const apiConsoleTask = defineTask('api-console', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: API Console - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Frontend Engineer',
      task: 'Build interactive API console',
      context: {
        projectName: args.projectName,
        serviceCatalog: args.serviceCatalog,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design API explorer interface',
        '2. Implement request builder',
        '3. Create response viewer',
        '4. Build authentication injection',
        '5. Implement code generation',
        '6. Create request history',
        '7. Build collection management',
        '8. Implement environment switching',
        '9. Create share/export functionality',
        '10. Generate API console configuration'
      ],
      outputFormat: 'JSON with API console configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'features', 'artifacts'],
      properties: {
        config: { type: 'object' },
        features: { type: 'array', items: { type: 'string' } },
        codeGenLanguages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-portal', 'api-console']
}));

export const analyticsDashboardTask = defineTask('analytics-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Analytics Dashboard - ${args.projectName}`,
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Data Engineer',
      task: 'Set up usage analytics dashboard',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design analytics data model',
        '2. Implement API usage tracking',
        '3. Create developer activity metrics',
        '4. Build quota usage visualization',
        '5. Implement error rate tracking',
        '6. Create latency percentile charts',
        '7. Build endpoint popularity metrics',
        '8. Implement export functionality',
        '9. Create alerting configuration',
        '10. Generate analytics configuration'
      ],
      outputFormat: 'JSON with analytics dashboard configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'metrics', 'artifacts'],
      properties: {
        config: { type: 'object' },
        metrics: { type: 'array', items: { type: 'string' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-portal', 'analytics']
}));

export const supportIntegrationTask = defineTask('support-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Support Integration - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Support Engineer',
      task: 'Integrate support and feedback mechanisms',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design support request workflow',
        '2. Integrate ticketing system',
        '3. Build feedback collection widget',
        '4. Create community forum integration',
        '5. Implement FAQ/knowledge base',
        '6. Build chatbot integration',
        '7. Create status page integration',
        '8. Implement changelog display',
        '9. Build announcement system',
        '10. Generate support configuration'
      ],
      outputFormat: 'JSON with support integration configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'integrations', 'artifacts'],
      properties: {
        config: { type: 'object' },
        integrations: { type: 'array', items: { type: 'string' } },
        workflows: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-portal', 'support']
}));

export const portalAuthTask = defineTask('portal-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Portal Authentication - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Engineer',
      task: 'Configure portal authentication and authorization',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design authentication flow',
        '2. Implement SSO integration',
        '3. Configure OAuth providers',
        '4. Set up MFA options',
        '5. Implement role-based access',
        '6. Create team/organization management',
        '7. Build invitation workflow',
        '8. Implement session management',
        '9. Configure security policies',
        '10. Generate authentication configuration'
      ],
      outputFormat: 'JSON with authentication configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'providers', 'artifacts'],
      properties: {
        config: { type: 'object' },
        providers: { type: 'array', items: { type: 'string' } },
        roles: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-portal', 'authentication']
}));

export const portalDocumentationTask = defineTask('portal-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Portal Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate portal documentation',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        serviceCatalog: args.serviceCatalog,
        apiConsole: args.apiConsole,
        analyticsDashboard: args.analyticsDashboard,
        supportIntegration: args.supportIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create portal user guide',
        '2. Document service catalog usage',
        '3. Write credential management guide',
        '4. Document API console features',
        '5. Create analytics guide',
        '6. Document support workflows',
        '7. Write admin guide',
        '8. Create troubleshooting guide',
        '9. Document customization options',
        '10. Generate all documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'artifacts'],
      properties: {
        paths: {
          type: 'object',
          properties: {
            userGuide: { type: 'string' },
            adminGuide: { type: 'string' },
            apiReference: { type: 'string' }
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
  labels: ['sdk', 'developer-portal', 'documentation']
}));
