/**
 * @process repo/issue-435-inference-provider-model-availability
 * @description Track 2026 Together AI, Fireworks AI, and Groq inference-provider model availability deltas in the Atlas graph.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string }
 * @outputs { success: boolean, changedFiles: string[], verification: object, review: object, publish: object }
 *
 * References searched before authoring:
 * - .a5c/processes/issue-358-xai-grok-4-3.mjs
 * - .a5c/processes/issue-359-deepseek-v4-model-tracking.mjs
 * - .a5c/processes/issue-362-amazon-nova-2-tracking.mjs
 * - .a5c/processes/issue-363-cohere-model-tracking.js
 * - methodologies/gsd/quick.js
 * - methodologies/gsd/verify-work.js
 * - specializations/collaboration/github/branch-policies.js
 * - specializations/collaboration/github/issue-linking.js
 *
 * @process methodologies/gsd/quick
 * @process methodologies/gsd/verify-work
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function stdoutOf(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 435;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const workBranch = inputs?.workBranch ?? 'agent/issue-435';

  ctx.log('info', `Phase 1: collect issue #${issueNumber}, provider docs, and current graph surface`);
  const spec = await ctx.task(readIssueSpecTask, { issueNumber }, { key: 'issue-435.spec' });
  const providerDocs = await ctx.task(fetchProviderDocsTask, {}, { key: 'issue-435.provider-docs' });
  const graphAudit = await ctx.task(auditGraphTask, {}, { key: 'issue-435.graph-audit' });

  ctx.log('info', 'Phase 2: implement evidence-backed provider-catalog graph updates');
  const implementation = await ctx.task(implementProviderDeltasTask, {
    specStdout: stdoutOf(spec),
    docsStdout: stdoutOf(providerDocs),
    graphAuditStdout: stdoutOf(graphAudit),
  }, { key: 'issue-435.implementation' });

  ctx.log('info', 'Phase 3: run targeted graph coverage checks');
  const targetedVerification = await ctx.task(targetedVerificationTask, {}, {
    key: 'issue-435.targeted-verification',
  });

  ctx.log('info', 'Phase 4: run repository graph quality gates');
  const metadataVerification = await ctx.task(metadataVerificationTask, {}, {
    key: 'issue-435.metadata-verification',
  });
  const edgeValidation = await ctx.task(edgeValidationTask, {}, {
    key: 'issue-435.edge-validation',
  });
  const diffCheck = await ctx.task(diffCheckTask, {}, { key: 'issue-435.diff-check' });

  ctx.log('info', 'Phase 5: review implementation against spec and artifacts');
  const artifacts = await ctx.task(collectArtifactsTask, {}, { key: 'issue-435.artifacts' });
  const review = await ctx.task(reviewTask, {
    specStdout: stdoutOf(spec),
    docsStdout: stdoutOf(providerDocs),
    artifactsStdout: stdoutOf(artifacts),
  }, { key: 'issue-435.review' });

  if (review?.approved === false) {
    return {
      success: false,
      changedFiles: implementation?.changedFiles ?? [],
      verification: {
        targetedVerification,
        metadataVerification,
        edgeValidation,
        diffCheck,
      },
      review,
    };
  }

  ctx.log('info', 'Phase 6: commit, push, open PR, and comment on the issue');
  const publish = await ctx.task(publishTask, {
    issueNumber,
    baseBranch,
    workBranch,
  }, { key: 'issue-435.publish' });

  return {
    success: true,
    changedFiles: implementation?.changedFiles ?? [],
    verification: {
      targetedVerification,
      metadataVerification,
      edgeValidation,
      diffCheck,
    },
    review,
    publish,
  };
}

export const readIssueSpecTask = defineTask('issue-435.read-issue-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read GitHub issue #${args.issueNumber}`,
  shell: {
    command: `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['github', 'issue', 'spec'],
}));

export const fetchProviderDocsTask = defineTask('issue-435.fetch-provider-docs', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Fetch current inference-provider catalog documentation',
  shell: {
    command: [
      'set -euo pipefail',
      'node - <<\'NODE\'',
      'const urls = [',
      '  "https://docs.together.ai/docs/serverless-models",',
      '  "https://docs.fireworks.ai/models",',
      '  "https://console.groq.com/docs/models",',
      '  "https://groq.com/docs/models",',
      '];',
      'function htmlToText(html) {',
      '  return html',
      '    .replace(/<script[\\s\\S]*?<\\/script>/gi, " ")',
      '    .replace(/<style[\\s\\S]*?<\\/style>/gi, " ")',
      '    .replace(/<[^>]+>/g, "\\n")',
      '    .replace(/&nbsp;/g, " ")',
      '    .replace(/&amp;/g, "&")',
      '    .replace(/&quot;/g, "\\"")',
      '    .replace(/&#39;/g, "\'")',
      '    .replace(/\\s+/g, " ");',
      '}',
      'for (const url of urls) {',
      '  const response = await fetch(url, { redirect: "follow" });',
      '  const html = await response.text();',
      '  const text = htmlToText(html);',
      '  const matches = text.match(/.{0,90}(DeepSeek|Qwen|Qwen3|Llama 4|Llama-4|Kimi|gpt-oss|deprecated|preview|context|tokens|OpenAI-compatible|model id|Model ID).{0,160}/gi) || [];',
      '  console.log(`\\nURL: ${url}`);',
      '  console.log(`HTTP: ${response.status}`);',
      '  console.log(`SNAPSHOT_LENGTH: ${text.length}`);',
      '  for (const line of matches.slice(0, 160)) console.log(line.trim());',
      '}',
      'NODE',
    ].join('\n'),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['research', 'provider-catalog', 'official-docs'],
}));

export const auditGraphTask = defineTask('issue-435.audit-graph', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Audit current provider/model graph surface',
  shell: {
    command: [
      'set -euo pipefail',
      'printf "%s\\n" "## Provider records"',
      'sed -n "1,220p" packages/atlas/graph/compute/providers/together-ai.yaml',
      'sed -n "1,220p" packages/atlas/graph/compute/providers/fireworks-ai.yaml',
      'sed -n "1,220p" packages/atlas/graph/compute/providers/groq.yaml',
      'printf "%s\\n" "## Relevant model/family records"',
      'rg -n "deepseek-v4|qwen3-coder|llama-4|kimi|gpt-oss|provider:together-ai|provider:fireworks-ai|provider:groq|served_by|serves" packages/atlas/graph/compute packages/atlas/graph/catalog-meta || true',
    ].join('\n'),
    expectedExitCode: 0,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['atlas-graph', 'audit'],
}));

export const implementProviderDeltasTask = defineTask('issue-435.implement-provider-deltas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement 2026 inference-provider availability deltas',
  agent: {
    name: 'atlas-provider-catalog-maintainer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update Atlas graph metadata for issue #435: Together AI, Fireworks AI, and Groq 2026 inference-provider model availability deltas.',
      instructions: [
        'Read files before editing them and preserve unrelated local changes.',
        'Use the issue spec, provider docs snapshot, and graph audit verbatim as the acceptance source.',
        'Add or update provider product/version records only where absent or incomplete in the live graph.',
        'Add evidence-backed provider availability claims for exact model IDs that are confirmed by the provider catalog snapshots.',
        'Keep base model records separate from provider-catalog served-by facts. This is a served-by/provider-catalog update, not a broad base model release.',
        'Represent lifecycle/deprecation claims where provider docs mark a catalog model deprecated.',
        'Keep transport support conservative: use OpenAI-compatible transport claims only where the provider docs support OpenAI-compatible chat/completions; otherwise use existing passthrough patterns.',
        'Do not invent Kimi, DeepSeek, Qwen, Llama, or gpt-oss provider availability beyond the fetched docs and existing graph evidence.',
        'Prefer editing packages/atlas/graph/compute/providers and packages/atlas/graph/catalog-meta evidence/claim YAML over adding schema.',
        'Return JSON: { changedFiles: string[], summary: string, verificationHints: string[], unresolvedItems: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'PROVIDER DOC SNAPSHOT (verbatim):',
        '---',
        args.docsStdout,
        '---',
        '',
        'GRAPH AUDIT (verbatim):',
        '---',
        args.graphAuditStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['graph-update', 'model-version-update', 'implementation'],
}));

export const targetedVerificationTask = defineTask('issue-435.targeted-verification', () => ({
  kind: 'shell',
  title: 'Verify targeted provider-catalog graph coverage',
  shell: {
    command: [
      'set -euo pipefail',
      'for provider in together-ai fireworks-ai groq; do',
      '  test -f "packages/atlas/graph/compute/providers/${provider}.yaml"',
      'done',
      'rg -n "provider:together-ai|provider:fireworks-ai|provider:groq" packages/atlas/graph/compute/providers packages/atlas/graph/catalog-meta',
      'rg -n "served|serves|providerModelIds|providerCatalog|inference-provider|OpenAI-compatible|deprecated|lifecycle" packages/atlas/graph/catalog-meta/claims packages/atlas/graph/compute/providers',
      'rg -n "Together AI|Fireworks AI|Groq|docs\\.together\\.ai/docs/serverless-models|docs\\.fireworks\\.ai/models|console\\.groq\\.com/docs/models|groq\\.com/docs/models" packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims packages/atlas/graph/compute/providers',
      'rg -n "model:deepseek-v4|model:qwen3-coder|model:llama-4|kimi|gpt-oss" packages/atlas/graph/compute/providers packages/atlas/graph/catalog-meta || true',
    ].join('\n'),
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'model-version-update', 'verification'],
}));

export const metadataVerificationTask = defineTask('issue-435.metadata-verification', () => ({
  kind: 'shell',
  title: 'Run metadata verification',
  shell: {
    command: 'npm run verify:metadata',
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'verification'],
}));

export const edgeValidationTask = defineTask('issue-435.edge-validation', () => ({
  kind: 'shell',
  title: 'Run edge validation',
  shell: {
    command: 'npm run validate:edges',
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'verification'],
}));

export const diffCheckTask = defineTask('issue-435.diff-check', () => ({
  kind: 'shell',
  title: 'Check diff whitespace',
  shell: {
    command: 'git diff --check -- .a5c/processes/issue-435-inference-provider-model-availability.mjs .a5c/processes/issue-435-inference-provider-model-availability.inputs.json packages/atlas/graph/capabilities-and-models packages/atlas/graph/compute packages/atlas/graph/catalog-meta',
    expectedExitCode: 0,
  },
  labels: ['verification', 'git'],
}));

export const collectArtifactsTask = defineTask('issue-435.collect-artifacts', () => ({
  kind: 'shell',
  title: 'Collect implementation artifacts',
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'printf "\\n--- DIFF STAT ---\\n"',
      'git diff --stat -- .a5c/processes/issue-435-inference-provider-model-availability.mjs .a5c/processes/issue-435-inference-provider-model-availability.inputs.json packages/atlas/graph/capabilities-and-models packages/atlas/graph/compute packages/atlas/graph/catalog-meta',
      'printf "\\n--- DIFF ---\\n"',
      'git diff -- .a5c/processes/issue-435-inference-provider-model-availability.mjs .a5c/processes/issue-435-inference-provider-model-availability.inputs.json packages/atlas/graph/capabilities-and-models packages/atlas/graph/compute packages/atlas/graph/catalog-meta',
    ].join('\n'),
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'review'],
}));

export const reviewTask = defineTask('issue-435.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review provider-catalog graph update',
  agent: {
    name: 'atlas-provider-catalog-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Review issue #435 implementation against the issue spec and provider docs.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Confirm provider product/version records, served-by/provider availability claims, lifecycle/deprecation claims, evidence sources, and conservative transport support are represented only where supported.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisks: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'PROVIDER DOC SNAPSHOT (verbatim):',
        '---',
        args.docsStdout,
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
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['graph-update', 'model-version-update', 'review'],
}));

export const publishTask = defineTask('issue-435.publish', (args) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue #435',
  shell: {
    command: [
      'set -euo pipefail',
      'git add -f .a5c/processes/issue-435-inference-provider-model-availability.mjs',
      'git add -f .a5c/processes/issue-435-inference-provider-model-availability.inputs.json',
      'git add -f .a5c/processes/issue-435-inference-provider-model-availability.process.md',
      'git add -f .a5c/processes/issue-435-inference-provider-model-availability.mermaid.md',
      'git add packages/atlas/graph/capabilities-and-models/model-provider-product.yaml',
      'git add packages/atlas/graph/capabilities-and-models/model-provider-version.yaml',
      'git add packages/atlas/graph/compute/providers/together-ai.yaml',
      'git add packages/atlas/graph/compute/providers/fireworks-ai.yaml',
      'git add packages/atlas/graph/compute/providers/groq.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/inference-provider-catalogs-2026-05.yaml',
      'git add packages/atlas/graph/catalog-meta/claims/inference-provider-catalog-claims-2026-05.yaml',
      'if ! git diff --cached --quiet; then',
      '  GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "Track inference provider model availability deltas"',
      'fi',
      `git push -u origin ${args.workBranch}`,
      `pr_url=$(gh pr view ${args.workBranch} --json url --jq .url 2>/dev/null || true)`,
      'if [ -z "$pr_url" ]; then',
      `  pr_url=$(gh pr create --base ${args.baseBranch} --head ${args.workBranch} --title "Track 2026 inference-provider model availability deltas" --body "Closes #${args.issueNumber}\\n\\n## Summary\\n- Track Together AI, Fireworks AI, and Groq provider-catalog availability deltas in Atlas graph metadata.\\n- Add evidence-backed provider availability and lifecycle claims for confirmed catalog facts.\\n- Verify metadata, graph edges, targeted provider coverage, and diff cleanliness." | tail -n 1)`,
      'fi',
      `gh issue comment ${args.issueNumber} --body "Implemented 2026 inference-provider model availability tracking on ${args.workBranch}.\\n\\nSummary:\\n- Updated Atlas graph provider-catalog metadata for Together AI, Fireworks AI, and Groq where current provider docs support it.\\n- Added evidence-backed availability/lifecycle claims and kept transport support conservative.\\n- Ran targeted graph checks, npm run verify:metadata, npm run validate:edges, and git diff --check.\\n\\nPR: $pr_url"`,
      'printf "%s\\n" "$pr_url"',
    ].join('\n'),
    expectedExitCode: 0,
  },
  labels: ['graph-update', 'publish'],
}));
