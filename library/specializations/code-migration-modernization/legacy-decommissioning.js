/**
 * @process specializations/code-migration-modernization/legacy-decommissioning
 * @description Legacy Decommissioning - Process for safely decommissioning legacy systems after
 * migration, including data archival, access removal, infrastructure cleanup, and compliance
 * documentation.
 * @inputs { projectName: string, legacySystem?: object, migrationComplete?: boolean, retentionPolicy?: object }
 * @outputs { success: boolean, decommissionPlan: object, archivedData: object, removedAccess: array, cleanedInfrastructure: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/legacy-decommissioning', {
 *   projectName: 'Legacy ERP Decommissioning',
 *   legacySystem: { name: 'Legacy ERP', type: 'database', infrastructure: 'on-premises' },
 *   migrationComplete: true,
 *   retentionPolicy: { years: 7, format: 'archive' }
 * });
 *
 * @references
 * - Data Retention: https://www.gdpreu.org/compliance/data-retention-requirements/
 * - System Decommissioning: https://www.cisa.gov/uscert/sites/default/files/documents/06-015%20-%20IT%20System%20Disposition.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    legacySystem = {},
    migrationComplete = false,
    retentionPolicy = {},
    outputDir = 'decommissioning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Legacy Decommissioning for ${projectName}`);

  // Pre-flight check
  if (!migrationComplete) {
    await ctx.breakpoint({
      question: `Migration not marked complete for ${projectName}. Are you sure you want to proceed with decommissioning?`,
      title: 'Migration Not Complete Warning',
      context: {
        runId: ctx.runId,
        projectName,
        recommendation: 'Ensure migration is fully validated before decommissioning'
      }
    });
  }

  // ============================================================================
  // PHASE 1: DECOMMISSION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning decommissioning');
  const decommissionPlan = await ctx.task(decommissionPlanningTask, {
    projectName,
    legacySystem,
    retentionPolicy,
    outputDir
  });

  artifacts.push(...decommissionPlan.artifacts);

  // Breakpoint: Plan approval
  await ctx.breakpoint({
    question: `Decommission plan ready for ${projectName}. System: ${legacySystem.name}. Data to archive: ${decommissionPlan.dataToArchive}. Approve plan?`,
    title: 'Decommission Plan Review',
    context: {
      runId: ctx.runId,
      projectName,
      decommissionPlan,
      recommendation: 'Review with stakeholders before proceeding'
    }
  });

  // ============================================================================
  // PHASE 2: DATA ARCHIVAL
  // ============================================================================

  ctx.log('info', 'Phase 2: Archiving data');
  const dataArchival = await ctx.task(dataArchivalTask, {
    projectName,
    legacySystem,
    decommissionPlan,
    retentionPolicy,
    outputDir
  });

  artifacts.push(...dataArchival.artifacts);

  // ============================================================================
  // PHASE 3: ACCESS REMOVAL
  // ============================================================================

  ctx.log('info', 'Phase 3: Removing access');
  const accessRemoval = await ctx.task(accessRemovalTask, {
    projectName,
    legacySystem,
    outputDir
  });

  artifacts.push(...accessRemoval.artifacts);

  // ============================================================================
  // PHASE 4: APPLICATION SHUTDOWN
  // ============================================================================

  ctx.log('info', 'Phase 4: Shutting down application');
  const applicationShutdown = await ctx.task(applicationShutdownTask, {
    projectName,
    legacySystem,
    accessRemoval,
    outputDir
  });

  artifacts.push(...applicationShutdown.artifacts);

  // ============================================================================
  // PHASE 5: INFRASTRUCTURE CLEANUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Cleaning up infrastructure');
  const infrastructureCleanup = await ctx.task(infrastructureCleanupTask, {
    projectName,
    legacySystem,
    applicationShutdown,
    outputDir
  });

  artifacts.push(...infrastructureCleanup.artifacts);

  // ============================================================================
  // PHASE 6: COMPLIANCE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating compliance documentation');
  const complianceDocumentation = await ctx.task(complianceDocumentationTask, {
    projectName,
    legacySystem,
    dataArchival,
    accessRemoval,
    infrastructureCleanup,
    retentionPolicy,
    outputDir
  });

  artifacts.push(...complianceDocumentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Legacy decommissioning complete for ${projectName}. Data archived: ${dataArchival.archived}. Infrastructure cleaned: ${infrastructureCleanup.cleaned}. Compliance documented. Approve?`,
    title: 'Legacy Decommissioning Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        system: legacySystem.name,
        dataArchived: dataArchival.archived,
        accessRemoved: accessRemoval.removedCount,
        infrastructureCleaned: infrastructureCleanup.cleaned,
        complianceComplete: complianceDocumentation.complete
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    decommissionPlan,
    archivedData: dataArchival,
    removedAccess: accessRemoval.removedAccess,
    cleanedInfrastructure: infrastructureCleanup,
    complianceDocumentation,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/legacy-decommissioning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const decommissionPlanningTask = defineTask('decommission-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Decommission Planning - ${args.projectName}`,
  agent: {
    name: 'decommission-planner',
    prompt: {
      role: 'Project Manager',
      task: 'Plan legacy system decommissioning',
      context: args,
      instructions: [
        '1. Identify all components',
        '2. Document dependencies',
        '3. Plan data archival',
        '4. Identify access to remove',
        '5. Plan infrastructure cleanup',
        '6. Set timeline',
        '7. Identify stakeholders',
        '8. Plan communications',
        '9. Document compliance needs',
        '10. Generate decommission plan'
      ],
      outputFormat: 'JSON with components, dataToArchive, accessToRemove, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'dataToArchive', 'timeline', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        dataToArchive: { type: 'string' },
        accessToRemove: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decommissioning', 'planning', 'legacy']
}));

export const dataArchivalTask = defineTask('data-archival', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Archival - ${args.projectName}`,
  agent: {
    name: 'data-archivist',
    prompt: {
      role: 'Data Engineer',
      task: 'Archive legacy data',
      context: args,
      instructions: [
        '1. Export data',
        '2. Validate exports',
        '3. Compress archives',
        '4. Encrypt sensitive data',
        '5. Transfer to archive storage',
        '6. Verify integrity',
        '7. Document archive location',
        '8. Set retention metadata',
        '9. Test retrieval',
        '10. Generate archival report'
      ],
      outputFormat: 'JSON with archived, archiveLocation, dataVolume, encrypted, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['archived', 'archiveLocation', 'artifacts'],
      properties: {
        archived: { type: 'boolean' },
        archiveLocation: { type: 'string' },
        dataVolume: { type: 'string' },
        encrypted: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decommissioning', 'archival', 'data']
}));

export const accessRemovalTask = defineTask('access-removal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Access Removal - ${args.projectName}`,
  agent: {
    name: 'access-admin',
    prompt: {
      role: 'Security Administrator',
      task: 'Remove access to legacy system',
      context: args,
      instructions: [
        '1. Identify all access',
        '2. Notify users',
        '3. Remove user accounts',
        '4. Revoke service accounts',
        '5. Remove API keys',
        '6. Revoke certificates',
        '7. Remove network access',
        '8. Disable integrations',
        '9. Audit access removal',
        '10. Generate access report'
      ],
      outputFormat: 'JSON with removedCount, removedAccess, notifications, audit, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['removedCount', 'removedAccess', 'artifacts'],
      properties: {
        removedCount: { type: 'number' },
        removedAccess: { type: 'array', items: { type: 'object' } },
        notifications: { type: 'array', items: { type: 'object' } },
        audit: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decommissioning', 'access', 'security']
}));

export const applicationShutdownTask = defineTask('application-shutdown', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Application Shutdown - ${args.projectName}`,
  agent: {
    name: 'shutdown-engineer',
    prompt: {
      role: 'Operations Engineer',
      task: 'Shutdown legacy application',
      context: args,
      instructions: [
        '1. Notify stakeholders',
        '2. Stop application services',
        '3. Stop scheduled jobs',
        '4. Disable endpoints',
        '5. Stop message processing',
        '6. Verify no traffic',
        '7. Document shutdown',
        '8. Take final backup',
        '9. Confirm shutdown',
        '10. Generate shutdown report'
      ],
      outputFormat: 'JSON with shutdown, services, finalBackup, timestamp, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['shutdown', 'services', 'artifacts'],
      properties: {
        shutdown: { type: 'boolean' },
        services: { type: 'array', items: { type: 'object' } },
        finalBackup: { type: 'object' },
        timestamp: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decommissioning', 'shutdown', 'application']
}));

export const infrastructureCleanupTask = defineTask('infrastructure-cleanup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Infrastructure Cleanup - ${args.projectName}`,
  agent: {
    name: 'infrastructure-cleaner',
    prompt: {
      role: 'Infrastructure Engineer',
      task: 'Clean up legacy infrastructure',
      context: args,
      instructions: [
        '1. Inventory resources',
        '2. Remove VMs/containers',
        '3. Delete databases',
        '4. Remove storage',
        '5. Clean up networking',
        '6. Remove DNS entries',
        '7. Clean up load balancers',
        '8. Remove monitoring',
        '9. Document cleanup',
        '10. Generate cleanup report'
      ],
      outputFormat: 'JSON with cleaned, resources, costSavings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cleaned', 'resources', 'artifacts'],
      properties: {
        cleaned: { type: 'boolean' },
        resources: { type: 'array', items: { type: 'object' } },
        costSavings: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decommissioning', 'infrastructure', 'cleanup']
}));

export const complianceDocumentationTask = defineTask('compliance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Compliance Documentation - ${args.projectName}`,
  agent: {
    name: 'compliance-writer',
    prompt: {
      role: 'Compliance Specialist',
      task: 'Create decommissioning compliance documentation',
      context: args,
      instructions: [
        '1. Document data archival',
        '2. Record access removal',
        '3. Document shutdown date',
        '4. Record cleanup details',
        '5. Create audit trail',
        '6. Document retention',
        '7. Get sign-offs',
        '8. Archive documentation',
        '9. Notify compliance team',
        '10. Generate compliance report'
      ],
      outputFormat: 'JSON with complete, documents, auditTrail, signoffs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['complete', 'documents', 'auditTrail', 'artifacts'],
      properties: {
        complete: { type: 'boolean' },
        documents: { type: 'array', items: { type: 'object' } },
        auditTrail: { type: 'object' },
        signoffs: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decommissioning', 'compliance', 'documentation']
}));
