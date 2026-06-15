/**
 * @process repo/issue-542-omp-15-5-11-graph-update
 * @description Add issue-scoped Atlas graph evidence for the OMP 15.5.11 release without editing shared version YAML.
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

const readContextTask = defineTask('issue-542.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release, process references, and OMP graph context',
  labels: ['issue-542', 'omp', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- OMP v15.5.11 release ---\\n"',
      'gh release view v15.5.11 --repo can1357/oh-my-pi --json name,tagName,publishedAt,url,body',
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimilat|knowledge-graph|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- OMP graph and catalog surface ---\\n"',
      'rg -n "Oh-My-Pi|OMP|omp|15\\\\.5\\\\.11|supportsMidConversationSystem|mid-conversation|SessionStorage|SqlSessionStorage|RedisSessionStorage|hashline|stale-snapshot|Claude Opus 4\\\\.8|adaptive-thinking|xhigh|max" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts" -g "*.md" | head -1000',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-542.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement issue-scoped OMP 15.5.11 graph evidence',
  labels: ['issue-542', 'omp', 'implementation'],
  agent: {
    name: 'omp-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add issue-scoped Atlas graph YAML for the OMP 15.5.11 release.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #542 and OMP v15.5.11.',
        'Only create NEW files for Atlas graph YAML. Do not modify existing graph YAML files, especially shared current/version files.',
        'Every new Atlas graph YAML filename must include the issue number 542, for example omp-issue-542.yaml.',
        'If the branch already contains OMP 15.5.11 in shared current-version files, do not edit those files. Add issue-scoped evidence/claim YAML that records the release-specific facts and points to existing graph nodes.',
        'Model release-specific evidence for OMP 15.5.11: mid-conversation system support for eligible Anthropic Messages turns, supportsMidConversationSystem compatibility setting, Claude Opus 4.8 Bedrock Converse metadata with xhigh effort support, Opus 4.7+ five-tier adaptive effort shift to max, SQL and Redis SessionStorage backends plus package-root storage exports, write hashline snapshot headers, and sharper stale-snapshot diagnostics.',
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

const verifyGraphUpdateTask = defineTask('issue-542.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify issue-scoped OMP graph update',
  labels: ['issue-542', 'omp', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --name-only origin/staging...HEAD > /tmp/issue-542-files.txt',
      'if grep -E "^packages/atlas/graph/.*\\.ya?ml$" /tmp/issue-542-files.txt | grep -v "542"; then echo "Atlas graph YAML files must include issue number 542" >&2; exit 1; fi',
      'if grep -E "^packages/atlas/graph/agent-stack/versions/.*\\.ya?ml$" /tmp/issue-542-files.txt; then echo "Shared version YAML files must not be modified for issue 542" >&2; exit 1; fi',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/omp-issue-542.yaml',
      'rg -n "evidence:omp-issue-542-v15-5-11-release|claim:omp-issue-542-mid-conversation-system|claim:omp-issue-542-sql-session-storage|claim:omp-issue-542-redis-session-storage|claim:omp-issue-542-hashline-write-snapshot|claim:omp-issue-542-stale-snapshot-diagnostics" packages/atlas/graph/catalog-meta/evidence-sources/omp-issue-542.yaml',
      'rg -n "supportsMidConversationSystem|Claude Opus 4.8|SqlSessionStorage|RedisSessionStorage|SessionStorage|hashline|stale-snapshot|xhigh|max" packages/atlas/graph/catalog-meta/evidence-sources/omp-issue-542.yaml',
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

const readArtifactsTask = defineTask('issue-542.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed OMP issue artifacts for review',
  labels: ['issue-542', 'omp', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/catalog-meta/evidence-sources/omp-issue-542.yaml .a5c/processes/issue-542-omp-15-5-11-graph-update.js .a5c/processes/issue-542-omp-15-5-11-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphUpdateTask = defineTask('issue-542.review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review OMP 15.5.11 issue-scoped graph update against spec',
  labels: ['issue-542', 'omp', 'review'],
  agent: {
    name: 'omp-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #542 requirements to the final artifacts.',
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
        'Verify that Atlas graph YAML changes are new files only and filenames include issue number 542.',
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-542.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-542', 'omp', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/omp-issue-542.yaml',
      'git add -f .a5c/processes/issue-542-omp-15-5-11-graph-update.js .a5c/processes/issue-542-omp-15-5-11-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): add OMP issue 542 release evidence"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Add OMP 15.5.11 issue-scoped graph evidence" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Added issue-scoped OMP 15.5.11 graph evidence.\\n\\n- Created only new Atlas graph YAML with issue number 542 in the filename.\\n- Recorded release evidence and claims for mid-conversation system support, supportsMidConversationSystem, Claude Opus 4.8/effort mapping, SQL/Redis SessionStorage, hashline write snapshots, and stale-snapshot diagnostics.\\n- Left shared current/version YAML files untouched on this branch.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 542;
  const branchName = inputs?.branchName ?? 'graph-update/542';
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
      summary: review?.summary ?? 'Final review did not approve the OMP 15.5.11 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Added issue-scoped OMP 15.5.11 graph evidence.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
