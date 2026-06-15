/**
 * @process repo/issue-432-mistral-model-tracking
 * @description Track Mistral Medium 3.5 and Codestral 25.08 in the Atlas graph with evidence-backed metadata.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-432.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, process references, and Mistral graph context',
  labels: ['issue-432', 'mistral', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "graph-update|model-version|Atlas graph|catalog|evidence|claim|verify|mistral|codestral" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.md" | head -260',
      'printf "\\n--- Mistral graph surface ---\\n"',
      'rg -n "mistral-medium-3-5|mistral-medium-3|codestral-25-08|codestral-2508|codestral-25-01|provider:mistral|model-family:mistral" packages/atlas/graph packages/agent-catalog packages/transport-mux -g "*.yaml" -g "*.ts" -g "*.mjs" | head -600',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTrackingTask = defineTask('issue-432.implement-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Mistral model tracking',
  labels: ['issue-432', 'mistral', 'implementation'],
  agent: {
    name: 'mistral-model-tracking-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Track Mistral Medium 3.5 and Codestral 25.08 in the Atlas graph.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #432 and the live Atlas graph/model catalog surfaces.',
        'Preserve unrelated local worktree changes.',
        'Use existing graph/evidence/claim YAML patterns.',
        'Ensure Mistral Medium 3.5 has evidence-backed claims if the model file already exists.',
        'Add Codestral 25.08 as the current Codestral family entry, keep Codestral 25.01 as an older graph record, and connect provider/family/model edges coherently.',
        'Use only official Mistral documentation or existing vendor evidence for factual model claims.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTrackingTask = defineTask('issue-432.verify-tracking', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Mistral graph tracking',
  labels: ['issue-432', 'mistral', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/compute/models/mistral-medium-3-5.yaml',
      'test -f packages/atlas/graph/compute/models/codestral-25-08.yaml',
      'rg -n "model:mistral-medium-3-5@current" packages/atlas/graph/compute/models/mistral-medium-3-5.yaml packages/atlas/graph/compute/model-families/mistral.yaml packages/atlas/graph/compute/providers/mistral.yaml',
      'rg -n "model:codestral-25-08@current|codestral-2508|codestral-25-08" packages/atlas/graph/compute/models/codestral-25-08.yaml packages/atlas/graph/compute/model-families/mistral.yaml packages/atlas/graph/compute/providers/mistral.yaml',
      'rg -n "model:codestral-25-08@current|model:mistral-medium-3-5@current|evidence:mistral-medium-3-5|evidence:mistral-codestral-25-08" packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
      'rg -n "costPerMTokInput: 1.5|costPerMTokOutput: 7.5|contextWindowTokens: 256000" packages/atlas/graph/compute/models/mistral-medium-3-5.yaml',
      'rg -n "costPerMTokInput: 0.3|costPerMTokOutput: 0.9|contextWindowTokens: 256000|supersedes:" packages/atlas/graph/compute/models/codestral-25-08.yaml',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
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

const readArtifactsTask = defineTask('issue-432.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Mistral artifacts for review',
  labels: ['issue-432', 'mistral', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/compute/models/mistral-medium-3-5.yaml packages/atlas/graph/compute/models/codestral-25-08.yaml packages/atlas/graph/compute/models/codestral-25-01.yaml packages/atlas/graph/compute/model-families/mistral.yaml packages/atlas/graph/compute/providers/mistral.yaml packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims .a5c/processes/issue-432-mistral-model-tracking.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-432.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Mistral tracking against issue spec',
  labels: ['issue-432', 'mistral', 'review'],
  agent: {
    name: 'mistral-model-tracking-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #432 requirements to the final artifacts.',
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

const publishTask = defineTask('issue-432.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-432', 'mistral', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/compute/models/mistral-medium-3-5.yaml packages/atlas/graph/compute/models/codestral-25-08.yaml packages/atlas/graph/compute/models/codestral-25-01.yaml packages/atlas/graph/compute/model-families/mistral.yaml packages/atlas/graph/compute/providers/mistral.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
      'git add -f .a5c/processes/issue-432-mistral-model-tracking.js .a5c/processes/issue-432-mistral-model-tracking.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Mistral Medium 3.5 and Codestral 25.08"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Mistral Medium 3.5 and Codestral 25.08" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Mistral Medium 3.5 and Codestral 25.08 in the Atlas graph.\\n\\n- Added/updated model, provider, and family graph records for the current Mistral Medium and Codestral versions.\\n- Added official Mistral evidence sources and model-version claims for the tracked properties.\\n- Kept Codestral 25.01 as an older graph record and linked Codestral 25.08 as its successor.\\n- Ran metadata verification, Atlas build, edge validation, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 432;
  const branchName = inputs?.branchName ?? 'agent/issue-432';
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
      summary: review?.summary ?? 'Final review did not approve Mistral model tracking.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Mistral Medium 3.5 and Codestral 25.08.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
