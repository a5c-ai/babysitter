/**
 * @process gsd/audit-milestone
 * @description GSD milestone audit - verify milestone definition-of-done
 * @inputs { milestoneId: string, milestoneName: string, phases: array }
 * @outputs { success: boolean, ready: boolean, issues: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Agents referenced from agents/ directory:
 *   - gsd-verifier: Comprehensive milestone audit against definition-of-done
 *
 * Skills referenced from skills/ directory:
 *   - verification-suite: Milestone verification patterns
 *   - template-scaffolding: Audit report templates
 */
export async function process(inputs, ctx) {
  const { milestoneId, milestoneName, phases = [] } = inputs;

  // Comprehensive milestone audit
  const auditResult = await ctx.task(auditMilestoneTask, {
    milestoneId,
    milestoneName,
    phases,
    definitionOfDone: inputs.definitionOfDone || []
  });

  // Breakpoint: Review audit
  await ctx.breakpoint({
    question: `Milestone "${milestoneName}" audit complete. ${auditResult.ready ? 'Ready for completion' : 'Has issues'}. Review and approve?`,
    title: `Milestone Audit: ${milestoneName}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/${milestoneId}-AUDIT.md`, format: 'markdown', label: 'Audit Report' }
      ]
    }
  });

  return {
    success: true,
    ready: auditResult.ready,
    milestoneId,
    milestoneName,
    audit: auditResult,
    metadata: { processId: 'gsd/audit-milestone', timestamp: ctx.now() }
  };
}

export const auditMilestoneTask = defineTask('audit-milestone', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit: ${args.milestoneName}`,
  agent: {
    name: 'gsd-verifier',
    prompt: {
      role: 'principal engineer and quality auditor',
      task: 'Comprehensive milestone audit against definition-of-done',
      context: args,
      instructions: [
        'Review all completed phases',
        'Check definition-of-done criteria',
        'Test all deliverables',
        'Review code quality and tests',
        'Identify any gaps or issues',
        'Determine readiness for completion'
      ],
      outputFormat: 'JSON with ready (boolean), criteriaChecks (array), issues (array), auditMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'criteriaChecks'],
      properties: {
        ready: { type: 'boolean' },
        criteriaChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              satisfied: { type: 'boolean' },
              evidence: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        auditMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gsd', 'audit']
}));
