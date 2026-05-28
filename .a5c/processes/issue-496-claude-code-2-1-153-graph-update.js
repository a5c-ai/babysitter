/**
 * @process repo/issue-496-claude-code-2-1-153-graph-update
 * @description Assimilate Claude Code 2.1.153 release details into the Atlas graph and agent catalog checks.
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

const readContextTask = defineTask('issue-496.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, process references, and Claude Code graph context',
  labels: ['issue-496', 'claude-code', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimilat|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.md" | head -240',
      'printf "\\n--- Claude Code 2.1.153 graph surface ---\\n"',
      'rg -n "Claude Code|claude-code|2\\\\.1\\\\.153|2\\\\.1\\\\.152|skipLfs|COLUMNS|LINES|status line|strict-mcp-config|--bare|remote mode|managed MCP|allow/deny|modelPicker|thisSessionOnly|setAsDefault|slash commands|bundled skills|PR #N|MCP server and connector auth" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts" -g "*.json" -g "*.md" | head -900',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-496.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude Code 2.1.153 graph update',
  labels: ['issue-496', 'claude-code', 'implementation'],
  agent: {
    name: 'claude-code-release-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Implement the missing Claude Code 2.1.153 graph and catalog details in the current repository.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #496 and the Claude Code 2.1.153 release surface.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML and agent-catalog patterns.',
        'Update the Claude Code version record to 2.1.153 with the official release notes URL and evidence.',
        'Model release-specific details only where the graph/catalog already has an appropriate surface: plugin git/github skipLfs support, status-line COLUMNS/LINES environment relay, subagent MCP policy handling, model picker keybinding rename, slash command/bundled skill autocomplete, PR column wording, and combined MCP auth notices.',
        'Update agent-catalog only if needed to expose or verify the graph data.',
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

const verifyGraphUpdateTask = defineTask('issue-496.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Claude Code 2.1.153 graph update',
  labels: ['issue-496', 'claude-code', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "currentVersion: \\"2.1.153\\"|releaseNotesUrl: \\"https://github.com/anthropics/claude-code/releases/tag/v2.1.153\\"" packages/atlas/graph/agent-stack/versions/claude-code-1-x.yaml',
      'rg -n "skipLfs|COLUMNS|LINES|strict-mcp-config|--bare|managed MCP|modelPicker:thisSessionOnly|modelPicker:setAsDefault|bundled skills|PR #N|MCP server and connector auth" packages/atlas/graph packages/agent-catalog/src',
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

const readArtifactsTask = defineTask('issue-496.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Claude Code artifacts for review',
  labels: ['issue-496', 'claude-code', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/claude-code-1-x.yaml packages/atlas/graph/agent-stack/runtime-impls/claude-code-runtime-1-x.yaml packages/atlas/graph/agent-stack/platform-impls/claude-code-platform-1-x.yaml packages/atlas/graph/agent-stack/ui-impls/claude-code-ui-current.yaml packages/atlas/graph/agent-stack/interaction-primitives/claude-code-slash-commands-extended.yaml packages/atlas/graph/channels-hooks/hook-surfaces/native/hook-surfaces-claude-code.yaml packages/atlas/graph/extensions/frontmatter-fields/claude-code-skill-fields.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-28.yaml packages/agent-catalog/src/atlas-bridge.ts packages/agent-catalog/src/catalog.test.ts .a5c/processes/issue-496-claude-code-2-1-153-graph-update.js .a5c/processes/issue-496-inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphUpdateTask = defineTask('issue-496.review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Claude Code 2.1.153 graph update against issue spec',
  labels: ['issue-496', 'claude-code', 'review'],
  agent: {
    name: 'claude-code-release-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #496 requirements to the final artifacts.',
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

const publishTask = defineTask('issue-496.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-496', 'claude-code', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/claude-code-1-x.yaml packages/atlas/graph/agent-stack/runtime-impls/claude-code-runtime-1-x.yaml packages/atlas/graph/agent-stack/platform-impls/claude-code-platform-1-x.yaml packages/atlas/graph/agent-stack/ui-impls/claude-code-ui-current.yaml packages/atlas/graph/agent-stack/interaction-primitives/claude-code-slash-commands-extended.yaml packages/atlas/graph/channels-hooks/hook-surfaces/native/hook-surfaces-claude-code.yaml packages/atlas/graph/extensions/frontmatter-fields/claude-code-skill-fields.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-28.yaml packages/agent-catalog/src/atlas-bridge.ts packages/agent-catalog/src/catalog.test.ts 2>/dev/null || true',
      'git add -f .a5c/processes/issue-496-claude-code-2-1-153-graph-update.js .a5c/processes/issue-496-inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Claude Code 2.1.153"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Claude Code 2.1.153 release" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Claude Code 2.1.153 upstream release.\\n\\n- Updated Atlas graph version metadata and official release evidence for 2.1.153.\\n- Modeled the release-specific plugin, status-line, MCP policy, keybinding, autocomplete, PR display, and auth notice details on existing graph/catalog surfaces where applicable.\\n- Ran metadata verification, Atlas build, agent-catalog tests, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 496;
  const branchName = inputs?.branchName ?? 'agent/issue-496';
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
      summary: review?.summary ?? 'Final review did not approve Claude Code 2.1.153 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Claude Code 2.1.153 in Atlas graph.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
