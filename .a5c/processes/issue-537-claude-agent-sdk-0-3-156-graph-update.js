/**
 * @process repo/issue-537-claude-agent-sdk-0-3-156-graph-update
 * @description Additive Atlas graph update for Claude Agent SDK 0.3.156 with issue-scoped YAML filenames.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-537.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, process references, and Claude Agent SDK graph context',
  labels: ['issue-537', 'claude-agent-sdk', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version-update|graph-update|Claude Agent SDK|claude-agent-sdk|versioning|verify" /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development /home/runner/.a5c/process-library/babysitter-repo/library/methodologies .a5c/processes -g "*.js" -g "*.md" | head -260',
      'printf "\\n--- current graph surface ---\\n"',
      'rg -n "claude-agent-sdk|Claude Agent SDK|0\\\\.3\\\\.156|2\\\\.1\\\\.156|Opus 4\\\\.8|thinking" packages/atlas/graph -g "*.yaml" | head -500',
      'printf "\\n--- candidate directories ---\\n"',
      'printf "packages/atlas/graph/agent-stack/versions\\npackages/atlas/graph/catalog-meta/evidence-sources\\n"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-537.implement-additive-graph-yaml', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create additive issue-scoped Atlas graph YAML',
  labels: ['issue-537', 'claude-agent-sdk', 'implementation'],
  agent: {
    name: 'claude-agent-sdk-graph-additive-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Implement the issue #537 Claude Agent SDK 0.3.156 Atlas graph update directly in the repository.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Read relevant files before editing.',
        'Do not revert or stage unrelated local worktree changes.',
        'Only create new files for Atlas graph YAML changes.',
        'Every new Atlas graph YAML filename must include "issue-537".',
        'Do not modify existing Atlas graph version files or shared date-bucket evidence files.',
        'If the current version and evidence are already represented, add an issue-scoped supplemental YAML record that preserves provenance for issue #537 without duplicating an existing node id.',
        'Use existing Atlas graph node and evidence patterns.',
        'Keep scope to Claude Agent SDK 0.3.156 parity with Claude Code 2.1.156 and the Opus 4.8 thinking-block API-error fix.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-537.verify-additive-graph-yaml', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify issue-scoped additive graph update',
  labels: ['issue-537', 'claude-agent-sdk', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "\\n--- status ---\\n"',
      'git status --short',
      'printf "\\n--- atlas graph diff names ---\\n"',
      'git diff --name-status -- packages/atlas/graph',
      'if git diff --name-status -- packages/atlas/graph | awk \'$1 != "A" { bad=1 } END { exit bad ? 1 : 0 }\'; then :; else echo "Atlas graph changes must only add files" >&2; exit 1; fi',
      'if git diff --name-only -- packages/atlas/graph/agent-stack/versions | rg .; then echo "Existing or new version-directory files changed; issue #537 requested no version-file edits" >&2; exit 1; fi',
      'git diff --name-only --diff-filter=A -- packages/atlas/graph | rg "issue-537.*\\.ya?ml$"',
      'git diff --name-only --diff-filter=A -- packages/atlas/graph | while IFS= read -r f; do case "$f" in *issue-537*.yaml|*issue-537*.yml) ;; *) echo "Atlas graph YAML filename lacks issue-537: $f" >&2; exit 1;; esac; done',
      'rg -n "0\\.3\\.156|2\\.1\\.156|Opus 4\\.8|thinking-block|thinking block|claude-agent-sdk" $(git diff --name-only --diff-filter=A -- packages/atlas/graph)',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'git diff --check',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-537.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed artifacts for final review',
  labels: ['issue-537', 'claude-agent-sdk', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph .a5c/processes/issue-537-claude-agent-sdk-0-3-156-graph-update.js .a5c/processes/issue-537-inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-537.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #537 graph update against spec',
  labels: ['issue-537', 'claude-agent-sdk', 'review'],
  agent: {
    name: 'claude-agent-sdk-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #537 requirements to the final artifacts.',
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
        'Verify that Atlas graph YAML changes are new files only, filenames include issue-537, and existing version files were not modified.',
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-537.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-537', 'claude-agent-sdk', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add $(git diff --name-only --diff-filter=A -- packages/atlas/graph | tr "\\n" " ")',
      'git add -f .a5c/processes/issue-537-claude-agent-sdk-0-3-156-graph-update.js .a5c/processes/issue-537-inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Claude Agent SDK 0.3.156 for issue 537"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Claude Agent SDK 0.3.156 graph update" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Claude Agent SDK 0.3.156 with issue-scoped Atlas graph YAML.\\n\\n- Added only new Atlas graph YAML file(s) with issue-537 in the filename.\\n- Left existing version files unchanged to avoid concurrent PR conflicts.\\n- Verified metadata, Atlas build, additive graph diff constraints, and diff whitespace.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 537;
  const branchName = inputs?.branchName ?? 'graph-update/537';
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
      summary: review?.summary ?? 'Final review did not approve issue #537 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Claude Agent SDK 0.3.156 in additive issue-scoped Atlas graph YAML.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
