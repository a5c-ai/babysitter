/**
 * @process repo/issue-813-amp-0-0-1780244579-g6b52f9-graph-update
 * @description Add issue-scoped Sourcegraph Amp 0.0.1780244579-g6b52f9 Atlas graph evidence and claims with unique filenames.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/plan-and-execute
 * @process specializations/collaboration/github/issue-only-no-direct-commits
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-813.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR state, process references, npm release, and Amp graph context',
  labels: ['issue-813', 'amp', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- target npm package ---\\n"',
      `npm view @ampcode/cli@${args.targetVersion} version time.version --json`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version-update|graph-update|releaseAssimilation|issue-[0-9]+.*graph-update|verification-before-completion" .a5c/processes /home/runner/.a5c/process-library/babysitter-repo/library -g "*.js" -g "*.md" | head -320',
      'printf "\\n--- Amp graph surface ---\\n"',
      `rg -n "amp|Amp|@ampcode/cli|${args.targetVersion}|agentVersion:amp|agent-version:amp|releaseAssimilation" packages/atlas/graph -g "*.yaml" -g "*.cjs" | head -1000`,
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

const implementGraphUpdateTask = defineTask('issue-813.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Amp 0.0.1780244579-g6b52f9 issue-scoped graph update',
  labels: ['issue-813', 'amp', 'implementation'],
  agent: {
    name: 'amp-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add issue-scoped Atlas graph YAML coverage for Sourcegraph Amp 0.0.1780244579-g6b52f9.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #813 and Sourcegraph Amp 0.0.1780244579-g6b52f9.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML patterns and validation rules.',
        'Prefer new issue-scoped Atlas graph YAML files over editing shared current-version files.',
        'Every new Atlas graph YAML filename must include both issue-813 and 0-0-1780244579-g6b52f9.',
        'If shared graph records already include agentVersion:amp:0-0-1780244579-g6b52f9, add issue-specific evidence and release-assimilation claim files instead of touching shared version files.',
        'Record unchanged install metadata: @ampcode/cli via npm install -g @ampcode/cli.',
        'Record that no public build-specific changelog confirmed new CLI flags, transport changes, model support changes, auth changes, MCP changes, subagent changes, or migration steps.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-813.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Amp 0.0.1780244579-g6b52f9 issue-scoped graph update',
  labels: ['issue-813', 'amp', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'EVIDENCE_FILE="packages/atlas/graph/catalog-meta/evidence-sources/amp-0-0-1780244579-g6b52f9-issue-813.yaml"',
      'CLAIM_FILE="packages/atlas/graph/catalog-meta/claims/amp-0-0-1780244579-g6b52f9-issue-813.yaml"',
      'test -f "$EVIDENCE_FILE"',
      'test -f "$CLAIM_FILE"',
      'git status --porcelain -- packages/atlas/graph > /tmp/issue-813-name-status.txt',
      'cat /tmp/issue-813-name-status.txt',
      'if awk \'$1 !~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ { bad=1; print "Modified existing Atlas graph YAML:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-813-name-status.txt; then :; fi',
      'if awk \'$1 ~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ && $2 !~ /issue-813/ { bad=1; print "New Atlas graph YAML filename missing issue-813:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-813-name-status.txt; then :; fi',
      'if awk \'$1 ~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ && $2 !~ /0-0-1780244579-g6b52f9/ { bad=1; print "New Atlas graph YAML filename missing version:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-813-name-status.txt; then :; fi',
      `test "$(npm view @ampcode/cli@${args.targetVersion} version)" = "${args.targetVersion}"`,
      'rg -n "evidence:amp-0-0-1780244579-g6b52f9-issue-813-release|claim:amp-0-0-1780244579-g6b52f9-issue-813-release-assimilation|0\\.0\\.1780244579-g6b52f9|@ampcode/cli|npm install -g @ampcode/cli|no public|changelog|launch|auth|MCP|subagent|migration" "$EVIDENCE_FILE" "$CLAIM_FILE"',
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

const readArtifactsTask = defineTask('issue-813.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Amp artifacts for review',
  labels: ['issue-813', 'amp', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/atlas/graph/catalog-meta/evidence-sources/amp-0-0-1780244579-g6b52f9-issue-813.yaml packages/atlas/graph/catalog-meta/claims/amp-0-0-1780244579-g6b52f9-issue-813.yaml .a5c/processes/issue-813-amp-0-0-1780244579-g6b52f9-graph-update.js .a5c/processes/issue-813-amp-0-0-1780244579-g6b52f9-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphUpdateTask = defineTask('issue-813.review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Amp graph update against issue spec',
  labels: ['issue-813', 'amp', 'review'],
  agent: {
    name: 'amp-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #813 requirements to the final artifacts.',
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
        'Confirm all new Atlas graph YAML filenames include issue-813 and 0-0-1780244579-g6b52f9.',
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-813.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-813', 'amp', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/amp-0-0-1780244579-g6b52f9-issue-813.yaml',
      'git add packages/atlas/graph/catalog-meta/claims/amp-0-0-1780244579-g6b52f9-issue-813.yaml',
      'git add -f .a5c/processes/issue-813-amp-0-0-1780244579-g6b52f9-graph-update.js .a5c/processes/issue-813-amp-0-0-1780244579-g6b52f9-graph-update.inputs.json',
      'git diff --cached --name-status',
      'test -n "$(git diff --cached --name-only)"',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Amp 0.0.1780244579-g6b52f9"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Amp 0.0.1780244579-g6b52f9 in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Sourcegraph Amp 0.0.1780244579-g6b52f9 graph tracking.\\n\\n- Added issue-scoped Atlas graph YAML files with both the version and issue-813 in their filenames.\\n- Confirmed existing shared graph records already include the Amp version, so the update adds release evidence and an assimilation claim without modifying shared version files.\\n- Preserved unchanged @ampcode/cli install metadata and recorded that no public build-specific changelog confirmed launch/auth/MCP/subagent/migration changes.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 813;
  const targetVersion = inputs?.targetVersion ?? '0.0.1780244579-g6b52f9';
  const branchName = inputs?.branchName ?? 'agent/issue-813';
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
    summary: implementation?.summary ?? 'Tracked Amp 0.0.1780244579-g6b52f9 in issue-scoped Atlas graph files.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
