/**
 * @process methodologies/spec-kit-quality-checklist
 * @description Generate and validate custom quality checklists ("unit tests for English")
 * @inputs { targetType: string, target: object, constitution: object }
 * @outputs { success: boolean, checklist: object, validation: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Quality Checklist Process
 *
 * Spec-Kit: "Unit tests for English" - make specifications verifiable
 * Generates checklists for: specification|plan|task|implementation|documentation
 */
export async function process(inputs, ctx) {
  const { targetType, target, constitution } = inputs;

  const checklistResult = await ctx.task(generateQualityChecklistTask, {
    targetType, target, constitution, customCriteria: inputs.customCriteria || []
  });

  const validationResult = await ctx.task(validateAgainstChecklistTask, {
    targetType, target, checklist: checklistResult
  });

  if (!validationResult.passed) {
    await ctx.breakpoint({
      question: `Validation found ${validationResult.failures.length} issue(s). Review and decide: fix, update checklist, or accept?`,
      title: `${targetType} Validation Failed`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/quality/checklist-${targetType}.md`, format: 'markdown', label: 'Checklist' },
          { path: `artifacts/quality/validation-${targetType}.md`, format: 'markdown', label: 'Validation' }
        ]
      }
    });
  }

  return {
    success: validationResult.passed, targetType, checklist: checklistResult, validation: validationResult,
    artifacts: { checklist: `artifacts/quality/checklist-${targetType}.md`, validation: `artifacts/quality/validation-${targetType}.md` },
    metadata: { processId: 'methodologies/spec-kit-quality-checklist', timestamp: ctx.now() }
  };
}

export const generateQualityChecklistTask = defineTask('generate-quality-checklist', (args, taskCtx) => ({
  kind: 'agent', title: `Generate checklist: ${args.targetType}`,
  agent: { name: 'checklist-generator', prompt: { /* Full prompt in cached version */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'checklist', 'generation']
}));

export const validateAgainstChecklistTask = defineTask('validate-against-checklist', (args, taskCtx) => ({
  kind: 'agent', title: `Validate ${args.targetType}`,
  agent: { name: 'checklist-validator', prompt: { /* Full prompt in cached version */ }, outputSchema: { /* ... */ } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'spec-kit', 'checklist', 'validation']
}));

// Full implementation: C:\Users\tmusk\.claude\plugins\cache\a5c-ai\babysitter\4.0.42\skills\babysit\process\methodologies\spec-kit-quality-checklist.js
