/**
 * @process digital-marketing/attribution-measurement
 * @description Process for developing and implementing attribution models and measurement frameworks to understand marketing effectiveness and inform budget allocation
 * @inputs { businessQuestions: array, trackingData: object, conversionData: object, channelSpend: object, outputDir: string }
 * @outputs { success: boolean, attributionModels: array, measurementFramework: object, dashboards: array, budgetRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    businessQuestions = [],
    trackingData = {},
    conversionData = {},
    channelSpend = {},
    outputDir = 'attribution-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Attribution and Measurement Framework process');

  // Task 1: Define Attribution Requirements
  ctx.log('info', 'Phase 1: Defining attribution requirements and questions');
  const requirementsResult = await ctx.task(attributionRequirementsTask, {
    businessQuestions,
    outputDir
  });
  artifacts.push(...requirementsResult.artifacts);

  // Task 2: Audit Current Tracking
  ctx.log('info', 'Phase 2: Auditing current tracking and data availability');
  const trackingAudit = await ctx.task(trackingAuditTask, {
    trackingData,
    conversionData,
    outputDir
  });
  artifacts.push(...trackingAudit.artifacts);

  // Task 3: Select Attribution Models
  ctx.log('info', 'Phase 3: Selecting appropriate attribution models');
  const modelSelection = await ctx.task(attributionModelSelectionTask, {
    requirementsResult,
    trackingAudit,
    outputDir
  });
  artifacts.push(...modelSelection.artifacts);

  // Task 4: Configure Platform Attribution
  ctx.log('info', 'Phase 4: Configuring platform-level attribution');
  const platformAttribution = await ctx.task(platformAttributionTask, {
    modelSelection,
    trackingData,
    outputDir
  });
  artifacts.push(...platformAttribution.artifacts);

  // Task 5: Implement Cross-Channel Attribution
  ctx.log('info', 'Phase 5: Implementing cross-channel attribution solution');
  const crossChannelAttribution = await ctx.task(crossChannelAttributionTask, {
    modelSelection,
    trackingData,
    conversionData,
    outputDir
  });
  artifacts.push(...crossChannelAttribution.artifacts);

  // Task 6: Set Up Conversion Lift Studies
  ctx.log('info', 'Phase 6: Setting up conversion lift studies');
  const liftStudies = await ctx.task(conversionLiftStudiesTask, {
    channelSpend,
    conversionData,
    outputDir
  });
  artifacts.push(...liftStudies.artifacts);

  // Task 7: Develop Measurement Framework
  ctx.log('info', 'Phase 7: Developing measurement framework documentation');
  const measurementFramework = await ctx.task(measurementFrameworkTask, {
    requirementsResult,
    modelSelection,
    platformAttribution,
    crossChannelAttribution,
    outputDir
  });
  artifacts.push(...measurementFramework.artifacts);

  // Task 8: Create Attribution Dashboards
  ctx.log('info', 'Phase 8: Creating attribution dashboards');
  const dashboards = await ctx.task(attributionDashboardsTask, {
    measurementFramework,
    modelSelection,
    outputDir
  });
  artifacts.push(...dashboards.artifacts);

  // Breakpoint: Review attribution setup
  await ctx.breakpoint({
    question: `Attribution framework complete. ${modelSelection.modelCount} attribution models configured. Review and approve?`,
    title: 'Attribution Framework Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        attributionModels: modelSelection.modelCount,
        dashboardCount: dashboards.dashboardCount,
        trackingCompleteness: trackingAudit.completenessScore
      }
    }
  });

  // Task 9: Analyze Attribution Data
  ctx.log('info', 'Phase 9: Creating attribution data analysis framework');
  const attributionAnalysis = await ctx.task(attributionAnalysisTask, {
    measurementFramework,
    dashboards,
    outputDir
  });
  artifacts.push(...attributionAnalysis.artifacts);

  // Task 10: Make Budget Recommendations
  ctx.log('info', 'Phase 10: Creating budget recommendation framework');
  const budgetRecommendations = await ctx.task(budgetRecommendationsTask, {
    attributionAnalysis,
    channelSpend,
    outputDir
  });
  artifacts.push(...budgetRecommendations.artifacts);

  // Task 11: Iterate on Models
  ctx.log('info', 'Phase 11: Creating model iteration framework');
  const modelIteration = await ctx.task(modelIterationTask, {
    measurementFramework,
    attributionAnalysis,
    outputDir
  });
  artifacts.push(...modelIteration.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    attributionModels: modelSelection.models,
    measurementFramework: measurementFramework.framework,
    dashboards: dashboards.dashboards,
    budgetRecommendations: budgetRecommendations.recommendations,
    platformConfiguration: platformAttribution.configuration,
    crossChannelSetup: crossChannelAttribution.setup,
    liftStudyFramework: liftStudies.framework,
    iterationPlan: modelIteration.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/attribution-measurement',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const attributionRequirementsTask = defineTask('attribution-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define attribution requirements and questions',
  agent: {
    name: 'attribution-strategist',
    prompt: {
      role: 'marketing attribution strategist',
      task: 'Define attribution requirements and business questions to answer',
      context: args,
      instructions: [
        'Document key business questions',
        'Define attribution use cases',
        'Identify stakeholder needs',
        'Define reporting requirements',
        'Determine granularity needs',
        'Identify decision points',
        'Document data requirements',
        'Create requirements specification'
      ],
      outputFormat: 'JSON with requirements, businessQuestions, useCases, stakeholderNeeds, dataRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        businessQuestions: { type: 'array', items: { type: 'string' } },
        useCases: { type: 'array', items: { type: 'object' } },
        stakeholderNeeds: { type: 'object' },
        dataRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'requirements']
}));

export const trackingAuditTask = defineTask('tracking-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit current tracking and data availability',
  agent: {
    name: 'tracking-auditor',
    prompt: {
      role: 'tracking audit specialist',
      task: 'Audit current tracking setup and data availability',
      context: args,
      instructions: [
        'Audit current tracking implementation',
        'Assess data completeness',
        'Identify tracking gaps',
        'Evaluate data quality',
        'Check cross-device tracking',
        'Assess cookie and consent coverage',
        'Calculate completeness score',
        'Document audit findings'
      ],
      outputFormat: 'JSON with audit, completenessScore, gaps, dataQuality, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audit', 'completenessScore', 'artifacts'],
      properties: {
        audit: { type: 'object' },
        completenessScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'object' } },
        dataQuality: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'tracking-audit']
}));

export const attributionModelSelectionTask = defineTask('attribution-model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate attribution models',
  agent: {
    name: 'model-selector',
    prompt: {
      role: 'attribution model specialist',
      task: 'Select appropriate attribution models for the business',
      context: args,
      instructions: [
        'Evaluate rule-based models (last click, first click, linear, time decay, position-based)',
        'Assess data-driven attribution options',
        'Consider incrementality measurement',
        'Evaluate multi-touch attribution platforms',
        'Recommend primary and secondary models',
        'Document model selection rationale',
        'Plan model comparison approach',
        'Create model documentation'
      ],
      outputFormat: 'JSON with models, modelCount, primaryModel, rationale, comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'modelCount', 'artifacts'],
      properties: {
        models: { type: 'array', items: { type: 'object' } },
        modelCount: { type: 'number' },
        primaryModel: { type: 'object' },
        rationale: { type: 'object' },
        comparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'model-selection']
}));

export const platformAttributionTask = defineTask('platform-attribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure platform-level attribution',
  agent: {
    name: 'platform-configurator',
    prompt: {
      role: 'platform attribution specialist',
      task: 'Configure attribution in individual platforms',
      context: args,
      instructions: [
        'Configure GA4 attribution settings',
        'Set up Google Ads attribution',
        'Configure Meta attribution',
        'Set up other platform attribution',
        'Configure attribution windows',
        'Set conversion counting',
        'Document platform settings',
        'Test attribution accuracy'
      ],
      outputFormat: 'JSON with configuration, platformSettings, windows, testing, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        platformSettings: { type: 'array', items: { type: 'object' } },
        windows: { type: 'object' },
        testing: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'platform-configuration']
}));

export const crossChannelAttributionTask = defineTask('cross-channel-attribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement cross-channel attribution solution',
  agent: {
    name: 'cross-channel-specialist',
    prompt: {
      role: 'cross-channel attribution specialist',
      task: 'Implement unified cross-channel attribution',
      context: args,
      instructions: [
        'Design unified measurement approach',
        'Integrate data sources',
        'Configure cross-channel identity',
        'Set up unified conversion tracking',
        'Build cross-channel data model',
        'Configure channel mapping',
        'Test cross-channel accuracy',
        'Document implementation'
      ],
      outputFormat: 'JSON with setup, dataIntegration, identityResolution, testing, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        dataIntegration: { type: 'object' },
        identityResolution: { type: 'object' },
        testing: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'cross-channel']
}));

export const conversionLiftStudiesTask = defineTask('conversion-lift-studies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up conversion lift studies',
  agent: {
    name: 'lift-study-specialist',
    prompt: {
      role: 'incrementality measurement specialist',
      task: 'Design and set up conversion lift studies',
      context: args,
      instructions: [
        'Design lift study methodology',
        'Define test and control groups',
        'Plan geographic testing',
        'Configure platform lift studies',
        'Set measurement periods',
        'Define success metrics',
        'Plan analysis approach',
        'Document lift study framework'
      ],
      outputFormat: 'JSON with framework, methodology, studyDesigns, analysisApproach, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        methodology: { type: 'object' },
        studyDesigns: { type: 'array', items: { type: 'object' } },
        analysisApproach: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'lift-studies', 'incrementality']
}));

export const measurementFrameworkTask = defineTask('measurement-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop measurement framework documentation',
  agent: {
    name: 'framework-developer',
    prompt: {
      role: 'measurement framework specialist',
      task: 'Develop comprehensive measurement framework',
      context: args,
      instructions: [
        'Document measurement hierarchy',
        'Define metric definitions',
        'Create calculation methodologies',
        'Document data sources',
        'Define governance procedures',
        'Create stakeholder guide',
        'Document limitations and caveats',
        'Create framework documentation'
      ],
      outputFormat: 'JSON with framework, metricDefinitions, methodologies, governance, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        metricDefinitions: { type: 'array', items: { type: 'object' } },
        methodologies: { type: 'object' },
        governance: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'measurement-framework']
}));

export const attributionDashboardsTask = defineTask('attribution-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create attribution dashboards',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'attribution dashboard specialist',
      task: 'Design and create attribution dashboards',
      context: args,
      instructions: [
        'Design executive attribution dashboard',
        'Create channel performance views',
        'Build model comparison dashboards',
        'Create path analysis visualizations',
        'Design ROI dashboards',
        'Build trend analysis views',
        'Configure dashboard filters',
        'Document dashboard usage'
      ],
      outputFormat: 'JSON with dashboards, dashboardCount, designs, dataConnections, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'dashboardCount', 'artifacts'],
      properties: {
        dashboards: { type: 'array', items: { type: 'object' } },
        dashboardCount: { type: 'number' },
        designs: { type: 'object' },
        dataConnections: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'dashboards']
}));

export const attributionAnalysisTask = defineTask('attribution-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create attribution data analysis framework',
  agent: {
    name: 'attribution-analyst',
    prompt: {
      role: 'attribution analyst',
      task: 'Create framework for analyzing attribution data',
      context: args,
      instructions: [
        'Define analysis methodologies',
        'Create analysis templates',
        'Plan regular analysis cadence',
        'Define insight extraction process',
        'Create model comparison approach',
        'Plan incrementality analysis',
        'Design reporting structure',
        'Document analysis playbook'
      ],
      outputFormat: 'JSON with framework, templates, cadence, insightProcess, playbook, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        templates: { type: 'array', items: { type: 'object' } },
        cadence: { type: 'object' },
        insightProcess: { type: 'object' },
        playbook: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'analysis']
}));

export const budgetRecommendationsTask = defineTask('budget-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create budget recommendation framework',
  agent: {
    name: 'budget-optimizer',
    prompt: {
      role: 'marketing budget optimization specialist',
      task: 'Create framework for budget allocation recommendations',
      context: args,
      instructions: [
        'Design ROI analysis methodology',
        'Create efficiency metrics',
        'Build budget scenario modeling',
        'Design recommendation framework',
        'Plan optimization cycles',
        'Create budget allocation templates',
        'Define approval process',
        'Document recommendation methodology'
      ],
      outputFormat: 'JSON with recommendations, methodology, scenarioModels, templates, process, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'object' },
        scenarioModels: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        process: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'budget', 'recommendations']
}));

export const modelIterationTask = defineTask('model-iteration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create model iteration framework',
  agent: {
    name: 'iteration-specialist',
    prompt: {
      role: 'attribution model optimization specialist',
      task: 'Create framework for iterating on attribution models',
      context: args,
      instructions: [
        'Define model evaluation criteria',
        'Plan regular model reviews',
        'Create model comparison tests',
        'Define iteration triggers',
        'Plan model versioning',
        'Create improvement roadmap',
        'Document change management',
        'Create iteration playbook'
      ],
      outputFormat: 'JSON with plan, evaluationCriteria, reviewCadence, versioningStrategy, playbook, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        evaluationCriteria: { type: 'object' },
        reviewCadence: { type: 'object' },
        versioningStrategy: { type: 'object' },
        playbook: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'attribution', 'iteration', 'optimization']
}));
