/**
 * @process specializations/collaboration/github/conflict-resolver
 * @description Merge-conflict resolver. Detects conflicts, checks whether upstream already
 *   covers the PR (safe-close if so), otherwise rewrites the PR branch in place: rebase onto
 *   base, resolve each conflict category, verify locally, force-push-with-lease, re-invoke
 *   validator. Works DIRECTLY on the existing PR branch — never creates a new branch/PR.
 * @inputs { pr: object }
 * @outputs { success, outcome, summary }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/development/conflict-resolver-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:engineering-manager, role:backend-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const detectConflictsTask = defineTask(
  'conflict-resolver.detect-conflicts',
  async ({ pr }, ctx) => {
    return ctx.agent({
      title: `Detect conflicting files for PR #${pr?.number ?? '?'}`,
      prompt: [
        'You are the conflict-resolver-agent. Fetch base + PR branch and enumerate conflicting files.',
        'For each conflicting file, classify: simple-line | structural | logic | dependency.',
        `PR: ${JSON.stringify(pr ?? {}, null, 2)}`,
        'Return JSON: { files: Array<{ path, kind }>, markerFiles: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Detect conflicts', labels: ['a5c', 'conflict-resolver'] },
);

const checkUpstreamCoverageTask = defineTask(
  'conflict-resolver.check-upstream-coverage',
  async ({ pr }, ctx) => {
    return ctx.agent({
      title: `Check if upstream already covers PR #${pr?.number ?? '?'}`,
      prompt: [
        'Before attempting resolution, check whether the PR\'s intent has already landed on base via another PR.',
        'Compare PR branch diff against current base HEAD. If base now contains equivalent changes, the PR is redundant.',
        `PR: ${JSON.stringify(pr ?? {}, null, 2)}`,
        'Return JSON: { upstreamCovers: boolean, evidence: string, closePr: boolean }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Check upstream coverage', labels: ['a5c', 'conflict-resolver'] },
);

const safeClosePrTask = defineTask(
  'conflict-resolver.safe-close-pr',
  async ({ pr, evidence }, ctx) => {
    return ctx.agent({
      title: `Close redundant PR #${pr?.number ?? '?'} (upstream covers)`,
      prompt: [
        'Close the PR with a new comment linking the superseding change.',
        'Also close any associated issue if it is fully covered by the upstream landing.',
        `Evidence: ${evidence}`,
        'Return JSON: { closed: true }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Safe-close redundant PR', labels: ['a5c', 'conflict-resolver'] },
);

const resolveFilesTask = defineTask(
  'conflict-resolver.resolve-files',
  async ({ pr, files }, ctx) => {
    return ctx.agent({
      title: `Resolve ${files.length} conflicting file(s) on PR #${pr?.number ?? '?'} branch`,
      prompt: [
        'Work DIRECTLY on the existing PR branch. NEVER create a new branch or PR.',
        'Rebase PR branch onto current base. For each conflicting file, resolve by category:',
        '  - simple-line: merge overlapping edits, preserve formatting.',
        '  - structural: reconcile signature/class changes, keep both intents where possible.',
        '  - logic: evaluate both approaches; choose the better or combine; document the call in a code comment.',
        '  - dependency: research compatibility, pick versions that satisfy both sides.',
        'Remove any stray branch markers, a5c markers, or GitHub temp files introduced by the conflict.',
        `PR: ${JSON.stringify(pr ?? {}, null, 2)}`,
        `Files: ${JSON.stringify(files, null, 2)}`,
        'Return JSON: { resolved: boolean, escalated: boolean, notes: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Resolve conflicting files', labels: ['a5c', 'conflict-resolver'] },
);

const verifyLocallyTask = defineTask(
  'conflict-resolver.verify-locally',
  async ({ pr }, ctx) => {
    return ctx.task({
      kind: 'node',
      title: `Verify build+tests after conflict resolution on PR #${pr?.number ?? '?'}`,
      prompt: 'Run build and test suite on the resolved tree. Return JSON: { build: boolean, tests: boolean, summary: string }.',
    });
  },
  { kind: 'node', title: 'Verify conflict resolution locally', labels: ['a5c', 'conflict-resolver', 'ci'] },
);

const pushAndRetriggerValidatorTask = defineTask(
  'conflict-resolver.push-and-retrigger-validator',
  async ({ pr, notes }, ctx) => {
    return ctx.agent({
      title: `Force-push-with-lease PR #${pr?.number ?? '?'} and re-invoke validator`,
      prompt: [
        'Commit with a clear message, force-push-with-lease to the PR head, update PR description with resolution notes.',
        'Post a NEW PR comment mentioning @validator-agent for re-review.',
        `Resolution notes: ${notes}`,
        'Return JSON: { pushed: true }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Push + retrigger validator', labels: ['a5c', 'conflict-resolver'] },
);

export async function process(inputs, ctx) {
  const { pr = {} } = inputs ?? {};

  const detection = await ctx.task(detectConflictsTask, { pr });
  const files = Array.isArray(detection?.files) ? detection.files : [];

  const cover = await ctx.task(checkUpstreamCoverageTask, { pr });
  if (cover?.upstreamCovers && cover?.closePr) {
    await ctx.task(safeClosePrTask, { pr, evidence: cover.evidence ?? '' });
    return { success: true, outcome: 'closed-upstream-covers', summary: cover.evidence ?? 'Upstream already covers.' };
  }

  if (files.length === 0) {
    return { success: true, outcome: 'no-conflicts', summary: 'No conflicting files detected.' };
  }

  const resolution = await ctx.task(resolveFilesTask, { pr, files });
  if (resolution?.escalated || !resolution?.resolved) {
    return { success: false, outcome: 'escalated', summary: resolution?.notes ?? 'Escalated to maintainer.' };
  }

  const verify = await ctx.task(verifyLocallyTask, { pr });
  if (!(verify?.build && verify?.tests)) {
    return { success: false, outcome: 'verification-failed', summary: verify?.summary ?? 'Build or tests failed post-resolution.' };
  }

  await ctx.task(pushAndRetriggerValidatorTask, { pr, notes: resolution.notes ?? '' });
  return { success: true, outcome: 'resolved', summary: resolution.notes ?? '' };
}
