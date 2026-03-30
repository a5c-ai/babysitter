/**
 * @process domains/business/knowledge-management/community-facilitation-engagement
 * @description Facilitate community activities, drive member participation, nurture discussions, and foster collaborative problem-solving among practitioners
 * @specialization Knowledge Management
 * @category Communities of Practice Management
 * @inputs { community: object, engagementGoals: array, currentState: object, outputDir: string }
 * @outputs { success: boolean, facilitationPlan: object, engagementActivities: array, participationMetrics: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    community = {},
    engagementGoals = [],
    currentState = {},
    memberProfiles = [],
    communicationChannels = [],
    outputDir = 'community-facilitation-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Community Facilitation and Engagement Process');

  // Phase 1: Community Assessment
  ctx.log('info', 'Phase 1: Assessing current community state');
  const communityAssessment = await ctx.task(communityAssessmentTask, { community, currentState, memberProfiles, outputDir });
  artifacts.push(...communityAssessment.artifacts);

  await ctx.breakpoint({
    question: `Community assessment complete with ${communityAssessment.activeMembers} active members and ${communityAssessment.engagementLevel}% engagement. Review?`,
    title: 'Community Assessment Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { activeMembers: communityAssessment.activeMembers, engagementLevel: communityAssessment.engagementLevel } }
  });

  // Phase 2: Engagement Strategy Development
  ctx.log('info', 'Phase 2: Developing engagement strategy');
  const engagementStrategy = await ctx.task(engagementStrategyTask, { communityAssessment, engagementGoals, outputDir });
  artifacts.push(...engagementStrategy.artifacts);

  // Phase 3: Activity Calendar Planning
  ctx.log('info', 'Phase 3: Planning activity calendar');
  const activityCalendar = await ctx.task(activityCalendarTask, { engagementStrategy: engagementStrategy.strategy, community, outputDir });
  artifacts.push(...activityCalendar.artifacts);

  // Phase 4: Discussion Facilitation Guide
  ctx.log('info', 'Phase 4: Creating discussion facilitation guide');
  const facilitationGuide = await ctx.task(facilitationGuideTask, { community, engagementStrategy: engagementStrategy.strategy, outputDir });
  artifacts.push(...facilitationGuide.artifacts);

  // Phase 5: Member Activation Plan
  ctx.log('info', 'Phase 5: Developing member activation plan');
  const memberActivation = await ctx.task(memberActivationTask, { communityAssessment, memberProfiles, outputDir });
  artifacts.push(...memberActivation.artifacts);

  // Phase 6: Content and Topic Planning
  ctx.log('info', 'Phase 6: Planning content and topics');
  const contentPlanning = await ctx.task(contentPlanningTask, { community, engagementGoals, outputDir });
  artifacts.push(...contentPlanning.artifacts);

  // Phase 7: Recognition and Incentive Design
  ctx.log('info', 'Phase 7: Designing recognition and incentives');
  const recognitionDesign = await ctx.task(recognitionDesignTask, { engagementStrategy: engagementStrategy.strategy, community, outputDir });
  artifacts.push(...recognitionDesign.artifacts);

  // Phase 8: Communication Plan
  ctx.log('info', 'Phase 8: Creating communication plan');
  const communicationPlan = await ctx.task(communicationPlanTask, { community, communicationChannels, activityCalendar: activityCalendar.calendar, outputDir });
  artifacts.push(...communicationPlan.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing facilitation plan quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { communityAssessment, engagementStrategy, activityCalendar, facilitationGuide, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { facilitationPlan: engagementStrategy.strategy, activities: activityCalendar.calendar, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    facilitationPlan: engagementStrategy.strategy,
    engagementActivities: activityCalendar.calendar,
    facilitationGuide: facilitationGuide.guide,
    memberActivation: memberActivation.plan,
    recognitionProgram: recognitionDesign.program,
    participationMetrics: communityAssessment.metrics,
    statistics: { activitiesPlanned: activityCalendar.calendar.length, membersCovered: memberActivation.memberCount },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/community-facilitation-engagement', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const communityAssessmentTask = defineTask('community-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess community state',
  agent: {
    name: 'community-analyst',
    prompt: { role: 'community analyst', task: 'Assess current community engagement state', context: args, instructions: ['Analyze member participation patterns', 'Identify engagement barriers', 'Save to output directory'], outputFormat: 'JSON with activeMembers (number), engagementLevel (number), metrics (object), artifacts' },
    outputSchema: { type: 'object', required: ['activeMembers', 'engagementLevel', 'artifacts'], properties: { activeMembers: { type: 'number' }, engagementLevel: { type: 'number' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'assessment']
}));

export const engagementStrategyTask = defineTask('engagement-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop engagement strategy',
  agent: {
    name: 'engagement-strategist',
    prompt: { role: 'engagement strategist', task: 'Develop community engagement strategy', context: args, instructions: ['Define engagement approaches', 'Set participation goals', 'Save to output directory'], outputFormat: 'JSON with strategy (object), artifacts' },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'engagement', 'strategy']
}));

export const activityCalendarTask = defineTask('activity-calendar', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan activity calendar',
  agent: {
    name: 'activity-planner',
    prompt: { role: 'activity planner', task: 'Plan community activity calendar', context: args, instructions: ['Schedule diverse activities', 'Balance frequency and types', 'Save to output directory'], outputFormat: 'JSON with calendar (array), artifacts' },
    outputSchema: { type: 'object', required: ['calendar', 'artifacts'], properties: { calendar: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'activities', 'calendar']
}));

export const facilitationGuideTask = defineTask('facilitation-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create facilitation guide',
  agent: {
    name: 'facilitator',
    prompt: { role: 'community facilitator', task: 'Create discussion facilitation guide', context: args, instructions: ['Define facilitation techniques', 'Create discussion prompts', 'Save to output directory'], outputFormat: 'JSON with guide (object), artifacts' },
    outputSchema: { type: 'object', required: ['guide', 'artifacts'], properties: { guide: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'facilitation', 'guide']
}));

export const memberActivationTask = defineTask('member-activation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop member activation plan',
  agent: {
    name: 'activation-specialist',
    prompt: { role: 'member activation specialist', task: 'Develop member activation plan', context: args, instructions: ['Segment members by engagement level', 'Create activation tactics', 'Save to output directory'], outputFormat: 'JSON with plan (object), memberCount (number), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, memberCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'member', 'activation']
}));

export const contentPlanningTask = defineTask('content-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan content and topics',
  agent: {
    name: 'content-planner',
    prompt: { role: 'content planner', task: 'Plan community content and topics', context: args, instructions: ['Identify relevant topics', 'Plan content mix', 'Save to output directory'], outputFormat: 'JSON with contentPlan (object), artifacts' },
    outputSchema: { type: 'object', required: ['contentPlan', 'artifacts'], properties: { contentPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'content', 'planning']
}));

export const recognitionDesignTask = defineTask('recognition-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design recognition program',
  agent: {
    name: 'recognition-designer',
    prompt: { role: 'recognition program designer', task: 'Design member recognition and incentives', context: args, instructions: ['Define recognition criteria', 'Design incentive structure', 'Save to output directory'], outputFormat: 'JSON with program (object), artifacts' },
    outputSchema: { type: 'object', required: ['program', 'artifacts'], properties: { program: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'recognition', 'design']
}));

export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create communication plan',
  agent: {
    name: 'communication-planner',
    prompt: { role: 'communication planner', task: 'Create community communication plan', context: args, instructions: ['Define communication cadence', 'Design message templates', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'communication', 'plan']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess plan quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess facilitation plan quality', context: args, instructions: ['Evaluate completeness and coherence', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present plan for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
