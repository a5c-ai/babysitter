/**
 * @process repo/model-version-daily-tracker
 * @description Check major model providers for model releases, updates, deprecations, capability changes, create tracking issues, and publish one PR if graph YAML changes are needed.
 * @inputs { userRequest?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, checkedProviders, findings, issuesCreated, issuesExisting, changedFiles, prUrl, summaryTable }
 *
 * @process specializations/meta/atlas/model-layer-research
 * @process processes/shared/source-discovery
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectContextTask = defineTask('model-version-tracker.collect-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Build Atlas and collect current model graph context',
  labels: ['model-version-update', 'context', 'catalog', 'graph'],
  shell: {
    command: [
      'set -euo pipefail',
      'mkdir -p artifacts/model-version-tracker',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- model-provider-product.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-provider-product.yaml',
      'printf "\\n--- model-provider-version.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-provider-version.yaml',
      'printf "\\n--- model-version-defaults.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-version-defaults.yaml',
      'printf "\\n--- model-version claims ---\\n"',
      'ls packages/atlas/graph/catalog-meta/claims/model-version-*',
      'printf "\\n--- existing compute model graph refs ---\\n"',
      'rg -n "nodeKind: ModelVersion|id: model:|displayName:|providerModelIds:|contextWindowTokens:|maxOutputTokens:|costPerMTok|supportsVision|supportsToolUse|supportsReasoning|supportsExtendedThinking|releaseDate:|deprecated|lifecycle|model-family:|provider:" packages/atlas/graph/compute packages/atlas/graph/catalog-meta -g "*.yaml" | head -2200 || true',
      'printf "\\n--- open model-version-update issues ---\\n"',
      'gh issue list --label "model-version-update" --state open --limit 300 --json number,title,labels,url',
      'printf "\\n--- existing model tracker processes ---\\n"',
      'ls .a5c/processes/*model* .a5c/processes/issue-*graph-update.js 2>/dev/null | head -200',
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const researchAndUpdateTask = defineTask('model-version-tracker.research-and-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research provider model releases, create issues, and update graph if needed',
  labels: ['model-version-update', 'research', 'graph-update'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior model catalog researcher and Atlas graph maintainer',
      task: 'Check every provider in the user request for new model releases, version updates, deprecations, capability changes, and pricing/context changes. Create model-version-update issues where needed, and update graph YAML only if the evidence is strong enough for immediate graph changes.',
      instructions: [
        'USER REQUEST (verbatim):',
        '---',
        args.userRequest,
        '---',
        'COLLECTED GRAPH CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly only if graph YAML changes are clearly needed and supported by authoritative evidence.',
        'Research every provider named in the user request individually: Anthropic, OpenAI, Google Gemini, xAI, Meta Llama, DeepSeek, Mistral, Alibaba Qwen, Amazon Nova, Cohere, Together AI, Fireworks, and Groq.',
        'Prefer official provider documentation and announcements. Use platform model catalog docs for inference providers.',
        'For OpenAI, use official OpenAI sources for model facts.',
        'Compare every researched model/version against the graph context and open model-version-update issues.',
        'For each completely new model or significant update not already represented by graph records or an existing issue, run gh issue list --label "model-version-update" --search "<model-name>" and create an issue only if none exists.',
        'Issue bodies must include exact model ID/version, provider/API family, release date if known, links to actual docs/announcement, context window, capabilities, pricing if available, Azure/Bedrock/Vertex/cross-provider availability, graph changes needed, and transport-adapter proxy support assessment.',
        'If graph YAML changes are made, use existing Atlas model graph patterns, add evidence/claims, rebuild Atlas, and keep the eventual branch model-versions/daily-YYYY-MM-DD targeting staging.',
        'Write artifacts/model-version-tracker/summary.json with { checkedProviders, findings, issuesCreated, issuesExisting, changedFiles, graphChangesNeeded, graphChangesApplied, summaryTable, notes }.',
        'Also write artifacts/model-version-tracker/summary.md containing the final comprehensive provider table requested by the user.',
        'Return JSON: { checkedProviders: array, findings: array, issuesCreated: array, issuesExisting: array, changedFiles: array, graphChangesNeeded: boolean, graphChangesApplied: boolean, summaryTable: string, summary: string, verificationNotes: array }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('model-version-tracker.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify model release tracking artifacts and graph',
  labels: ['model-version-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f artifacts/model-version-tracker/summary.json',
      'test -f artifacts/model-version-tracker/summary.md',
      'node -e "JSON.parse(require(\\"fs\\").readFileSync(\\"artifacts/model-version-tracker/summary.json\\", \\"utf8\\"));"',
      'for provider in Anthropic OpenAI Google xAI Meta DeepSeek Mistral Alibaba Amazon Cohere Together Fireworks Groq; do rg -i "$provider" artifacts/model-version-tracker/summary.md >/dev/null; done',
      'git diff --check',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- summary json ---\\n"',
      'cat artifacts/model-version-tracker/summary.json',
      'printf "\\n--- summary markdown ---\\n"',
      'cat artifacts/model-version-tracker/summary.md',
      'printf "\\n--- changed graph files ---\\n"',
      'git diff --name-only -- packages/atlas/graph .a5c/processes artifacts/model-version-tracker',
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('model-version-tracker.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review model tracker coverage against user request',
  labels: ['model-version-update', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Atlas model catalog reviewer',
      task: 'Compare the user request to the produced model-version tracking artifacts and verification output.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], residualRisk: string[], summary: string }.',
        'Check that every provider from the user request is covered, web research is based on authoritative sources, issue creation is deduped, significant updates are captured, graph changes are either applied or explicitly deferred with rationale, and verification passed.',
        '',
        'USER REQUEST (verbatim):',
        '---',
        args.userRequest,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.verificationStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('model-version-tracker.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit graph changes and create one PR against staging if graph changed',
  labels: ['model-version-update', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      `branch="${args.branchName}"`,
      `base="${args.baseBranch}"`,
      'changed_graph="$( { git diff --name-only -- packages/atlas/graph; git diff --cached --name-only -- packages/atlas/graph; git status --short -- packages/atlas/graph | sed \'s/^...//\'; } | sed \'/^$/d\' | sort -u)"',
      'if [ -z "$changed_graph" ]; then printf "No graph changes; skipping branch, commit, and PR.\\n"; exit 0; fi',
      'current_branch="$(git branch --show-current)"',
      'if [ "$current_branch" != "$branch" ]; then git switch -c "$branch"; fi',
      'git add packages/atlas/graph',
      'git add -f .a5c/processes/model-version-daily-tracker.js .a5c/processes/model-version-daily-tracker.inputs.json artifacts/model-version-tracker/summary.json artifacts/model-version-tracker/summary.md 2>/dev/null || true',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(graph): track model version updates"; fi',
      'git push -u origin "$branch"',
      'pr_url="$(gh pr list --head "$branch" --json url --jq \'.[0].url // empty\' 2>/dev/null || true)"',
      'if [ -z "$pr_url" ]; then pr_url="$(gh pr create --base "$base" --head "$branch" --title "Track model version updates" --body "$(printf \'Updates Atlas model-version records from the daily major provider release check.\\n\\nArtifacts:\\n- artifacts/model-version-tracker/summary.json\\n- artifacts/model-version-tracker/summary.md\\n\\nVerification:\\n- npm run build --workspace=@a5c-ai/atlas\\n\')")"; fi',
      'printf "%s\\n" "$pr_url"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('model-version-tracker.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final model tracker artifacts',
  labels: ['model-version-update', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'printf "\\n--- summary markdown ---\\n"',
      'cat artifacts/model-version-tracker/summary.md',
      'printf "\\n--- summary json ---\\n"',
      'cat artifacts/model-version-tracker/summary.json',
      'printf "\\n--- diff ---\\n"',
      'git diff -- packages/atlas/graph .a5c/processes/model-version-daily-tracker.js artifacts/model-version-tracker',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const today = new Date().toISOString().slice(0, 10);
  const userRequest = inputs?.userRequest ?? '';
  const branchName = inputs?.branchName ?? `model-versions/daily-${today}`;
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(collectContextTask, {});
  const implementation = await ctx.task(researchAndUpdateTask, {
    userRequest,
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
    userRequest,
    artifactsStdout: artifacts?.stdout ?? '',
    verificationStdout: verification?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      checkedProviders: implementation?.checkedProviders ?? [],
      findings: implementation?.findings ?? [],
      issuesCreated: implementation?.issuesCreated ?? [],
      issuesExisting: implementation?.issuesExisting ?? [],
      changedFiles: implementation?.changedFiles ?? [],
      summaryTable: implementation?.summaryTable ?? '',
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { branchName, baseBranch });

  return {
    success: true,
    checkedProviders: implementation?.checkedProviders ?? [],
    findings: implementation?.findings ?? [],
    issuesCreated: implementation?.issuesCreated ?? [],
    issuesExisting: implementation?.issuesExisting ?? [],
    changedFiles: implementation?.changedFiles ?? [],
    prUrl: publish?.stdout?.trim?.() ?? '',
    summaryTable: implementation?.summaryTable ?? '',
    verification,
    review,
    publish,
  };
}
