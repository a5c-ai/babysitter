/**
 * @process repo/issue-444-omp-15-5-6-assimilation
 * @description Track the OMP 15.5.6 upstream release in Atlas graph/catalog metadata.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * References used while authoring:
 * - .a5c/processes/issue-316-claude-code-2-1-150-assimilation.mjs
 * - .a5c/processes/issue-359-deepseek-v4-model-tracking.mjs
 * - .a5c/processes/issue-363-cohere-model-tracking.js
 *
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function stdoutOf(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readContextTask = defineTask('issue-444.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR, process, and OMP graph context',
  labels: ['issue-444', 'omp', 'graph-update', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body --limit 20`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version-update|graph-update|release notes|assimilation|Atlas graph" /home/runner/.a5c/process-library/babysitter-repo/library .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- OMP graph and catalog surface ---\\n"',
      'rg -n "agentVersion:omp:ge-15-5-6|omp-15-5-6|PI_CODEX_WEBSOCKET_MAX_IDLE_REUSE_MS|@oh-my-pi/pi-coding-agent|URL and directory selectors|stale response frames" packages/atlas/graph packages/agent-catalog packages/agent-mux/adapters docs/agent-mux/reference -g "*.yaml" -g "*.ts" -g "*.md" | head -800',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementAssimilationTask = defineTask('issue-444.implement-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OMP 15.5.6 assimilation',
  labels: ['issue-444', 'omp', 'agent-version-update', 'graph-update', 'implementation'],
  agent: {
    name: 'omp-agent-version-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Track OMP 15.5.6 upstream release in repository metadata and tests.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep scope limited to issue #444 and the OMP 15.5.6 graph/catalog/release-record surfaces.',
        'Preserve unrelated local worktree changes.',
        'If OMP 15.5.6 metadata already exists, add focused regression coverage that pins the release version, evidence source, install/package continuity, WebSocket recovery notes, stale response purge note, and URL/directory selector notes.',
        'Use existing graph, evidence, and catalog test patterns.',
        'Do not change runtime adapter behavior unless the graph/catalog evidence proves a repo-owned runtime surface is missing.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyAssimilationTask = defineTask('issue-444.verify-assimilation', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify OMP 15.5.6 graph assimilation',
  labels: ['issue-444', 'omp', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "id: agentVersion:omp:ge-15-5-6" packages/atlas/graph/agent-stack/versions/omp-current.yaml',
      'rg -n "versionRange: \\\">=15.5.6\\\"" packages/atlas/graph/agent-stack/versions/omp-current.yaml',
      'rg -n "PI_CODEX_WEBSOCKET_MAX_IDLE_REUSE_MS|stale response frames|URL and directory selectors" packages/atlas/graph/agent-stack/versions/omp-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'rg -n "evidence:omp-15-5-6-release|agentVersion:omp:ge-15-5-6" packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'rg -n "OMP 15.5.6|omp-15-5-6|PI_CODEX_WEBSOCKET_MAX_IDLE_REUSE_MS" packages/agent-catalog/src/catalog.test.ts',
      'npm run verify:metadata',
      'npm run validate:edges',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts -t "OMP 15.5.6" packages/agent-catalog/src/catalog.test.ts',
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

const readArtifactsTask = defineTask('issue-444.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read OMP artifacts for review',
  labels: ['issue-444', 'omp', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/omp-current.yaml packages/atlas/graph/agent-stack/runtime-impls/omp-runtime-current.yaml packages/atlas/graph/agent-stack/core-impls/omp-core-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/catalog.test.ts .a5c/processes/issue-444-omp-15-5-6-assimilation.mjs .a5c/processes/issue-444-omp-15-5-6-assimilation.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-444.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review OMP 15.5.6 assimilation',
  labels: ['issue-444', 'omp', 'review'],
  agent: {
    name: 'omp-agent-version-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #444 requirements to the final artifacts.',
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
        'Return JSON: { approved: boolean, issues: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-444.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-444', 'omp', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/omp-current.yaml packages/atlas/graph/agent-stack/runtime-impls/omp-runtime-current.yaml packages/atlas/graph/agent-stack/core-impls/omp-core-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/catalog.test.ts 2>/dev/null || true',
      'git add -f .a5c/processes/issue-444-omp-15-5-6-assimilation.mjs .a5c/processes/issue-444-omp-15-5-6-assimilation.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "test(graph): track OMP 15.5.6 release" -m "Closes #444"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track OMP 15.5.6 upstream release" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked OMP 15.5.6 upstream release.\\n\\nSummary:\\n- Confirmed the graph version is pinned to OMP >=15.5.6 with the v15.5.6 release evidence source.\\n- Added focused catalog regression coverage for package/install continuity, Codex WebSocket recovery notes, stale response purge notes, and URL/directory selector improvements.\\n- Ran metadata, edge, focused catalog, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 444;
  const branchName = inputs?.branchName ?? 'agent/issue-444';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementAssimilationTask, {
    contextStdout: stdoutOf(context),
  });
  const verification = await ctx.task(verifyAssimilationTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
    contextStdout: stdoutOf(context),
    artifactsStdout: stdoutOf(artifacts),
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve OMP 15.5.6 assimilation.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked OMP 15.5.6 upstream release.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
