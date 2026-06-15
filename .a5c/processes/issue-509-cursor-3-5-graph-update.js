/**
 * @process repo/issue-509-cursor-3-5-graph-update
 * @description Track Cursor 3.5 release metadata, shared canvases, and /loop in Atlas/agent-catalog.
 * @inputs { issueNumber?: number, branchName?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * References searched before authoring:
 * - specializations/sdk-platform-development/sdk-versioning-release-management.js
 * - specializations/algorithms-optimization/graph-modeling.js
 * - methodologies/graph-of-thoughts.js
 * - repo process .a5c/processes/issue-355-claude-mythos-graph-update.js
 * - repo process .a5c/processes/issue-316-claude-code-2-1-150-assimilation.mjs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-509.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Cursor 3.5 issue, PR, release, and graph context',
  labels: ['issue-509', 'cursor', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr view 495 --json files,title,body,comments,headRefName,baseRefName,state,mergedAt,url || true`,
      'printf "\\n--- Cursor 3.5 release excerpt ---\\n"',
      'curl -fsSL https://cursor.com/changelog/shared-canvases | rg -i "3\\.5|Shared canvases|Dashboard|read-only|/loop|Pro|Teams|Enterprise|May 20, 2026" -C 2 || true',
      'printf "\\n--- existing graph/catalog refs ---\\n"',
      'rg -n "Cursor 3\\.5|cursor-3-5|shared canvas|shared canvases|/loop|slash-loop|agentVersion:cursor|cursor-current" packages/atlas/graph packages/agent-catalog/src .a5c/processes || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-509.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Cursor 3.5 graph update',
  labels: ['issue-509', 'cursor', 'graph', 'implementation'],
  agent: {
    name: 'cursor-graph-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update Atlas graph and agent-catalog coverage for Cursor 3.5.',
      instructions: [
        'Use the SPEC AND CONTEXT block verbatim as the acceptance source.',
        'Keep the update scoped to Cursor 3.5 shared canvases and /loop.',
        'Preserve the existing Cursor install method unless the release source proves a change.',
        'Add durable evidence and claims for Cursor 3.5 release assimilation.',
        'Model /loop in Cursor command-surface metadata if the graph already has an interaction primitive to reuse.',
        'Update agent-catalog tests only where needed to lock the graph behavior.',
        'Return JSON: { changedFiles: string[], summary: string, notes: string[] }.',
        '',
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-509.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Cursor 3.5 graph update',
  labels: ['issue-509', 'cursor', 'graph', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "id: agentVersion:cursor:ge-0-0-0|currentVersion: \\"3\\.5\\"|versionRange: \\\">=0\\.0\\.0\\"|releaseNotesUrl: \\"https://cursor.com/changelog/shared-canvases\\"" packages/atlas/graph/agent-stack/versions/cursor-current.yaml',
      'rg -n "interaction-primitive:slash-loop|interaction-primitive:cursor-shared-canvas|invocationToken: \\"/loop\\"" packages/atlas/graph/agent-stack/ui-impls/cursor-ui-current.yaml packages/atlas/graph/agent-stack/interaction-primitives/agent-specific-primitives.yaml packages/atlas/graph/agent-stack/interaction-primitives/claude-code-slash-commands-extended.yaml',
      'rg -n "evidence:cursor-3-5-release|claim:cursor-3-5-release-assimilation|cursor-3-5-release-assimilation" packages/atlas/graph/catalog-meta packages/agent-catalog/src/catalog.test.ts',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm run build --workspace=@a5c-ai/agent-catalog',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts -t "records Cursor 3.5 shared canvases and /loop graph metadata" packages/agent-catalog/src/catalog.test.ts',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-509.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Cursor artifacts',
  labels: ['issue-509', 'cursor', 'graph', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/cursor-current.yaml packages/atlas/graph/agent-stack/ui-impls/cursor-ui-current.yaml packages/atlas/graph/agent-stack/interaction-primitives/agent-specific-primitives.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/atlas/graph/catalog-meta/claims/cursor-3-5-release-assimilation.yaml packages/agent-catalog/src/catalog.test.ts .a5c/processes/issue-509-cursor-3-5-graph-update.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-509.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Cursor 3.5 graph update',
  labels: ['issue-509', 'cursor', 'graph', 'review'],
  agent: {
    name: 'cursor-graph-reviewer',
    prompt: {
      role: 'senior graph data reviewer',
      task: 'Compare issue #509 requirements to the final graph artifacts.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'Verify Cursor 3.5 version information is present, /loop is modeled for Cursor, evidence/claims are durable, install metadata remains unchanged, and tests cover agent-catalog projection.',
        'Return JSON: { approved: boolean, issues: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-509.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue',
  labels: ['issue-509', 'cursor', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/cursor-current.yaml',
      'git add packages/atlas/graph/agent-stack/ui-impls/cursor-ui-current.yaml',
      'git add packages/atlas/graph/agent-stack/interaction-primitives/agent-specific-primitives.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'git add packages/atlas/graph/catalog-meta/claims/cursor-3-5-release-assimilation.yaml',
      'git add packages/agent-catalog/src/catalog.test.ts',
      'git add -f .a5c/processes/issue-509-cursor-3-5-graph-update.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Cursor 3.5 release"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base staging --head ${args.branchName} --title "Track Cursor 3.5 in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Cursor 3.5 graph tracking.\\n\\n- Confirmed Cursor current version metadata for 3.5 and preserved the existing curl install command.\\n- Added official Cursor release evidence and a release-assimilation claim for shared canvases, read-only dashboard access, plan gating, and /loop.\\n- Linked Cursor UI metadata to the existing /loop interaction primitive.\\n- Added agent-catalog regression coverage and ran Atlas/agent-catalog builds plus the focused catalog test.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 509;
  const branchName = inputs?.branchName ?? 'agent/issue-509';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve the Cursor 3.5 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Cursor 3.5 in Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
