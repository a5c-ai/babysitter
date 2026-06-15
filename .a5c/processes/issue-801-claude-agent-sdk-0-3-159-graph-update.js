/**
 * @process repo/issue-801-claude-agent-sdk-0-3-159-graph-update
 * @description Track Claude Agent SDK 0.3.159 in Atlas graph YAML with unique release evidence files.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * References searched before authoring:
 * - repo process .a5c/processes/issue-439-claude-agent-sdk-0-3-152.js
 * - repo process .a5c/processes/issue-509-cursor-3-5-graph-update.js
 * - methodologies/maestro/maestro-knowledge-graph.js
 * - methodologies/gsd/map-codebase.js
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-801.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Claude Agent SDK 0.3.159 issue and graph context',
  labels: ['issue-801', 'claude-agent-sdk', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- upstream package ---\\n"',
      'npm view @anthropic-ai/claude-agent-sdk version dist-tags --json',
      'printf "\\n--- relevant graph refs ---\\n"',
      'rg -n "claude-agent-sdk|Claude Agent SDK|0\\\\.3\\\\.159|0\\\\.3\\\\.156|2\\\\.1\\\\.159|stdio MCP|reconcile" packages/atlas/graph .a5c/processes -g "*.yaml" -g "*.js" -g "*.md" | head -500',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-801.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude Agent SDK 0.3.159 graph update',
  labels: ['issue-801', 'claude-agent-sdk', 'graph', 'implementation'],
  agent: {
    name: 'claude-agent-sdk-graph-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update Atlas graph YAML for Claude Agent SDK 0.3.159.',
      instructions: [
        'Use the SPEC AND CONTEXT block verbatim as the acceptance source.',
        'Keep scope to packages/atlas/graph YAML files plus this process file.',
        'Update the canonical Claude Agent SDK current version record to 0.3.159.',
        'Add durable evidence and claim YAML using unique filenames that include 0-3-159 or the date.',
        'Preserve the package name and install method. Do not update package manifests for this issue.',
        'Record parity with Claude Code 2.1.159 and the recent 0.3.154 stdio MCP reconcile fix from the issue body.',
        'Return JSON: { changedFiles: string[], summary: string, notes: string[] }.',
        '',
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-801.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Claude Agent SDK 0.3.159 graph update',
  labels: ['issue-801', 'claude-agent-sdk', 'graph', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n \'versionRange: ">=0\\.3\\.159"|currentVersion: "0\\.3\\.159"|releaseNotesUrl: "https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0\\.3\\.159"|evidence:claude-agent-sdk-0-3-159-release\' packages/atlas/graph/agent-stack/versions/claude-agent-sdk-current.yaml',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/claude-agent-sdk-0-3-159-issue-801.yaml',
      'test -f packages/atlas/graph/catalog-meta/claims/claude-agent-sdk-0-3-159-issue-801.yaml',
      'rg -n "evidence:claude-agent-sdk-0-3-159-release|https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0\\.3\\.159|stdio MCP servers|config-equality|0\\.3\\.154|2\\.1\\.159" packages/atlas/graph/catalog-meta/evidence-sources/claude-agent-sdk-0-3-159-issue-801.yaml packages/atlas/graph/catalog-meta/claims/claude-agent-sdk-0-3-159-issue-801.yaml',
      'python3 packages/atlas/graph/tools/validator/validate.py >/tmp/atlas-validator-issue-801.json',
      'npm run build --workspace=@a5c-ai/atlas',
      'git diff --check -- packages/atlas/graph .a5c/processes/issue-801-claude-agent-sdk-0-3-159-graph-update.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-801.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Claude Agent SDK graph artifacts',
  labels: ['issue-801', 'claude-agent-sdk', 'graph', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/claude-agent-sdk-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/claude-agent-sdk-0-3-159-issue-801.yaml packages/atlas/graph/catalog-meta/claims/claude-agent-sdk-0-3-159-issue-801.yaml .a5c/processes/issue-801-claude-agent-sdk-0-3-159-graph-update.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-801.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Claude Agent SDK 0.3.159 graph update',
  labels: ['issue-801', 'claude-agent-sdk', 'graph', 'review'],
  agent: {
    name: 'claude-agent-sdk-graph-reviewer',
    prompt: {
      role: 'senior graph data reviewer',
      task: 'Compare issue #801 requirements to the final graph artifacts.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { approved: boolean, issues: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-801.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue',
  labels: ['issue-801', 'claude-agent-sdk', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/claude-agent-sdk-current.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/claude-agent-sdk-0-3-159-issue-801.yaml',
      'git add packages/atlas/graph/catalog-meta/claims/claude-agent-sdk-0-3-159-issue-801.yaml',
      'git add -f .a5c/processes/issue-801-claude-agent-sdk-0-3-159-graph-update.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Claude Agent SDK 0.3.159"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Claude Agent SDK 0.3.159 in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Claude Agent SDK 0.3.159 graph tracking.\\n\\n- Updated the canonical Claude Agent SDK current version metadata to 0.3.159.\\n- Added unique issue-scoped evidence and claim YAML files for 0.3.159 parity with Claude Code 2.1.159 and the recent 0.3.154 stdio MCP reconcile fix.\\n- Preserved package/install metadata and verified Atlas graph validation plus the Atlas build.\\n\\nPR: %s' "$PR_URL")"`,
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 801;
  const branchName = inputs?.branchName ?? 'agent/issue-801';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve the Claude Agent SDK 0.3.159 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Claude Agent SDK 0.3.159 in Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
