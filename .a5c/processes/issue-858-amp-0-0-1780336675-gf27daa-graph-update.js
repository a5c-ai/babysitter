/**
 * @process repo/issue-858-amp-0-0-1780336675-gf27daa-graph-update
 * @description Add unique-file Amp 0.0.1780336675-gf27daa Atlas graph patch and evidence source for issue #858.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/plan-and-execute
 * @process specializations/collaboration/github/issue-only-no-direct-commits
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-858.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR state, npm metadata, process references, and Amp graph context',
  labels: ['issue-858', 'amp', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- target npm package ---\\n"',
      `npm view @ampcode/cli@${args.targetVersion} version time dist-tags --json`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version-update|graph-update|issue-[0-9]+.*graph-update|verification-before-completion|issue-813" .a5c/processes /home/runner/.a5c/process-library/babysitter-repo/library -g "*.js" -g "*.md" | head -320',
      'printf "\\n--- Amp graph surface ---\\n"',
      `rg -n "amp|Amp|@ampcode/cli|${args.targetVersion}|agentVersion:amp|agent-version:amp|adapterMetadata|releaseTracking" packages/atlas/graph packages/atlas/src -g "*.yaml" -g "*.ts" | head -1200`,
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

const implementGraphUpdateTask = defineTask('issue-858.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Amp 0.0.1780336675-gf27daa unique-file graph patch',
  labels: ['issue-858', 'amp', 'implementation'],
  agent: {
    name: 'amp-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add issue-scoped Atlas graph YAML coverage for Sourcegraph Amp 0.0.1780336675-gf27daa.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #858 and Sourcegraph Amp 0.0.1780336675-gf27daa.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML patterns and validation rules.',
        'Do not edit existing shared Atlas graph YAML files.',
        'Create additive patch files only.',
        'Place the AgentVersion patch in packages/atlas/graph/agent-stack/agent-versions/.',
        'Place the evidence source in packages/atlas/graph/catalog-meta/evidence-sources/.',
        'Use unique filenames based on the agent and version: amp-0-0-1780336675-gf27daa-update.yaml.',
        'If a shared graph file already contains agentVersion:amp:0-0-1780336675-gf27daa, patch it via a NodeDocument record with patch: true instead of duplicating shared-file edits.',
        'Do not put release-tracking data under adapterMetadata; use a sibling releaseTracking attribute on the AgentVersion patch.',
        'Record unchanged install metadata: @ampcode/cli via npm install -g @ampcode/cli.',
        'Record that no public build-specific changelog confirmed CLI flag, transport, MCP, auth, subagent, or migration changes.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-858.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Amp 0.0.1780336675-gf27daa unique-file graph patch',
  labels: ['issue-858', 'amp', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'AGENT_FILE="packages/atlas/graph/agent-stack/agent-versions/amp-0-0-1780336675-gf27daa-update.yaml"',
      'EVIDENCE_FILE="packages/atlas/graph/catalog-meta/evidence-sources/amp-0-0-1780336675-gf27daa-update.yaml"',
      'test -f "$AGENT_FILE"',
      'test -f "$EVIDENCE_FILE"',
      'git status --porcelain -- packages/atlas/graph > /tmp/issue-858-name-status.txt',
      'cat /tmp/issue-858-name-status.txt',
      'if awk \'$1 !~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ { bad=1; print "Modified existing Atlas graph YAML:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-858-name-status.txt; then :; fi',
      'if awk \'$1 ~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ && $2 !~ /amp-0-0-1780336675-gf27daa-update\\.ya?ml$/ { bad=1; print "New Atlas graph YAML filename not agent-version unique:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-858-name-status.txt; then :; fi',
      `test "$(npm view @ampcode/cli@${args.targetVersion} version)" = "${args.targetVersion}"`,
      'rg -n "kind: NodeDocument|patch: true|agentVersion:amp:0-0-1780336675-gf27daa|releaseTracking|previousGraphVersion|0\\.0\\.1780244579-g6b52f9|0\\.0\\.1780336675-gf27daa|@ampcode/cli|npm install -g @ampcode/cli|no public build-specific changelog|adapterMetadata" "$AGENT_FILE" "$EVIDENCE_FILE"',
      '! rg -n "adapterMetadata:" "$AGENT_FILE" "$EVIDENCE_FILE"',
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

const readArtifactsTask = defineTask('issue-858.read-artifacts', (_args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Amp artifacts for review',
  labels: ['issue-858', 'amp', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/atlas/graph/agent-stack/agent-versions/amp-0-0-1780336675-gf27daa-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/amp-0-0-1780336675-gf27daa-update.yaml .a5c/processes/issue-858-amp-0-0-1780336675-gf27daa-graph-update.js .a5c/processes/issue-858-amp-0-0-1780336675-gf27daa-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphUpdateTask = defineTask('issue-858.review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Amp graph update against issue spec',
  labels: ['issue-858', 'amp', 'review'],
  agent: {
    name: 'amp-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #858 requirements to the final artifacts.',
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
        'Confirm the new Atlas graph YAML filenames are amp-0-0-1780336675-gf27daa-update.yaml in the requested directories.',
        'Confirm release-tracking data is a sibling AgentVersion attribute and not nested under adapterMetadata.',
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-858.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-858', 'amp', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/agent-versions/amp-0-0-1780336675-gf27daa-update.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/amp-0-0-1780336675-gf27daa-update.yaml',
      'git add -f .a5c/processes/issue-858-amp-0-0-1780336675-gf27daa-graph-update.js .a5c/processes/issue-858-amp-0-0-1780336675-gf27daa-graph-update.inputs.json',
      'git diff --cached --name-status',
      'test -n "$(git diff --cached --name-only)"',
      'GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Amp 0.0.1780336675-gf27daa"',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Amp 0.0.1780336675-gf27daa in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Sourcegraph Amp 0.0.1780336675-gf27daa graph tracking.\\n\\n- Added unique additive graph YAML files named amp-0-0-1780336675-gf27daa-update.yaml in the requested AgentVersion patch and evidence-source directories.\\n- Avoided editing shared graph YAML files that other PRs may touch.\\n- Added releaseTracking as a sibling AgentVersion attribute, not under adapterMetadata.\\n- Recorded @ampcode/cli npm package evidence and unchanged npm install metadata; no public build-specific changelog confirmed CLI/auth/MCP/subagent/migration changes.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nNote: npm latest has advanced again since issue creation; this PR tracks the specific issue #858 version.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 858;
  const targetVersion = inputs?.targetVersion ?? '0.0.1780336675-gf27daa';
  const branchName = inputs?.branchName ?? 'agent/issue-858';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementGraphUpdateTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyGraphUpdateTask, { targetVersion });
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewGraphUpdateTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve Amp graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Amp 0.0.1780336675-gf27daa in unique additive Atlas graph files.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
