/**
 * @process repo/issue-355-claude-mythos-graph-update
 * @description Track Claude Mythos Preview in the Atlas graph with evidence-backed gated research preview metadata.
 * @inputs { issueNumber?: number, branchName?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readIssueContextTask = defineTask('issue-355.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue and Claude Mythos graph context',
  labels: ['issue-355', 'claude-mythos', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,body,url`,
      'printf "\\n--- existing mythos graph refs ---\\n"',
      'rg -n "claude-mythos|Claude Mythos|mythos-preview|Project Glasswing|gated research" packages/atlas/graph packages/atlas/scripts docs || true',
      'printf "\\n--- model file ---\\n"',
      'cat packages/atlas/graph/compute/models/claude-mythos-preview.yaml',
      'printf "\\n--- provider files ---\\n"',
      'cat packages/atlas/graph/compute/providers/anthropic.yaml',
      'cat packages/atlas/graph/compute/providers/bedrock.yaml',
      'cat packages/atlas/graph/compute/providers/from-agent-catalog.yaml',
      'printf "\\n--- existing evidence patterns ---\\n"',
      'ls packages/atlas/graph/catalog-meta/evidence-sources | rg "anthropic|model|source" || true',
      'ls packages/atlas/graph/catalog-meta/claims | rg "model-version-model-claude" || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-355.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude Mythos graph update',
  labels: ['issue-355', 'claude-mythos', 'graph', 'implementation'],
  agent: {
    name: 'claude-mythos-graph-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update Atlas graph files for Claude Mythos Preview, keeping the change scoped to issue #355.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.issueContextStdout,
        '---',
        'Author source-backed graph metadata for model:claude-mythos-preview@current.',
        'Do not infer context window or pricing values from other Claude models where public docs do not expose them for the Anthropic API surface.',
        'Represent gated research preview access without inventing unsupported lifecycleStatus enum values.',
        'Add evidence sources and claims for model identity, lifecycle/access, release date, provider availability, capabilities, and unknown/unpublished context/pricing where needed.',
        'Use only existing graph schema/patterns unless a small schema extension is necessary and verified.',
        'Return JSON: { changedFiles: string[], summary: string, smokeNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-355.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Claude Mythos graph update',
  labels: ['issue-355', 'claude-mythos', 'graph', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "id: model:claude-mythos-preview@current" packages/atlas/graph/compute/models/claude-mythos-preview.yaml',
      'rg -n "provider:anthropic|provider:aws-bedrock|provider:azure-foundry" packages/atlas/graph/compute/models/claude-mythos-preview.yaml',
      'rg -n "claude-mythos-preview" packages/atlas/graph/compute/providers/anthropic.yaml packages/atlas/graph/compute/providers/bedrock.yaml packages/atlas/graph/compute/providers/from-agent-catalog.yaml',
      'rg -n "evidence:claude-mythos-preview-(anthropic|bedrock|microsoft-foundry)" packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
      'rg -n "contextWindowTokens.*unknown|context window.*unknown|pricing.*not public|not self-serve|gated research preview|defensive cybersecurity" packages/atlas/graph/catalog-meta/claims packages/atlas/graph/compute/models/claude-mythos-preview.yaml',
      'npm run build:atlas',
      'npm run validate:edges',
      'npm run quality --workspace=@a5c-ai/atlas',
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

const readArtifactsTask = defineTask('issue-355.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Claude Mythos artifacts',
  labels: ['issue-355', 'claude-mythos', 'graph', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/compute/models/claude-mythos-preview.yaml packages/atlas/graph/compute/providers/from-agent-catalog.yaml packages/atlas/graph/catalog-meta/evidence-sources/claude-mythos-preview-sources-2026-05.yaml packages/atlas/graph/catalog-meta/claims/model-version-model-claude-mythos-preview-current-evidence-claims-2026-05.yaml .a5c/processes/issue-355-claude-mythos-graph-update.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-355.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Claude Mythos graph update',
  labels: ['issue-355', 'claude-mythos', 'graph', 'review'],
  agent: {
    name: 'claude-mythos-graph-reviewer',
    prompt: {
      role: 'senior graph data reviewer',
      task: 'Compare issue #355 requirements to the final graph artifacts.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.issueContextStdout,
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

const publishTask = defineTask('issue-355.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-355', 'claude-mythos', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/compute/models/claude-mythos-preview.yaml',
      'git add packages/atlas/graph/compute/providers/from-agent-catalog.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/claude-mythos-preview-sources-2026-05.yaml',
      'git add packages/atlas/graph/catalog-meta/claims/model-version-model-claude-mythos-preview-current-evidence-claims-2026-05.yaml',
      'git add -f .a5c/processes/issue-355-claude-mythos-graph-update.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Claude Mythos Preview"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base staging --head ${args.branchName} --title "Track Claude Mythos Preview in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Claude Mythos Preview graph tracking.\\n\\n- Updated the ModelVersion with gated research preview notes and source-backed capability/provider metadata.\\n- Added official Anthropic, AWS Bedrock, and Microsoft Foundry evidence sources plus claims.\\n- Preserved unknown/unpublished Anthropic API pricing/context values instead of inferring from other Claude models.\\n- Ran Atlas edge validation, graph quality, and repository metadata verification.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 355;
  const branchName = inputs?.branchName ?? 'agent/issue-355';

  const issueContext = await ctx.task(readIssueContextTask, { issueNumber });
  const implementation = await ctx.task(implementGraphUpdateTask, {
    issueContextStdout: issueContext?.stdout ?? '',
  });
  const verification = await ctx.task(verifyGraphUpdateTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
    issueContextStdout: issueContext?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve the Claude Mythos graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Claude Mythos Preview in Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
