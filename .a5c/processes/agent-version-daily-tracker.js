/**
 * @process repo/agent-version-daily-tracker
 * @description Check upstream host agent CLI releases, update Atlas AgentVersion graph records, create issues, and publish one PR.
 * @inputs { branchName?: string, baseBranch?: string }
 * @outputs { success, checkedAgents, newVersions, changedFiles, issues, prUrl }
 *
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectContextTask = defineTask('agent-version-tracker.collect-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Build atlas/catalog and collect upstream agent release targets',
  labels: ['agent-version-update', 'context', 'catalog', 'upstream'],
  shell: {
    command: [
      'set -euo pipefail',
      'mkdir -p artifacts/agent-version-tracker',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- buildTargetsFromCatalog source ---\\n"',
      "sed -n '1,70p' scripts/sync-external-plugin-repos.mjs",
      'printf "\\n--- catalog external-repo targets ---\\n"',
      `node -e "import(new URL('file://' + process.cwd() + '/packages/atlas/dist/catalog/sdk.js').href).then(m => { const targets = m.listPluginTargetDescriptors().filter(t => t.externalRepo).map(t => ({ id: t.adapterName || t.targetId, displayName: t.displayName, cliCommand: t.cliCommand, externalPackageName: t.externalPackageName, externalRepo: t.externalRepo })); console.log(JSON.stringify(targets, null, 2)); })"`,
      'printf "\\n--- adapter npm install -g commands ---\\n"',
      "grep -r 'npm install -g' packages/agent-mux/adapters/src/ | grep -v node_modules | grep -v test || true",
      'printf "\\n--- merged npm latest snapshot ---\\n"',
      "node --input-type=module <<'NODE'",
      "import { execFileSync, execSync } from 'node:child_process';",
      "import { writeFileSync } from 'node:fs';",
      "const { listPluginTargetDescriptors } = await import(new URL('file://' + process.cwd() + '/packages/atlas/dist/catalog/sdk.js').href);",
      "const targets = listPluginTargetDescriptors()",
      "  .filter((t) => t.externalRepo)",
      "  .map((t) => ({",
      "    id: t.adapterName || t.targetId,",
      "    displayName: t.displayName,",
      "    cliCommand: t.cliCommand,",
      "    externalPackageName: t.externalPackageName || null,",
      "    externalRepo: t.externalRepo,",
      "  }));",
      "let grepOutput = '';",
      "try { grepOutput = execSync(\"grep -r 'npm install -g' packages/agent-mux/adapters/src/ | grep -v node_modules | grep -v test\", { encoding: 'utf8' }); } catch {}",
      "const installPackages = [];",
      "for (const line of grepOutput.split('\\n')) {",
      "  const match = line.match(/npm install -g\\s+([^\\s'\\\"`]+)/);",
      "  if (!match) continue;",
      "  const pkg = match[1].replace(/[,;].*$/, '');",
      "  if (pkg && !pkg.startsWith('@a5c-ai/')) installPackages.push({ packageName: pkg, sourceLine: line });",
      "}",
      "const packageNames = new Set();",
      "for (const target of targets) if (target.externalPackageName && !target.externalPackageName.startsWith('@a5c-ai/')) packageNames.add(target.externalPackageName);",
      "for (const install of installPackages) if (!install.packageName.startsWith('@a5c-ai/')) packageNames.add(install.packageName);",
      "const npmLatest = [];",
      "for (const packageName of [...packageNames].sort()) {",
      "  try {",
      "    const version = execFileSync('npm', ['view', `${packageName}@latest`, 'version'], { encoding: 'utf8', timeout: 120000 }).trim();",
      "    npmLatest.push({ packageName, latestVersion: version });",
      "  } catch (error) {",
      "    npmLatest.push({ packageName, error: String(error?.message || error) });",
      "  }",
      "}",
      "const snapshot = { generatedAt: new Date().toISOString(), targets, installPackages, npmLatest };",
      "writeFileSync('artifacts/agent-version-tracker/upstream-targets-and-latest.json', JSON.stringify(snapshot, null, 2) + '\\n');",
      "console.log(JSON.stringify(snapshot, null, 2));",
      "NODE",
      'printf "\\n--- existing AgentVersion/Product records ---\\n"',
      'rg -n "nodeKind: AgentVersion|id: agentVersion:|agentId:|versionRange:|currentVersion:|upstreamReleaseTag:|releaseNotesUrl:|externalPackageName|npm install -g|externalRepo|repositoryUrl" packages/atlas/graph/agent-stack/versions packages/atlas/graph/agent-stack/products packages/atlas/graph/catalog-meta/evidence-sources -g "*.yaml" | head -1400',
      'printf "\\n--- existing relevant issues ---\\n"',
      'gh issue list --label "agent-version-update" --state open --limit 200 --json number,title,labels,url',
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
  title: 'Research upstream releases, update graph, and create issues',
  labels: ['agent-version-update', 'research', 'graph-update'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer and upstream release researcher',
      task: 'Systematically check every upstream host agent CLI target, update AgentVersion graph records for new upstream versions, and create specific GitHub issues for each new agent/version pair.',
      instructions: [
        'USER REQUEST (verbatim):',
        '---',
        args.userRequest,
        '---',
        'COLLECTED CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Cover every upstream host agent in the target list and the adapter npm install list. Exclude all @a5c-ai/* packages.',
        'Use npm view results from context for npm packages; for non-npm or ambiguous agents, research authoritative upstream sources.',
        'Do not treat generated babysitter plugin packages as upstream host agents.',
        'Compare latest upstream versions against packages/atlas/graph/agent-stack/versions and products.',
        'For each new version not already represented, use actual release notes/changelog/blog/release pages. Record real capability changes, CLI flags, breaking changes, transport/API changes, tool/model support, install/package changes, and migration notes.',
        'Create or update AgentVersion YAML and evidence using existing graph patterns only.',
        'For each new agent+version pair, run gh issue list --label "agent-version-update" --search "<agent> <version>"; if no existing issue exists, create one with labels agent-version-update,graph-update.',
        'Issue bodies must include the exact old/new versions, release links, real researched changes, likely affected system surfaces, install method/package status, migration notes, and a specific assimilation checklist tied to the changes.',
        'If graph files change, ensure the eventual branch is agent-versions/daily-YYYY-MM-DD and one PR targets staging.',
        'Write artifacts/agent-version-tracker/summary.json with { checkedAgents, newVersions, issuesCreated, issuesExisting, changedFiles, notes }.',
        'Return JSON: { checkedAgents: array, newVersions: array, issuesCreated: array, issuesExisting: array, changedFiles: array, summary: string, verificationNotes: array }.',
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
  title: 'Verify graph and catalog after release tracking',
  labels: ['agent-version-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'printf "\\n--- summary artifact ---\\n"',
      'test -f artifacts/agent-version-tracker/summary.json && cat artifacts/agent-version-tracker/summary.json || true',
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
  title: 'Read final release-tracking artifacts',
  labels: ['agent-version-update', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'printf "\\n--- summary json ---\\n"',
      'test -f artifacts/agent-version-tracker/summary.json && cat artifacts/agent-version-tracker/summary.json || true',
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
  title: 'Review release-tracking coverage against user request',
  labels: ['agent-version-update', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare the user request to the produced release-tracking artifacts and verification output.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], residualRisk: string[], summary: string }.',
        'Check especially: every upstream agent target was covered, @a5c-ai packages were excluded, new graph records/evidence are grounded in actual release notes, issue bodies are specific, verification passed, and one PR path is ready if graph changed.',
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
      'changed_graph="$( { git diff --name-only -- packages/atlas/graph; git diff --cached --name-only -- packages/atlas/graph; } | sed \'/^$/d\' | sort -u)"',
      'if [ -z "$changed_graph" ]; then printf "No graph/catalog changes; skipping branch, commit, and PR.\\n"; exit 0; fi',
      'current_branch="$(git branch --show-current)"',
      'if [ "$current_branch" != "$branch" ]; then git switch -c "$branch"; fi',
      'git add packages/atlas/graph',
      'git add -f docs/generated/package-plugin-docs-coverage.json',
      'git add docs/testing/current-test-command-inventory.md docs/workspace-validation.md package-lock.json',
      'git add -f .a5c/processes/agent-version-daily-tracker.js .a5c/processes/agent-version-daily-tracker.inputs.json artifacts/agent-version-tracker/upstream-targets-and-latest.json artifacts/agent-version-tracker/summary.json 2>/dev/null || true',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(graph): track upstream agent versions"; fi',
      'git push -u origin "$branch"',
      'pr_url="$(gh pr list --head "$branch" --json url --jq \'.[0].url // empty\' 2>/dev/null || true)"',
      'if [ -z "$pr_url" ]; then pr_url="$(gh pr create --base "$base" --head "$branch" --title "Track upstream agent CLI versions" --body "$(printf \'Updates Atlas AgentVersion records from the daily upstream host agent release check.\\n\\nArtifacts:\\n- artifacts/agent-version-tracker/upstream-targets-and-latest.json\\n- artifacts/agent-version-tracker/summary.json\\n\\nVerification:\\n- npm run verify:metadata\\n- npm run build --workspace=@a5c-ai/atlas\\n\')")"; fi',
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
      checkedAgents: implementation?.checkedAgents ?? [],
      newVersions: implementation?.newVersions ?? [],
      changedFiles: implementation?.changedFiles ?? [],
      issues: {
        created: implementation?.issuesCreated ?? [],
        existing: implementation?.issuesExisting ?? [],
      },
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { branchName, baseBranch });

  return {
    success: true,
    checkedAgents: implementation?.checkedAgents ?? [],
    newVersions: implementation?.newVersions ?? [],
    changedFiles: implementation?.changedFiles ?? [],
    issues: {
      created: implementation?.issuesCreated ?? [],
      existing: implementation?.issuesExisting ?? [],
    },
    verification,
    review,
    publish,
  };
}
