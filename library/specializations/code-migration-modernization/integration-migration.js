/**
 * @process specializations/code-migration-modernization/integration-migration
 * @description Integration Migration - Process for migrating integration patterns from legacy methods
 * (file-based, direct database, proprietary protocols) to modern approaches (APIs, message queues,
 * event-driven architecture).
 * @inputs { projectName: string, currentIntegrations?: array, targetPatterns?: array, externalSystems?: array }
 * @outputs { success: boolean, integrationInventory: object, migrationPlan: object, migratedIntegrations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/integration-migration', {
 *   projectName: 'B2B Integration Modernization',
 *   currentIntegrations: [{ type: 'file-sftp', partner: 'supplier-a' }],
 *   targetPatterns: ['rest-api', 'message-queue'],
 *   externalSystems: ['SAP', 'Salesforce']
 * });
 *
 * @references
 * - Enterprise Integration Patterns: https://www.enterpriseintegrationpatterns.com/
 * - API-First Design: https://swagger.io/resources/articles/adopting-an-api-first-approach/
 * - Event-Driven Architecture: https://martinfowler.com/articles/201701-event-driven.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentIntegrations = [],
    targetPatterns = [],
    externalSystems = [],
    outputDir = 'integration-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Integration Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: INTEGRATION INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Creating integration inventory');
  const integrationInventory = await ctx.task(integrationInventoryTask, {
    projectName,
    currentIntegrations,
    externalSystems,
    outputDir
  });

  artifacts.push(...integrationInventory.artifacts);

  // ============================================================================
  // PHASE 2: TARGET PATTERN DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing target integration patterns');
  const targetDesign = await ctx.task(targetPatternDesignTask, {
    projectName,
    integrationInventory,
    targetPatterns,
    outputDir
  });

  artifacts.push(...targetDesign.artifacts);

  // Breakpoint: Design review
  await ctx.breakpoint({
    question: `Integration design complete for ${projectName}. Integrations: ${integrationInventory.totalCount}. Target pattern: ${targetDesign.primaryPattern}. Approve design?`,
    title: 'Integration Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      targetDesign,
      recommendation: 'Review with external system owners'
    }
  });

  // ============================================================================
  // PHASE 3: API/MESSAGE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing APIs and message contracts');
  const contractDesign = await ctx.task(contractDesignTask, {
    projectName,
    targetDesign,
    integrationInventory,
    outputDir
  });

  artifacts.push(...contractDesign.artifacts);

  // ============================================================================
  // PHASE 4: IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing integrations');
  const implementation = await ctx.task(integrationImplementationTask, {
    projectName,
    contractDesign,
    targetDesign,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // ============================================================================
  // PHASE 5: PARTNER COORDINATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Coordinating with partners');
  const partnerCoordination = await ctx.task(partnerCoordinationTask, {
    projectName,
    implementation,
    externalSystems,
    outputDir
  });

  artifacts.push(...partnerCoordination.artifacts);

  // ============================================================================
  // PHASE 6: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing integrations');
  const testing = await ctx.task(integrationTestingTask, {
    projectName,
    implementation,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  // ============================================================================
  // PHASE 7: CUTOVER
  // ============================================================================

  ctx.log('info', 'Phase 7: Cutting over to new integrations');
  const cutover = await ctx.task(integrationCutoverTask, {
    projectName,
    implementation,
    testing,
    outputDir
  });

  artifacts.push(...cutover.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Integration migration complete for ${projectName}. Migrated: ${implementation.migratedCount}/${integrationInventory.totalCount}. Tests passing: ${testing.allPassed}. Approve?`,
    title: 'Integration Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        totalIntegrations: integrationInventory.totalCount,
        migrated: implementation.migratedCount,
        testsPass: testing.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    integrationInventory,
    migrationPlan: targetDesign,
    contracts: contractDesign,
    migratedIntegrations: implementation.migratedIntegrations,
    testResults: testing,
    cutoverStatus: cutover,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/integration-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const integrationInventoryTask = defineTask('integration-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Integration Inventory - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'Integration Analyst',
      task: 'Create integration inventory',
      context: args,
      instructions: [
        '1. Document all integrations',
        '2. Classify by type',
        '3. Map data flows',
        '4. Identify dependencies',
        '5. Document protocols',
        '6. Assess criticality',
        '7. Document SLAs',
        '8. Identify owners',
        '9. Assess complexity',
        '10. Generate inventory report'
      ],
      outputFormat: 'JSON with totalCount, integrations, byType, criticalIntegrations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCount', 'integrations', 'artifacts'],
      properties: {
        totalCount: { type: 'number' },
        integrations: { type: 'array', items: { type: 'object' } },
        byType: { type: 'object' },
        criticalIntegrations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['integration-migration', 'inventory', 'discovery']
}));

export const targetPatternDesignTask = defineTask('target-pattern-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Target Pattern Design - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'Integration Architect',
      task: 'Design target integration patterns',
      context: args,
      instructions: [
        '1. Select integration patterns',
        '2. Design API-based integrations',
        '3. Plan message-based flows',
        '4. Design event architecture',
        '5. Plan error handling',
        '6. Design retry strategies',
        '7. Plan monitoring',
        '8. Design security',
        '9. Document patterns',
        '10. Generate design document'
      ],
      outputFormat: 'JSON with primaryPattern, patterns, apiDesign, messagingDesign, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryPattern', 'patterns', 'artifacts'],
      properties: {
        primaryPattern: { type: 'string' },
        patterns: { type: 'array', items: { type: 'object' } },
        apiDesign: { type: 'object' },
        messagingDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['integration-migration', 'design', 'patterns']
}));

export const contractDesignTask = defineTask('contract-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Contract Design - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'API Designer',
      task: 'Design integration contracts',
      context: args,
      instructions: [
        '1. Design API contracts',
        '2. Create OpenAPI specs',
        '3. Design message schemas',
        '4. Define error contracts',
        '5. Plan versioning',
        '6. Document data mappings',
        '7. Design authentication',
        '8. Create examples',
        '9. Validate contracts',
        '10. Generate contract docs'
      ],
      outputFormat: 'JSON with apiContracts, messageSchemas, errorContracts, versioningStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apiContracts', 'messageSchemas', 'artifacts'],
      properties: {
        apiContracts: { type: 'array', items: { type: 'object' } },
        messageSchemas: { type: 'array', items: { type: 'object' } },
        errorContracts: { type: 'array', items: { type: 'object' } },
        versioningStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['integration-migration', 'contracts', 'api']
}));

export const integrationImplementationTask = defineTask('integration-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Integration Implementation - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Integration Developer',
      task: 'Implement new integrations',
      context: args,
      instructions: [
        '1. Implement APIs',
        '2. Set up message queues',
        '3. Implement adapters',
        '4. Handle transformations',
        '5. Implement error handling',
        '6. Set up monitoring',
        '7. Implement retry logic',
        '8. Test implementations',
        '9. Document code',
        '10. Track progress'
      ],
      outputFormat: 'JSON with migratedCount, migratedIntegrations, pendingIntegrations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migratedCount', 'migratedIntegrations', 'artifacts'],
      properties: {
        migratedCount: { type: 'number' },
        migratedIntegrations: { type: 'array', items: { type: 'object' } },
        pendingIntegrations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['integration-migration', 'implementation', 'development']
}));

export const partnerCoordinationTask = defineTask('partner-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Partner Coordination - ${args.projectName}`,
  agent: {
    name: 'migration-project-coordinator',
    prompt: {
      role: 'Integration Manager',
      task: 'Coordinate with integration partners',
      context: args,
      instructions: [
        '1. Notify partners of changes',
        '2. Share documentation',
        '3. Coordinate testing windows',
        '4. Plan cutover timing',
        '5. Set up support channels',
        '6. Track partner readiness',
        '7. Handle escalations',
        '8. Document agreements',
        '9. Confirm cutover dates',
        '10. Generate coordination report'
      ],
      outputFormat: 'JSON with partnersNotified, partnerReadiness, cutoverSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['partnersNotified', 'partnerReadiness', 'artifacts'],
      properties: {
        partnersNotified: { type: 'number' },
        partnerReadiness: { type: 'object' },
        cutoverSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['integration-migration', 'coordination', 'partners']
}));

export const integrationTestingTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Integration Testing - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Test migrated integrations',
      context: args,
      instructions: [
        '1. Run contract tests',
        '2. Test data flows',
        '3. Test error scenarios',
        '4. Validate transformations',
        '5. Test performance',
        '6. Test failover',
        '7. Validate monitoring',
        '8. Test with partners',
        '9. Document results',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, testResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        testResults: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['integration-migration', 'testing', 'validation']
}));

export const integrationCutoverTask = defineTask('integration-cutover', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Integration Cutover - ${args.projectName}`,
  agent: {
    name: 'cutover-coordinator',
    prompt: {
      role: 'Release Manager',
      task: 'Execute integration cutover',
      context: args,
      instructions: [
        '1. Execute cutover plan',
        '2. Switch to new integrations',
        '3. Monitor for issues',
        '4. Validate data flows',
        '5. Coordinate with partners',
        '6. Handle fallback if needed',
        '7. Decommission old integrations',
        '8. Update documentation',
        '9. Confirm success',
        '10. Generate cutover report'
      ],
      outputFormat: 'JSON with cutoverComplete, integrationsActivated, decommissioned, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cutoverComplete', 'integrationsActivated', 'artifacts'],
      properties: {
        cutoverComplete: { type: 'boolean' },
        integrationsActivated: { type: 'number' },
        decommissioned: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['integration-migration', 'cutover', 'deployment']
}));
