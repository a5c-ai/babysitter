/**
 * @process repo/issue-503-amp-release-tracking
 * @description Track Amp 0.0.1779959155-g362e01 in the Atlas graph and keep the graph/catalog guardrails aligned.
 * @inputs { issueNumber: number, targetVersion: string, previousVersion: string, branchName: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * References searched before authoring:
 * - library/specializations/collaboration/github/*
 * - library/methodologies/superpowers/verification-before-completion.js
 * - repo process .a5c/processes/issue-446-amp-release-tracking.mjs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectSpecTask = defineTask('issue-503.collect-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Collect issue, npm, and graph state',
  labels: ['issue-503', 'agent-version-update', 'graph-update', 'research'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      `npm view @ampcode/cli@${args.targetVersion} version dist.tarball --json`,
      `rg -n "${args.previousVersion}|${args.targetVersion}|@ampcode/cli|releaseNotesUrl|assimilationNotes" packages/atlas/graph/agent-stack/versions/amp-current.yaml packages/atlas/graph/tests/claims/amp-current-release-tracking.test.cjs docs/adapters/reference/agents/amp.md packages/agent-catalog || true`,
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

const implementTask = defineTask('issue-503.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align Amp graph update artifacts',
  labels: ['issue-503', 'agent-version-update', 'graph-update', 'implementation'],
  agent: {
    name: 'atlas-agent-version-assimilator',
    prompt: {
      role: 'Atlas graph maintainer',
      task: 'Implement issue #503 by aligning Amp graph version metadata and any directly related agent-catalog guardrails.',
      instructions: [
        'Edit the repository directly.',
        'Use the SPEC block verbatim as the acceptance source.',
        'Ensure packages/atlas/graph/agent-stack/versions/amp-current.yaml records the target version, npm package, releasedAt date, release note URL, and no-public-release-notes assimilation note.',
        'Update packages/atlas/graph/tests/claims/amp-current-release-tracking.test.cjs so the claim protects the target version instead of the previous one.',
        'Check whether packages/agent-catalog needs a source change. If it only consumes the Atlas graph at build time, leave it unchanged and report that.',
        'Keep launch behavior, transport, auth, MCP, install metadata, and package metadata unchanged unless SPEC proves drift.',
        'Return JSON: { changedFiles: string[], summary: string, agentCatalogChanged: boolean, noUserFacingDrift: boolean }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-503.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Amp graph update',
  labels: ['issue-503', 'agent-version-update', 'graph-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      `test "$(npm view @ampcode/cli@${args.targetVersion} version)" = "${args.targetVersion}"`,
      `rg -n 'versionRange: ">=${args.targetVersion}"|currentVersion: "${args.targetVersion}"|releasedAt: "2026-05-28"|releaseNotesUrl: "https://www.npmjs.com/package/@ampcode/cli/v/${args.targetVersion}"|no public Amp changelog|No release-note evidence' packages/atlas/graph/agent-stack/versions/amp-current.yaml`,
      `rg -n "${args.targetVersion}|issue #503|npmjs.com/package/@ampcode/cli/v/${args.targetVersion}" packages/atlas/graph/tests/claims/amp-current-release-tracking.test.cjs`,
      'node --test packages/atlas/graph/tests/claims/amp-current-release-tracking.test.cjs',
      'npm run build:atlas',
      'npm run build --workspace=@a5c-ai/agent-catalog',
      'npm run verify:metadata',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-503.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Amp artifacts for final review',
  labels: ['issue-503', 'agent-version-update', 'graph-update', 'review'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/amp-current.yaml packages/atlas/graph/tests/claims/amp-current-release-tracking.test.cjs packages/agent-catalog .a5c/processes/issue-503-amp-release-tracking.mjs .a5c/processes/issue-503-amp-release-tracking.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-503.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Amp graph update against issue spec',
  labels: ['issue-503', 'agent-version-update', 'graph-update', 'review'],
  agent: {
    name: 'atlas-agent-version-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Review the Amp release tracking result against issue #503.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], summary: string }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
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

const publishTask = defineTask('issue-503.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-503', 'agent-version-update', 'graph-update', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check -- packages/atlas/graph/agent-stack/versions/amp-current.yaml packages/atlas/graph/tests/claims/amp-current-release-tracking.test.cjs .a5c/processes/issue-503-amp-release-tracking.mjs .a5c/processes/issue-503-amp-release-tracking.inputs.json',
      'git add packages/atlas/graph/agent-stack/versions/amp-current.yaml packages/atlas/graph/tests/claims/amp-current-release-tracking.test.cjs',
      'git add -f .a5c/processes/issue-503-amp-release-tracking.mjs .a5c/processes/issue-503-amp-release-tracking.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "test(atlas): track Amp 0.0.1779959155"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base staging --head ${args.branchName} --title "Track Amp ${args.targetVersion} release" --body "Closes #${args.issueNumber}"$'\\n\\n- Confirms the Atlas Amp AgentVersion tracks @ampcode/cli '${args.targetVersion}'.\\n- Updates the focused Atlas claim test to preserve the target version, release URL, install metadata, and no-public-release-notes note.\\n- Builds Atlas and agent-catalog and runs metadata verification.')"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Amp %s graph tracking.\\n\\n- Confirmed the Atlas Amp AgentVersion records @ampcode/cli %s with npm release evidence.\\n- Updated the focused graph claim test to preserve the new version, release URL, install metadata, and no-public-release-notes note.\\n- Verified npm metadata, the claim test, Atlas build, agent-catalog build, and metadata verification.\\n- PR: %s' '${args.targetVersion}' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 503;
  const targetVersion = inputs?.targetVersion ?? '0.0.1779959155-g362e01';
  const previousVersion = inputs?.previousVersion ?? '0.0.1779896748-g596c49';
  const branchName = inputs?.branchName ?? 'agent/issue-503';

  const spec = await ctx.task(collectSpecTask, {
    issueNumber,
    targetVersion,
    previousVersion,
  });

  const implementation = await ctx.task(implementTask, {
    specStdout: spec?.stdout ?? '',
  });

  const verification = await ctx.task(verifyTask, { targetVersion });
  const artifacts = await ctx.task(readArtifactsTask, {
    changedFiles: implementation?.changedFiles ?? [],
  });

  const review = await ctx.task(reviewTask, {
    specStdout: spec?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Review did not approve Amp release tracking.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, {
    issueNumber,
    targetVersion,
    branchName,
  });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? `Tracked Amp ${targetVersion}.`,
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
