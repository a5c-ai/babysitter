/**
 * @process specializations/code-migration-modernization/api-modernization
 * @description API Modernization - Process for modernizing legacy APIs to contemporary standards including
 * REST, GraphQL, and modern authentication while maintaining backward compatibility with versioning
 * strategy and consumer migration support.
 * @inputs { projectName: string, legacyApiInventory?: array, targetApiStyle?: string, consumers?: array, deprecationTimeline?: object }
 * @outputs { success: boolean, apiInventory: object, targetDesign: object, compatibilityPlan: object, migratedEndpoints: array, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/api-modernization', {
 *   projectName: 'Payment API Modernization',
 *   legacyApiInventory: [{ endpoint: '/soap/payment', type: 'SOAP' }],
 *   targetApiStyle: 'REST',
 *   consumers: ['mobile-app', 'web-app', 'partner-system'],
 *   deprecationTimeline: { months: 12 }
 * });
 *
 * @references
 * - OpenAPI Specification: https://swagger.io/specification/
 * - REST API Design: https://restfulapi.net/
 * - GraphQL: https://graphql.org/
 * - API Versioning: https://www.baeldung.com/rest-versioning
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    legacyApiInventory = [],
    targetApiStyle = 'REST',
    consumers = [],
    deprecationTimeline = { months: 12 },
    outputDir = 'api-modernization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting API Modernization for ${projectName}`);

  // ============================================================================
  // PHASE 1: LEGACY API INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Inventorying legacy APIs');
  const apiInventory = await ctx.task(legacyApiInventoryTask, {
    projectName,
    legacyApiInventory,
    consumers,
    outputDir
  });

  artifacts.push(...apiInventory.artifacts);

  // ============================================================================
  // PHASE 2: TARGET API DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing target API');
  const targetDesign = await ctx.task(targetApiDesignTask, {
    projectName,
    apiInventory,
    targetApiStyle,
    outputDir
  });

  artifacts.push(...targetDesign.artifacts);

  // Breakpoint: API design review
  await ctx.breakpoint({
    question: `Target API design complete for ${projectName}. Style: ${targetApiStyle}. Endpoints: ${targetDesign.endpointCount}. Review OpenAPI specification?`,
    title: 'Target API Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      targetDesign,
      files: targetDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 3: BACKWARD COMPATIBILITY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning backward compatibility');
  const compatibilityPlan = await ctx.task(backwardCompatibilityPlanningTask, {
    projectName,
    apiInventory,
    targetDesign,
    consumers,
    deprecationTimeline,
    outputDir
  });

  artifacts.push(...compatibilityPlan.artifacts);

  // ============================================================================
  // PHASE 4: API GATEWAY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up API gateway');
  const gatewaySetup = await ctx.task(apiGatewaySetupTask, {
    projectName,
    apiInventory,
    targetDesign,
    compatibilityPlan,
    outputDir
  });

  artifacts.push(...gatewaySetup.artifacts);

  // ============================================================================
  // PHASE 5: ENDPOINT MIGRATION (Iterative)
  // ============================================================================

  ctx.log('info', 'Phase 5: Migrating endpoints');
  const endpointMigration = await ctx.task(endpointMigrationTask, {
    projectName,
    apiInventory,
    targetDesign,
    gatewaySetup,
    outputDir
  });

  artifacts.push(...endpointMigration.artifacts);

  // Breakpoint: Migration progress
  await ctx.breakpoint({
    question: `Endpoint migration progress for ${projectName}. Completed: ${endpointMigration.completedCount}/${endpointMigration.totalCount}. Continue with consumer migration support?`,
    title: 'Endpoint Migration Progress',
    context: {
      runId: ctx.runId,
      projectName,
      migration: endpointMigration,
      recommendation: 'Ensure all critical endpoints are migrated before consumer notification'
    }
  });

  // ============================================================================
  // PHASE 6: CONSUMER MIGRATION SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Supporting consumer migration');
  const consumerSupport = await ctx.task(consumerMigrationSupportTask, {
    projectName,
    consumers,
    targetDesign,
    compatibilityPlan,
    outputDir
  });

  artifacts.push(...consumerSupport.artifacts);

  // ============================================================================
  // PHASE 7: LEGACY API DEPRECATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Managing legacy API deprecation');
  const deprecationManagement = await ctx.task(legacyApiDeprecationTask, {
    projectName,
    apiInventory,
    deprecationTimeline,
    consumerSupport,
    outputDir
  });

  artifacts.push(...deprecationManagement.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION AND SDK UPDATE
  // ============================================================================

  ctx.log('info', 'Phase 8: Updating documentation and SDKs');
  const documentationUpdate = await ctx.task(documentationSdkUpdateTask, {
    projectName,
    targetDesign,
    consumerSupport,
    outputDir
  });

  artifacts.push(...documentationUpdate.artifacts);

  // Final Breakpoint: API Modernization Complete
  await ctx.breakpoint({
    question: `API Modernization complete for ${projectName}. New endpoints: ${endpointMigration.completedCount}. Documentation ready. Consumers notified: ${consumerSupport.notifiedCount}. Approve modernization?`,
    title: 'API Modernization Approval',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        migratedEndpoints: endpointMigration.completedCount,
        deprecationDeadline: deprecationManagement.deadline,
        documentationUrl: documentationUpdate.portalUrl
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    apiInventory: {
      totalEndpoints: apiInventory.totalEndpoints,
      byType: apiInventory.byType,
      consumers: apiInventory.consumerMap
    },
    targetDesign: {
      style: targetApiStyle,
      endpointCount: targetDesign.endpointCount,
      openApiSpec: targetDesign.openApiPath
    },
    compatibilityPlan: {
      strategy: compatibilityPlan.strategy,
      breakingChanges: compatibilityPlan.breakingChanges,
      migrationGuide: compatibilityPlan.migrationGuidePath
    },
    gatewayConfig: {
      provider: gatewaySetup.provider,
      configured: gatewaySetup.configured
    },
    migratedEndpoints: endpointMigration.migratedEndpoints,
    consumerSupport: {
      notifiedCount: consumerSupport.notifiedCount,
      migrationProgress: consumerSupport.migrationProgress
    },
    deprecation: {
      deadline: deprecationManagement.deadline,
      monitored: deprecationManagement.monitoringEnabled
    },
    documentation: {
      portalUrl: documentationUpdate.portalUrl,
      sdksUpdated: documentationUpdate.sdksUpdated
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/api-modernization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const legacyApiInventoryTask = defineTask('legacy-api-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Legacy API Inventory - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'API Analyst',
      task: 'Document existing API endpoints and usage',
      context: args,
      instructions: [
        '1. Document all existing API endpoints',
        '2. Map request/response formats',
        '3. Identify all consumers',
        '4. Analyze usage patterns',
        '5. Document authentication methods',
        '6. Identify rate limits',
        '7. Map data contracts',
        '8. Document error handling',
        '9. Assess API health metrics',
        '10. Generate inventory report'
      ],
      outputFormat: 'JSON with totalEndpoints, byType, consumerMap, usagePatterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalEndpoints', 'byType', 'artifacts'],
      properties: {
        totalEndpoints: { type: 'number' },
        byType: { type: 'object' },
        consumerMap: { type: 'object' },
        usagePatterns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api-modernization', 'inventory', 'legacy']
}));

export const targetApiDesignTask = defineTask('target-api-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Target API Design - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'API Architect',
      task: 'Design modern API structure',
      context: args,
      instructions: [
        '1. Design modern API structure (REST/GraphQL)',
        '2. Create OpenAPI specification',
        '3. Define versioning strategy',
        '4. Plan authentication mechanism (OAuth2, JWT)',
        '5. Design resource models',
        '6. Define pagination strategy',
        '7. Plan error handling',
        '8. Design rate limiting',
        '9. Plan caching strategy',
        '10. Generate API specification'
      ],
      outputFormat: 'JSON with endpointCount, openApiPath, versioningStrategy, authMechanism, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['endpointCount', 'openApiPath', 'artifacts'],
      properties: {
        endpointCount: { type: 'number' },
        openApiPath: { type: 'string' },
        versioningStrategy: { type: 'string' },
        authMechanism: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api-modernization', 'design', 'openapi']
}));

export const backwardCompatibilityPlanningTask = defineTask('backward-compatibility-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Backward Compatibility Planning - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'API Migration Specialist',
      task: 'Plan backward compatibility strategy',
      context: args,
      instructions: [
        '1. Identify breaking changes',
        '2. Design compatibility layer',
        '3. Plan deprecation timeline',
        '4. Create consumer migration guide',
        '5. Design version coexistence',
        '6. Plan sunset headers',
        '7. Design adapter patterns',
        '8. Plan rollback strategy',
        '9. Define compatibility SLAs',
        '10. Generate compatibility plan'
      ],
      outputFormat: 'JSON with strategy, breakingChanges, migrationGuidePath, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'breakingChanges', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        breakingChanges: { type: 'array', items: { type: 'object' } },
        migrationGuidePath: { type: 'string' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api-modernization', 'compatibility', 'planning']
}));

export const apiGatewaySetupTask = defineTask('api-gateway-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: API Gateway Setup - ${args.projectName}`,
  agent: {
    name: 'api-gateway-configurator',
    prompt: {
      role: 'Platform Engineer',
      task: 'Configure API gateway',
      context: args,
      instructions: [
        '1. Configure API gateway',
        '2. Implement routing rules',
        '3. Set up rate limiting',
        '4. Configure authentication',
        '5. Set up request transformation',
        '6. Configure logging',
        '7. Set up monitoring',
        '8. Configure caching',
        '9. Test gateway configuration',
        '10. Generate gateway configuration'
      ],
      outputFormat: 'JSON with provider, configured, routingRules, rateLimits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['provider', 'configured', 'artifacts'],
      properties: {
        provider: { type: 'string' },
        configured: { type: 'boolean' },
        routingRules: { type: 'array', items: { type: 'object' } },
        rateLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api-modernization', 'gateway', 'infrastructure']
}));

export const endpointMigrationTask = defineTask('endpoint-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Endpoint Migration - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'API Developer',
      task: 'Migrate endpoints to new API',
      context: args,
      instructions: [
        '1. Implement new endpoints',
        '2. Create adapters for legacy format',
        '3. Route traffic through gateway',
        '4. Test with sample consumers',
        '5. Validate response equivalence',
        '6. Implement error translation',
        '7. Test performance',
        '8. Validate authentication',
        '9. Document migration status',
        '10. Generate migration report'
      ],
      outputFormat: 'JSON with totalCount, completedCount, migratedEndpoints, failures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCount', 'completedCount', 'artifacts'],
      properties: {
        totalCount: { type: 'number' },
        completedCount: { type: 'number' },
        migratedEndpoints: { type: 'array', items: { type: 'object' } },
        failures: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api-modernization', 'migration', 'endpoints']
}));

export const consumerMigrationSupportTask = defineTask('consumer-migration-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Consumer Migration Support - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'Developer Relations',
      task: 'Support API consumers during migration',
      context: args,
      instructions: [
        '1. Notify consumers of changes',
        '2. Provide migration guides',
        '3. Offer support during transition',
        '4. Track consumer adoption',
        '5. Provide code samples',
        '6. Host migration workshops',
        '7. Create FAQ documentation',
        '8. Set up support channels',
        '9. Monitor migration progress',
        '10. Generate support report'
      ],
      outputFormat: 'JSON with notifiedCount, migrationProgress, supportChannels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['notifiedCount', 'migrationProgress', 'artifacts'],
      properties: {
        notifiedCount: { type: 'number' },
        migrationProgress: { type: 'object' },
        supportChannels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api-modernization', 'consumer-support', 'migration']
}));

export const legacyApiDeprecationTask = defineTask('legacy-api-deprecation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Legacy API Deprecation - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'API Lifecycle Manager',
      task: 'Manage legacy API deprecation',
      context: args,
      instructions: [
        '1. Add deprecation headers',
        '2. Monitor legacy usage',
        '3. Set deprecation deadline',
        '4. Communicate to consumers',
        '5. Track migration compliance',
        '6. Plan sunset procedure',
        '7. Set up alerts for usage',
        '8. Prepare shutdown runbook',
        '9. Document deprecation status',
        '10. Generate deprecation report'
      ],
      outputFormat: 'JSON with deadline, monitoringEnabled, usageMetrics, sunsetPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deadline', 'monitoringEnabled', 'artifacts'],
      properties: {
        deadline: { type: 'string' },
        monitoringEnabled: { type: 'boolean' },
        usageMetrics: { type: 'object' },
        sunsetPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api-modernization', 'deprecation', 'lifecycle']
}));

export const documentationSdkUpdateTask = defineTask('documentation-sdk-update', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation and SDK Update - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'Technical Writer',
      task: 'Update API documentation and SDKs',
      context: args,
      instructions: [
        '1. Generate API documentation',
        '2. Update client SDKs',
        '3. Create code samples',
        '4. Update developer portal',
        '5. Create getting started guide',
        '6. Document authentication',
        '7. Create troubleshooting guide',
        '8. Update changelog',
        '9. Publish documentation',
        '10. Generate documentation report'
      ],
      outputFormat: 'JSON with portalUrl, sdksUpdated, documentationPages, changelogPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['portalUrl', 'sdksUpdated', 'artifacts'],
      properties: {
        portalUrl: { type: 'string' },
        sdksUpdated: { type: 'array', items: { type: 'string' } },
        documentationPages: { type: 'array', items: { type: 'object' } },
        changelogPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api-modernization', 'documentation', 'sdk']
}));
