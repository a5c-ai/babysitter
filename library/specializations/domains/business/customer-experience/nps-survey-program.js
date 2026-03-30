/**
 * @process customer-experience/nps-survey-program
 * @description End-to-end process for deploying Net Promoter Score surveys, analyzing results, and closing the feedback loop
 * @inputs { surveyConfig: object, targetAudience: array, previousResults: object, responseData: array }
 * @outputs { success: boolean, surveyDeployment: object, analysisReport: object, closedLoopActions: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    surveyConfig = {},
    targetAudience = [],
    previousResults = {},
    responseData = [],
    outputDir = 'nps-output',
    closedLoopEnabled = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting NPS Survey Program Implementation');

  // ============================================================================
  // PHASE 1: SURVEY DESIGN AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing survey and configuration');
  const surveyDesign = await ctx.task(surveyDesignTask, {
    surveyConfig,
    previousResults,
    outputDir
  });

  artifacts.push(...surveyDesign.artifacts);

  // ============================================================================
  // PHASE 2: AUDIENCE SEGMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Segmenting target audience');
  const audienceSegmentation = await ctx.task(audienceSegmentationTask, {
    targetAudience,
    surveyConfig,
    outputDir
  });

  artifacts.push(...audienceSegmentation.artifacts);

  // ============================================================================
  // PHASE 3: DEPLOYMENT PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning survey deployment');
  const deploymentPlan = await ctx.task(deploymentPlanTask, {
    surveyDesign,
    audienceSegmentation,
    surveyConfig,
    outputDir
  });

  artifacts.push(...deploymentPlan.artifacts);

  // ============================================================================
  // PHASE 4: RESPONSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing survey responses');
  const responseAnalysis = await ctx.task(responseAnalysisTask, {
    responseData,
    audienceSegmentation,
    previousResults,
    outputDir
  });

  artifacts.push(...responseAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: VERBATIM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing verbatim comments');
  const verbatimAnalysis = await ctx.task(verbatimAnalysisTask, {
    responseData,
    responseAnalysis,
    outputDir
  });

  artifacts.push(...verbatimAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: DRIVER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying NPS drivers');
  const driverAnalysis = await ctx.task(driverAnalysisTask, {
    responseAnalysis,
    verbatimAnalysis,
    outputDir
  });

  artifacts.push(...driverAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: CLOSED LOOP PLANNING
  // ============================================================================

  let closedLoopPlan = { actions: [], artifacts: [] };
  if (closedLoopEnabled) {
    ctx.log('info', 'Phase 7: Planning closed loop follow-up');
    closedLoopPlan = await ctx.task(closedLoopPlanTask, {
      responseAnalysis,
      verbatimAnalysis,
      driverAnalysis,
      outputDir
    });

    artifacts.push(...closedLoopPlan.artifacts);
  }

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating NPS report');
  const npsReport = await ctx.task(npsReportTask, {
    surveyDesign,
    responseAnalysis,
    verbatimAnalysis,
    driverAnalysis,
    closedLoopPlan,
    previousResults,
    outputDir
  });

  artifacts.push(...npsReport.artifacts);

  const npsScore = responseAnalysis.npsScore;
  const targetMet = npsScore >= (surveyConfig.targetNPS || 50);

  await ctx.breakpoint({
    question: `NPS analysis complete. NPS Score: ${npsScore}. Response rate: ${responseAnalysis.responseRate}%. ${targetMet ? 'Target met!' : 'Below target.'} Promoters: ${responseAnalysis.promoterCount}. Detractors: ${responseAnalysis.detractorCount}. Review and distribute?`,
    title: 'NPS Survey Program Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        npsScore,
        targetMet,
        responseRate: responseAnalysis.responseRate,
        totalResponses: responseAnalysis.totalResponses,
        promoters: responseAnalysis.promoterCount,
        passives: responseAnalysis.passiveCount,
        detractors: responseAnalysis.detractorCount,
        closedLoopActions: closedLoopPlan.actions?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    npsScore,
    targetMet,
    surveyDeployment: {
      design: surveyDesign.survey,
      segments: audienceSegmentation.segments,
      schedule: deploymentPlan.schedule
    },
    analysisReport: {
      npsScore: responseAnalysis.npsScore,
      responseRate: responseAnalysis.responseRate,
      distribution: responseAnalysis.distribution,
      trends: responseAnalysis.trends,
      drivers: driverAnalysis.drivers,
      verbatimThemes: verbatimAnalysis.themes
    },
    closedLoopActions: closedLoopPlan.actions,
    report: npsReport.report,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/nps-survey-program',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const surveyDesignTask = defineTask('survey-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design survey and configuration',
  agent: {
    name: 'survey-designer',
    prompt: {
      role: 'NPS survey specialist',
      task: 'Design NPS survey with optimal question flow and follow-up questions',
      context: args,
      instructions: [
        'Design core NPS question (0-10 scale)',
        'Create follow-up questions for each segment',
        'Design probing questions for detractors',
        'Design referral questions for promoters',
        'Configure survey branding and styling',
        'Set up response routing logic',
        'Define survey timing and triggers',
        'Configure reminder sequences',
        'Generate survey design documentation'
      ],
      outputFormat: 'JSON with survey, questions, routing, timing, reminders, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['survey', 'questions', 'artifacts'],
      properties: {
        survey: { type: 'object' },
        questions: { type: 'array', items: { type: 'object' } },
        routing: { type: 'object' },
        timing: { type: 'object' },
        reminders: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'nps-survey', 'design']
}));

export const audienceSegmentationTask = defineTask('audience-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Segment target audience',
  agent: {
    name: 'audience-analyst',
    prompt: {
      role: 'customer segmentation specialist',
      task: 'Segment target audience for NPS survey deployment',
      context: args,
      instructions: [
        'Segment audience by customer tier',
        'Segment by product usage patterns',
        'Segment by customer lifecycle stage',
        'Segment by relationship tenure',
        'Apply survey fatigue rules',
        'Exclude recently surveyed customers',
        'Calculate sample sizes per segment',
        'Define sampling methodology',
        'Generate audience segmentation report'
      ],
      outputFormat: 'JSON with segments, sampleSizes, exclusions, methodology, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'sampleSizes', 'artifacts'],
      properties: {
        segments: { type: 'array', items: { type: 'object' } },
        sampleSizes: { type: 'object' },
        exclusions: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'nps-survey', 'segmentation']
}));

export const deploymentPlanTask = defineTask('deployment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan survey deployment',
  agent: {
    name: 'deployment-planner',
    prompt: {
      role: 'survey deployment specialist',
      task: 'Plan survey deployment schedule and channels',
      context: args,
      instructions: [
        'Select deployment channels per segment',
        'Schedule deployment waves',
        'Configure email delivery settings',
        'Plan in-app survey triggers',
        'Set up response collection',
        'Configure real-time monitoring',
        'Plan reminder sequences',
        'Define collection close date',
        'Generate deployment plan'
      ],
      outputFormat: 'JSON with schedule, channels, waves, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'channels', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        channels: { type: 'array', items: { type: 'object' } },
        waves: { type: 'array', items: { type: 'object' } },
        monitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'nps-survey', 'deployment']
}));

export const responseAnalysisTask = defineTask('response-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze survey responses',
  agent: {
    name: 'response-analyst',
    prompt: {
      role: 'NPS analysis specialist',
      task: 'Analyze NPS survey responses and calculate metrics',
      context: args,
      instructions: [
        'Calculate NPS score (promoters - detractors %)',
        'Calculate response rate',
        'Analyze score distribution',
        'Break down NPS by segment',
        'Compare to previous periods',
        'Calculate statistical significance',
        'Identify response patterns',
        'Analyze completion rates',
        'Generate response analysis report'
      ],
      outputFormat: 'JSON with npsScore, responseRate, totalResponses, distribution, promoterCount, passiveCount, detractorCount, segmentAnalysis, trends, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['npsScore', 'responseRate', 'totalResponses', 'artifacts'],
      properties: {
        npsScore: { type: 'number', minimum: -100, maximum: 100 },
        responseRate: { type: 'number', minimum: 0, maximum: 100 },
        totalResponses: { type: 'number' },
        distribution: { type: 'object' },
        promoterCount: { type: 'number' },
        passiveCount: { type: 'number' },
        detractorCount: { type: 'number' },
        segmentAnalysis: { type: 'object' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'nps-survey', 'analysis']
}));

export const verbatimAnalysisTask = defineTask('verbatim-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze verbatim comments',
  agent: {
    name: 'verbatim-analyst',
    prompt: {
      role: 'text analytics specialist',
      task: 'Analyze verbatim comments to identify themes and sentiment',
      context: args,
      instructions: [
        'Extract themes from open-ended responses',
        'Perform sentiment analysis',
        'Categorize feedback by topic',
        'Identify key phrases and terms',
        'Analyze promoter vs detractor themes',
        'Identify product feedback patterns',
        'Extract service feedback patterns',
        'Identify competitive mentions',
        'Generate verbatim analysis report'
      ],
      outputFormat: 'JSON with themes, sentiment, categories, keyPhrases, promoterThemes, detractorThemes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'sentiment', 'artifacts'],
      properties: {
        themes: { type: 'array', items: { type: 'object' } },
        sentiment: { type: 'object' },
        categories: { type: 'object' },
        keyPhrases: { type: 'array', items: { type: 'string' } },
        promoterThemes: { type: 'array', items: { type: 'string' } },
        detractorThemes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'nps-survey', 'verbatim']
}));

export const driverAnalysisTask = defineTask('driver-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify NPS drivers',
  agent: {
    name: 'driver-analyst',
    prompt: {
      role: 'customer experience analyst',
      task: 'Identify key drivers of NPS scores',
      context: args,
      instructions: [
        'Identify factors driving promoter scores',
        'Identify factors driving detractor scores',
        'Correlate NPS with customer attributes',
        'Analyze product feature impact on NPS',
        'Analyze service quality impact on NPS',
        'Identify improvement priorities',
        'Calculate driver importance scores',
        'Model NPS improvement scenarios',
        'Generate driver analysis report'
      ],
      outputFormat: 'JSON with drivers, promoterDrivers, detractorDrivers, correlations, priorities, improvementScenarios, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['drivers', 'priorities', 'artifacts'],
      properties: {
        drivers: { type: 'array', items: { type: 'object' } },
        promoterDrivers: { type: 'array', items: { type: 'object' } },
        detractorDrivers: { type: 'array', items: { type: 'object' } },
        correlations: { type: 'object' },
        priorities: { type: 'array', items: { type: 'object' } },
        improvementScenarios: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'nps-survey', 'drivers']
}));

export const closedLoopPlanTask = defineTask('closed-loop-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan closed loop follow-up',
  agent: {
    name: 'closed-loop-planner',
    prompt: {
      role: 'customer feedback specialist',
      task: 'Plan closed loop follow-up actions for survey respondents',
      context: args,
      instructions: [
        'Prioritize detractor follow-up',
        'Design detractor recovery playbook',
        'Plan promoter recognition and referral asks',
        'Design passive conversion strategies',
        'Assign follow-up ownership',
        'Set follow-up timelines',
        'Create follow-up templates',
        'Define success metrics',
        'Generate closed loop plan'
      ],
      outputFormat: 'JSON with actions, detractorPlaybook, promoterPlaybook, passivePlaybook, assignments, templates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'artifacts'],
      properties: {
        actions: { type: 'array', items: { type: 'object' } },
        detractorPlaybook: { type: 'object' },
        promoterPlaybook: { type: 'object' },
        passivePlaybook: { type: 'object' },
        assignments: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'nps-survey', 'closed-loop']
}));

export const npsReportTask = defineTask('nps-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate NPS report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'NPS reporting specialist',
      task: 'Generate comprehensive NPS report for stakeholders',
      context: args,
      instructions: [
        'Create executive summary',
        'Present NPS score and trends',
        'Show segment breakdown',
        'Highlight key drivers',
        'Present verbatim highlights',
        'Document closed loop progress',
        'Include recommendations',
        'Create visualizations',
        'Generate comprehensive report'
      ],
      outputFormat: 'JSON with report, executiveSummary, visualizations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'executiveSummary', 'artifacts'],
      properties: {
        report: { type: 'object' },
        executiveSummary: { type: 'string' },
        visualizations: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'nps-survey', 'reporting']
}));
