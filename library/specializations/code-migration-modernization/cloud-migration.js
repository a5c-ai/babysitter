/**
 * @process specializations/code-migration-modernization/cloud-migration
 * @description Cloud Migration - Comprehensive process for migrating applications to cloud platforms
 * (AWS, Azure, GCP) using lift-and-shift, replatforming, or refactoring strategies with proper
 * infrastructure-as-code and operational readiness.
 * @inputs { projectName: string, sourceEnvironment?: object, targetCloud?: string, migrationStrategy?: string, complianceRequirements?: array }
 * @outputs { success: boolean, assessmentReport: object, migrationPlan: object, infrastructureCode: object, deployedResources: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/cloud-migration', {
 *   projectName: 'ERP Cloud Migration',
 *   sourceEnvironment: { type: 'on-premises', datacenter: 'east-coast' },
 *   targetCloud: 'AWS',
 *   migrationStrategy: 'replatform',
 *   complianceRequirements: ['SOC2', 'HIPAA']
 * });
 *
 * @references
 * - AWS Migration Hub: https://aws.amazon.com/migration-hub/
 * - Azure Migrate: https://azure.microsoft.com/en-us/services/azure-migrate/
 * - Google Cloud Migration: https://cloud.google.com/migration-center
 * - 6 Rs of Migration: https://docs.aws.amazon.com/prescriptive-guidance/latest/migration-strategies/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceEnvironment = {},
    targetCloud = 'AWS',
    migrationStrategy = 'replatform',
    complianceRequirements = [],
    outputDir = 'cloud-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cloud Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: DISCOVERY AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and assessing workloads');
  const discoveryAssessment = await ctx.task(discoveryAssessmentTask, {
    projectName,
    sourceEnvironment,
    targetCloud,
    outputDir
  });

  artifacts.push(...discoveryAssessment.artifacts);

  // ============================================================================
  // PHASE 2: CLOUD ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing cloud architecture');
  const architectureDesign = await ctx.task(cloudArchitectureDesignTask, {
    projectName,
    discoveryAssessment,
    targetCloud,
    migrationStrategy,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // Breakpoint: Architecture review
  await ctx.breakpoint({
    question: `Cloud architecture designed for ${projectName}. Target: ${targetCloud}. Strategy: ${migrationStrategy}. Estimated monthly cost: ${architectureDesign.estimatedMonthlyCost}. Approve architecture?`,
    title: 'Cloud Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      architectureDesign,
      recommendation: 'Review cost estimates and compliance alignment'
    }
  });

  // ============================================================================
  // PHASE 3: INFRASTRUCTURE AS CODE
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating infrastructure as code');
  const infrastructureCode = await ctx.task(infrastructureAsCodeTask, {
    projectName,
    architectureDesign,
    targetCloud,
    outputDir
  });

  artifacts.push(...infrastructureCode.artifacts);

  // ============================================================================
  // PHASE 4: NETWORK AND SECURITY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up network and security');
  const networkSecuritySetup = await ctx.task(networkSecuritySetupTask, {
    projectName,
    architectureDesign,
    infrastructureCode,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...networkSecuritySetup.artifacts);

  // ============================================================================
  // PHASE 5: DATA MIGRATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning data migration');
  const dataMigrationPlan = await ctx.task(cloudDataMigrationPlanningTask, {
    projectName,
    discoveryAssessment,
    architectureDesign,
    targetCloud,
    outputDir
  });

  artifacts.push(...dataMigrationPlan.artifacts);

  // ============================================================================
  // PHASE 6: APPLICATION MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Migrating applications');
  const applicationMigration = await ctx.task(applicationMigrationTask, {
    projectName,
    discoveryAssessment,
    architectureDesign,
    infrastructureCode,
    migrationStrategy,
    outputDir
  });

  artifacts.push(...applicationMigration.artifacts);

  // Breakpoint: Migration progress
  await ctx.breakpoint({
    question: `Application migration progress for ${projectName}. Migrated: ${applicationMigration.migratedCount}/${applicationMigration.totalCount}. Continue with validation?`,
    title: 'Application Migration Progress',
    context: {
      runId: ctx.runId,
      projectName,
      applicationMigration,
      recommendation: 'Validate migrated applications before data migration'
    }
  });

  // ============================================================================
  // PHASE 7: DATA MIGRATION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Executing data migration');
  const dataMigrationExecution = await ctx.task(dataMigrationExecutionTask, {
    projectName,
    dataMigrationPlan,
    applicationMigration,
    outputDir
  });

  artifacts.push(...dataMigrationExecution.artifacts);

  // ============================================================================
  // PHASE 8: VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating and testing');
  const validationTesting = await ctx.task(cloudValidationTestingTask, {
    projectName,
    applicationMigration,
    dataMigrationExecution,
    outputDir
  });

  artifacts.push(...validationTesting.artifacts);

  // ============================================================================
  // PHASE 9: CUTOVER PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 9: Planning cutover');
  const cutoverPlan = await ctx.task(cutoverPlanningTask, {
    projectName,
    applicationMigration,
    validationTesting,
    outputDir
  });

  artifacts.push(...cutoverPlan.artifacts);

  // ============================================================================
  // PHASE 10: OPERATIONAL READINESS
  // ============================================================================

  ctx.log('info', 'Phase 10: Ensuring operational readiness');
  const operationalReadiness = await ctx.task(operationalReadinessTask, {
    projectName,
    architectureDesign,
    applicationMigration,
    targetCloud,
    outputDir
  });

  artifacts.push(...operationalReadiness.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Cloud migration complete for ${projectName}. Apps migrated: ${applicationMigration.migratedCount}. Data migrated: ${dataMigrationExecution.success}. Operational readiness: ${operationalReadiness.readinessScore}%. Approve migration?`,
    title: 'Cloud Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        cloud: targetCloud,
        strategy: migrationStrategy,
        appsMigrated: applicationMigration.migratedCount,
        dataMigrated: dataMigrationExecution.success,
        operationalReadiness: operationalReadiness.readinessScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    assessmentReport: discoveryAssessment,
    migrationPlan: {
      strategy: migrationStrategy,
      phases: cutoverPlan.phases,
      timeline: cutoverPlan.timeline
    },
    infrastructureCode: {
      tool: infrastructureCode.iacTool,
      modules: infrastructureCode.moduleCount,
      path: infrastructureCode.codePath
    },
    deployedResources: applicationMigration.deployedResources,
    networkSecurity: networkSecuritySetup,
    dataMigration: {
      success: dataMigrationExecution.success,
      dataVolume: dataMigrationExecution.dataVolume
    },
    operationalReadiness: {
      score: operationalReadiness.readinessScore,
      monitoring: operationalReadiness.monitoringSetup,
      alerting: operationalReadiness.alertingSetup
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/cloud-migration',
      timestamp: startTime,
      targetCloud,
      migrationStrategy,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const discoveryAssessmentTask = defineTask('discovery-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Discovery and Assessment - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Cloud Migration Analyst',
      task: 'Discover and assess workloads for cloud migration',
      context: args,
      instructions: [
        '1. Inventory all applications',
        '2. Document current infrastructure',
        '3. Assess application dependencies',
        '4. Analyze resource utilization',
        '5. Identify migration complexity',
        '6. Assess cloud readiness',
        '7. Identify blockers',
        '8. Document data stores',
        '9. Assess network requirements',
        '10. Generate assessment report'
      ],
      outputFormat: 'JSON with applications, infrastructure, dependencies, complexity, cloudReadiness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applications', 'infrastructure', 'artifacts'],
      properties: {
        applications: { type: 'array', items: { type: 'object' } },
        infrastructure: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        complexity: { type: 'string' },
        cloudReadiness: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'discovery', 'assessment']
}));

export const cloudArchitectureDesignTask = defineTask('cloud-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Cloud Architecture Design - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Cloud Solutions Architect',
      task: 'Design target cloud architecture',
      context: args,
      instructions: [
        '1. Select cloud services',
        '2. Design network topology',
        '3. Plan compute resources',
        '4. Design storage architecture',
        '5. Plan database services',
        '6. Design for high availability',
        '7. Plan disaster recovery',
        '8. Estimate costs',
        '9. Address compliance',
        '10. Generate architecture diagrams'
      ],
      outputFormat: 'JSON with services, networkDesign, computeResources, storageDesign, estimatedMonthlyCost, diagrams, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'estimatedMonthlyCost', 'artifacts'],
      properties: {
        services: { type: 'array', items: { type: 'object' } },
        networkDesign: { type: 'object' },
        computeResources: { type: 'array', items: { type: 'object' } },
        storageDesign: { type: 'object' },
        estimatedMonthlyCost: { type: 'string' },
        diagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'architecture', 'design']
}));

export const infrastructureAsCodeTask = defineTask('infrastructure-as-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Infrastructure as Code - ${args.projectName}`,
  agent: {
    name: 'iac-generator',
    prompt: {
      role: 'Infrastructure Engineer',
      task: 'Create infrastructure as code',
      context: args,
      instructions: [
        '1. Select IaC tool (Terraform, CloudFormation, Pulumi)',
        '2. Create network modules',
        '3. Create compute modules',
        '4. Create storage modules',
        '5. Create database modules',
        '6. Implement security groups',
        '7. Configure IAM roles',
        '8. Set up state management',
        '9. Test infrastructure code',
        '10. Document modules'
      ],
      outputFormat: 'JSON with iacTool, moduleCount, codePath, modules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['iacTool', 'moduleCount', 'codePath', 'artifacts'],
      properties: {
        iacTool: { type: 'string' },
        moduleCount: { type: 'number' },
        codePath: { type: 'string' },
        modules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'iac', 'infrastructure']
}));

export const networkSecuritySetupTask = defineTask('network-security-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Network and Security Setup - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Cloud Security Engineer',
      task: 'Set up network and security controls',
      context: args,
      instructions: [
        '1. Configure VPC/VNet',
        '2. Set up subnets',
        '3. Configure security groups',
        '4. Set up VPN/Direct Connect',
        '5. Configure WAF',
        '6. Set up identity management',
        '7. Configure encryption',
        '8. Set up logging',
        '9. Configure compliance controls',
        '10. Document security architecture'
      ],
      outputFormat: 'JSON with networkConfig, securityGroups, identitySetup, encryptionConfig, complianceStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['networkConfig', 'securityGroups', 'artifacts'],
      properties: {
        networkConfig: { type: 'object' },
        securityGroups: { type: 'array', items: { type: 'object' } },
        identitySetup: { type: 'object' },
        encryptionConfig: { type: 'object' },
        complianceStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'network', 'security']
}));

export const cloudDataMigrationPlanningTask = defineTask('cloud-data-migration-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Data Migration Planning - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Data Migration Specialist',
      task: 'Plan data migration to cloud',
      context: args,
      instructions: [
        '1. Assess data volume',
        '2. Choose transfer method',
        '3. Plan database migration',
        '4. Design sync strategy',
        '5. Plan validation approach',
        '6. Estimate transfer time',
        '7. Plan cutover window',
        '8. Design rollback',
        '9. Select migration tools',
        '10. Generate migration plan'
      ],
      outputFormat: 'JSON with dataVolume, transferMethod, databasePlan, syncStrategy, estimatedTime, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataVolume', 'transferMethod', 'estimatedTime', 'artifacts'],
      properties: {
        dataVolume: { type: 'string' },
        transferMethod: { type: 'string' },
        databasePlan: { type: 'object' },
        syncStrategy: { type: 'string' },
        estimatedTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'data', 'planning']
}));

export const applicationMigrationTask = defineTask('application-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Application Migration - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Application Migration Engineer',
      task: 'Migrate applications to cloud',
      context: args,
      instructions: [
        '1. Prepare application for cloud',
        '2. Containerize if needed',
        '3. Configure cloud services',
        '4. Deploy to cloud',
        '5. Configure networking',
        '6. Set up auto-scaling',
        '7. Configure logging',
        '8. Test functionality',
        '9. Validate performance',
        '10. Document deployment'
      ],
      outputFormat: 'JSON with totalCount, migratedCount, deployedResources, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCount', 'migratedCount', 'deployedResources', 'artifacts'],
      properties: {
        totalCount: { type: 'number' },
        migratedCount: { type: 'number' },
        deployedResources: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'application', 'deployment']
}));

export const dataMigrationExecutionTask = defineTask('data-migration-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Data Migration Execution - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Data Migration Engineer',
      task: 'Execute data migration to cloud',
      context: args,
      instructions: [
        '1. Execute data transfer',
        '2. Monitor transfer progress',
        '3. Validate data integrity',
        '4. Sync incremental changes',
        '5. Test data access',
        '6. Validate queries',
        '7. Check performance',
        '8. Document completion',
        '9. Verify backups',
        '10. Generate migration report'
      ],
      outputFormat: 'JSON with success, dataVolume, transferTime, dataIntegrity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dataVolume', 'dataIntegrity', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dataVolume: { type: 'string' },
        transferTime: { type: 'string' },
        dataIntegrity: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'data', 'execution']
}));

export const cloudValidationTestingTask = defineTask('cloud-validation-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validation and Testing - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'Cloud QA Engineer',
      task: 'Validate migrated applications',
      context: args,
      instructions: [
        '1. Test functionality',
        '2. Validate data access',
        '3. Test performance',
        '4. Test failover',
        '5. Validate security',
        '6. Test integrations',
        '7. Run load tests',
        '8. Validate compliance',
        '9. Test disaster recovery',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON with allPassed, functionalTests, performanceTests, securityTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'functionalTests', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        functionalTests: { type: 'object' },
        performanceTests: { type: 'object' },
        securityTests: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'validation', 'testing']
}));

export const cutoverPlanningTask = defineTask('cutover-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Cutover Planning - ${args.projectName}`,
  agent: {
    name: 'cutover-coordinator',
    prompt: {
      role: 'Release Manager',
      task: 'Plan production cutover',
      context: args,
      instructions: [
        '1. Define cutover phases',
        '2. Schedule maintenance windows',
        '3. Plan DNS changes',
        '4. Coordinate teams',
        '5. Prepare communications',
        '6. Plan rollback triggers',
        '7. Create runbooks',
        '8. Define go/no-go criteria',
        '9. Plan monitoring',
        '10. Generate cutover plan'
      ],
      outputFormat: 'JSON with phases, timeline, maintenanceWindow, rollbackPlan, runbooks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        maintenanceWindow: { type: 'object' },
        rollbackPlan: { type: 'object' },
        runbooks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'cutover', 'planning']
}));

export const operationalReadinessTask = defineTask('operational-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Operational Readiness - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Site Reliability Engineer',
      task: 'Ensure operational readiness in cloud',
      context: args,
      instructions: [
        '1. Set up monitoring dashboards',
        '2. Configure alerting',
        '3. Set up log aggregation',
        '4. Create runbooks',
        '5. Train operations team',
        '6. Set up on-call rotation',
        '7. Configure backup policies',
        '8. Test incident response',
        '9. Calculate readiness score',
        '10. Generate readiness report'
      ],
      outputFormat: 'JSON with readinessScore, monitoringSetup, alertingSetup, runbooks, trainingComplete, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'monitoringSetup', 'alertingSetup', 'artifacts'],
      properties: {
        readinessScore: { type: 'number' },
        monitoringSetup: { type: 'object' },
        alertingSetup: { type: 'object' },
        runbooks: { type: 'array', items: { type: 'string' } },
        trainingComplete: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cloud-migration', 'operations', 'readiness']
}));
