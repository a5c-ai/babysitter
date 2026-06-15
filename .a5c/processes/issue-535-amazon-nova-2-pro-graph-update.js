/**
 * @process repo/issue-535-amazon-nova-2-pro-graph-update
 * @description Track Amazon Nova 2 Pro Preview in the Atlas graph using issue-scoped new YAML files only.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process specializations/meta/atlas/model-layer-research
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/automaker/automaker-review-ship
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const prepareBranchTask = defineTask('issue-535.prepare-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prepare graph-update branch',
  labels: ['issue-535', 'git', 'branch'],
  shell: {
    command: [
      'set -euo pipefail',
      `git fetch origin ${args.baseBranch}`,
      `if git show-ref --verify --quiet refs/heads/${args.branchName}; then git checkout ${args.branchName}; else git checkout -b ${args.branchName} origin/${args.baseBranch}; fi`,
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readContextTask = defineTask('issue-535.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, AWS docs, and graph context',
  labels: ['issue-535', 'amazon-nova', 'bedrock', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "graph-update|model-version|Atlas graph|catalog|evidence|claim|verify|new files|patch" library/specializations/meta/atlas /home/runner/.a5c/process-library/babysitter-repo/library/methodologies .a5c/processes -g "*.js" -g "*.md" | head -320 || true',
      'printf "\\n--- existing Nova graph refs ---\\n"',
      'rg -n "amazon-nova-2|nova-2|aws-bedrock|bedrock-converse|bedrock-invoke" packages/atlas/graph/compute packages/atlas/graph/catalog-meta -g "*.yaml" | head -800 || true',
      'printf "\\n--- Atlas index patch semantics ---\\n"',
      'rg -n "isRecordPatch|mergeStrategy|patch === true|pendingRecordPatches|extractEdges" packages/atlas/src/indexer.ts -C 4',
      'printf "\\n--- AWS model-card index ---\\n"',
      'curl -L --fail --silent https://docs.aws.amazon.com/bedrock/latest/userguide/model-cards.html | rg -n "Nova 2 Pro|Nova 2 Lite|Nova 2 Sonic|model-card-amazon-nova-2" -C 3 || true',
      'printf "\\n--- AWS Nova 2 Lite model-card as ID/API pattern ---\\n"',
      'curl -L --fail --silent https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html | rg -n "Model launch date|Context window|Max output tokens|Model ID|amazon.nova-2-lite|Converse|Invoke|tool|Structured outputs|Pricing" -C 2 || true',
      'printf "\\n--- AWS Nova product page ---\\n"',
      'curl -L --fail --silent https://aws.amazon.com/nova/models/ | rg -n "Nova 2 Pro|Nova 2 Lite|Preview|one-million-token|built-in tools|web grounding|MCP|Forge|model ID|amazon\\.nova|pricing" -C 2 || true',
      'printf "\\n--- AWS Nova 2 announcement ---\\n"',
      'curl -L --fail --silent https://aws.amazon.com/about-aws/whats-new/2025/12/nova-2-foundation-models-amazon-bedrock/ | rg -n "Nova 2 Pro|Nova 2 Lite|Preview|one-million-token|built-in tools|web grounding|MCP|Forge|available|Bedrock|postDateTime|model ID|amazon\\.nova" -C 2 || true',
      'printf "\\n--- Direct Nova 2 Pro model-card probes ---\\n"',
      'for url in https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-pro.html https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-pro-preview.html https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-pro.md https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-pro-preview.md; do printf "%s\\n" "$url"; curl -L --fail --silent "$url" | rg -n "Nova 2 Pro|amazon\\.nova-2-pro|Model ID|Context window|Preview" -C 2 || true; done',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTrackingTask = defineTask('issue-535.implement-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Amazon Nova 2 Pro graph tracking',
  labels: ['issue-535', 'amazon-nova', 'bedrock', 'implementation'],
  agent: {
    name: 'amazon-nova-2-pro-graph-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Track Amazon Nova 2 Pro Preview in the Atlas graph for issue #535.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Preserve unrelated local worktree changes.',
        'Create only new Atlas graph YAML files; do not modify existing Atlas graph YAML files.',
        'Every new Atlas graph YAML filename you create must include "issue-535".',
        'Use existing YAML patterns for ModelVersion, EvidenceSource, Claim, and patch records.',
        'For model-family/provider/transport edges that would normally touch existing files, create new issue-scoped patch YAML records using patch: true or mergeStrategy: patch so the indexer appends edges from a new file.',
        'Do not invent exact Bedrock provider model IDs, pricing, max output tokens, or public model-card URLs. If official public sources do not expose the exact Nova 2 Pro Preview model ID, track that explicitly as an unresolved public-doc limitation in claims/notes.',
        'Represent Nova 2 Pro as a preview model, Bedrock-native, belonging to model-family:amazon-nova-2, served by provider:aws-bedrock, with one-million-token context and tool/reasoning capabilities only where official AWS sources in SPEC AND CONTEXT support them.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTrackingTask = defineTask('issue-535.verify-tracking', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Amazon Nova 2 Pro graph tracking',
  labels: ['issue-535', 'amazon-nova', 'bedrock', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'changed_atlas_yaml="$(git status --porcelain -- packages/atlas/graph | awk \'{print $2}\' | rg "\\.ya?ml$" || true)"',
      'printf "%s\\n" "$changed_atlas_yaml"',
      'test -n "$changed_atlas_yaml"',
      'modified_atlas_yaml="$(git diff --name-only --diff-filter=M -- packages/atlas/graph | rg "\\.ya?ml$" || true)"',
      'if [ -n "$modified_atlas_yaml" ]; then printf "Modified existing Atlas YAML files are not allowed:\\n%s\\n" "$modified_atlas_yaml" >&2; exit 1; fi',
      'bad_names="$(printf "%s\\n" "$changed_atlas_yaml" | awk -F/ \'NF && $NF !~ /issue-535/ { print }\')"',
      'if [ -n "$bad_names" ]; then printf "Atlas YAML filenames must include issue-535:\\n%s\\n" "$bad_names" >&2; exit 1; fi',
      'rg -n "id: model:amazon-nova-2-pro-preview@current|Amazon Nova 2 Pro" packages/atlas/graph/compute/models/*issue-535*.yaml',
      'rg -n "patch: true|mergeStrategy: patch|model:amazon-nova-2-pro-preview@current" packages/atlas/graph/compute/**/*issue-535*.yaml',
      'rg -n "evidence:amazon-nova-2-pro|Nova 2 Pro|providerModelIds|unresolved|one-million-token|Amazon Nova Forge|Bedrock" packages/atlas/graph/catalog-meta/**/*issue-535*.yaml packages/atlas/graph/compute/**/*issue-535*.yaml',
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

