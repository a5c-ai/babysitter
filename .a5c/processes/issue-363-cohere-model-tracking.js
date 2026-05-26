/**
 * @process repo/issue-363-cohere-model-tracking
 * @description Track Cohere Command A+ and Embed v4.0 in the Atlas graph with evidence-backed metadata.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/automaker/automaker-review-ship
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-363.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR, process, and Cohere graph context',
  labels: ['issue-363', 'cohere', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "graph-update|model-version|Atlas graph|catalog|evidence|claim|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.md" | head -220',
      'printf "\\n--- Cohere graph surface ---\\n"',
      'rg -n "command-a-plus|command-r-plus|cohere-embed-v4|cohere-embed-english-v3|provider:cohere|provider:aws-bedrock|model-transport:cohere" packages/atlas/graph packages/agent-catalog packages/transport-mux -g "*.yaml" -g "*.ts" -g "*.mjs" | head -500',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTrackingTask = defineTask('issue-363.implement-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Cohere model tracking',
  labels: ['issue-363', 'cohere', 'implementation'],
  agent: {
    name: 'cohere-model-tracking-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Track Cohere Command A+ and Embed v4.0 in the Atlas graph.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #363 and the live Atlas graph/model catalog surfaces.',
        'Preserve unrelated local worktree changes.',
        'Use existing graph/evidence/claim YAML patterns.',
        'Ensure model-family/provider/model edges are internally coherent for Command A+ and Embed v4.0.',
        'Add or update evidence-backed catalog metadata where the new model records lack it.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTrackingTask = defineTask('issue-363.verify-tracking', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Cohere graph tracking',
  labels: ['issue-363', 'cohere', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/compute/models/command-a-plus-05-2026.yaml',
      'test -f packages/atlas/graph/compute/models/cohere-embed-v4-0.yaml',
      'rg -n "model:command-a-plus-05-2026@current" packages/atlas/graph/compute/model-families/cohere-command.yaml packages/atlas/graph/compute/providers/cohere.yaml',
      'rg -n "model:cohere-embed-v4-0@current" packages/atlas/graph/compute/model-families/cohere-embed-v4.yaml packages/atlas/graph/compute/providers/cohere.yaml packages/atlas/graph/compute/providers/bedrock.yaml',
      'rg -n "model-transport:cohere-chat|model-transport:cohere-embed" packages/atlas/graph/compute/model-transport-protocols packages/atlas/graph/compute/providers/cohere.yaml',
      'rg -n "evidence:cohere-command-a-plus-doc|evidence:cohere-embed-v4-doc|model:command-a-plus-05-2026@current|model:cohere-embed-v4-0@current" packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
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

const readArtifactsTask = defineTask('issue-363.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Cohere artifacts for review',
  labels: ['issue-363', 'cohere', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/compute/models/command-a-plus-05-2026.yaml packages/atlas/graph/compute/models/cohere-embed-v4-0.yaml packages/atlas/graph/compute/model-families/cohere-command.yaml packages/atlas/graph/compute/model-families/cohere-embed-v4.yaml packages/atlas/graph/compute/model-transport-protocols packages/atlas/graph/compute/providers/cohere.yaml packages/atlas/graph/compute/providers/bedrock.yaml packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims packages/transport-mux packages/agent-catalog .a5c/processes/issue-363-cohere-model-tracking.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-363.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Cohere tracking against issue spec',
  labels: ['issue-363', 'cohere', 'review'],
  agent: {
    name: 'cohere-model-tracking-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #363 requirements to the final artifacts.',
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

const publishTask = defineTask('issue-363.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-363', 'cohere', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/compute/models/command-a-plus-05-2026.yaml packages/atlas/graph/compute/models/cohere-embed-v4-0.yaml packages/atlas/graph/compute/model-families/cohere-command.yaml packages/atlas/graph/compute/model-families/cohere-embed-v4.yaml packages/atlas/graph/compute/model-transport-protocols/cohere-chat.yaml packages/atlas/graph/compute/model-transport-protocols/cohere-embed.yaml packages/atlas/graph/compute/providers/cohere.yaml packages/atlas/graph/compute/providers/bedrock.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
      'git add -f .a5c/processes/issue-363-cohere-model-tracking.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Cohere Command A+ and Embed v4"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Cohere Command A+ and Embed v4.0" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Cohere Command A+ and Embed v4.0 in the Atlas graph.\\n\\n- Ensured Command A+ and Embed v4.0 model/family/provider edges are coherent.\\n- Added evidence-backed catalog metadata for the new Cohere model records.\\n- Ran metadata, edge validation, Atlas build, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 363;
  const branchName = inputs?.branchName ?? 'agent/issue-363';
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
      summary: review?.summary ?? 'Final review did not approve Cohere model tracking.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Cohere Command A+ and Embed v4.0.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
