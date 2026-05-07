/**
 * @process specializations/ux-ui-design/design-language
 * @description Establish or extend a design-language system (tokens, primitives, patterns) with consistency audits against current usage.
 * @inputs { action: "audit"|"extend", existingTokens?: object, proposedTokens?: object, surfaces?: Array<string>, componentInventory?: Array<object> }
 * @outputs { success: boolean, drifts?: Array<object>, tokenPlan?: object, migrationSteps?: Array<string> }
 * @graph
 *   domains: [domain:web-development]
 *   specializations: [specialization:ux-ui-design]
 *   skillAreas: [skill-area:design-systems, skill-area:interaction-design]
 *   roles: [role:product-designer, role:ux-researcher]
 *   workflows: [workflow:user-feedback-loop, workflow:product-discovery]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const auditTask = defineTask(
  'design-language.audit',
  async ({ existingTokens, surfaces, componentInventory }, ctx) => {
    return ctx.agent({
      title: 'Audit design-language adherence',
      prompt: [
        'Audit current surfaces against the design-language tokens.',
        `Existing tokens: ${JSON.stringify(existingTokens ?? {}, null, 2)}`,
        `Surfaces: ${JSON.stringify(surfaces ?? [])}`,
        `Component inventory: ${JSON.stringify(componentInventory ?? [], null, 2)}`,
        'Identify drifts: hardcoded colors/spacing, off-scale typography, duplicated primitives that should reuse a token.',
        'Return JSON: { drifts: Array<{ location, violation, severity: "block"|"warn"|"info", suggestedToken? }>, coverage: { tokensInUse: number, tokensUnused: string[] } }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Audit design language', labels: ['ux', 'design-language'] },
);

const extendTask = defineTask(
  'design-language.extend',
  async ({ existingTokens, proposedTokens, surfaces }, ctx) => {
    return ctx.agent({
      title: 'Extend design-language tokens',
      prompt: [
        'Propose a token plan that extends the existing system with the proposed tokens.',
        `Existing: ${JSON.stringify(existingTokens ?? {}, null, 2)}`,
        `Proposed: ${JSON.stringify(proposedTokens ?? {}, null, 2)}`,
        `Affected surfaces: ${JSON.stringify(surfaces ?? [])}`,
        'Rules:',
        '- Do not introduce parallel scales; extend existing ramps.',
        '- Every new token must justify its existence vs. composing from primitives.',
        '- Avoid naming collisions; prefer semantic names over raw values.',
        'Return JSON: { tokenPlan: object, migrationSteps: string[], risks: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Extend design language', labels: ['ux', 'design-language'] },
);

export async function process(inputs, ctx) {
  const { action } = inputs;
  if (action === 'audit') {
    const audit = await ctx.task(auditTask, inputs);
    const blockers = (audit.drifts ?? []).filter((d) => d.severity === 'block');
    return { success: blockers.length === 0, drifts: audit.drifts ?? [], coverage: audit.coverage };
  }
  if (action === 'extend') {
    const plan = await ctx.task(extendTask, inputs);
    return { success: true, tokenPlan: plan.tokenPlan, migrationSteps: plan.migrationSteps ?? [], risks: plan.risks ?? [] };
  }
  return { success: false, error: `Unknown action "${action}"` };
}
