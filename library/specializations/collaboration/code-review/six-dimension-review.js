/**
 * @process specializations/collaboration/code-review/six-dimension-review
 * @description Structured PR review across six dimensions: correctness, clarity, consistency, coverage, complexity, change-scope.
 * @inputs { prNumber: number, repo: string, diff: string, changedFiles: Array<string>, testsChanged: Array<string>, prBody?: string }
 * @outputs { success: boolean, dimensions: object, blockingFindings: Array<object>, nits: Array<object>, summary: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-analysis-linting, skill-area:code-review-practice]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:backend-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DIMENSIONS = [
  { key: 'correctness', prompt: 'Does the code do what the PR claims? Any logical bugs, off-by-one, race conditions, null/undef hazards, error-path gaps?' },
  { key: 'clarity', prompt: 'Is intent obvious from the code? Names, structure, comments where non-obvious. Flag cleverness that sacrifices readability.' },
  { key: 'consistency', prompt: 'Does the change match existing patterns, conventions, and architectural boundaries in the repo?' },
  { key: 'coverage', prompt: 'Are there tests for the new behavior? Do existing tests still exercise the right paths? Any coverage gaps for edge cases?' },
  { key: 'complexity', prompt: 'Is the solution as simple as it can be? Any over-engineering, premature abstraction, unused flexibility?' },
  { key: 'change-scope', prompt: 'Is the PR focused on one concern? Any drive-by edits, mixed refactor+feature, or churn that belongs in a separate PR?' },
];

const dimensionTask = defineTask(
  'six-dimension.review',
  async ({ dimension, diff, prBody, changedFiles, testsChanged }, ctx) => {
    return ctx.agent({
      title: `Review: ${dimension.key}`,
      prompt: [
        `Review this PR through the "${dimension.key}" lens.`,
        dimension.prompt,
        `PR body: ${prBody ?? '(empty)'}`,
        `Changed files: ${JSON.stringify(changedFiles)}`,
        `Test files touched: ${JSON.stringify(testsChanged)}`,
        `Diff:\n${diff.slice(0, 20000)}`,
        'Return JSON: { findings: Array<{ severity: "block"|"nit"|"info", path?, line?, detail, suggestion? }>, summary: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Dimension review', labels: ['collaboration', 'review'] },
);

export async function process(inputs, ctx) {
  const { diff, prBody, changedFiles = [], testsChanged = [] } = inputs;
  const results = await ctx.parallel.map(DIMENSIONS, (dimension) =>
    ctx.task(dimensionTask, { dimension, diff, prBody, changedFiles, testsChanged }),
  );
  const dimensions = {};
  const blockingFindings = [];
  const nits = [];
  for (let i = 0; i < DIMENSIONS.length; i++) {
    const dim = DIMENSIONS[i];
    const r = results[i];
    dimensions[dim.key] = r;
    for (const f of r.findings ?? []) {
      if (f.severity === 'block') blockingFindings.push({ dimension: dim.key, ...f });
      else if (f.severity === 'nit') nits.push({ dimension: dim.key, ...f });
    }
  }
  const summary = Object.entries(dimensions)
    .map(([k, v]) => `**${k}**: ${v.summary}`)
    .join('\n');
  return {
    success: blockingFindings.length === 0,
    dimensions,
    blockingFindings,
    nits,
    summary,
  };
}
