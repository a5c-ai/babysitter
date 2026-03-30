/**
 * @process education/learning-analytics
 * @description Systematic collection, analysis, and reporting of learner data to inform instructional decisions and improve learning outcomes
 * @inputs { dataContext: object, analyticsGoals: array, dataSources: array, stakeholders: array, constraints: object }
 * @outputs { success: boolean, analyticsFramework: object, dashboards: array, reportingStructure: object, artifacts: array }
 * @recommendedSkills SK-EDU-009 (learning-analytics-interpretation), SK-EDU-007 (lms-configuration-administration)
 * @recommendedAgents AG-EDU-007 (learning-evaluation-analyst), AG-EDU-005 (learning-technology-administrator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataContext = {},
    analyticsGoals = [],
    dataSources = [],
    stakeholders = [],
    constraints = {},
    outputDir = 'learning-analytics-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Learning Analytics Implementation');

  // ============================================================================
  // ANALYTICS STRATEGY
  // ============================================================================

  ctx.log('info', 'Developing analytics strategy');
  const analyticsStrategy = await ctx.task(analyticsStrategyTask, {
    dataContext,
    analyticsGoals,
    stakeholders,
    outputDir
  });

  artifacts.push(...analyticsStrategy.artifacts);

  // ============================================================================
  // DATA COLLECTION DESIGN
  // ============================================================================

  ctx.log('info', 'Designing data collection');
  const dataCollection = await ctx.task(dataCollectionDesignTask, {
    dataSources,
    analyticsGoals,
    constraints,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // ============================================================================
  // METRICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Defining learning metrics');
  const metricsDefinition = await ctx.task(metricsDefinitionTask, {
    analyticsGoals,
    dataSources,
    stakeholders,
    outputDir
  });

  artifacts.push(...metricsDefinition.artifacts);

  // ============================================================================
  // ANALYSIS FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Creating analysis framework');
  const analysisFramework = await ctx.task(analysisFrameworkTask, {
    metrics: metricsDefinition.metrics,
    analyticsGoals,
    outputDir
  });

  artifacts.push(...analysisFramework.artifacts);

  // ============================================================================
  // DASHBOARD DESIGN
  // ============================================================================

  ctx.log('info', 'Designing analytics dashboards');
  const dashboardDesign = await ctx.task(dashboardDesignTask, {
    metrics: metricsDefinition.metrics,
    stakeholders,
    analyticsGoals,
    outputDir
  });

  artifacts.push(...dashboardDesign.artifacts);

  // ============================================================================
  // INTERVENTION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Developing intervention framework');
  const interventionFramework = await ctx.task(interventionFrameworkTask, {
    metrics: metricsDefinition.metrics,
    analysisFramework: analysisFramework.framework,
    outputDir
  });

  artifacts.push(...interventionFramework.artifacts);

  // ============================================================================
  // ETHICS AND PRIVACY
  // ============================================================================

  ctx.log('info', 'Addressing ethics and privacy');
  const ethicsPrivacy = await ctx.task(ethicsPrivacyTask, {
    dataCollection: dataCollection.design,
    constraints,
    outputDir
  });

  artifacts.push(...ethicsPrivacy.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring learning analytics quality');
  const qualityScore = await ctx.task(analyticsQualityScoringTask, {
    analyticsStrategy,
    dataCollection,
    metricsDefinition,
    analysisFramework,
    dashboardDesign,
    ethicsPrivacy,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review analytics implementation
  await ctx.breakpoint({
    question: `Learning analytics implementation complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Learning Analytics Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        totalMetrics: metricsDefinition.metrics?.length || 0,
        totalDashboards: dashboardDesign.dashboards?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: overallScore,
    qualityMet,
    analyticsFramework: {
      strategy: analyticsStrategy.strategy,
      metrics: metricsDefinition.metrics,
      analysis: analysisFramework.framework
    },
    dashboards: dashboardDesign.dashboards,
    reportingStructure: dashboardDesign.reporting,
    interventions: interventionFramework.framework,
    ethicsGuidelines: ethicsPrivacy.guidelines,
    artifacts,
    duration,
    metadata: {
      processId: 'education/learning-analytics',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const analyticsStrategyTask = defineTask('analytics-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop analytics strategy',
  agent: {
    name: 'analytics-strategist',
    prompt: {
      role: 'learning analytics strategist',
      task: 'Develop comprehensive learning analytics strategy',
      context: args,
      instructions: [
        'Define analytics vision and goals',
        'Identify key questions to answer',
        'Map stakeholder needs',
        'Define analytics maturity roadmap',
        'Plan organizational change management',
        'Identify success criteria',
        'Plan resource requirements',
        'Generate analytics strategy document'
      ],
      outputFormat: 'JSON with strategy, vision, questions, roadmap, success, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        vision: { type: 'string' },
        questions: { type: 'array' },
        roadmap: { type: 'object' },
        success: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-analytics', 'strategy', 'planning']
}));

export const dataCollectionDesignTask = defineTask('data-collection-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design data collection',
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'learning data architect',
      task: 'Design data collection infrastructure',
      context: args,
      instructions: [
        'Map available data sources',
        'Design data collection points',
        'Plan data integration approach',
        'Create data schema design',
        'Plan data quality measures',
        'Design data storage approach',
        'Plan real-time vs batch collection',
        'Generate data collection design document'
      ],
      outputFormat: 'JSON with design, sources, schema, integration, quality, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'sources', 'artifacts'],
      properties: {
        design: { type: 'object' },
        sources: { type: 'array' },
        schema: { type: 'object' },
        integration: { type: 'object' },
        quality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-analytics', 'data-collection', 'design']
}));

export const metricsDefinitionTask = defineTask('metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define learning metrics',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'learning metrics specialist',
      task: 'Define learning analytics metrics and KPIs',
      context: args,
      instructions: [
        'Define engagement metrics',
        'Define progress metrics',
        'Define performance metrics',
        'Define at-risk indicators',
        'Define success predictors',
        'Create metric calculation formulas',
        'Define benchmarks and thresholds',
        'Generate metrics definition document'
      ],
      outputFormat: 'JSON with metrics, engagement, progress, performance, atRisk, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'array' },
        engagement: { type: 'array' },
        progress: { type: 'array' },
        performance: { type: 'array' },
        atRisk: { type: 'array' },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-analytics', 'metrics', 'definition']
}));

export const analysisFrameworkTask = defineTask('analysis-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create analysis framework',
  agent: {
    name: 'analysis-designer',
    prompt: {
      role: 'data analysis specialist',
      task: 'Create learning data analysis framework',
      context: args,
      instructions: [
        'Design descriptive analytics approach',
        'Plan diagnostic analytics methods',
        'Design predictive analytics models',
        'Plan prescriptive analytics',
        'Create statistical analysis procedures',
        'Design machine learning applications',
        'Plan visualization approaches',
        'Generate analysis framework document'
      ],
      outputFormat: 'JSON with framework, descriptive, diagnostic, predictive, prescriptive, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        descriptive: { type: 'object' },
        diagnostic: { type: 'object' },
        predictive: { type: 'object' },
        prescriptive: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-analytics', 'analysis', 'framework']
}));

export const dashboardDesignTask = defineTask('dashboard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design analytics dashboards',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'analytics dashboard designer',
      task: 'Design learning analytics dashboards',
      context: args,
      instructions: [
        'Design instructor dashboard',
        'Design student dashboard',
        'Design administrator dashboard',
        'Plan real-time updates',
        'Design alert system',
        'Create reporting structure',
        'Plan drill-down capabilities',
        'Generate dashboard specifications document'
      ],
      outputFormat: 'JSON with dashboards, reporting, alerts, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'reporting', 'artifacts'],
      properties: {
        dashboards: { type: 'array' },
        reporting: { type: 'object' },
        alerts: { type: 'array' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-analytics', 'dashboards', 'design']
}));

export const interventionFrameworkTask = defineTask('intervention-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop intervention framework',
  agent: {
    name: 'intervention-designer',
    prompt: {
      role: 'learning intervention specialist',
      task: 'Develop analytics-driven intervention framework',
      context: args,
      instructions: [
        'Define intervention triggers',
        'Design early warning system',
        'Create intervention protocols',
        'Plan automated interventions',
        'Design human-in-loop interventions',
        'Plan intervention effectiveness tracking',
        'Create escalation procedures',
        'Generate intervention framework document'
      ],
      outputFormat: 'JSON with framework, triggers, protocols, automated, tracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        triggers: { type: 'array' },
        protocols: { type: 'array' },
        automated: { type: 'array' },
        tracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-analytics', 'interventions', 'framework']
}));

export const ethicsPrivacyTask = defineTask('ethics-privacy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Address ethics and privacy',
  agent: {
    name: 'ethics-specialist',
    prompt: {
      role: 'data ethics specialist',
      task: 'Develop ethics and privacy guidelines for learning analytics',
      context: args,
      instructions: [
        'Develop data privacy policies',
        'Create consent procedures',
        'Plan data anonymization',
        'Address algorithmic bias',
        'Create transparency guidelines',
        'Plan data retention policies',
        'Develop student data rights',
        'Generate ethics guidelines document'
      ],
      outputFormat: 'JSON with guidelines, privacy, consent, transparency, rights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: { type: 'object' },
        privacy: { type: 'object' },
        consent: { type: 'object' },
        transparency: { type: 'array' },
        rights: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-analytics', 'ethics', 'privacy']
}));

export const analyticsQualityScoringTask = defineTask('analytics-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score learning analytics quality',
  agent: {
    name: 'analytics-quality-auditor',
    prompt: {
      role: 'learning analytics quality auditor',
      task: 'Assess learning analytics implementation quality',
      context: args,
      instructions: [
        'Evaluate strategy alignment (weight: 15%)',
        'Assess data collection design (weight: 20%)',
        'Review metrics definition (weight: 20%)',
        'Evaluate analysis framework (weight: 20%)',
        'Assess dashboard design (weight: 15%)',
        'Evaluate ethics compliance (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'learning-analytics', 'quality-scoring', 'validation']
}));
