/**
 * @process specializations/collaboration/github/pr-lifecycle-dependency-bump
 * @description Dependency-bump (dependabot/renovate) lifecycle: verify lock-file-only change → classify semver impact → require green CI → auto-merge patch/minor, require human approval for major.
 * @inputs { event: string, pr: object, ciStatus: "pending"|"success"|"failure", changelogSummary?: string }
 * @outputs { success: boolean, semverImpact: string, mergeAction: string, blockers: string[] }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:dependency-upgrade-strategies, skill-area:dependency-vulnerability-mgmt]
 *   workflows: [workflow:code-review, workflow:dependency-update, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const LOCK_FILE_RE = /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|go\.sum|Cargo\.lock|poetry\.lock|requirements\.txt|Gemfile\.lock)$/i;
const MANIFEST_RE = /(package\.json|go\.mod|Cargo\.toml|pyproject\.toml|Gemfile)$/i;

const classifySemverTask = defineTask(
  'dep-bump.classify',
  async ({ pr, changelogSummary }, ctx) => {
    return ctx.agent({
      title: 'Classify dependency bump semver impact',
      prompt: [
        'Classify the semver impact of this dependency bump.',
        `Title: ${pr.title}`,
        `Body: ${pr.body}`,
        `Changelog: ${changelogSummary ?? '(none provided)'}`,
        'Categories:',
        '- patch: x.y.Z bump, bugfixes only, no API changes.',
        '- minor: x.Y.0 bump, backward-compatible additions.',
        '- major: X.0.0 bump, breaking changes expected.',
        '- security: CVE or security advisory, prioritize regardless of semver.',
        '- unknown: cannot determine from available info.',
        'Return JSON: { semverImpact, rationale, breakingChanges?: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Classify semver', labels: ['collaboration', 'dependency'] },
);

const manualApproveTask = defineTask(
  'dep-bump.manual-approve',
  async ({ pr, classification }, ctx) => {
    return ctx.breakpoint({
      breakpointId: 'dep-bump.manual-approve',
      title: `Major dependency bump review: ${pr.repo}#${pr.number}`,
      expert: 'owner',
      tags: ['dependency', 'major'],
      prompt: [
        `Review major dependency bump: ${pr.title}`,
        `Breaking changes: ${JSON.stringify(classification.breakingChanges ?? [])}`,
        'Approve only if breaking changes are accommodated in this PR or a follow-up is scheduled.',
      ].join('\n\n'),
    });
  },
  { kind: 'breakpoint', title: 'Major bump approval', labels: ['dependency', 'major'] },
);

export async function process(inputs, ctx) {
  const { pr, ciStatus } = inputs;
  const blockers = [];

  const nonLockChanges = pr.changedFiles.filter(
    (f) => !LOCK_FILE_RE.test(f) && !MANIFEST_RE.test(f),
  );
  if (nonLockChanges.length > 0) {
    blockers.push(`non-lock-files-changed: ${nonLockChanges.slice(0, 5).join(', ')}`);
    return { success: false, semverImpact: 'unknown', mergeAction: 'block', blockers };
  }

  const classification = await ctx.task(classifySemverTask, inputs);

  if (ciStatus !== 'success') {
    blockers.push(`ci-not-green: ${ciStatus}`);
    return { success: false, semverImpact: classification.semverImpact, mergeAction: 'wait-for-ci', blockers };
  }

  if (classification.semverImpact === 'major' || classification.semverImpact === 'unknown') {
    const approval = await ctx.task(manualApproveTask, { pr, classification });
    if (!approval.approved) {
      blockers.push('major-bump-denied');
      return { success: false, semverImpact: classification.semverImpact, mergeAction: 'block', blockers };
    }
    return { success: true, semverImpact: classification.semverImpact, mergeAction: 'auto-merge-after-approval', blockers };
  }

  // patch / minor / security → auto-merge
  return {
    success: true,
    semverImpact: classification.semverImpact,
    mergeAction: 'auto-merge',
    blockers,
  };
}
