/**
 * @process repo/issue-863-omp-15-7-6-graph-update
 * @description Add unique additive Atlas graph files for the OMP 15.7.6 release without editing shared YAML.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/maestro/maestro-knowledge-graph
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const setupBranchTask = defineTask('issue-863.setup-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prepare issue branch',
  labels: ['issue-863', 'omp', 'branch'],
  shell: {
    command: [
      'set -euo pipefail',
      `git fetch origin ${args.baseBranch}`,
      `if git rev-parse --verify ${args.branchName} >/dev/null 2>&1; then git switch ${args.branchName}; else git switch -c ${args.branchName}; fi`,
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

const readContextTask = defineTask('issue-863.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release, process references, and OMP graph context',
  labels: ['issue-863', 'omp', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- OMP v15.7.6 release ---\\n"',
      'gh release view v15.7.6 --repo can1357/oh-my-pi --json name,tagName,publishedAt,url,body',
      'printf "\\n--- OMP npm package ---\\n"',
      'npm view @oh-my-pi/pi-coding-agent@15.7.6 version time dist.tarball --json',
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimilat|verify|knowledge-graph" /home/runner/.a5c/process-library/babysitter-repo/library .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- OMP graph surface ---\\n"',
      'rg -n "Oh-My-Pi|OMP|omp|15\\\\.7\\\\.6|15-7-6|15\\\\.7\\\\.3|15-7-3|ask option|thinking|diagnosticsDeduplicate|autocomplete|slash-command|eval timeout|Windows Terminal|fuzzy|adapterMetadata|releaseTracking" packages/atlas/graph -g "*.yaml" | head -1200',
      'printf "\\n--- additive-file policy ---\\n"',
      'printf "%s\\n" "Create unique new files: packages/atlas/graph/agent-stack/agent-versions/omp-15-7-6-update.yaml and packages/atlas/graph/catalog-meta/evidence-sources/omp-15-7-6-update.yaml. Do not edit shared YAML. Do not nest release-tracking data under adapterMetadata."',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-863.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OMP 15.7.6 additive graph files',
  labels: ['issue-863', 'omp', 'implementation'],
  agent: {
    name: 'omp-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add unique additive Atlas graph YAML files for the OMP 15.7.6 release.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #863 and OMP v15.7.6.',
        'Preserve unrelated local worktree changes.',
        'Create new graph YAML only. Do not edit existing shared YAML files other PRs may touch.',
        'Use packages/atlas/graph/agent-stack/agent-versions/omp-15-7-6-update.yaml for the AgentVersion additive patch.',
        'Use packages/atlas/graph/catalog-meta/evidence-sources/omp-15-7-6-update.yaml for new evidence sources.',
        'Represent release-tracking data as sibling attributes on the AgentVersion record, not nested under adapterMetadata.',
        'Capture ask option descriptions, supplemental thinking UI extension API, default-on lsp.diagnosticsDeduplicate, ESC/autocomplete handling, recursive Claude Code slash command discovery and namespace aliases, eval timeout heartbeat semantics, Windows Terminal repaint fix, and @ file completion maxResults behavior.',
        'Use existing Atlas graph node shapes and IDs where possible; avoid duplicate IDs and avoid broad schema changes.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-863.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify OMP 15.7.6 additive graph update',
  labels: ['issue-863', 'omp', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/agent-stack/agent-versions/omp-15-7-6-update.yaml',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/omp-15-7-6-update.yaml',
      'git diff --name-only origin/staging...HEAD > /tmp/issue-863-files.txt',
      'if grep -E "^packages/atlas/graph/.*\\.ya?ml$" /tmp/issue-863-files.txt | grep -Ev "omp-15-7-6-update\\.yaml$"; then echo "Only unique issue #863 graph YAML files may be changed" >&2; exit 1; fi',
      'if rg -n "adapterMetadata:([\\s\\S]{0,800})releaseTracking|adapterMetadata\\.[A-Za-z0-9_.-]*release" packages/atlas/graph/agent-stack/agent-versions/omp-15-7-6-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/omp-15-7-6-update.yaml; then echo "release-tracking data must not be nested under adapterMetadata" >&2; exit 1; fi',
      'rg -n "agentVersion:omp:15-7-6|15.7.6|ask|thinking|lsp.diagnosticsDeduplicate|ESC|autocomplete|slash|namespace|eval|heartbeat|Windows Terminal|maxResults|100|releaseTracking" packages/atlas/graph/agent-stack/agent-versions/omp-15-7-6-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/omp-15-7-6-update.yaml',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
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

const readArtifactsTask = defineTask('issue-863.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed OMP 15.7.6 artifacts for review',
  labels: ['issue-863', 'omp', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/agent-versions/omp-15-7-6-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/omp-15-7-6-update.yaml .a5c/processes/issue-863-omp-15-7-6-graph-update.js .a5c/processes/issue-863-omp-15-7-6-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-863.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review OMP 15.7.6 graph update against issue spec',
  labels: ['issue-863', 'omp', 'review'],
  agent: {
    name: 'omp-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #863 requirements to the final artifacts.',
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
        'Verify that only unique additive graph YAML files are changed and release-tracking data is not nested under adapterMetadata.',
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-863.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-863', 'omp', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/agent-versions/omp-15-7-6-update.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/omp-15-7-6-update.yaml',
      'git add -f .a5c/processes/issue-863-omp-15-7-6-graph-update.js .a5c/processes/issue-863-omp-15-7-6-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then git commit -m "feat(graph): track OMP 15.7.6 agent version"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track OMP 15.7.6 agent version" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented OMP 15.7.6 graph tracking for issue #%s.\\n\\n- Added unique additive AgentVersion and evidence-source YAML files named after the agent and version.\\n- Captured official release evidence plus npm package metadata.\\n- Modeled ask option descriptions, thinking UI extension, LSP diagnostic dedupe, ESC/autocomplete behavior, recursive Claude Code slash discovery, eval timeout heartbeat semantics, Windows Terminal repaint handling, and @ file completion maxResults behavior.\\n- Kept release-tracking data as sibling attributes rather than under adapterMetadata.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' "${args.issueNumber}" "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 863;
  const branchName = inputs?.branchName ?? 'agent/issue-863';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  await ctx.task(setupBranchTask, { branchName, baseBranch });
  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementGraphUpdateTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyGraphUpdateTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['branch', 'context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve OMP 15.7.6 issue #863 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['branch', 'context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked OMP 15.7.6 in unique additive Atlas graph records.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
