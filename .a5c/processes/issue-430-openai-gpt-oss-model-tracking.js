/**
 * @process repo/issue-430-openai-gpt-oss-model-tracking
 * @description Track OpenAI gpt-oss-120b and gpt-oss-20b in the Atlas graph with evidence-backed metadata.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process specializations/meta/atlas/model-layer-research
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/automaker/automaker-review-ship
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-430.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR, OpenAI docs, and gpt-oss graph context',
  labels: ['issue-430', 'openai', 'gpt-oss', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "graph-update|model-version|Atlas graph|catalog|evidence|claim|verify|open-weight|openai" library/specializations/meta/atlas /home/runner/.a5c/process-library/babysitter-repo/library/methodologies .a5c/processes -g "*.js" -g "*.md" | head -260',
      'printf "\\n--- existing gpt-oss graph refs ---\\n"',
      'rg -n "gpt-oss|openai-chat|provider:openai|provider:together|provider:fireworks|provider:groq|provider:azure-foundry|model-family:openai" packages/atlas/graph packages/agent-catalog packages/transport-mux -g "*.yaml" -g "*.ts" -g "*.mjs" | head -700 || true',
      'printf "\\n--- relevant graph directories ---\\n"',
      'find packages/atlas/graph/compute -maxdepth 2 -type f | sort | rg "models|model-families|providers|model-transport-protocols" | head -300',
      'printf "\\n--- evidence/claim OpenAI patterns ---\\n"',
      'find packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims -type f | sort | rg "openai|gpt|model-version|model-" | head -300',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTrackingTask = defineTask('issue-430.implement-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OpenAI gpt-oss model tracking',
  labels: ['issue-430', 'openai', 'gpt-oss', 'implementation'],
  agent: {
    name: 'openai-gpt-oss-model-tracking-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Track OpenAI gpt-oss-120b and gpt-oss-20b in the Atlas graph.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #430 and the live Atlas graph/model catalog surfaces.',
        'Preserve unrelated local worktree changes.',
        'Use existing graph/evidence/claim YAML patterns.',
        'Use official OpenAI gpt-oss sources from the issue context where possible; do not invent launch dates, context windows, pricing, or provider availability when evidence is missing.',
        'Model gpt-oss as OpenAI open-weight model versions. Direct OpenAI API pricing/support should not be implied for self-hosted open-weight deployments.',
        'Add or update evidence-backed catalog metadata and coherent family/provider/transport edges for model:gpt-oss-120b@current and model:gpt-oss-20b@current.',
        'Add served-by/provider edges only where the evidence in SPEC AND CONTEXT or repository sources supports them.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTrackingTask = defineTask('issue-430.verify-tracking', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify OpenAI gpt-oss graph tracking',
  labels: ['issue-430', 'openai', 'gpt-oss', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "id: model:gpt-oss-120b@current" packages/atlas/graph/compute/models',
      'rg -n "id: model:gpt-oss-20b@current" packages/atlas/graph/compute/models',
      'rg -n "model:gpt-oss-120b@current|model:gpt-oss-20b@current" packages/atlas/graph/compute/model-families packages/atlas/graph/compute/providers packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
      'rg -n "evidence:openai-gpt-oss|gpt-oss-120b|gpt-oss-20b|open-weight" packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims packages/atlas/graph/compute/models',
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

const readArtifactsTask = defineTask('issue-430.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed gpt-oss artifacts for review',
  labels: ['issue-430', 'openai', 'gpt-oss', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/compute packages/atlas/graph/catalog-meta .a5c/processes/issue-430-openai-gpt-oss-model-tracking.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-430.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review gpt-oss tracking against issue spec',
  labels: ['issue-430', 'openai', 'gpt-oss', 'review'],
  agent: {
    name: 'openai-gpt-oss-model-tracking-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #430 requirements to the final artifacts.',
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

const publishTask = defineTask('issue-430.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-430', 'openai', 'gpt-oss', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/compute packages/atlas/graph/catalog-meta',
      'git add -f .a5c/processes/issue-430-openai-gpt-oss-model-tracking.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track OpenAI gpt-oss models"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track OpenAI gpt-oss model versions" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked OpenAI gpt-oss model versions in the Atlas graph.\\n\\n- Added evidence-backed graph metadata for gpt-oss-120b and gpt-oss-20b.\\n- Modeled gpt-oss as OpenAI open-weight model versions without implying direct OpenAI API pricing/support.\\n- Preserved provider/transport claims only where graph evidence supports them.\\n- Ran metadata verification, Atlas build, edge validation, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 430;
  const branchName = inputs?.branchName ?? 'agent/issue-430';
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
      summary: review?.summary ?? 'Final review did not approve OpenAI gpt-oss model tracking.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked OpenAI gpt-oss-120b and gpt-oss-20b.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
