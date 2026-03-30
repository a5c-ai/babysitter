/**
 * @process specializations/data-engineering-analytics/pipeline-migration
 * @description Data Pipeline Migration - Comprehensive workflow for migrating data pipelines with
 * assessment, migration strategy, dual-run validation, cutover planning, and rollback procedures
 * to ensure zero-downtime migrations.
 * @inputs { projectName: string, sourceSystem: object, targetSystem: object, requirements?: object }
 * @outputs { success: boolean, migrationPlan: object, validationResults: object, cutoverPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/pipeline-migration', {
 *   projectName: 'Legacy ETL to Modern ELT Migration',
 *   sourceSystem: {
 *     type: 'legacy-etl',
 *     platform: 'informatica',
 *     dataVolume: '500GB daily'
 *   },
 *   targetSystem: {
 *     type: 'modern-elt',
 *     platform: 'dbt',
 *     cloudProvider: 'aws'
 *   },
 *   requirements: {
 *     zeroDo wntime: true,
 *     dualRunDuration: '30 days',
 *     dataQualityValidation: true,
 *     performanceComparison: true,
 *     rollbackStrategy: true
 *   }
 * });
 *
 * @references
 * - Data Pipeline Migration Best Practices: https://www.dataengineeringweekly.com/
 * - Zero-Downtime Migration Patterns: https://martinfowler.com/bliki/StranglerFigApplication.html
 * - Data Quality Validation: https://www.great-expectations.io/
 * - Dual-Run Testing: https://cloud.google.com/architecture/migration-to-gcp-getting-started
 * - Pipeline Testing: https://docs.getdbt.com/docs/building-a-dbt-project/tests
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceSystem = {
      type: 'etl',
      platform: '',
      location: 'on-premise',
      dataVolume: 'unknown',
      pipelineCount: 0,
      dependencies: []
    },
    targetSystem = {
      type: 'elt',
      platform: '',
      cloudProvider: 'aws',
      location: 'cloud'
    },
    requirements = {
      zeroDowntime: true,
      dualRunDuration: '30 days',
      dataQualityValidation: true,
      performanceComparison: true,
      rollbackStrategy: true,
      incrementalMigration: true,
      trainingRequired: true,
      documentationRequired: true,
      costOptimization: true
    },
    environment = 'production',
    outputDir = 'pipeline-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let migrationPlan = {};
  let validationResults = {};
  let cutoverPlan = {};

  ctx.log('info', `Starting Data Pipeline Migration for ${projectName}`);
  ctx.log('info', `Source: ${sourceSystem.platform} (${sourceSystem.type})`);
  ctx.log('info', `Target: ${targetSystem.platform} (${targetSystem.type})`);

  // ============================================================================
  // PHASE 1: PIPELINE ASSESSMENT AND DISCOVERY
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing existing pipeline infrastructure');

  const pipelineAssessment = await ctx.task(pipelineAssessmentTask, {
    projectName,
    sourceSystem,
    targetSystem,
    requirements,
    outputDir
  });

  if (!pipelineAssessment.success) {
    return {
      success: false,
      error: 'Failed to complete pipeline assessment',
      details: pipelineAssessment,
      metadata: {
        processId: 'specializations/data-engineering-analytics/pipeline-migration',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...pipelineAssessment.artifacts);
  migrationPlan.assessment = pipelineAssessment;

  ctx.log('info', `Assessment complete: ${pipelineAssessment.pipelinesIdentified} pipelines identified`);
  ctx.log('info', `Complexity score: ${pipelineAssessment.complexityScore}/100`);
  ctx.log('info', `Estimated migration effort: ${pipelineAssessment.estimatedEffort}`);

  // Quality Gate: Review assessment results
  await ctx.breakpoint({
    question: `Phase 1 Review: Identified ${pipelineAssessment.pipelinesIdentified} pipelines with complexity score ${pipelineAssessment.complexityScore}/100. Estimated effort: ${pipelineAssessment.estimatedEffort}. Proceed with migration planning?`,
    title: 'Pipeline Assessment Review',
    context: {
      runId: ctx.runId,
      assessment: pipelineAssessment,
      files: [{
        path: `${outputDir}/phase1-assessment-report.json`,
        format: 'json',
        content: JSON.stringify(pipelineAssessment, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 2: DEPENDENCY ANALYSIS AND IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing dependencies and downstream impacts');

  const dependencyAnalysis = await ctx.task(dependencyAnalysisTask, {
    projectName,
    pipelineAssessment,
    sourceSystem,
    targetSystem,
    outputDir
  });

  if (!dependencyAnalysis.success) {
    ctx.log('warn', 'Dependency analysis encountered issues, but continuing');
  } else {
    artifacts.push(...dependencyAnalysis.artifacts);
    migrationPlan.dependencies = dependencyAnalysis;
    ctx.log('info', `Dependencies mapped: ${dependencyAnalysis.dependencyCount} relationships identified`);
  }

  // ============================================================================
  // PHASE 3: MIGRATION STRATEGY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing migration strategy');

  const migrationStrategy = await ctx.task(migrationStrategyTask, {
    projectName,
    pipelineAssessment,
    dependencyAnalysis,
    sourceSystem,
    targetSystem,
    requirements,
    outputDir
  });

  if (!migrationStrategy.success) {
    return {
      success: false,
      error: 'Failed to design migration strategy',
      details: migrationStrategy,
      metadata: {
        processId: 'specializations/data-engineering-analytics/pipeline-migration',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...migrationStrategy.artifacts);
  migrationPlan.strategy = migrationStrategy;

  ctx.log('info', `Migration approach: ${migrationStrategy.approach}`);
  ctx.log('info', `Migration waves: ${migrationStrategy.waveCount}`);
  ctx.log('info', `Estimated duration: ${migrationStrategy.estimatedDuration}`);

  // Quality Gate: Review migration strategy
  await ctx.breakpoint({
    question: `Phase 3 Review: Migration will use ${migrationStrategy.approach} approach with ${migrationStrategy.waveCount} waves over ${migrationStrategy.estimatedDuration}. Risk level: ${migrationStrategy.riskLevel}. Approve strategy?`,
    title: 'Migration Strategy Approval',
    context: {
      runId: ctx.runId,
      strategy: migrationStrategy,
      files: [{
        path: `${outputDir}/phase3-migration-strategy.json`,
        format: 'json',
        content: JSON.stringify(migrationStrategy, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 4: TARGET PIPELINE DESIGN AND DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing and developing target pipelines');

  const targetPipelineDesign = await ctx.task(targetPipelineDesignTask, {
    projectName,
    pipelineAssessment,
    migrationStrategy,
    sourceSystem,
    targetSystem,
    outputDir
  });

  if (!targetPipelineDesign.success) {
    return {
      success: false,
      error: 'Failed to design target pipelines',
      details: targetPipelineDesign,
      metadata: {
        processId: 'specializations/data-engineering-analytics/pipeline-migration',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...targetPipelineDesign.artifacts);
  migrationPlan.targetDesign = targetPipelineDesign;

  ctx.log('info', `Target pipelines designed: ${targetPipelineDesign.pipelinesDesigned}`);
  ctx.log('info', `Technology stack: ${targetPipelineDesign.techStack.join(', ')}`);

  // ============================================================================
  // PHASE 5: DATA QUALITY VALIDATION FRAMEWORK
  // ============================================================================

  if (requirements.dataQualityValidation) {
    ctx.log('info', 'Phase 5: Setting up data quality validation framework');

    const dataQualityFramework = await ctx.task(dataQualityFrameworkTask, {
      projectName,
      pipelineAssessment,
      sourceSystem,
      targetSystem,
      targetPipelineDesign,
      outputDir
    });

    if (!dataQualityFramework.success) {
      ctx.log('warn', 'Data quality framework setup failed, but continuing');
    } else {
      artifacts.push(...dataQualityFramework.artifacts);
      migrationPlan.dataQuality = dataQualityFramework;
      ctx.log('info', `Validation rules created: ${dataQualityFramework.rulesCount}`);
    }
  }

  // ============================================================================
  // PHASE 6: DUAL-RUN SETUP AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up dual-run environment');

  const dualRunSetup = await ctx.task(dualRunSetupTask, {
    projectName,
    pipelineAssessment,
    targetPipelineDesign,
    sourceSystem,
    targetSystem,
    requirements,
    outputDir
  });

  if (!dualRunSetup.success) {
    return {
      success: false,
      error: 'Failed to setup dual-run environment',
      details: dualRunSetup,
      metadata: {
        processId: 'specializations/data-engineering-analytics/pipeline-migration',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...dualRunSetup.artifacts);
  migrationPlan.dualRun = dualRunSetup;

  ctx.log('info', `Dual-run configured for ${dualRunSetup.pipelinesInDualRun} pipelines`);
  ctx.log('info', `Dual-run duration: ${requirements.dualRunDuration}`);

  // Quality Gate: Review dual-run setup
  await ctx.breakpoint({
    question: `Phase 6 Review: Dual-run environment ready for ${dualRunSetup.pipelinesInDualRun} pipelines. Duration: ${requirements.dualRunDuration}. Data comparison: ${dualRunSetup.comparisonEnabled}. Start dual-run?`,
    title: 'Dual-Run Setup Review',
    context: {
      runId: ctx.runId,
      dualRun: dualRunSetup,
      files: [{
        path: `${outputDir}/phase6-dual-run-config.json`,
        format: 'json',
        content: JSON.stringify(dualRunSetup, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 7: DUAL-RUN VALIDATION AND MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Running dual-run validation');

  const dualRunValidation = await ctx.task(dualRunValidationTask, {
    projectName,
    dualRunSetup,
    migrationPlan,
    requirements,
    outputDir
  });

  if (!dualRunValidation.success) {
    ctx.log('error', 'Dual-run validation failed');

    await ctx.breakpoint({
      question: `Phase 7 Alert: Dual-run validation failed with ${dualRunValidation.issuesFound} issues. Review validation report and decide next steps?`,
      title: 'Dual-Run Validation Failed',
      context: {
        runId: ctx.runId,
        validation: dualRunValidation,
        files: [{
          path: `${outputDir}/phase7-validation-report.json`,
          format: 'json',
          content: JSON.stringify(dualRunValidation, null, 2)
        }]
      }
    });
  }

  artifacts.push(...dualRunValidation.artifacts);
  validationResults = dualRunValidation;

  ctx.log('info', `Validation complete: ${dualRunValidation.validationScore}% match rate`);
  ctx.log('info', `Issues found: ${dualRunValidation.issuesFound}`);

  // ============================================================================
  // PHASE 8: PERFORMANCE COMPARISON AND OPTIMIZATION
  // ============================================================================

  if (requirements.performanceComparison) {
    ctx.log('info', 'Phase 8: Comparing performance and optimizing');

    const performanceComparison = await ctx.task(performanceComparisonTask, {
      projectName,
      sourceSystem,
      targetSystem,
      dualRunValidation,
      outputDir
    });

    if (!performanceComparison.success) {
      ctx.log('warn', 'Performance comparison failed, but continuing');
    } else {
      artifacts.push(...performanceComparison.artifacts);
      migrationPlan.performance = performanceComparison;
      ctx.log('info', `Performance comparison: ${performanceComparison.performanceImprovement}`);
    }
  }

  // ============================================================================
  // PHASE 9: CUTOVER PLANNING AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Planning cutover procedure');

  const cutoverPlanning = await ctx.task(cutoverPlanningTask, {
    projectName,
    pipelineAssessment,
    migrationStrategy,
    dualRunValidation,
    sourceSystem,
    targetSystem,
    requirements,
    outputDir
  });

  if (!cutoverPlanning.success) {
    return {
      success: false,
      error: 'Failed to plan cutover procedure',
      details: cutoverPlanning,
      metadata: {
        processId: 'specializations/data-engineering-analytics/pipeline-migration',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...cutoverPlanning.artifacts);
  cutoverPlan = cutoverPlanning;

  ctx.log('info', `Cutover plan created: ${cutoverPlanning.steps.length} steps`);
  ctx.log('info', `Estimated cutover window: ${cutoverPlanning.estimatedDowntime}`);
  ctx.log('info', `Go-live date: ${cutoverPlanning.plannedGoLiveDate}`);

  // Quality Gate: Review cutover plan
  await ctx.breakpoint({
    question: `Phase 9 Review: Cutover plan ready with ${cutoverPlanning.steps.length} steps. Downtime: ${cutoverPlanning.estimatedDowntime}. Go-live: ${cutoverPlanning.plannedGoLiveDate}. Approve cutover plan?`,
    title: 'Cutover Plan Approval',
    context: {
      runId: ctx.runId,
      cutover: cutoverPlanning,
      files: [{
        path: `${outputDir}/phase9-cutover-plan.json`,
        format: 'json',
        content: JSON.stringify(cutoverPlanning, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 10: ROLLBACK STRATEGY AND PROCEDURES
  // ============================================================================

  if (requirements.rollbackStrategy) {
    ctx.log('info', 'Phase 10: Developing rollback procedures');

    const rollbackStrategy = await ctx.task(rollbackStrategyTask, {
      projectName,
      migrationStrategy,
      cutoverPlanning,
      sourceSystem,
      targetSystem,
      outputDir
    });

    if (!rollbackStrategy.success) {
      ctx.log('warn', 'Rollback strategy development failed, but continuing');
    } else {
      artifacts.push(...rollbackStrategy.artifacts);
      migrationPlan.rollback = rollbackStrategy;
      ctx.log('info', `Rollback procedures documented: ${rollbackStrategy.rollbackSteps.length} steps`);
      ctx.log('info', `Rollback time estimate: ${rollbackStrategy.estimatedRollbackTime}`);
    }
  }

  // ============================================================================
  // PHASE 11: TRAINING AND KNOWLEDGE TRANSFER
  // ============================================================================

  if (requirements.trainingRequired) {
    ctx.log('info', 'Phase 11: Preparing training and knowledge transfer');

    const trainingPlan = await ctx.task(trainingPlanTask, {
      projectName,
      targetSystem,
      targetPipelineDesign,
      cutoverPlanning,
      outputDir
    });

    if (!trainingPlan.success) {
      ctx.log('warn', 'Training plan creation failed, but continuing');
    } else {
      artifacts.push(...trainingPlan.artifacts);
      migrationPlan.training = trainingPlan;
      ctx.log('info', `Training sessions planned: ${trainingPlan.sessionCount}`);
    }
  }

  // ============================================================================
  // PHASE 12: DOCUMENTATION AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive documentation');

  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    migrationPlan,
    validationResults,
    cutoverPlan,
    sourceSystem,
    targetSystem,
    outputDir
  });

  if (!documentation.success) {
    ctx.log('warn', 'Documentation generation failed, but continuing');
  } else {
    artifacts.push(...documentation.artifacts);
  }

  // ============================================================================
  // PHASE 13: POST-MIGRATION MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 13: Setting up post-migration monitoring');

  const postMigrationMonitoring = await ctx.task(postMigrationMonitoringTask, {
    projectName,
    targetSystem,
    targetPipelineDesign,
    cutoverPlanning,
    outputDir
  });

  if (!postMigrationMonitoring.success) {
    ctx.log('warn', 'Post-migration monitoring setup failed, but continuing');
  } else {
    artifacts.push(...postMigrationMonitoring.artifacts);
    migrationPlan.monitoring = postMigrationMonitoring;
    ctx.log('info', 'Post-migration monitoring configured');
  }

  // ============================================================================
  // PHASE 14: COST OPTIMIZATION ANALYSIS
  // ============================================================================

  if (requirements.costOptimization) {
    ctx.log('info', 'Phase 14: Analyzing cost optimization opportunities');

    const costAnalysis = await ctx.task(costOptimizationTask, {
      projectName,
      sourceSystem,
      targetSystem,
      targetPipelineDesign,
      requirements,
      outputDir
    });

    if (!costAnalysis.success) {
      ctx.log('warn', 'Cost analysis failed, but continuing');
    } else {
      artifacts.push(...costAnalysis.artifacts);
      migrationPlan.costAnalysis = costAnalysis;
      ctx.log('info', `Cost impact: ${costAnalysis.costChange} (${costAnalysis.costChangePercent}%)`);
    }
  }

  // ============================================================================
  // FINAL QUALITY GATE AND READINESS ASSESSMENT
  // ============================================================================

  const readinessScore = calculateReadinessScore({
    pipelineAssessment,
    dualRunValidation,
    cutoverPlanning,
    requirements
  });

  const readinessThreshold = environment === 'production' ? 90 : 75;

  ctx.log('info', `Migration readiness score: ${readinessScore.toFixed(1)}/100`);

  await ctx.breakpoint({
    question: `Final Review: Pipeline migration ${projectName} is ready. Readiness score: ${readinessScore.toFixed(1)}/100 (threshold: ${readinessThreshold}). Validation: ${validationResults.validationScore}% match. Ready to proceed with cutover?`,
    title: 'Final Migration Readiness Review',
    context: {
      runId: ctx.runId,
      readinessScore,
      readinessThreshold,
      migrationPlan,
      validationResults,
      cutoverPlan,
      files: [
        {
          path: `${outputDir}/migration-summary.json`,
          format: 'json',
          content: JSON.stringify({
            migrationPlan,
            validationResults,
            cutoverPlan,
            readinessScore,
            artifacts: artifacts.length
          }, null, 2)
        },
        {
          path: `${outputDir}/cutover-runbook.md`,
          format: 'markdown',
          content: documentation.cutoverRunbook || 'Cutover runbook generation pending'
        }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Pipeline migration planning completed in ${duration}ms`);
  ctx.log('info', `Pipelines to migrate: ${pipelineAssessment.pipelinesIdentified}`);
  ctx.log('info', `Migration approach: ${migrationStrategy.approach}`);
  ctx.log('info', `Validation score: ${validationResults.validationScore}%`);
  ctx.log('info', `Readiness Score: ${readinessScore.toFixed(1)}/100`);

  return {
    success: true,
    projectName,
    migrationPlan,
    validationResults,
    cutoverPlan,
    artifacts,
    readinessScore,
    readinessThreshold,
    summary: {
      sourceSystem: sourceSystem.platform,
      targetSystem: targetSystem.platform,
      pipelineCount: pipelineAssessment.pipelinesIdentified,
      migrationApproach: migrationStrategy.approach,
      migrationWaves: migrationStrategy.waveCount,
      estimatedDuration: migrationStrategy.estimatedDuration,
      validationScore: validationResults.validationScore,
      dualRunDuration: requirements.dualRunDuration,
      cutoverSteps: cutoverPlan.steps?.length || 0,
      estimatedDowntime: cutoverPlan.estimatedDowntime,
      plannedGoLiveDate: cutoverPlan.plannedGoLiveDate,
      rollbackProcedures: migrationPlan.rollback?.rollbackSteps?.length || 0,
      zeroDowntime: requirements.zeroDowntime,
      artifactsCreated: artifacts.length,
      readinessScore,
      complexityScore: pipelineAssessment.complexityScore
    },
    metadata: {
      processId: 'specializations/data-engineering-analytics/pipeline-migration',
      processSlug: 'pipeline-migration',
      category: 'data-engineering',
      specializationSlug: 'data-engineering-analytics',
      timestamp: startTime,
      duration,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateReadinessScore(data) {
  const {
    pipelineAssessment,
    dualRunValidation,
    cutoverPlanning,
    requirements
  } = data;

  let score = 0;
  let maxScore = 0;

  // Assessment completeness (20 points)
  if (pipelineAssessment?.success) {
    score += 20;
  }
  maxScore += 20;

  // Dual-run validation quality (40 points)
  if (dualRunValidation?.success) {
    const validationScore = dualRunValidation.validationScore || 0;
    score += (validationScore / 100) * 40;
  }
  maxScore += 40;

  // Cutover planning completeness (20 points)
  if (cutoverPlanning?.success) {
    score += 20;
  }
  maxScore += 20;

  // Rollback strategy (10 points)
  if (!requirements.rollbackStrategy || (data.migrationPlan?.rollback?.success)) {
    score += 10;
  }
  maxScore += 10;

  // Documentation and training (10 points)
  if (!requirements.trainingRequired || (data.migrationPlan?.training?.success)) {
    score += 10;
  }
  maxScore += 10;

  return (score / maxScore) * 100;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const pipelineAssessmentTask = defineTask('pipeline-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Pipeline Infrastructure: ${args.projectName}`,
  agent: {
    name: 'migration-assessor',
    prompt: {
      role: 'Senior Data Engineer specialized in pipeline migration',
      task: 'Assess existing pipeline infrastructure for migration readiness',
      context: args,
      instructions: [
        'Inventory all existing pipelines and jobs',
        'Document data sources and destinations',
        'Analyze pipeline complexity and dependencies',
        'Identify data volumes and processing patterns',
        'Assess data quality and validation logic',
        'Document transformation logic and business rules',
        'Identify custom code and scripts',
        'Assess scheduling and orchestration dependencies',
        'Identify security and compliance requirements',
        'Calculate complexity score based on factors',
        'Estimate migration effort (hours/days)',
        'Identify migration risks and challenges',
        'Generate comprehensive assessment report'
      ],
      outputFormat: 'JSON with success, pipelinesIdentified, complexityScore, estimatedEffort, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelinesIdentified', 'complexityScore', 'estimatedEffort', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelinesIdentified: { type: 'number' },
        complexityScore: { type: 'number', minimum: 0, maximum: 100 },
        estimatedEffort: { type: 'string' },
        dataVolume: { type: 'string' },
        pipelineDetails: { type: 'array' },
        dataSources: { type: 'array' },
        dataDestinations: { type: 'array' },
        customCode: { type: 'boolean' },
        complianceRequirements: { type: 'array' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'assessment', 'pipeline-analysis']
}));

export const dependencyAnalysisTask = defineTask('dependency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Dependencies: ${args.projectName}`,
  agent: {
    name: 'dependency-analyzer',
    prompt: {
      role: 'Data Architect specialized in data lineage',
      task: 'Analyze pipeline dependencies and downstream impacts',
      context: args,
      instructions: [
        'Map data lineage and pipeline dependencies',
        'Identify upstream data sources and dependencies',
        'Identify downstream consumers and dependencies',
        'Analyze inter-pipeline dependencies',
        'Identify shared resources (databases, files, APIs)',
        'Assess impact on downstream systems and reports',
        'Identify critical paths and bottlenecks',
        'Document SLA and timing dependencies',
        'Create dependency graph visualization',
        'Identify opportunities for parallel migration',
        'Generate dependency analysis report'
      ],
      outputFormat: 'JSON with success, dependencyCount, criticalPaths, impactedSystems, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dependencyCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dependencyCount: { type: 'number' },
        criticalPaths: { type: 'array' },
        impactedSystems: { type: 'array' },
        upstreamDependencies: { type: 'array' },
        downstreamConsumers: { type: 'array' },
        sharedResources: { type: 'array' },
        parallelMigrationOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'dependency-analysis', 'data-lineage']
}));

export const migrationStrategyTask = defineTask('migration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Migration Strategy: ${args.projectName}`,
  agent: {
    name: 'migration-strategist',
    prompt: {
      role: 'Principal Data Architect specialized in migration strategies',
      task: 'Design comprehensive migration strategy and approach',
      context: args,
      instructions: [
        'Choose migration approach (big-bang, phased, strangler pattern)',
        'Design migration waves based on dependencies',
        'Plan incremental vs complete migration',
        'Design zero-downtime migration strategy (if required)',
        'Plan data backfill strategy for historical data',
        'Design hybrid operation period strategy',
        'Plan resource allocation and team structure',
        'Estimate migration timeline with milestones',
        'Identify and plan risk mitigation strategies',
        'Design communication and stakeholder management plan',
        'Create detailed migration roadmap',
        'Document strategy decisions and rationale'
      ],
      outputFormat: 'JSON with success, approach, waveCount, estimatedDuration, riskLevel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'approach', 'waveCount', 'estimatedDuration', 'riskLevel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        approach: { type: 'string', enum: ['big-bang', 'phased', 'strangler', 'hybrid'] },
        waveCount: { type: 'number' },
        estimatedDuration: { type: 'string' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        migrationWaves: { type: 'array' },
        timeline: { type: 'object' },
        resourceRequirements: { type: 'object' },
        risks: { type: 'array' },
        mitigationStrategies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'strategy', 'planning']
}));

export const targetPipelineDesignTask = defineTask('target-pipeline-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Target Pipelines: ${args.projectName}`,
  agent: {
    name: 'pipeline-designer',
    prompt: {
      role: 'Senior Data Engineer specialized in modern data pipelines',
      task: 'Design and develop target pipeline architecture',
      context: args,
      instructions: [
        'Design target pipeline architecture',
        'Select appropriate technology stack',
        'Design data ingestion patterns',
        'Re-architect transformation logic for target platform',
        'Design data quality checks and validation',
        'Design error handling and retry logic',
        'Plan orchestration and scheduling',
        'Design monitoring and observability',
        'Optimize for performance and cost',
        'Create pipeline code/configuration templates',
        'Design testing strategy',
        'Generate deployment manifests',
        'Document architecture decisions'
      ],
      outputFormat: 'JSON with success, pipelinesDesigned, techStack, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelinesDesigned', 'techStack', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelinesDesigned: { type: 'number' },
        techStack: { type: 'array', items: { type: 'string' } },
        architecture: { type: 'object' },
        ingestionPatterns: { type: 'array' },
        transformationApproach: { type: 'string' },
        orchestrationTool: { type: 'string' },
        dataQualityApproach: { type: 'string' },
        monitoringApproach: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'pipeline-design', 'architecture']
}));

export const dataQualityFrameworkTask = defineTask('data-quality-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Data Quality Framework: ${args.projectName}`,
  agent: {
    name: 'data-quality-engineer',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Setup comprehensive data quality validation framework',
      context: args,
      instructions: [
        'Design data quality validation strategy',
        'Create row count comparison checks',
        'Design column-level data comparison',
        'Create schema validation rules',
        'Design business logic validation tests',
        'Create data freshness checks',
        'Design statistical comparison tests',
        'Setup automated reconciliation framework',
        'Create data diff reports and dashboards',
        'Design exception handling and alerting',
        'Generate validation scripts/configurations',
        'Document validation procedures'
      ],
      outputFormat: 'JSON with success, rulesCount, validationFramework, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rulesCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rulesCount: { type: 'number' },
        validationFramework: { type: 'string' },
        validationTypes: { type: 'array', items: { type: 'string' } },
        automatedReconciliation: { type: 'boolean' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'data-quality', 'validation']
}));

export const dualRunSetupTask = defineTask('dual-run-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Dual-Run Environment: ${args.projectName}`,
  agent: {
    name: 'dual-run-engineer',
    prompt: {
      role: 'Data Engineer specialized in dual-run migrations',
      task: 'Setup dual-run environment for parallel pipeline execution',
      context: args,
      instructions: [
        'Design dual-run architecture',
        'Configure source pipeline to continue running',
        'Deploy target pipelines in parallel',
        'Setup data routing and duplication (if needed)',
        'Configure comparison and reconciliation jobs',
        'Setup monitoring for both pipelines',
        'Configure alerting for discrepancies',
        'Design shadow mode vs active-active approach',
        'Setup data capture for comparison',
        'Create operational dashboards',
        'Generate dual-run configurations',
        'Document dual-run procedures'
      ],
      outputFormat: 'JSON with success, pipelinesInDualRun, comparisonEnabled, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelinesInDualRun', 'comparisonEnabled', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelinesInDualRun: { type: 'number' },
        comparisonEnabled: { type: 'boolean' },
        dualRunMode: { type: 'string', enum: ['shadow', 'active-active', 'split-traffic'] },
        monitoringEnabled: { type: 'boolean' },
        reconciliationFrequency: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'dual-run', 'parallel-execution']
}));

export const dualRunValidationTask = defineTask('dual-run-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Dual-Run Results: ${args.projectName}`,
  agent: {
    name: 'validation-engineer',
    prompt: {
      role: 'QA Engineer specialized in data validation',
      task: 'Validate dual-run results and identify discrepancies',
      context: args,
      instructions: [
        'Run automated data comparison tests',
        'Compare row counts and data volumes',
        'Validate data correctness at column level',
        'Compare business metrics and aggregations',
        'Validate data freshness and latency',
        'Analyze performance characteristics',
        'Identify and document discrepancies',
        'Categorize issues by severity',
        'Calculate overall validation score',
        'Generate discrepancy reports',
        'Create action items for issues',
        'Document validation findings'
      ],
      outputFormat: 'JSON with success, validationScore, issuesFound, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationScore', 'issuesFound', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        issuesFound: { type: 'number' },
        criticalIssues: { type: 'number' },
        majorIssues: { type: 'number' },
        minorIssues: { type: 'number' },
        dataMatchRate: { type: 'number' },
        validationDetails: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'validation', 'dual-run']
}));

export const performanceComparisonTask = defineTask('performance-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compare Performance: ${args.projectName}`,
  agent: {
    name: 'performance-analyzer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Compare performance between source and target pipelines',
      context: args,
      instructions: [
        'Measure execution time for both pipelines',
        'Compare resource utilization (CPU, memory, I/O)',
        'Analyze throughput and data processing rates',
        'Compare end-to-end latency',
        'Measure scalability characteristics',
        'Identify performance bottlenecks in target',
        'Recommend optimization strategies',
        'Calculate performance improvement metrics',
        'Generate performance comparison report',
        'Document optimization opportunities'
      ],
      outputFormat: 'JSON with success, performanceImprovement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'performanceImprovement', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        performanceImprovement: { type: 'string' },
        executionTimeComparison: { type: 'object' },
        resourceUtilizationComparison: { type: 'object' },
        throughputComparison: { type: 'object' },
        latencyComparison: { type: 'object' },
        bottlenecks: { type: 'array' },
        optimizationRecommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'performance', 'comparison']
}));

export const cutoverPlanningTask = defineTask('cutover-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan Cutover Procedure: ${args.projectName}`,
  agent: {
    name: 'cutover-planner',
    prompt: {
      role: 'Migration Manager specialized in cutover planning',
      task: 'Plan detailed cutover procedure and timeline',
      context: args,
      instructions: [
        'Design cutover approach (gradual vs complete)',
        'Create detailed step-by-step cutover plan',
        'Define cutover window and timing',
        'Plan traffic/workload switching strategy',
        'Define go/no-go criteria',
        'Plan validation checkpoints during cutover',
        'Design communication plan for stakeholders',
        'Create cutover checklist',
        'Plan for contingencies and issues',
        'Define success criteria',
        'Estimate downtime (if any)',
        'Create cutover runbook',
        'Document rollback decision triggers'
      ],
      outputFormat: 'JSON with success, steps, estimatedDowntime, plannedGoLiveDate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'steps', 'estimatedDowntime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        steps: { type: 'array', items: { type: 'object' } },
        estimatedDowntime: { type: 'string' },
        plannedGoLiveDate: { type: 'string' },
        cutoverApproach: { type: 'string' },
        cutoverWindow: { type: 'string' },
        goNoGoCriteria: { type: 'array' },
        validationCheckpoints: { type: 'array' },
        successCriteria: { type: 'array' },
        rollbackTriggers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'cutover', 'planning']
}));

export const rollbackStrategyTask = defineTask('rollback-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Rollback Strategy: ${args.projectName}`,
  agent: {
    name: 'rollback-strategist',
    prompt: {
      role: 'SRE specialized in disaster recovery',
      task: 'Design comprehensive rollback strategy and procedures',
      context: args,
      instructions: [
        'Design rollback decision criteria and triggers',
        'Create step-by-step rollback procedures',
        'Plan data state preservation for rollback',
        'Design traffic rollback strategy',
        'Plan for data synchronization during rollback',
        'Define rollback time windows',
        'Create rollback validation procedures',
        'Design post-rollback recovery procedures',
        'Plan communication during rollback',
        'Create rollback runbook',
        'Document data handling during rollback',
        'Identify point of no return'
      ],
      outputFormat: 'JSON with success, rollbackSteps, estimatedRollbackTime, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rollbackSteps', 'estimatedRollbackTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rollbackSteps: { type: 'array', items: { type: 'object' } },
        estimatedRollbackTime: { type: 'string' },
        rollbackTriggers: { type: 'array' },
        pointOfNoReturn: { type: 'string' },
        dataStatePreservation: { type: 'object' },
        rollbackValidation: { type: 'array' },
        postRollbackRecovery: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'rollback', 'disaster-recovery']
}));

export const trainingPlanTask = defineTask('training-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Training Plan: ${args.projectName}`,
  agent: {
    name: 'training-coordinator',
    prompt: {
      role: 'Technical Trainer',
      task: 'Create comprehensive training and knowledge transfer plan',
      context: args,
      instructions: [
        'Identify training audiences (developers, operators, analysts)',
        'Design training curriculum for new platform',
        'Create hands-on training materials',
        'Plan training sessions and workshops',
        'Create operational documentation',
        'Design knowledge transfer sessions',
        'Create troubleshooting guides',
        'Design certification or assessment criteria',
        'Plan ongoing support model',
        'Create training schedule',
        'Generate training materials and guides',
        'Document knowledge gaps'
      ],
      outputFormat: 'JSON with success, sessionCount, trainingMaterials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sessionCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sessionCount: { type: 'number' },
        audiences: { type: 'array', items: { type: 'string' } },
        trainingMaterials: { type: 'array' },
        workshops: { type: 'array' },
        certificationCriteria: { type: 'array' },
        supportModel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'training', 'knowledge-transfer']
}));

export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Documentation: ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specialized in migration documentation',
      task: 'Generate comprehensive migration documentation',
      context: args,
      instructions: [
        'Create migration overview and executive summary',
        'Document migration strategy and approach',
        'Create detailed architecture documentation',
        'Generate cutover runbook with detailed steps',
        'Create rollback procedures documentation',
        'Document validation procedures and results',
        'Create operational runbooks for new platform',
        'Generate troubleshooting guides',
        'Create FAQ and common issues documentation',
        'Document lessons learned',
        'Create post-migration support guide',
        'Format all documentation professionally'
      ],
      outputFormat: 'JSON with success, cutoverRunbook, documentationPaths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        cutoverRunbook: { type: 'string' },
        rollbackRunbook: { type: 'string' },
        operationalGuide: { type: 'string' },
        troubleshootingGuide: { type: 'string' },
        architectureDoc: { type: 'string' },
        documentationPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'documentation', 'runbooks']
}));

export const postMigrationMonitoringTask = defineTask('post-migration-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Post-Migration Monitoring: ${args.projectName}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'SRE specialized in monitoring',
      task: 'Setup comprehensive post-migration monitoring',
      context: args,
      instructions: [
        'Setup pipeline health monitoring',
        'Configure data quality monitoring',
        'Setup performance monitoring and alerting',
        'Configure SLA monitoring',
        'Setup data freshness monitoring',
        'Configure error rate and failure alerting',
        'Setup cost monitoring and alerting',
        'Configure capacity and resource monitoring',
        'Create monitoring dashboards',
        'Setup anomaly detection',
        'Configure escalation procedures',
        'Document monitoring setup'
      ],
      outputFormat: 'JSON with success, monitoringDashboards, alerts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        monitoringDashboards: { type: 'array' },
        alerts: { type: 'array' },
        slaMonitoring: { type: 'boolean' },
        anomalyDetection: { type: 'boolean' },
        escalationProcedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'monitoring', 'observability']
}));

export const costOptimizationTask = defineTask('cost-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Cost Optimization: ${args.projectName}`,
  agent: {
    name: 'cost-optimizer',
    prompt: {
      role: 'FinOps Engineer',
      task: 'Analyze cost implications and optimization opportunities',
      context: args,
      instructions: [
        'Calculate current state costs (source system)',
        'Estimate target state costs',
        'Compare cost structures',
        'Identify cost optimization opportunities',
        'Analyze cost drivers and variables',
        'Design cost allocation and chargeback',
        'Setup cost monitoring and alerting',
        'Create cost optimization recommendations',
        'Estimate ROI and payback period',
        'Generate cost comparison report'
      ],
      outputFormat: 'JSON with success, costChange, costChangePercent, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'costChange', 'costChangePercent', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        currentCost: { type: 'number' },
        targetCost: { type: 'number' },
        costChange: { type: 'string' },
        costChangePercent: { type: 'number' },
        costDrivers: { type: 'array' },
        optimizationOpportunities: { type: 'array' },
        roi: { type: 'object' },
        paybackPeriod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration', 'cost-optimization', 'finops']
}));
