/**
 * @process specializations/collaboration/github/label-taxonomy
 * @description Enforce a canonical label taxonomy (type/area/priority) on issues and PRs.
 * @inputs { appliedLabels: Array<string>, changedFiles?: Array<string>, title?: string, body?: string }
 * @outputs { success: boolean, missing: Array<string>, suggestions: Array<string>, violations?: Array<object> }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const TAXONOMY = {
  type: ['type:bug', 'type:feature', 'type:chore', 'type:refactor', 'type:docs', 'type:test', 'type:perf'],
  area: ['area:sdk', 'area:cli', 'area:catalog', 'area:plugins', 'area:harness', 'area:library', 'area:docs'],
  priority: ['priority:p0', 'priority:p1', 'priority:p2', 'priority:p3'],
};

const classifyTask = defineTask(
  'label-taxonomy.classify',
  async ({ appliedLabels, changedFiles, title, body }, ctx) => {
    return ctx.agent({
      title: 'Classify item into label taxonomy',
      prompt: [
        'Classify the item into the canonical label taxonomy.',
        `Taxonomy: ${JSON.stringify(TAXONOMY, null, 2)}`,
        `Applied labels: ${JSON.stringify(appliedLabels)}`,
        `Title: ${title ?? ''}`,
        `Body: ${body ?? ''}`,
        `Changed files: ${JSON.stringify((changedFiles ?? []).slice(0, 50))}`,
        'Rules:',
        '- Exactly one type: label required.',
        '- One or more area: labels required (inferred from changed files).',
        '- priority: optional but recommended for issues.',
        'Return JSON: { suggestedLabels: string[], violations: Array<{ dimension, detail }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Classify taxonomy', labels: ['collaboration', 'github', 'labels'] },
);

function missingDimensions(applied) {
  const missing = [];
  for (const dim of Object.keys(TAXONOMY)) {
    const has = applied.some((l) => TAXONOMY[dim].includes(l));
    if (!has && dim !== 'priority') missing.push(dim);
  }
  return missing;
}

export async function process(inputs, ctx) {
  const applied = inputs.appliedLabels ?? [];
  const missing = missingDimensions(applied);
  if (missing.length === 0) {
    return { success: true, missing: [], suggestions: [] };
  }
  const classified = await ctx.task(classifyTask, inputs);
  return {
    success: false,
    missing,
    suggestions: classified.suggestedLabels ?? [],
    violations: classified.violations ?? [],
  };
}
