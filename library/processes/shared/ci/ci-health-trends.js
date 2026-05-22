/**
 * @process processes/shared/ci/ci-health-trends
 * @description CI-health trend analyser. Periodic scan (weekly cadence, per the a5c ci-health
 *   package): collect recent workflow runs → compute per-workflow failure rate + mean duration
 *   trends → flag regressions → emit a digest issue listing top offenders and auto-open
 *   per-workflow "heal" triage stubs for the highest-severity regressions.
 * @inputs { lookbackDays?: number, workflowAllowlist?: string[], severityThreshold?: number }
 * @outputs { success, workflowsScanned, regressions, digestIssueUrl?, healStubs }
 *
 * Source: https://github.com/a5c-ai/a5c/tree/main/registry/packages/ci-health
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectRunsTask = defineTask(
  'ci-health-trends.collect-runs',
  async ({ lookbackDays, workflowAllowlist }, ctx) => {
    return ctx.agent({
      title: `CI-health: collect workflow runs (last ${lookbackDays ?? 14}d)`,
      prompt: [
        'Query GitHub Actions for workflow runs over the lookback window via gh/api.',
        'Group runs by workflow name. For each: status, conclusion, duration, branch, started_at.',
        'Restrict to the allowlist if provided; otherwise include all workflows in .github/workflows/.',
        `Lookback days: ${lookbackDays ?? 14}`,
        `Allowlist: ${JSON.stringify(workflowAllowlist ?? [])}`,
        'Return JSON: { workflows: Array<{ name, runs: Array<{ id, conclusion, durationMs, startedAt, branch }> }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Collect workflow runs', labels: ['a5c', 'ci-health'] },
);

const analyseWorkflowTask = defineTask(
  'ci-health-trends.analyse-workflow',
  async ({ workflow }, ctx) => {
    return ctx.agent({
      title: `CI-health: analyse "${workflow.name}"`,
      prompt: [
        'Compute failure rate, mean duration, p90 duration, and a trend direction for this workflow',
        'split into two halves of the lookback window. Flag a regression if current-half failure rate',
        'is >=10 percentage points higher than previous-half, OR mean duration increased by >=30%.',
        `Workflow: ${JSON.stringify(workflow, null, 2)}`,
        'Return JSON: { name, failureRate, meanDurationMs, p90DurationMs, trend, regression: { kind?: "failure"|"duration", delta?: number } }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Analyse workflow', labels: ['a5c', 'ci-health'] },
);

const rankRegressionsTask = defineTask(
  'ci-health-trends.rank-regressions',
  async ({ analyses, severityThreshold }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: 'Rank workflow regressions',
      prompt: [
        'Rank workflows by regression severity. Severity = weighted(failureRateDelta, durationDelta).',
        'Drop items below severityThreshold.',
        `Analyses: ${JSON.stringify(analyses, null, 2)}`,
        `Severity threshold: ${severityThreshold ?? 0.15}`,
        'Return JSON: { ranked: Array<{ name, severity, reason }> }.',
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Rank regressions', labels: ['a5c', 'ci-health'] },
);

const emitDigestIssueTask = defineTask(
  'ci-health-trends.emit-digest-issue',
  async ({ ranked, lookbackDays }, ctx) => {
    return ctx.agent({
      title: `CI-health: emit weekly digest issue (top ${ranked.length} offenders)`,
      prompt: [
        'Open ONE consolidated issue titled "[CI Health] Weekly digest — top offenders" (reuse open issue if present, edit body).',
        'Body: markdown table of ranked regressions with reason + link to last failing run.',
        'Labels: ["ci-health", "build"], priority label per top severity.',
        `Lookback days: ${lookbackDays ?? 14}`,
        `Ranked: ${JSON.stringify(ranked, null, 2)}`,
        'Return JSON: { url: string, number: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Emit digest issue', labels: ['a5c', 'ci-health'] },
);

const openHealStubTask = defineTask(
  'ci-health-trends.open-heal-stub',
  async ({ regression }, ctx) => {
    return ctx.agent({
      title: `CI-health: open heal stub for "${regression.name}"`,
      prompt: [
        'Open a triage issue for this regression, mentioning @build-fixer-agent for Category-2 review.',
        'Include workflow name, severity, last failing run link, and suggested investigation angles.',
        'Labels: ["ci-health", "build", "heal"], priority label per severity.',
        `Regression: ${JSON.stringify(regression, null, 2)}`,
        'Return JSON: { url: string, number: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Open heal stub', labels: ['a5c', 'ci-health'] },
);

export async function process(inputs, ctx) {
  const { lookbackDays = 14, workflowAllowlist, severityThreshold = 0.15 } = inputs ?? {};
  const collected = await ctx.task(collectRunsTask, { lookbackDays, workflowAllowlist });
  const workflows = Array.isArray(collected?.workflows) ? collected.workflows : [];
  if (workflows.length === 0) {
    return { success: true, workflowsScanned: 0, regressions: [], healStubs: [] };
  }

  // Analyse each workflow independently in parallel.
  const analyses = await ctx.parallel.map(workflows, (workflow) =>
    ctx.task(analyseWorkflowTask, { workflow }),
  );

  const ranked = await ctx.task(rankRegressionsTask, { analyses, severityThreshold });
  const offenders = Array.isArray(ranked?.ranked) ? ranked.ranked : [];

  let digestIssueUrl;
  if (offenders.length > 0) {
    const digest = await ctx.task(emitDigestIssueTask, { ranked: offenders, lookbackDays });
    digestIssueUrl = digest?.url;
  }

  // Open heal stubs for the top 3 to avoid issue spam.
  const topSeverity = offenders.slice(0, 3);
  const healStubs = topSeverity.length
    ? await ctx.parallel.map(topSeverity, (regression) =>
        ctx.task(openHealStubTask, { regression }),
      )
    : [];

  return {
    success: true,
    workflowsScanned: workflows.length,
    regressions: offenders,
    digestIssueUrl,
    healStubs: healStubs.map((s) => s?.url).filter(Boolean),
  };
}
