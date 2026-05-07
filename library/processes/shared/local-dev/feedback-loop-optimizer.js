/**
 * @process processes/shared/local-dev/feedback-loop-optimizer
 * @description Audits the repo's feedback loops across seven layers (pre-commit & commit
 *   hygiene, testing/E2E, linting & formatting, coverage, CI workflows, monitoring/tracing,
 *   alerting & on-call). First detects stack/tooling to calibrate suggestions, audits layers
 *   in parallel, dedupes gaps against existing open/closed issues, then opens one small
 *   (1-3h) decoupled GitHub issue per remaining gap using the standard issue template.
 *   Never commits code — issues and PR comments only. Never edits .github/workflows directly;
 *   proposes scripts/ or config files instead.
 * @inputs { repo?: string, focusLayers?: string[] }
 * @outputs { success, stack, gapsFound, issuesOpened }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/development/feedback-loop-optimizer-agent.prompt.md
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_LAYERS = [
  {
    id: 'pre-commit',
    description:
      'Pre-commit & commit hygiene: pre-commit framework config + hooks (ruff/black/isort/bandit for Python; eslint/prettier/tsc --noEmit for JS/TS; trailing-whitespace, end-of-file fixer). Conventional commits / commit message guidelines.',
  },
  {
    id: 'testing',
    description:
      'Unit/integration baseline plus smoke/E2E: Playwright or Cypress (web), pytest+httpx/supertest/Dredd (API). Ensure tests run in CI and on PRs.',
  },
  {
    id: 'lint-format',
    description:
      'Linting & formatting: ESLint + Prettier (JS/TS), Ruff/Flake8 + Black (Python), EditorConfig. Minimal recommended configs and autofix scripts.',
  },
  {
    id: 'coverage',
    description:
      'Coverage tooling + thresholds: pytest-cov (Python), nyc/istanbul (JS/TS), lcov reports. Prefer local reporting or free hosted tiers.',
  },
  {
    id: 'ci-workflows',
    description:
      'CI workflows: distinct parallel jobs for lint, type-check, test, coverage; fail fast; caching; matrix. Gate merges on checks. Never edit .github/workflows directly — propose scripts/ or configs via issue.',
  },
  {
    id: 'monitoring',
    description:
      'Monitoring/logging/tracing: OpenTelemetry, Prometheus, Grafana, Loki, Alertmanager. Error tracking: self-hosted Sentry or GlitchTip.',
  },
  {
    id: 'alerting-oncall',
    description:
      'Alerts & on-call: Alertmanager or Grafana OnCall; Healthchecks.io for cron/heartbeat. Alert severity, ownership, runbooks, escalation policy.',
  },
];

const detectStackTask = defineTask(
  'feedback-loop-optimizer.detect-stack',
  async ({ repo }, ctx) => {
    return ctx.agent({
      title: 'Detect repo stack and maturity',
      prompt: [
        'Inspect README, docs/**, package/build files, code layout, existing CI/workflow files,',
        'and recent commit/PR history to infer: languages, frameworks, tooling, test setup, and maturity',
        '(prototype vs scale). Honour existing conventions — do not impose unrelated stacks.',
        `Repo: ${repo ?? '(current workspace)'}`,
        'Return JSON: { stack: { languages: string[], frameworks: string[], tooling: string[] }, maturity: "prototype"|"growing"|"scale" }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Detect stack', labels: ['a5c', 'feedback-loop-optimizer'] },
);

const auditLayerTask = defineTask(
  'feedback-loop-optimizer.audit-layer',
  async ({ layer, repo, stack, maturity }, ctx) => {
    return ctx.agent({
      title: `Audit feedback-loop layer: ${layer.id}`,
      prompt: [
        'You are the feedback-loop-optimizer-agent auditing ONE layer.',
        `Layer: ${layer.id}`,
        `Scope: ${layer.description}`,
        'Calibrate scope to repo maturity; propose highest-impact, low-coupling improvements first.',
        'Prefer OSS/free tools and hosted-free tiers. Never commit code — issues/PR comments only.',
        'If information is insufficient, propose a discovery task instead of guessing.',
        `Stack: ${JSON.stringify(stack ?? {})}`,
        `Maturity: ${maturity ?? 'unknown'}`,
        `Repo: ${repo ?? '(current workspace)'}`,
        'Return JSON: { gaps: Array<{ title, summary, currentVsExpected, proposedChanges, acceptanceCriteria: string[], references: string[], severity: "high"|"medium"|"low", areaTag: string, effortHours: number }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Audit feedback-loop layer', labels: ['a5c', 'feedback-loop-optimizer'] },
);

const dedupeGapsTask = defineTask(
  'feedback-loop-optimizer.dedupe-gaps',
  async ({ gaps }, ctx) => {
    return ctx.agent({
      title: `Dedupe ${gaps.length} gap(s) against existing issues`,
      prompt: [
        'Search open and recently-closed issues (gh issue list) for matching tasks. For any gap already',
        'tracked, keep a reference to the existing issue so we can comment/link instead of opening a new one.',
        'Drop gaps that exceed 3h effort unless trivially decomposable; merge near-duplicates within the set.',
        `Gaps: ${JSON.stringify(gaps, null, 2)}`,
        'Return JSON: { unique: Array<same-shape>, duplicates: Array<{ gapTitle, existingIssue: string }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Dedupe feedback-loop gaps', labels: ['a5c', 'feedback-loop-optimizer'] },
);

const openIssueTask = defineTask(
  'feedback-loop-optimizer.open-issue',
  async ({ gap }, ctx) => {
    return ctx.agent({
      title: `Open decoupled issue: ${gap.title}`,
      prompt: [
        'Author one GitHub issue per decoupled task using the standard template:',
        '  Title: "[Feedback] <Short task> — <Area>"',
        '  Body sections: Summary (what/why), Current vs Expected, Proposed Changes',
        '    (avoid editing .github/workflows directly — suggest scripts/ or config files),',
        '    Acceptance Criteria (bullet list, testable), References (paths, PRs, docs).',
        'Required labels: "feedback-loop-optimizer" plus specifics from:',
        '  testing | e2e | lint | format | coverage | ci | monitoring | logging | tracing | alerts | oncall | docs | enhancement | bug | pre-commit.',
        'Use gh CLI. Never commit code. Do not propose destructive migrations without a replacement plan.',
        `Gap: ${JSON.stringify(gap, null, 2)}`,
        'Return JSON: { opened?: string, dedupedTo?: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Open decoupled feedback-loop issue', labels: ['a5c', 'feedback-loop-optimizer'] },
);

export async function process(inputs, ctx) {
  const { repo, focusLayers } = inputs ?? {};
  const layers = Array.isArray(focusLayers) && focusLayers.length
    ? DEFAULT_LAYERS.filter((l) => focusLayers.includes(l.id))
    : DEFAULT_LAYERS;

  // Phase 1: stack detection calibrates every subsequent audit.
  const detection = await ctx.task(detectStackTask, { repo });
  const stack = detection?.stack ?? {};
  const maturity = detection?.maturity ?? 'unknown';

  // Phase 2: audit all layers in parallel.
  const audits = await ctx.parallel.map(layers, (layer) =>
    ctx.task(auditLayerTask, { layer, repo, stack, maturity }),
  );
  const gaps = audits.flatMap((a) => (Array.isArray(a?.gaps) ? a.gaps : []));

  if (gaps.length === 0) {
    return { success: true, stack, gapsFound: 0, issuesOpened: [] };
  }

  // Phase 3: dedup against existing issues + drop oversized gaps.
  const deduped = await ctx.task(dedupeGapsTask, { gaps });
  const unique = Array.isArray(deduped?.unique) ? deduped.unique : gaps;

  if (unique.length === 0) {
    return { success: true, stack, gapsFound: 0, issuesOpened: [] };
  }

  // Phase 4: open one decoupled issue per remaining gap, in parallel.
  const results = await ctx.parallel.map(unique, (gap) => ctx.task(openIssueTask, { gap }));
  const issuesOpened = results.map((r) => r?.opened).filter(Boolean);

  return { success: true, stack, gapsFound: unique.length, issuesOpened };
}
