/**
 * @process repo/issue-539-gemini-cli-0-44-1-graph-update
 * @description Track Gemini CLI 0.44.1 in Atlas using only new issue-scoped graph YAML files.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, changedFiles, verification, review, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-539.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR, process, and Gemini graph context',
  labels: ['issue-539', 'gemini-cli', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- matching process references ---\\n"',
      'rg -n "agent-version-update|graph-update|gemini-cli|AgentVersion|atlas|verify" /home/runner/.a5c/process-library/babysitter-repo/library .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- current Gemini version record ---\\n"',
      'cat packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml',
      'printf "\\n--- current Gemini release evidence refs ---\\n"',
      'rg -n "gemini-cli-0-44-1|0\\\\.44\\\\.1|google-gemini/gemini-cli/releases/tag/v0.44.1" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts"',
      'printf "\\n--- Atlas patch support ---\\n"',
      'rg -n "isRecordPatch|mergeRecordPatch|pendingRecordPatches" packages/atlas/src/indexer.ts',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-539.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Gemini CLI 0.44.1 issue-scoped graph update',
  labels: ['issue-539', 'gemini-cli', 'implementation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Implement issue #539 using only new issue-scoped Atlas graph YAML files.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Preserve unrelated local worktree changes.',
        'Do not modify existing Atlas graph YAML files.',
        'Create only new Atlas graph YAML files whose filenames include issue-539.',
        'Use existing Atlas graph patterns and patch-record support where needed.',
        'Track Gemini CLI 0.44.1 as a patch cherry-pick on the 0.44.0 line, with official release evidence and no install-method, CLI flag, transport, MCP, model, or migration changes called out.',
        'Prefer a new issue-scoped EvidenceSource plus an AgentVersion patch edge/attribute patch over editing gemini-cli-current.yaml.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-539.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Gemini CLI 0.44.1 issue-scoped graph update',
  labels: ['issue-539', 'gemini-cli', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml',
      'rg -n "id: evidence:gemini-cli-0-44-1-issue-539-release|sourceUrl: https://github.com/google-gemini/gemini-cli/releases/tag/v0.44.1|id: agentVersion:gemini:ge-0-43-0|patch: true|currentVersion: \\"0.44.1\\"|releaseNotesUrl: \\"https://github.com/google-gemini/gemini-cli/releases/tag/v0.44.1\\"" packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml',
      'rg -n "evidence:gemini-cli-0-44-1-issue-539-release" packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml',
      'if git diff --name-only -- packages/atlas/graph | rg -v "^packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml$"; then echo "Existing Atlas graph YAML was modified"; exit 1; fi',
      'if git ls-files --others --exclude-standard packages/atlas/graph | rg -v "^packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml$"; then echo "Unexpected new Atlas graph file"; exit 1; fi',
      'git diff --check',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-539.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue-scoped graph artifacts for review',
  labels: ['issue-539', 'gemini-cli', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml .a5c/processes/issue-539-gemini-cli-0-44-1-graph-update.js .a5c/processes/issue-539-gemini-cli-0-44-1-graph-update.inputs.json',
      'printf "\\n--- new graph file ---\\n"',
      'cat packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphUpdateTask = defineTask('issue-539.review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Gemini CLI 0.44.1 graph update against issue spec',
  labels: ['issue-539', 'gemini-cli', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisk: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.verificationStdout,
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-539.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-539', 'gemini-cli', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml',
      'git add -f .a5c/processes/issue-539-gemini-cli-0-44-1-graph-update.js .a5c/processes/issue-539-gemini-cli-0-44-1-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Gemini CLI 0.44.1 for issue 539"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Gemini CLI 0.44.1 release" --body "Closes #${args.issueNumber}\\n\\nTracks Gemini CLI ${args.targetVersion} using a new issue-scoped Atlas graph YAML file only.")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Completed Gemini CLI %s graph tracking.\\n\\n- Added only a new issue-scoped Atlas graph YAML file: packages/atlas/graph/catalog-meta/evidence-sources/gemini-cli-issue-539.yaml.\\n- Recorded official v%s release evidence and patched the Gemini AgentVersion currentVersion/release evidence without editing shared version files.\\n- Verified no existing Atlas graph YAML files were modified, then ran metadata verification and the Atlas build.\\n\\nPR: %s' '${args.targetVersion}' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 539;
  const targetVersion = inputs?.targetVersion ?? '0.44.1';
  const branchName = inputs?.branchName ?? 'graph-update/539';
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
    verificationStdout: verification?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, targetVersion, branchName, baseBranch });

  return {
    success: true,
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
