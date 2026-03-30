/**
 * @process specializations/domains/business/public-relations/pr-measurement-framework
 * @description Establish measurement programs following Barcelona Principles 3.0 and AMEC Integrated Evaluation Framework to track outputs, outcomes, and organizational impact
 * @specialization Public Relations and Communications
 * @category Measurement and Analytics
 * @inputs { organization: object, prProgram: object, objectives: object[], currentMeasurement: object }
 * @outputs { success: boolean, measurementFramework: object, kpiDashboard: object, reportingPlan: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    prProgram,
    objectives = [],
    currentMeasurement = {},
    stakeholders = [],
    targetQuality = 90
  } = inputs;

  // Phase 1: Measurement Audit
  await ctx.breakpoint({
    question: 'Starting PR measurement framework. Audit current measurement?',
    title: 'Phase 1: Measurement Audit',
    context: {
      runId: ctx.runId,
      phase: 'measurement-audit',
      organization: organization.name
    }
  });

  const measurementAudit = await ctx.task(auditCurrentMeasurementTask, {
    currentMeasurement,
    prProgram,
    organization
  });

  // Phase 2: Barcelona Principles Alignment
  await ctx.breakpoint({
    question: 'Audit complete. Align with Barcelona Principles 3.0?',
    title: 'Phase 2: Barcelona Principles',
    context: {
      runId: ctx.runId,
      phase: 'barcelona-principles'
    }
  });

  const barcelonaAlignment = await ctx.task(alignBarcelonaPrinciplesTask, {
    measurementAudit,
    objectives,
    prProgram
  });

  // Phase 3: AMEC Framework Integration
  await ctx.breakpoint({
    question: 'Barcelona aligned. Integrate AMEC evaluation framework?',
    title: 'Phase 3: AMEC Framework',
    context: {
      runId: ctx.runId,
      phase: 'amec-framework'
    }
  });

  const amecFramework = await ctx.task(integrateAmecFrameworkTask, {
    barcelonaAlignment,
    objectives,
    prProgram
  });

  // Phase 4: KPI Definition
  await ctx.breakpoint({
    question: 'AMEC integrated. Define KPIs and metrics?',
    title: 'Phase 4: KPI Definition',
    context: {
      runId: ctx.runId,
      phase: 'kpi-definition'
    }
  });

  const [outputMetrics, outcomeMetrics, impactMetrics] = await Promise.all([
    ctx.task(defineOutputMetricsTask, {
      amecFramework,
      prProgram
    }),
    ctx.task(defineOutcomeMetricsTask, {
      amecFramework,
      objectives
    }),
    ctx.task(defineImpactMetricsTask, {
      amecFramework,
      objectives,
      organization
    })
  ]);

  // Phase 5: Data Collection Strategy
  await ctx.breakpoint({
    question: 'KPIs defined. Plan data collection strategy?',
    title: 'Phase 5: Data Collection',
    context: {
      runId: ctx.runId,
      phase: 'data-collection'
    }
  });

  const dataCollectionStrategy = await ctx.task(planDataCollectionTask, {
    outputMetrics,
    outcomeMetrics,
    impactMetrics
  });

  // Phase 6: Dashboard Design
  await ctx.breakpoint({
    question: 'Collection planned. Design measurement dashboard?',
    title: 'Phase 6: Dashboard Design',
    context: {
      runId: ctx.runId,
      phase: 'dashboard-design'
    }
  });

  const dashboardDesign = await ctx.task(designDashboardTask, {
    outputMetrics,
    outcomeMetrics,
    impactMetrics,
    stakeholders
  });

  // Phase 7: Reporting Framework
  await ctx.breakpoint({
    question: 'Dashboard designed. Define reporting framework?',
    title: 'Phase 7: Reporting Framework',
    context: {
      runId: ctx.runId,
      phase: 'reporting-framework'
    }
  });

  const reportingFramework = await ctx.task(defineReportingFrameworkTask, {
    dashboardDesign,
    stakeholders,
    amecFramework
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate PR measurement framework quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateMeasurementFrameworkTask, {
    measurementAudit,
    barcelonaAlignment,
    amecFramework,
    outputMetrics,
    outcomeMetrics,
    impactMetrics,
    dataCollectionStrategy,
    dashboardDesign,
    reportingFramework,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      measurementFramework: {
        barcelonaAlignment,
        amecFramework,
        metrics: {
          outputs: outputMetrics,
          outcomes: outcomeMetrics,
          impact: impactMetrics
        },
        dataCollection: dataCollectionStrategy
      },
      kpiDashboard: dashboardDesign,
      reportingPlan: reportingFramework,
      auditInsights: measurementAudit.insights,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/pr-measurement-framework',
        timestamp: ctx.now(),
        organization: organization.name
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/pr-measurement-framework',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const auditCurrentMeasurementTask = defineTask('audit-current-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit Current Measurement',
  agent: {
    name: 'measurement-auditor',
    prompt: {
      role: 'PR measurement specialist auditing current state',
      task: 'Audit current PR measurement practices',
      context: args,
      instructions: [
        'Review current metrics being tracked',
        'Assess measurement tools and platforms',
        'Evaluate data quality and consistency',
        'Identify measurement gaps',
        'Assess reporting effectiveness',
        'Evaluate stakeholder satisfaction with metrics',
        'Benchmark against industry standards',
        'Identify improvement opportunities'
      ],
      outputFormat: 'JSON with currentMetrics, toolsAssessment, dataQuality, gaps, reportingEffectiveness, stakeholderSatisfaction, benchmarks, opportunities, insights'
    },
    outputSchema: {
      type: 'object',
      required: ['currentMetrics', 'gaps', 'insights'],
      properties: {
        currentMetrics: { type: 'array', items: { type: 'object' } },
        toolsAssessment: { type: 'object' },
        dataQuality: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        reportingEffectiveness: { type: 'object' },
        stakeholderSatisfaction: { type: 'object' },
        benchmarks: { type: 'object' },
        opportunities: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'measurement-audit']
}));

export const alignBarcelonaPrinciplesTask = defineTask('align-barcelona-principles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align Barcelona Principles 3.0',
  agent: {
    name: 'barcelona-aligner',
    prompt: {
      role: 'PR measurement standards expert applying Barcelona Principles',
      task: 'Align measurement approach with Barcelona Principles 3.0',
      context: args,
      instructions: [
        'Apply Principle 1: Goal setting is prerequisite',
        'Apply Principle 2: Outcomes should be measured',
        'Apply Principle 3: Outcomes should inform all stakeholders',
        'Apply Principle 4: Measure media quality and quantity',
        'Apply Principle 5: AVEs are not PR value',
        'Apply Principle 6: Holistic social media measurement',
        'Apply Principle 7: Measure organizational performance transparently',
        'Document principle application and compliance'
      ],
      outputFormat: 'JSON with principleCompliance array (principle, application, status), overallAlignment, complianceGaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['principleCompliance', 'overallAlignment'],
      properties: {
        principleCompliance: { type: 'array', items: { type: 'object' } },
        overallAlignment: { type: 'object' },
        complianceGaps: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'barcelona-principles']
}));

export const integrateAmecFrameworkTask = defineTask('integrate-amec-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate AMEC Framework',
  agent: {
    name: 'amec-integrator',
    prompt: {
      role: 'AMEC framework specialist integrating evaluation model',
      task: 'Integrate AMEC Integrated Evaluation Framework',
      context: args,
      instructions: [
        'Map objectives to AMEC framework stages',
        'Define Inputs measurement',
        'Define Activities measurement',
        'Define Outputs measurement',
        'Define Out-takes measurement',
        'Define Outcomes measurement',
        'Define Organizational Impact measurement',
        'Create integrated measurement model'
      ],
      outputFormat: 'JSON with objectivesMapping, inputs, activities, outputs, outTakes, outcomes, organizationalImpact, integratedModel'
    },
    outputSchema: {
      type: 'object',
      required: ['objectivesMapping', 'outputs', 'outcomes', 'organizationalImpact'],
      properties: {
        objectivesMapping: { type: 'object' },
        inputs: { type: 'object' },
        activities: { type: 'object' },
        outputs: { type: 'object' },
        outTakes: { type: 'object' },
        outcomes: { type: 'object' },
        organizationalImpact: { type: 'object' },
        integratedModel: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'amec-framework']
}));

export const defineOutputMetricsTask = defineTask('define-output-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Output Metrics',
  agent: {
    name: 'output-metrics-definer',
    prompt: {
      role: 'PR metrics specialist defining output measurements',
      task: 'Define output metrics for PR measurement',
      context: args,
      instructions: [
        'Define media coverage volume metrics',
        'Define reach and impressions metrics',
        'Define share of voice metrics',
        'Define message pull-through metrics',
        'Define social media output metrics',
        'Define content production metrics',
        'Define spokesperson activity metrics',
        'Establish measurement methodology'
      ],
      outputFormat: 'JSON with coverageMetrics, reachMetrics, shareOfVoice, messagePullThrough, socialMetrics, contentMetrics, spokespersonMetrics, methodology'
    },
    outputSchema: {
      type: 'object',
      required: ['coverageMetrics', 'reachMetrics', 'shareOfVoice'],
      properties: {
        coverageMetrics: { type: 'array', items: { type: 'object' } },
        reachMetrics: { type: 'array', items: { type: 'object' } },
        shareOfVoice: { type: 'object' },
        messagePullThrough: { type: 'object' },
        socialMetrics: { type: 'array', items: { type: 'object' } },
        contentMetrics: { type: 'array', items: { type: 'object' } },
        spokespersonMetrics: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'output-metrics']
}));

export const defineOutcomeMetricsTask = defineTask('define-outcome-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Outcome Metrics',
  agent: {
    name: 'outcome-metrics-definer',
    prompt: {
      role: 'PR measurement specialist defining outcome measurements',
      task: 'Define outcome metrics for PR measurement',
      context: args,
      instructions: [
        'Define awareness metrics',
        'Define understanding/knowledge metrics',
        'Define sentiment and attitude metrics',
        'Define trust and credibility metrics',
        'Define behavior change metrics',
        'Define advocacy and recommendation metrics',
        'Define stakeholder perception metrics',
        'Establish measurement methodology'
      ],
      outputFormat: 'JSON with awarenessMetrics, knowledgeMetrics, sentimentMetrics, trustMetrics, behaviorMetrics, advocacyMetrics, perceptionMetrics, methodology'
    },
    outputSchema: {
      type: 'object',
      required: ['awarenessMetrics', 'sentimentMetrics', 'behaviorMetrics'],
      properties: {
        awarenessMetrics: { type: 'array', items: { type: 'object' } },
        knowledgeMetrics: { type: 'array', items: { type: 'object' } },
        sentimentMetrics: { type: 'array', items: { type: 'object' } },
        trustMetrics: { type: 'array', items: { type: 'object' } },
        behaviorMetrics: { type: 'array', items: { type: 'object' } },
        advocacyMetrics: { type: 'array', items: { type: 'object' } },
        perceptionMetrics: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'outcome-metrics']
}));

export const defineImpactMetricsTask = defineTask('define-impact-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Impact Metrics',
  agent: {
    name: 'impact-metrics-definer',
    prompt: {
      role: 'Business impact measurement specialist',
      task: 'Define organizational impact metrics for PR',
      context: args,
      instructions: [
        'Define reputation score metrics',
        'Define business performance linkage',
        'Define stakeholder relationship metrics',
        'Define risk and crisis impact metrics',
        'Define employee engagement impact',
        'Define sales and revenue correlation',
        'Define cost avoidance metrics',
        'Establish attribution methodology'
      ],
      outputFormat: 'JSON with reputationMetrics, businessLinkage, relationshipMetrics, riskMetrics, employeeImpact, revenueCorrelation, costAvoidance, attributionMethodology'
    },
    outputSchema: {
      type: 'object',
      required: ['reputationMetrics', 'businessLinkage'],
      properties: {
        reputationMetrics: { type: 'array', items: { type: 'object' } },
        businessLinkage: { type: 'object' },
        relationshipMetrics: { type: 'array', items: { type: 'object' } },
        riskMetrics: { type: 'array', items: { type: 'object' } },
        employeeImpact: { type: 'array', items: { type: 'object' } },
        revenueCorrelation: { type: 'object' },
        costAvoidance: { type: 'object' },
        attributionMethodology: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'impact-metrics']
}));

export const planDataCollectionTask = defineTask('plan-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Data Collection',
  agent: {
    name: 'data-collection-planner',
    prompt: {
      role: 'Research and analytics specialist planning data collection',
      task: 'Plan data collection strategy for PR measurement',
      context: args,
      instructions: [
        'Define data sources for each metric',
        'Plan media monitoring data collection',
        'Plan social listening data collection',
        'Design survey and research approach',
        'Plan internal data integration',
        'Define data collection frequency',
        'Establish data quality standards',
        'Create data governance approach'
      ],
      outputFormat: 'JSON with dataSources, mediaMonitoring, socialListening, surveyApproach, internalData, collectionFrequency, qualityStandards, dataGovernance'
    },
    outputSchema: {
      type: 'object',
      required: ['dataSources', 'collectionFrequency'],
      properties: {
        dataSources: { type: 'object' },
        mediaMonitoring: { type: 'object' },
        socialListening: { type: 'object' },
        surveyApproach: { type: 'object' },
        internalData: { type: 'object' },
        collectionFrequency: { type: 'object' },
        qualityStandards: { type: 'array', items: { type: 'string' } },
        dataGovernance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'data-collection']
}));

export const designDashboardTask = defineTask('design-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Dashboard',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'Business intelligence specialist designing PR dashboards',
      task: 'Design PR measurement dashboard',
      context: args,
      instructions: [
        'Design executive summary view',
        'Create output metrics dashboard',
        'Create outcome metrics dashboard',
        'Create impact metrics dashboard',
        'Design drill-down capabilities',
        'Plan visualization approach',
        'Define refresh frequency',
        'Create user access levels'
      ],
      outputFormat: 'JSON with executiveSummary, outputsDashboard, outcomesDashboard, impactDashboard, drillDowns, visualizations, refreshFrequency, accessLevels'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'outputsDashboard', 'outcomesDashboard'],
      properties: {
        executiveSummary: { type: 'object' },
        outputsDashboard: { type: 'object' },
        outcomesDashboard: { type: 'object' },
        impactDashboard: { type: 'object' },
        drillDowns: { type: 'array', items: { type: 'object' } },
        visualizations: { type: 'array', items: { type: 'object' } },
        refreshFrequency: { type: 'string' },
        accessLevels: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'dashboard-design']
}));

export const defineReportingFrameworkTask = defineTask('define-reporting-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Reporting Framework',
  agent: {
    name: 'reporting-framework-definer',
    prompt: {
      role: 'PR reporting specialist defining framework',
      task: 'Define PR measurement reporting framework',
      context: args,
      instructions: [
        'Define report types and cadence',
        'Create report templates',
        'Define audience-specific reports',
        'Plan narrative and insights approach',
        'Define benchmarking reports',
        'Create campaign-specific reporting',
        'Plan quarterly and annual reviews',
        'Define continuous improvement process'
      ],
      outputFormat: 'JSON with reportTypes, templates, audienceReports, narrativeApproach, benchmarkingReports, campaignReporting, periodicReviews, improvementProcess'
    },
    outputSchema: {
      type: 'object',
      required: ['reportTypes', 'templates'],
      properties: {
        reportTypes: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        audienceReports: { type: 'object' },
        narrativeApproach: { type: 'object' },
        benchmarkingReports: { type: 'object' },
        campaignReporting: { type: 'object' },
        periodicReviews: { type: 'object' },
        improvementProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'reporting-framework']
}));

export const validateMeasurementFrameworkTask = defineTask('validate-measurement-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Measurement Framework Quality',
  agent: {
    name: 'measurement-framework-validator',
    prompt: {
      role: 'PR measurement quality assessor',
      task: 'Validate PR measurement framework quality',
      context: args,
      instructions: [
        'Assess Barcelona Principles compliance',
        'Evaluate AMEC framework integration',
        'Review output metrics completeness',
        'Assess outcome metrics validity',
        'Evaluate impact metrics rigor',
        'Review data collection feasibility',
        'Assess dashboard usability',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, barcelonaScore, amecScore, outputScore, outcomeScore, impactScore, dataCollectionScore, dashboardScore, reportingScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        barcelonaScore: { type: 'number' },
        amecScore: { type: 'number' },
        outputScore: { type: 'number' },
        outcomeScore: { type: 'number' },
        impactScore: { type: 'number' },
        dataCollectionScore: { type: 'number' },
        dashboardScore: { type: 'number' },
        reportingScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
