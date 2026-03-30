/**
 * @process domains/business/knowledge-management/learning-from-failure
 * @description Create safe processes for analyzing failures, near-misses, and mistakes to extract valuable lessons without blame
 * @specialization Knowledge Management
 * @category Lessons Learned Processes
 * @inputs { incident: object, contextData: object, participantList: array, outputDir: string }
 * @outputs { success: boolean, failureAnalysis: object, rootCauses: array, lessons: array, preventionMeasures: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    incident = {},
    contextData = {},
    participantList = [],
    organizationalContext = {},
    safetyPrinciples = ['no-blame', 'learning-focused', 'systemic-view'],
    outputDir = 'failure-learning-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Learning from Failure Analysis Process');

  // Phase 1: Psychological Safety Setup
  ctx.log('info', 'Phase 1: Establishing psychological safety framework');
  const safetySetup = await ctx.task(psychologicalSafetyTask, { safetyPrinciples, organizationalContext, participantList, outputDir });
  artifacts.push(...safetySetup.artifacts);

  await ctx.breakpoint({
    question: `Psychological safety framework established with ${safetySetup.safeguards.length} safeguards. Ready to proceed?`,
    title: 'Safety Framework Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { safeguards: safetySetup.safeguards.length } }
  });

  // Phase 2: Incident Documentation
  ctx.log('info', 'Phase 2: Documenting incident objectively');
  const incidentDocumentation = await ctx.task(incidentDocumentationTask, { incident, contextData, outputDir });
  artifacts.push(...incidentDocumentation.artifacts);

  // Phase 3: Timeline Reconstruction
  ctx.log('info', 'Phase 3: Reconstructing event timeline');
  const timelineReconstruction = await ctx.task(timelineReconstructionTask, { incident, contextData, outputDir });
  artifacts.push(...timelineReconstruction.artifacts);

  // Phase 4: Root Cause Analysis
  ctx.log('info', 'Phase 4: Conducting root cause analysis');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, { incidentDocumentation, timelineReconstruction, outputDir });
  artifacts.push(...rootCauseAnalysis.artifacts);

  // Phase 5: Systemic Factor Analysis
  ctx.log('info', 'Phase 5: Analyzing systemic factors');
  const systemicAnalysis = await ctx.task(systemicAnalysisTask, { rootCauseAnalysis, organizationalContext, outputDir });
  artifacts.push(...systemicAnalysis.artifacts);

  // Phase 6: Lesson Extraction
  ctx.log('info', 'Phase 6: Extracting lessons');
  const lessonExtraction = await ctx.task(lessonExtractionTask, { rootCauseAnalysis, systemicAnalysis, outputDir });
  artifacts.push(...lessonExtraction.artifacts);

  // Phase 7: Prevention Measures Development
  ctx.log('info', 'Phase 7: Developing prevention measures');
  const preventionMeasures = await ctx.task(preventionMeasuresTask, { rootCauseAnalysis, lessonExtraction, outputDir });
  artifacts.push(...preventionMeasures.artifacts);

  // Phase 8: Knowledge Sharing Plan
  ctx.log('info', 'Phase 8: Planning knowledge sharing');
  const knowledgeSharingPlan = await ctx.task(knowledgeSharingPlanTask, { lessonExtraction: lessonExtraction.lessons, safetySetup, outputDir });
  artifacts.push(...knowledgeSharingPlan.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing analysis quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { incidentDocumentation, rootCauseAnalysis, lessonExtraction, preventionMeasures, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { failureAnalysis: rootCauseAnalysis.analysis, lessons: lessonExtraction.lessons, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    failureAnalysis: rootCauseAnalysis.analysis,
    rootCauses: rootCauseAnalysis.rootCauses,
    systemicFactors: systemicAnalysis.factors,
    lessons: lessonExtraction.lessons,
    preventionMeasures: preventionMeasures.measures,
    sharingPlan: knowledgeSharingPlan.plan,
    statistics: { rootCausesIdentified: rootCauseAnalysis.rootCauses.length, lessonsExtracted: lessonExtraction.lessons.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/learning-from-failure', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const psychologicalSafetyTask = defineTask('psychological-safety', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish psychological safety',
  agent: {
    name: 'safety-facilitator',
    prompt: { role: 'psychological safety facilitator', task: 'Establish blame-free analysis environment', context: args, instructions: ['Define safety principles and ground rules', 'Create safeguards against blame', 'Save to output directory'], outputFormat: 'JSON with safeguards (array), framework (object), artifacts' },
    outputSchema: { type: 'object', required: ['safeguards', 'artifacts'], properties: { safeguards: { type: 'array' }, framework: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'safety', 'facilitation']
}));

export const incidentDocumentationTask = defineTask('incident-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document incident objectively',
  agent: {
    name: 'incident-documenter',
    prompt: { role: 'incident documentation specialist', task: 'Document incident facts objectively', context: args, instructions: ['Record facts without judgment', 'Capture context and circumstances', 'Save to output directory'], outputFormat: 'JSON with documentation (object), artifacts' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'incident', 'documentation']
}));

export const timelineReconstructionTask = defineTask('timeline-reconstruction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconstruct event timeline',
  agent: {
    name: 'timeline-analyst',
    prompt: { role: 'timeline reconstruction specialist', task: 'Reconstruct event timeline', context: args, instructions: ['Build chronological sequence', 'Identify decision points', 'Save to output directory'], outputFormat: 'JSON with timeline (array), artifacts' },
    outputSchema: { type: 'object', required: ['timeline', 'artifacts'], properties: { timeline: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'timeline', 'reconstruction']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct root cause analysis',
  agent: {
    name: 'root-cause-analyst',
    prompt: { role: 'root cause analyst', task: 'Identify root causes without blame', context: args, instructions: ['Apply 5-whys and fishbone analysis', 'Focus on systems not individuals', 'Save to output directory'], outputFormat: 'JSON with analysis (object), rootCauses (array), artifacts' },
    outputSchema: { type: 'object', required: ['analysis', 'rootCauses', 'artifacts'], properties: { analysis: { type: 'object' }, rootCauses: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'root-cause', 'analysis']
}));

export const systemicAnalysisTask = defineTask('systemic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze systemic factors',
  agent: {
    name: 'systems-analyst',
    prompt: { role: 'systems thinking analyst', task: 'Analyze systemic contributing factors', context: args, instructions: ['Identify organizational and process factors', 'Map systemic influences', 'Save to output directory'], outputFormat: 'JSON with factors (array), analysis (object), artifacts' },
    outputSchema: { type: 'object', required: ['factors', 'artifacts'], properties: { factors: { type: 'array' }, analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'systemic', 'analysis']
}));

export const lessonExtractionTask = defineTask('lesson-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract lessons',
  agent: {
    name: 'lessons-extractor',
    prompt: { role: 'lessons learned specialist', task: 'Extract actionable lessons', context: args, instructions: ['Derive learning from analysis', 'Make lessons actionable', 'Save to output directory'], outputFormat: 'JSON with lessons (array), artifacts' },
    outputSchema: { type: 'object', required: ['lessons', 'artifacts'], properties: { lessons: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'lessons', 'extraction']
}));

export const preventionMeasuresTask = defineTask('prevention-measures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop prevention measures',
  agent: {
    name: 'prevention-specialist',
    prompt: { role: 'prevention specialist', task: 'Develop prevention measures', context: args, instructions: ['Design preventive controls', 'Define early warning indicators', 'Save to output directory'], outputFormat: 'JSON with measures (array), artifacts' },
    outputSchema: { type: 'object', required: ['measures', 'artifacts'], properties: { measures: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'prevention', 'measures']
}));

export const knowledgeSharingPlanTask = defineTask('knowledge-sharing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan knowledge sharing',
  agent: {
    name: 'knowledge-sharing-planner',
    prompt: { role: 'knowledge sharing planner', task: 'Plan safe knowledge sharing', context: args, instructions: ['Design sharing that maintains safety', 'Identify appropriate audiences', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'knowledge-sharing', 'plan']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess analysis quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess failure analysis quality', context: args, instructions: ['Evaluate thoroughness and objectivity', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
    outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present findings for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
