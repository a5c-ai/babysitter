/**
 * @process repo/model-provider-daily-tracker
 * @description Check major model providers for model releases, updates, deprecations, and capability changes; create graph update issues and publish graph changes if needed.
 * @inputs { userRequest?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, providers, findings, issues, changedFiles, verification, review, publish }
 *
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectContextTask = defineTask('model-provider-tracker.collect-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Build Atlas and collect current model graph context',
  labels: ['model-version-update', 'context', 'catalog', 'atlas'],
  shell: {
    command: [
      'set -euo pipefail',
      'mkdir -p artifacts/model-provider-tracker',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- model-provider-product.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-provider-product.yaml',
      'printf "\\n--- model-provider-version.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-provider-version.yaml',
      'printf "\\n--- model-version-defaults.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-version-defaults.yaml',
      'printf "\\n--- model version claim files ---\\n"',
      'ls packages/atlas/graph/catalog-meta/claims/model-version-*',
      'printf "\\n--- existing model/provider records summary ---\\n"',
      'rg -n "provider:(anthropic|openai|google|xai|meta|deepseek|mistral|qwen|bedrock|cohere|together-ai|fireworks-ai|groq)|model-(version|family)|claude|gpt-|gemini|grok|llama|deepseek|mistral|codestral|pixtral|qwen|nova|command|embed" packages/atlas/graph -g "*.yaml" | head -2200',
      'printf "\\n--- open model-version-update issues ---\\n"',
      'gh issue list --label "model-version-update" --state open --limit 300 --json number,title,labels,url',
      'printf "\\n--- git status ---\\n"',
      'git status --short',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const researchAndIssueTask = defineTask('model-provider-tracker.research-and-issue', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research model providers, compare graph, and create issues',
  labels: ['model-version-update', 'research', 'graph-update'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer and model release researcher',
      task: 'Systematically check each requested model provider for new model releases, version updates, deprecations, capability changes, pricing changes, and graph gaps.',
      instructions: [
        'USER REQUEST (verbatim):',
        '---',
        args.userRequest,
        '---',
        'COLLECTED GRAPH CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Use authoritative provider documentation and announcement sources.',
        'Cover every provider named in the user request: Anthropic, OpenAI, Google Gemini, xAI, Meta Llama, DeepSeek, Mistral, Alibaba Qwen, Amazon Nova/Bedrock, Cohere, Together AI, Fireworks, and Groq.',
        'For each significant new model/update/deprecation/capability/pricing change, run gh issue list --label "model-version-update" --search "<model-name>". If no existing issue exists, create one with labels model-version-update,graph-update.',
        'Issue bodies must include exact model ID/version, provider/API family, release date if known, documentation/announcement links, context window, capabilities, pricing, cross-provider availability, graph changes needed, and transport-adapter proxy support notes.',
        'If graph YAML changes are clearly needed and can be made safely from official evidence, update graph records using existing patterns; otherwise create issues rather than speculative graph changes.',
        'Write artifacts/model-provider-tracker/summary.json with { providers, findings, issuesCreated, issuesExisting, changedFiles, summaryTable, notes }.',
        'Return JSON: { providers: array, findings: array, issuesCreated: array, issuesExisting: array, changedFiles: array, summaryTable: array, summary: string, verificationNotes: array }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('model-provider-tracker.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify graph/catalog after model provider tracking',
  labels: ['model-version-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- summary artifact ---\\n"',
      'test -f artifacts/model-provider-tracker/summary.json && cat artifacts/model-provider-tracker/summary.json',
      'printf "\\n--- changed graph files ---\\n"',
      'git diff --name-only -- packages/atlas/graph .a5c/processes artifacts/model-provider-tracker',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('model-provider-tracker.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final model provider tracker artifacts',
  labels: ['model-version-update', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'printf "\\n--- summary json ---\\n"',
      'test -f artifacts/model-provider-tracker/summary.json && cat artifacts/model-provider-tracker/summary.json',
      'printf "\\n--- diff ---\\n"',
      'git diff -- packages/atlas/graph .a5c/processes artifacts/model-provider-tracker',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('model-provider-tracker.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review model provider coverage against user request',
  labels: ['model-version-update', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare the user request to the produced model-provider tracking artifacts and verification output.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], residualRisk: string[], summary: string }.',
        'Check especially: every requested provider was covered, the research used authoritative sources, issue bodies are specific, graph edits are evidence-backed if present, verification passed, and PR publishing only occurs if graph files changed.',
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

const publishTask = defineTask('model-provider-tracker.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit graph changes and create one PR against staging',
  labels: ['model-version-update', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      `branch="${args.branchName}"`,
      `base="${args.baseBranch}"`,
      'changed_graph="$( { git diff --name-only -- packages/atlas/graph; git diff --cached --name-only -- packages/atlas/graph; git status --short -- packages/atlas/graph | sed \'s/^...//\'; } | sed \'/^$/d\' | sort -u)"',
      'if [ -z "$changed_graph" ]; then printf "No graph/catalog changes; skipping branch, commit, and PR.\\n"; exit 0; fi',
      'current_branch="$(git branch --show-current)"',
      'if [ "$current_branch" != "$branch" ]; then git switch -c "$branch"; fi',
      'git add packages/atlas/graph',
      'git add -f .a5c/processes/model-provider-daily-tracker.js artifacts/model-provider-tracker/summary.json 2>/dev/null || true',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(graph): track model provider versions"; fi',
      'git push -u origin "$branch"',
      'pr_url="$(gh pr list --head "$branch" --json url --jq \'.[0].url // empty\' 2>/dev/null || true)"',
      'if [ -z "$pr_url" ]; then pr_url="$(gh pr create --base "$base" --head "$branch" --title "Track model provider versions" --body "$(printf \'Updates Atlas model provider/version records from the daily model-provider release check.\\n\\nArtifacts:\\n- artifacts/model-provider-tracker/summary.json\\n\\nVerification:\\n- npm run build --workspace=@a5c-ai/atlas\\n\')")"; fi',
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

export async function process(inputs, ctx) {
  const today = new Date().toISOString().slice(0, 10);
  const userRequest = inputs?.userRequest ?? '';
  const branchName = inputs?.branchName ?? `model-versions/daily-${today}`;
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(collectContextTask, {});
  const research = await ctx.task(researchAndIssueTask, {
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
      providers: research?.providers ?? [],
      findings: research?.findings ?? [],
      issues: {
        created: research?.issuesCreated ?? [],
        existing: research?.issuesExisting ?? [],
      },
      changedFiles: research?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { branchName, baseBranch });

  return {
    success: true,
    providers: research?.providers ?? [],
    findings: research?.findings ?? [],
    issues: {
      created: research?.issuesCreated ?? [],
      existing: research?.issuesExisting ?? [],
    },
    changedFiles: research?.changedFiles ?? [],
    summaryTable: research?.summaryTable ?? [],
    verification,
    review,
    publish,
  };
}
