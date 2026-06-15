/**
 * @process repo/issue-540-opencode-1-15-12-graph-update
 * @description Add issue-scoped OpenCode 1.15.12 Atlas graph evidence and claims without modifying shared version files.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * References searched before authoring:
 * - .a5c/processes/issue-509-cursor-3-5-graph-update.js
 * - .a5c/processes/issue-502-pi-0-76-0-graph-update.js
 * - specializations/sdk-platform-development/sdk-versioning-release-management.js
 * - methodologies/gsd/verify-work
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-540.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR state, release, process references, and OpenCode graph context',
  labels: ['issue-540', 'opencode', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- OpenCode v1.15.12 release ---\\n"',
      'gh release view v1.15.12 --repo anomalyco/opencode --json name,tagName,publishedAt,url,body || true',
      'printf "\\n--- graph-update process references ---\\n"',
      'rg -n "agent-version-update|graph-update|release-assimilation|issue-[0-9]+.*graph-update" .a5c/processes /home/runner/.a5c/process-library/babysitter-repo/library -g "*.js" -g "*.md" | head -260',
      'printf "\\n--- OpenCode graph and catalog surface ---\\n"',
      'rg -n "opencode|OpenCode|1\\\\.15\\\\.12|OPENCODE_EXPERIMENTAL_WEBSOCKETS|acp-next|Responses WebSocket|workspace management|subagent retry" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts" | head -900',
      'printf "\\n--- branch and worktree ---\\n"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-540.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OpenCode 1.15.12 issue-scoped graph update',
  labels: ['issue-540', 'opencode', 'implementation'],
  agent: {
    name: 'opencode-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add issue-scoped Atlas graph YAML coverage for OpenCode 1.15.12.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #540 and OpenCode 1.15.12.',
        'Preserve unrelated local worktree changes.',
        'Only create new Atlas graph YAML files; do not modify existing Atlas graph YAML version/evidence/claim files.',
        'Every new Atlas graph YAML filename must include issue-540.',
        'If the existing graph already tracks currentVersion 1.15.12, add issue-specific evidence and release-assimilation claim files instead of touching the version file.',
        'Capture ACP prompt/slash/usage support, experimental OPENCODE_EXPERIMENTAL_WEBSOCKETS=true, WebSocket timeout/retry/custom-base-url behavior, TUI workspace management and subagent retry status, Desktop tab layout setting, and unchanged opencode-ai install metadata.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-540.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify OpenCode 1.15.12 issue-scoped graph update',
  labels: ['issue-540', 'opencode', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/opencode-issue-540.yaml',
      'test -f packages/atlas/graph/catalog-meta/claims/opencode-issue-540.yaml',
      'rg -n "evidence:opencode-1-15-12-issue-540-release|claim:opencode-1-15-12-issue-540-release-assimilation|OPENCODE_EXPERIMENTAL_WEBSOCKETS|acp-next|opencode-ai" packages/atlas/graph/catalog-meta/evidence-sources/opencode-issue-540.yaml packages/atlas/graph/catalog-meta/claims/opencode-issue-540.yaml',
      'if git diff --name-only -- packages/atlas/graph | rg -v "packages/atlas/graph/catalog-meta/(evidence-sources|claims)/opencode-issue-540\\.yaml$"; then echo "Unexpected Atlas graph YAML modification"; exit 1; fi',
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

const readArtifactsTask = defineTask('issue-540.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed OpenCode artifacts for review',
  labels: ['issue-540', 'opencode', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/catalog-meta/evidence-sources/opencode-issue-540.yaml packages/atlas/graph/catalog-meta/claims/opencode-issue-540.yaml .a5c/processes/issue-540-opencode-1-15-12-graph-update.js .a5c/processes/issue-540-opencode-1-15-12-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-540.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review OpenCode 1.15.12 graph update against issue spec',
  labels: ['issue-540', 'opencode', 'review'],
  agent: {
    name: 'opencode-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #540 requirements to the final artifacts.',
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
        'Confirm the graph change uses only new Atlas graph YAML files whose filenames include issue-540.',
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-540.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-540', 'opencode', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/opencode-issue-540.yaml',
      'git add packages/atlas/graph/catalog-meta/claims/opencode-issue-540.yaml',
      'git add -f .a5c/processes/issue-540-opencode-1-15-12-graph-update.js .a5c/processes/issue-540-opencode-1-15-12-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track OpenCode 1.15.12 for issue 540"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track OpenCode 1.15.12 in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented OpenCode 1.15.12 issue-scoped graph tracking.\\n\\n- Added new Atlas graph YAML files with issue-540 in their filenames for release evidence and release-assimilation claim coverage.\\n- Confirmed existing OpenCode version metadata already records 1.15.12, so no shared version file was modified.\\n- Captured acp-next prompt/slash/usage support, experimental OpenAI Responses WebSocket behavior, TUI/Desktop changes, subagent retry status, and unchanged opencode-ai install metadata.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 540;
  const branchName = inputs?.branchName ?? 'graph-update/540';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementGraphUpdateTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyGraphUpdateTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve OpenCode 1.15.12 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked OpenCode 1.15.12 in issue-scoped Atlas graph files.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
