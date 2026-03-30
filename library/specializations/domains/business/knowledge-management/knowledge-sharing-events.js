/**
 * @process domains/business/knowledge-management/knowledge-sharing-events
 * @description Plan and facilitate knowledge sharing events including brown bags, lunch-and-learns, knowledge fairs, and expert panels to disseminate knowledge
 * @specialization Knowledge Management
 * @category Knowledge Sharing and Transfer
 * @inputs { eventType: string, topic: string, targetAudience: object, speakers: array, outputDir: string }
 * @outputs { success: boolean, eventPlan: object, materials: array, evaluationResults: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    eventType = 'brown-bag',
    topic = '',
    targetAudience = {},
    speakers = [],
    eventGoals = [],
    format = { duration: '60 minutes', mode: 'hybrid' },
    logisticsRequirements = {},
    outputDir = 'knowledge-event-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Sharing Event Facilitation Process');

  // Phase 1: Event Planning
  ctx.log('info', 'Phase 1: Planning knowledge sharing event');
  const eventPlanning = await ctx.task(eventPlanningTask, { eventType, topic, targetAudience, speakers, eventGoals, format, outputDir });
  artifacts.push(...eventPlanning.artifacts);

  await ctx.breakpoint({
    question: `Event plan created for "${topic}" ${eventType}. Review plan?`,
    title: 'Event Plan Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { eventType, topic, estimatedAttendees: eventPlanning.estimatedAttendees } }
  });

  // Phase 2: Content Development
  ctx.log('info', 'Phase 2: Developing event content');
  const contentDevelopment = await ctx.task(contentDevelopmentTask, { eventPlan: eventPlanning.plan, speakers, topic, outputDir });
  artifacts.push(...contentDevelopment.artifacts);

  // Phase 3: Speaker Preparation
  ctx.log('info', 'Phase 3: Preparing speakers');
  const speakerPreparation = await ctx.task(speakerPreparationTask, { speakers, content: contentDevelopment.content, format, outputDir });
  artifacts.push(...speakerPreparation.artifacts);

  // Phase 4: Logistics Coordination
  ctx.log('info', 'Phase 4: Coordinating logistics');
  const logisticsCoordination = await ctx.task(logisticsCoordinationTask, { eventPlan: eventPlanning.plan, format, logisticsRequirements, outputDir });
  artifacts.push(...logisticsCoordination.artifacts);

  // Phase 5: Promotion and Communication
  ctx.log('info', 'Phase 5: Promoting event');
  const promotion = await ctx.task(promotionTask, { eventPlan: eventPlanning.plan, targetAudience, topic, outputDir });
  artifacts.push(...promotion.artifacts);

  // Phase 6: Materials Preparation
  ctx.log('info', 'Phase 6: Preparing event materials');
  const materialPreparation = await ctx.task(materialPreparationTask, { content: contentDevelopment.content, format, outputDir });
  artifacts.push(...materialPreparation.artifacts);

  // Phase 7: Facilitation Guide
  ctx.log('info', 'Phase 7: Creating facilitation guide');
  const facilitationGuide = await ctx.task(facilitationGuideTask, { eventPlan: eventPlanning.plan, content: contentDevelopment.content, speakers, outputDir });
  artifacts.push(...facilitationGuide.artifacts);

  // Phase 8: Evaluation Design
  ctx.log('info', 'Phase 8: Designing evaluation');
  const evaluationDesign = await ctx.task(evaluationDesignTask, { eventGoals, format, outputDir });
  artifacts.push(...evaluationDesign.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing event design quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { eventPlanning, contentDevelopment, logisticsCoordination, materialPreparation, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { eventPlan: eventPlanning.plan, materials: materialPreparation.materials, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    eventPlan: eventPlanning.plan,
    materials: materialPreparation.materials,
    facilitationGuide: facilitationGuide.guide,
    evaluationFramework: evaluationDesign.framework,
    promotion: promotion.plan,
    statistics: { materialsCreated: materialPreparation.materials.length, estimatedAttendees: eventPlanning.estimatedAttendees },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/knowledge-sharing-events', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const eventPlanningTask = defineTask('event-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan knowledge sharing event',
  agent: {
    name: 'event-planner',
    prompt: { role: 'knowledge sharing event planner', task: 'Plan comprehensive event', context: args, instructions: ['Define event objectives, format, timeline', 'Save to output directory'], outputFormat: 'JSON with plan (object), estimatedAttendees (number), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, estimatedAttendees: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'event', 'planning']
}));

export const contentDevelopmentTask = defineTask('content-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop event content',
  agent: {
    name: 'content-developer',
    prompt: { role: 'content developer', task: 'Develop presentation content', context: args, instructions: ['Create content outline and key messages', 'Save to output directory'], outputFormat: 'JSON with content (object), artifacts' },
    outputSchema: { type: 'object', required: ['content', 'artifacts'], properties: { content: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'content', 'development']
}));

export const speakerPreparationTask = defineTask('speaker-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare speakers',
  agent: {
    name: 'speaker-coordinator',
    prompt: { role: 'speaker coordinator', task: 'Prepare speakers for event', context: args, instructions: ['Brief speakers and provide materials', 'Save to output directory'], outputFormat: 'JSON with preparation (object), artifacts' },
    outputSchema: { type: 'object', required: ['preparation', 'artifacts'], properties: { preparation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'speakers', 'preparation']
}));

export const logisticsCoordinationTask = defineTask('logistics-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate logistics',
  agent: {
    name: 'logistics-coordinator',
    prompt: { role: 'logistics coordinator', task: 'Coordinate event logistics', context: args, instructions: ['Arrange venue, technology, catering', 'Save to output directory'], outputFormat: 'JSON with logistics (object), artifacts' },
    outputSchema: { type: 'object', required: ['logistics', 'artifacts'], properties: { logistics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'logistics', 'coordination']
}));

export const promotionTask = defineTask('promotion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Promote event',
  agent: {
    name: 'promotion-specialist',
    prompt: { role: 'event promotion specialist', task: 'Create promotion plan', context: args, instructions: ['Develop communications and registration', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'promotion', 'communication']
}));

export const materialPreparationTask = defineTask('material-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare event materials',
  agent: {
    name: 'materials-specialist',
    prompt: { role: 'materials specialist', task: 'Prepare all event materials', context: args, instructions: ['Create presentations, handouts, resources', 'Save to output directory'], outputFormat: 'JSON with materials (array), artifacts' },
    outputSchema: { type: 'object', required: ['materials', 'artifacts'], properties: { materials: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'materials', 'preparation']
}));

export const facilitationGuideTask = defineTask('facilitation-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create facilitation guide',
  agent: {
    name: 'facilitator',
    prompt: { role: 'event facilitator', task: 'Create facilitation guide', context: args, instructions: ['Design run-of-show and facilitation notes', 'Save to output directory'], outputFormat: 'JSON with guide (object), artifacts' },
    outputSchema: { type: 'object', required: ['guide', 'artifacts'], properties: { guide: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'facilitation', 'guide']
}));

export const evaluationDesignTask = defineTask('evaluation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design evaluation',
  agent: {
    name: 'evaluation-designer',
    prompt: { role: 'evaluation designer', task: 'Design event evaluation', context: args, instructions: ['Create feedback surveys and success metrics', 'Save to output directory'], outputFormat: 'JSON with framework (object), artifacts' },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'evaluation', 'design']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess event design quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Evaluate event design quality', context: args, instructions: ['Assess completeness and quality', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present event plan for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
