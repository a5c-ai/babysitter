/**
 * @process repo/issue-438-claude-code-2-1-152-assimilation
 * @description Assimilate Claude Code 2.1.152 release details into the Atlas graph and agent catalog checks.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-438.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, process references, and Claude Code graph context',
  labels: ['issue-438', 'claude-code', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimilat|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.md" | head -240',
      'printf "\\n--- Claude Code release graph surface ---\\n"',
      'rg -n "Claude Code|claude-code|2\\\\.1\\\\.152|MessageDisplay|reloadSkills|sessionTitle|disallowed-tools|pluginSuggestionMarketplaces|fallback-model|auto mode|marketplace remove|code-review --fix" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts" -g "*.json" -g "*.md" | head -700',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementAssimilationTask = defineTask('issue-438.implement-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude Code 2.1.152 assimilation',
  labels: ['issue-438', 'claude-code', 'implementation'],
  agent: {
    name: 'claude-code-release-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Implement the missing Claude Code 2.1.152 graph and catalog details in the current repository.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #438 and the Claude Code 2.1.152 release surface.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML patterns.',
        'Represent release features in structured surfaces where the graph already has an appropriate node kind: hook surfaces, interaction primitives, frontmatter fields, platform plugin metadata, permission mode, version evidence, and targeted catalog tests.',
        'Do not invent broad schema changes unless verification proves they are required.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyAssimilationTask = defineTask('issue-438.verify-assimilation', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Claude Code 2.1.152 graph assimilation',
  labels: ['issue-438', 'claude-code', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "currentVersion: \\"2.1.152\\"|releaseNotesUrl: \\"https://github.com/anthropics/claude-code/releases/tag/v2.1.152\\"" packages/atlas/graph/agent-stack/versions/claude-code-1-x.yaml',
      'rg -n "MessageDisplay|reloadSkills|sessionTitle|disallowed-tools|pluginSuggestionMarketplaces|--scope user|--scope project|--scope local|requiresUserConsent: false" packages/atlas/graph packages/agent-catalog/src',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm test --workspace=@a5c-ai/agent-catalog -- --runInBand',
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

const readArtifactsTask = defineTask('issue-438.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Claude Code artifacts for review',
  labels: ['issue-438', 'claude-code', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/claude-code-1-x.yaml packages/atlas/graph/agent-stack/runtime-impls/claude-code-runtime-1-x.yaml packages/atlas/graph/agent-stack/platform-impls/claude-code-platform-1-x.yaml packages/atlas/graph/agent-stack/interaction-primitives/claude-code-slash-commands-extended.yaml packages/atlas/graph/channels-hooks/hook-surfaces/native/hook-surfaces-claude-code.yaml packages/atlas/graph/extensions/frontmatter-fields/claude-code-skill-fields.yaml packages/atlas/graph/lifecycle/permission-modes/auto.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/atlas-bridge.ts packages/agent-catalog/src/catalog.test.ts .a5c/processes/issue-438-claude-code-2-1-152-assimilation.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewAssimilationTask = defineTask('issue-438.review-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Claude Code 2.1.152 assimilation against issue spec',
  labels: ['issue-438', 'claude-code', 'review'],
  agent: {
    name: 'claude-code-release-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #438 requirements to the final artifacts.',
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
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-438.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-438', 'claude-code', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/claude-code-1-x.yaml packages/atlas/graph/agent-stack/runtime-impls/claude-code-runtime-1-x.yaml packages/atlas/graph/agent-stack/platform-impls/claude-code-platform-1-x.yaml packages/atlas/graph/agent-stack/interaction-primitives/claude-code-slash-commands-extended.yaml packages/atlas/graph/channels-hooks/hook-surfaces/native/hook-surfaces-claude-code.yaml packages/atlas/graph/extensions/frontmatter-fields/claude-code-skill-fields.yaml packages/atlas/graph/lifecycle/permission-modes/auto.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/atlas-bridge.ts packages/agent-catalog/src/catalog.test.ts',
      'git add -f .a5c/processes/issue-438-claude-code-2-1-152-assimilation.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Claude Code 2.1.152"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Claude Code 2.1.152 release" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Claude Code 2.1.152 upstream release.\\n\\n- Confirmed the version record points at 2.1.152 and official release evidence.\\n- Modeled the release-specific hook, skill/frontmatter, plugin marketplace, fallback-model, and auto-mode semantics on the graph surfaces where applicable.\\n- Added catalog coverage for the structured release details.\\n- Ran metadata verification, Atlas build, agent-catalog tests, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 438;
  const branchName = inputs?.branchName ?? 'agent/issue-438';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementAssimilationTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyAssimilationTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewAssimilationTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve Claude Code 2.1.152 assimilation.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Claude Code 2.1.152 in Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
