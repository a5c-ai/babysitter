/**
 * @process digital-marketing/lead-scoring
 * @description Process for developing and implementing lead scoring models that qualify leads based on demographic fit and behavioral engagement, enabling sales prioritization
 * @inputs { icpDefinition: object, crmData: object, behavioralData: object, salesFeedback: object, outputDir: string }
 * @outputs { success: boolean, leadScoringModel: object, scoringDocumentation: object, mqlCriteria: object, salesAlignmentSLA: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    icpDefinition = {},
    crmData = {},
    behavioralData = {},
    salesFeedback = {},
    outputDir = 'lead-scoring-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Lead Scoring and Qualification process');

  // Task 1: Define Ideal Customer Profile (ICP)
  ctx.log('info', 'Phase 1: Defining ideal customer profile');
  const icpResult = await ctx.task(icpDefinitionTask, {
    icpDefinition,
    crmData,
    outputDir
  });
  artifacts.push(...icpResult.artifacts);

  // Task 2: Identify Demographic Scoring Attributes
  ctx.log('info', 'Phase 2: Identifying demographic and firmographic scoring attributes');
  const demographicScoring = await ctx.task(demographicScoringTask, {
    icpResult,
    crmData,
    outputDir
  });
  artifacts.push(...demographicScoring.artifacts);

  // Task 3: Define Behavioral Scoring Criteria
  ctx.log('info', 'Phase 3: Defining behavioral scoring criteria');
  const behavioralScoring = await ctx.task(behavioralScoringTask, {
    behavioralData,
    salesFeedback,
    outputDir
  });
  artifacts.push(...behavioralScoring.artifacts);

  // Task 4: Assign Point Values
  ctx.log('info', 'Phase 4: Assigning point values to attributes and behaviors');
  const pointAssignment = await ctx.task(pointAssignmentTask, {
    demographicScoring,
    behavioralScoring,
    outputDir
  });
  artifacts.push(...pointAssignment.artifacts);

  // Task 5: Set Scoring Thresholds
  ctx.log('info', 'Phase 5: Setting scoring thresholds for MQL/SQL');
  const thresholdSetting = await ctx.task(thresholdSettingTask, {
    pointAssignment,
    salesFeedback,
    outputDir
  });
  artifacts.push(...thresholdSetting.artifacts);

  // Task 6: Configure Scoring Model
  ctx.log('info', 'Phase 6: Configuring scoring model in platform');
  const modelConfiguration = await ctx.task(modelConfigurationTask, {
    demographicScoring,
    behavioralScoring,
    pointAssignment,
    thresholdSetting,
    outputDir
  });
  artifacts.push(...modelConfiguration.artifacts);

  // Task 7: Implement Negative Scoring
  ctx.log('info', 'Phase 7: Implementing negative scoring for disqualification');
  const negativeScoring = await ctx.task(negativeScoringTask, {
    modelConfiguration,
    icpResult,
    outputDir
  });
  artifacts.push(...negativeScoring.artifacts);

  // Task 8: Test Scoring Accuracy
  ctx.log('info', 'Phase 8: Testing scoring accuracy with historical data');
  const scoringTest = await ctx.task(scoringTestingTask, {
    modelConfiguration,
    crmData,
    outputDir
  });
  artifacts.push(...scoringTest.artifacts);

  // Breakpoint: Review scoring model
  await ctx.breakpoint({
    question: `Lead scoring model ready. Accuracy score: ${scoringTest.accuracyScore}%. ${thresholdSetting.mqlThreshold} points for MQL. Review and approve?`,
    title: 'Lead Scoring Model Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        demographicAttributes: demographicScoring.attributeCount,
        behavioralSignals: behavioralScoring.signalCount,
        mqlThreshold: thresholdSetting.mqlThreshold,
        sqlThreshold: thresholdSetting.sqlThreshold,
        accuracyScore: scoringTest.accuracyScore
      }
    }
  });

  // Task 9: Launch and Monitor Performance
  ctx.log('info', 'Phase 9: Creating launch and monitoring plan');
  const launchMonitoring = await ctx.task(launchMonitoringTask, {
    modelConfiguration,
    thresholdSetting,
    outputDir
  });
  artifacts.push(...launchMonitoring.artifacts);

  // Task 10: Align with Sales on Lead Handoff
  ctx.log('info', 'Phase 10: Aligning with sales on lead handoff process');
  const salesAlignment = await ctx.task(salesAlignmentTask, {
    thresholdSetting,
    salesFeedback,
    outputDir
  });
  artifacts.push(...salesAlignment.artifacts);

  // Task 11: Iterate Based on Feedback
  ctx.log('info', 'Phase 11: Creating iteration framework based on feedback and data');
  const iterationFramework = await ctx.task(iterationFrameworkTask, {
    modelConfiguration,
    salesAlignment,
    outputDir
  });
  artifacts.push(...iterationFramework.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    leadScoringModel: modelConfiguration.model,
    scoringDocumentation: modelConfiguration.documentation,
    mqlCriteria: thresholdSetting.mqlCriteria,
    salesAlignmentSLA: salesAlignment.sla,
    demographicModel: demographicScoring.model,
    behavioralModel: behavioralScoring.model,
    negativeScoring: negativeScoring.rules,
    iterationPlan: iterationFramework.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/lead-scoring',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const icpDefinitionTask = defineTask('icp-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define ideal customer profile',
  agent: {
    name: 'icp-specialist',
    prompt: {
      role: 'ideal customer profile specialist',
      task: 'Define comprehensive ideal customer profile',
      context: args,
      instructions: [
        'Analyze best existing customers',
        'Identify firmographic characteristics',
        'Define company size criteria',
        'Identify industry verticals',
        'Define geographic criteria',
        'Identify technographic attributes',
        'Create ICP documentation',
        'Define ICP tiers'
      ],
      outputFormat: 'JSON with icp, firmographics, demographics, tiers, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['icp', 'artifacts'],
      properties: {
        icp: { type: 'object' },
        firmographics: { type: 'object' },
        demographics: { type: 'object' },
        tiers: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'icp']
}));

export const demographicScoringTask = defineTask('demographic-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify demographic and firmographic scoring attributes',
  agent: {
    name: 'demographic-analyst',
    prompt: {
      role: 'lead scoring analyst',
      task: 'Define demographic and firmographic scoring attributes',
      context: args,
      instructions: [
        'Define job title scoring',
        'Set department/function scoring',
        'Define company size scoring',
        'Set industry scoring',
        'Define geography scoring',
        'Set revenue scoring',
        'Create attribute weighting',
        'Document scoring rationale'
      ],
      outputFormat: 'JSON with model, attributes, attributeCount, weighting, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'attributeCount', 'artifacts'],
      properties: {
        model: { type: 'object' },
        attributes: { type: 'array', items: { type: 'object' } },
        attributeCount: { type: 'number' },
        weighting: { type: 'object' },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'demographic', 'firmographic']
}));

export const behavioralScoringTask = defineTask('behavioral-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define behavioral scoring criteria',
  agent: {
    name: 'behavioral-analyst',
    prompt: {
      role: 'behavioral scoring specialist',
      task: 'Define behavioral scoring criteria based on engagement signals',
      context: args,
      instructions: [
        'Define website visit scoring',
        'Set content download scoring',
        'Define email engagement scoring',
        'Set event attendance scoring',
        'Define demo request scoring',
        'Set pricing page visit scoring',
        'Create engagement decay rules',
        'Document behavioral model'
      ],
      outputFormat: 'JSON with model, signals, signalCount, decayRules, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'signalCount', 'artifacts'],
      properties: {
        model: { type: 'object' },
        signals: { type: 'array', items: { type: 'object' } },
        signalCount: { type: 'number' },
        decayRules: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'behavioral', 'engagement']
}));

export const pointAssignmentTask = defineTask('point-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign point values to attributes and behaviors',
  agent: {
    name: 'scoring-designer',
    prompt: {
      role: 'lead scoring designer',
      task: 'Assign point values to all scoring attributes and behaviors',
      context: args,
      instructions: [
        'Assign demographic attribute points',
        'Assign behavioral signal points',
        'Weight by conversion impact',
        'Balance demographic vs behavioral scoring',
        'Create scoring matrix',
        'Test point distribution',
        'Document point assignments',
        'Create scoring guide'
      ],
      outputFormat: 'JSON with pointAssignments, scoringMatrix, distribution, guide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pointAssignments', 'artifacts'],
      properties: {
        pointAssignments: { type: 'object' },
        scoringMatrix: { type: 'object' },
        distribution: { type: 'object' },
        guide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'points', 'assignment']
}));

export const thresholdSettingTask = defineTask('threshold-setting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set scoring thresholds for MQL/SQL',
  agent: {
    name: 'threshold-specialist',
    prompt: {
      role: 'lead qualification specialist',
      task: 'Set scoring thresholds for MQL and SQL qualification',
      context: args,
      instructions: [
        'Analyze historical conversion data',
        'Set MQL threshold',
        'Set SQL threshold',
        'Define qualification criteria',
        'Create threshold documentation',
        'Plan threshold testing',
        'Set alert thresholds',
        'Document threshold rationale'
      ],
      outputFormat: 'JSON with mqlThreshold, sqlThreshold, mqlCriteria, sqlCriteria, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mqlThreshold', 'sqlThreshold', 'mqlCriteria', 'artifacts'],
      properties: {
        mqlThreshold: { type: 'number' },
        sqlThreshold: { type: 'number' },
        mqlCriteria: { type: 'object' },
        sqlCriteria: { type: 'object' },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'thresholds', 'mql', 'sql']
}));

export const modelConfigurationTask = defineTask('model-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure scoring model in platform',
  agent: {
    name: 'model-configurator',
    prompt: {
      role: 'marketing automation specialist',
      task: 'Configure lead scoring model in marketing automation platform',
      context: args,
      instructions: [
        'Set up scoring properties',
        'Configure demographic scoring rules',
        'Set up behavioral tracking',
        'Configure score calculations',
        'Set up lifecycle stage automation',
        'Configure score syncing to CRM',
        'Create model documentation',
        'Set up model backup'
      ],
      outputFormat: 'JSON with model, configuration, documentation, syncSettings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'documentation', 'artifacts'],
      properties: {
        model: { type: 'object' },
        configuration: { type: 'object' },
        documentation: { type: 'object' },
        syncSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'configuration', 'platform']
}));

export const negativeScoringTask = defineTask('negative-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement negative scoring for disqualification',
  agent: {
    name: 'negative-scoring-specialist',
    prompt: {
      role: 'lead disqualification specialist',
      task: 'Implement negative scoring rules for lead disqualification',
      context: args,
      instructions: [
        'Define competitor indicators',
        'Set student/educational rules',
        'Define job seeker indicators',
        'Set inactivity decay rules',
        'Define unsubscribe impact',
        'Set spam indicator rules',
        'Create disqualification thresholds',
        'Document negative scoring'
      ],
      outputFormat: 'JSON with rules, disqualificationCriteria, decayRules, thresholds, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'artifacts'],
      properties: {
        rules: { type: 'array', items: { type: 'object' } },
        disqualificationCriteria: { type: 'array', items: { type: 'object' } },
        decayRules: { type: 'object' },
        thresholds: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'negative-scoring', 'disqualification']
}));

export const scoringTestingTask = defineTask('scoring-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test scoring accuracy with historical data',
  agent: {
    name: 'scoring-tester',
    prompt: {
      role: 'lead scoring QA specialist',
      task: 'Test lead scoring model accuracy against historical data',
      context: args,
      instructions: [
        'Select test dataset',
        'Apply scoring model to historical leads',
        'Compare scores to actual outcomes',
        'Calculate accuracy metrics',
        'Identify model gaps',
        'Test edge cases',
        'Document test results',
        'Make adjustment recommendations'
      ],
      outputFormat: 'JSON with results, accuracyScore, metrics, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'accuracyScore', 'artifacts'],
      properties: {
        results: { type: 'object' },
        accuracyScore: { type: 'number' },
        metrics: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'testing', 'accuracy']
}));

export const launchMonitoringTask = defineTask('launch-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create launch and monitoring plan',
  agent: {
    name: 'launch-coordinator',
    prompt: {
      role: 'scoring launch coordinator',
      task: 'Create launch plan and monitoring for lead scoring',
      context: args,
      instructions: [
        'Create launch checklist',
        'Plan phased rollout',
        'Set up scoring dashboards',
        'Configure performance alerts',
        'Plan monitoring cadence',
        'Create health check procedures',
        'Document launch procedures',
        'Plan stakeholder communication'
      ],
      outputFormat: 'JSON with launchPlan, dashboards, alerts, monitoringCadence, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['launchPlan', 'dashboards', 'artifacts'],
      properties: {
        launchPlan: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'array', items: { type: 'object' } },
        monitoringCadence: { type: 'object' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'launch', 'monitoring']
}));

export const salesAlignmentTask = defineTask('sales-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align with sales on lead handoff process',
  agent: {
    name: 'sales-aligner',
    prompt: {
      role: 'sales-marketing alignment specialist',
      task: 'Align marketing and sales on lead handoff process',
      context: args,
      instructions: [
        'Define MQL handoff process',
        'Create SLA documentation',
        'Define lead routing rules',
        'Set follow-up time requirements',
        'Create feedback mechanism',
        'Define lead rejection process',
        'Plan regular alignment meetings',
        'Document alignment agreement'
      ],
      outputFormat: 'JSON with sla, handoffProcess, routingRules, feedbackMechanism, agreement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sla', 'artifacts'],
      properties: {
        sla: { type: 'object' },
        handoffProcess: { type: 'object' },
        routingRules: { type: 'array', items: { type: 'object' } },
        feedbackMechanism: { type: 'object' },
        agreement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'sales-alignment', 'sla']
}));

export const iterationFrameworkTask = defineTask('iteration-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create iteration framework based on feedback and data',
  agent: {
    name: 'iteration-specialist',
    prompt: {
      role: 'lead scoring optimization specialist',
      task: 'Create framework for ongoing scoring model iteration',
      context: args,
      instructions: [
        'Define optimization KPIs',
        'Plan review cadence',
        'Create feedback collection process',
        'Define model update triggers',
        'Plan A/B testing approach',
        'Create versioning strategy',
        'Document iteration playbook',
        'Set up continuous improvement'
      ],
      outputFormat: 'JSON with plan, kpis, reviewCadence, feedbackProcess, playbook, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        reviewCadence: { type: 'object' },
        feedbackProcess: { type: 'object' },
        playbook: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lead-scoring', 'iteration', 'optimization']
}));
