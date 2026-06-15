/**
 * @process repo/issue-429-openai-gpt-5-3-codex-tracking
 * @description Track OpenAI GPT-5.3-Codex in the Atlas graph with evidence-backed model metadata.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-429.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, process, and OpenAI graph context',
  labels: ['issue-429', 'openai', 'gpt-5.3-codex', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "graph-update|model-version|Atlas graph|catalog|evidence|claim|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.md" | head -220',
      'printf "\\n--- OpenAI GPT graph surface ---\\n"',
      'rg -n "gpt-5\\\\.3-codex|gpt-5\\\\.4|gpt-5\\\\.5|provider:openai|model-family:gpt-5|openai-responses|openai-gpt-5" packages/atlas/graph -g "*.yaml" | head -700',
      'printf "\\n--- OpenAI GPT-5.3-Codex official page excerpt ---\\n"',
      'curl -L --silent https://developers.openai.com/api/docs/models/gpt-5.3-codex | tr "<" "\\n<" | sed -n "4360,5600p" | rg -n "GPT-5\\\\.3-Codex|agentic coding|reasoning effort|context window|max output tokens|knowledge cutoff|Pricing|Input|Cached input|Output|Responses|Chat Completions|Batch|Fine-tuning|Streaming|Function calling|Structured outputs|Supported|Not supported|v1/"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTrackingTask = defineTask('issue-429.implement-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement GPT-5.3-Codex graph tracking',
  labels: ['issue-429', 'openai', 'gpt-5.3-codex', 'implementation'],
  agent: {
    name: 'openai-gpt-5-3-codex-tracking-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Track OpenAI GPT-5.3-Codex in the Atlas graph.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Keep changes tightly scoped to issue #429 and the live Atlas graph/model catalog surfaces.',
        'Preserve unrelated local worktree changes.',
        'Use existing graph/evidence/claim YAML patterns.',
        'Use the official OpenAI model page as the source of truth for gpt-5.3-codex context window, max output tokens, pricing, knowledge cutoff, endpoints, and feature support.',
        'Do not claim Azure, Bedrock, or Vertex availability unless official evidence for this exact model ID is present in the context.',
        'Represent the public release date carefully: the issue says it was not stated on accessible docs, while the tracker observed the model as current on 2026-05-27.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTrackingTask = defineTask('issue-429.verify-tracking', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify GPT-5.3-Codex graph tracking',
  labels: ['issue-429', 'openai', 'gpt-5.3-codex', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/compute/models/gpt-5.3-codex.yaml',
      `rg -n "id: model:gpt-5\\\\.3-codex@current|contextWindowTokens: 400000|maxOutputTokens: 128000|costPerMTokInput: 1\\\\.75|costPerMTokCachedInput: 0\\\\.175|costPerMTokOutput: 14\\\\.0|knowledgeCutoffDate: '2025-08-31'|model-transport:openai-responses" packages/atlas/graph/compute/models/gpt-5.3-codex.yaml`,
      'rg -n "model:gpt-5\\\\.3-codex@current" packages/atlas/graph/compute/model-families/gpt-5.yaml packages/atlas/graph/compute/providers/openai.yaml',
      'rg -n "evidence:openai-gpt-5-3-codex-model-doc-2026-05|model:gpt-5\\\\.3-codex@current" packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
      'npm run verify:metadata',
      'npm run build:atlas',
      'npm run validate:edges',
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

const readArtifactsTask = defineTask('issue-429.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed GPT-5.3-Codex artifacts',
  labels: ['issue-429', 'openai', 'gpt-5.3-codex', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/compute/models/gpt-5.3-codex.yaml packages/atlas/graph/compute/model-families/gpt-5.yaml packages/atlas/graph/compute/providers/openai.yaml packages/atlas/graph/catalog-meta/evidence-sources/recent-google-openai-models-2026-05.yaml packages/atlas/graph/catalog-meta/claims/model-version-model-gpt-5-3-codex-current-evidence-claims-2026-05.yaml .a5c/processes/issue-429-openai-gpt-5-3-codex-tracking.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-429.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review GPT-5.3-Codex tracking against issue spec',
  labels: ['issue-429', 'openai', 'gpt-5.3-codex', 'review'],
  agent: {
    name: 'openai-gpt-5-3-codex-tracking-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #429 requirements to the final graph artifacts.',
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

const publishTask = defineTask('issue-429.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-429', 'openai', 'gpt-5.3-codex', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/compute/models/gpt-5.3-codex.yaml',
      'git add packages/atlas/graph/compute/model-families/gpt-5.yaml packages/atlas/graph/compute/providers/openai.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/recent-google-openai-models-2026-05.yaml',
      'git add packages/atlas/graph/catalog-meta/claims/model-version-model-gpt-5-3-codex-current-evidence-claims-2026-05.yaml',
      'git add -f .a5c/processes/issue-429-openai-gpt-5-3-codex-tracking.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track OpenAI GPT-5.3-Codex"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track OpenAI GPT-5.3-Codex in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked OpenAI GPT-5.3-Codex in the Atlas graph.\\n\\n- Added the GPT-5.3-Codex ModelVersion with OpenAI Responses transport, pricing, context, max output, knowledge cutoff, modality, and feature metadata.\\n- Linked it from the GPT-5 family and OpenAI provider.\\n- Added official OpenAI evidence and model-version claims, including the note that the release date was not public on the model page and the tracker first observed it on 2026-05-27.\\n- Ran metadata verification, edge validation, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 429;
  const branchName = inputs?.branchName ?? 'agent/issue-429';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementTrackingTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTrackingTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve GPT-5.3-Codex model tracking.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked OpenAI GPT-5.3-Codex in the Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
