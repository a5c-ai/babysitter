/**
 * @process methodologies/spec-kit-constitution
 * @description Standalone constitution establishment for spec-driven development
 * @inputs { projectName: string, scope?: string, existingStandards?: object }
 * @outputs { success: boolean, constitution: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Constitution Establishment Process
 *
 * Spec-Kit Step 1: Establish project governance principles
 * Creates constitution defining: code quality, UX, performance, security, constraints, architecture, workflow
 */
export async function process(inputs, ctx) {
  const { projectName, scope = 'project', existingStandards = null } = inputs;

  const contextResult = await ctx.task(gatherConstitutionContextTask, {
    projectName, scope, existingStandards,
    projectType: inputs.projectType || 'web',
    targetAudience: inputs.targetAudience || '',
    complianceRequirements: inputs.complianceRequirements || []
  });

  const draftResult = await ctx.task(draftConstitutionTask, {
    projectName, scope, context: contextResult
  });

  await ctx.breakpoint({
    question: `Review draft constitution for "${projectName}". Approve or provide feedback?`,
    title: 'Constitution Draft Review',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/specs/CONSTITUTION-DRAFT.md', format: 'markdown', label: 'Draft' }] }
  });

  const finalResult = await ctx.task(finalizeConstitutionTask, {
    projectName, constitution: draftResult
  });

  await ctx.breakpoint({
    question: `Final constitution ready. Approve?`,
    title: 'Constitution Approval',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/specs/CONSTITUTION.md', format: 'markdown', label: 'Final' }] }
  });

  return {
    success: true, projectName, scope, constitution: finalResult,
    artifacts: { constitution: 'artifacts/specs/CONSTITUTION.md' },
    metadata: { processId: 'methodologies/spec-kit-constitution', timestamp: ctx.now() }
  };
}

export const gatherConstitutionContextTask = defineTask('gather-constitution-context', (args, taskCtx) => ({
  kind: 'agent', title: 'Gather constitution context',
  agent: { name: 'context-gatherer', prompt: { /* Full prompt in cached version */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'constitution', 'context']
}));

export const draftConstitutionTask = defineTask('draft-constitution', (args, taskCtx) => ({
  kind: 'agent', title: `Draft constitution: ${args.projectName}`,
  agent: { name: 'constitution-drafter', prompt: { /* Full prompt in cached version */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'constitution', 'draft']
}));

export const finalizeConstitutionTask = defineTask('finalize-constitution', (args, taskCtx) => ({
  kind: 'node', title: 'Finalize constitution',
  node: { entry: '.a5c/orchestrator_scripts/spec-kit/finalize-constitution.js', args: ['--project-name', args.projectName, '--constitution', JSON.stringify(args.constitution), '--output', `tasks/${taskCtx.effectId}/result.json`] },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['spec-kit', 'constitution', 'finalize']
}));

// NOTE: Full implementation with complete prompts available at:
// C:\Users\tmusk\.claude\plugins\cache\a5c-ai\babysitter\4.0.42\skills\babysit\process\methodologies\spec-kit-constitution.js
