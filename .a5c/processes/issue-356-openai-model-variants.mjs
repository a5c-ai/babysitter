/**
 * @process repo/issue-356-openai-model-variants
 * @description Track OpenAI GPT-5.5 pro and GPT-5.4 nano variants in Atlas graph metadata.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string }
 * @outputs { success: boolean, changedFiles: string[], verification: object }
 *
 * References used while authoring:
 * - library/cradle/feature-implementation-contribute.js
 * - library/tdd-quality-convergence.js
 * - library/processes/shared/completeness-gate.js
 * - docs/agent-reference/process-authoring.md
 * - docs/development/02-atlas-graph-and-agent-catalog.md
 *
 * @process cradle/feature-implementation-contribute
 * @process babysitter/tdd-quality-convergence
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  ctx.log('info', 'Phase 1: prepare issue branch');
  const branch = await ctx.task(prepareBranchTask, inputs, { key: 'issue-356.prepare-branch' });

  ctx.log('info', 'Phase 2: read issue spec and current OpenAI documentation');
  const issue = await ctx.task(readIssueTask, inputs, { key: 'issue-356.read-issue' });
  const docs = await ctx.task(readOpenAiDocsTask, {}, { key: 'issue-356.read-openai-docs' });
  const graphState = await ctx.task(readCurrentGraphStateTask, {}, { key: 'issue-356.read-graph-state' });

  ctx.log('info', 'Phase 3: implement graph update');
  const implementation = await ctx.task(implementGraphUpdateTask, {
    inputs,
    issueStdout: issue.stdout,
    docsStdout: docs.stdout,
    graphStateStdout: graphState.stdout,
  }, { key: 'issue-356.implement' });

  ctx.log('info', 'Phase 4: verify model graph coverage');
  const modelCoverage = await ctx.task(modelCoverageCheckTask, {}, { key: 'issue-356.model-coverage' });
  const providerCoverage = await ctx.task(providerCoverageCheckTask, {}, { key: 'issue-356.provider-coverage' });
  const edgeValidation = await ctx.task(edgeValidationTask, {}, { key: 'issue-356.validate-edges' });
  const atlasBuild = await ctx.task(atlasBuildTask, {}, { key: 'issue-356.build-atlas' });
  const metadataVerification = await ctx.task(metadataVerificationTask, {}, { key: 'issue-356.verify-metadata' });

  ctx.log('info', 'Phase 5: commit, push, open PR, and comment on issue');
  const diff = await ctx.task(diffSummaryTask, {}, { key: 'issue-356.diff-summary' });
  const commit = await ctx.task(commitTask, inputs, { key: 'issue-356.commit' });
  const push = await ctx.task(pushTask, inputs, { key: 'issue-356.push' });
  const pr = await ctx.task(createPrTask, inputs, { key: 'issue-356.create-pr' });
  const comment = await ctx.task(commentTask, {
    issueNumber: inputs.issueNumber,
    prStdout: pr.stdout,
  }, { key: 'issue-356.comment' });

  return {
    success: true,
    changedFiles: implementation?.changedFiles ?? [],
    branch,
    verification: {
      modelCoverage,
      providerCoverage,
      edgeValidation,
      atlasBuild,
      metadataVerification,
      diff,
      commit,
      push,
      pr,
      comment,
    },
  };
}

export const prepareBranchTask = defineTask('issue-356.prepare-branch', (args) => ({
  kind: 'shell',
  title: 'Prepare issue branch',
  shell: {
    command: [
      'set -euo pipefail',
      `target="${args.targetBranch}"`,
      'current="$(git branch --show-current)"',
      'if [ "$current" = "$target" ]; then',
      '  git status --short --branch',
      'elif git show-ref --verify --quiet "refs/heads/$target"; then',
      '  git switch "$target"',
      'else',
      '  git switch -c "$target"',
      'fi',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const readIssueTask = defineTask('issue-356.read-issue', (args) => ({
  kind: 'shell',
  title: 'Read issue #356',
  shell: {
    command: `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
    expectedExitCode: 0,
  },
}));

export const readOpenAiDocsTask = defineTask('issue-356.read-openai-docs', () => ({
  kind: 'shell',
  title: 'Read OpenAI model docs',
  shell: {
    command: [
      'set -euo pipefail',
      'node - <<\'NODE\'',
      'const urls = [',
      '  "https://developers.openai.com/api/docs/models/gpt-5.5-pro",',
      '  "https://developers.openai.com/api/docs/models/gpt-5.4-nano",',
      '];',
      'for (const url of urls) {',
      '  const html = await (await fetch(url)).text();',
      '  const text = html',
      '    .replace(/<script[\\s\\S]*?<\\/script>/g, " ")',
      '    .replace(/<style[\\s\\S]*?<\\/style>/g, " ")',
      '    .replace(/<[^>]+>/g, "\\n")',
      '    .replace(/&nbsp;/g, " ")',
      '    .replace(/&#34;/g, "\\"")',
      '    .replace(/&quot;/g, "\\"")',
      '    .replace(/&amp;/g, "&")',
      '    .replace(/’/g, "\'");',
      '  const lines = text.split(/\\n+/).map((line) => line.trim()).filter(Boolean);',
      '  console.log(`URL: ${url}`);',
      '  for (let i = 0; i < lines.length; i++) {',
      '    if (/GPT-5\\.5 pro|GPT-5\\.4 nano|context window|max output tokens|knowledge cutoff|Batch API price|Cached input|Regional processing|Modalities|Features|Snapshots|Reasoning|Speed|Price|gpt-5\\.5-pro|gpt-5\\.4-nano/.test(lines[i])) {',
      '      console.log(`${i}: ${lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 7)).join(" | ")}`);',
      '    }',
      '  }',
      '}',
      'NODE',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const readCurrentGraphStateTask = defineTask('issue-356.read-current-graph-state', () => ({
  kind: 'shell',
  title: 'Read current GPT-5 graph state',
  shell: {
    command: [
      'set -euo pipefail',
      'sed -n "1,220p" packages/atlas/graph/compute/models/gpt-5.5.yaml',
      'sed -n "1,220p" packages/atlas/graph/compute/models/gpt-5.4.yaml',
      'sed -n "1,220p" packages/atlas/graph/compute/models/gpt-5.4-mini.yaml',
      'sed -n "1,220p" packages/atlas/graph/compute/providers/openai.yaml',
      'sed -n "1,220p" packages/atlas/graph/catalog-meta/evidence-sources/recent-google-openai-models-2026-05.yaml',
      'sed -n "1,180p" packages/atlas/graph/catalog-meta/claims/recent-google-openai-models-2026-05.yaml',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const implementGraphUpdateTask = defineTask('issue-356.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OpenAI GPT-5.5 pro and GPT-5.4 nano graph tracking',
  labels: ['graph-update', 'model-version-update', 'openai'],
  agent: {
    name: 'graph-maintainer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update Atlas graph metadata to track the requested OpenAI model variants.',
      instructions: [
        'ISSUE SPEC (verbatim, do not paraphrase):',
        '---',
        args.issueStdout,
        '---',
        '',
        'OPENAI DOCS SNAPSHOT (verbatim, do not paraphrase):',
        '---',
        args.docsStdout,
        '---',
        '',
        'CURRENT GRAPH STATE (verbatim):',
        '---',
        args.graphStateStdout,
        '---',
        '',
        'Implement only the requested graph-update/model-version-update scope for issue #356.',
        'Add ModelVersion YAML records for model:gpt-5.5-pro@current and model:gpt-5.4-nano@current under packages/atlas/graph/compute/models, matching nearby GPT-5 YAML style.',
        'Update OpenAI provider serves edges and current OpenAI evidence/claim metadata so the new model records have official OpenAI provenance.',
        'Use official OpenAI values from the docs snapshot for IDs, context, pricing, knowledge cutoff, release/snapshot dates, modalities, lifecycle, and transport/API support.',
        'Keep scope tight. Do not add GPT-5.4 pro unless it is already required by an edited file for consistency.',
        'Return JSON: { changedFiles, summary, unresolvedItems, verificationHints }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const modelCoverageCheckTask = defineTask('issue-356.model-coverage-check', () => ({
  kind: 'shell',
  title: 'Verify new model YAML coverage',
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/compute/models/gpt-5.5-pro.yaml',
      'test -f packages/atlas/graph/compute/models/gpt-5.4-nano.yaml',
      'rg -n "id: model:gpt-5\\.5-pro@current" packages/atlas/graph/compute/models/gpt-5.5-pro.yaml',
      'rg -n "displayName: \\"GPT-5\\.5 Pro\\"" packages/atlas/graph/compute/models/gpt-5.5-pro.yaml',
      'rg -n "contextWindowTokens: 1050000" packages/atlas/graph/compute/models/gpt-5.5-pro.yaml',
      'rg -n "costPerMTokInput: 30\\.0" packages/atlas/graph/compute/models/gpt-5.5-pro.yaml',
      'rg -n "costPerMTokOutput: 180\\.0" packages/atlas/graph/compute/models/gpt-5.5-pro.yaml',
      'rg -n "modelCardUrl: https://developers\\.openai\\.com/api/docs/models/gpt-5\\.5-pro" packages/atlas/graph/compute/models/gpt-5.5-pro.yaml',
      'rg -n "id: model:gpt-5\\.4-nano@current" packages/atlas/graph/compute/models/gpt-5.4-nano.yaml',
      'rg -n "displayName: \\"GPT-5\\.4 Nano\\"" packages/atlas/graph/compute/models/gpt-5.4-nano.yaml',
      'rg -n "contextWindowTokens: 400000" packages/atlas/graph/compute/models/gpt-5.4-nano.yaml',
      'rg -n "costPerMTokInput: 0\\.2" packages/atlas/graph/compute/models/gpt-5.4-nano.yaml',
      'rg -n "costPerMTokOutput: 1\\.25" packages/atlas/graph/compute/models/gpt-5.4-nano.yaml',
      'rg -n "modelCardUrl: https://developers\\.openai\\.com/api/docs/models/gpt-5\\.4-nano" packages/atlas/graph/compute/models/gpt-5.4-nano.yaml',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const providerCoverageCheckTask = defineTask('issue-356.provider-coverage-check', () => ({
  kind: 'shell',
  title: 'Verify provider and evidence coverage',
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "model:gpt-5\\.5-pro@current" packages/atlas/graph/compute/providers/openai.yaml packages/atlas/graph/catalog-meta',
      'rg -n "model:gpt-5\\.4-nano@current" packages/atlas/graph/compute/providers/openai.yaml packages/atlas/graph/catalog-meta',
      'rg -n "openai-gpt-5-5-pro-model-doc-2026-05|developers\\.openai\\.com/api/docs/models/gpt-5\\.5-pro" packages/atlas/graph/catalog-meta',
      'rg -n "openai-gpt-5-4-nano-model-doc-2026-05|developers\\.openai\\.com/api/docs/models/gpt-5\\.4-nano" packages/atlas/graph/catalog-meta',
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const edgeValidationTask = defineTask('issue-356.validate-edges', () => ({
  kind: 'shell',
  title: 'Validate Atlas edges',
  shell: {
    command: 'npm run build --workspace=@a5c-ai/atlas && npm run validate:edges',
    expectedExitCode: 0,
  },
}));

export const atlasBuildTask = defineTask('issue-356.build-atlas', () => ({
  kind: 'shell',
  title: 'Build Atlas and agent catalog',
  shell: {
    command: 'npm run build --workspace=@a5c-ai/atlas && npm run build --workspace=@a5c-ai/agent-catalog',
    expectedExitCode: 0,
  },
}));

export const metadataVerificationTask = defineTask('issue-356.verify-metadata', () => ({
  kind: 'shell',
  title: 'Run metadata verification',
  shell: {
    command: 'npm run verify:metadata',
    expectedExitCode: 0,
  },
}));

export const diffSummaryTask = defineTask('issue-356.diff-summary', () => ({
  kind: 'shell',
  title: 'Show final diff summary',
  shell: {
    command: 'git status --short && git diff --stat && git diff -- packages/atlas/graph/compute/models packages/atlas/graph/compute/providers/openai.yaml packages/atlas/graph/catalog-meta | sed -n "1,260p"',
    expectedExitCode: 0,
  },
}));

export const commitTask = defineTask('issue-356.commit', (args) => ({
  kind: 'shell',
  title: 'Commit issue #356 graph update',
  shell: {
    command: [
      'set -euo pipefail',
      'git add -f .a5c/processes/issue-356-openai-model-variants.mjs .a5c/processes/issue-356-openai-model-variants.inputs.json',
      'git add packages/atlas/graph/compute/models/gpt-5.5-pro.yaml packages/atlas/graph/compute/models/gpt-5.4-nano.yaml packages/atlas/graph/compute/providers/openai.yaml packages/atlas/graph/catalog-meta/evidence-sources/recent-google-openai-models-2026-05.yaml packages/atlas/graph/catalog-meta/claims/recent-google-openai-models-2026-05.yaml',
      `GIT_AUTHOR_NAME="a5c-ai agent" GIT_AUTHOR_EMAIL="agent@a5c.ai" GIT_COMMITTER_NAME="a5c-ai agent" GIT_COMMITTER_EMAIL="agent@a5c.ai" git commit -m "Track OpenAI GPT-5 variants for issue #${args.issueNumber}"`,
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const pushTask = defineTask('issue-356.push', (args) => ({
  kind: 'shell',
  title: 'Push issue branch',
  shell: {
    command: `git push -u origin ${args.targetBranch}`,
    expectedExitCode: 0,
  },
}));

export const createPrTask = defineTask('issue-356.create-pr', (args) => ({
  kind: 'shell',
  title: 'Create pull request',
  shell: {
    command: [
      'set -euo pipefail',
      'tmp="$(mktemp)"',
      'cat > "$tmp" <<\'EOF\'',
      '## Summary',
      '- Track OpenAI GPT-5.5 Pro and GPT-5.4 Nano model variants in the Atlas graph',
      '- Add official OpenAI evidence and provider serves coverage for both variants',
      '',
      '## Verification',
      '- npm run validate:edges',
      '- npm run build --workspace=@a5c-ai/atlas',
      '- npm run build --workspace=@a5c-ai/agent-catalog',
      '- npm run verify:metadata',
      '',
      `Closes #${args.issueNumber}`,
      'EOF',
      `gh pr create --base ${args.baseBranch} --head ${args.targetBranch} --title "Track OpenAI GPT-5 pro and nano variants" --body-file "$tmp"`,
    ].join('\n'),
    expectedExitCode: 0,
  },
}));

export const commentTask = defineTask('issue-356.comment', (args) => ({
  kind: 'shell',
  title: 'Comment on issue #356',
  shell: {
    command: [
      'set -euo pipefail',
      'tmp="$(mktemp)"',
      'cat > "$tmp" <<\'EOF\'',
      'Implemented tracking for the requested OpenAI model variants.',
      '',
      '- Added Atlas ModelVersion records for `gpt-5.5-pro` and `gpt-5.4-nano`.',
      '- Added OpenAI provider serves coverage plus official OpenAI evidence/claim metadata.',
      '- Verified with `npm run validate:edges`, Atlas build, agent-catalog build, and `npm run verify:metadata`.',
      '',
      `PR: ${args.prStdout.trim()}`,
      'EOF',
      `gh issue comment ${args.issueNumber} --body-file "$tmp"`,
    ].join('\n'),
    expectedExitCode: 0,
  },
}));