const readArtifactsTask = defineTask('issue-535.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Nova 2 Pro artifacts for review',
  labels: ['issue-535', 'amazon-nova', 'bedrock', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph .a5c/processes/issue-535-amazon-nova-2-pro-graph-update.js',
      'for file in $(git status --porcelain -- packages/atlas/graph | awk \'{print $2}\' | sort); do printf "\\n--- %s ---\\n" "$file"; sed -n "1,260p" "$file"; done',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-535.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Nova 2 Pro tracking against issue spec',
  labels: ['issue-535', 'amazon-nova', 'bedrock', 'review'],
  agent: {
    name: 'amazon-nova-2-pro-graph-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #535 requirements to the final artifacts.',
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
        'Pay special attention to the user constraint that Atlas graph YAML changes are new files only and filenames include issue-535.',
        'Return JSON: { approved: boolean, issues: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-535.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-535', 'amazon-nova', 'bedrock', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/compute/*/*issue-535*.yaml packages/atlas/graph/catalog-meta/*/*issue-535*.yaml',
      'git add -f .a5c/processes/issue-535-amazon-nova-2-pro-graph-update.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Amazon Nova 2 Pro preview"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Amazon Nova 2 Pro preview in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Amazon Nova 2 Pro Preview in the Atlas graph.\\n\\n- Added issue-scoped new YAML files only; all new Atlas YAML filenames include issue-535.\\n- Added the Nova 2 Pro Preview model node plus patch records for Nova 2 family, Bedrock provider, and Bedrock transport edges.\\n- Added official AWS evidence and claims, including the public-doc limitation that exact Pro Preview model IDs/pricing are not exposed in reviewed official sources.\\n- Ran metadata verification, Atlas build, edge validation, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 535;
  const branchName = inputs?.branchName ?? 'graph-update/535';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const branch = await ctx.task(prepareBranchTask, { branchName, baseBranch });
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
      phases: ['branch', 'context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve Amazon Nova 2 Pro graph tracking.',
      changedFiles: implementation?.changedFiles ?? [],
      branch,
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['branch', 'context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Amazon Nova 2 Pro Preview.',
    changedFiles: implementation?.changedFiles ?? [],
    branch,
    verification,
    review,
    publish,
  };
}
