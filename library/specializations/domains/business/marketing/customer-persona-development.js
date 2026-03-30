/**
 * @process marketing/customer-persona-development
 * @description Create detailed buyer personas through qualitative research including goals, pain points, jobs-to-be-done, and content preferences.
 * @inputs { customerData: object, researchData: object, existingPersonas: array, businessContext: object }
 * @outputs { success: boolean, personas: array, personaDocuments: array, usageGuide: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerData = {},
    researchData = {},
    existingPersonas = [],
    businessContext = {},
    outputDir = 'persona-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Customer Persona Development');

  const researchSynthesis = await ctx.task(personaResearchSynthesisTask, { customerData, researchData, existingPersonas, outputDir });
  artifacts.push(...researchSynthesis.artifacts);

  const personaIdentification = await ctx.task(personaIdentificationTask, { researchSynthesis, businessContext, outputDir });
  artifacts.push(...personaIdentification.artifacts);

  const demographicProfiles = await ctx.task(personaDemographicsTask, { personaIdentification, customerData, outputDir });
  artifacts.push(...demographicProfiles.artifacts);

  const goalsMotivations = await ctx.task(personaGoalsTask, { personaIdentification, researchSynthesis, outputDir });
  artifacts.push(...goalsMotivations.artifacts);

  const painPointsAnalysis = await ctx.task(personaPainPointsTask, { personaIdentification, researchSynthesis, outputDir });
  artifacts.push(...painPointsAnalysis.artifacts);

  const jtbdAnalysis = await ctx.task(jobsToBeDonetask, { personaIdentification, goalsMotivations, painPointsAnalysis, outputDir });
  artifacts.push(...jtbdAnalysis.artifacts);

  const contentPreferences = await ctx.task(contentPreferencesTask, { personaIdentification, researchSynthesis, outputDir });
  artifacts.push(...contentPreferences.artifacts);

  const personaDocumentation = await ctx.task(personaDocumentationTask, { personaIdentification, demographicProfiles, goalsMotivations, painPointsAnalysis, jtbdAnalysis, contentPreferences, outputDir });
  artifacts.push(...personaDocumentation.artifacts);

  const qualityAssessment = await ctx.task(personaQualityTask, { personaDocumentation, businessContext, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const personaScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Persona development complete. Quality score: ${personaScore}/100. Review and approve?`,
    title: 'Persona Development Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    personaScore,
    personas: personaDocumentation.personas,
    personaDocuments: personaDocumentation.documents,
    usageGuide: personaDocumentation.usageGuide,
    jtbdFramework: jtbdAnalysis.framework,
    contentPreferences: contentPreferences.preferences,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/customer-persona-development', timestamp: startTime, outputDir }
  };
}

export const personaResearchSynthesisTask = defineTask('persona-research-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize persona research',
  agent: {
    name: 'research-synthesizer',
    prompt: {
      role: 'Market research analyst',
      task: 'Synthesize research data for persona development',
      context: args,
      instructions: ['Consolidate qualitative research', 'Analyze quantitative data', 'Identify customer patterns', 'Extract key insights', 'Document research findings']
    },
    outputSchema: { type: 'object', required: ['synthesis', 'insights', 'artifacts'], properties: { synthesis: { type: 'object' }, insights: { type: 'array' }, patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'research']
}));

export const personaIdentificationTask = defineTask('persona-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify distinct personas',
  agent: {
    name: 'persona-identifier',
    prompt: {
      role: 'Persona development specialist',
      task: 'Identify distinct customer personas',
      context: args,
      instructions: ['Cluster customers by characteristics', 'Identify distinct persona groups', 'Name personas', 'Define persona boundaries', 'Prioritize personas']
    },
    outputSchema: { type: 'object', required: ['personas', 'prioritization', 'artifacts'], properties: { personas: { type: 'array' }, prioritization: { type: 'object' }, boundaries: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'identification']
}));

export const personaDemographicsTask = defineTask('persona-demographics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define persona demographics',
  agent: {
    name: 'demographic-profiler',
    prompt: {
      role: 'Customer profiling specialist',
      task: 'Define demographic profiles for each persona',
      context: args,
      instructions: ['Define age range', 'Define occupation and role', 'Define income and education', 'Define location patterns', 'Create demographic summary']
    },
    outputSchema: { type: 'object', required: ['profiles', 'demographics', 'artifacts'], properties: { profiles: { type: 'array' }, demographics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'demographics']
}));

export const personaGoalsTask = defineTask('persona-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define persona goals',
  agent: {
    name: 'goals-analyst',
    prompt: {
      role: 'Customer motivation specialist',
      task: 'Define goals and motivations for each persona',
      context: args,
      instructions: ['Identify primary goals', 'Identify secondary goals', 'Understand motivations', 'Define success criteria', 'Map goals to solutions']
    },
    outputSchema: { type: 'object', required: ['goals', 'motivations', 'artifacts'], properties: { goals: { type: 'array' }, motivations: { type: 'object' }, success: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'goals']
}));

export const personaPainPointsTask = defineTask('persona-pain-points', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify persona pain points',
  agent: {
    name: 'pain-point-analyst',
    prompt: {
      role: 'Customer experience analyst',
      task: 'Identify pain points and frustrations for each persona',
      context: args,
      instructions: ['Identify primary frustrations', 'Understand blockers', 'Map pain point severity', 'Link pain points to solutions', 'Prioritize pain points']
    },
    outputSchema: { type: 'object', required: ['painPoints', 'severity', 'artifacts'], properties: { painPoints: { type: 'array' }, severity: { type: 'object' }, solutions: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'pain-points']
}));

export const jobsToBeDonetask = defineTask('jobs-to-be-done', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define jobs-to-be-done',
  agent: {
    name: 'jtbd-analyst',
    prompt: {
      role: 'Jobs-to-be-done specialist',
      task: 'Define JTBD framework for each persona',
      context: args,
      instructions: ['Identify functional jobs', 'Identify emotional jobs', 'Identify social jobs', 'Map job importance', 'Link to product value']
    },
    outputSchema: { type: 'object', required: ['framework', 'jobs', 'artifacts'], properties: { framework: { type: 'object' }, jobs: { type: 'array' }, importance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'jtbd']
}));

export const contentPreferencesTask = defineTask('content-preferences', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content preferences',
  agent: {
    name: 'content-preference-analyst',
    prompt: {
      role: 'Content strategy specialist',
      task: 'Define content preferences for each persona',
      context: args,
      instructions: ['Identify preferred formats', 'Identify preferred channels', 'Define consumption patterns', 'Identify trusted sources', 'Map content to journey']
    },
    outputSchema: { type: 'object', required: ['preferences', 'channels', 'artifacts'], properties: { preferences: { type: 'array' }, channels: { type: 'object' }, patterns: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'content']
}));

export const personaDocumentationTask = defineTask('persona-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create persona documents',
  agent: {
    name: 'persona-documentor',
    prompt: {
      role: 'Persona documentation specialist',
      task: 'Create comprehensive persona documents',
      context: args,
      instructions: ['Create persona cards', 'Write persona narratives', 'Create visual summaries', 'Develop usage guide', 'Create quick reference']
    },
    outputSchema: { type: 'object', required: ['personas', 'documents', 'usageGuide', 'artifacts'], properties: { personas: { type: 'array' }, documents: { type: 'array' }, usageGuide: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'documentation']
}));

export const personaQualityTask = defineTask('persona-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess persona quality',
  agent: {
    name: 'persona-validator',
    prompt: {
      role: 'Customer insights director',
      task: 'Assess overall persona quality',
      context: args,
      instructions: ['Evaluate research basis', 'Assess completeness', 'Review actionability', 'Assess differentiation', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'personas', 'quality-assessment']
}));
