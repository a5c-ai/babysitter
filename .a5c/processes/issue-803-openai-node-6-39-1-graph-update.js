/**
 * @process repo/issue-803-openai-node-6-39-1-graph-update
 * @description Track OpenAI Node SDK 6.39.1 in the Atlas graph with issue-scoped evidence and verification.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string, baseBranch?: string }
 *
 * @process methodologies/gsd/quick
 * @process methodologies/superpowers/verification-before-completion
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-quality-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-803.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release notes, process references, and Codex SDK graph context',
  labels: ['issue-803', 'openai-node', 'codex-sdk', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- official release notes ---\\n"',
      `gh api repos/openai/openai-node/releases/tags/v${args.targetVersion} --jq '{tag_name,published_at,html_url,body}'`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|graph-update|release evidence|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.md" | head -240',
      'printf "\\n--- Codex SDK/OpenAI Node graph surface ---\\n"',
      'rg -n "codex-sdk|openai-node|OpenAI Node SDK|6\\\\.39\\\\.[01]|undici|dispatcher|text/plan|raw upload|binary" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts" -g "*.json" -g "*.md" | head -900',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-803.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OpenAI Node SDK 6.39.1 graph update',
  labels: ['issue-803', 'openai-node', 'codex-sdk', 'implementation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update the repository for issue #803: OpenAI Node SDK 6.39.1 graph tracking.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Preserve unrelated local worktree changes.',
        'Keep changes tightly scoped to Atlas graph YAML files plus this issue process file/input.',
        'Use unique new Atlas graph filenames that include issue 803 and/or version 6.39.1.',
        'Record OpenAI Node SDK 6.39.1 as the current upstream version for the Codex SDK adapter/source-ref surface.',
        'Model the release notes: improved undici dispatcher mismatch guidance, and text/plan with format: binary treated as raw upload.',
        'Record no package/install method change: openai via npm remains the install/package surface.',
        'Do not invent launchBehavior changes.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-803.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify OpenAI Node SDK 6.39.1 graph update',
  labels: ['issue-803', 'openai-node', 'codex-sdk', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "currentVersion: \\"6.39.1\\"|releaseNotesUrl: \\"https://github.com/openai/openai-node/releases/tag/v6.39.1\\"|upstreamReleaseTag: \\"v6.39.1\\"" packages/atlas/graph/agent-stack/versions/codex-sdk-current.yaml packages/atlas/graph/agent-stack/agent-versions/openai-node-6-39-1-issue-803.yaml',
      'rg -n "6.39.1|undici dispatcher mismatch|text/plan|raw upload|format: binary|No install method" packages/atlas/graph/catalog-meta/evidence-sources/openai-node-6-39-1-issue-803.yaml packages/atlas/graph/catalog-meta/claims/openai-node-6-39-1-issue-803.yaml packages/atlas/graph/agent-stack/agent-versions/openai-node-6-39-1-issue-803.yaml',
      'rg -n "ref: \\"6.39.1\\"|openai/v/6.39.1" packages/atlas/graph/sourceref-scope/source-refs/openai-node.yaml',
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

const readArtifactsTask = defineTask('issue-803.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final OpenAI Node SDK graph diff',
  labels: ['issue-803', 'openai-node', 'codex-sdk', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/codex-sdk-current.yaml packages/atlas/graph/agent-stack/agent-versions/openai-node-6-39-1-issue-803.yaml packages/atlas/graph/sourceref-scope/source-refs/openai-node.yaml packages/atlas/graph/catalog-meta/evidence-sources/openai-node-6-39-1-issue-803.yaml packages/atlas/graph/catalog-meta/claims/openai-node-6-39-1-issue-803.yaml .a5c/processes/issue-803-openai-node-6-39-1-graph-update.js .a5c/processes/issue-803-openai-node-6-39-1-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-803.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review OpenAI Node SDK graph update against issue spec',
  labels: ['issue-803', 'openai-node', 'codex-sdk', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare SPEC to ARTIFACTS directly and report per-criterion pass/fail.',
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
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-803.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-803', 'openai-node', 'codex-sdk', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/codex-sdk-current.yaml packages/atlas/graph/agent-stack/agent-versions/openai-node-6-39-1-issue-803.yaml packages/atlas/graph/sourceref-scope/source-refs/openai-node.yaml packages/atlas/graph/catalog-meta/evidence-sources/openai-node-6-39-1-issue-803.yaml packages/atlas/graph/catalog-meta/claims/openai-node-6-39-1-issue-803.yaml',
      'git add -f .a5c/processes/issue-803-openai-node-6-39-1-graph-update.js .a5c/processes/issue-803-openai-node-6-39-1-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track OpenAI Node SDK 6.39.1"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track OpenAI Node SDK 6.39.1 graph update" --body "Closes #${args.issueNumber}\\n\\nUpdates the Atlas graph for OpenAI Node SDK ${args.targetVersion} as the Codex SDK adapter upstream, with issue-scoped release evidence and claims for the undici dispatcher mismatch guidance and binary text/plan raw-upload behavior.\\n\\nVerification:\\n- npm run verify:metadata\\n- npm run build --workspace=@a5c-ai/atlas")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Completed OpenAI Node SDK %s graph update.\\n\\n- Updated the Codex SDK/OpenAI Node SDK graph metadata to track %s.\\n- Added unique issue/version-scoped Atlas evidence and claims for the undici dispatcher mismatch guidance and binary text/plan raw-upload behavior.\\n- Confirmed the npm package/install method remains unchanged and no launch behavior change was modeled.\\n- Ran metadata verification and Atlas build.\\n\\nPR: %s' '${args.targetVersion}' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 803;
  const targetVersion = inputs?.targetVersion ?? '6.39.1';
  const branchName = inputs?.branchName ?? 'agent/issue-803';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTask, { targetVersion });
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
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
