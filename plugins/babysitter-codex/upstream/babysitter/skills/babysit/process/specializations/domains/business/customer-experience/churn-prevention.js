/**
 * @process customer-experience/churn-prevention
 * @description Proactive intervention process triggered by health score deterioration or at-risk signals to prevent customer attrition
 * @inputs { customerName: string, healthScore: object, riskSignals: array, accountHistory: object, stakeholders: array }
 * @outputs { success: boolean, riskAssessment: object, interventionPlan: object, rescuePlaybook: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerName = 'Customer',
    healthScore = {},
    riskSignals = [],
    accountHistory = {},
    stakeholders = [],
    outputDir = 'churn-prevention-output',
    urgencyLevel = 'high'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Churn Prevention Workflow for ${customerName}`);

  // ============================================================================
  // PHASE 1: RISK SIGNAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing risk signals and health deterioration');
  const riskAnalysis = await ctx.task(riskAnalysisTask, {
    customerName,
    healthScore,
    riskSignals,
    accountHistory,
    outputDir
  });

  artifacts.push(...riskAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: ROOT CAUSE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying root causes of dissatisfaction');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    customerName,
    riskAnalysis,
    accountHistory,
    healthScore,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: STAKEHOLDER MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping stakeholders and sentiment');
  const stakeholderMapping = await ctx.task(stakeholderMappingTask, {
    customerName,
    stakeholders,
    riskAnalysis,
    accountHistory,
    outputDir
  });

  artifacts.push(...stakeholderMapping.artifacts);

  // ============================================================================
  // PHASE 4: INTERVENTION STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing intervention strategy');
  const interventionStrategy = await ctx.task(interventionStrategyTask, {
    customerName,
    riskAnalysis,
    rootCauseAnalysis,
    stakeholderMapping,
    urgencyLevel,
    outputDir
  });

  artifacts.push(...interventionStrategy.artifacts);

  // ============================================================================
  // PHASE 5: RESCUE OFFER DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing rescue offers and incentives');
  const rescueOffers = await ctx.task(rescueOffersTask, {
    customerName,
    rootCauseAnalysis,
    interventionStrategy,
    accountHistory,
    outputDir
  });

  artifacts.push(...rescueOffers.artifacts);

  // ============================================================================
  // PHASE 6: COMMUNICATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating executive communication plan');
  const communicationPlan = await ctx.task(communicationPlanTask, {
    customerName,
    stakeholderMapping,
    interventionStrategy,
    rescueOffers,
    urgencyLevel,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 7: SUCCESS METRICS AND TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining success metrics and tracking');
  const successMetrics = await ctx.task(successMetricsTask, {
    customerName,
    interventionStrategy,
    rootCauseAnalysis,
    outputDir
  });

  artifacts.push(...successMetrics.artifacts);

  // ============================================================================
  // PHASE 8: INTERVENTION PLAN QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing intervention plan quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    customerName,
    riskAnalysis,
    rootCauseAnalysis,
    stakeholderMapping,
    interventionStrategy,
    rescueOffers,
    communicationPlan,
    successMetrics,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityScore = qualityAssessment.overallScore;
  const qualityMet = qualityScore >= 85;

  await ctx.breakpoint({
    question: `Churn prevention plan complete for ${customerName}. Risk level: ${riskAnalysis.riskLevel}. Quality score: ${qualityScore}/100. ${qualityMet ? 'Plan meets standards!' : 'May need refinement.'} Review and approve?`,
    title: 'Churn Prevention Plan Review',
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
        customerName,
        riskLevel: riskAnalysis.riskLevel,
        rootCauses: rootCauseAnalysis.primaryCauses?.length || 0,
        interventionActions: interventionStrategy.actions?.length || 0,
        rescueOffersCount: rescueOffers.offers?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    customerName,
    qualityScore,
    qualityMet,
    riskAssessment: {
      riskLevel: riskAnalysis.riskLevel,
      riskScore: riskAnalysis.riskScore,
      riskFactors: riskAnalysis.riskFactors
    },
    rootCauses: rootCauseAnalysis.primaryCauses,
    interventionPlan: {
      strategy: interventionStrategy.strategy,
      actions: interventionStrategy.actions,
      timeline: interventionStrategy.timeline
    },
    rescuePlaybook: {
      offers: rescueOffers.offers,
      communication: communicationPlan.schedule,
      escalation: communicationPlan.escalationPath
    },
    successMetrics: successMetrics.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/churn-prevention',
      timestamp: startTime,
      customerName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const riskAnalysisTask = defineTask('risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze risk signals and health deterioration',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'customer success risk analyst',
      task: 'Analyze all risk signals and health score trends to assess churn probability',
      context: args,
      instructions: [
        'Analyze health score trends and trajectory',
        'Evaluate each risk signal severity and recency',
        'Assess usage decline patterns and triggers',
        'Review engagement deterioration timeline',
        'Calculate composite risk score',
        'Determine risk level (critical, high, medium)',
        'Identify early warning signals that were missed',
        'Compare to churned customer patterns',
        'Generate risk analysis report'
      ],
      outputFormat: 'JSON with riskLevel, riskScore, riskFactors, trends, patterns, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskLevel', 'riskScore', 'riskFactors', 'artifacts'],
      properties: {
        riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        riskFactors: { type: 'array', items: { type: 'object' } },
        trends: { type: 'object' },
        patterns: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'churn-prevention', 'risk-analysis']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify root causes of dissatisfaction',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'customer experience analyst',
      task: 'Conduct root cause analysis to identify primary drivers of customer dissatisfaction',
      context: args,
      instructions: [
        'Analyze support ticket themes and sentiment',
        'Review NPS and CSAT verbatim feedback',
        'Identify product gaps or unmet needs',
        'Assess implementation or adoption failures',
        'Evaluate relationship and communication issues',
        'Identify competitive displacement signals',
        'Review contract and pricing concerns',
        'Prioritize root causes by impact and solvability',
        'Generate root cause analysis report'
      ],
      outputFormat: 'JSON with primaryCauses, contributingFactors, solvability, competitorThreats, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryCauses', 'artifacts'],
      properties: {
        primaryCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string' },
              solvability: { type: 'string' }
            }
          }
        },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        solvability: { type: 'object' },
        competitorThreats: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'churn-prevention', 'root-cause']
}));

export const stakeholderMappingTask = defineTask('stakeholder-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map stakeholders and sentiment',
  agent: {
    name: 'stakeholder-mapper',
    prompt: {
      role: 'account strategy specialist',
      task: 'Map key stakeholders, their sentiment, influence, and engagement status',
      context: args,
      instructions: [
        'Identify all key stakeholders and decision makers',
        'Assess each stakeholder sentiment (advocate, neutral, detractor)',
        'Map stakeholder influence and authority',
        'Identify executive sponsors and champions',
        'Assess stakeholder engagement levels',
        'Identify relationship gaps or lost contacts',
        'Map competitive relationships',
        'Prioritize stakeholder outreach',
        'Generate stakeholder map'
      ],
      outputFormat: 'JSON with stakeholderMap, sentimentAnalysis, influenceMap, priorities, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderMap', 'sentimentAnalysis', 'artifacts'],
      properties: {
        stakeholderMap: { type: 'array', items: { type: 'object' } },
        sentimentAnalysis: { type: 'object' },
        influenceMap: { type: 'object' },
        priorities: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'churn-prevention', 'stakeholders']
}));

export const interventionStrategyTask = defineTask('intervention-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop intervention strategy',
  agent: {
    name: 'intervention-strategist',
    prompt: {
      role: 'customer success strategist',
      task: 'Develop comprehensive intervention strategy to address root causes and save the account',
      context: args,
      instructions: [
        'Design intervention approach based on root causes',
        'Define immediate stabilization actions (24-48 hours)',
        'Plan short-term recovery actions (1-2 weeks)',
        'Design long-term relationship rebuilding plan',
        'Identify required internal resources and escalations',
        'Plan executive engagement strategy',
        'Define success checkpoints and decision gates',
        'Create contingency plans if initial intervention fails',
        'Generate intervention strategy document'
      ],
      outputFormat: 'JSON with strategy, actions, timeline, resources, escalations, contingencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'actions', 'timeline', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        actions: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        resources: { type: 'array', items: { type: 'object' } },
        escalations: { type: 'array', items: { type: 'object' } },
        contingencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'churn-prevention', 'strategy']
}));

export const rescueOffersTask = defineTask('rescue-offers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design rescue offers and incentives',
  agent: {
    name: 'offer-designer',
    prompt: {
      role: 'customer retention specialist',
      task: 'Design compelling rescue offers and incentives to retain the customer',
      context: args,
      instructions: [
        'Assess customer value and strategic importance',
        'Design pricing or contract modifications if appropriate',
        'Plan product enhancements or roadmap commitments',
        'Offer additional services or support levels',
        'Design training or enablement incentives',
        'Consider executive engagement offers',
        'Define offer approval requirements',
        'Calculate retention offer ROI',
        'Generate rescue offers documentation'
      ],
      outputFormat: 'JSON with offers, approvals, roi, conditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['offers', 'artifacts'],
      properties: {
        offers: { type: 'array', items: { type: 'object' } },
        approvals: { type: 'array', items: { type: 'object' } },
        roi: { type: 'object' },
        conditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'churn-prevention', 'offers']
}));

export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create executive communication plan',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'executive communication specialist',
      task: 'Create comprehensive communication plan for intervention and escalation',
      context: args,
      instructions: [
        'Design initial outreach message and approach',
        'Plan executive-to-executive communication',
        'Create stakeholder-specific messaging',
        'Define escalation communication triggers',
        'Plan follow-up cadence and touchpoints',
        'Create objection handling scripts',
        'Design win-back messaging templates',
        'Plan internal communication and updates',
        'Generate communication plan document'
      ],
      outputFormat: 'JSON with schedule, messages, escalationPath, templates, scripts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'escalationPath', 'artifacts'],
      properties: {
        schedule: { type: 'array', items: { type: 'object' } },
        messages: { type: 'array', items: { type: 'object' } },
        escalationPath: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        scripts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'churn-prevention', 'communication']
}));

export const successMetricsTask = defineTask('success-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success metrics and tracking',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'customer success metrics specialist',
      task: 'Define success metrics and tracking for intervention effectiveness',
      context: args,
      instructions: [
        'Define immediate success indicators (engagement response)',
        'Define short-term success metrics (health score improvement)',
        'Define long-term success metrics (renewal, expansion)',
        'Set tracking checkpoints and review cadence',
        'Define leading indicators of intervention success',
        'Create intervention effectiveness dashboard',
        'Plan post-intervention monitoring period',
        'Define criteria for case closure',
        'Generate metrics tracking documentation'
      ],
      outputFormat: 'JSON with metrics, checkpoints, dashboard, closureCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'checkpoints', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        checkpoints: { type: 'array', items: { type: 'object' } },
        dashboard: { type: 'object' },
        closureCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'churn-prevention', 'metrics']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess intervention plan quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'customer success quality specialist',
      task: 'Assess overall quality and effectiveness potential of the intervention plan',
      context: args,
      instructions: [
        'Evaluate risk analysis completeness (weight: 15%)',
        'Assess root cause identification accuracy (weight: 20%)',
        'Review stakeholder mapping thoroughness (weight: 15%)',
        'Evaluate intervention strategy appropriateness (weight: 25%)',
        'Assess rescue offers value and feasibility (weight: 15%)',
        'Review communication plan effectiveness (weight: 10%)',
        'Calculate overall quality score',
        'Identify gaps and improvements',
        'Generate quality assessment report'
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
  labels: ['agent', 'churn-prevention', 'quality-assessment']
}));
