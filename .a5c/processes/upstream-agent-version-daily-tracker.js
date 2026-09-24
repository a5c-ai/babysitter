/**
 * @process repo/upstream-agent-version-daily-tracker
 * @description Check original upstream agent CLI products for new releases, update Atlas AgentVersion graph records, create tracking issues, and publish one PR if graph files changed.
 * @inputs { userRequest: string, branchName?: string, baseBranch?: string }
 * @outputs { success, agentsChecked, newVersions, issues, changedFiles, verification, publish }
 *
 * References searched before authoring:
 * - processes/shared/reporting/scheduled-report
 * - specializations/research/news-intelligence-pipeline
 * - specializations/collaboration/github/pr-policies
 * - specializations/collaboration/github/issue-linking
 * - .a5c/processes/model-provider-daily-tracker.js
 *
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/superpowers/verification-before-completion
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectContextTask = defineTask('upstream-agent-versions.collect-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Build Atlas and collect upstream agent target context',
  labels: ['agent-version-update', 'context', 'atlas'],
  shell: {
    command: [
      'set -euo pipefail',
      'mkdir -p artifacts/upstream-agent-version-tracker',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- sync target builder source ---\\n"',
      'sed -n "1,260p" scripts/sync-external-plugin-repos.mjs',
      'printf "\\n--- catalog external repo targets ---\\n"',
      'node -e "import(new URL(\'file://\' + process.cwd() + \'/packages/atlas/dist/catalog/sdk.js\').href).then(m => { const targets = m.listPluginTargetDescriptors().filter(t => t.externalRepo).map(t => ({ id: t.adapterName || t.targetId, displayName: t.displayName, cliCommand: t.cliCommand, externalPackageName: t.externalPackageName, externalRepo: t.externalRepo })); console.log(JSON.stringify(targets, null, 2)); });"',
      'printf "\\n--- adapter install commands ---\\n"',
      'grep -r "npm install -g" packages/adapters/codecs/src/ | grep -v node_modules | grep -v test || true',
      'printf "\\n--- existing AgentVersion graph files ---\\n"',
      'ls packages/atlas/graph/agent-stack/agent-versions',
      'printf "\\n--- AgentVersion graph summary ---\\n"',
      'rg -n "agentVersion:|product:|version:|semanticVersion:|releaseDate|externalPackageName|cliCommand|source-ref|evidence:" packages/atlas/graph/agent-stack/agent-versions packages/atlas/graph/agent-stack/products packages/atlas/graph/catalog-meta/evidence-sources -g "*.yaml" | head -2400',
      'printf "\\n--- open agent-version-update issues ---\\n"',
      'gh issue list --label "agent-version-update" --state open --limit 300 --json number,title,labels,url',
      'printf "\\n--- worktree ---\\n"',
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

const researchUpdateAndIssueTask = defineTask('upstream-agent-versions.research-update-issue', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research upstream agent releases, update graph, and create issues',
  labels: ['agent-version-update', 'research', 'graph-update'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer and upstream agent CLI release researcher',
      task: 'Systematically check original upstream agent CLI products for latest releases, compare to Atlas AgentVersion records, update graph records for new versions, and create specific tracking issues.',
      instructions: [
        'USER REQUEST (verbatim):',
        '---',
        args.userRequest,
        '---',
        'COLLECTED CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly when graph changes are needed.',
        'Cover every upstream agent target found in the catalog externalRepo list and adapter install commands.',
        'Merge duplicate records by upstream product. Exclude every @a5c-ai/* package.',
        'For npm-distributed upstream agents, use npm view <package>@latest version.',
        'For non-npm or unclear distribution, use authoritative web/repository/release sources.',
        'Compare latest releases against packages/atlas/graph/agent-stack/agent-versions/ and packages/atlas/graph/agent-stack/products/.',
        'For every new agent+version pair not already recorded, research release notes/changelog/blog/source evidence and create or update AgentVersion YAML using existing graph patterns.',
        'Record real capability changes, CLI flags, breaking changes, install/package changes, transport/API changes, tool capabilities, supported models, and migration notes only when supported by sources.',
        'For each new agent+version pair, run gh issue list --label "agent-version-update" --search "<agent> <version>". If none exists, create an issue with labels agent-version-update,graph-update.',
        'Issue bodies must be specific to the research and end with an assimilation checklist whose items name the actual changed graph/adapter surfaces.',
        'Write artifacts/upstream-agent-version-tracker/summary.json with { agentsChecked, latestVersions, newVersions, issuesCreated, issuesExisting, changedFiles, summaryTable, notes }.',
        'Return JSON: { agentsChecked: array, latestVersions: array, newVersions: array, issuesCreated: array, issuesExisting: array, changedFiles: array, summaryTable: array, notes: array }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('upstream-agent-versions.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify upstream agent version graph update',
  labels: ['agent-version-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- tracker summary ---\\n"',
      'test -f artifacts/upstream-agent-version-tracker/summary.json && cat artifacts/upstream-agent-version-tracker/summary.json',
      'printf "\\n--- graph diff files ---\\n"',
      'git diff --name-only -- packages/atlas/graph',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('upstream-agent-versions.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final upstream agent tracker artifacts',
  labels: ['agent-version-update', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'printf "\\n--- tracker summary ---\\n"',
      'test -f artifacts/upstream-agent-version-tracker/summary.json && cat artifacts/upstream-agent-version-tracker/summary.json',
      'printf "\\n--- diff ---\\n"',
      'git diff -- packages/atlas/graph .a5c/processes/upstream-agent-version-daily-tracker.js .a5c/processes/upstream-agent-version-daily-tracker.inputs.json artifacts/upstream-agent-version-tracker/summary.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('upstream-agent-versions.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review upstream agent release coverage',
  labels: ['agent-version-update', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare the user request to the produced tracker artifacts and verification output.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], residualRisk: string[], summary: string }.',
        'Check: every upstream externalRepo target and adapter install-command agent was covered; @a5c-ai packages were excluded; latest versions came from registry or authoritative sources; new graph records are evidence-backed; issues are specific; Atlas build passed; one PR is created only if graph files changed.',
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

const publishTask = defineTask('upstream-agent-versions.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit graph changes and create one PR against staging',
  labels: ['agent-version-update', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      `branch="${args.branchName}"`,
      `base="${args.baseBranch}"`,
      'changed_graph="$( { git diff --name-only -- packages/atlas/graph; git diff --cached --name-only -- packages/atlas/graph; git status --short -- packages/atlas/graph | sed \'s/^...//\'; } | sed \'/^$/d\' | sort -u)"',
      'if [ -z "$changed_graph" ]; then printf "No graph files changed; skipping branch, commit, and PR.\\n"; exit 0; fi',
      'current_branch="$(git branch --show-current)"',
      'if [ "$current_branch" != "$branch" ]; then git switch -c "$branch"; fi',
      'git add packages/atlas/graph',
      'git add -f .a5c/processes/upstream-agent-version-daily-tracker.js .a5c/processes/upstream-agent-version-daily-tracker.inputs.json artifacts/upstream-agent-version-tracker/summary.json 2>/dev/null || true',
      'git diff --cached --name-status',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(graph): track upstream agent versions"; fi',
      'git push -u origin "$branch"',
      'pr_url="$(gh pr list --head "$branch" --json url --jq \'.[0].url // empty\' 2>/dev/null || true)"',
      'if [ -z "$pr_url" ]; then pr_url="$(gh pr create --base "$base" --head "$branch" --title "Track upstream agent CLI versions" --body "$(printf \'Updates Atlas AgentVersion records from the upstream agent CLI release check.\\n\\nArtifacts:\\n- artifacts/upstream-agent-version-tracker/summary.json\\n\\nVerification:\\n- npm run build --workspace=@a5c-ai/atlas\\n\')")"; fi',
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
  const research = await ctx.task(researchUpdateAndIssueTask, {
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
      agentsChecked: research?.agentsChecked ?? [],
      newVersions: research?.newVersions ?? [],
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
    agentsChecked: research?.agentsChecked ?? [],
    latestVersions: research?.latestVersions ?? [],
    newVersions: research?.newVersions ?? [],
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
