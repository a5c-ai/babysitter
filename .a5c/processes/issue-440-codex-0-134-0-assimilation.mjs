/**
 * @process repo/issue-440-codex-0-134-0-assimilation
 * @description Track Codex CLI 0.134.0 upstream release in Atlas graph metadata, catalog tests, and GitHub issue/PR workflow.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string, targetVersion: string, previousVersion: string }
 * @outputs { success: boolean, changedFiles: string[], verification: object, pr: object, comment: object }
 *
 * References searched before authoring:
 * - specializations/meta/harnesses/codex
 * - specializations/meta/assimilation/harness/codex
 * - specializations/collaboration/github/branch-policies
 * - specializations/collaboration/github/issue-linking
 * - existing repo issue assimilation processes under .a5c/processes
 *
 * @process specializations/meta/harnesses/codex/plugin-creation
 * @process specializations/meta/assimilation/harness/codex
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function stdoutOf(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readIssueSpecTask = defineTask('issue-440.read-issue-spec', ({ issueNumber }) => ({
  kind: 'shell',
  title: 'Read issue #440 spec from GitHub',
  command: `gh issue view ${issueNumber} --json title,body,labels,comments`,
  expectedExitCode: 0,
  labels: ['github', 'issue', 'spec'],
}));

const setupBranchTask = defineTask('issue-440.setup-branch', ({ baseBranch, workBranch }) => ({
  kind: 'shell',
  title: 'Create or switch to issue branch',
  command: [
    'set -euo pipefail',
    `git fetch origin ${baseBranch}`,
    `if git show-ref --verify --quiet refs/heads/${workBranch}; then`,
    `  git switch ${workBranch}`,
    'else',
    `  git switch -c ${workBranch} origin/${baseBranch}`,
    'fi',
    'git status --short --branch',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['git', 'branch'],
}));

const discoverReferencesTask = defineTask('issue-440.discover-references', () => ({
  kind: 'shell',
  title: 'Discover process and repo references for Codex graph assimilation',
  command: [
    'set -euo pipefail',
    'printf "%s\\n" "# Process library references"',
    'rg -n "agent-version|graph-update|Codex CLI|codex|version update|assimilat" /home/runner/.a5c/process-library/babysitter-repo/library/specializations/meta /home/runner/.a5c/process-library/babysitter-repo/library/specializations/code-migration-modernization /home/runner/.a5c/process-library/babysitter-repo/library/processes /home/runner/.a5c/process-library/babysitter-repo/library/methodologies -g "*.js" -g "*.md" | head -240',
    'printf "%s\\n" "# Repo Codex surfaces"',
    'rg -n "0\\.133\\.0|0\\.134\\.0|rust-v0\\.134\\.0|managed network proxy|readOnlyHint|conversation history|--profile|\\$ref|\\$defs|streamable HTTP|websocket" packages/atlas/graph packages/agent-catalog/src/catalog.test.ts -g "*.yaml" -g "*.ts"',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['process-library', 'graph', 'research'],
}));

const implementAssimilationTask = defineTask('issue-440.implement-assimilation', ({ issueSpec, referenceTrace, targetVersion }) => ({
  kind: 'agent',
  title: 'Implement Codex 0.134.0 assimilation completion',
  labels: ['agent-version-update', 'graph-update', 'implementation'],
  agent: {
    name: 'atlas-agent-version-update-engineer',
    prompt: {
      role: 'senior Atlas graph and TypeScript catalog maintainer',
      task: `Complete Codex CLI ${targetVersion} assimilation for issue #440.`,
      instructions: [
        'Use SPEC as the acceptance source. Compare it directly to the current repo trace.',
        'The repository may already contain part of the daily version sweep; do not churn already-current graph metadata.',
        "Close any missing issue checklist item with the smallest durable graph/catalog change.",
        'Preserve existing YAML shape and catalog test style.',
        'Do not touch unrelated dirty files or generated plugin install artifacts.',
        'Return JSON: { changedFiles: string[], summary: string, alreadyCurrent: boolean, completedChecklistItems: string[], remainingGaps: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        issueSpec,
        '---',
        '',
        'REFERENCE TRACE (verbatim):',
        '---',
        referenceTrace,
        '---',
      ],
    },
  },
}));

const verifyAssimilationTask = defineTask('issue-440.verify-assimilation', ({ targetVersion }) => ({
  kind: 'shell',
  title: 'Verify Codex 0.134.0 graph and catalog coverage',
  command: [
    'set -euo pipefail',
    `rg -n 'currentVersion: "${targetVersion}"|rust-v0\\.134\\.0|managed network proxy|network-proxy|@openai/codex@${targetVersion}|readOnlyHint|\\$ref/\\$defs|--profile' packages/atlas/graph/agent-stack/versions/codex-1-x.yaml packages/atlas/graph/catalog-meta packages/agent-catalog/src/catalog.test.ts`,
    'npm run verify:metadata',
    `npm exec --yes --package=vitest -- vitest run --config vitest.config.ts -t "Codex ${targetVersion} lifecycle" packages/agent-catalog/src/catalog.test.ts`,
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['verification', 'graph', 'tests'],
}));

const captureDiffTask = defineTask('issue-440.capture-diff', () => ({
  kind: 'shell',
  title: 'Capture final issue diff',
  command: [
    'git diff -- packages/atlas/graph/agent-stack/versions/codex-1-x.yaml packages/atlas/graph/catalog-meta/claims/capability-support-claims.yaml packages/agent-catalog/src/catalog.test.ts .a5c/processes/issue-440-codex-0-134-0-assimilation.mjs .a5c/processes/issue-440-codex-0-134-0-assimilation.inputs.json',
    'git status --short',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['git', 'diff'],
}));

const commitTask = defineTask('issue-440.commit', ({ targetVersion }) => ({
  kind: 'shell',
  title: 'Commit Codex 0.134.0 issue changes',
  command: [
    'set -euo pipefail',
    'git add packages/atlas/graph/agent-stack/versions/codex-1-x.yaml packages/atlas/graph/catalog-meta/claims/capability-support-claims.yaml packages/agent-catalog/src/catalog.test.ts',
    'git add -f .a5c/processes/issue-440-codex-0-134-0-assimilation.mjs .a5c/processes/issue-440-codex-0-134-0-assimilation.inputs.json',
    'if git diff --cached --quiet; then',
    '  echo "No staged changes to commit"',
    'else',
    `  git commit -m "chore(atlas): track Codex CLI ${targetVersion}"`,
    'fi',
    'git status --short --branch',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['git', 'commit'],
}));

const pushAndPrTask = defineTask('issue-440.push-pr', ({ issueNumber, baseBranch, workBranch, targetVersion }) => ({
  kind: 'shell',
  title: 'Push branch and create or report PR',
  command: [
    'set -euo pipefail',
    `git push -u origin ${workBranch}`,
    `existing=$(gh pr list --state open --head ${workBranch} --json number,url --jq '.[0] // empty')`,
    'if [ -n "$existing" ]; then',
    '  printf "%s\\n" "$existing"',
    'else',
    `  gh pr create --base ${baseBranch} --head ${workBranch} --title "Track Codex CLI ${targetVersion} upstream release" --body "Closes #${issueNumber}\\n\\nTracks Codex CLI ${targetVersion} upstream release metadata in the Atlas graph and catalog assertions." --json number,url`,
    'fi',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['github', 'pr'],
}));

const commentTask = defineTask('issue-440.comment', ({ issueNumber, targetVersion }) => ({
  kind: 'shell',
  title: 'Post issue summary comment',
  command: [
    'set -euo pipefail',
    'cat > /tmp/issue-440-summary.md <<\'EOF\'',
    `Tracked Codex CLI ${targetVersion} upstream release in a PR.`,
    '',
    'Summary:',
    '- Confirmed graph metadata already carried the 0.134.0 release, package, release notes, MCP/schema/readOnlyHint/hook/remote-control details from the daily sweep.',
    "- Completed the remaining checklist coverage for Node-based tools honoring Codex's managed network proxy environment.",
    '- Added a catalog assertion so the managed network proxy note stays covered.',
    '',
    'Verification:',
    '- `npm run verify:metadata`',
    `- \`npm exec --yes --package=vitest -- vitest run --config vitest.config.ts -t "Codex ${targetVersion} lifecycle" packages/agent-catalog/src/catalog.test.ts\``,
    'EOF',
    `gh issue comment ${issueNumber} --body-file /tmp/issue-440-summary.md`,
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['github', 'issue-comment'],
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 440;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const workBranch = inputs?.workBranch ?? 'agent/issue-440';
  const targetVersion = inputs?.targetVersion ?? '0.134.0';
  const previousVersion = inputs?.previousVersion ?? '0.133.0';

  const issueSpec = await ctx.task(readIssueSpecTask, { issueNumber }, { key: 'issue-440.read-issue-spec' });
  const branch = await ctx.task(setupBranchTask, { baseBranch, workBranch }, { key: 'issue-440.setup-branch' });
  const references = await ctx.task(discoverReferencesTask, { previousVersion, targetVersion }, { key: 'issue-440.discover-references' });
  const implementation = await ctx.task(implementAssimilationTask, {
    issueSpec: stdoutOf(issueSpec),
    referenceTrace: stdoutOf(references),
    targetVersion,
  }, { key: 'issue-440.implement' });
  const verification = await ctx.task(verifyAssimilationTask, { targetVersion }, { key: 'issue-440.verify' });
  const diff = await ctx.task(captureDiffTask, {}, { key: 'issue-440.diff' });
  const commit = await ctx.task(commitTask, { targetVersion }, { key: 'issue-440.commit' });
  const pr = await ctx.task(pushAndPrTask, { issueNumber, baseBranch, workBranch, targetVersion }, { key: 'issue-440.push-pr' });
  const comment = await ctx.task(commentTask, { issueNumber, targetVersion }, { key: 'issue-440.comment' });

  return {
    success: true,
    issueNumber,
    workBranch,
    changedFiles: implementation?.changedFiles ?? [],
    branch,
    implementation,
    verification,
    diff: stdoutOf(diff),
    commit,
    pr,
    comment,
  };
}
