/**
 * @process repo/issue-502-pi-0-76-0-graph-update
 * @description Assimilate Pi 0.76.0 release details into the Atlas graph and agent-catalog coverage.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/maestro/maestro-knowledge-graph
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-502.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release, process references, and Pi graph context',
  labels: ['issue-502', 'pi', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- Pi 0.76.0 release ---\\n"',
      'gh release view v0.76.0 --repo earendil-works/pi --json name,tagName,publishedAt,url,body || true',
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimilat|verify|knowledge-graph" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- Pi graph and catalog surface ---\\n"',
      'rg -n "Pi|pi-coding-agent|agent:pi|0\\\\.75\\\\.5|0\\\\.76\\\\.0|session-id|excludeFromContext|retry.provider.maxRetries|httpIdleTimeoutMs|websocketConnectTimeoutMs|session_id|cache-affinity" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts" -g "*.md" | head -900',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-502.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Pi 0.76.0 graph update',
  labels: ['issue-502', 'pi', 'implementation'],
  agent: {
    name: 'pi-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update Atlas graph YAML and agent-catalog coverage for the Pi 0.76.0 release.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #502 and Pi 0.76.0.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML patterns.',
        'Model --session-id as an explicit Pi launch/session control input.',
        'Expose or preserve RPC bash excludeFromContext support in the appropriate Pi runtime/tool metadata and catalog coverage.',
        'Record bounded Codex WebSocket/SSE wait, retry.provider.maxRetries, websocketConnectTimeoutMs, httpIdleTimeoutMs, and zero SDK retry assumptions in Pi provider/transport notes.',
        'Record that Codex Responses cache-affinity headers use session-id, not session_id, where proxy/provider translation metadata already models that behavior.',
        'Update agent-catalog tests only if graph-to-catalog coverage needs a guardrail.',
        'Do not invent broad schema changes unless verification proves they are required.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-502.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Pi 0.76.0 graph update',
  labels: ['issue-502', 'pi', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "currentVersion: \\"0.76.0\\"|releaseNotesUrl: \\"https://github.com/earendil-works/pi/releases/tag/v0.76.0\\"" packages/atlas/graph/agent-stack/versions/pi-current.yaml packages/atlas/graph/agent-stack/agent-versions/pi-ge-0-75-5.yaml',
      'rg -n -- "--session-id|sessionId|excludeFromContext|retry.provider.maxRetries|websocketConnectTimeoutMs|httpIdleTimeoutMs|session-id|session_id" packages/atlas/graph packages/agent-catalog/src',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm test --workspace=@a5c-ai/agent-catalog -- --runInBand',
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

const readArtifactsTask = defineTask('issue-502.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Pi artifacts for review',
  labels: ['issue-502', 'pi', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/pi-current.yaml packages/atlas/graph/agent-stack/agent-versions/pi-ge-0-75-5.yaml packages/atlas/graph/agent-stack/launch-configs/pi-default.yaml packages/atlas/graph/lifecycle/session-semantics/pi.yaml packages/atlas/graph/extensions/discovery-signals/pi-host-env.yaml packages/atlas/graph/extensions/plugin-artifacts/plugin-target-pi.yaml packages/atlas/graph/agent-stack/runtime-impls/pi-runtime-current.yaml packages/atlas/graph/extensions/provider-translations/pi-translations.yaml packages/atlas/graph/extensions/adapter-models/pi-models.yaml packages/atlas/graph/sourceref-scope/source-refs/agent-githubs.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/catalog.test.ts .a5c/processes/issue-502-pi-0-76-0-graph-update.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-502.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Pi 0.76.0 graph update against issue spec',
  labels: ['issue-502', 'pi', 'review'],
  agent: {
    name: 'pi-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #502 requirements to the final artifacts.',
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

const publishTask = defineTask('issue-502.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-502', 'pi', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/pi-current.yaml',
      'git add packages/atlas/graph/agent-stack/agent-versions/pi-ge-0-75-5.yaml',
      'git add packages/atlas/graph/agent-stack/launch-configs/pi-default.yaml',
      'git add packages/atlas/graph/lifecycle/session-semantics/pi.yaml',
      'git add packages/atlas/graph/extensions/discovery-signals/pi-host-env.yaml',
      'git add packages/atlas/graph/agent-stack/runtime-impls/pi-runtime-current.yaml',
      'git add packages/atlas/graph/extensions/provider-translations/pi-translations.yaml',
      'git add packages/atlas/graph/extensions/adapter-models/pi-models.yaml',
      'git add packages/atlas/graph/extensions/plugin-artifacts/plugin-target-pi.yaml',
      'git add packages/atlas/graph/sourceref-scope/source-refs/agent-githubs.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'git add packages/agent-catalog/src/catalog.test.ts',
      'git add -f .a5c/processes/issue-502-pi-0-76-0-graph-update.js .a5c/processes/issue-502-pi-0-76-0-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Pi 0.76.0"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Pi 0.76.0 in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Pi 0.76.0 graph tracking.\\n\\n- Updated Pi version metadata and release notes coverage.\\n- Modeled --session-id launch/session control, RPC bash excludeFromContext, bounded Codex WebSocket/SSE timeout and retry behavior, and cache-affinity session-id header handling.\\n- Added agent-catalog coverage for the Pi 0.76.0 graph facts.\\n- Ran metadata verification, Atlas build, agent-catalog tests, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 502;
  const branchName = inputs?.branchName ?? 'agent/issue-502';
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
      summary: review?.summary ?? 'Final review did not approve Pi 0.76.0 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Pi 0.76.0 in Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
