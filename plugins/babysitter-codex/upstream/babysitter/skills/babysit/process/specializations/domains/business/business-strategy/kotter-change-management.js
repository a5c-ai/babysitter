/**
 * @process business-strategy/kotter-change-management
 * @description Structured approach to leading organizational change through urgency creation, coalition building, vision communication, and institutionalization
 * @inputs { changeInitiative: string, organizationContext: object, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, changePhases: object, coalitionPlan: object, communicationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    changeInitiative = '',
    organizationContext = {},
    stakeholders = [],
    outputDir = 'change-mgmt-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Kotter 8-Step Change Management Process');

  // Step 1: Create Urgency
  ctx.log('info', 'Step 1: Creating sense of urgency');
  const urgencyStep = await ctx.task(createUrgencyTask, { changeInitiative, organizationContext, outputDir });
  artifacts.push(...urgencyStep.artifacts);

  // Step 2: Build Guiding Coalition
  ctx.log('info', 'Step 2: Building guiding coalition');
  const coalitionStep = await ctx.task(buildCoalitionTask, { changeInitiative, stakeholders, outputDir });
  artifacts.push(...coalitionStep.artifacts);

  // Step 3: Form Strategic Vision
  ctx.log('info', 'Step 3: Forming strategic vision');
  const visionStep = await ctx.task(formVisionTask, { changeInitiative, urgencyStep, outputDir });
  artifacts.push(...visionStep.artifacts);

  // Step 4: Enlist Volunteer Army
  ctx.log('info', 'Step 4: Enlisting volunteer army');
  const enlistStep = await ctx.task(enlistVolunteersTask, { visionStep, coalitionStep, outputDir });
  artifacts.push(...enlistStep.artifacts);

  // Step 5: Enable Action by Removing Barriers
  ctx.log('info', 'Step 5: Enabling action by removing barriers');
  const enableStep = await ctx.task(enableActionTask, { changeInitiative, organizationContext, outputDir });
  artifacts.push(...enableStep.artifacts);

  // Step 6: Generate Short-Term Wins
  ctx.log('info', 'Step 6: Generating short-term wins');
  const winsStep = await ctx.task(generateWinsTask, { changeInitiative, enableStep, outputDir });
  artifacts.push(...winsStep.artifacts);

  // Step 7: Sustain Acceleration
  ctx.log('info', 'Step 7: Sustaining acceleration');
  const accelerationStep = await ctx.task(sustainAccelerationTask, { winsStep, visionStep, outputDir });
  artifacts.push(...accelerationStep.artifacts);

  // Step 8: Institute Change
  ctx.log('info', 'Step 8: Instituting change');
  const instituteStep = await ctx.task(instituteChangeTask, { changeInitiative, accelerationStep, organizationContext, outputDir });
  artifacts.push(...instituteStep.artifacts);

  // Generate Report
  ctx.log('info', 'Generating change management report');
  const changeReport = await ctx.task(changeReportTask, { urgencyStep, coalitionStep, visionStep, enlistStep, enableStep, winsStep, accelerationStep, instituteStep, outputDir });
  artifacts.push(...changeReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    changePhases: {
      createClimate: { urgency: urgencyStep, coalition: coalitionStep, vision: visionStep },
      engageOrganization: { enlist: enlistStep, enable: enableStep, wins: winsStep },
      implementSustain: { accelerate: accelerationStep, institute: instituteStep }
    },
    coalitionPlan: coalitionStep.plan,
    communicationPlan: visionStep.communicationPlan,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/kotter-change-management', timestamp: startTime }
  };
}

export const createUrgencyTask = defineTask('create-urgency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create sense of urgency',
  agent: {
    name: 'change-catalyst',
    prompt: {
      role: 'change management specialist',
      task: 'Create compelling sense of urgency for change',
      context: args,
      instructions: ['Identify burning platform', 'Document external threats and opportunities', 'Create compelling case for change', 'Identify complacency factors', 'Save urgency case to output directory'],
      outputFormat: 'JSON with urgencyCase (object), burningPlatform (string), complacencyFactors (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['urgencyCase', 'artifacts'], properties: { urgencyCase: { type: 'object' }, burningPlatform: { type: 'string' }, complacencyFactors: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'urgency']
}));

export const buildCoalitionTask = defineTask('build-coalition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build guiding coalition',
  agent: {
    name: 'coalition-builder',
    prompt: {
      role: 'coalition building specialist',
      task: 'Build powerful guiding coalition',
      context: args,
      instructions: ['Identify key influencers', 'Assess position, power, influence', 'Develop engagement strategy', 'Create coalition operating model', 'Save coalition plan to output directory'],
      outputFormat: 'JSON with plan (object), coalitionMembers (array), engagementStrategy (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, coalitionMembers: { type: 'array' }, engagementStrategy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'coalition']
}));

export const formVisionTask = defineTask('form-vision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Form strategic vision',
  agent: {
    name: 'vision-architect',
    prompt: {
      role: 'change vision architect',
      task: 'Create and communicate change vision',
      context: args,
      instructions: ['Craft compelling vision statement', 'Develop supporting strategies', 'Create communication plan', 'Design key messages by audience', 'Save vision to output directory'],
      outputFormat: 'JSON with vision (string), strategies (array), communicationPlan (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['vision', 'communicationPlan', 'artifacts'], properties: { vision: { type: 'string' }, strategies: { type: 'array' }, communicationPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'vision']
}));

export const enlistVolunteersTask = defineTask('enlist-volunteers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enlist volunteer army',
  agent: {
    name: 'engagement-specialist',
    prompt: {
      role: 'employee engagement specialist',
      task: 'Build volunteer army of change champions',
      context: args,
      instructions: ['Identify potential champions', 'Create champion network', 'Design engagement program', 'Develop training for champions', 'Save enlistment plan to output directory'],
      outputFormat: 'JSON with championNetwork (array), engagementProgram (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['championNetwork', 'artifacts'], properties: { championNetwork: { type: 'array' }, engagementProgram: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'champions']
}));

export const enableActionTask = defineTask('enable-action', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enable action by removing barriers',
  agent: {
    name: 'barrier-remover',
    prompt: {
      role: 'change enablement specialist',
      task: 'Identify and remove barriers to change',
      context: args,
      instructions: ['Identify structural barriers', 'Identify skill barriers', 'Identify systems barriers', 'Create barrier removal plan', 'Save enablement plan to output directory'],
      outputFormat: 'JSON with barriers (array), removalPlan (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['barriers', 'removalPlan', 'artifacts'], properties: { barriers: { type: 'array' }, removalPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'barriers']
}));

export const generateWinsTask = defineTask('generate-wins', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate short-term wins',
  agent: {
    name: 'quick-wins-planner',
    prompt: {
      role: 'quick wins specialist',
      task: 'Plan and celebrate short-term wins',
      context: args,
      instructions: ['Identify quick win opportunities', 'Plan 30-60-90 day wins', 'Create recognition approach', 'Design celebration plan', 'Save wins plan to output directory'],
      outputFormat: 'JSON with quickWins (array), celebrationPlan (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['quickWins', 'artifacts'], properties: { quickWins: { type: 'array' }, celebrationPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'wins']
}));

export const sustainAccelerationTask = defineTask('sustain-acceleration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sustain acceleration',
  agent: {
    name: 'momentum-sustainer',
    prompt: {
      role: 'change momentum specialist',
      task: 'Sustain momentum and accelerate change',
      context: args,
      instructions: ['Build on wins for more change', 'Identify next wave initiatives', 'Refresh urgency', 'Maintain coalition energy', 'Save acceleration plan to output directory'],
      outputFormat: 'JSON with nextWaveInitiatives (array), momentumPlan (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['nextWaveInitiatives', 'artifacts'], properties: { nextWaveInitiatives: { type: 'array' }, momentumPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'acceleration']
}));

export const instituteChangeTask = defineTask('institute-change', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Institute change',
  agent: {
    name: 'institutionalizer',
    prompt: {
      role: 'change institutionalization specialist',
      task: 'Anchor changes in organizational culture',
      context: args,
      instructions: ['Embed in culture and values', 'Update policies and procedures', 'Align HR systems', 'Create sustainability mechanisms', 'Save institutionalization plan to output directory'],
      outputFormat: 'JSON with culturalChanges (array), policyUpdates (array), sustainabilityPlan (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['sustainabilityPlan', 'artifacts'], properties: { culturalChanges: { type: 'array' }, policyUpdates: { type: 'array' }, sustainabilityPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'institutionalization']
}));

export const changeReportTask = defineTask('change-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate change management report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'change management consultant and technical writer',
      task: 'Generate comprehensive change management report',
      context: args,
      instructions: ['Create executive summary', 'Document each of 8 steps', 'Include all plans', 'Create implementation timeline', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'change-management', 'reporting']
}));
