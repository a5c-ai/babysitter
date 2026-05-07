/**
 * @process processes/shared/ci/build-fixer
 * @description CI failure triage. Fetch logs → gate (only act on primary branches) → search
 *   for pre-existing issue/PR → classify (project-code | infra | flaky-test) → run per-category
 *   playbook → verify locally → communicate. Never disables functionality to make CI green.
 * @inputs { workflowRun: object, failureLogs?: string, repo?: string }
 * @outputs { success, category, artifact?, skipped? }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/development/build-fixer-agent.prompt.md
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const fetchLogsTask = defineTask(
  'build-fixer.fetch-logs',
  async ({ workflowRun, failureLogs }, ctx) => {
    return ctx.agent({
      title: `Fetch + summarise logs for run ${workflowRun?.id ?? '?'}`,
      prompt: [
        'Retrieve workflow run logs via gh cli (or API with GITHUB_TOKEN fallback).',
        'Identify failing steps, extract error messages + stack traces, download artifacts if present (screenshots, e2e results).',
        'Locate the .github/workflows/ file that defines the failing job.',
        `Workflow run: ${JSON.stringify(workflowRun ?? {}, null, 2)}`,
        `Pre-fetched logs (may be empty): ${(failureLogs ?? '').slice(0, 20000)}`,
        'Return JSON: { errorSummary: string, failingSteps: string[], workflowFile: string, branch: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Fetch CI logs', labels: ['a5c', 'build-fixer', 'ci'] },
);

const primaryBranchGateTask = defineTask(
  'build-fixer.primary-branch-gate',
  async ({ branch }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: `Gate: primary branch check for "${branch}"`,
      prompt: [
        'Return JSON: { primary: boolean, reason: string }.',
        'primary=true only if branch matches main|master|develop|a5c/main|release/*.',
        `Branch: ${branch}`,
      ].join('\n'),
    });
  },
  { kind: 'node', title: 'Primary-branch gate', labels: ['a5c', 'build-fixer'] },
);

const dedupeAgainstExistingTask = defineTask(
  'build-fixer.dedupe-against-existing',
  async ({ errorSummary }, ctx) => {
    return ctx.agent({
      title: 'Search for existing open issue/PR with same root cause',
      prompt: [
        'Search repo issues/PRs (labels build, bug) for one already tracking this failure.',
        'If found, we will comment on it and skip action. Otherwise proceed to classify.',
        `Error summary: ${errorSummary}`,
        'Return JSON: { duplicate: boolean, existingRef?: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Dedupe against existing', labels: ['a5c', 'build-fixer'] },
);

const classifyTask = defineTask(
  'build-fixer.classify',
  async ({ errorSummary, workflowFile }, ctx) => {
    return ctx.agent({
      title: 'Classify failure category',
      prompt: [
        'Classify the failure:',
        '  - project-code: real bug in repo code (compile error, logic bug surfaced by test).',
        '  - infra: build/CI config, dependency pin, tool version, env setup problem.',
        '  - flaky-test: specific intermittent/environment-sensitive test; not a code bug.',
        `Error summary: ${errorSummary}`,
        `Workflow file: ${workflowFile}`,
        'Return JSON: { category: "project-code"|"infra"|"flaky-test"|"unknown", rootCause: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Classify CI failure', labels: ['a5c', 'build-fixer'] },
);

const fixProjectCodeTask = defineTask(
  'build-fixer.fix-project-code',
  async ({ workflowRun, classification }, ctx) => {
    return ctx.agent({
      title: 'Open PR fixing project-code failure (Cat 1)',
      prompt: [
        'Fix the real underlying issue. Do NOT disable tests or mask failures.',
        'Verify the fix locally (build+tests) before opening the PR.',
        'PR body: root cause, verification steps performed, link to failing workflow run.',
        'Labels: "build", "bug", priority label.',
        `Run: ${JSON.stringify(workflowRun ?? {})}`,
        `Classification: ${JSON.stringify(classification)}`,
        'Return JSON: { prUrl: string, verified: boolean }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Fix project code', labels: ['a5c', 'build-fixer'] },
);

const fixInfraTask = defineTask(
  'build-fixer.fix-infra',
  async ({ workflowRun, classification }, ctx) => {
    return ctx.agent({
      title: 'Open PR fixing infra/config failure (Cat 2)',
      prompt: [
        'Fix the CI config / dependency pin / tool version / env setup. Never mask — fix root cause.',
        'Verify the fix locally (run the same commands the failing step did) before opening the PR.',
        'Labels: "build", "infra", priority label.',
        `Run: ${JSON.stringify(workflowRun ?? {})}`,
        `Classification: ${JSON.stringify(classification)}`,
        'Return JSON: { prUrl: string, verified: boolean }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Fix infra', labels: ['a5c', 'build-fixer'] },
);

const fileFlakyIssueTask = defineTask(
  'build-fixer.file-flaky-issue',
  async ({ workflowRun, classification }, ctx) => {
    return ctx.agent({
      title: 'File consolidated flaky-test issue (Cat 3)',
      prompt: [
        'Do NOT self-fix flaky tests. File a consolidated issue grouping related flakes; tag @developer-agent.',
        'Include: test name(s), failure context, workflow run link, reproduction hints.',
        'Labels: "build", "bug", "flaky", priority label.',
        `Run: ${JSON.stringify(workflowRun ?? {})}`,
        `Classification: ${JSON.stringify(classification)}`,
        'Return JSON: { issueUrl: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'File flaky-test issue', labels: ['a5c', 'build-fixer'] },
);

export async function process(inputs, ctx) {
  const { workflowRun = {}, failureLogs = '' } = inputs ?? {};

  const logs = await ctx.task(fetchLogsTask, { workflowRun, failureLogs });
  const gate = await ctx.task(primaryBranchGateTask, { branch: logs?.branch ?? '' });
  if (!gate?.primary) {
    return { success: true, category: 'unknown', skipped: true, artifact: `non-primary branch: ${gate?.reason ?? ''}` };
  }

  const dedupe = await ctx.task(dedupeAgainstExistingTask, { errorSummary: logs?.errorSummary ?? '' });
  if (dedupe?.duplicate) {
    return { success: true, category: 'unknown', skipped: true, artifact: `duplicate: ${dedupe.existingRef ?? ''}` };
  }

  const classification = await ctx.task(classifyTask, {
    errorSummary: logs?.errorSummary ?? '',
    workflowFile: logs?.workflowFile ?? '',
  });
  const category = classification?.category ?? 'unknown';

  let artifact;
  if (category === 'project-code') {
    const fix = await ctx.task(fixProjectCodeTask, { workflowRun, classification });
    artifact = fix?.prUrl;
  } else if (category === 'infra') {
    const fix = await ctx.task(fixInfraTask, { workflowRun, classification });
    artifact = fix?.prUrl;
  } else if (category === 'flaky-test') {
    const file = await ctx.task(fileFlakyIssueTask, { workflowRun, classification });
    artifact = file?.issueUrl;
  }

  return { success: category !== 'unknown', category, artifact };
}
