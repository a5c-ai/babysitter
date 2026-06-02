/**
 * @process repo/issue-859-codex-0-136-0-graph-update
 * @description Assimilate Codex CLI 0.136.0 through additive Atlas graph patch files.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/maestro/maestro-knowledge-graph
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-859.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release, process references, and Codex graph context',
  labels: ['issue-859', 'codex', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- Codex 0.136.0 release ---\\n"',
      'gh release view rust-v0.136.0 --repo openai/codex --json name,tagName,publishedAt,url,body',
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimil|verify|knowledge-graph" /home/runner/.a5c/process-library/babysitter-repo/library .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- Codex graph surface ---\\n"',
      'rg -n "codex|0\\\\.136\\\\.0|rust-v0\\\\.136\\\\.0|archive|app-server --stdio|OSC 8|CODEX_API_KEY|server token|CodexConfig|adapterMetadata|releaseTracking" packages/atlas/graph -g "*.yaml" | head -1200',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-859.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Codex CLI 0.136.0 additive graph patch',
  labels: ['issue-859', 'codex', 'implementation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add additive Atlas graph YAML patch files for Codex CLI 0.136.0.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Preserve unrelated local worktree changes.',
        'Do not edit existing shared Atlas YAML files; create additive patch files instead.',
        'Use unique filenames named after the agent and version.',
        'Place the agent-version patch in packages/atlas/graph/agent-stack/agent-versions/.',
        'Place new evidence sources in packages/atlas/graph/catalog-meta/evidence-sources/.',
        'Do not nest issue #859 release-tracking data under adapterMetadata; use sibling AgentVersion attributes instead.',
        'Cover Codex 0.136.0 release facts from the issue: OSC 8 links/table fallback, archive/unarchive lifecycle, app-server --stdio and MCP/status/resume updates, CODEX_API_KEY remote registration, short-lived server-token remote websockets, Windows sandbox setup, image generation extension path, safety hardening, and Python SDK CodexConfig docs.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-859.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Codex CLI 0.136.0 graph patch',
  labels: ['issue-859', 'codex', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/agent-stack/agent-versions/codex-0-136-0-update.yaml',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/codex-0-136-0-release.yaml',
      '! rg -n "issue859ReleaseAdditions" packages/atlas/graph/agent-stack/agent-versions/codex-0-136-0-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/codex-0-136-0-release.yaml',
      'rg -n "patch: true|currentVersion: \\"0.136.0\\"|releaseTracking:|sessionLifecycle:|appServer:|remoteControl:|terminalRendering:|windowsElevatedSetupCommand|CodexConfig|evidence:codex-rust-v0-136-0-issue-859-additive-release" packages/atlas/graph/agent-stack/agent-versions/codex-0-136-0-update.yaml',
      'rg -n "rust-v0.136.0|0.136.0|OSC 8|archive|app-server --stdio|CODEX_API_KEY|server-token|CodexConfig" packages/atlas/graph/catalog-meta/evidence-sources/codex-0-136-0-release.yaml',
      'git diff --check',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-859.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final Codex graph artifacts',
  labels: ['issue-859', 'codex', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/agent-versions/codex-0-136-0-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/codex-0-136-0-release.yaml .a5c/processes/issue-859-codex-0-136-0-graph-update.js .a5c/processes/issue-859-codex-0-136-0-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-859.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Codex graph patch against issue spec',
  labels: ['issue-859', 'codex', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare SPEC to ARTIFACTS directly and report per-criterion pass/fail.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], residualRisk: string[], summary: string }.',
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

const publishTask = defineTask('issue-859.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-859', 'codex', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      `branch="${args.branchName}"`,
      `base="${args.baseBranch}"`,
      'git add packages/atlas/graph/agent-stack/agent-versions/codex-0-136-0-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/codex-0-136-0-release.yaml',
      'git add -f .a5c/processes/issue-859-codex-0-136-0-graph-update.js .a5c/processes/issue-859-codex-0-136-0-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Codex CLI 0.136.0"; fi',
      'git push -u origin "$branch"',
      'pr_url="$(gh pr list --head "$branch" --json url --jq \'.[0].url // empty\' 2>/dev/null || true)"',
      `if [ -z "$pr_url" ]; then pr_url="$(gh pr create --base "$base" --head "$branch" --title "Track Codex CLI 0.136.0 graph update" --body "Closes #${args.issueNumber}\\n\\nAdds issue-scoped additive Atlas graph files for Codex CLI ${args.targetVersion}, including release evidence and sibling release-tracking attributes for session archive lifecycle, app-server stdio/status/resume updates, remote server-token auth, OSC 8 rendering, Windows sandbox provisioning, image generation extension routing, and safety hardening.\\n\\nVerification:\\n- npm run verify:metadata\\n- npm run build --workspace=@a5c-ai/atlas")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Completed Codex CLI %s graph update.\\n\\n- Added unique additive graph patch: packages/atlas/graph/agent-stack/agent-versions/codex-0-136-0-update.yaml\\n- Added unique release evidence source: packages/atlas/graph/catalog-meta/evidence-sources/codex-0-136-0-release.yaml\\n- Kept release-tracking data as sibling AgentVersion attributes rather than under adapterMetadata.\\n- Ran metadata verification and Atlas build.\\n\\nPR: %s' '${args.targetVersion}' "$pr_url")"`,
      'printf "%s\\n" "$pr_url"',
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
  const issueNumber = inputs?.issueNumber ?? 859;
  const targetVersion = inputs?.targetVersion ?? '0.136.0';
  const branchName = inputs?.branchName ?? 'agent/issue-859';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementTask, {
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
    return { success: false, changedFiles: implementation?.changedFiles ?? [], verification, review };
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
