/**
 * @process repo/issue-505-droid-cli-0-135-0-graph-update
 * @description Finish Factory Droid CLI 0.135.0 Atlas graph tracking and catalog coverage.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, changedFiles, verification, review, publish }
 *
 * @process methodologies/gsd/quick
 * @process methodologies/superpowers/verification-before-completion
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-505.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, related PR, and Droid graph context',
  labels: ['issue-505', 'droid', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} OR #${args.issueNumber}" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- related graph PR ---\\n"',
      'gh pr view 495 --json number,title,state,mergedAt,headRefName,baseRefName,body,comments,files',
      'printf "\\n--- Droid graph refs ---\\n"',
      'rg -n "Droid|droid|@factory/cli|Factory Router|hooks.json|os-sandbox|sandbox|0\\\\.135\\\\.0" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphTask = defineTask('issue-505.implement-graph', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Droid 0.135.0 graph update',
  labels: ['issue-505', 'droid', 'implementation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Finish the Factory Droid CLI 0.135.0 graph and catalog update in the repository.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Keep changes tightly scoped to issue #505 and Droid CLI 0.135.0.',
        'Preserve unrelated local worktree changes.',
        'The merged daily graph update may already have advanced currentVersion/versionRange. Verify what remains against the issue checklist.',
        'Represent the related Factory docs observations in existing graph surfaces where appropriate: hook configuration path .factory/hooks.json, os-sandboxing beta as provisional runtime/sandbox metadata, and Factory Router naming if an existing model-routing surface can carry it without schema changes.',
        'Add or link evidence for the npm 0.135.0 package record and related docs observations.',
        'Update agent-catalog tests only where needed to cover graph-derived Droid metadata.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-505.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Droid 0.135.0 graph update',
  labels: ['issue-505', 'droid', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "currentVersion: \\"0.135.0\\"|versionRange: \\">=0.135.0\\"|https://www.npmjs.com/package/@factory/cli/v/0.135.0" packages/atlas/graph/agent-stack/versions/droid-current.yaml',
      'rg -n "\\.factory/hooks\\.json|os-sandboxing beta|Factory Router|evidence:droid-cli-0-135-0" packages/atlas/graph packages/agent-catalog/src',
      'git diff --check',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm run build --workspace=@a5c-ai/agent-catalog',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/agent-catalog/src/catalog.test.ts -t "Droid CLI 0.135.0"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-505.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Droid artifact diff',
  labels: ['issue-505', 'droid', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/droid-current.yaml packages/atlas/graph/agent-stack/platform-impls/droid-platform-current.yaml packages/atlas/graph/agent-stack/runtime-impls/droid-runtime-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/catalog.test.ts .a5c/processes/issue-505-droid-cli-0-135-0-graph-update.js .a5c/processes/issue-505-droid-cli-0-135-0-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-505.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Droid graph update against issue spec',
  labels: ['issue-505', 'droid', 'review'],
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
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-505.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-505', 'droid', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/droid-current.yaml',
      'git add packages/atlas/graph/agent-stack/platform-impls/droid-platform-current.yaml',
      'git add packages/atlas/graph/agent-stack/runtime-impls/droid-runtime-current.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'git add packages/agent-catalog/src/catalog.test.ts',
      'git add -f .a5c/processes/issue-505-droid-cli-0-135-0-graph-update.js .a5c/processes/issue-505-droid-cli-0-135-0-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Droid CLI 0.135.0 details"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Droid CLI 0.135.0 graph details" --body "Closes #${args.issueNumber}\\n\\nUpdates Droid CLI 0.135.0 graph metadata with release evidence and related Factory docs observations, plus catalog coverage for the graph-derived fields.")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Completed Droid CLI %s graph update.\\n\\n- Verified the current AgentVersion record tracks @factory/cli %s.\\n- Added evidence and graph metadata for the related Factory docs observations: .factory/hooks.json, os-sandboxing beta, and Factory Router.\\n- Added agent-catalog coverage for the graph-derived Droid metadata.\\n- Ran metadata verification, Atlas build, agent-catalog build, focused Droid catalog test, and diff checks.\\n\\nPR: %s' '${args.targetVersion}' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 505;
  const targetVersion = inputs?.targetVersion ?? '0.135.0';
  const branchName = inputs?.branchName ?? 'agent/issue-505';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementGraphTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTask, { targetVersion });
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
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
