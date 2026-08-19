/**
 * @process repo/daily-model-version-tracker
 * @description Daily model-provider release tracker for Atlas graph coverage, issue creation, and optional graph/PR updates.
 * @inputs { branchName?: string, baseBranch?: string, providers: Array<object>, prompt: string }
 * @outputs { success, phases, summary, providerTable, issuesCreated, existingIssues, graphChangesNeeded, prUrl, verification }
 *
 * @process specializations/research/news-intelligence-pipeline
 * @process specializations/collaboration/github/issue-only-no-direct-commits
 * @process methodologies/gsd/research-phase
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readAtlasContextTask = defineTask('daily-model-tracker.read-atlas-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Build Atlas and read current model graph context',
  labels: ['model-version-update', 'atlas', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- model-provider-product.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-provider-product.yaml',
      'printf "\\n--- model-provider-version.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-provider-version.yaml',
      'printf "\\n--- model-version-defaults.yaml ---\\n"',
      'cat packages/atlas/graph/capabilities-and-models/model-version-defaults.yaml',
      'printf "\\n--- model-version claims ---\\n"',
      'ls packages/atlas/graph/catalog-meta/claims/model-version-*',
      'printf "\\n--- existing model-version-update issues ---\\n"',
      'gh issue list --label "model-version-update" --state open --limit 200 --json number,title,url,labels',
      'printf "\\n--- transport adapter proxy surfaces ---\\n"',
      'rg -n "anthropic|openai|gemini|google|xai|grok|llama|deepseek|mistral|qwen|nova|bedrock|cohere|together|fireworks|groq|chat.completions|messages|responses" packages/transport-mux packages/agent-catalog packages/atlas/graph -g "*.ts" -g "*.mjs" -g "*.yaml" | head -1200',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const researchAndIssueTask = defineTask('daily-model-tracker.research-and-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research every provider, compare graph, and create missing issues',
  labels: ['model-version-update', 'graph-update', 'research'],
  agent: {
    name: 'model-version-tracker',
    prompt: {
      role: 'senior model catalog maintainer and release intelligence analyst',
      task: 'Check every requested model provider for new releases, version updates, deprecations, and capability/pricing changes; compare them to the Atlas graph; create GitHub issues for missing significant updates.',
      instructions: [
        'USER SPEC (verbatim):',
        '---',
        args.userPrompt,
        '---',
        'PROVIDERS TO COVER (verbatim JSON):',
        '---',
        JSON.stringify(args.providers, null, 2),
        '---',
        'CURRENT ATLAS/ISSUE/TRANSPORT CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Mandatory execution details:',
        '1. Use web search for each provider listed in PROVIDERS TO COVER. Do not skip any provider.',
        '2. Prefer official model documentation, official release notes, and cloud provider docs. Use reputable secondary sources only to discover official links or fill announcement dates.',
        '3. For each new model or significant update, run gh issue list --label "model-version-update" --search "<model-name>" before creating an issue.',
        '4. Create missing issues with labels "model-version-update,graph-update" and include: exact model ID/version, provider/API family, release date if known, documentation/announcement links, context window, key capabilities, pricing tier if available, cross-provider availability, graph changes needed, and transport-adapter proxy support assessment.',
        '5. If graph YAML changes are needed and feasible in this run, create/switch to the requested branch, edit records in packages/atlas/graph/capabilities-and-models/, rebuild Atlas, commit, push, and open one PR against the requested base branch. If not feasible, explain why and leave graphChangesNeeded=true.',
        '6. Preserve unrelated worktree changes.',
        '7. Return JSON only: { providerTable: Array<{ provider, model, latestVersion, inGraph, status, sources: string[] }>, issuesCreated: Array<{ title, url, provider, model }>, existingIssues: Array<{ title, url, provider, model }>, graphChangesNeeded: boolean, changedFiles: string[], prUrl?: string, summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyFinalTask = defineTask('daily-model-tracker.verify-final', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify final Atlas build and GitHub tracking state',
  labels: ['model-version-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run build --workspace=@a5c-ai/atlas',
      'git status --short',
      'printf "\\n--- open model-version-update issues ---\\n"',
      'gh issue list --label "model-version-update" --state open --limit 200 --json number,title,url,labels',
      'printf "\\n--- open model version PRs ---\\n"',
      `gh pr list --state open --head "${args.branchName}" --json number,title,url,headRefName,baseRefName || true`,
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const branchName = inputs?.branchName ?? `model-versions/daily-${new Date().toISOString().slice(0, 10)}`;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const providers = inputs?.providers ?? [];
  const userPrompt = inputs?.prompt ?? '';

  const context = await ctx.task(readAtlasContextTask, {});
  const research = await ctx.task(researchAndIssueTask, {
    userPrompt,
    providers,
    contextStdout: context?.stdout ?? '',
    branchName,
    baseBranch,
  });
  const verification = await ctx.task(verifyFinalTask, { branchName });

  return {
    success: true,
    phases: ['atlas-context', 'provider-research', 'issue-or-pr-management', 'verification'],
    summary: research?.summary ?? 'Completed daily model-version tracker run.',
    providerTable: research?.providerTable ?? [],
    issuesCreated: research?.issuesCreated ?? [],
    existingIssues: research?.existingIssues ?? [],
    graphChangesNeeded: research?.graphChangesNeeded ?? false,
    changedFiles: research?.changedFiles ?? [],
    prUrl: research?.prUrl,
    verification,
  };
}
