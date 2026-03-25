/**
 * @process methodologies/spec-kit-brownfield
 * @description Spec-Kit brownfield development - adding features to existing systems
 * @inputs { featureName: string, existingCodebase: string, existingConstitution?: object }
 * @outputs { success: boolean, analysis: object, specification: object, plan: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Brownfield Development Process
 *
 * Spec-Kit for existing systems:
 * 1. Analyze existing codebase
 * 2. Adopt or infer constitution
 * 3. Specify feature with integration
 * 4. Plan maintaining consistency
 * 5. Validate integration strategy
 */
export async function process(inputs, ctx) {
  const { featureName, existingCodebase, existingConstitution = null, featureDescription = '' } = inputs;

  const analysisResult = await ctx.task(analyzeExistingCodebaseTask, { featureName, codebasePath: existingCodebase });

  await ctx.breakpoint({
    question: `Review codebase analysis. Proceed with constitution adoption?`,
    title: 'Codebase Analysis Complete',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/brownfield/codebase-analysis.md', format: 'markdown', label: 'Analysis' }] }
  });

  const constitutionResult = existingConstitution
    ? await ctx.task(validateExistingConstitutionTask, { constitution: existingConstitution, codebaseAnalysis: analysisResult })
    : await ctx.task(inferConstitutionTask, { featureName, codebaseAnalysis: analysisResult });

  await ctx.breakpoint({
    question: existingConstitution ? `Constitution validated. Proceed?` : `Constitution inferred. Approve?`,
    title: 'Constitution Review',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/specs/CONSTITUTION.md', format: 'markdown', label: 'Constitution' }] }
  });

  const specificationResult = await ctx.task(specifyBrownfieldFeatureTask, {
    featureName, featureDescription, codebaseAnalysis: analysisResult, constitution: constitutionResult
  });

  await ctx.breakpoint({
    question: `Review feature specification with integration points. Approve?`,
    title: 'Feature Specification',
    context: { runId: ctx.runId, files: [
      { path: 'artifacts/specs/SPECIFICATION.md', format: 'markdown', label: 'Spec' },
      { path: 'artifacts/brownfield/integration-points.md', format: 'markdown', label: 'Integration' }
    ]}
  });

  const planResult = await ctx.task(planBrownfieldImplementationTask, {
    featureName, specification: specificationResult, codebaseAnalysis: analysisResult, constitution: constitutionResult
  });

  const integrationValidation = await ctx.task(validateIntegrationStrategyTask, { plan: planResult, codebaseAnalysis: analysisResult });

  if (!integrationValidation.safe) {
    await ctx.breakpoint({
      question: `Integration has ${integrationValidation.risks.length} risk(s). Approve mitigation?`,
      title: 'Integration Risks',
      context: { runId: ctx.runId, files: [
        { path: 'artifacts/brownfield/integration-risks.md', format: 'markdown', label: 'Risks' },
        { path: 'artifacts/brownfield/mitigation-plan.md', format: 'markdown', label: 'Mitigation' }
      ]}
    });
  }

  const tasksResult = await ctx.task(breakBrownfieldIntoTasksTask, {
    featureName, specification: specificationResult, plan: planResult, codebaseAnalysis: analysisResult
  });

  await ctx.breakpoint({
    question: `Brownfield planning complete. ${tasksResult.tasks.length} tasks ready. Proceed?`,
    title: 'Planning Complete',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/specs/TASKS.md', format: 'markdown', label: 'Tasks' }] }
  });

  return {
    success: true, featureName, codebaseAnalysis: analysisResult, constitution: constitutionResult,
    specification: specificationResult, plan: planResult, tasks: tasksResult, integrationValidation,
    artifacts: {
      analysis: 'artifacts/brownfield/codebase-analysis.md', constitution: 'artifacts/specs/CONSTITUTION.md',
      specification: 'artifacts/specs/SPECIFICATION.md', plan: 'artifacts/specs/PLAN.md', tasks: 'artifacts/specs/TASKS.md'
    },
    metadata: { processId: 'methodologies/spec-kit-brownfield', timestamp: ctx.now() }
  };
}

// Task definitions (abbreviated)
export const analyzeExistingCodebaseTask = defineTask('analyze-existing-codebase', (args, taskCtx) => ({
  kind: 'agent', title: `Analyze codebase: ${args.featureName}`,
  agent: { name: 'codebase-analyzer', prompt: { /* Full in cached */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'brownfield', 'analysis']
}));

export const inferConstitutionTask = defineTask('infer-constitution', (args, taskCtx) => ({
  kind: 'agent', title: 'Infer constitution from codebase',
  agent: { name: 'constitution-inferrer', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'brownfield', 'constitution']
}));

export const specifyBrownfieldFeatureTask = defineTask('specify-brownfield-feature', (args, taskCtx) => ({
  kind: 'agent', title: `Specify feature: ${args.featureName}`,
  agent: { name: 'brownfield-spec-writer', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'brownfield', 'specification']
}));

export const planBrownfieldImplementationTask = defineTask('plan-brownfield-implementation', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan brownfield implementation',
  agent: { name: 'brownfield-planner', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'brownfield', 'planning']
}));

export const validateIntegrationStrategyTask = defineTask('validate-integration-strategy', (args, taskCtx) => ({
  kind: 'agent', title: 'Validate integration strategy',
  agent: { name: 'integration-validator', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'brownfield', 'validation']
}));

export const breakBrownfieldIntoTasksTask = defineTask('break-brownfield-into-tasks', (args, taskCtx) => ({
  kind: 'agent', title: 'Break into tasks',
  agent: { name: 'brownfield-task-breaker', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'brownfield', 'tasks']
}));

export const validateExistingConstitutionTask = defineTask('validate-existing-constitution', (args, taskCtx) => ({
  kind: 'agent', title: 'Validate existing constitution',
  agent: { name: 'constitution-auditor', prompt: { /* ... */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'brownfield', 'validation']
}));

// Full: C:\Users\tmusk\.claude\plugins\cache\a5c-ai\babysitter\4.0.42\skills\babysit\process\methodologies\spec-kit-brownfield.js
