/**
 * @process repo/agent-version-daily-tracker
 * @description Check original upstream agent CLI products for newly published versions; update Atlas AgentVersion graph records, open precise follow-up issues, and publish one PR when graph files change.
 * @inputs { userRequest?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, agents, findings, issues, changedFiles, summaryTable, verification, review, publish }
 *
 * @process specializations/research/news-intelligence-pipeline
 * @process processes/shared/reporting/scheduled-report
 * @process specializations/collaboration/github/pr-lifecycle-router
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectContextTask = defineTask('agent-version-tracker.collect-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Build Atlas and collect upstream agent target context',
  labels: ['agent-version-update', 'context', 'catalog', 'atlas'],
  shell: {
    command: [
      'set -euo pipefail',
      'mkdir -p artifacts/agent-version-tracker',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- sync-external-plugin-repos buildTargetsFromCatalog ---\\n"',
      'sed -n "1,90p" scripts/sync-external-plugin-repos.mjs',
      'printf "\\n--- catalog external repo targets ---\\n"',
      `node -e "
  import(new URL('file://' + process.cwd() + '/packages/atlas/dist/catalog/sdk.js').href)
    .then(m => {
      const targets = m.listPluginTargetDescriptors()
        .filter(t => t.externalRepo)
        .map(t => ({
          id: t.adapterName || t.targetId,
          displayName: t.displayName,
          cliCommand: t.cliCommand,
          externalPackageName: t.externalPackageName,
          externalRepo: t.externalRepo,
        }));
      console.log(JSON.stringify(targets, null, 2));
    });
"`,
      'printf "\\n--- adapter install commands ---\\n"',
      "grep -r 'npm install -g' packages/adapters/codecs/src/ | grep -v node_modules | grep -v test || true",
      'printf "\\n--- current agent-version graph files ---\\n"',
      'ls packages/atlas/graph/agent-stack/agent-versions',
      'printf "\\n--- current agent products graph files ---\\n"',
      'ls packages/atlas/graph/agent-stack/products',
      'printf "\\n--- current upstream version records summary ---\\n"',
      'rg -n "agentVersion:|product:|externalPackageName|packageName|cliCommand|latest|release|version|Claude Code|Codex|Gemini|Qwen|OpenCode|OpenClaw|Amp|Copilot|Cursor|Antigravity|Pi|OMP|Hermes" packages/atlas/graph/agent-stack packages/atlas/graph/catalog-meta -g "*.yaml" | head -4000',
      'printf "\\n--- open agent-version-update issues ---\\n"',
      'gh issue list --label "agent-version-update" --state open --limit 300 --json number,title,labels,url',
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

const researchAndUpdateTask = defineTask('agent-version-tracker.research-and-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research upstream agent CLI versions, update graph, and create issues',
  labels: ['agent-version-update', 'research', 'graph-update'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer and upstream agent CLI release researcher',
      task: 'Systematically check every original upstream agent CLI product with an external repo for newly published versions, update Atlas AgentVersion records when new versions are not in the graph, and create precise GitHub issues for each new agent+version pair.',
      instructions: [
        'USER REQUEST (verbatim):',
        '---',
        args.userRequest,
        '---',
        '',
        'COLLECTED CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        '',
        'Cover every upstream host agent from the catalog externalRepo target list plus adapter-source install commands. Merge both lists. Exclude all @a5c-ai/* packages.',
        'Use npm view <package>@latest version for npm-distributed upstream packages. For agents without npm packages, use authoritative web sources such as official repos, releases, docs, or package registries.',
        'Compare latest upstream versions against AgentVersion records under packages/atlas/graph/agent-stack/agent-versions/ and product metadata under packages/atlas/graph/agent-stack/products/.',
        'For each new version not already represented, find authoritative release notes/changelog/blog/docs and add or update AgentVersion YAML using existing graph patterns.',
        'Capture concrete capability changes, new CLI flags, breaking changes, transport/API changes, install/package changes, migration steps, and tool/model support changes.',
        'For each new agent+version pair, run gh issue list --label "agent-version-update" --search "<agent> <version>". If no issue exists, create one labeled agent-version-update,graph-update.',
        'Every issue body must be specific to the actual research: exact old and new versions, release-note links, real change summary, affected Babysitter/Atlas/adapter surfaces, install/package changes, migration steps, and a specific assimilation checklist.',
        'If graph files change, rebuild Atlas after edits. Do not commit unrelated dirty files.',
        'Write artifacts/agent-version-tracker/summary.json with { agents, findings, issuesCreated, issuesExisting, changedFiles, summaryTable, notes }.',
        'Return JSON: { agents: array, findings: array, issuesCreated: array, issuesExisting: array, changedFiles: array, summaryTable: array, summary: string, verificationNotes: array }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('agent-version-tracker.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify graph/catalog after upstream agent tracking',
  labels: ['agent-version-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- summary artifact ---\\n"',
      'test -f artifacts/agent-version-tracker/summary.json && cat artifacts/agent-version-tracker/summary.json',
      'printf "\\n--- changed graph files ---\\n"',
      'git diff --name-only -- packages/atlas/graph .a5c/processes artifacts/agent-version-tracker',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('agent-version-tracker.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final upstream agent tracker artifacts',
  labels: ['agent-version-update', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'printf "\\n--- summary json ---\\n"',
      'test -f artifacts/agent-version-tracker/summary.json && cat artifacts/agent-version-tracker/summary.json',
      'printf "\\n--- diff ---\\n"',
      'git diff -- packages/atlas/graph .a5c/processes artifacts/agent-version-tracker',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('agent-version-tracker.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review upstream agent tracker coverage against user request',
  labels: ['agent-version-update', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare the user request to the produced upstream-agent tracking artifacts and verification output.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], residualRisk: string[], summary: string }.',
        'Check especially: every external-repo upstream agent was covered, @a5c-ai packages were excluded, npm/web latest checks used authoritative sources, issue bodies are specific, graph edits are evidence-backed, verification passed, and PR publishing only occurs if graph files changed.',
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

const publishTask = defineTask('agent-version-tracker.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit graph changes and create one PR against staging',
  labels: ['agent-version-update', 'publish'],
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
      'git add -f .a5c/processes/agent-version-daily-tracker.js .a5c/processes/agent-version-daily-tracker.inputs.json artifacts/agent-version-tracker/summary.json 2>/dev/null || true',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(graph): track upstream agent versions"; fi',
      'git push -u origin "$branch"',
      'pr_url="$(gh pr list --head "$branch" --json url --jq \'.[0].url // empty\' 2>/dev/null || true)"',
      'if [ -z "$pr_url" ]; then pr_url="$(gh pr create --base "$base" --head "$branch" --title "Track upstream agent versions" --body "$(printf \'Updates Atlas AgentVersion records from the upstream host-agent release check.\\n\\nArtifacts:\\n- artifacts/agent-version-tracker/summary.json\\n\\nVerification:\\n- npm run build --workspace=@a5c-ai/atlas\\n\')")"; fi',
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
  const branchName = inputs?.branchName ?? `agent-versions/daily-${today}`;
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(collectContextTask, {});
  const research = await ctx.task(researchAndUpdateTask, {
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
      agents: research?.agents ?? [],
      findings: research?.findings ?? [],
      issues: {
        created: research?.issuesCreated ?? [],
        existing: research?.issuesExisting ?? [],
      },
      changedFiles: research?.changedFiles ?? [],
      summaryTable: research?.summaryTable ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { branchName, baseBranch });

  return {
    success: true,
    agents: research?.agents ?? [],
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
