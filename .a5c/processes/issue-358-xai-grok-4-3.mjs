/**
 * @process repo/issue-358-xai-grok-4-3
 * @description Track xAI Grok 4.3 model/provider records in the Atlas graph and verify graph consistency.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, expectedFiles: string[] }
 * @outputs { success: boolean, changedFiles: string[], verification: object, review: object }
 *
 * References searched before authoring:
 * - .a5c/processes/issue-316-claude-code-2-1-150-assimilation.mjs
 * - .a5c/processes/issue-320-openclaw-2026-5-22.mjs
 * - library/specializations/meta/atlas/model-layer-research.cjs
 * - library/specializations/meta/atlas/provider-layer-research.cjs
 * - docs/development/02-atlas-graph-and-agent-catalog.md
 *
 * @process specializations/meta/atlas/model-layer-research
 * @process specializations/meta/atlas/provider-layer-research
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 358;
  const expectedFiles = inputs?.expectedFiles ?? [];

  ctx.log('info', 'Phase 1: Read issue spec and current graph state');
  const spec = await ctx.task(collectSpecTask, { issueNumber }, { key: 'issue-358.collect-spec' });

  ctx.log('info', 'Phase 2: Apply xAI/Grok graph evidence updates');
  const implementation = await ctx.task(implementTask, {
    specStdout: spec?.stdout ?? '',
    expectedFiles,
  }, { key: 'issue-358.implement' });

  ctx.log('info', 'Phase 3: Verify targeted graph coverage');
  const targetedVerification = await ctx.task(targetedVerificationTask, {}, {
    key: 'issue-358.targeted-verification',
  });

  ctx.log('info', 'Phase 4: Run metadata verification');
  const metadataVerification = await ctx.task(metadataVerificationTask, {}, {
    key: 'issue-358.metadata-verification',
  });

  ctx.log('info', 'Phase 5: Review implementation against issue spec');
  const artifacts = await ctx.task(collectArtifactsTask, { expectedFiles }, {
    key: 'issue-358.collect-artifacts',
  });

  const review = await ctx.task(reviewTask, {
    specStdout: spec?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  }, { key: 'issue-358.review' });

  ctx.log('info', 'Phase 6: Commit, push, open PR, and comment on the issue');
  const publish = await ctx.task(publishTask, {
    issueNumber,
    targetBranch: inputs?.targetBranch ?? 'agent/issue-358',
    baseBranch: inputs?.baseBranch ?? 'staging',
    expectedFiles,
  }, { key: 'issue-358.publish' });

  return {
    success: review?.approved !== false,
    changedFiles: implementation?.changedFiles ?? expectedFiles,
    verification: {
      targetedVerification,
      metadataVerification,
    },
    review,
    publish,
  };
}

export const collectSpecTask = defineTask('issue-358.collect-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Collect issue #358 spec and current Grok graph state',
  shell: {
    command: [
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- CURRENT GRAPH STATE ---\\n"',
      'rg -n "xAI|xai|Grok|grok-4-3|model:grok|provider:xai" packages/atlas/graph packages/agent-catalog/src || true',
    ].join('\n'),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['graph-update', 'model-version-update', 'research'],
}));

export const implementTask = defineTask('issue-358.implement-xai-grok-4-3', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement xAI Grok 4.3 graph tracking',
  agent: {
    name: 'atlas-model-provider-maintainer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update the repository so issue #358 is fully tracked in the Atlas graph.',
      instructions: [
        'Use the SPEC block verbatim as the acceptance source.',
        'Inspect the current graph before editing. Preserve existing YAML style and node/edge shapes.',
        'Ensure xAI has a Provider record, Grok 4 has a ModelFamily record, Grok 4.3 has a ModelVersion record, and the model/provider/protocol edges are wired.',
        'Add durable evidence and claim records for the Grok 4.3 model facts and xAI provider facts instead of relying only on unsourced graph rows.',
        'Include provider capability/support edges where the provider docs support them, especially OpenAI-compatible model discovery, tool use, streaming, and structured output.',
        'Do not broaden scope beyond issue #358. Do not rewrite unrelated model/provider records.',
        `Expected files are: ${args.expectedFiles.join(', ')}`,
        'Return JSON: { changedFiles, summary, verificationHints, unresolvedItems }.',
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
  labels: ['graph-update', 'model-version-update', 'implementation'],
}));

export const targetedVerificationTask = defineTask('issue-358.targeted-verification', () => ({
  kind: 'shell',
  title: 'Verify xAI/Grok 4.3 graph coverage',
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/compute/models/grok-4-3.yaml',
      'test -f packages/atlas/graph/compute/model-families/grok-4.yaml',
      'test -f packages/atlas/graph/compute/providers/xai.yaml',
      'rg -n "id: model:grok-4-3@current" packages/atlas/graph/compute/models/grok-4-3.yaml',
      'rg -n "contextWindowTokens: 1000000" packages/atlas/graph/compute/models/grok-4-3.yaml',
      'rg -n "costPerMTokInput: 1.25" packages/atlas/graph/compute/models/grok-4-3.yaml',
      'rg -n "costPerMTokOutput: 2.5" packages/atlas/graph/compute/models/grok-4-3.yaml',
      'rg -n "provider:xai" packages/atlas/graph/compute/models/grok-4-3.yaml packages/atlas/graph/compute/providers/xai.yaml',
      'rg -n "model-transport:openai-compat" packages/atlas/graph/compute/models/grok-4-3.yaml',
      'rg -n "provider-version:xai-ge-0-0-0|xAI Chat API" packages/atlas/graph/extensions/provider-versions/provider-versions-anthropic-openai.yaml',
      'rg -n "capability:supports-structured-output|capability:supports-tool-use|capability:streaming|capability:model-discovery" packages/atlas/graph/compute/providers/xai.yaml packages/atlas/graph/compute/models/grok-4-3.yaml',
      'rg -n "evidence:xai-grok-4-3-model-docs|evidence:xai-api-reference-docs" packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
      'rg -n "claim:model-version-model-grok-4-3-current-contextwindowtokens|claim:provider-xai-openai-compatible-chat-api" packages/atlas/graph/catalog-meta/claims',
    ].join('\n'),
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'model-version-update', 'verification'],
}));

export const metadataVerificationTask = defineTask('issue-358.metadata-verification', () => ({
  kind: 'shell',
  title: 'Run metadata verification',
  shell: {
    command: 'npm run verify:metadata',
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'verification'],
}));

export const collectArtifactsTask = defineTask('issue-358.collect-artifacts', (args) => ({
  kind: 'shell',
  title: 'Collect implementation artifacts',
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'printf "\\n--- DIFF STAT ---\\n"',
      `git diff --stat -- ${args.expectedFiles.map((file) => `'${file}'`).join(' ')}`,
      'printf "\\n--- DIFF ---\\n"',
      `git diff -- ${args.expectedFiles.map((file) => `'${file}'`).join(' ')}`,
    ].join('\n'),
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'review'],
}));

export const reviewTask = defineTask('issue-358.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review xAI/Grok 4.3 graph update',
  agent: {
    name: 'atlas-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Review issue #358 implementation against the issue spec.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Report whether the xAI provider, Grok 4 family, Grok 4.3 model version, OpenAI-compatible transport, evidence, and claims are represented.',
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
  labels: ['graph-update', 'model-version-update', 'review'],
}));

export const publishTask = defineTask('issue-358.publish', (args) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue #358',
  shell: {
    command: [
      'set -euo pipefail',
      `git add -f ${args.expectedFiles.map((file) => `'${file}'`).join(' ')}`,
      'if ! git diff --cached --quiet; then',
      '  git commit -m "Track xAI Grok 4.3 graph records"',
      'fi',
      `git push -u origin ${args.targetBranch}`,
      `pr_url=$(gh pr view ${args.targetBranch} --json url --jq .url 2>/dev/null || true)`,
      'if [ -z "$pr_url" ]; then',
      `  pr_url=$(gh pr create --base ${args.baseBranch} --head ${args.targetBranch} --title "Track xAI Grok 4.3 graph records" --body "Closes #${args.issueNumber}\\n\\n## Summary\\n- Track xAI as an OpenAI-compatible provider in the Atlas graph.\\n- Track Grok 4 / Grok 4.3 model records with evidence-backed claims.\\n- Add targeted graph checks and run metadata verification." | tail -n 1)`,
      'fi',
      `gh issue comment ${args.issueNumber} --body "Implemented xAI/Grok 4.3 graph tracking on ${args.targetBranch}.\\n\\nSummary:\\n- Added/verified xAI provider, Grok 4 family, and Grok 4.3 model records.\\n- Added evidence-backed claims for key Grok 4.3 and xAI provider facts.\\n- Verified targeted graph coverage and npm run verify:metadata.\\n\\nPR: $pr_url"`,
      'printf "%s\\n" "$pr_url"',
    ].join('\n'),
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'publish'],
}));
