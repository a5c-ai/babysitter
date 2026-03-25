/**
 * @process marketing/voice-of-customer-program
 * @description Systematically collect, analyze, and act on customer feedback through surveys, interviews, reviews, and social listening.
 * @inputs { feedbackSources: array, existingProgram: object, businessGoals: object, customerSegments: array }
 * @outputs { success: boolean, vocProgram: object, feedbackChannels: array, analysisFramework: object, actionPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    feedbackSources = [],
    existingProgram = {},
    businessGoals = {},
    customerSegments = [],
    outputDir = 'voc-program-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Voice of Customer Program');

  const programDesign = await ctx.task(vocProgramDesignTask, { existingProgram, businessGoals, customerSegments, outputDir });
  artifacts.push(...programDesign.artifacts);

  const feedbackChannels = await ctx.task(feedbackChannelDesignTask, { feedbackSources, programDesign, customerSegments, outputDir });
  artifacts.push(...feedbackChannels.artifacts);

  const surveyDesign = await ctx.task(vocSurveyDesignTask, { programDesign, customerSegments, outputDir });
  artifacts.push(...surveyDesign.artifacts);

  const interviewProgram = await ctx.task(customerInterviewProgramTask, { programDesign, customerSegments, outputDir });
  artifacts.push(...interviewProgram.artifacts);

  const socialListening = await ctx.task(socialListeningSetupTask, { programDesign, feedbackSources, outputDir });
  artifacts.push(...socialListening.artifacts);

  const analysisFramework = await ctx.task(vocAnalysisFrameworkTask, { feedbackChannels, programDesign, outputDir });
  artifacts.push(...analysisFramework.artifacts);

  const actionFramework = await ctx.task(vocActionFrameworkTask, { analysisFramework, businessGoals, outputDir });
  artifacts.push(...actionFramework.artifacts);

  const reportingDashboard = await ctx.task(vocReportingDashboardTask, { analysisFramework, businessGoals, outputDir });
  artifacts.push(...reportingDashboard.artifacts);

  const qualityAssessment = await ctx.task(vocProgramQualityTask, { programDesign, feedbackChannels, analysisFramework, actionFramework, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const programScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `VoC program complete. Quality score: ${programScore}/100. Review and approve?`,
    title: 'VoC Program Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    programScore,
    vocProgram: programDesign.program,
    feedbackChannels: feedbackChannels.channels,
    analysisFramework: analysisFramework.framework,
    actionPlan: actionFramework.plan,
    reportingDashboard: reportingDashboard.dashboard,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/voice-of-customer-program', timestamp: startTime, outputDir }
  };
}

export const vocProgramDesignTask = defineTask('voc-program-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design VoC program',
  agent: {
    name: 'voc-designer',
    prompt: {
      role: 'Customer insights program manager',
      task: 'Design comprehensive Voice of Customer program',
      context: args,
      instructions: ['Define program objectives', 'Design program structure', 'Define governance', 'Plan resources', 'Create implementation roadmap']
    },
    outputSchema: { type: 'object', required: ['program', 'structure', 'artifacts'], properties: { program: { type: 'object' }, structure: { type: 'object' }, governance: { type: 'object' }, roadmap: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'program-design']
}));

export const feedbackChannelDesignTask = defineTask('feedback-channel-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feedback channels',
  agent: {
    name: 'channel-designer',
    prompt: {
      role: 'Customer feedback specialist',
      task: 'Design comprehensive feedback collection channels',
      context: args,
      instructions: ['Map feedback touchpoints', 'Design collection methods', 'Define channel integration', 'Plan collection frequency', 'Create channel specifications']
    },
    outputSchema: { type: 'object', required: ['channels', 'touchpoints', 'artifacts'], properties: { channels: { type: 'array' }, touchpoints: { type: 'array' }, integration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'channels']
}));

export const vocSurveyDesignTask = defineTask('voc-survey-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design VoC surveys',
  agent: {
    name: 'survey-designer',
    prompt: {
      role: 'Survey methodology specialist',
      task: 'Design customer feedback surveys',
      context: args,
      instructions: ['Design NPS surveys', 'Design CSAT surveys', 'Create CES surveys', 'Design open-ended surveys', 'Plan survey timing']
    },
    outputSchema: { type: 'object', required: ['surveys', 'methodology', 'artifacts'], properties: { surveys: { type: 'array' }, methodology: { type: 'object' }, timing: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'surveys']
}));

export const customerInterviewProgramTask = defineTask('customer-interview-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design interview program',
  agent: {
    name: 'interview-designer',
    prompt: {
      role: 'Qualitative research specialist',
      task: 'Design customer interview program',
      context: args,
      instructions: ['Define interview objectives', 'Create interview guide', 'Plan recruitment', 'Define analysis approach', 'Create documentation templates']
    },
    outputSchema: { type: 'object', required: ['program', 'guide', 'artifacts'], properties: { program: { type: 'object' }, guide: { type: 'object' }, recruitment: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'interviews']
}));

export const socialListeningSetupTask = defineTask('social-listening-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up social listening',
  agent: {
    name: 'social-listener',
    prompt: {
      role: 'Social listening specialist',
      task: 'Set up social listening and review monitoring',
      context: args,
      instructions: ['Define listening keywords', 'Select monitoring tools', 'Plan alert setup', 'Define sentiment analysis', 'Create response protocols']
    },
    outputSchema: { type: 'object', required: ['setup', 'keywords', 'artifacts'], properties: { setup: { type: 'object' }, keywords: { type: 'array' }, tools: { type: 'array' }, protocols: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'social-listening']
}));

export const vocAnalysisFrameworkTask = defineTask('voc-analysis-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create analysis framework',
  agent: {
    name: 'analysis-designer',
    prompt: {
      role: 'Customer analytics specialist',
      task: 'Create VoC analysis framework',
      context: args,
      instructions: ['Define analysis methodology', 'Create categorization scheme', 'Plan sentiment analysis', 'Define trend analysis', 'Create reporting framework']
    },
    outputSchema: { type: 'object', required: ['framework', 'methodology', 'artifacts'], properties: { framework: { type: 'object' }, methodology: { type: 'object' }, categorization: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'analysis']
}));

export const vocActionFrameworkTask = defineTask('voc-action-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create action framework',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'Customer experience manager',
      task: 'Create framework for acting on VoC insights',
      context: args,
      instructions: ['Define action triggers', 'Create escalation paths', 'Plan closed-loop feedback', 'Define improvement process', 'Create accountability matrix']
    },
    outputSchema: { type: 'object', required: ['plan', 'triggers', 'artifacts'], properties: { plan: { type: 'object' }, triggers: { type: 'array' }, escalation: { type: 'object' }, closedLoop: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'action']
}));

export const vocReportingDashboardTask = defineTask('voc-reporting-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design reporting dashboard',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'Analytics dashboard specialist',
      task: 'Design VoC reporting dashboard',
      context: args,
      instructions: ['Define key metrics', 'Design dashboard layout', 'Plan data visualization', 'Define reporting cadence', 'Create stakeholder views']
    },
    outputSchema: { type: 'object', required: ['dashboard', 'metrics', 'artifacts'], properties: { dashboard: { type: 'object' }, metrics: { type: 'array' }, visualizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'dashboard']
}));

export const vocProgramQualityTask = defineTask('voc-program-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess program quality',
  agent: {
    name: 'voc-validator',
    prompt: {
      role: 'Customer insights director',
      task: 'Assess overall VoC program quality',
      context: args,
      instructions: ['Evaluate program design', 'Assess channel coverage', 'Review analysis framework', 'Assess action framework', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'voc', 'quality-assessment']
}));
