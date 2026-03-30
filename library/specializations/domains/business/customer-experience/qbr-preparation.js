/**
 * @process customer-experience/qbr-preparation
 * @description Structured process for preparing and conducting executive business reviews demonstrating value delivered and planning future success
 * @inputs { customerName: string, accountData: object, stakeholders: array, reviewPeriod: object, previousQBR: object }
 * @outputs { success: boolean, qbrDocument: object, presentation: object, valueReport: object, actionPlan: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerName = 'Customer',
    accountData = {},
    stakeholders = [],
    reviewPeriod = {},
    previousQBR = {},
    outputDir = 'qbr-output',
    objectives = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting QBR Preparation for ${customerName}`);

  // ============================================================================
  // PHASE 1: DATA COLLECTION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting and analyzing account data');
  const dataAnalysis = await ctx.task(dataAnalysisTask, {
    customerName,
    accountData,
    reviewPeriod,
    previousQBR,
    outputDir
  });

  artifacts.push(...dataAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: VALUE DELIVERED ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing value delivered during period');
  const valueAssessment = await ctx.task(valueAssessmentTask, {
    customerName,
    dataAnalysis,
    accountData,
    objectives,
    outputDir
  });

  artifacts.push(...valueAssessment.artifacts);

  // ============================================================================
  // PHASE 3: ROI AND BUSINESS IMPACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Calculating ROI and business impact');
  const roiAnalysis = await ctx.task(roiAnalysisTask, {
    customerName,
    valueAssessment,
    accountData,
    outputDir
  });

  artifacts.push(...roiAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: SUCCESS STORY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing success stories and highlights');
  const successStories = await ctx.task(successStoriesTask, {
    customerName,
    valueAssessment,
    roiAnalysis,
    reviewPeriod,
    outputDir
  });

  artifacts.push(...successStories.artifacts);

  // ============================================================================
  // PHASE 5: FUTURE PLANNING AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing future plans and recommendations');
  const futurePlanning = await ctx.task(futurePlanningTask, {
    customerName,
    dataAnalysis,
    valueAssessment,
    accountData,
    objectives,
    outputDir
  });

  artifacts.push(...futurePlanning.artifacts);

  // ============================================================================
  // PHASE 6: PRESENTATION CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating QBR presentation');
  const presentation = await ctx.task(presentationCreationTask, {
    customerName,
    dataAnalysis,
    valueAssessment,
    roiAnalysis,
    successStories,
    futurePlanning,
    stakeholders,
    outputDir
  });

  artifacts.push(...presentation.artifacts);

  // ============================================================================
  // PHASE 7: QBR QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing QBR preparation quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    customerName,
    dataAnalysis,
    valueAssessment,
    roiAnalysis,
    successStories,
    futurePlanning,
    presentation,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityScore = qualityAssessment.overallScore;
  const qualityMet = qualityScore >= 85;

  await ctx.breakpoint({
    question: `QBR preparation complete for ${customerName}. Quality score: ${qualityScore}/100. ${qualityMet ? 'QBR meets quality standards!' : 'May need refinement.'} Review and approve?`,
    title: 'QBR Preparation Review',
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
        valueDelivered: valueAssessment.totalValueDelivered,
        roiCalculated: roiAnalysis.roi,
        successStoriesCount: successStories.stories?.length || 0,
        recommendationsCount: futurePlanning.recommendations?.length || 0
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
    qbrDocument: {
      executiveSummary: presentation.executiveSummary,
      dataAnalysis: dataAnalysis.summary,
      valueDelivered: valueAssessment.valueItems
    },
    presentation: presentation.slides,
    valueReport: {
      valueItems: valueAssessment.valueItems,
      totalValueDelivered: valueAssessment.totalValueDelivered,
      roi: roiAnalysis.roi,
      businessImpact: roiAnalysis.businessImpact
    },
    successStories: successStories.stories,
    actionPlan: futurePlanning.actionPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/qbr-preparation',
      timestamp: startTime,
      customerName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dataAnalysisTask = defineTask('data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and analyze account data',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'customer success analyst',
      task: 'Collect and analyze all relevant account data for QBR preparation',
      context: args,
      instructions: [
        'Gather usage metrics and trends for the review period',
        'Collect adoption data (feature usage, user activation)',
        'Analyze support ticket trends and satisfaction scores',
        'Review health score trends and changes',
        'Compare current period to previous periods',
        'Identify significant changes and anomalies',
        'Gather stakeholder engagement data',
        'Compile product feedback and feature requests',
        'Generate data analysis report'
      ],
      outputFormat: 'JSON with summary, usageMetrics, adoptionData, supportData, healthTrends, comparisons, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'usageMetrics', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        usageMetrics: { type: 'object' },
        adoptionData: { type: 'object' },
        supportData: { type: 'object' },
        healthTrends: { type: 'object' },
        comparisons: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qbr', 'data-analysis']
}));

export const valueAssessmentTask = defineTask('value-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess value delivered during period',
  agent: {
    name: 'value-analyst',
    prompt: {
      role: 'customer success value specialist',
      task: 'Assess and quantify value delivered to customer during the review period',
      context: args,
      instructions: [
        'Identify key value moments and achievements',
        'Quantify time savings and efficiency gains',
        'Document cost reductions and optimizations',
        'Measure revenue impact and business outcomes',
        'Track goal progress against customer objectives',
        'Document new capabilities enabled',
        'Assess user productivity improvements',
        'Compare expected vs actual value delivery',
        'Generate value assessment report'
      ],
      outputFormat: 'JSON with valueItems, totalValueDelivered, goalProgress, efficiencyGains, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valueItems', 'totalValueDelivered', 'artifacts'],
      properties: {
        valueItems: { type: 'array', items: { type: 'object' } },
        totalValueDelivered: { type: 'string' },
        goalProgress: { type: 'object' },
        efficiencyGains: { type: 'object' },
        newCapabilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qbr', 'value-assessment']
}));

export const roiAnalysisTask = defineTask('roi-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate ROI and business impact',
  agent: {
    name: 'roi-analyst',
    prompt: {
      role: 'business value analyst',
      task: 'Calculate return on investment and quantify business impact',
      context: args,
      instructions: [
        'Calculate total cost of ownership',
        'Quantify direct financial benefits',
        'Calculate indirect benefits (productivity, risk reduction)',
        'Compute ROI percentage and payback period',
        'Document cost avoidance achievements',
        'Create business impact dashboard data',
        'Compare ROI to industry benchmarks',
        'Project future ROI with expansion',
        'Generate ROI analysis report'
      ],
      outputFormat: 'JSON with roi, paybackPeriod, totalBenefits, businessImpact, projections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roi', 'businessImpact', 'artifacts'],
      properties: {
        roi: { type: 'string' },
        paybackPeriod: { type: 'string' },
        totalBenefits: { type: 'object' },
        businessImpact: { type: 'object' },
        projections: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qbr', 'roi-analysis']
}));

export const successStoriesTask = defineTask('success-stories', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop success stories and highlights',
  agent: {
    name: 'story-developer',
    prompt: {
      role: 'customer success marketing specialist',
      task: 'Develop compelling success stories and highlight achievements from the review period',
      context: args,
      instructions: [
        'Identify top 3-5 success moments from the period',
        'Create narrative around each success story',
        'Include quantitative metrics and outcomes',
        'Document challenges overcome',
        'Highlight team collaboration wins',
        'Create visual timeline of achievements',
        'Develop quotable sound bites for executives',
        'Prepare case study potential assessment',
        'Generate success stories document'
      ],
      outputFormat: 'JSON with stories, highlights, timeline, quotes, caseStudyPotential, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stories', 'highlights', 'artifacts'],
      properties: {
        stories: { type: 'array', items: { type: 'object' } },
        highlights: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'array', items: { type: 'object' } },
        quotes: { type: 'array', items: { type: 'string' } },
        caseStudyPotential: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qbr', 'success-stories']
}));

export const futurePlanningTask = defineTask('future-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop future plans and recommendations',
  agent: {
    name: 'planning-strategist',
    prompt: {
      role: 'customer success strategist',
      task: 'Develop future plans, recommendations, and growth roadmap for the next period',
      context: args,
      instructions: [
        'Identify opportunities for deeper adoption',
        'Recommend features for expansion',
        'Plan training and enablement needs',
        'Define goals for next quarter',
        'Identify risk areas requiring attention',
        'Propose success milestones',
        'Plan stakeholder engagement strategy',
        'Create action items with owners and dates',
        'Generate future planning document'
      ],
      outputFormat: 'JSON with recommendations, goals, actionPlan, expansionOpportunities, riskMitigation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'goals', 'actionPlan', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        goals: { type: 'array', items: { type: 'object' } },
        actionPlan: { type: 'array', items: { type: 'object' } },
        expansionOpportunities: { type: 'array', items: { type: 'object' } },
        riskMitigation: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qbr', 'planning']
}));

export const presentationCreationTask = defineTask('presentation-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create QBR presentation',
  agent: {
    name: 'presentation-designer',
    prompt: {
      role: 'executive presentation specialist',
      task: 'Create executive-ready QBR presentation deck with compelling visuals and narrative',
      context: args,
      instructions: [
        'Create executive summary slide with key metrics',
        'Design value delivered section with visualizations',
        'Include ROI and business impact slides',
        'Feature success stories with compelling narratives',
        'Present adoption and usage trends visually',
        'Include health score and relationship status',
        'Present future roadmap and recommendations',
        'Create appendix with detailed data',
        'Design action items and next steps slide',
        'Generate presentation document'
      ],
      outputFormat: 'JSON with slides, executiveSummary, visualizations, talkingPoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['slides', 'executiveSummary', 'artifacts'],
      properties: {
        slides: { type: 'array', items: { type: 'object' } },
        executiveSummary: { type: 'string' },
        visualizations: { type: 'array', items: { type: 'object' } },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qbr', 'presentation']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess QBR preparation quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'customer success quality specialist',
      task: 'Assess overall quality and completeness of QBR preparation',
      context: args,
      instructions: [
        'Evaluate data analysis completeness (weight: 15%)',
        'Assess value documentation quality (weight: 25%)',
        'Review ROI calculations accuracy (weight: 20%)',
        'Evaluate success stories compelling factor (weight: 15%)',
        'Assess future planning actionability (weight: 15%)',
        'Review presentation executive-readiness (weight: 10%)',
        'Calculate overall quality score',
        'Identify gaps and improvements needed',
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
  labels: ['agent', 'qbr', 'quality-assessment']
}));
