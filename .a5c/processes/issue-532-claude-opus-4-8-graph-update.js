/**
 * @process repo/issue-532-claude-opus-4-8-graph-update
 * @description Track Claude Opus 4.8 in the Atlas graph using issue-numbered YAML files only.
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

const expectedFiles = [
  'packages/atlas/graph/compute/models/model-issue-532.yaml',
  'packages/atlas/graph/compute/model-families/claude-opus-4-issue-532-sidecar.yaml',
  'packages/atlas/graph/compute/providers/anthropic-issue-532-sidecar.yaml',
  'packages/atlas/graph/compute/providers/bedrock-issue-532-sidecar.yaml',
  'packages/atlas/graph/compute/providers/gcp-vertex-issue-532-sidecar.yaml',
  'packages/atlas/graph/compute/model-transport-protocols/anthropic-messages-issue-532-sidecar.yaml',
  'packages/atlas/graph/compute/model-transport-protocols/vertex-anthropic-messages-issue-532-sidecar.yaml',
  'packages/atlas/graph/catalog-meta/evidence-sources/anthropic-claude-opus-4-8-issue-532.yaml',
  'packages/atlas/graph/catalog-meta/claims/model-version-claude-opus-4-8-issue-532.yaml',
  '.a5c/processes/issue-532-claude-opus-4-8-graph-update.js',
  '.a5c/processes/issue-532-inputs.json',
];

const readContextTask = defineTask('issue-532.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, process references, graph context, and official Claude Opus 4.8 docs',
  labels: ['issue-532', 'claude-opus-4-8', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- active process-library references ---\\n"',
      'rg -n "graph-update|model-version|Atlas graph|evidence|claim|verify|sidecar|extendsNode" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes packages/atlas/graph/schema -g "*.js" -g "*.md" | head -260',
      'printf "\\n--- Claude Opus graph surface ---\\n"',
      'rg -n "claude-opus-4-8|claude-opus-4-7|Claude Opus 4|provider:anthropic|provider:aws-bedrock|provider:gcp-vertex|model-transport:anthropic-messages|model-transport:bedrock|model-transport:vertex-anthropic" packages/atlas/graph -g "*.yaml" -g "*.md" | head -900',
      'printf "\\n--- Anthropic Claude Opus 4.8 announcement excerpt ---\\n"',
      'curl -L --silent https://www.anthropic.com/news/claude-opus-4-8 | tr "<" "\\n<" | rg -n "Claude Opus 4\\\\.8|Opus 4\\\\.8|May|claude-opus-4-8|1M|million|context|pricing|Bedrock|Vertex|Microsoft Foundry|available|extended thinking|tool"',
      'printf "\\n--- Anthropic model overview excerpt ---\\n"',
      'curl -L --silent https://docs.anthropic.com/en/docs/about-claude/models/overview | tr "<" "\\n<" | rg -n "Claude Opus 4\\\\.8|Opus 4\\\\.8|claude-opus-4-8|Context window|Max output|Vision|Extended thinking|Prompt caching|Batch|Tool use|Knowledge cutoff|Pricing|Input|Output|1M|200K|available|Bedrock|Vertex"',
      'printf "\\n--- Anthropic Vertex AI excerpt ---\\n"',
      'curl -L --silent https://docs.anthropic.com/en/api/claude-on-vertex-ai | tr "<" "\\n<" | rg -n "Claude Opus 4\\\\.8|opus-4-8|Vertex|model|publisher|anthropic"',
      'printf "\\n--- Anthropic Bedrock excerpt ---\\n"',
      'curl -L --silent https://docs.anthropic.com/en/api/claude-on-amazon-bedrock | tr "<" "\\n<" | rg -n "Claude Opus 4\\\\.8|opus-4-8|Bedrock|model|anthropic"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-532.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude Opus 4.8 Atlas graph update',
  labels: ['issue-532', 'claude-opus-4-8', 'implementation'],
  agent: {
    name: 'claude-opus-4-8-graph-maintainer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Track Claude Opus 4.8 in the Atlas graph.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Only create new files. Do not modify existing Atlas graph YAML files or existing version files.',
        'Every new Atlas graph YAML filename must include issue number 532, for example model-issue-532.yaml.',
        'Use the existing Claude Opus 4.7 graph file as the structural pattern, but do not edit it.',
        'Use extendsNode sidecars for family, provider, and transport edges that would otherwise require editing existing graph YAML files.',
        'Add official Anthropic evidence and Claim records for model version attributes including context, pricing, capabilities, lifecycle, model card URL, API family, aliases, provider availability, and managed-provider aliases when confirmed by official docs.',
        'Do not add Bedrock or Vertex edges unless the official context confirms Claude Opus 4.8 availability for that provider.',
        'Do not mark Claude Opus 4.7 superseded unless official lifecycle docs in the context state that replacement/deprecation explicitly.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-532.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Claude Opus 4.8 graph update',
  labels: ['issue-532', 'claude-opus-4-8', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'for f in ' + expectedFiles.slice(0, 9).join(' ') + '; do test -f "$f"; done',
      'git status --short',
      'if git diff --name-only --diff-filter=M | rg "^packages/atlas/graph/.*\\\\.ya?ml$"; then echo "modified existing Atlas graph YAML"; exit 1; fi',
      'git ls-files --others --exclude-standard packages/atlas/graph | rg "issue-532.*\\\\.ya?ml$|model-issue-532\\\\.yaml$" >/dev/null',
      'rg -n "id: model:claude-opus-4-8@current|displayName: \\"Claude Opus 4\\\\.8\\"|contextWindowTokens: 1000000|maxOutputTokens: 128000|costPerMTokInput: 5\\\\.0|costPerMTokOutput: 25\\\\.0|supportsExtendedThinking: false|supportsAdaptiveThinking: true|claude-opus-4-8|releaseDate:" packages/atlas/graph/compute/models/model-issue-532.yaml',
      'rg -n "extendsNode:|model:claude-opus-4-8@current" packages/atlas/graph/compute/model-families/claude-opus-4-issue-532-sidecar.yaml packages/atlas/graph/compute/providers/*issue-532-sidecar.yaml packages/atlas/graph/compute/model-transport-protocols/*issue-532-sidecar.yaml',
      'rg -n "evidence:anthropic-claude-opus-4-8-|claim:model-version-model-claude-opus-4-8-current-|model:claude-opus-4-8@current" packages/atlas/graph/catalog-meta/evidence-sources/anthropic-claude-opus-4-8-issue-532.yaml packages/atlas/graph/catalog-meta/claims/model-version-claude-opus-4-8-issue-532.yaml',
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

const readArtifactsTask = defineTask('issue-532.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Claude Opus 4.8 artifacts',
  labels: ['issue-532', 'claude-opus-4-8', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- ' + expectedFiles.join(' '),
      'printf "\\n--- new files ---\\n"',
      'for f in ' + expectedFiles.join(' ') + '; do if test -f "$f"; then printf "\\n### %s\\n" "$f"; sed -n "1,220p" "$f"; fi; done',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphUpdateTask = defineTask('issue-532.review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Claude Opus 4.8 graph update against issue spec',
  labels: ['issue-532', 'claude-opus-4-8', 'review'],
  agent: {
    name: 'claude-opus-4-8-graph-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #532 requirements to the final graph artifacts.',
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
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-532.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-532', 'claude-opus-4-8', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add -f ' + expectedFiles.join(' '),
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Claude Opus 4.8"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Claude Opus 4.8 in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Claude Opus 4.8 in the Atlas graph.\\n\\n- Added a new issue-numbered ModelVersion YAML for model:claude-opus-4-8@current.\\n- Added issue-numbered sidecars for Claude Opus 4 family, Anthropic, Bedrock, Vertex, and transport links without modifying existing graph YAML files.\\n- Added official Anthropic evidence and model-version claims for context, pricing, capabilities, lifecycle, aliases, API family, and provider availability.\\n- Ran metadata verification, Atlas build, edge validation, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 532;
  const branchName = inputs?.branchName ?? 'graph-update/532';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementGraphUpdateTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyGraphUpdateTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewGraphUpdateTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve Claude Opus 4.8 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Claude Opus 4.8 in Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
