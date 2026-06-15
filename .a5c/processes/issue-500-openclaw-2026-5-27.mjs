/**
 * @process repo/issue-500-openclaw-2026-5-27
 * @description Track OpenClaw 2026.5.27 upstream release in Atlas graph metadata.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, specPath: string, targetVersionId: string, previousVersionId: string }
 * @outputs { success: boolean, changedFiles: string[], verification: object, prUrl: string }
 *
 * References used while authoring:
 * - .a5c/processes/issue-443-openclaw-2026-5-26.mjs
 * - .a5c/processes/issue-320-openclaw-2026-5-22.mjs
 * - library/processes/shared/deterministic-quality-gate.js
 * - specializations/sdk-platform-development/sdk-versioning-release-management.js
 *
 * @process specializations/sdk-platform-development/sdk-versioning-release-management
 * @process methodologies/maestro/maestro-knowledge-graph
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  ctx.log('info', 'Phase 1: Read authoritative issue spec and current graph state');
  const spec = await ctx.task(readSpecTask, inputs, { key: 'issue-500.read-spec' });
  const audit = await ctx.task(auditOpenClawGraphTask, inputs, { key: 'issue-500.audit-graph' });

  ctx.log('info', 'Phase 2: Implement OpenClaw 2026.5.27 graph assimilation');
  const implementation = await ctx.task(implementOpenClawAssimilationTask, {
    inputs,
    specStdout: spec.stdout,
    auditStdout: audit.stdout,
  }, { key: 'issue-500.implement' });

  ctx.log('info', 'Phase 3: Verify graph references and release-note coverage');
  const graphVerification = await ctx.task(graphVerificationTask, inputs, { key: 'issue-500.graph-verification' });
  const metadataVerification = await ctx.task(metadataVerificationTask, inputs, { key: 'issue-500.metadata-verification' });
  const smoke = await ctx.task(openClawPackageSmokeTask, inputs, { key: 'issue-500.openclaw-smoke' });

  ctx.log('info', 'Phase 4: Review artifacts against spec');
  const artifacts = await ctx.task(readArtifactsTask, inputs, { key: 'issue-500.read-artifacts' });
  const review = await ctx.task(reviewAssimilationTask, {
    specStdout: spec.stdout,
    artifactsStdout: artifacts.stdout,
    verificationStdout: [
      graphVerification.stdout,
      metadataVerification.stdout,
      smoke.stdout,
    ].filter(Boolean).join('\n\n'),
  }, { key: 'issue-500.review' });

  ctx.log('info', 'Phase 5: Commit, push, open PR, and comment on the issue');
  const finish = await ctx.task(finishIssueTask, {
    ...inputs,
    changedFiles: implementation?.changedFiles ?? [],
    summary: review?.summary ?? implementation?.summary ?? 'Tracked OpenClaw 2026.5.27 in Atlas graph metadata.',
  }, { key: 'issue-500.finish' });

  return {
    success: review?.approved !== false,
    changedFiles: implementation?.changedFiles ?? [],
    implementation,
    verification: {
      graphVerification,
      metadataVerification,
      smoke,
      review,
    },
    prUrl: finish?.prUrl ?? '',
  };
}

export const readSpecTask = defineTask('issue-500.read-spec', (args) => ({
  kind: 'shell',
  title: 'Read issue #500 spec',
  shell: {
    command: `cat ${args.specPath}`,
    expectedExitCode: 0,
  },
}));

export const auditOpenClawGraphTask = defineTask('issue-500.audit-openclaw-graph', (args) => ({
  kind: 'shell',
  title: 'Audit OpenClaw graph state',
  shell: {
    command: [
      'set -euo pipefail',
      `rg -n "${args.previousVersionId}|${args.targetVersionId}|2026\\.5\\.26|2026\\.5\\.27|workspace memory|workspace-memory|side-effecting|unsafe Node|Tailscale|DeepInfra|Pixverse|VLLM|Claude CLI OAuth|OpenAI-compatible embedding|Telegram|iMessage|Slack|Matrix|QQBot|Google Chat|Discord" packages/atlas/graph --glob '*.yaml' || true`,
      'sed -n "1,240p" packages/atlas/graph/agent-stack/versions/openclaw-current.yaml',
      'sed -n "1,140p" packages/atlas/graph/agent-stack/runtime-impls/openclaw-runtime-current.yaml',
      'sed -n "1,160p" packages/atlas/graph/extensions/provider-translations/generic-openai-translations.yaml',
      'sed -n "1,180p" packages/atlas/graph/extensions/muxes/canonical-muxes.yaml',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const implementOpenClawAssimilationTask = defineTask('issue-500.implement-openclaw-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OpenClaw 2026.5.27 Atlas graph assimilation',
  labels: ['graph-update', 'agent-version-update', 'openclaw'],
  agent: {
    name: 'graph-maintainer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update the repository so OpenClaw 2026.5.27 release metadata is accurately reflected in graph files.',
      instructions: [
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
        '',
        'CURRENT GRAPH AUDIT (verbatim):',
        '---',
        args.auditStdout,
        '---',
        '',
        'Inspect the current repository graph before editing. Focus on packages/atlas/graph and generated/catalog-facing files only if metadata verification requires them.',
        `Replace current-surface references to ${args.inputs.previousVersionId} with ${args.inputs.targetVersionId}; keep only explicitly historical alias/migration references if they are intentionally historical.`,
        'Update OpenClaw metadata only where matching graph surfaces exist. Required concepts: tightened security/content boundaries, Codex app-server model-first resolution and workspace-memory-through-tools routing, gateway/reply cache coverage, core OpenAI-compatible embeddings, DeepInfra catalog browsing, Pixverse video generation, VLLM thinking params, Claude CLI OAuth overlays, direct Anthropic model IDs, channel delivery fixes, and release/package hardening.',
        'Do not change package/install identity away from openclaw.',
        'Preserve existing graph style and YAML shape.',
        'Return JSON: { changedFiles, summary, verificationHints, unresolvedItems }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const graphVerificationTask = defineTask('issue-500.graph-verification', (args) => ({
  kind: 'shell',
  title: 'Verify OpenClaw 2026.5.27 graph coverage',
  shell: {
    command: [
      'set -euo pipefail',
      `bad=$(rg -n "${args.previousVersionId}" packages/atlas/graph --glob '*.yaml' --glob '!migration/legacy-id-aliases.yaml' || true)`,
      'if [ -n "$bad" ]; then',
      '  printf "%s\\n" "$bad"',
      '  exit 1',
      'fi',
      `rg -n "${args.targetVersionId}" packages/atlas/graph/agent-stack packages/atlas/graph/extensions packages/atlas/graph/channels-hooks packages/atlas/graph/lifecycle packages/atlas/graph/capabilities-and-models >/dev/null`,
      'rg -n "group prompt text|repeated-dot|side-effecting command wrappers|unsafe Node runtime env|no-auth Tailscale|admin authority" packages/atlas/graph >/dev/null',
      'rg -n "runtime models resolve first|workspace memory routes through tools|shared app-server clients|hook relay generations|false runtime live switches" packages/atlas/graph >/dev/null',
      'rg -n "session.*plugin.*auth.*tool-search.*metadata caches|tool-search.*metadata caches|hidden cleanup timeouts" packages/atlas/graph >/dev/null',
      'rg -n "OpenAI-compatible embedding providers|DeepInfra catalog browsing|Pixverse video generation|VLLM thinking params|Claude CLI OAuth overlays|direct Anthropic model IDs" packages/atlas/graph >/dev/null',
      'rg -n "Telegram.*iMessage.*Slack.*Matrix.*QQBot.*Discord.*Google Chat|Google Chat.*QQBot" packages/atlas/graph >/dev/null',
      'rg -n "npm dist exclusions|Docker runtime workspace templates|postpublish checks" packages/atlas/graph >/dev/null',
      'rg -n "sourcePackage: \\"openclaw\\"|sourcePackage: openclaw" packages/atlas/graph/agent-stack/versions/openclaw-current.yaml >/dev/null',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const metadataVerificationTask = defineTask('issue-500.metadata-verification', () => ({
  kind: 'shell',
  title: 'Run metadata verification',
  shell: {
    command: 'npm run verify:metadata',
    expectedExitCode: 0,
  },
}));

export const openClawPackageSmokeTask = defineTask('issue-500.openclaw-package-smoke', () => ({
  kind: 'shell',
  title: 'Smoke-check openclaw@2026.5.27 package',
  shell: {
    command: 'set -euo pipefail\nnpx -y openclaw@2026.5.27 --version\nnpx -y openclaw@2026.5.27 --help >/dev/null',
    expectedExitCode: 0,
  },
}));

export const readArtifactsTask = defineTask('issue-500.read-artifacts', () => ({
  kind: 'shell',
  title: 'Read changed artifacts',
  shell: {
    command: 'git diff -- packages/atlas/graph packages/agent-catalog .a5c/processes/issue-500-openclaw-2026-5-27.mjs .a5c/processes/issue-500-openclaw-2026-5-27.inputs.json .a5c/processes/specs/issue-500-openclaw-2026-5-27.md',
    expectedExitCode: 0,
  },
}));

export const reviewAssimilationTask = defineTask('issue-500.review-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review OpenClaw assimilation against issue spec',
  labels: ['graph-update', 'agent-version-update', 'review'],
  agent: {
    name: 'atlas-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Review the OpenClaw 2026.5.27 assimilation against the issue acceptance checklist.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Report per-checklist pass/fail for current version references, release-note concept coverage, unchanged package identity, agent-catalog consistency, and verification outputs.',
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
        '',
        'VERIFICATION OUTPUTS (verbatim):',
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

export const finishIssueTask = defineTask('issue-500.finish', (args) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue #500',
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph',
      'if [ -d packages/agent-catalog ]; then git add packages/agent-catalog; fi',
      `git add -f .a5c/processes/issue-500-openclaw-2026-5-27.mjs .a5c/processes/issue-500-openclaw-2026-5-27.inputs.json .a5c/processes/specs/issue-500-openclaw-2026-5-27.md`,
      'if ! git diff --cached --quiet; then',
      '  GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track OpenClaw 2026.5.27"',
      'fi',
      `git push -u origin ${args.targetBranch}`,
      `PR_URL=$(gh pr list --state open --head ${args.targetBranch} --json url --jq '.[0].url // ""')`,
      'if [ -z "$PR_URL" ]; then',
      `  PR_URL=$(gh pr create --base ${args.baseBranch} --head ${args.targetBranch} --title "Track OpenClaw 2026.5.27" --body "Closes #${args.issueNumber}\\n\\nTracks the OpenClaw 2026.5.27 upstream release in Atlas graph metadata.")`,
      'fi',
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked OpenClaw 2026.5.27 in Atlas graph metadata.\\n\\n- Updated current OpenClaw graph surfaces to \`agentVersion:openclaw:ge-2026-5-27\`.\\n- Added release metadata for tightened security/content boundaries, Codex app-server model/workspace-memory behavior, gateway/reply caches, provider catalog changes, channel delivery fixes, and release/package hardening.\\n- Preserved the unchanged \`openclaw\` package/install identity.\\n- Ran graph checks, \`npm run verify:metadata\`, and openclaw package smoke checks.\\n\\nPR: %s' "$PR_URL")"`,
      'printf \'{"prUrl": "%s"}\\n\' "$PR_URL"',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));
