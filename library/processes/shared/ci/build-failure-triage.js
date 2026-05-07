/**
 * @process processes/shared/ci/build-failure-triage
 * @description Classify a CI build failure and route to the appropriate fix strategy.
 * @inputs { runUrl?: string, failureLogs: string, failedStep?: string, retriesAllowed?: boolean }
 * @outputs { success: boolean, category: string, fixStrategy: string, details: object }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const categories = ['flake', 'environment', 'compile', 'test', 'lint', 'infrastructure', 'unknown'];

const classifyTask = defineTask(
  'build-failure.classify',
  async ({ failureLogs, failedStep, retriesAllowed }, ctx) => {
    return ctx.agent({
      title: 'Classify build failure',
      prompt: [
        'Classify the build failure into exactly one category. Matching category to response prevents wasted cycles.',
        `Categories: ${categories.join(', ')}`,
        `Failed step: ${failedStep ?? '(unknown)'}`,
        `Retries already allowed: ${retriesAllowed ?? false}`,
        '',
        'Definitions:',
        '- flake: transient failure (network, timing, test retry). Re-run once; if fails again, it is not flake.',
        '- environment: missing dependency, wrong version, missing secret, stale cache.',
        '- compile: syntax/type error, unresolved import. Fix at source; do not suppress.',
        '- test: real behavior regression or intentional change. Do not delete the test.',
        '- lint: style-only. Apply fixer; do not disable rule.',
        '- infrastructure: CI runner, registry, external outage. Wait; do not disable the check.',
        '',
        `Failure logs (tail):\n${failureLogs.slice(-4000)}`,
        '',
        'Return JSON: { category, confidence: "low"|"medium"|"high", rootCause, fixStrategy, fixSteps: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Classify build failure', labels: ['ci', 'triage'] },
);

const applyFixTask = defineTask(
  'build-failure.apply-fix',
  async ({ category, fixSteps, runUrl }, ctx) => {
    return ctx.agent({
      title: `Apply ${category} fix`,
      prompt: [
        `Apply the fix strategy for a "${category}" build failure.`,
        runUrl ? `Failing run: ${runUrl}` : '',
        `Steps: ${JSON.stringify(fixSteps, null, 2)}`,
        'Do not disable tests/checks to make CI green. If the fix cannot be applied, report that instead.',
        'Return JSON: { applied: boolean, commitSha?: string, notes: string }.',
      ].filter(Boolean).join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Apply fix', labels: ['ci', 'fix'] },
);

export async function process(inputs, ctx) {
  const { runUrl, failureLogs, failedStep, retriesAllowed = false } = inputs;
  const classification = await ctx.task(classifyTask, { failureLogs, failedStep, retriesAllowed });
  const fixResult = await ctx.task(applyFixTask, {
    category: classification.category,
    fixSteps: classification.fixSteps ?? [],
    runUrl,
  });
  return {
    success: fixResult.applied === true,
    category: classification.category,
    fixStrategy: classification.fixStrategy,
    details: { classification, fixResult },
  };
}
