/**
 * @process specializations/collaboration/github/pr-lifecycle-router
 * @description Dispatches to the appropriate pr-lifecycle variant based on (event × inferred change type). One entry point; many lifecycles.
 * @inputs { event: "pr-opened"|"pr-synchronize"|"pr-ready-for-review"|"pr-comment-mention"|"pr-merged", pr: { number, repo, title, body, labels: string[], author: { login, isBot }, changedFiles: string[], baseBranch: string, headBranch: string, isDraft: boolean }, comment?: object }
 * @outputs { success: boolean, selectedLifecycle: string, lifecycleResult: object, changeType: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops, skill-area:orchestration-loop]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { process as featureLifecycle } from './pr-lifecycle-feature.js';
import { process as hotfixLifecycle } from './pr-lifecycle-hotfix.js';
import { process as dependencyLifecycle } from './pr-lifecycle-dependency-bump.js';
import { process as securityLifecycle } from './pr-lifecycle-security.js';
import { process as docsLifecycle } from './pr-lifecycle-docs.js';
import { process as commentLifecycle } from './pr-lifecycle-comment-response.js';

const classifyTask = defineTask(
  'pr-router.classify',
  async ({ pr }, ctx) => {
    return ctx.agent({
      title: 'Classify PR change type',
      prompt: [
        'Classify the PR into exactly one change type.',
        `Title: ${pr.title}`,
        `Body: ${pr.body}`,
        `Labels: ${JSON.stringify(pr.labels)}`,
        `Base → Head: ${pr.baseBranch} → ${pr.headBranch}`,
        `Author: ${pr.author.login}${pr.author.isBot ? ' (bot)' : ''}`,
        `Changed files (${pr.changedFiles.length}): ${pr.changedFiles.slice(0, 40).join(', ')}`,
        '',
        'Change types:',
        '- hotfix: urgent production fix targeting main/master; branch name starts with hotfix/.',
        '- security: CVE/advisory/embargo-related; label `security` or security-* paths.',
        '- dependency-bump: dependabot/renovate bot author OR package-lock/go.sum/pnpm-lock only.',
        '- docs: docs-only changes (*.md, docs/**) with no code.',
        '- feature: new capability, non-urgent.',
        '- bugfix: non-urgent bug fix.',
        '- chore: refactor/test/tooling only; no behavior change.',
        '',
        'Return JSON: { changeType, rationale, confidence: "low"|"medium"|"high" }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Classify PR', labels: ['collaboration', 'pr-router'] },
);

const LIFECYCLE_MAP = {
  hotfix: { name: 'hotfix', fn: hotfixLifecycle },
  security: { name: 'security', fn: securityLifecycle },
  'dependency-bump': { name: 'dependency-bump', fn: dependencyLifecycle },
  docs: { name: 'docs', fn: docsLifecycle },
  feature: { name: 'feature', fn: featureLifecycle },
  bugfix: { name: 'feature', fn: featureLifecycle }, // bugfix uses same gates as feature
  chore: { name: 'feature', fn: featureLifecycle },
};

export async function process(inputs, ctx) {
  const { event, pr } = inputs;

  // Comment-mention events always route to the comment-response lifecycle
  // regardless of underlying change type.
  if (event === 'pr-comment-mention') {
    const result = await commentLifecycle(inputs, ctx);
    return { success: result.success !== false, selectedLifecycle: 'comment-response', lifecycleResult: result, changeType: 'comment-response' };
  }

  // Fast-path classification for obvious bot/lock-file PRs to skip the LLM.
  let changeType;
  let classification;
  if (pr.author?.isBot && pr.changedFiles.every((f) => /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|go\.sum|Cargo\.lock|poetry\.lock|requirements\.txt)$/i.test(f))) {
    changeType = 'dependency-bump';
  } else {
    classification = await ctx.task(classifyTask, { pr });
    changeType = classification.changeType;
  }

  const entry = LIFECYCLE_MAP[changeType] ?? LIFECYCLE_MAP.feature;
  const result = await entry.fn(inputs, ctx);
  return {
    success: result.success !== false,
    selectedLifecycle: entry.name,
    lifecycleResult: result,
    changeType,
    classification,
  };
}
