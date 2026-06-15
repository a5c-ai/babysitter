/**
 * @process repo/issue-431-deepseek-v4-pro-flash-tracking
 * @description Track DeepSeek V4 Pro and Flash model versions with evidence-backed Atlas graph claims.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, verification, publish }
 *
 * References used while authoring:
 * - .a5c/processes/issue-359-deepseek-v4-model-tracking.mjs
 * - .a5c/processes/issue-363-cohere-model-tracking.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/superpowers/verification-before-completion.js
 *
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function stdoutOf(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readContextTask = defineTask('issue-431.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR search, process references, and DeepSeek graph context',
  labels: ['issue-431', 'deepseek', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body --limit 20`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "graph-update|model-version-update|Atlas graph|catalog|evidence|claim|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- DeepSeek graph surface ---\\n"',
      'rg -n "deepseek-v4|DeepSeek-V4|DeepSeek V4|deepseek-chat|deepseek-reasoner|provider:deepseek|model-transport:(openai-compat|anthropic-messages)" packages/atlas/graph packages/transport-mux packages/agent-catalog -g "*.yaml" -g "*.ts" -g "*.mjs" | head -700',
      'printf "\\n--- DeepSeek model files ---\\n"',
      'sed -n "1,180p" packages/atlas/graph/compute/models/deepseek-v4-pro.yaml 2>/dev/null || true',
      'sed -n "1,180p" packages/atlas/graph/compute/models/deepseek-v4-flash.yaml 2>/dev/null || true',
      'sed -n "1,180p" packages/atlas/graph/compute/providers/deepseek.yaml 2>/dev/null || true',
      'sed -n "1,220p" packages/atlas/graph/catalog-meta/evidence-sources/deepseek-v4-sources-2026-05.yaml 2>/dev/null || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const ensureBranchTask = defineTask('issue-431.ensure-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Ensure issue branch is checked out',
  labels: ['issue-431', 'git', 'branch-policy'],
  shell: {
    command: [
      'set -euo pipefail',
      `current="$(git branch --show-current)"`,
      `if [ "$current" != "${args.branchName}" ]; then git switch "${args.branchName}"; fi`,
      'git branch --show-current',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTrackingTask = defineTask('issue-431.implement-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement DeepSeek V4 Pro and Flash tracking completion',
  labels: ['issue-431', 'deepseek', 'graph-update', 'model-version-update'],
  agent: {
    name: 'deepseek-v4-graph-maintainer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Complete DeepSeek V4 Pro and DeepSeek V4 Flash tracking in Atlas graph metadata.',
      instructions: [
        'Edit the repository directly. You are not alone in the codebase: preserve unrelated local worktree changes and do not revert edits outside this issue scope.',
        'Treat SPEC AND CONTEXT as the source of truth. Compare it to current graph artifacts before editing.',
        'Keep changes scoped to DeepSeek V4 model/provider/family/evidence/claim metadata plus this process file.',
        'Use existing YAML graph conventions. Do not introduce a new node kind or schema unless validation proves it is necessary.',
        'Ensure model:deepseek-v4-pro@current and model:deepseek-v4-flash@current have evidence-backed Claim records for key current-model attributes.',
        'Ensure provider:deepseek records both OpenAI-compatible and Anthropic-format base URL endpoint evidence from the issue sources.',
        'Represent the documented deepseek-chat and deepseek-reasoner compatibility/deprecation note as provider/model claim metadata without inventing unresolved alias nodes.',
        'Do not add Azure, Bedrock, or Vertex availability unless directly evidenced.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], unresolvedItems: string[] }.',
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

const verifyTrackingTask = defineTask('issue-431.verify-tracking', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify DeepSeek V4 tracking surfaces',
  labels: ['issue-431', 'deepseek', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/compute/models/deepseek-v4-pro.yaml',
      'test -f packages/atlas/graph/compute/models/deepseek-v4-flash.yaml',
      'test -f packages/atlas/graph/catalog-meta/claims/model-version-model-deepseek-v4-pro-current-evidence-claims-2026-05.yaml',
      'test -f packages/atlas/graph/catalog-meta/claims/model-version-model-deepseek-v4-flash-current-evidence-claims-2026-05.yaml',
      'rg -n "model:deepseek-v4-pro@current" packages/atlas/graph/compute/models/deepseek-v4-pro.yaml packages/atlas/graph/compute/model-families/deepseek.yaml packages/atlas/graph/compute/providers/deepseek.yaml packages/atlas/graph/catalog-meta/claims',
      'rg -n "model:deepseek-v4-flash@current" packages/atlas/graph/compute/models/deepseek-v4-flash.yaml packages/atlas/graph/compute/model-families/deepseek.yaml packages/atlas/graph/compute/providers/deepseek.yaml packages/atlas/graph/catalog-meta/claims',
      'rg -n "anthropic|messages|https://api.deepseek.com/anthropic|OpenAI-compatible|deepseek-chat|deepseek-reasoner|deprecated in the future" packages/atlas/graph/compute/providers/deepseek.yaml packages/atlas/graph/catalog-meta/evidence-sources/deepseek-v4-sources-2026-05.yaml packages/atlas/graph/catalog-meta/claims',
      'rg -n "contextWindowTokens.*1000000|costPerMTokInput|costPerMTokOutput|lifecycleStatus.*preview|supportsExtendedThinking.*True|supportsThinkingBudgetTokens.*False" packages/atlas/graph/catalog-meta/claims/model-version-model-deepseek-v4-pro-current-evidence-claims-2026-05.yaml packages/atlas/graph/catalog-meta/claims/model-version-model-deepseek-v4-flash-current-evidence-claims-2026-05.yaml',
      'npm run verify:metadata',
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

const readArtifactsTask = defineTask('issue-431.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final DeepSeek artifacts for review',
  labels: ['issue-431', 'deepseek', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/compute/models/deepseek-v4-pro.yaml packages/atlas/graph/compute/models/deepseek-v4-flash.yaml packages/atlas/graph/compute/model-families/deepseek.yaml packages/atlas/graph/compute/providers/deepseek.yaml packages/atlas/graph/compute/providers/together-ai.yaml packages/atlas/graph/compute/providers/fireworks-ai.yaml packages/atlas/graph/catalog-meta/evidence-sources/deepseek-v4-sources-2026-05.yaml packages/atlas/graph/catalog-meta/claims .a5c/processes/issue-431-deepseek-v4-pro-flash-tracking.mjs .a5c/processes/issue-431-deepseek-v4-pro-flash-tracking.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-431.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review DeepSeek V4 tracking against issue spec',
  labels: ['issue-431', 'deepseek', 'review'],
  agent: {
    name: 'deepseek-v4-graph-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #431 requirements to the final graph artifacts.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
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

const publishTask = defineTask('issue-431.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-431', 'deepseek', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/compute/models/deepseek-v4-pro.yaml packages/atlas/graph/compute/models/deepseek-v4-flash.yaml packages/atlas/graph/compute/model-families/deepseek.yaml packages/atlas/graph/compute/providers/deepseek.yaml packages/atlas/graph/compute/providers/together-ai.yaml packages/atlas/graph/compute/providers/fireworks-ai.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/deepseek-v4-sources-2026-05.yaml',
      'git add packages/atlas/graph/catalog-meta/claims/model-version-model-deepseek-v4-pro-current-evidence-claims-2026-05.yaml packages/atlas/graph/catalog-meta/claims/model-version-model-deepseek-v4-flash-current-evidence-claims-2026-05.yaml packages/atlas/graph/catalog-meta/claims/provider-deepseek-evidence-claims-2026-05.yaml',
      'git add -f .a5c/processes/issue-431-deepseek-v4-pro-flash-tracking.mjs .a5c/processes/issue-431-deepseek-v4-pro-flash-tracking.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track DeepSeek V4 Pro and Flash"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track DeepSeek V4 Pro and Flash model versions" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked DeepSeek V4 Pro and Flash model versions.\\n\\n- Completed Atlas graph claim coverage for model:deepseek-v4-pro@current and model:deepseek-v4-flash@current.\\n- Added DeepSeek provider claim coverage for OpenAI-compatible and Anthropic-format API surfaces plus documented deepseek-chat/deepseek-reasoner compatibility aliases.\\n- Ran metadata, edge validation, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 431;
  const branchName = inputs?.branchName ?? 'agent/issue-431';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  await ctx.task(ensureBranchTask, { branchName });
  const implementation = await ctx.task(implementTrackingTask, {
    contextStdout: stdoutOf(context),
  });
  const verification = await ctx.task(verifyTrackingTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
    contextStdout: stdoutOf(context),
    artifactsStdout: stdoutOf(artifacts),
  });
  const publish = await ctx.task(publishTask, {
    issueNumber,
    branchName,
    baseBranch,
  });

  return {
    success: true,
    phases: {
      context,
      implementation,
      verification,
      artifacts,
      review,
      publish,
    },
    summary: 'Tracked DeepSeek V4 Pro and Flash with evidence-backed Atlas graph claims.',
    verification,
    publish: stdoutOf(publish),
  };
}
