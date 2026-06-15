/**
 * @process repo/issue-536-claude-code-2-1-156-graph-update
 * @description Assimilate Claude Code 2.1.156 release details into the Atlas graph using issue-scoped new YAML files.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process specializations/sdk-platform-development/sdk-versioning-release-management
 * @process methodologies/maestro/maestro-knowledge-graph
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-536.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, process references, and Claude Code graph context',
  labels: ['issue-536', 'claude-code', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimilat|verify|knowledge graph|release" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- Claude Code graph surface ---\\n"',
      'rg -n "Claude Code|claude-code|2\\\\.1\\\\.153|2\\\\.1\\\\.156|Opus 4\\\\.8|thinking block|thinking|releaseNotesUrl|currentVersion|AgentVersion" packages/atlas/graph packages/atlas/src packages/agent-catalog/src -g "*.yaml" -g "*.ts" -g "*.json" -g "*.md" | head -1000',
      'printf "\\n--- current git state ---\\n"',
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

const implementGraphUpdateTask = defineTask('issue-536.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude Code 2.1.156 graph update',
  labels: ['issue-536', 'claude-code', 'implementation'],
  agent: {
    name: 'claude-code-release-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Implement the Claude Code 2.1.156 graph update in the current repository.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #536 and the Claude Code 2.1.156 release surface.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML patterns and validation rules.',
        'Create only new Atlas graph YAML files for issue #536. Do not modify existing Atlas graph YAML files.',
        'Every new Atlas graph YAML filename must include the issue number 536, for example claude-code-issue-536.yaml.',
        'Do not modify existing version files that concurrent PRs may touch.',
        'Model the upstream release evidence for Claude Code 2.1.156, including official release notes URL and npm install method continuity.',
        'Represent the release note that Claude Code 2.1.156 fixes Opus 4.8 thinking blocks being modified in a way that caused API errors.',
        'Represent that no new CLI flags, package rename, transport change, launch behavior change, install method change, or migration steps are mentioned by upstream.',
        'If the graph needs adapter/thinking-block pass-through evidence, add it as new issue-scoped YAML rather than editing shared current version files.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-536.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Claude Code 2.1.156 graph update',
  labels: ['issue-536', 'claude-code', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --porcelain -- packages/atlas/graph > /tmp/issue-536-name-status.txt',
      'cat /tmp/issue-536-name-status.txt',
      'if awk \'$1 !~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ { bad=1; print "Modified existing Atlas graph YAML:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-536-name-status.txt; then :; fi',
      'if awk \'$1 ~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ && $2 !~ /536/ { bad=1; print "New Atlas graph YAML filename missing 536:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-536-name-status.txt; then :; fi',
      'test -n "$(awk \'$1 ~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ { print $2 }\' /tmp/issue-536-name-status.txt)"',
      'rg -n "2\\.1\\.156|Opus 4\\.8|thinking block|thinking blocks|modified|API errors|releases/tag/v2\\.1\\.156|npm install -g @anthropic-ai/claude-code" $(awk \'$1 ~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ { print $2 }\' /tmp/issue-536-name-status.txt)',
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

const readArtifactsTask = defineTask('issue-536.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed artifacts for review',
  labels: ['issue-536', 'claude-code', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff --name-status origin/staging...HEAD',
      'git diff -- .a5c/processes/issue-536-claude-code-2-1-156-graph-update.js .a5c/processes/issue-536-inputs.json packages/atlas/graph',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphUpdateTask = defineTask('issue-536.review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Claude Code 2.1.156 graph update against issue spec',
  labels: ['issue-536', 'claude-code', 'review'],
  agent: {
    name: 'claude-code-release-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #536 requirements to the final artifacts.',
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
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-536.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-536', 'claude-code', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add -f .a5c/processes/issue-536-claude-code-2-1-156-graph-update.js .a5c/processes/issue-536-inputs.json',
      'while IFS= read -r path; do git add "$path"; done < <(git diff --name-only origin/staging...HEAD -- packages/atlas/graph | rg "536.*\\.ya?ml$" || true)',
      'while IFS= read -r path; do git add "$path"; done < <(git ls-files --others --exclude-standard packages/atlas/graph | rg "536.*\\.ya?ml$" || true)',
      'git diff --cached --name-status',
      'test -n "$(git diff --cached --name-only)"',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Claude Code 2.1.156"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Claude Code 2.1.156 release" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Claude Code 2.1.156 upstream release.\\n\\n- Added issue-scoped Atlas graph YAML for the 2.1.156 release evidence.\\n- Kept existing Atlas graph YAML/version files untouched to avoid concurrent PR conflicts.\\n- Captured the Opus 4.8 thinking-block API-error fix and no-migration/install-continuity notes.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 536;
  const branchName = inputs?.branchName ?? 'graph-update/536';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementGraphUpdateTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyGraphUpdateTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewGraphUpdateTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve Claude Code 2.1.156 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Claude Code 2.1.156 in Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
