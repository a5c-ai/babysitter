/**
 * @process domains/business/knowledge-management/lessons-learned-integration
 * @description Ensure captured lessons are integrated into processes, training, standards, and future project planning for actual improvement
 * @specialization Knowledge Management
 * @category Lessons Learned Processes
 * @inputs { lessonsRepository: object, targetProcesses: array, integrationScope: object, outputDir: string }
 * @outputs { success: boolean, integrationPlan: object, updatedProcesses: array, trainingUpdates: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    lessonsRepository = {},
    targetProcesses = [],
    integrationScope = {},
    standardsFramework = {},
    trainingPrograms = [],
    outputDir = 'lessons-integration-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Lessons Learned Integration and Application Process');

  // Phase 1: Lessons Analysis
  ctx.log('info', 'Phase 1: Analyzing lessons for integration');
  const lessonsAnalysis = await ctx.task(lessonsAnalysisTask, { lessonsRepository, integrationScope, outputDir });
  artifacts.push(...lessonsAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Analyzed ${lessonsAnalysis.lessonsCount} lessons with ${lessonsAnalysis.actionableCount} actionable items. Review?`,
    title: 'Lessons Analysis Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { lessonsCount: lessonsAnalysis.lessonsCount, actionableCount: lessonsAnalysis.actionableCount } }
  });

  // Phase 2: Integration Opportunity Mapping
  ctx.log('info', 'Phase 2: Mapping integration opportunities');
  const integrationMapping = await ctx.task(integrationMappingTask, { lessonsAnalysis, targetProcesses, standardsFramework, trainingPrograms, outputDir });
  artifacts.push(...integrationMapping.artifacts);

  // Phase 3: Process Update Planning
  ctx.log('info', 'Phase 3: Planning process updates');
  const processUpdates = await ctx.task(processUpdatePlanningTask, { integrationMapping, targetProcesses, outputDir });
  artifacts.push(...processUpdates.artifacts);

  // Phase 4: Standards Update Planning
  ctx.log('info', 'Phase 4: Planning standards updates');
  const standardsUpdates = await ctx.task(standardsUpdatePlanningTask, { integrationMapping, standardsFramework, outputDir });
  artifacts.push(...standardsUpdates.artifacts);

  // Phase 5: Training Content Updates
  ctx.log('info', 'Phase 5: Planning training content updates');
  const trainingUpdates = await ctx.task(trainingUpdatePlanningTask, { integrationMapping, trainingPrograms, outputDir });
  artifacts.push(...trainingUpdates.artifacts);

  // Phase 6: Project Planning Integration
  ctx.log('info', 'Phase 6: Planning project planning integration');
  const projectPlanningIntegration = await ctx.task(projectPlanningIntegrationTask, { lessonsAnalysis, outputDir });
  artifacts.push(...projectPlanningIntegration.artifacts);

  // Phase 7: Implementation Roadmap
  ctx.log('info', 'Phase 7: Creating implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, { processUpdates, standardsUpdates, trainingUpdates, projectPlanningIntegration, outputDir });
  artifacts.push(...implementationRoadmap.artifacts);

  // Phase 8: Change Management Plan
  ctx.log('info', 'Phase 8: Developing change management plan');
  const changeManagement = await ctx.task(changeManagementTask, { implementationRoadmap: implementationRoadmap.roadmap, outputDir });
  artifacts.push(...changeManagement.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing integration plan quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { lessonsAnalysis, integrationMapping, implementationRoadmap, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { integrationPlan: implementationRoadmap.roadmap, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    integrationPlan: implementationRoadmap.roadmap,
    updatedProcesses: processUpdates.updates,
    standardsUpdates: standardsUpdates.updates,
    trainingUpdates: trainingUpdates.updates,
    projectPlanningGuidance: projectPlanningIntegration.guidance,
    changeManagement: changeManagement.plan,
    statistics: { lessonsIntegrated: lessonsAnalysis.actionableCount, processesUpdated: processUpdates.updates.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/lessons-learned-integration', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const lessonsAnalysisTask = defineTask('lessons-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze lessons for integration',
  agent: {
    name: 'lessons-analyst',
    prompt: { role: 'lessons learned analyst', task: 'Analyze lessons for integration opportunities', context: args, instructions: ['Categorize lessons by type', 'Identify actionable items', 'Save to output directory'], outputFormat: 'JSON with lessonsCount (number), actionableCount (number), analysis (object), artifacts' },
    outputSchema: { type: 'object', required: ['lessonsCount', 'actionableCount', 'artifacts'], properties: { lessonsCount: { type: 'number' }, actionableCount: { type: 'number' }, analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'lessons', 'analysis']
}));

export const integrationMappingTask = defineTask('integration-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map integration opportunities',
  agent: {
    name: 'integration-mapper',
    prompt: { role: 'integration specialist', task: 'Map lessons to integration targets', context: args, instructions: ['Match lessons to processes', 'Identify training opportunities', 'Save to output directory'], outputFormat: 'JSON with mapping (object), artifacts' },
    outputSchema: { type: 'object', required: ['mapping', 'artifacts'], properties: { mapping: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'integration', 'mapping']
}));

export const processUpdatePlanningTask = defineTask('process-update-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan process updates',
  agent: {
    name: 'process-updater',
    prompt: { role: 'process improvement specialist', task: 'Plan process updates based on lessons', context: args, instructions: ['Define specific process changes', 'Document update requirements', 'Save to output directory'], outputFormat: 'JSON with updates (array), artifacts' },
    outputSchema: { type: 'object', required: ['updates', 'artifacts'], properties: { updates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'process', 'updates']
}));

export const standardsUpdatePlanningTask = defineTask('standards-update-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan standards updates',
  agent: {
    name: 'standards-specialist',
    prompt: { role: 'standards specialist', task: 'Plan standards updates based on lessons', context: args, instructions: ['Identify standards to update', 'Document changes needed', 'Save to output directory'], outputFormat: 'JSON with updates (array), artifacts' },
    outputSchema: { type: 'object', required: ['updates', 'artifacts'], properties: { updates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'standards', 'updates']
}));

export const trainingUpdatePlanningTask = defineTask('training-update-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan training updates',
  agent: {
    name: 'training-developer',
    prompt: { role: 'training developer', task: 'Plan training content updates', context: args, instructions: ['Identify training materials to update', 'Define new training needs', 'Save to output directory'], outputFormat: 'JSON with updates (array), artifacts' },
    outputSchema: { type: 'object', required: ['updates', 'artifacts'], properties: { updates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'training', 'updates']
}));

export const projectPlanningIntegrationTask = defineTask('project-planning-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan project planning integration',
  agent: {
    name: 'project-planner',
    prompt: { role: 'project planning specialist', task: 'Integrate lessons into project planning', context: args, instructions: ['Create checklists from lessons', 'Define risk considerations', 'Save to output directory'], outputFormat: 'JSON with guidance (object), artifacts' },
    outputSchema: { type: 'object', required: ['guidance', 'artifacts'], properties: { guidance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'project', 'planning']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'roadmap-developer',
    prompt: { role: 'implementation planner', task: 'Create integration implementation roadmap', context: args, instructions: ['Sequence integration activities', 'Define milestones', 'Save to output directory'], outputFormat: 'JSON with roadmap (object), artifacts' },
    outputSchema: { type: 'object', required: ['roadmap', 'artifacts'], properties: { roadmap: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'implementation', 'roadmap']
}));

export const changeManagementTask = defineTask('change-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop change management plan',
  agent: {
    name: 'change-manager',
    prompt: { role: 'change management specialist', task: 'Develop change management plan', context: args, instructions: ['Plan communication and training', 'Define adoption support', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'change', 'management']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess integration plan quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess integration plan quality', context: args, instructions: ['Evaluate completeness and feasibility', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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
