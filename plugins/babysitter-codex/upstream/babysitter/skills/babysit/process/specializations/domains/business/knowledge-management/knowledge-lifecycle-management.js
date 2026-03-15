/**
 * @process domains/business/knowledge-management/knowledge-lifecycle-management
 * @description Implement processes for managing knowledge through its lifecycle including creation, validation, publication, review, archival, and retirement
 * @specialization Knowledge Management
 * @category Knowledge Governance and Strategy
 * @inputs { knowledgeAsset: object, lifecycleStage: string, governancePolicies: object, outputDir: string }
 * @outputs { success: boolean, lifecycleProcess: object, stageTransitions: array, retentionPolicy: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeAsset = {},
    lifecycleStage = 'creation',
    governancePolicies = {},
    contentTypes = [],
    retentionRequirements = {},
    outputDir = 'lifecycle-management-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Lifecycle Management Process');

  // Phase 1: Lifecycle Framework Design
  ctx.log('info', 'Phase 1: Designing lifecycle framework');
  const frameworkDesign = await ctx.task(frameworkDesignTask, { governancePolicies, contentTypes, outputDir });
  artifacts.push(...frameworkDesign.artifacts);

  await ctx.breakpoint({
    question: `Lifecycle framework designed with ${frameworkDesign.stages.length} stages. Review?`,
    title: 'Lifecycle Framework Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { stages: frameworkDesign.stages.length } }
  });

  // Phase 2: Creation Process Design
  ctx.log('info', 'Phase 2: Designing creation process');
  const creationProcess = await ctx.task(creationProcessTask, { frameworkDesign: frameworkDesign.framework, governancePolicies, outputDir });
  artifacts.push(...creationProcess.artifacts);

  // Phase 3: Validation Process Design
  ctx.log('info', 'Phase 3: Designing validation process');
  const validationProcess = await ctx.task(validationProcessTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...validationProcess.artifacts);

  // Phase 4: Publication Process Design
  ctx.log('info', 'Phase 4: Designing publication process');
  const publicationProcess = await ctx.task(publicationProcessTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...publicationProcess.artifacts);

  // Phase 5: Review Process Design
  ctx.log('info', 'Phase 5: Designing review process');
  const reviewProcess = await ctx.task(reviewProcessTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...reviewProcess.artifacts);

  // Phase 6: Update Process Design
  ctx.log('info', 'Phase 6: Designing update process');
  const updateProcess = await ctx.task(updateProcessTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...updateProcess.artifacts);

  // Phase 7: Archival Process Design
  ctx.log('info', 'Phase 7: Designing archival process');
  const archivalProcess = await ctx.task(archivalProcessTask, { frameworkDesign: frameworkDesign.framework, retentionRequirements, outputDir });
  artifacts.push(...archivalProcess.artifacts);

  // Phase 8: Retirement Process Design
  ctx.log('info', 'Phase 8: Designing retirement process');
  const retirementProcess = await ctx.task(retirementProcessTask, { frameworkDesign: frameworkDesign.framework, retentionRequirements, outputDir });
  artifacts.push(...retirementProcess.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing lifecycle process quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { frameworkDesign, creationProcess, validationProcess, publicationProcess, reviewProcess, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { lifecycleProcess: frameworkDesign.framework, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    lifecycleProcess: frameworkDesign.framework,
    stageTransitions: frameworkDesign.transitions,
    processes: {
      creation: creationProcess.process,
      validation: validationProcess.process,
      publication: publicationProcess.process,
      review: reviewProcess.process,
      update: updateProcess.process,
      archival: archivalProcess.process,
      retirement: retirementProcess.process
    },
    retentionPolicy: archivalProcess.retentionPolicy,
    statistics: { stagesDefineds: frameworkDesign.stages.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/knowledge-lifecycle-management', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const frameworkDesignTask = defineTask('framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design lifecycle framework',
  agent: {
    name: 'lifecycle-architect',
    prompt: { role: 'knowledge lifecycle architect', task: 'Design comprehensive lifecycle framework', context: args, instructions: ['Define lifecycle stages', 'Map stage transitions', 'Save to output directory'], outputFormat: 'JSON with framework (object), stages (array), transitions (array), artifacts' },
    outputSchema: { type: 'object', required: ['framework', 'stages', 'transitions', 'artifacts'], properties: { framework: { type: 'object' }, stages: { type: 'array' }, transitions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'lifecycle', 'framework']
}));

export const creationProcessTask = defineTask('creation-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design creation process',
  agent: {
    name: 'creation-designer',
    prompt: { role: 'content creation process designer', task: 'Design knowledge creation process', context: args, instructions: ['Define authoring workflow', 'Set quality gates', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'creation', 'process']
}));

export const validationProcessTask = defineTask('validation-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design validation process',
  agent: {
    name: 'validation-designer',
    prompt: { role: 'validation process designer', task: 'Design content validation process', context: args, instructions: ['Define review workflow', 'Set approval criteria', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'validation', 'process']
}));

export const publicationProcessTask = defineTask('publication-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design publication process',
  agent: {
    name: 'publication-designer',
    prompt: { role: 'publication process designer', task: 'Design content publication process', context: args, instructions: ['Define publishing workflow', 'Set distribution rules', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'publication', 'process']
}));

export const reviewProcessTask = defineTask('review-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design review process',
  agent: {
    name: 'review-designer',
    prompt: { role: 'review process designer', task: 'Design periodic review process', context: args, instructions: ['Define review triggers', 'Set review frequency', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'review', 'process']
}));

export const updateProcessTask = defineTask('update-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design update process',
  agent: {
    name: 'update-designer',
    prompt: { role: 'update process designer', task: 'Design content update process', context: args, instructions: ['Define update workflow', 'Version control approach', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'update', 'process']
}));

export const archivalProcessTask = defineTask('archival-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design archival process',
  agent: {
    name: 'archival-designer',
    prompt: { role: 'archival process designer', task: 'Design content archival process', context: args, instructions: ['Define archival criteria', 'Set retention policies', 'Save to output directory'], outputFormat: 'JSON with process (object), retentionPolicy (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'retentionPolicy', 'artifacts'], properties: { process: { type: 'object' }, retentionPolicy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'archival', 'process']
}));

export const retirementProcessTask = defineTask('retirement-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design retirement process',
  agent: {
    name: 'retirement-designer',
    prompt: { role: 'retirement process designer', task: 'Design content retirement process', context: args, instructions: ['Define retirement criteria', 'Set deletion safeguards', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'retirement', 'process']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess lifecycle process quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess lifecycle process quality', context: args, instructions: ['Evaluate completeness', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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
