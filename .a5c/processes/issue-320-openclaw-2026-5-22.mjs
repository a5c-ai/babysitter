/**
 * @process repo/issue-320-openclaw-2026-5-22
 * @description Assimilate OpenClaw 2026.5.22 into Atlas graph metadata and verify graph consistency.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, specPath: string, targetVersionId: string, previousVersionId: string, verificationCommands: string[] }
 * @outputs { success: boolean, changedFiles: string[], verification: object }
 *
 * References used while authoring:
 * - library/specializations/meta/assimilation/harness/openclaw.js
 * - library/specializations/meta/assimilation/harness/shared-assimilation.js
 * - docs/agent-reference/process-authoring.md
 * - docs/development/02-atlas-graph-and-agent-catalog.md
 *
 * @process specializations/meta/assimilation/harness/openclaw
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  ctx.log('info', 'Phase 1: Read authoritative issue spec');
  const spec = await ctx.task(readSpecTask, inputs, { key: 'issue-320.read-spec' });

  ctx.log('info', 'Phase 2: Implement OpenClaw graph assimilation');
  const implementation = await ctx.task(implementOpenClawAssimilationTask, {
    inputs,
    specStdout: spec.stdout,
  }, { key: 'issue-320.implement' });

  ctx.log('info', 'Phase 3: Verify stale version references are gone from current graph surfaces');
  const staleReferenceCheck = await ctx.task(staleOpenClawReferenceCheckTask, inputs, {
    key: 'issue-320.stale-reference-check',
  });

  ctx.log('info', 'Phase 4: Verify release-specific metadata notes');
  const releaseNoteCheck = await ctx.task(releaseNoteCoverageCheckTask, inputs, {
    key: 'issue-320.release-note-coverage-check',
  });

  ctx.log('info', 'Phase 5: Run repository metadata verification');
  const metadataVerification = await ctx.task(metadataVerificationTask, inputs, {
    key: 'issue-320.metadata-verification',
  });

  ctx.log('info', 'Phase 6: Run OpenClaw package smoke check');
  const openClawSmoke = await ctx.task(openClawPackageSmokeTask, inputs, {
    key: 'issue-320.openclaw-smoke',
  });

  return {
    success: true,
    changedFiles: implementation?.changedFiles ?? [],
    implementation,
    verification: {
      staleReferenceCheck,
      releaseNoteCheck,
      metadataVerification,
      openClawSmoke,
    },
  };
}

export const readSpecTask = defineTask('issue-320.read-spec', (args) => ({
  kind: 'shell',
  title: 'Read issue #320 spec',
  shell: {
    command: `cat ${args.specPath}`,
    expectedExitCode: 0,
  },
}));

export const implementOpenClawAssimilationTask = defineTask('issue-320.implement-openclaw-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OpenClaw 2026.5.22 Atlas graph assimilation',
  labels: ['graph-update', 'agent-version-update', 'openclaw'],
  agent: {
    name: 'graph-maintainer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update the repository so OpenClaw 2026.5.22 release metadata is accurately reflected in graph files.',
      instructions: [
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
        '',
        'Inspect the current repository graph before editing. Focus on packages/atlas/graph and any generated catalog source files that must stay consistent with it.',
        `Replace current-surface references to ${args.inputs.previousVersionId} with ${args.inputs.targetVersionId}; keep only explicitly historical alias/migration references if they are intentionally historical.`,
        'Add concise metadata notes for release-specific surfaces that are present in the graph: Gateway startup/readiness caching and lazy loading, Plugin SDK channel-message poll sender, Meeting Notes source provider/CLI/import/autostart/Discord source, bare openclaw classic onboarding before config, and xAI/Grok web_search auth reuse.',
        'Do not broaden scope beyond issue #320. Preserve existing graph style and YAML shape.',
        'Return JSON: { changedFiles, summary, verificationHints, unresolvedItems }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const staleOpenClawReferenceCheckTask = defineTask('issue-320.stale-openclaw-reference-check', (args) => ({
  kind: 'shell',
  title: 'Check current OpenClaw graph references',
  shell: {
    command: [
      'set -euo pipefail',
      `bad=$(rg -n "${args.previousVersionId}" packages/atlas/graph --glob '*.yaml' --glob '!migration/legacy-id-aliases.yaml' || true)`,
      'if [ -n "$bad" ]; then',
      '  printf "%s\\n" "$bad"',
      '  exit 1',
      'fi',
      `rg -n "${args.targetVersionId}" packages/atlas/graph/agent-stack packages/atlas/graph/capabilities-and-models packages/atlas/graph/channels-hooks packages/atlas/graph/lifecycle packages/atlas/graph/extensions/muxes >/dev/null`,
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const releaseNoteCoverageCheckTask = defineTask('issue-320.release-note-coverage-check', () => ({
  kind: 'shell',
  title: 'Check release-note metadata coverage',
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "channel-message poll|poll sender" packages/atlas/graph >/dev/null',
      'rg -n "meeting-notes|Meeting Notes" packages/atlas/graph >/dev/null',
      'rg -n "classic onboarding|authored config" packages/atlas/graph >/dev/null',
      'rg -n "Grok.*web_search|web_search.*Grok|xAI OAuth" packages/atlas/graph >/dev/null',
      'rg -n "channel catalog|plugin metadata|ACPX|readiness|ready signal|filesystem probes" packages/atlas/graph >/dev/null',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const metadataVerificationTask = defineTask('issue-320.metadata-verification', () => ({
  kind: 'shell',
  title: 'Run metadata verification',
  shell: {
    command: 'npm run verify:metadata',
    expectedExitCode: 0,
  },
}));

export const openClawPackageSmokeTask = defineTask('issue-320.openclaw-package-smoke', () => ({
  kind: 'shell',
  title: 'Smoke-check openclaw@2026.5.22 package',
  shell: {
    command: 'set -euo pipefail\nnpx -y openclaw@2026.5.22 --version\nnpx -y openclaw@2026.5.22 gateway --help >/dev/null',
    expectedExitCode: 0,
  },
}));
