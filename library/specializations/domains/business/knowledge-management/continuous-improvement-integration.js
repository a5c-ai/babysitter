/**
 * @process domains/business/knowledge-management/continuous-improvement-integration
 * @description Integrate knowledge management into continuous improvement programs to capture and apply improvement knowledge
 * @specialization Knowledge Management
 * @category Organizational Learning Processes
 * @inputs { ciProgram: object, knowledgeManagementSystem: object, integrationScope: object, outputDir: string }
 * @outputs { success: boolean, integrationFramework: object, knowledgeCaptureMechanisms: array, applicationProcesses: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    ciProgram = {},
    knowledgeManagementSystem = {},
    integrationScope = {},
    improvementMethodologies = ['kaizen', 'pdca', 'lean', 'six-sigma'],
    currentIntegrationState = {},
    outputDir = 'ci-km-integration-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Continuous Improvement Knowledge Integration Process');

  // Phase 1: Current State Assessment
  ctx.log('info', 'Phase 1: Assessing current integration state');
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, { ciProgram, knowledgeManagementSystem, currentIntegrationState, outputDir });
  artifacts.push(...currentStateAssessment.artifacts);

  await ctx.breakpoint({
    question: `Current integration assessed at ${currentStateAssessment.integrationLevel}% maturity. ${currentStateAssessment.gaps.length} gaps identified. Proceed?`,
    title: 'Current State Assessment Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { integrationLevel: currentStateAssessment.integrationLevel, gaps: currentStateAssessment.gaps.length } }
  });

  // Phase 2: Integration Framework Design
  ctx.log('info', 'Phase 2: Designing integration framework');
  const frameworkDesign = await ctx.task(frameworkDesignTask, { ciProgram, knowledgeManagementSystem, improvementMethodologies, outputDir });
  artifacts.push(...frameworkDesign.artifacts);

  // Phase 3: Knowledge Capture Mechanism Design
  ctx.log('info', 'Phase 3: Designing knowledge capture mechanisms');
  const captureDesign = await ctx.task(captureDesignTask, { frameworkDesign: frameworkDesign.framework, improvementMethodologies, outputDir });
  artifacts.push(...captureDesign.artifacts);

  // Phase 4: Knowledge Application Process Design
  ctx.log('info', 'Phase 4: Designing knowledge application processes');
  const applicationDesign = await ctx.task(applicationDesignTask, { frameworkDesign: frameworkDesign.framework, ciProgram, outputDir });
  artifacts.push(...applicationDesign.artifacts);

  // Phase 5: Improvement Event Integration
  ctx.log('info', 'Phase 5: Integrating with improvement events');
  const eventIntegration = await ctx.task(eventIntegrationTask, { captureDesign, applicationDesign, ciProgram, outputDir });
  artifacts.push(...eventIntegration.artifacts);

  // Phase 6: Metrics and Measurement
  ctx.log('info', 'Phase 6: Designing metrics and measurement');
  const metricsDesign = await ctx.task(metricsDesignTask, { frameworkDesign: frameworkDesign.framework, integrationScope, outputDir });
  artifacts.push(...metricsDesign.artifacts);

  // Phase 7: Technology Integration
  ctx.log('info', 'Phase 7: Planning technology integration');
  const technologyIntegration = await ctx.task(technologyIntegrationTask, { knowledgeManagementSystem, ciProgram, frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...technologyIntegration.artifacts);

  // Phase 8: Change Management Plan
  ctx.log('info', 'Phase 8: Developing change management plan');
  const changeManagement = await ctx.task(changeManagementTask, { frameworkDesign: frameworkDesign.framework, currentStateAssessment, outputDir });
  artifacts.push(...changeManagement.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing integration design quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { frameworkDesign, captureDesign, applicationDesign, metricsDesign, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { integrationFramework: frameworkDesign.framework, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    integrationFramework: frameworkDesign.framework,
    knowledgeCaptureMechanisms: captureDesign.mechanisms,
    applicationProcesses: applicationDesign.processes,
    eventIntegration: eventIntegration.integration,
    metrics: metricsDesign.metrics,
    technologyPlan: technologyIntegration.plan,
    changeManagement: changeManagement.plan,
    statistics: { mechanismsDesigned: captureDesign.mechanisms.length, processesCreated: applicationDesign.processes.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/continuous-improvement-integration', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current integration state',
  agent: {
    name: 'integration-assessor',
    prompt: { role: 'CI-KM integration assessor', task: 'Assess current CI-KM integration state', context: args, instructions: ['Evaluate existing integration points', 'Identify gaps', 'Save to output directory'], outputFormat: 'JSON with assessment (object), integrationLevel (number 0-100), gaps (array), artifacts' },
    outputSchema: { type: 'object', required: ['assessment', 'integrationLevel', 'gaps', 'artifacts'], properties: { assessment: { type: 'object' }, integrationLevel: { type: 'number', minimum: 0, maximum: 100 }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'current-state', 'assessment']
}));

export const frameworkDesignTask = defineTask('framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design integration framework',
  agent: {
    name: 'framework-designer',
    prompt: { role: 'CI-KM framework designer', task: 'Design CI-KM integration framework', context: args, instructions: ['Create integration architecture', 'Define touchpoints', 'Save to output directory'], outputFormat: 'JSON with framework (object), touchpoints (array), artifacts' },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, touchpoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'framework', 'design']
}));

export const captureDesignTask = defineTask('capture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design knowledge capture mechanisms',
  agent: {
    name: 'capture-designer',
    prompt: { role: 'knowledge capture designer', task: 'Design CI knowledge capture mechanisms', context: args, instructions: ['Create capture templates', 'Design automated capture', 'Save to output directory'], outputFormat: 'JSON with mechanisms (array), templates (array), artifacts' },
    outputSchema: { type: 'object', required: ['mechanisms', 'artifacts'], properties: { mechanisms: { type: 'array' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'capture', 'design']
}));

export const applicationDesignTask = defineTask('application-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design knowledge application processes',
  agent: {
    name: 'application-designer',
    prompt: { role: 'knowledge application designer', task: 'Design improvement knowledge application', context: args, instructions: ['Create reuse processes', 'Design knowledge push mechanisms', 'Save to output directory'], outputFormat: 'JSON with processes (array), artifacts' },
    outputSchema: { type: 'object', required: ['processes', 'artifacts'], properties: { processes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'application', 'design']
}));

export const eventIntegrationTask = defineTask('event-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate with improvement events',
  agent: {
    name: 'event-integrator',
    prompt: { role: 'improvement event integrator', task: 'Integrate KM into CI events', context: args, instructions: ['Embed KM in kaizen events', 'Add to PDCA cycles', 'Save to output directory'], outputFormat: 'JSON with integration (object), artifacts' },
    outputSchema: { type: 'object', required: ['integration', 'artifacts'], properties: { integration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'event', 'integration']
}));

export const metricsDesignTask = defineTask('metrics-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design metrics and measurement',
  agent: {
    name: 'metrics-designer',
    prompt: { role: 'metrics designer', task: 'Design CI-KM integration metrics', context: args, instructions: ['Define KPIs', 'Create measurement approach', 'Save to output directory'], outputFormat: 'JSON with metrics (array), artifacts' },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'metrics', 'design']
}));

export const technologyIntegrationTask = defineTask('technology-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan technology integration',
  agent: {
    name: 'technology-planner',
    prompt: { role: 'technology integration planner', task: 'Plan CI-KM technology integration', context: args, instructions: ['Define system integrations', 'Plan data flows', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'technology', 'integration']
}));

export const changeManagementTask = defineTask('change-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop change management plan',
  agent: {
    name: 'change-manager',
    prompt: { role: 'change management specialist', task: 'Develop change management plan', context: args, instructions: ['Plan adoption approach', 'Define training needs', 'Save to output directory'], outputFormat: 'JSON with plan (object), artifacts' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'change', 'management']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess integration design quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess integration design quality', context: args, instructions: ['Evaluate design completeness', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
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
