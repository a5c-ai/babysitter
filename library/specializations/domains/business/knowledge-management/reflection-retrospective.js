/**
 * @process domains/business/knowledge-management/reflection-retrospective
 * @description Implement regular reflection practices at individual, team, and organizational levels to support continuous learning
 * @specialization Knowledge Management
 * @category Organizational Learning Processes
 * @inputs { reflectionScope: object, participantLevel: string, timeframe: string, outputDir: string }
 * @outputs { success: boolean, reflectionFramework: object, insights: array, actionItems: array, learningOutcomes: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    reflectionScope = {},
    participantLevel = 'team', // individual, team, organizational
    timeframe = {},
    reflectionTrigger = 'periodic', // periodic, milestone, event-driven
    existingPractices = [],
    outputDir = 'reflection-retrospective-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Reflection and Retrospective Practice Process');

  // Phase 1: Reflection Framework Design
  ctx.log('info', 'Phase 1: Designing reflection framework');
  const frameworkDesign = await ctx.task(frameworkDesignTask, { reflectionScope, participantLevel, existingPractices, outputDir });
  artifacts.push(...frameworkDesign.artifacts);

  await ctx.breakpoint({
    question: `Reflection framework designed for ${participantLevel} level with ${frameworkDesign.methods.length} methods. Review?`,
    title: 'Framework Design Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { participantLevel, methods: frameworkDesign.methods.length } }
  });

  // Phase 2: Reflection Question Development
  ctx.log('info', 'Phase 2: Developing reflection questions');
  const questionDevelopment = await ctx.task(questionDevelopmentTask, { frameworkDesign: frameworkDesign.framework, participantLevel, outputDir });
  artifacts.push(...questionDevelopment.artifacts);

  // Phase 3: Facilitation Guide Creation
  ctx.log('info', 'Phase 3: Creating facilitation guide');
  const facilitationGuide = await ctx.task(facilitationGuideTask, { frameworkDesign: frameworkDesign.framework, questionDevelopment: questionDevelopment.questions, outputDir });
  artifacts.push(...facilitationGuide.artifacts);

  // Phase 4: Individual Reflection Design
  ctx.log('info', 'Phase 4: Designing individual reflection practice');
  const individualReflection = await ctx.task(individualReflectionTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...individualReflection.artifacts);

  // Phase 5: Team Retrospective Design
  ctx.log('info', 'Phase 5: Designing team retrospective process');
  const teamRetrospective = await ctx.task(teamRetrospectiveTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...teamRetrospective.artifacts);

  // Phase 6: Organizational Learning Review Design
  ctx.log('info', 'Phase 6: Designing organizational learning review');
  const organizationalReview = await ctx.task(organizationalReviewTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...organizationalReview.artifacts);

  // Phase 7: Insight Capture Mechanism
  ctx.log('info', 'Phase 7: Designing insight capture mechanism');
  const insightCapture = await ctx.task(insightCaptureTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...insightCapture.artifacts);

  // Phase 8: Action Item Tracking System
  ctx.log('info', 'Phase 8: Designing action item tracking');
  const actionTracking = await ctx.task(actionTrackingTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...actionTracking.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing reflection practice quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { frameworkDesign, facilitationGuide, insightCapture, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { reflectionFramework: frameworkDesign.framework, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    reflectionFramework: frameworkDesign.framework,
    reflectionMethods: frameworkDesign.methods,
    facilitationGuide: facilitationGuide.guide,
    practices: {
      individual: individualReflection.practice,
      team: teamRetrospective.process,
      organizational: organizationalReview.process
    },
    insightCaptureMechanism: insightCapture.mechanism,
    actionTrackingSystem: actionTracking.system,
    statistics: { methodsCreated: frameworkDesign.methods.length, questionsDesigned: questionDevelopment.questions.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/reflection-retrospective', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const frameworkDesignTask = defineTask('framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design reflection framework',
  agent: {
    name: 'reflection-designer',
    prompt: { role: 'reflection practice designer', task: 'Design reflection and retrospective framework', context: args, instructions: ['Define reflection methods', 'Create practice cadence', 'Save to output directory'], outputFormat: 'JSON with framework (object), methods (array), artifacts' },
    outputSchema: { type: 'object', required: ['framework', 'methods', 'artifacts'], properties: { framework: { type: 'object' }, methods: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'reflection', 'framework']
}));

export const questionDevelopmentTask = defineTask('question-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop reflection questions',
  agent: {
    name: 'question-developer',
    prompt: { role: 'reflection question developer', task: 'Develop reflection questions', context: args, instructions: ['Create thought-provoking questions', 'Design for different levels', 'Save to output directory'], outputFormat: 'JSON with questions (array), artifacts' },
    outputSchema: { type: 'object', required: ['questions', 'artifacts'], properties: { questions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'reflection', 'questions']
}));

export const facilitationGuideTask = defineTask('facilitation-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create facilitation guide',
  agent: {
    name: 'facilitation-designer',
    prompt: { role: 'facilitation guide designer', task: 'Create retrospective facilitation guide', context: args, instructions: ['Design facilitation process', 'Include timing and techniques', 'Save to output directory'], outputFormat: 'JSON with guide (object), artifacts' },
    outputSchema: { type: 'object', required: ['guide', 'artifacts'], properties: { guide: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'facilitation', 'guide']
}));

export const individualReflectionTask = defineTask('individual-reflection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design individual reflection practice',
  agent: {
    name: 'individual-practice-designer',
    prompt: { role: 'individual learning designer', task: 'Design individual reflection practice', context: args, instructions: ['Create personal reflection templates', 'Design journaling approach', 'Save to output directory'], outputFormat: 'JSON with practice (object), artifacts' },
    outputSchema: { type: 'object', required: ['practice', 'artifacts'], properties: { practice: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'individual', 'reflection']
}));

export const teamRetrospectiveTask = defineTask('team-retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design team retrospective process',
  agent: {
    name: 'retrospective-designer',
    prompt: { role: 'team retrospective designer', task: 'Design team retrospective process', context: args, instructions: ['Create retrospective formats', 'Design action follow-up', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'team', 'retrospective']
}));

export const organizationalReviewTask = defineTask('organizational-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design organizational learning review',
  agent: {
    name: 'org-review-designer',
    prompt: { role: 'organizational review designer', task: 'Design organizational learning review', context: args, instructions: ['Create org-level reflection process', 'Design systemic learning capture', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'organizational', 'review']
}));

export const insightCaptureTask = defineTask('insight-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design insight capture mechanism',
  agent: {
    name: 'insight-capture-designer',
    prompt: { role: 'insight capture designer', task: 'Design insight capture mechanism', context: args, instructions: ['Create insight documentation approach', 'Design aggregation method', 'Save to output directory'], outputFormat: 'JSON with mechanism (object), artifacts' },
    outputSchema: { type: 'object', required: ['mechanism', 'artifacts'], properties: { mechanism: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'insight', 'capture']
}));

export const actionTrackingTask = defineTask('action-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design action item tracking',
  agent: {
    name: 'action-tracker-designer',
    prompt: { role: 'action tracking designer', task: 'Design action item tracking system', context: args, instructions: ['Create tracking workflow', 'Design accountability mechanism', 'Save to output directory'], outputFormat: 'JSON with system (object), artifacts' },
    outputSchema: { type: 'object', required: ['system', 'artifacts'], properties: { system: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'action', 'tracking']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess practice quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess reflection practice quality', context: args, instructions: ['Evaluate design completeness', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
