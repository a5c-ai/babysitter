/**
 * @process repo/issue-498-gemini-cli-0-44-0-graph-update
 * @description Finish Gemini CLI 0.44.0 Atlas graph tracking with stable AgentVersion identity, release evidence, and catalog coverage.
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

const readContextTask = defineTask('issue-498.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR, and Gemini graph context',
  labels: ['issue-498', 'gemini-cli', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} OR #${args.issueNumber}" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- merged daily upstream graph pr ---\\n"',
      'gh pr view 495 --json number,title,state,mergedAt,headRefName,baseRefName,body,comments,files',
      'printf "\\n--- current Gemini graph refs ---\\n"',
      'rg -n "agentVersion:gemini:ge-0-43-0|agentVersion:gemini:ge-0-44-0|0\\\\.44\\\\.0|0\\\\.43\\\\.0|agent-tui|tui-tester|first-wins|project-prioritized|Auto modes|keychain|NO_PROXY|configured MCP|refresh-token|AgentSession" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts"',
      'printf "\\n--- current Gemini version file ---\\n"',
      'cat packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-498.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Gemini CLI 0.44.0 graph update',
  labels: ['issue-498', 'gemini-cli', 'implementation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Finish the Gemini CLI 0.44.0 Atlas graph and agent-catalog update in the repository.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Preserve unrelated local worktree changes.',
        'Keep the stable AgentVersion node id agentVersion:gemini:ge-0-43-0 coherent with its versionRange; do not introduce a split agentVersion:gemini:ge-0-44-0 identity unless all inbound graph references are migrated.',
        'Represent Gemini CLI 0.44.0 as the current concrete version with official release evidence.',
        'Update stale install metadata for the target version while preserving the unchanged npm package/install method.',
        'Keep issue checklist details represented in version assimilation notes and evidence notes: merged Auto mode, keychain auth for --list-sessions/non-interactive, MCP OAuth/token/NO_PROXY/configured-server fixes, project-prioritized first-wins agent registration, isolated subagent context, AgentSession agent-tool wiring, and new agent-tui/tui-tester skills.',
        'Add agent-catalog coverage only if needed to guard the graph semantics touched by this change.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-498.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Gemini CLI graph metadata',
  labels: ['issue-498', 'gemini-cli', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "id: agentVersion:gemini:ge-0-43-0|versionRange: \\\">=0.43.0\\\"|currentVersion: \\"0.44.0\\"|releaseNotesUrl: \\"https://github.com/google-gemini/gemini-cli/releases/tag/v0.44.0\\"" packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml',
      'rg -n "npm install -g @google/gemini-cli@0.44.0|evidence:gemini-cli-0-44-0-release|source-ref:gemini-cli-github" packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml',
      'rg -n "evidence:gemini-cli-0-44-0-release|https://github.com/google-gemini/gemini-cli/releases/tag/v0.44.0|agent-tui|tui-tester|first-wins|NO_PROXY|configured MCP servers|AgentSession" packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml',
      'if rg -n "agentVersion:gemini:ge-0-44-0" packages/atlas/graph -g "*.yaml"; then exit 1; fi',
      'git diff --check',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm test --workspace=@a5c-ai/agent-catalog -- --runInBand',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-498.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Gemini graph artifact diff',
  labels: ['issue-498', 'gemini-cli', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/catalog.test.ts .a5c/processes/issue-498-gemini-cli-0-44-0-graph-update.js .a5c/processes/issue-498-gemini-cli-0-44-0-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-498.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Gemini CLI graph update against issue spec',
  labels: ['issue-498', 'gemini-cli', 'review'],
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

const publishTask = defineTask('issue-498.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-498', 'gemini-cli', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'git add packages/agent-catalog/src/catalog.test.ts',
      'git add -f .a5c/processes/issue-498-gemini-cli-0-44-0-graph-update.js .a5c/processes/issue-498-gemini-cli-0-44-0-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "fix(atlas): track Gemini CLI 0.44.0 release"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Gemini CLI 0.44.0 release" --body "Closes #${args.issueNumber}\\n\\nFinishes the Gemini CLI 0.44.0 Atlas graph update with stable AgentVersion identity, official release evidence, refreshed install metadata, and agent-catalog coverage.")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Completed Gemini CLI %s graph tracking.\\n\\n- Kept the stable Gemini AgentVersion node identity coherent while recording %s as the current concrete version.\\n- Added official v%s release evidence/source linkage and preserved the issue checklist details in graph notes.\\n- Updated stale npm install metadata for @google/gemini-cli %s and added catalog coverage for the release record.\\n- Ran metadata verification, Atlas build, agent-catalog tests, and diff checks.\\n\\nPR: %s' '${args.targetVersion}' '${args.targetVersion}' '${args.targetVersion}' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 498;
  const targetVersion = inputs?.targetVersion ?? '0.44.0';
  const branchName = inputs?.branchName ?? 'agent/issue-498';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementGraphUpdateTask, {
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
