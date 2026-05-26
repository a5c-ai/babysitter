/**
 * @process repo/issue-316-claude-code-2-1-150-assimilation
 * @description Assimilate Claude Code 2.1.150 into the Atlas/agent-catalog graph with no-op user-facing release handling.
 * @inputs { issueNumber: number, targetVersion: string, previousVersion: string }
 * @outputs { success, phases, summary, verification }
 *
 * References searched before authoring:
 * - library/specializations/meta/harnesses/claude-code
 * - library/specializations/sdk-platform-development
 * - processes/shared/source-discovery.js
 * - processes/shared/deterministic-quality-gate.js
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectSpecTask = defineTask(
  'issue-316.collect-spec',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Collect issue, release, and graph state',
    shell: {
      command: [
        `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `npm view @anthropic-ai/claude-code@${args.targetVersion} version dist.tarball --json`,
        `rg -n "${args.previousVersion}|${args.targetVersion}|@anthropic-ai/claude-code|claude-code" packages/atlas/graph/agent-stack/versions/claude-code-1-x.yaml packages/sdk/src/harness/install.ts packages/agent-catalog/src/catalog.test.ts packages/atlas/graph/catalog-meta || true`,
      ].join('\n'),
    },
    expectedExitCode: 0,
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['agent-version-update', 'graph-update', 'research'],
  }),
  { kind: 'shell', title: 'Collect issue, release, and graph state' },
);

const recordAssimilationTask = defineTask(
  'issue-316.record-assimilation',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Record no-op Claude Code assimilation',
    agent: {
      name: 'atlas-agent-version-assimilator',
      prompt: {
        role: 'Atlas graph maintainer',
        task: 'Record Claude Code 2.1.150 as a no-op user-facing assimilation.',
        instructions: [
          'Use the SPEC block verbatim as the acceptance source.',
          'Confirm the graph lower bound is >=2.1.150.',
          'Do not change launchBehavior, install metadata, transport-mux, hook bridge, or plugin handling unless the release notes or smoke checks prove drift.',
          'Add durable graph/catalog evidence that v2.1.150 has no user-facing modeling changes.',
          'Add a focused regression assertion so future graph refreshes preserve the record.',
          'Return JSON: { changedFiles: string[], summary: string, noUserFacingDrift: boolean }.',
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
    labels: ['agent-version-update', 'graph-update', 'implementation'],
  }),
  { kind: 'agent', title: 'Record no-op assimilation' },
);

const verifyAssimilationTask = defineTask(
  'issue-316.verify-assimilation',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify Claude Code 2.1.150 assimilation',
    shell: {
      command: [
        `test "$(npm view @anthropic-ai/claude-code@${args.targetVersion} version)" = "${args.targetVersion}"`,
        `npx -y -p @anthropic-ai/claude-code@${args.targetVersion} claude --version`,
        `rg -n 'versionRange: ">=${args.targetVersion}"' packages/atlas/graph/agent-stack/versions/claude-code-1-x.yaml`,
        `rg -n 'claude-code-${args.targetVersion.replaceAll('.', '-')}-no-user-facing-changes|claude-code-${args.targetVersion.replaceAll('.', '-')}-release' packages/atlas/graph/catalog-meta packages/agent-catalog/src/catalog.test.ts`,
        'npm run build:sdk',
        'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts -t "records Claude Code 2.1.150 as a no-op user-facing assimilation|Claude Code|sdk fallback metadata contract|hooks-mux catalog detection contract" packages/agent-catalog/src/catalog.test.ts packages/sdk/src/harness/__tests__/harness.test.ts packages/sdk/src/harness/__tests__/install.test.ts packages/sdk/src/harness/__tests__/claudeCodeSessionStart.test.ts packages/sdk/src/harness/__tests__/claudeCodeResolutionPrecedence.test.ts packages/sdk/src/harness/amuxFallbackMetadata.contract.test.ts packages/hooks-mux/core/src/discovery/__tests__/detector.contract.test.ts',
      ].join('\n'),
    },
    expectedExitCode: 0,
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['agent-version-update', 'graph-update', 'verification'],
  }),
  { kind: 'shell', title: 'Verify assimilation' },
);

const reviewTask = defineTask(
  'issue-316.review',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Review assimilation result',
    agent: {
      name: 'atlas-agent-version-reviewer',
      prompt: {
        role: 'Atlas graph reviewer',
        task: 'Review the Claude Code 2.1.150 assimilation against the issue acceptance checklist.',
        instructions: [
          'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
          'Report whether launch behavior, install metadata, transport, hook bridge, and plugin handling were intentionally left unchanged.',
          'Report whether smoke checks passed with @anthropic-ai/claude-code@2.1.150.',
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
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['agent-version-update', 'graph-update', 'review'],
  }),
  { kind: 'agent', title: 'Review assimilation' },
);

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 316;
  const targetVersion = inputs?.targetVersion ?? '2.1.150';
  const previousVersion = inputs?.previousVersion ?? '2.1.148';

  const spec = await ctx.task(collectSpecTask, {
    issueNumber,
    targetVersion,
    previousVersion,
  }, { key: 'issue-316.collect-spec' });

  const implementation = await ctx.task(recordAssimilationTask, {
    specStdout: spec?.stdout ?? '',
  }, { key: 'issue-316.record-assimilation' });

  const verification = await ctx.task(verifyAssimilationTask, {
    targetVersion,
  }, { key: 'issue-316.verify-assimilation' });

  const artifacts = [
    'Implementation:',
    JSON.stringify(implementation ?? {}, null, 2),
    '',
    'Verification stdout:',
    verification?.stdout ?? '',
    '',
    'Verification stderr:',
    verification?.stderr ?? '',
  ].join('\n');

  const review = await ctx.task(reviewTask, {
    specStdout: spec?.stdout ?? '',
    artifactsStdout: artifacts,
  }, { key: 'issue-316.review' });

  return {
    success: review?.approved !== false,
    phases: ['collect-spec', 'record-assimilation', 'verify-assimilation', 'review'],
    summary: review?.summary ?? 'Assimilated Claude Code 2.1.150 as a no-op user-facing update.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
  };
}
