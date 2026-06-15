/**
 * @process specializations/collaboration/code-review/validator
 * @description Multi-dimensional PR validator. Runs six review dimensions in parallel
 *   (quality, architecture, tests, security, UX, business), materialises non-blocking
 *   findings as a deferred-debt filesystem (docs/validation/<id>/<priority>/<category>/NN-title.md),
 *   then posts approve-or-request-changes verdict.
 * @inputs { pr: object, prDiff: string }
 * @outputs { success, approved, blockers, deferredFindings, dimensionResults }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/development/validator-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration, specialization:qa-testing-automation]
 *   skillAreas: [skill-area:code-analysis-linting, skill-area:code-review-practice, skill-area:application-security-testing]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:backend-engineer, role:engineering-manager, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DIMENSIONS = [
  { id: 'quality', description: 'Code quality & correctness: standards, logic, error handling, performance, secure coding, maintainability.' },
  { id: 'architecture', description: 'Architecture & design: requirements alignment, patterns, scalability, modularity, OSS reuse, tech-debt.' },
  { id: 'tests', description: 'QA & testing: coverage, stability, mocks, E2E, automation.' },
  { id: 'security', description: 'Security: secrets, input validation, auth/z, injection, regressions.' },
  { id: 'ux', description: 'Product/UX: user experience, completeness, accessibility, usability, docs.' },
  { id: 'business', description: 'Business/brand: consistency, value, risk, compliance, communication.' },
];

const reviewDimensionTask = defineTask(
  'validator.review-dimension',
  async ({ dimension, pr, prDiff }, ctx) => {
    return ctx.agent({
      title: `Validator: ${dimension.id} dimension for PR #${pr?.number ?? '?'}`,
      prompt: [
        `You are the validator-agent reviewing the ${dimension.id} dimension ONLY.`,
        dimension.description,
        'Classify each finding as BLOCKING (showstopper/critical) or NON-BLOCKING (high/medium/low deferred debt).',
        'BLOCKING examples: broken build, failing tests, arch violations, security holes, change does not cover original request.',
        'NON-BLOCKING examples: missing non-critical tests, refactor opportunities, typos in code, low-priority a11y improvements.',
        `PR: ${JSON.stringify(pr ?? {}, null, 2)}`,
        `Diff (may be truncated):\n${(prDiff ?? '').slice(0, 40000)}`,
        'Return JSON: { blockers: Array<{ title, detail, severity }>, deferred: Array<{ title, detail, priority, category }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Validator review dimension', labels: ['a5c', 'validator', 'review'] },
);

const materialiseFindingsTask = defineTask(
  'validator.materialise-deferred-debt',
  async ({ pr, deferred }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: `Materialise ${deferred.length} deferred finding(s) to docs/validation/`,
      prompt: [
        'Write each non-blocking finding as a markdown file on the PR branch at:',
        '  docs/validation/<prNumber>/<priority>/<category>/NN-title.md',
        'where priority ∈ {high, medium, low}, category describes the concern (tests|security|arch|ux|refactor|docs|...),',
        'NN is a zero-padded sequence within that priority+category folder. Cap total new files at 5 — keep the most valuable.',
        `PR number: ${pr?.number ?? '?'}`,
        `Findings: ${JSON.stringify(deferred, null, 2)}`,
        'Return JSON: { written: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Materialise deferred debt', labels: ['a5c', 'validator', 'deferred-debt'] },
);

const postVerdictTask = defineTask(
  'validator.post-verdict',
  async ({ pr, blockers, written }, ctx) => {
    return ctx.agent({
      title: `Validator: post verdict on PR #${pr?.number ?? '?'}`,
      prompt: [
        'You are the validator-agent. Post the verdict as a NEW PR comment (mentions only trigger on new comments).',
        blockers.length
          ? `Request changes. ${blockers.length} blocker(s). List them concisely. Tag @developer-agent to address. Set PR back to draft.`
          : 'Approve the PR conceptually and merge (or set auto-merge). Mark PR as non-draft. Link deferred-debt files.',
        `Blockers: ${JSON.stringify(blockers)}`,
        `Deferred-debt files written: ${JSON.stringify(written)}`,
        'Labels to apply: "validator" plus one category label (code|ux|tests|security|perf|docs|...).',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Validator verdict', labels: ['a5c', 'validator'] },
);

export async function process(inputs, ctx) {
  const { pr = {}, prDiff = '' } = inputs ?? {};

  // Six dimensions in parallel — one agent call per dimension keeps each focused.
  const dimensionResults = await ctx.parallel.map(DIMENSIONS, (dimension) =>
    ctx.task(reviewDimensionTask, { dimension, pr, prDiff }),
  );

  const blockers = [];
  const deferred = [];
  dimensionResults.forEach((r, i) => {
    const dim = DIMENSIONS[i].id;
    (r?.blockers ?? []).forEach((b) => blockers.push({ dimension: dim, ...b }));
    (r?.deferred ?? []).forEach((d) => deferred.push({ dimension: dim, category: d.category ?? dim, ...d }));
  });

  // Gate: only materialise deferred debt if there are any; cap at 5.
  let written = [];
  if (deferred.length > 0) {
    const cap = deferred.slice(0, 5);
    const mat = await ctx.task(materialiseFindingsTask, { pr, deferred: cap });
    written = Array.isArray(mat?.written) ? mat.written : [];
  }

  await ctx.task(postVerdictTask, { pr, blockers, written });

  return {
    success: true,
    approved: blockers.length === 0,
    blockers,
    deferredFindings: written,
    dimensionResults,
  };
}
