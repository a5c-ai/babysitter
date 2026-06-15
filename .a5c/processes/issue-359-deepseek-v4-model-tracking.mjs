/**
 * @process repo/issue-359-deepseek-v4-model-tracking
 * @description Track DeepSeek V4 Pro and DeepSeek V4 Flash in Atlas graph metadata.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string, modelIds: string[], verificationCommands: string[] }
 * @outputs { success: boolean, changedFiles: string[], verification: object, pullRequest: string }
 *
 * References used while authoring:
 * - .a5c/processes/issue-320-openclaw-2026-5-22.mjs
 * - .a5c/processes/issue-324-droid-0-132-1-assimilation.mjs
 * - docs/agent-reference/process-authoring.md
 *
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 359;
  const baseBranch = inputs.baseBranch ?? 'staging';
  const workBranch = inputs.workBranch ?? 'agent/issue-359';
  const modelIds = inputs.modelIds ?? [
    'model:deepseek-v4-pro@current',
    'model:deepseek-v4-flash@current',
  ];
  const verificationCommands = inputs.verificationCommands ?? [
    'npm run verify:metadata',
    'npm run validate:edges',
  ];

  const issueSpec = await ctx.task(readIssueSpecTask, { issueNumber }, { key: 'issue-359.issue-spec' });
  const associatedPrs = await ctx.task(findAssociatedPrTask, { issueNumber }, { key: 'issue-359.associated-prs' });
  await ctx.task(ensureBranchTask, { workBranch }, { key: 'issue-359.ensure-branch' });
  const graphAudit = await ctx.task(auditDeepSeekGraphTask, { modelIds }, { key: 'issue-359.graph-audit' });

  const implementation = await ctx.task(implementDeepSeekV4Task, {
    issueSpec: taskStdout(issueSpec),
    associatedPrs: taskStdout(associatedPrs),
    graphAudit: taskStdout(graphAudit),
    modelIds,
  }, { key: 'issue-359.implementation' });

  const requiredSurfaceVerification = await ctx.task(verifyDeepSeekV4SurfaceTask, { modelIds }, {
    key: 'issue-359.verify-required-surfaces',
  });

  const qualityResults = [];
  for (let index = 0; index < verificationCommands.length; index += 1) {
    qualityResults.push(await ctx.task(runQualityCommandTask, {
      command: verificationCommands[index],
      index: index + 1,
    }, { key: `issue-359.quality.${index + 1}` }));
  }

  const diff = await ctx.task(summarizeDiffTask, {}, { key: 'issue-359.diff' });
  const commit = await ctx.task(commitChangesTask, { issueNumber }, { key: 'issue-359.commit' });
  await ctx.task(pushBranchTask, { workBranch }, { key: 'issue-359.push' });
  const pullRequest = await ctx.task(createPullRequestTask, {
    issueNumber,
    baseBranch,
    workBranch,
  }, { key: 'issue-359.pr' });
  const issueComment = await ctx.task(commentOnIssueTask, {
    issueNumber,
    pullRequest: taskStdout(pullRequest),
    verificationCommands,
  }, { key: 'issue-359.issue-comment' });

  return {
    success: true,
    changedFiles: implementation?.changedFiles ?? [],
    associatedPrs: taskStdout(associatedPrs),
    verification: {
      requiredSurfaceVerification,
      qualityResults,
    },
    diff: taskStdout(diff),
    commit: taskStdout(commit),
    pullRequest: taskStdout(pullRequest),
    issueComment: taskStdout(issueComment),
  };
}

export const readIssueSpecTask = defineTask('issue-359.read-issue-spec', ({ issueNumber }) => ({
  kind: 'shell',
  title: 'Read issue #359 spec from GitHub',
  command: `gh issue view ${issueNumber} --json title,body,labels,comments`,
  expectedExitCode: 0,
  labels: ['github', 'spec', 'issue'],
}));

export const findAssociatedPrTask = defineTask('issue-359.find-associated-pr', ({ issueNumber }) => ({
  kind: 'shell',
  title: 'Check for associated open PRs',
  command: `gh pr list --state open --search "${issueNumber}" --json number,title,headRefName,baseRefName,url,body --limit 20`,
  expectedExitCode: 0,
  labels: ['github', 'branch-policy'],
}));

export const ensureBranchTask = defineTask('issue-359.ensure-branch', ({ workBranch }) => ({
  kind: 'shell',
  title: 'Ensure issue work branch is checked out',
  command: `current=$(git branch --show-current)\nif [ "$current" != "${workBranch}" ]; then git switch "${workBranch}"; fi\ngit branch --show-current`,
  expectedExitCode: 0,
  labels: ['git', 'branch-policy'],
}));

export const auditDeepSeekGraphTask = defineTask('issue-359.audit-deepseek-graph', ({ modelIds }) => ({
  kind: 'shell',
  title: 'Audit existing DeepSeek V4 graph metadata',
  command: [
    'set -euo pipefail',
    'rg -n "deepseek-v4|DeepSeek V4|news260424" packages/atlas/graph/compute packages/atlas/graph/catalog-meta || true',
    'sed -n "1,120p" packages/atlas/graph/compute/model-families/deepseek.yaml',
    'sed -n "1,160p" packages/atlas/graph/compute/providers/deepseek.yaml',
    'sed -n "1,90p" packages/atlas/graph/compute/providers/together-ai.yaml',
    'sed -n "1,90p" packages/atlas/graph/compute/providers/fireworks-ai.yaml',
    ...modelIds.map((modelId) => `rg -n "${modelId}" packages/atlas/graph || true`),
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['graph', 'audit'],
}));

export const implementDeepSeekV4Task = defineTask('issue-359.implement-deepseek-v4', ({
  issueSpec,
  associatedPrs,
  graphAudit,
  modelIds,
}) => ({
  kind: 'agent',
  title: 'Implement DeepSeek V4 Pro and Flash graph tracking',
  labels: ['graph-update', 'model-version-update', 'deepseek'],
  agent: {
    name: 'atlas-model-graph-maintainer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update the repository so DeepSeek V4 Pro and DeepSeek V4 Flash are fully tracked in Atlas graph metadata.',
      instructions: [
        'Treat SPEC as the source of truth. Compare SPEC to GRAPH AUDIT directly before editing.',
        `Required model IDs: ${modelIds.join(', ')}.`,
        'Preserve existing graph style and YAML shape. Keep scope limited to DeepSeek V4 model/provider/family/evidence metadata and focused verification support.',
        'If model files already exist, complete missing graph links instead of duplicating nodes.',
        'Ensure the DeepSeek model family has_version edges include both V4 models.',
        'Ensure provider serves edges and model served_by edges are symmetric for verified DeepSeek, Together AI, and Fireworks AI availability. Do not add Hyperbolic V4 service unless verified in the repo evidence.',
        'Add evidence/source/claim metadata if the current graph convention requires model-version claims for current models.',
        'Do not commit generated dist artifacts or unrelated plugin/workspace files.',
        'Return JSON: { changedFiles: string[], summary: string, verificationHints: string[], unresolvedItems: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        issueSpec,
        '---',
        '',
        'ASSOCIATED PR SEARCH (verbatim):',
        '---',
        associatedPrs,
        '---',
        '',
        'GRAPH AUDIT (verbatim):',
        '---',
        graphAudit,
        '---',
      ],
    },
  },
}));

export const verifyDeepSeekV4SurfaceTask = defineTask('issue-359.verify-deepseek-v4-surface', ({ modelIds }) => ({
  kind: 'shell',
  title: 'Verify required DeepSeek V4 graph surfaces',
  command: [
    'set -euo pipefail',
    ...modelIds.map((modelId) => `rg -n "${modelId}" packages/atlas/graph/compute/models packages/atlas/graph/compute/model-families/deepseek.yaml packages/atlas/graph/compute/providers/deepseek.yaml packages/atlas/graph/compute/providers/together-ai.yaml packages/atlas/graph/compute/providers/fireworks-ai.yaml >/dev/null`),
    'rg -n "deepseek-v4-pro@current" packages/atlas/graph/compute/model-families/deepseek.yaml >/dev/null',
    'rg -n "deepseek-v4-flash@current" packages/atlas/graph/compute/model-families/deepseek.yaml >/dev/null',
    'rg -n "contextWindowTokens: 1000000" packages/atlas/graph/compute/models/deepseek-v4-pro.yaml packages/atlas/graph/compute/models/deepseek-v4-flash.yaml >/dev/null',
    'rg -n "releaseDate: .2026-04-24." packages/atlas/graph/compute/models/deepseek-v4-pro.yaml packages/atlas/graph/compute/models/deepseek-v4-flash.yaml >/dev/null',
    'rg -n "news260424|deepseek-V4-model-card" packages/atlas/graph/compute/models/deepseek-v4-pro.yaml packages/atlas/graph/compute/models/deepseek-v4-flash.yaml packages/atlas/graph/catalog-meta >/dev/null',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['verification', 'graph'],
}));

export const runQualityCommandTask = defineTask('issue-359.run-quality-command', ({ command, index }) => ({
  kind: 'shell',
  title: `Run quality command ${index}`,
  command,
  expectedExitCode: 0,
  labels: ['verification', 'quality-gate'],
}));

export const summarizeDiffTask = defineTask('issue-359.summarize-diff', () => ({
  kind: 'shell',
  title: 'Summarize DeepSeek V4 graph diff',
  command: 'git diff -- packages/atlas/graph/compute packages/atlas/graph/catalog-meta',
  expectedExitCode: 0,
  labels: ['git', 'review'],
}));

export const commitChangesTask = defineTask('issue-359.commit-changes', ({ issueNumber }) => ({
  kind: 'shell',
  title: 'Commit issue changes',
  command: [
    'set -euo pipefail',
    'git status --short',
    'git add -f .a5c/processes/issue-359-deepseek-v4-model-tracking.mjs .a5c/processes/issue-359-deepseek-v4-model-tracking.inputs.json',
    'git add packages/atlas/graph/compute/model-families/deepseek.yaml',
    'git add packages/atlas/graph/compute/models/deepseek-v4-pro.yaml packages/atlas/graph/compute/models/deepseek-v4-flash.yaml',
    'git add packages/atlas/graph/compute/providers/deepseek.yaml packages/atlas/graph/compute/providers/together-ai.yaml packages/atlas/graph/compute/providers/fireworks-ai.yaml',
    'git add packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims 2>/dev/null || true',
    'if git diff --cached --quiet; then echo "No issue changes to commit"; exit 0; fi',
    [
      'GIT_AUTHOR_NAME="a5c automation"',
      'GIT_AUTHOR_EMAIL="automation@a5c.ai"',
      'GIT_COMMITTER_NAME="a5c automation"',
      'GIT_COMMITTER_EMAIL="automation@a5c.ai"',
      'git commit -m "Track DeepSeek V4 models in Atlas graph" -m "Closes #359"',
    ].join(' '),
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['git', 'commit'],
}));

export const pushBranchTask = defineTask('issue-359.push-branch', ({ workBranch }) => ({
  kind: 'shell',
  title: 'Push issue branch',
  command: `git push -u origin ${workBranch}`,
  expectedExitCode: 0,
  labels: ['git', 'push'],
}));

export const createPullRequestTask = defineTask('issue-359.create-pr', ({ issueNumber, baseBranch, workBranch }) => ({
  kind: 'shell',
  title: 'Create or report pull request',
  command: [
    'set -euo pipefail',
    `existing=$(gh pr list --state open --head "${workBranch}" --json url --jq '.[0].url // ""')`,
    'if [ -n "$existing" ]; then echo "$existing"; exit 0; fi',
    `gh pr create --base "${baseBranch}" --head "${workBranch}" --title "Track DeepSeek V4 Pro and Flash" --body "Closes #${issueNumber}\\n\\nTracks DeepSeek V4 Pro and DeepSeek V4 Flash in Atlas graph metadata and verifies graph consistency."`,
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['github', 'pr'],
}));

export const commentOnIssueTask = defineTask('issue-359.comment-on-issue', ({ issueNumber, pullRequest, verificationCommands }) => ({
  kind: 'shell',
  title: 'Post issue summary comment',
  command: [
    'set -euo pipefail',
    'body=$(mktemp)',
    'cat > "$body" <<EOF',
    'Implemented DeepSeek V4 Pro and DeepSeek V4 Flash tracking.',
    '',
    'Summary:',
    '- Completed Atlas graph model/family/provider tracking for DeepSeek V4 Pro and Flash.',
    '- Added/updated evidence-backed graph metadata where required by current graph conventions.',
    `- PR: ${pullRequest.trim() || '(created in this run)'}`,
    '',
    'Verification:',
    ...verificationCommands.map((command) => `- \`${command.replaceAll('`', '\\`')}\``),
    'EOF',
    `gh issue comment ${issueNumber} --body-file "$body"`,
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['github', 'issue-comment'],
}));
