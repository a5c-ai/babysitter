/**
 * @process specializations/domains/science/aerospace-engineering/requirements-verification-matrix
 * @description Process for creating and maintaining requirements verification and validation matrices ensuring
 * complete traceability from system to component level.
 * @inputs { projectName: string, requirementsSource: object, systemArchitecture?: object }
 * @outputs { success: boolean, rvmMatrix: object, traceability: object, verificationPlan: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, requirementsSource, systemArchitecture = {} } = inputs;

  const requirements = await ctx.task(requirementsImportTask, { projectName, requirementsSource });
  const decomposition = await ctx.task(requirementsDecompositionTask, { projectName, requirements, systemArchitecture });

  await ctx.breakpoint({
    question: `${decomposition.totalRequirements} requirements decomposed for ${projectName}. Proceed with verification planning?`,
    title: 'Requirements Decomposition Review',
    context: { runId: ctx.runId, decomposition }
  });

  const verificationMethods = await ctx.task(verificationMethodsTask, { projectName, requirements: decomposition });
  const traceabilityMatrix = await ctx.task(traceabilityMatrixTask, { projectName, decomposition, verificationMethods });
  const verificationPlan = await ctx.task(verificationPlanTask, { projectName, traceabilityMatrix, verificationMethods });

  if (traceabilityMatrix.unverifiedCount > 0) {
    await ctx.breakpoint({
      question: `${traceabilityMatrix.unverifiedCount} requirements lack verification method. Review and resolve?`,
      title: 'Verification Gap Warning',
      context: { runId: ctx.runId, gaps: traceabilityMatrix.gaps }
    });
  }

  const rvmMatrix = await ctx.task(rvmGenerationTask, { projectName, traceabilityMatrix, verificationPlan });
  const report = await ctx.task(rvmReportTask, { projectName, requirements, rvmMatrix, traceabilityMatrix, verificationPlan });

  await ctx.breakpoint({
    question: `RVM complete for ${projectName}. Coverage: ${traceabilityMatrix.coverage}%. Approve?`,
    title: 'RVM Approval',
    context: { runId: ctx.runId, summary: { totalRequirements: decomposition.totalRequirements, coverage: traceabilityMatrix.coverage } }
  });

  return { success: true, projectName, rvmMatrix, traceability: traceabilityMatrix, verificationPlan, report, metadata: { processId: 'requirements-verification-matrix', timestamp: ctx.now() } };
}

export const requirementsImportTask = defineTask('requirements-import', (args, taskCtx) => ({
  kind: 'agent', title: `Requirements Import - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Requirements Engineer', task: 'Import and structure requirements', context: args,
    instructions: ['1. Import requirements', '2. Parse structure', '3. Identify types', '4. Validate format', '5. Create database'],
    outputFormat: 'JSON object with requirements'
  }, outputSchema: { type: 'object', required: ['requirements'], properties: { requirements: { type: 'array', items: { type: 'object' } }, count: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['requirements', 'aerospace']
}));

export const requirementsDecompositionTask = defineTask('requirements-decomposition', (args, taskCtx) => ({
  kind: 'agent', title: `Requirements Decomposition - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Systems Requirements Engineer', task: 'Decompose requirements to subsystems', context: args,
    instructions: ['1. Identify system levels', '2. Decompose to subsystems', '3. Create parent-child links', '4. Validate completeness', '5. Document decomposition'],
    outputFormat: 'JSON object with decomposition'
  }, outputSchema: { type: 'object', required: ['totalRequirements', 'hierarchy'], properties: { totalRequirements: { type: 'number' }, hierarchy: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['requirements', 'aerospace']
}));

export const verificationMethodsTask = defineTask('verification-methods', (args, taskCtx) => ({
  kind: 'agent', title: `Verification Methods - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'V&V Engineer', task: 'Define verification methods', context: args,
    instructions: ['1. Assign TADI methods', '2. Define test requirements', '3. Define analysis requirements', '4. Define inspection criteria', '5. Document methods'],
    outputFormat: 'JSON object with verification methods'
  }, outputSchema: { type: 'object', required: ['methods'], properties: { methods: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['requirements', 'aerospace']
}));

export const traceabilityMatrixTask = defineTask('traceability-matrix', (args, taskCtx) => ({
  kind: 'agent', title: `Traceability Matrix - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Traceability Engineer', task: 'Build traceability matrix', context: args,
    instructions: ['1. Link requirements to design', '2. Link to verification', '3. Identify gaps', '4. Calculate coverage', '5. Document matrix'],
    outputFormat: 'JSON object with traceability'
  }, outputSchema: { type: 'object', required: ['coverage', 'unverifiedCount'], properties: { coverage: { type: 'number' }, unverifiedCount: { type: 'number' }, gaps: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['requirements', 'aerospace']
}));

export const verificationPlanTask = defineTask('verification-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Verification Plan - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Verification Planner', task: 'Create verification plan', context: args,
    instructions: ['1. Define test sequence', '2. Plan analysis activities', '3. Plan inspections', '4. Define success criteria', '5. Document plan'],
    outputFormat: 'JSON object with verification plan'
  }, outputSchema: { type: 'object', required: ['plan'], properties: { plan: { type: 'object' }, schedule: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['requirements', 'aerospace']
}));

export const rvmGenerationTask = defineTask('rvm-generation', (args, taskCtx) => ({
  kind: 'agent', title: `RVM Generation - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'RVM Engineer', task: 'Generate requirements verification matrix', context: args,
    instructions: ['1. Compile RVM', '2. Format for review', '3. Add status tracking', '4. Create reports', '5. Export formats'],
    outputFormat: 'JSON object with RVM'
  }, outputSchema: { type: 'object', required: ['matrix'], properties: { matrix: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['requirements', 'aerospace']
}));

export const rvmReportTask = defineTask('rvm-report', (args, taskCtx) => ({
  kind: 'agent', title: `RVM Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'RVM Report Engineer', task: 'Generate RVM report', context: args,
    instructions: ['1. Create summary', '2. Document traceability', '3. Present coverage', '4. Document gaps', '5. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['requirements', 'aerospace']
}));
