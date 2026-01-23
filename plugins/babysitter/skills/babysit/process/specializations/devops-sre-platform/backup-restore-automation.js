/**
 * @process specializations/devops-sre-platform/backup-restore-automation
 * @description Backup and Restore Automation - Comprehensive automated backup and disaster recovery framework covering
 * backup strategy design, automated backup scheduling, multi-cloud storage, point-in-time recovery, disaster recovery
 * testing, compliance validation, and restoration workflows for databases, volumes, configurations, and applications.
 * @inputs { projectName: string, backupScope: string, dataTypes?: array, rpo?: number, rto?: number, retentionDays?: number }
 * @outputs { success: boolean, backupScore: number, backupJobs: array, restorePlans: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/backup-restore-automation', {
 *   projectName: 'E-commerce Platform',
 *   backupScope: 'full-stack', // 'application', 'database', 'infrastructure', 'full-stack'
 *   dataTypes: ['postgres', 'mongodb', 'redis', 'kubernetes', 's3', 'volumes'],
 *   rpo: 60, // Recovery Point Objective in minutes
 *   rto: 120, // Recovery Time Objective in minutes
 *   retentionDays: 30,
 *   environment: 'production',
 *   cloudProvider: 'aws', // 'aws', 'gcp', 'azure', 'multi-cloud'
 *   complianceRequirements: ['GDPR', 'SOC2', 'HIPAA'],
 *   encryptionRequired: true
 * });
 *
 * @references
 * - AWS Backup: https://aws.amazon.com/backup/
 * - Velero (Kubernetes): https://velero.io/
 * - Disaster Recovery Planning: https://sre.google/sre-book/data-integrity/
 * - Backup Best Practices: https://docs.microsoft.com/en-us/azure/architecture/framework/resiliency/backup-and-recovery
 * - RPO/RTO Guidelines: https://www.ibm.com/cloud/learn/rpo-rto
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    backupScope = 'full-stack', // 'application', 'database', 'infrastructure', 'full-stack'
    dataTypes = ['postgres', 'mongodb', 'kubernetes', 'volumes'],
    rpo = 240, // Recovery Point Objective in minutes (4 hours default)
    rto = 480, // Recovery Time Objective in minutes (8 hours default)
    retentionDays = 30,
    environment = 'production',
    cloudProvider = 'aws', // 'aws', 'gcp', 'azure', 'multi-cloud'
    backupDestination = 's3', // 's3', 'gcs', 'azure-blob', 'multi-cloud'
    complianceRequirements = [],
    encryptionRequired = true,
    crossRegionReplication = true,
    automatedTesting = true,
    outputDir = 'backup-restore-output',
    backupTool = 'auto' // 'auto', 'velero', 'aws-backup', 'custom'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let backupScore = 0;
  const implementations = [];
  const backupJobs = [];
  const restorePlans = [];

  ctx.log('info', `Starting Backup and Restore Automation for ${projectName}`);
  ctx.log('info', `Scope: ${backupScope}, RPO: ${rpo}min, RTO: ${rto}min, Retention: ${retentionDays} days`);
  ctx.log('info', `Data Types: ${dataTypes.join(', ')}`);

  // ============================================================================
  // PHASE 1: ASSESS BACKUP REQUIREMENTS AND CURRENT STATE
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing backup requirements and analyzing current state');

  const assessmentResult = await ctx.task(assessBackupRequirementsTask, {
    projectName,
    backupScope,
    dataTypes,
    rpo,
    rto,
    retentionDays,
    environment,
    cloudProvider,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...assessmentResult.artifacts);

  ctx.log('info', `Assessment complete - Identified ${assessmentResult.backupTargets.length} backup targets, current coverage: ${assessmentResult.currentCoverage}%`);

  // Quality Gate: Requirements review
  await ctx.breakpoint({
    question: `Backup requirements assessed for ${projectName}. Identified ${assessmentResult.backupTargets.length} targets with RPO ${rpo}min and RTO ${rto}min. Current coverage: ${assessmentResult.currentCoverage}%. Review and approve backup scope?`,
    title: 'Backup Requirements Review',
    context: {
      runId: ctx.runId,
      assessment: {
        backupTargets: assessmentResult.backupTargets.slice(0, 10),
        criticalData: assessmentResult.criticalData,
        rpoRtoCompliance: assessmentResult.rpoRtoCompliance,
        estimatedBackupSize: assessmentResult.estimatedBackupSize,
        complianceGaps: assessmentResult.complianceGaps
      },
      files: assessmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: DESIGN BACKUP STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing comprehensive backup strategy');

  const strategyResult = await ctx.task(designBackupStrategyTask, {
    projectName,
    backupScope,
    assessmentResult,
    dataTypes,
    rpo,
    rto,
    retentionDays,
    cloudProvider,
    backupDestination,
    complianceRequirements,
    encryptionRequired,
    crossRegionReplication,
    outputDir
  });

  implementations.push({
    phase: 'Backup Strategy',
    result: strategyResult
  });

  artifacts.push(...strategyResult.artifacts);

  ctx.log('info', `Backup strategy designed - ${strategyResult.backupTypes.length} backup types, ${strategyResult.schedules.length} schedules`);

  // Quality Gate: Strategy review
  await ctx.breakpoint({
    question: `Backup strategy designed with ${strategyResult.backupTypes.length} backup types and ${strategyResult.schedules.length} schedules. Estimated daily backup: ${strategyResult.estimatedDailyBackupSize}, monthly cost: ${strategyResult.estimatedMonthlyCost}. Approve strategy?`,
    title: 'Backup Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: {
        backupTypes: strategyResult.backupTypes,
        schedules: strategyResult.schedules,
        retention: strategyResult.retentionPolicy,
        estimatedCost: strategyResult.estimatedMonthlyCost
      },
      files: strategyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: CONFIGURE BACKUP INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring backup infrastructure and storage');

  const infrastructureResult = await ctx.task(configureBackupInfrastructureTask, {
    projectName,
    environment,
    cloudProvider,
    backupDestination,
    strategyResult,
    encryptionRequired,
    crossRegionReplication,
    complianceRequirements,
    outputDir
  });

  implementations.push({
    phase: 'Backup Infrastructure',
    result: infrastructureResult
  });

  artifacts.push(...infrastructureResult.artifacts);

  ctx.log('info', `Backup infrastructure configured - Storage: ${infrastructureResult.storageLocation}, Encryption: ${infrastructureResult.encryptionEnabled}`);

  // ============================================================================
  // PHASE 4: IMPLEMENT DATABASE BACKUP AUTOMATION
  // ============================================================================

  if (dataTypes.some(dt => ['postgres', 'mysql', 'mongodb', 'redis', 'dynamodb', 'rds'].includes(dt))) {
    ctx.log('info', 'Phase 4: Implementing database backup automation');

    const databaseBackupResult = await ctx.task(implementDatabaseBackupTask, {
      projectName,
      environment,
      dataTypes: dataTypes.filter(dt => ['postgres', 'mysql', 'mongodb', 'redis', 'dynamodb', 'rds'].includes(dt)),
      strategyResult,
      infrastructureResult,
      rpo,
      rto,
      outputDir
    });

    implementations.push({
      phase: 'Database Backup',
      result: databaseBackupResult
    });

    artifacts.push(...databaseBackupResult.artifacts);
    backupJobs.push(...databaseBackupResult.backupJobs);

    ctx.log('info', `Database backup configured - ${databaseBackupResult.backupJobs.length} backup jobs created`);

    // Quality Gate: Database backup verification
    await ctx.breakpoint({
      question: `Database backup automation configured for ${databaseBackupResult.databases.length} databases. ${databaseBackupResult.backupJobs.length} backup jobs created. PITR enabled: ${databaseBackupResult.pitrEnabled}. Verify configuration?`,
      title: 'Database Backup Review',
      context: {
        runId: ctx.runId,
        databaseBackup: {
          databases: databaseBackupResult.databases,
          backupJobsCount: databaseBackupResult.backupJobs.length,
          pitrEnabled: databaseBackupResult.pitrEnabled,
          schedules: databaseBackupResult.schedules
        },
        files: databaseBackupResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: IMPLEMENT KUBERNETES/CONTAINER BACKUP
  // ============================================================================

  if (dataTypes.includes('kubernetes') || dataTypes.includes('containers')) {
    ctx.log('info', 'Phase 5: Implementing Kubernetes and container backup');

    const k8sBackupResult = await ctx.task(implementKubernetesBackupTask, {
      projectName,
      environment,
      strategyResult,
      infrastructureResult,
      backupTool,
      cloudProvider,
      outputDir
    });

    implementations.push({
      phase: 'Kubernetes Backup',
      result: k8sBackupResult
    });

    artifacts.push(...k8sBackupResult.artifacts);
    backupJobs.push(...k8sBackupResult.backupJobs);

    ctx.log('info', `Kubernetes backup configured - Tool: ${k8sBackupResult.backupTool}, Schedules: ${k8sBackupResult.schedules.length}`);

    // Quality Gate: Kubernetes backup verification
    await ctx.breakpoint({
      question: `Kubernetes backup configured using ${k8sBackupResult.backupTool}. ${k8sBackupResult.namespaces.length} namespaces, ${k8sBackupResult.schedules.length} schedules. Volume snapshots enabled: ${k8sBackupResult.volumeSnapshotsEnabled}. Verify configuration?`,
      title: 'Kubernetes Backup Review',
      context: {
        runId: ctx.runId,
        k8sBackup: {
          backupTool: k8sBackupResult.backupTool,
          namespaces: k8sBackupResult.namespaces,
          schedules: k8sBackupResult.schedules,
          volumeSnapshotsEnabled: k8sBackupResult.volumeSnapshotsEnabled
        },
        files: k8sBackupResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: IMPLEMENT VOLUME AND FILE SYSTEM BACKUP
  // ============================================================================

  if (dataTypes.includes('volumes') || dataTypes.includes('ebs') || dataTypes.includes('s3')) {
    ctx.log('info', 'Phase 6: Implementing volume and file system backup');

    const volumeBackupResult = await ctx.task(implementVolumeBackupTask, {
      projectName,
      environment,
      cloudProvider,
      dataTypes: dataTypes.filter(dt => ['volumes', 'ebs', 'efs', 's3', 'gcs', 'azure-disk'].includes(dt)),
      strategyResult,
      infrastructureResult,
      outputDir
    });

    implementations.push({
      phase: 'Volume Backup',
      result: volumeBackupResult
    });

    artifacts.push(...volumeBackupResult.artifacts);
    backupJobs.push(...volumeBackupResult.backupJobs);

    ctx.log('info', `Volume backup configured - ${volumeBackupResult.volumes.length} volumes, ${volumeBackupResult.backupJobs.length} backup jobs`);
  }

  // ============================================================================
  // PHASE 7: IMPLEMENT APPLICATION AND CONFIGURATION BACKUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing application and configuration backup');

  const appBackupResult = await ctx.task(implementApplicationBackupTask, {
    projectName,
    environment,
    backupScope,
    strategyResult,
    infrastructureResult,
    outputDir
  });

  implementations.push({
    phase: 'Application Backup',
    result: appBackupResult
  });

  artifacts.push(...appBackupResult.artifacts);
  backupJobs.push(...appBackupResult.backupJobs);

  ctx.log('info', `Application backup configured - ${appBackupResult.backupJobs.length} backup jobs for configs, secrets, and application state`);

  // ============================================================================
  // PHASE 8: IMPLEMENT AUTOMATED BACKUP MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing automated backup monitoring and alerting');

  const monitoringResult = await ctx.task(setupBackupMonitoringTask, {
    projectName,
    environment,
    backupJobs: [...backupJobs],
    strategyResult,
    rpo,
    rto,
    outputDir
  });

  implementations.push({
    phase: 'Backup Monitoring',
    result: monitoringResult
  });

  artifacts.push(...monitoringResult.artifacts);

  ctx.log('info', `Backup monitoring configured - ${monitoringResult.dashboards.length} dashboards, ${monitoringResult.alerts.length} alerts`);

  // ============================================================================
  // PHASE 9: CREATE DISASTER RECOVERY PLANS
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating disaster recovery and restore plans');

  const drPlanResult = await ctx.task(createDisasterRecoveryPlansTask, {
    projectName,
    environment,
    backupScope,
    assessmentResult,
    strategyResult,
    implementations,
    backupJobs,
    rpo,
    rto,
    outputDir
  });

  restorePlans.push(...drPlanResult.restorePlans);
  artifacts.push(...drPlanResult.artifacts);

  ctx.log('info', `Disaster recovery plans created - ${drPlanResult.restorePlans.length} restore scenarios documented`);

  // Quality Gate: DR plan review
  await ctx.breakpoint({
    question: `Disaster recovery plans created for ${drPlanResult.restorePlans.length} scenarios. RTO target: ${rto}min. Review restore procedures and runbooks?`,
    title: 'Disaster Recovery Plan Review',
    context: {
      runId: ctx.runId,
      drPlans: {
        restorePlans: drPlanResult.restorePlans.slice(0, 5),
        rtoTarget: rto,
        rpoTarget: rpo,
        scenarios: drPlanResult.scenarios
      },
      files: drPlanResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 10: VALIDATE BACKUP CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating backup configuration and coverage');

  const validationResult = await ctx.task(validateBackupConfigurationTask, {
    projectName,
    assessmentResult,
    strategyResult,
    implementations,
    backupJobs,
    restorePlans,
    rpo,
    rto,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  ctx.log('info', `Validation complete - Coverage: ${validationResult.backupCoverage}%, RPO compliance: ${validationResult.rpoCompliance}%`);

  // Quality Gate: Validation review
  if (validationResult.backupCoverage < 95 || validationResult.rpoCompliance < 90) {
    await ctx.breakpoint({
      question: `Backup validation shows coverage ${validationResult.backupCoverage}% (target: 95%) and RPO compliance ${validationResult.rpoCompliance}% (target: 90%). Gaps: ${validationResult.gaps.length}. Address gaps before proceeding?`,
      title: 'Backup Validation Review',
      context: {
        runId: ctx.runId,
        validation: {
          backupCoverage: validationResult.backupCoverage,
          rpoCompliance: validationResult.rpoCompliance,
          rtoCompliance: validationResult.rtoCompliance,
          gaps: validationResult.gaps,
          recommendation: 'Address critical gaps before production deployment'
        },
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: CONDUCT BACKUP AND RESTORE TESTING
  // ============================================================================

  if (automatedTesting) {
    ctx.log('info', 'Phase 11: Conducting automated backup and restore testing');

    // Parallel restore tests for different data types
    const restoreTests = [];

    if (implementations.find(i => i.phase === 'Database Backup')) {
      restoreTests.push(() => ctx.task(testDatabaseRestoreTask, {
        projectName,
        environment: `${environment}-test`,
        databaseBackupResult: implementations.find(i => i.phase === 'Database Backup').result,
        outputDir
      }));
    }

    if (implementations.find(i => i.phase === 'Kubernetes Backup')) {
      restoreTests.push(() => ctx.task(testKubernetesRestoreTask, {
        projectName,
        environment: `${environment}-test`,
        k8sBackupResult: implementations.find(i => i.phase === 'Kubernetes Backup').result,
        outputDir
      }));
    }

    if (implementations.find(i => i.phase === 'Volume Backup')) {
      restoreTests.push(() => ctx.task(testVolumeRestoreTask, {
        projectName,
        environment: `${environment}-test`,
        volumeBackupResult: implementations.find(i => i.phase === 'Volume Backup').result,
        outputDir
      }));
    }

    const restoreTestResults = await ctx.parallel.all(restoreTests);

    const testingResult = {
      testsPassed: restoreTestResults.filter(r => r.success).length,
      testsFailed: restoreTestResults.filter(r => !r.success).length,
      testsTotal: restoreTestResults.length,
      results: restoreTestResults,
      artifacts: restoreTestResults.flatMap(r => r.artifacts || [])
    };

    artifacts.push(...testingResult.artifacts);

    ctx.log('info', `Restore testing complete - ${testingResult.testsPassed}/${testingResult.testsTotal} tests passed`);

    // Quality Gate: Testing validation
    if (testingResult.testsFailed > 0) {
      await ctx.breakpoint({
        question: `Restore testing complete - ${testingResult.testsFailed} tests failed out of ${testingResult.testsTotal}. Review failures and remediate?`,
        title: 'Restore Testing Review',
        context: {
          runId: ctx.runId,
          testing: {
            testsPassed: testingResult.testsPassed,
            testsFailed: testingResult.testsFailed,
            testsTotal: testingResult.testsTotal,
            failures: restoreTestResults.filter(r => !r.success).map(r => ({
              test: r.testName,
              error: r.error
            }))
          },
          files: testingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 12: COMPLIANCE AND AUDIT DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating compliance and audit documentation');

  const complianceResult = await ctx.task(generateComplianceDocumentationTask, {
    projectName,
    environment,
    complianceRequirements,
    assessmentResult,
    strategyResult,
    implementations,
    backupJobs,
    restorePlans,
    validationResult,
    outputDir
  });

  artifacts.push(...complianceResult.artifacts);

  ctx.log('info', `Compliance documentation generated - ${complianceResult.complianceReports.length} compliance reports`);

  // ============================================================================
  // PHASE 13: GENERATE COMPREHENSIVE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating comprehensive backup and restore documentation');

  const documentationResult = await ctx.task(generateBackupDocumentationTask, {
    projectName,
    environment,
    backupScope,
    assessmentResult,
    strategyResult,
    implementations,
    backupJobs,
    restorePlans,
    monitoringResult,
    validationResult,
    complianceResult,
    rpo,
    rto,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  ctx.log('info', `Documentation generated - Report: ${documentationResult.reportPath}`);

  // ============================================================================
  // PHASE 14: CALCULATE BACKUP SCORE AND FINAL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 14: Calculating backup readiness score and final assessment');

  const scoringResult = await ctx.task(calculateBackupScoreTask, {
    projectName,
    backupScope,
    rpo,
    rto,
    assessmentResult,
    strategyResult,
    implementations,
    backupJobs,
    restorePlans,
    validationResult,
    complianceResult,
    outputDir
  });

  backupScore = scoringResult.backupScore;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `Backup Readiness Score: ${backupScore}/100`);

  // Final Breakpoint: Backup automation complete
  await ctx.breakpoint({
    question: `Backup and Restore Automation Complete for ${projectName}. Score: ${backupScore}/100. Coverage: ${validationResult.backupCoverage}%. ${backupJobs.length} backup jobs configured. Approve for production deployment?`,
    title: 'Final Backup Automation Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        environment,
        backupScore,
        backupCoverage: validationResult.backupCoverage,
        rpo: `${rpo} minutes`,
        rto: `${rto} minutes`,
        backupJobsCount: backupJobs.length,
        restorePlansCount: restorePlans.length,
        complianceStatus: complianceResult.overallCompliance
      },
      implementation: {
        backupInfrastructure: infrastructureResult.storageLocation,
        databaseBackup: implementations.find(i => i.phase === 'Database Backup') ? 'Configured' : 'N/A',
        kubernetesBackup: implementations.find(i => i.phase === 'Kubernetes Backup') ? 'Configured' : 'N/A',
        volumeBackup: implementations.find(i => i.phase === 'Volume Backup') ? 'Configured' : 'N/A',
        monitoring: `${monitoringResult.dashboards.length} dashboards, ${monitoringResult.alerts.length} alerts`
      },
      verdict: scoringResult.verdict,
      recommendation: scoringResult.recommendation,
      files: [
        { path: documentationResult.reportPath, format: 'markdown', label: 'Backup & Restore Report' },
        { path: scoringResult.summaryPath, format: 'json', label: 'Backup Score Summary' },
        { path: drPlanResult.drPlaybookPath, format: 'markdown', label: 'Disaster Recovery Playbook' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    environment,
    backupScope,
    backupScore,
    backupCoverage: validationResult.backupCoverage,
    rpo,
    rto,
    rpoCompliance: validationResult.rpoCompliance,
    rtoCompliance: validationResult.rtoCompliance,
    implementations: implementations.map(impl => ({
      phase: impl.phase,
      configured: impl.result.success || impl.result.configured || true,
      details: impl.result.summary || impl.result.description || 'Configured'
    })),
    backupJobs: backupJobs.map(job => ({
      name: job.name,
      type: job.type,
      schedule: job.schedule,
      target: job.target,
      retention: job.retention
    })),
    restorePlans: restorePlans.map(plan => ({
      scenario: plan.scenario,
      estimatedRTO: plan.estimatedRTO,
      steps: plan.steps.length,
      tested: plan.tested
    })),
    monitoring: {
      dashboardsCreated: monitoringResult.dashboards.length,
      alertsConfigured: monitoringResult.alerts.length,
      metricsTracked: monitoringResult.metricsTracked
    },
    compliance: {
      requirements: complianceRequirements,
      overallCompliance: complianceResult.overallCompliance,
      reports: complianceResult.complianceReports.length
    },
    validation: {
      backupCoverage: validationResult.backupCoverage,
      rpoCompliance: validationResult.rpoCompliance,
      rtoCompliance: validationResult.rtoCompliance,
      gaps: validationResult.gaps.length,
      passed: validationResult.backupCoverage >= 95 && validationResult.rpoCompliance >= 90
    },
    artifacts,
    documentation: {
      reportPath: documentationResult.reportPath,
      summaryPath: scoringResult.summaryPath,
      drPlaybookPath: drPlanResult.drPlaybookPath,
      compliancePath: complianceResult.complianceReportPath
    },
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/backup-restore-automation',
      processSlug: 'backup-restore-automation',
      category: 'reliability-engineering',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      backupScope,
      cloudProvider,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Assess Backup Requirements
export const assessBackupRequirementsTask = defineTask('assess-backup-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Assess Backup Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Backup and Disaster Recovery Architect',
      task: 'Assess backup requirements and analyze current backup state',
      context: {
        projectName: args.projectName,
        backupScope: args.backupScope,
        dataTypes: args.dataTypes,
        rpo: args.rpo,
        rto: args.rto,
        retentionDays: args.retentionDays,
        environment: args.environment,
        cloudProvider: args.cloudProvider,
        complianceRequirements: args.complianceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all critical data sources that need backup:',
        '   - Databases (RDS, PostgreSQL, MySQL, MongoDB, Redis)',
        '   - File systems and volumes (EBS, EFS, S3, PVs)',
        '   - Kubernetes resources (deployments, configs, secrets)',
        '   - Application state and configurations',
        '   - Logs and metrics data',
        '2. Classify data by criticality (tier 1: critical, tier 2: important, tier 3: non-critical)',
        '3. Analyze current backup coverage:',
        '   - What is currently backed up',
        '   - What is missing backup coverage',
        '   - Current RPO and RTO for each data source',
        '4. Document data dependencies and restore order',
        '5. Estimate data volumes and growth rates',
        '6. Identify compliance requirements for each data type (GDPR, HIPAA, SOC2, PCI-DSS)',
        '7. Assess current backup tools and processes',
        '8. Calculate current backup coverage percentage',
        '9. Identify gaps in RPO/RTO compliance',
        '10. Estimate total backup storage requirements',
        '11. Create backup requirements assessment document'
      ],
      outputFormat: 'JSON object with backup requirements assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backupTargets', 'currentCoverage', 'criticalData', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backupTargets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['database', 'volume', 'kubernetes', 'application', 'configuration'] },
              criticality: { type: 'string', enum: ['tier-1-critical', 'tier-2-important', 'tier-3-non-critical'] },
              currentlyBackedUp: { type: 'boolean' },
              dataSize: { type: 'string' },
              growthRate: { type: 'string' },
              requiredRPO: { type: 'number' },
              requiredRTO: { type: 'number' }
            }
          }
        },
        criticalData: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of critical data sources (tier 1)'
        },
        currentCoverage: { type: 'number', description: 'Current backup coverage percentage' },
        currentBackupMethods: {
          type: 'array',
          items: { type: 'string' },
          description: 'Existing backup methods in use'
        },
        rpoRtoCompliance: {
          type: 'object',
          properties: {
            compliantSources: { type: 'number' },
            nonCompliantSources: { type: 'number' }
          }
        },
        estimatedBackupSize: { type: 'string', description: 'e.g., "500GB daily"' },
        complianceGaps: {
          type: 'array',
          items: { type: 'string' }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'backup-restore', 'assessment']
}));

// Phase 2: Design Backup Strategy
export const designBackupStrategyTask = defineTask('design-backup-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design Backup Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Backup Strategy Architect',
      task: 'Design comprehensive backup strategy aligned with RPO/RTO requirements',
      context: {
        projectName: args.projectName,
        backupScope: args.backupScope,
        assessmentResult: args.assessmentResult,
        dataTypes: args.dataTypes,
        rpo: args.rpo,
        rto: args.rto,
        retentionDays: args.retentionDays,
        cloudProvider: args.cloudProvider,
        backupDestination: args.backupDestination,
        complianceRequirements: args.complianceRequirements,
        encryptionRequired: args.encryptionRequired,
        crossRegionReplication: args.crossRegionReplication,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design multi-tier backup strategy based on data criticality:',
        '   - Tier 1 (critical): Continuous backup with PITR, RPO < 1 hour',
        '   - Tier 2 (important): Hourly/daily incremental backups, RPO 4-8 hours',
        '   - Tier 3 (non-critical): Daily full backups, RPO 24 hours',
        '2. Select backup types for each data source:',
        '   - Full backups (weekly/monthly)',
        '   - Incremental backups (daily)',
        '   - Differential backups (hourly for critical)',
        '   - Continuous backups/WAL archiving (for databases)',
        '   - Snapshots (for volumes and kubernetes)',
        '3. Design backup schedules to meet RPO:',
        '   - Stagger backup windows to avoid resource contention',
        '   - Consider maintenance windows',
        '   - Plan for peak vs. off-peak times',
        '4. Design retention policy (GFS - Grandfather-Father-Son):',
        '   - Daily: Keep 7 days',
        '   - Weekly: Keep 4 weeks',
        '   - Monthly: Keep 12 months',
        '   - Yearly: Keep per compliance requirements',
        '5. Design backup storage architecture:',
        '   - Primary backup location',
        '   - Secondary backup location (cross-region)',
        '   - Cold storage for long-term retention',
        '   - Lifecycle policies for cost optimization',
        '6. Design encryption and security:',
        '   - Encryption at rest (AES-256)',
        '   - Encryption in transit (TLS)',
        '   - Key management (KMS, Vault)',
        '   - Access controls and IAM policies',
        '7. Estimate costs:',
        '   - Storage costs',
        '   - Transfer costs',
        '   - API/operation costs',
        '8. Create backup strategy document with diagrams'
      ],
      outputFormat: 'JSON object with backup strategy design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backupTypes', 'schedules', 'retentionPolicy', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backupTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataSource: { type: 'string' },
              backupType: { type: 'string', enum: ['full', 'incremental', 'differential', 'continuous', 'snapshot'] },
              frequency: { type: 'string' },
              achievedRPO: { type: 'number' },
              achievedRTO: { type: 'number' }
            }
          }
        },
        schedules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              cronExpression: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        retentionPolicy: {
          type: 'object',
          properties: {
            daily: { type: 'number', description: 'Days to keep daily backups' },
            weekly: { type: 'number', description: 'Weeks to keep weekly backups' },
            monthly: { type: 'number', description: 'Months to keep monthly backups' },
            yearly: { type: 'number', description: 'Years to keep yearly backups' }
          }
        },
        storageArchitecture: {
          type: 'object',
          properties: {
            primaryLocation: { type: 'string' },
            secondaryLocation: { type: 'string' },
            coldStorage: { type: 'string' },
            lifecyclePolicies: { type: 'boolean' }
          }
        },
        security: {
          type: 'object',
          properties: {
            encryptionAtRest: { type: 'boolean' },
            encryptionInTransit: { type: 'boolean' },
            keyManagement: { type: 'string' }
          }
        },
        estimatedDailyBackupSize: { type: 'string' },
        estimatedMonthlyCost: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'strategy']
}));

// Phase 3: Configure Backup Infrastructure
export const configureBackupInfrastructureTask = defineTask('configure-backup-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Configure Backup Infrastructure - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Infrastructure Engineer',
      task: 'Configure backup infrastructure and storage',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        cloudProvider: args.cloudProvider,
        backupDestination: args.backupDestination,
        strategyResult: args.strategyResult,
        encryptionRequired: args.encryptionRequired,
        crossRegionReplication: args.crossRegionReplication,
        complianceRequirements: args.complianceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up backup storage buckets/containers:',
        '   - AWS: S3 bucket with versioning enabled',
        '   - GCP: GCS bucket with object versioning',
        '   - Azure: Blob storage with soft delete',
        '2. Configure bucket/container policies:',
        '   - Block public access',
        '   - Enable MFA delete (for critical buckets)',
        '   - Lifecycle policies for retention',
        '   - Object lock for compliance (WORM)',
        '3. Set up encryption:',
        '   - Enable server-side encryption (SSE-KMS)',
        '   - Configure KMS keys',
        '   - Set up key rotation policies',
        '4. Configure cross-region replication:',
        '   - Primary region backup',
        '   - Secondary region for DR',
        '   - Replication rules and filters',
        '5. Set up IAM policies and service accounts:',
        '   - Backup service account with write-only permissions',
        '   - Restore service account with read permissions',
        '   - Audit logging for all access',
        '6. Configure networking:',
        '   - VPC endpoints/private links',
        '   - Network security groups',
        '   - Bandwidth throttling if needed',
        '7. Set up backup vaults (AWS Backup, Azure Backup Vault):',
        '   - Vault access policies',
        '   - Vault encryption',
        '   - Resource tags',
        '8. Enable monitoring and logging:',
        '   - CloudTrail/Cloud Audit Logs',
        '   - Storage metrics',
        '   - Cost tracking tags',
        '9. Create infrastructure as code (Terraform/CloudFormation)',
        '10. Document infrastructure setup'
      ],
      outputFormat: 'JSON object with backup infrastructure configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'storageLocation', 'encryptionEnabled', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        storageLocation: { type: 'string', description: 'Primary backup storage location' },
        secondaryLocation: { type: 'string', description: 'DR backup storage location' },
        encryptionEnabled: { type: 'boolean' },
        encryptionType: { type: 'string' },
        kmsKeyId: { type: 'string' },
        replicationEnabled: { type: 'boolean' },
        replicationRegion: { type: 'string' },
        lifecyclePoliciesConfigured: { type: 'boolean' },
        iamPolicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        vpcEndpointConfigured: { type: 'boolean' },
        monitoringEnabled: { type: 'boolean' },
        infrastructureCode: { type: 'string', description: 'Path to IaC files' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'infrastructure']
}));

// Phase 4: Implement Database Backup
export const implementDatabaseBackupTask = defineTask('implement-database-backup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Implement Database Backup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Reliability Engineer',
      task: 'Implement automated database backup with point-in-time recovery',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        dataTypes: args.dataTypes,
        strategyResult: args.strategyResult,
        infrastructureResult: args.infrastructureResult,
        rpo: args.rpo,
        rto: args.rto,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each database type, implement appropriate backup:',
        '   - PostgreSQL: pg_dump/pg_basebackup + WAL archiving for PITR',
        '   - MySQL: mysqldump/Percona XtraBackup + binary logs for PITR',
        '   - MongoDB: mongodump + oplog for PITR',
        '   - Redis: RDB snapshots + AOF for persistence',
        '   - AWS RDS: Automated backups + manual snapshots',
        '   - DynamoDB: On-demand backups + PITR',
        '2. Configure continuous backup/PITR where available:',
        '   - Enable WAL archiving (PostgreSQL)',
        '   - Enable binary log archiving (MySQL)',
        '   - Enable oplog tailing (MongoDB)',
        '   - Enable PITR for RDS/Aurora',
        '3. Create backup scripts and automation:',
        '   - Backup script with error handling',
        '   - Compression (gzip, zstd)',
        '   - Encryption before upload',
        '   - Upload to backup storage',
        '   - Verify backup integrity',
        '4. Schedule backup jobs:',
        '   - Cron jobs for self-managed databases',
        '   - AWS Backup plans for RDS',
        '   - Cloud Scheduler for managed databases',
        '5. Implement backup validation:',
        '   - Check backup file exists and not empty',
        '   - Verify backup checksum',
        '   - Periodically test restore (weekly)',
        '6. Configure backup metadata tracking:',
        '   - Store backup metadata (size, timestamp, location)',
        '   - Track backup success/failure',
        '   - Monitor backup lag',
        '7. Set up database-specific monitoring:',
        '   - Backup job failures',
        '   - Backup lag exceeding RPO',
        '   - Storage space running low',
        '8. Create database backup configuration files',
        '9. Document database backup procedures'
      ],
      outputFormat: 'JSON object with database backup implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'databases', 'backupJobs', 'pitrEnabled', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        databases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              backupMethod: { type: 'string' },
              pitrEnabled: { type: 'boolean' },
              achievedRPO: { type: 'number' }
            }
          }
        },
        backupJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              schedule: { type: 'string' },
              target: { type: 'string' },
              retention: { type: 'string' },
              compression: { type: 'boolean' },
              encryption: { type: 'boolean' }
            }
          }
        },
        pitrEnabled: { type: 'boolean', description: 'Point-in-time recovery enabled' },
        pitrRetention: { type: 'string', description: 'PITR retention period' },
        schedules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              database: { type: 'string' },
              fullBackup: { type: 'string', description: 'Full backup schedule' },
              incrementalBackup: { type: 'string', description: 'Incremental backup schedule' }
            }
          }
        },
        backupScripts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              database: { type: 'string' },
              scriptPath: { type: 'string' }
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
  labels: ['agent', 'backup-restore', 'database']
}));

// Phase 5: Implement Kubernetes Backup
export const implementKubernetesBackupTask = defineTask('implement-kubernetes-backup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Implement Kubernetes Backup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kubernetes Platform Engineer',
      task: 'Implement Kubernetes cluster and application backup using Velero or similar',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        strategyResult: args.strategyResult,
        infrastructureResult: args.infrastructureResult,
        backupTool: args.backupTool,
        cloudProvider: args.cloudProvider,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select and install backup tool:',
        '   - Velero (recommended, CNCF project)',
        '   - Kasten K10',
        '   - Stash by AppsCode',
        '   - Cloud-native: AWS Backup for EKS, Azure Backup for AKS',
        '2. Install Velero with appropriate plugin:',
        '   - AWS plugin for S3 and EBS snapshots',
        '   - GCP plugin for GCS and persistent disk snapshots',
        '   - Azure plugin for Blob and disk snapshots',
        '   - CSI plugin for volume snapshots',
        '3. Configure backup storage location:',
        '   - Create BackupStorageLocation resource',
        '   - Configure credentials',
        '   - Set default backup location',
        '4. Configure volume snapshot location:',
        '   - Create VolumeSnapshotLocation resource',
        '   - Enable CSI snapshots',
        '5. Create backup schedules:',
        '   - Full cluster backup (daily)',
        '   - Namespace-specific backups',
        '   - Application-specific backups with hooks',
        '   - Use label selectors for targeted backups',
        '6. Configure backup hooks for stateful apps:',
        '   - Pre-backup: Quiesce database, flush buffers',
        '   - Post-backup: Resume operations',
        '7. Set up backup exclusions:',
        '   - Skip ephemeral data (configmaps with temp data)',
        '   - Skip non-essential resources',
        '8. Enable restic for file-level backup (optional):',
        '   - For PVs without snapshot support',
        '   - Backup pod volumes at file level',
        '9. Configure TTL and retention:',
        '   - Set backup TTL',
        '   - Configure deletion policy',
        '10. Test backup and restore:',
        '    - Create test backup',
        '    - Restore to test namespace',
        '    - Verify application works',
        '11. Set up monitoring for Velero',
        '12. Create Velero configuration manifests'
      ],
      outputFormat: 'JSON object with Kubernetes backup implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backupTool', 'namespaces', 'schedules', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backupTool: { type: 'string', description: 'Velero, Kasten, etc.' },
        backupToolVersion: { type: 'string' },
        backupStorageLocation: { type: 'string' },
        volumeSnapshotLocation: { type: 'string' },
        namespaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              backupSchedule: { type: 'string' },
              includeVolumes: { type: 'boolean' }
            }
          }
        },
        schedules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              schedule: { type: 'string' },
              namespaces: { type: 'array', items: { type: 'string' } },
              includeClusterResources: { type: 'boolean' },
              snapshotVolumes: { type: 'boolean' },
              ttl: { type: 'string' }
            }
          }
        },
        backupJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              schedule: { type: 'string' },
              target: { type: 'string' },
              retention: { type: 'string' }
            }
          }
        },
        volumeSnapshotsEnabled: { type: 'boolean' },
        resticEnabled: { type: 'boolean' },
        backupHooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              application: { type: 'string' },
              preBackup: { type: 'string' },
              postBackup: { type: 'string' }
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
  labels: ['agent', 'backup-restore', 'kubernetes']
}));

// Phase 6: Implement Volume Backup
export const implementVolumeBackupTask = defineTask('implement-volume-backup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Implement Volume Backup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Storage Engineer',
      task: 'Implement automated volume and file system backup',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        cloudProvider: args.cloudProvider,
        dataTypes: args.dataTypes,
        strategyResult: args.strategyResult,
        infrastructureResult: args.infrastructureResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify volumes to back up:',
        '   - EBS volumes (AWS)',
        '   - Persistent disks (GCP)',
        '   - Managed disks (Azure)',
        '   - Kubernetes persistent volumes',
        '   - EFS/GCS/Azure Files',
        '2. For block storage (EBS, persistent disks):',
        '   - Enable automated snapshots',
        '   - Use AWS Backup/GCP snapshot schedules/Azure Backup',
        '   - Tag volumes for backup policies',
        '   - Configure snapshot lifecycle',
        '3. For file storage (EFS, Azure Files):',
        '   - Enable backup service (AWS Backup for EFS)',
        '   - Configure backup frequency',
        '   - Set retention policies',
        '4. For object storage (S3, GCS, Blob):',
        '   - Enable versioning',
        '   - Configure lifecycle policies',
        '   - Enable cross-region replication',
        '   - Optional: Use AWS Backup for S3',
        '5. For Kubernetes persistent volumes:',
        '   - Use CSI volume snapshots',
        '   - Integrate with Velero for PV snapshots',
        '   - Configure snapshot class',
        '6. Create snapshot/backup schedules:',
        '   - Daily snapshots with 7-day retention',
        '   - Weekly snapshots with 4-week retention',
        '   - Monthly snapshots with longer retention',
        '7. Implement snapshot copy to secondary region',
        '8. Set up snapshot monitoring:',
        '   - Failed snapshots',
        '   - Snapshot age',
        '   - Storage costs',
        '9. Create automation scripts or use IaC',
        '10. Document volume backup procedures'
      ],
      outputFormat: 'JSON object with volume backup implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'volumes', 'backupJobs', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        volumes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              volumeId: { type: 'string' },
              volumeType: { type: 'string' },
              size: { type: 'string' },
              backupMethod: { type: 'string' },
              snapshotSchedule: { type: 'string' }
            }
          }
        },
        backupJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              schedule: { type: 'string' },
              target: { type: 'string' },
              retention: { type: 'string' }
            }
          }
        },
        snapshotPolicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              frequency: { type: 'string' },
              retention: { type: 'string' },
              tags: { type: 'object' }
            }
          }
        },
        crossRegionCopyEnabled: { type: 'boolean' },
        versioningEnabled: { type: 'boolean' },
        lifecyclePoliciesConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'volumes']
}));

// Phase 7: Implement Application Backup
export const implementApplicationBackupTask = defineTask('implement-application-backup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Implement Application Backup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Application Reliability Engineer',
      task: 'Implement backup for application configurations, secrets, and state',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        backupScope: args.backupScope,
        strategyResult: args.strategyResult,
        infrastructureResult: args.infrastructureResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Back up application configurations:',
        '   - ConfigMaps in Kubernetes',
        '   - Application config files',
        '   - Environment variables',
        '   - Feature flags',
        '2. Back up secrets (encrypted):',
        '   - Kubernetes secrets',
        '   - AWS Secrets Manager',
        '   - HashiCorp Vault',
        '   - Application credentials',
        '3. Back up application state:',
        '   - Session data (if not in DB)',
        '   - Cache state (if needed)',
        '   - Queue state',
        '4. Back up Infrastructure as Code:',
        '   - Terraform state files',
        '   - CloudFormation templates',
        '   - Kubernetes manifests',
        '   - Helm values files',
        '5. Back up CI/CD configurations:',
        '   - Pipeline definitions',
        '   - Build scripts',
        '   - Deployment configs',
        '6. Create backup scripts for configs:',
        '   - Export ConfigMaps/Secrets to files',
        '   - Encrypt sensitive data',
        '   - Upload to backup storage',
        '7. Version control integration:',
        '   - Ensure IaC is in git',
        '   - Tag releases',
        '   - Back up git repositories',
        '8. Schedule configuration backups (daily)',
        '9. Document application backup procedures'
      ],
      outputFormat: 'JSON object with application backup implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backupJobs', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        configurationBackup: {
          type: 'object',
          properties: {
            configMapsBackedUp: { type: 'number' },
            secretsBackedUp: { type: 'number' },
            configFilesBackedUp: { type: 'number' }
          }
        },
        backupJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              schedule: { type: 'string' },
              target: { type: 'string' },
              retention: { type: 'string' }
            }
          }
        },
        iacBackup: {
          type: 'object',
          properties: {
            terraformStateBackedUp: { type: 'boolean' },
            manifestsBackedUp: { type: 'boolean' },
            gitRepositoryBackedUp: { type: 'boolean' }
          }
        },
        encryptionUsed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'application']
}));

// Phase 8: Setup Backup Monitoring
export const setupBackupMonitoringTask = defineTask('setup-backup-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Setup Backup Monitoring - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Set up comprehensive backup monitoring, alerting, and dashboards',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        backupJobs: args.backupJobs,
        strategyResult: args.strategyResult,
        rpo: args.rpo,
        rto: args.rto,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define backup metrics to track:',
        '   - Backup success rate (per job)',
        '   - Backup failures and error rates',
        '   - Backup duration (time taken)',
        '   - Backup size and growth rate',
        '   - Backup lag (time since last successful backup)',
        '   - Storage utilization',
        '   - Restore test success rate',
        '2. Set up metrics collection:',
        '   - CloudWatch/Stackdriver/Azure Monitor for cloud backups',
        '   - Prometheus exporters for custom backup scripts',
        '   - Velero metrics for Kubernetes backups',
        '3. Create backup dashboards in Grafana/CloudWatch:',
        '   - Backup success rate dashboard',
        '   - Backup job status overview',
        '   - Backup lag by data source',
        '   - Storage utilization and costs',
        '   - Restore test status',
        '4. Configure backup alerts:',
        '   - CRITICAL: Backup failure for tier-1 data',
        '   - CRITICAL: Backup lag exceeds RPO',
        '   - HIGH: Multiple consecutive backup failures',
        '   - MEDIUM: Backup duration exceeds threshold',
        '   - MEDIUM: Storage utilization > 80%',
        '   - LOW: Restore test failed',
        '5. Set up alert routing:',
        '   - PagerDuty for critical alerts',
        '   - Slack/Email for medium/low alerts',
        '6. Implement backup reporting:',
        '   - Daily backup summary report',
        '   - Weekly backup health report',
        '   - Monthly backup cost report',
        '7. Track backup SLIs:',
        '   - Backup success rate SLI: Target 99.9%',
        '   - RPO compliance SLI: Target 100%',
        '   - Restore success rate SLI: Target 100%',
        '8. Create backup monitoring runbooks',
        '9. Document alert response procedures'
      ],
      outputFormat: 'JSON object with backup monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dashboards', 'alerts', 'metricsTracked', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metricsTracked: {
          type: 'array',
          items: { type: 'string' }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              url: { type: 'string' },
              panels: { type: 'number' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              channel: { type: 'string' }
            }
          }
        },
        slis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              target: { type: 'number' },
              unit: { type: 'string' }
            }
          }
        },
        reportingSchedule: {
          type: 'object',
          properties: {
            daily: { type: 'boolean' },
            weekly: { type: 'boolean' },
            monthly: { type: 'boolean' }
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
  labels: ['agent', 'backup-restore', 'monitoring']
}));

// Phase 9: Create Disaster Recovery Plans
export const createDisasterRecoveryPlansTask = defineTask('create-disaster-recovery-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Create Disaster Recovery Plans - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery Specialist',
      task: 'Create comprehensive disaster recovery and restore procedures',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        backupScope: args.backupScope,
        assessmentResult: args.assessmentResult,
        strategyResult: args.strategyResult,
        implementations: args.implementations,
        backupJobs: args.backupJobs,
        rpo: args.rpo,
        rto: args.rto,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define disaster recovery scenarios:',
        '   - Scenario 1: Single database corruption/loss',
        '   - Scenario 2: Kubernetes namespace deletion',
        '   - Scenario 3: Volume/storage failure',
        '   - Scenario 4: Complete region outage',
        '   - Scenario 5: Ransomware/malware attack',
        '   - Scenario 6: Accidental data deletion',
        '2. For each scenario, create restore plan with:',
        '   - Trigger conditions (when to use this plan)',
        '   - Prerequisites and requirements',
        '   - Step-by-step restore procedure',
        '   - Expected RTO (time to restore)',
        '   - Recovery validation steps',
        '   - Rollback procedure if restore fails',
        '3. Document restore procedures:',
        '   - Database restore (point-in-time or specific backup)',
        '   - Kubernetes resource restore (Velero)',
        '   - Volume restore from snapshots',
        '   - Configuration restore',
        '   - Cross-region failover procedure',
        '4. Define restore order and dependencies:',
        '   - Infrastructure first (networks, storage)',
        '   - Databases and stateful services',
        '   - Application services',
        '   - Load balancers and ingress',
        '5. Create restore validation checklists:',
        '   - Data integrity checks',
        '   - Application functionality tests',
        '   - Performance baseline checks',
        '   - End-to-end smoke tests',
        '6. Document escalation procedures:',
        '   - When to escalate',
        '   - Escalation contacts',
        '   - Communication templates',
        '7. Create DR runbooks with commands and examples',
        '8. Document cross-region failover process',
        '9. Create DR testing plan (quarterly drills)',
        '10. Create DR playbook document with all scenarios'
      ],
      outputFormat: 'JSON object with disaster recovery plans'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'restorePlans', 'scenarios', 'drPlaybookPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['catastrophic', 'major', 'moderate', 'minor'] },
              estimatedRTO: { type: 'number' }
            }
          }
        },
        restorePlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              estimatedRTO: { type: 'number', description: 'Minutes' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    step: { type: 'number' },
                    action: { type: 'string' },
                    command: { type: 'string' },
                    expectedResult: { type: 'string' }
                  }
                }
              },
              validationChecklist: { type: 'array', items: { type: 'string' } },
              tested: { type: 'boolean' }
            }
          }
        },
        restoreOrder: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              component: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        drPlaybookPath: { type: 'string', description: 'Path to DR playbook document' },
        runbooksPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        drTestingPlan: { type: 'string', description: 'Path to DR testing plan' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'disaster-recovery']
}));

// Phase 10: Validate Backup Configuration
export const validateBackupConfigurationTask = defineTask('validate-backup-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Validate Backup Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Engineer for Backup Systems',
      task: 'Validate backup configuration and assess coverage',
      context: {
        projectName: args.projectName,
        assessmentResult: args.assessmentResult,
        strategyResult: args.strategyResult,
        implementations: args.implementations,
        backupJobs: args.backupJobs,
        restorePlans: args.restorePlans,
        rpo: args.rpo,
        rto: args.rto,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify all identified backup targets have backup configured',
        '2. Check backup coverage:',
        '   - Calculate percentage of targets with backup',
        '   - Identify targets without backup',
        '   - Verify critical data (tier 1) has redundant backups',
        '3. Validate RPO compliance:',
        '   - For each backup target, check if backup frequency meets RPO',
        '   - Calculate percentage of targets meeting RPO',
        '   - Identify RPO violations',
        '4. Validate RTO compliance:',
        '   - For each restore plan, check if estimated RTO meets requirement',
        '   - Calculate percentage of scenarios meeting RTO',
        '   - Identify RTO gaps',
        '5. Verify backup schedules are configured correctly:',
        '   - Schedules are not overlapping (causing contention)',
        '   - Schedules are within maintenance windows',
        '   - Cron expressions are valid',
        '6. Verify retention policies match strategy',
        '7. Verify encryption is enabled for all backups',
        '8. Verify cross-region replication is configured',
        '9. Verify monitoring and alerting is set up',
        '10. Identify gaps and missing coverage:',
        '    - Data sources without backup',
        '    - Backups without monitoring',
        '    - Restore plans without testing',
        '    - Compliance gaps',
        '11. Assess severity of each gap (critical, high, medium, low)',
        '12. Generate backup validation report with recommendations'
      ],
      outputFormat: 'JSON object with backup validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backupCoverage', 'rpoCompliance', 'rtoCompliance', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backupCoverage: { type: 'number', description: 'Percentage of targets with backup' },
        rpoCompliance: { type: 'number', description: 'Percentage meeting RPO' },
        rtoCompliance: { type: 'number', description: 'Percentage meeting RTO' },
        coverageBreakdown: {
          type: 'object',
          properties: {
            databasesCovered: { type: 'number' },
            volumesCovered: { type: 'number' },
            kubernetesCovered: { type: 'number' },
            configsCovered: { type: 'number' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              target: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        validation: {
          type: 'object',
          properties: {
            schedulesValid: { type: 'boolean' },
            retentionPoliciesCorrect: { type: 'boolean' },
            encryptionEnabled: { type: 'boolean' },
            crossRegionReplicationConfigured: { type: 'boolean' },
            monitoringSetup: { type: 'boolean' }
          }
        },
        rpoViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              target: { type: 'string' },
              requiredRPO: { type: 'number' },
              actualRPO: { type: 'number' }
            }
          }
        },
        rtoViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              requiredRTO: { type: 'number' },
              estimatedRTO: { type: 'number' }
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
  labels: ['agent', 'backup-restore', 'validation']
}));

// Phase 11: Test Database Restore
export const testDatabaseRestoreTask = defineTask('test-database-restore', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Test Database Restore - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Engineer',
      task: 'Perform database restore test to validate backup integrity',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        databaseBackupResult: args.databaseBackupResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select a recent backup to test',
        '2. Provision test database instance (isolated from production)',
        '3. Perform restore:',
        '   - Restore from full backup',
        '   - Apply incremental backups if applicable',
        '   - Restore to specific point-in-time (PITR test)',
        '4. Validate restored data:',
        '   - Check table row counts',
        '   - Verify data integrity (checksums)',
        '   - Run data validation queries',
        '   - Compare with production (sample data)',
        '5. Test application connectivity:',
        '   - Connect application to restored database',
        '   - Run smoke tests',
        '   - Verify queries work',
        '6. Measure restore time (RTO)',
        '7. Verify PITR works correctly',
        '8. Clean up test resources',
        '9. Document test results',
        '10. If test fails, document issues and remediation steps'
      ],
      outputFormat: 'JSON object with restore test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testName', 'restoreTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testName: { type: 'string' },
        database: { type: 'string' },
        backupTested: { type: 'string' },
        restoreTime: { type: 'number', description: 'Seconds to restore' },
        dataIntegrityValid: { type: 'boolean' },
        pitrTested: { type: 'boolean' },
        pitrSuccess: { type: 'boolean' },
        applicationConnectivityTested: { type: 'boolean' },
        issuesFound: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'testing', 'database']
}));

// Phase 11: Test Kubernetes Restore
export const testKubernetesRestoreTask = defineTask('test-kubernetes-restore', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Test Kubernetes Restore - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kubernetes Engineer',
      task: 'Perform Kubernetes restore test to validate backup',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        k8sBackupResult: args.k8sBackupResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select a recent Kubernetes backup to test',
        '2. Create test namespace for restore',
        '3. Perform restore using Velero/backup tool:',
        '   - Restore specific namespace',
        '   - Include persistent volume snapshots',
        '   - Map to test namespace',
        '4. Verify restored resources:',
        '   - Check all deployments are running',
        '   - Verify services are created',
        '   - Check configmaps and secrets',
        '   - Verify persistent volumes are attached',
        '5. Test application functionality:',
        '   - Check pod logs for errors',
        '   - Verify application responds to requests',
        '   - Run smoke tests',
        '6. Measure restore time (RTO)',
        '7. Clean up test namespace',
        '8. Document test results',
        '9. If test fails, document issues'
      ],
      outputFormat: 'JSON object with Kubernetes restore test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testName', 'restoreTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testName: { type: 'string' },
        namespace: { type: 'string' },
        backupTested: { type: 'string' },
        restoreTime: { type: 'number', description: 'Seconds to restore' },
        resourcesRestored: { type: 'number' },
        podsRunning: { type: 'boolean' },
        volumesAttached: { type: 'boolean' },
        applicationFunctional: { type: 'boolean' },
        issuesFound: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'testing', 'kubernetes']
}));

// Phase 11: Test Volume Restore
export const testVolumeRestoreTask = defineTask('test-volume-restore', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Test Volume Restore - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Storage Engineer',
      task: 'Perform volume restore test to validate snapshots',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        volumeBackupResult: args.volumeBackupResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select a volume snapshot to test',
        '2. Restore volume from snapshot:',
        '   - Create new volume from snapshot',
        '   - Attach to test instance',
        '   - Mount volume',
        '3. Verify volume data:',
        '   - Check file count',
        '   - Verify file integrity (checksums)',
        '   - Check filesystem is healthy',
        '   - Validate specific files exist',
        '4. Test read/write operations',
        '5. Measure restore time',
        '6. Clean up test volume',
        '7. Document test results'
      ],
      outputFormat: 'JSON object with volume restore test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testName', 'restoreTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testName: { type: 'string' },
        volumeId: { type: 'string' },
        snapshotTested: { type: 'string' },
        restoreTime: { type: 'number', description: 'Seconds to restore' },
        dataIntegrityValid: { type: 'boolean' },
        filesystemHealthy: { type: 'boolean' },
        readWriteTested: { type: 'boolean' },
        issuesFound: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'testing', 'volumes']
}));

// Phase 12: Generate Compliance Documentation
export const generateComplianceDocumentationTask = defineTask('generate-compliance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Generate Compliance Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Specialist',
      task: 'Generate compliance documentation for backup and recovery',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        complianceRequirements: args.complianceRequirements,
        assessmentResult: args.assessmentResult,
        strategyResult: args.strategyResult,
        implementations: args.implementations,
        backupJobs: args.backupJobs,
        restorePlans: args.restorePlans,
        validationResult: args.validationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each compliance requirement (GDPR, HIPAA, SOC2, PCI-DSS):',
        '   - Document how backups meet compliance',
        '   - List relevant controls and evidence',
        '   - Document data retention policies',
        '   - Document data encryption (at rest and in transit)',
        '   - Document access controls and audit logs',
        '   - Document disaster recovery capabilities',
        '2. GDPR compliance:',
        '   - Right to erasure: Document backup deletion procedures',
        '   - Data portability: Document backup export capabilities',
        '   - Data protection: Document encryption and access controls',
        '3. HIPAA compliance:',
        '   - Document PHI backup procedures',
        '   - Document encryption of PHI backups',
        '   - Document audit logging',
        '   - Document business associate agreements',
        '4. SOC2 compliance:',
        '   - Availability: Document backup and restore capabilities',
        '   - Confidentiality: Document encryption',
        '   - Processing integrity: Document backup validation',
        '5. Create audit trail:',
        '   - Backup configuration changes log',
        '   - Backup access logs',
        '   - Restore activity logs',
        '6. Generate compliance reports:',
        '   - Backup coverage report',
        '   - Retention policy compliance report',
        '   - Encryption compliance report',
        '   - DR testing compliance report',
        '7. Document compliance gaps and remediation plans',
        '8. Create compliance attestation document'
      ],
      outputFormat: 'JSON object with compliance documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'complianceReports', 'overallCompliance', 'complianceReportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        complianceReports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              status: { type: 'string', enum: ['compliant', 'partial', 'non-compliant'] },
              controls: { type: 'array', items: { type: 'string' } },
              evidence: { type: 'array', items: { type: 'string' } },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallCompliance: { type: 'string', enum: ['fully-compliant', 'mostly-compliant', 'partially-compliant', 'non-compliant'] },
        complianceByRequirement: {
          type: 'object',
          properties: {
            gdpr: { type: 'string', enum: ['compliant', 'partial', 'non-compliant', 'n/a'] },
            hipaa: { type: 'string', enum: ['compliant', 'partial', 'non-compliant', 'n/a'] },
            soc2: { type: 'string', enum: ['compliant', 'partial', 'non-compliant', 'n/a'] },
            pciDss: { type: 'string', enum: ['compliant', 'partial', 'non-compliant', 'n/a'] }
          }
        },
        auditTrail: {
          type: 'object',
          properties: {
            configChangesLogged: { type: 'boolean' },
            accessLogsEnabled: { type: 'boolean' },
            restoreActivityLogged: { type: 'boolean' }
          }
        },
        complianceReportPath: { type: 'string', description: 'Path to compliance report' },
        attestationPath: { type: 'string', description: 'Path to compliance attestation' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'compliance']
}));

// Phase 13: Generate Backup Documentation
export const generateBackupDocumentationTask = defineTask('generate-backup-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Generate Backup Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive backup and restore documentation',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        backupScope: args.backupScope,
        assessmentResult: args.assessmentResult,
        strategyResult: args.strategyResult,
        implementations: args.implementations,
        backupJobs: args.backupJobs,
        restorePlans: args.restorePlans,
        monitoringResult: args.monitoringResult,
        validationResult: args.validationResult,
        complianceResult: args.complianceResult,
        rpo: args.rpo,
        rto: args.rto,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary:',
        '   - Backup scope and objectives',
        '   - RPO and RTO targets',
        '   - Backup coverage achieved',
        '   - Key achievements',
        '2. Document backup architecture:',
        '   - Architecture diagram',
        '   - Backup infrastructure components',
        '   - Data flow from source to backup storage',
        '   - Backup tool ecosystem',
        '3. Document backup strategy:',
        '   - Backup types and schedules',
        '   - Retention policies',
        '   - Storage architecture',
        '   - Encryption and security',
        '4. Document backup jobs:',
        '   - List all backup jobs',
        '   - Schedule, target, retention for each',
        '   - How to monitor each job',
        '5. Document restore procedures:',
        '   - Quick reference for common restore scenarios',
        '   - Detailed restore procedures for each data type',
        '   - Disaster recovery procedures',
        '6. Document monitoring and alerting:',
        '   - Backup dashboards and how to use them',
        '   - Alert definitions and response procedures',
        '   - Backup metrics and SLIs',
        '7. Document operational procedures:',
        '   - How to verify backups',
        '   - How to test restores',
        '   - How to troubleshoot backup failures',
        '   - How to modify backup schedules',
        '8. Document compliance:',
        '   - Compliance requirements met',
        '   - Audit procedures',
        '9. Create backup operations manual',
        '10. Create disaster recovery playbook',
        '11. Format as professional Markdown documentation'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string', description: 'Main backup and restore report' },
        executiveSummary: { type: 'string' },
        architectureDiagramPath: { type: 'string' },
        operationsManualPath: { type: 'string' },
        drPlaybookPath: { type: 'string' },
        quickReferenceGuidePath: { type: 'string' },
        keyAchievements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'documentation']
}));

// Phase 14: Calculate Backup Score
export const calculateBackupScoreTask = defineTask('calculate-backup-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Calculate Backup Score - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Backup System Auditor',
      task: 'Calculate backup readiness score and provide final assessment',
      context: {
        projectName: args.projectName,
        backupScope: args.backupScope,
        rpo: args.rpo,
        rto: args.rto,
        assessmentResult: args.assessmentResult,
        strategyResult: args.strategyResult,
        implementations: args.implementations,
        backupJobs: args.backupJobs,
        restorePlans: args.restorePlans,
        validationResult: args.validationResult,
        complianceResult: args.complianceResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate weighted backup readiness score (0-100):',
        '   - Backup coverage (25% weight):',
        '     * Percentage of critical data backed up',
        '     * Backup frequency meets requirements',
        '   - RPO/RTO compliance (25% weight):',
        '     * Percentage meeting RPO',
        '     * Percentage meeting RTO',
        '     * Critical data has aggressive RPO/RTO',
        '   - Backup infrastructure (15% weight):',
        '     * Encryption enabled',
        '     * Cross-region replication',
        '     * Secure access controls',
        '     * Automated backup processes',
        '   - Disaster recovery preparedness (20% weight):',
        '     * Comprehensive restore plans',
        '     * Restore procedures documented',
        '     * DR testing completed',
        '     * Restore order defined',
        '   - Monitoring and validation (10% weight):',
        '     * Backup monitoring configured',
        '     * Alerts for backup failures',
        '     * Regular restore testing',
        '     * Backup validation automated',
        '   - Compliance (5% weight):',
        '     * Meets compliance requirements',
        '     * Audit trail enabled',
        '     * Documentation complete',
        '2. Assess backup maturity level (basic, intermediate, advanced, expert)',
        '3. Evaluate production readiness',
        '4. Identify strengths:',
        '   - What is working well',
        '   - Best practices implemented',
        '5. Identify areas for improvement:',
        '   - Critical gaps to address',
        '   - Optimization opportunities',
        '   - Long-term improvements',
        '6. Provide overall verdict (excellent/good/acceptable/needs-improvement)',
        '7. Generate actionable recommendations:',
        '   - Immediate actions (before production)',
        '   - Short-term improvements (1-3 months)',
        '   - Long-term enhancements (3-12 months)',
        '8. Create final assessment summary document'
      ],
      outputFormat: 'JSON object with backup score assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['backupScore', 'verdict', 'recommendation', 'summaryPath', 'artifacts'],
      properties: {
        backupScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            coverage: { type: 'number', description: 'Coverage score (0-25)' },
            rpoRtoCompliance: { type: 'number', description: 'RPO/RTO score (0-25)' },
            infrastructure: { type: 'number', description: 'Infrastructure score (0-15)' },
            drPreparedness: { type: 'number', description: 'DR preparedness score (0-20)' },
            monitoring: { type: 'number', description: 'Monitoring score (0-10)' },
            compliance: { type: 'number', description: 'Compliance score (0-5)' }
          }
        },
        maturityLevel: { type: 'string', enum: ['basic', 'intermediate', 'advanced', 'expert'] },
        productionReady: { type: 'boolean', description: 'Ready for production deployment' },
        verdict: { type: 'string', description: 'Overall verdict' },
        recommendation: { type: 'string', description: 'Recommended next steps' },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: {
          type: 'object',
          properties: {
            immediate: { type: 'array', items: { type: 'string' } },
            shortTerm: { type: 'array', items: { type: 'string' } },
            longTerm: { type: 'array', items: { type: 'string' } }
          }
        },
        summaryPath: { type: 'string', description: 'Path to assessment summary' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'backup-restore', 'scoring']
}));
