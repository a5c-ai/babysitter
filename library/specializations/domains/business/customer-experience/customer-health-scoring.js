/**
 * @process customer-experience/customer-health-scoring
 * @description Process for designing, implementing, and monitoring predictive health scores to identify at-risk customers and intervention opportunities
 * @inputs { customerSegments: array, dataPoints: object, businessGoals: array, existingMetrics: object }
 * @outputs { success: boolean, healthScoreModel: object, indicators: array, thresholds: object, playbooks: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerSegments = [],
    dataPoints = {},
    businessGoals = [],
    existingMetrics = {},
    outputDir = 'health-scoring-output',
    targetPredictiveAccuracy = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Customer Health Scoring Implementation');

  // ============================================================================
  // PHASE 1: DATA ASSESSMENT AND REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing available data and requirements');
  const dataAssessment = await ctx.task(dataAssessmentTask, {
    dataPoints,
    customerSegments,
    existingMetrics,
    outputDir
  });

  artifacts.push(...dataAssessment.artifacts);

  // ============================================================================
  // PHASE 2: HEALTH INDICATOR DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing health score indicators');
  const indicatorDesign = await ctx.task(indicatorDesignTask, {
    dataAssessment,
    customerSegments,
    businessGoals,
    outputDir
  });

  artifacts.push(...indicatorDesign.artifacts);

  // ============================================================================
  // PHASE 3: SCORING MODEL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing health scoring model');
  const scoringModel = await ctx.task(scoringModelTask, {
    indicatorDesign,
    dataAssessment,
    customerSegments,
    targetPredictiveAccuracy,
    outputDir
  });

  artifacts.push(...scoringModel.artifacts);

  // ============================================================================
  // PHASE 4: THRESHOLD AND SEGMENTATION DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining thresholds and segmentation rules');
  const thresholdDefinition = await ctx.task(thresholdDefinitionTask, {
    scoringModel,
    customerSegments,
    businessGoals,
    outputDir
  });

  artifacts.push(...thresholdDefinition.artifacts);

  // ============================================================================
  // PHASE 5: INTERVENTION PLAYBOOK DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing intervention playbooks');
  const playbookDesign = await ctx.task(playbookDesignTask, {
    scoringModel,
    thresholdDefinition,
    customerSegments,
    outputDir
  });

  artifacts.push(...playbookDesign.artifacts);

  // ============================================================================
  // PHASE 6: MONITORING AND ALERTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up monitoring and alerting');
  const monitoringSetup = await ctx.task(monitoringSetupTask, {
    scoringModel,
    thresholdDefinition,
    playbookDesign,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 7: VALIDATION AND QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating health score implementation');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    dataAssessment,
    indicatorDesign,
    scoringModel,
    thresholdDefinition,
    playbookDesign,
    monitoringSetup,
    targetPredictiveAccuracy,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityScore = qualityAssessment.overallScore;
  const qualityMet = qualityScore >= 85;

  await ctx.breakpoint({
    question: `Health scoring implementation complete. Quality score: ${qualityScore}/100. ${qualityMet ? 'Implementation meets standards!' : 'May need refinement.'} Review and approve?`,
    title: 'Health Score Implementation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        qualityMet,
        indicatorCount: indicatorDesign.indicators?.length || 0,
        playbookCount: playbookDesign.playbooks?.length || 0,
        segmentCount: customerSegments.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore,
    qualityMet,
    healthScoreModel: scoringModel.model,
    indicators: indicatorDesign.indicators,
    thresholds: thresholdDefinition.thresholds,
    playbooks: playbookDesign.playbooks,
    monitoring: monitoringSetup.configuration,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/customer-health-scoring',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dataAssessmentTask = defineTask('data-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess available data and requirements',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'customer data analyst and health score architect',
      task: 'Assess available customer data sources, quality, and gaps for health scoring',
      context: args,
      instructions: [
        'Inventory all available customer data sources',
        'Assess data quality, completeness, and freshness',
        'Identify behavioral data (usage, engagement, feature adoption)',
        'Identify relationship data (support tickets, NPS, communication)',
        'Identify outcome data (renewals, expansions, churn history)',
        'Map data to potential health indicators',
        'Identify data gaps and collection requirements',
        'Assess data integration and pipeline needs',
        'Generate data assessment report'
      ],
      outputFormat: 'JSON with dataSources, dataQuality, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataSources', 'dataQuality', 'artifacts'],
      properties: {
        dataSources: { type: 'array', items: { type: 'object' } },
        dataQuality: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'health-scoring', 'data-assessment']
}));

export const indicatorDesignTask = defineTask('indicator-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design health score indicators',
  agent: {
    name: 'indicator-designer',
    prompt: {
      role: 'customer success metrics specialist',
      task: 'Design comprehensive health score indicators across usage, engagement, relationship, and outcome dimensions',
      context: args,
      instructions: [
        'Define usage indicators (login frequency, feature adoption, depth of use)',
        'Define engagement indicators (session duration, actions per session)',
        'Define relationship indicators (support sentiment, NPS, CSM engagement)',
        'Define outcome indicators (renewal likelihood, expansion potential)',
        'Assign weights to each indicator based on predictive power',
        'Define calculation methodology for each indicator',
        'Create indicator documentation and glossary',
        'Design indicator refresh cadence',
        'Generate indicator design documentation'
      ],
      outputFormat: 'JSON with indicators, weights, calculations, refreshCadence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'weights', 'artifacts'],
      properties: {
        indicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              weight: { type: 'number' },
              calculation: { type: 'string' },
              dataSource: { type: 'string' }
            }
          }
        },
        weights: { type: 'object' },
        calculations: { type: 'object' },
        refreshCadence: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'health-scoring', 'indicators']
}));

export const scoringModelTask = defineTask('scoring-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop health scoring model',
  agent: {
    name: 'model-developer',
    prompt: {
      role: 'customer success data scientist',
      task: 'Develop predictive health scoring model with weighted indicators and composite score calculation',
      context: args,
      instructions: [
        'Design composite health score formula (0-100 scale)',
        'Define category sub-scores (usage, engagement, relationship, outcomes)',
        'Implement weighted averaging with configurable weights',
        'Design trend analysis (improving, stable, declining)',
        'Create segment-specific scoring adjustments',
        'Define score normalization methodology',
        'Plan model validation and backtesting approach',
        'Document model assumptions and limitations',
        'Generate scoring model documentation'
      ],
      outputFormat: 'JSON with model, formula, categoryScores, trendAnalysis, validation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'formula', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            scale: { type: 'object' },
            components: { type: 'array' }
          }
        },
        formula: { type: 'string' },
        categoryScores: { type: 'object' },
        trendAnalysis: { type: 'object' },
        validation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'health-scoring', 'model']
}));

export const thresholdDefinitionTask = defineTask('threshold-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define thresholds and segmentation rules',
  agent: {
    name: 'threshold-analyst',
    prompt: {
      role: 'customer success strategist',
      task: 'Define health score thresholds, risk tiers, and customer segmentation rules',
      context: args,
      instructions: [
        'Define health score tiers (healthy, monitor, at-risk, critical)',
        'Set threshold boundaries for each tier',
        'Create segment-specific threshold adjustments',
        'Define trending thresholds (rapid decline alerts)',
        'Design early warning indicator thresholds',
        'Create combined rule logic for complex scenarios',
        'Document threshold rationale and validation',
        'Plan threshold tuning process',
        'Generate threshold documentation'
      ],
      outputFormat: 'JSON with thresholds, tiers, segmentAdjustments, earlyWarnings, rules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['thresholds', 'tiers', 'artifacts'],
      properties: {
        thresholds: {
          type: 'object',
          properties: {
            healthy: { type: 'object' },
            monitor: { type: 'object' },
            atRisk: { type: 'object' },
            critical: { type: 'object' }
          }
        },
        tiers: { type: 'array', items: { type: 'object' } },
        segmentAdjustments: { type: 'object' },
        earlyWarnings: { type: 'array', items: { type: 'object' } },
        rules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'health-scoring', 'thresholds']
}));

export const playbookDesignTask = defineTask('playbook-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design intervention playbooks',
  agent: {
    name: 'playbook-designer',
    prompt: {
      role: 'customer success operations specialist',
      task: 'Design intervention playbooks triggered by health score changes and risk signals',
      context: args,
      instructions: [
        'Design playbooks for each risk tier transition',
        'Create escalation playbooks for critical accounts',
        'Design proactive engagement playbooks for healthy accounts',
        'Define playbook triggers and entry criteria',
        'Outline step-by-step intervention actions',
        'Define success criteria for each playbook',
        'Create communication templates for interventions',
        'Design playbook measurement and optimization',
        'Generate playbook documentation'
      ],
      outputFormat: 'JSON with playbooks, triggers, actions, templates, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['playbooks', 'triggers', 'artifacts'],
      properties: {
        playbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              trigger: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              successCriteria: { type: 'string' }
            }
          }
        },
        triggers: { type: 'array', items: { type: 'object' } },
        actions: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'health-scoring', 'playbooks']
}));

export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up monitoring and alerting',
  agent: {
    name: 'monitoring-specialist',
    prompt: {
      role: 'customer success systems administrator',
      task: 'Configure health score monitoring dashboards and alerting systems',
      context: args,
      instructions: [
        'Design health score dashboard layout and widgets',
        'Configure real-time health score monitoring',
        'Set up alert rules for threshold breaches',
        'Configure notification channels and routing',
        'Design trend visualization and reporting',
        'Set up automated playbook triggering',
        'Configure data refresh schedules',
        'Plan dashboard access and permissions',
        'Generate monitoring configuration documentation'
      ],
      outputFormat: 'JSON with configuration, dashboards, alerts, notifications, automation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'dashboards', 'alerts', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'array', items: { type: 'object' } },
        notifications: { type: 'object' },
        automation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'health-scoring', 'monitoring']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate health score implementation',
  agent: {
    name: 'quality-validator',
    prompt: {
      role: 'customer success quality assurance specialist',
      task: 'Validate health score implementation quality and predictive accuracy',
      context: args,
      instructions: [
        'Evaluate data quality and completeness (weight: 20%)',
        'Assess indicator design comprehensiveness (weight: 20%)',
        'Review scoring model validity (weight: 25%)',
        'Evaluate threshold appropriateness (weight: 15%)',
        'Assess playbook coverage and quality (weight: 15%)',
        'Review monitoring setup completeness (weight: 5%)',
        'Calculate overall quality score',
        'Identify gaps and recommendations',
        'Generate validation report'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'health-scoring', 'quality-assessment']
}));
