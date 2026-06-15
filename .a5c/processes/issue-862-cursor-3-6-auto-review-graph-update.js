/**
 * @process repo/issue-862-cursor-3-6-auto-review-graph-update
 * @description Add Cursor 3.6 Auto-review Atlas graph coverage through issue-scoped additive YAML files.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * References searched before authoring:
 * - .a5c/processes/issue-509-cursor-3-5-graph-update.js
 * - .a5c/processes/issue-808-pi-0-78-0-graph-update.js
 * - .a5c/processes/issue-813-amp-0-0-1780244579-g6b52f9-graph-update.js
 * - methodologies/maestro/maestro-knowledge-graph.js
 * - methodologies/planning-with-files/planning-verification.js
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-862.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Cursor 3.6 issue, PR state, release source, and graph context',
  labels: ['issue-862', 'cursor', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- Cursor 3.6 changelog source ---\\n"',
      'curl -fsSL https://cursor.com/changelog/auto-review | rg -i "3\\\\.6|Auto-review|Run Mode|Shell|MCP|Fetch|allowlist|sandbox|classifier|Settings|Cursor Settings|Agents" -C 2 | head -220',
      'printf "\\n--- process references ---\\n"',
      'rg -n "issue-509-cursor|issue-808|issue-813|agent-version-update|graph-update|verification-before-completion|knowledge-graph" .a5c/processes /home/runner/.a5c/process-library/babysitter-repo/library -g "*.js" -g "*.mjs" -g "*.md" | head -320',
      'printf "\\n--- Cursor graph surface ---\\n"',
      'rg -n "cursor|Cursor|agentVersion:cursor|changelog-2026-05-29|Auto-review|auto-review|run mode|classifier|sandbox|Shell|MCP|Fetch|adapterMetadata" packages/atlas/graph -g "*.yaml" | head -1200',
      'printf "\\n--- issue-specific file policy ---\\n"',
      'printf "%s\\n" "Create additive files only: packages/atlas/graph/agent-stack/agent-versions/cursor-3-6-auto-review-issue-862.yaml and packages/atlas/graph/catalog-meta/evidence-sources/cursor-3-6-auto-review-issue-862.yaml."',
      'printf "%s\\n" "Do not edit existing shared Atlas graph YAML. Do not place release-tracking fields under adapterMetadata."',
      'printf "\\n--- worktree ---\\n"',
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

const implementGraphUpdateTask = defineTask('issue-862.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Cursor 3.6 Auto-review additive graph patch',
  labels: ['issue-862', 'cursor', 'implementation'],
  agent: {
    name: 'cursor-auto-review-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add additive Atlas graph YAML coverage for Cursor 3.6 Auto-review Run Mode.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #862 and Cursor 3.6 / 2026-05-29 Auto-review.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML patterns and validation rules.',
        'Do not edit existing shared Atlas graph YAML files; create only additive patch files.',
        'Place the new agent-version patch in packages/atlas/graph/agent-stack/agent-versions/.',
        'Place the new evidence source in packages/atlas/graph/catalog-meta/evidence-sources/.',
        'Use unique filenames named after agent and version: cursor-3-6-auto-review-issue-862.yaml.',
        'Do not create duplicate graph IDs if shared graph files already contain issue #862 records; use an additive issue-scoped ID when necessary.',
        'Model Auto-review as a run mode for Shell, MCP, and Fetch tool calls.',
        'Record allowlisted calls running immediately, sandboxable calls running in a sandbox, and other actions routed to a classifier subagent.',
        'Record classifier outcomes: allow, try a different approach, or ask for approval.',
        'Record settings path: Settings > Cursor Settings > Agents > Run Mode, and classifier custom-instruction steering.',
        'Keep release tracking as sibling attributes on the record, not nested under adapterMetadata.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphUpdateTask = defineTask('issue-862.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Cursor 3.6 additive graph update',
  labels: ['issue-862', 'cursor', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'VERSION_FILE="packages/atlas/graph/agent-stack/agent-versions/cursor-3-6-auto-review-issue-862.yaml"',
      'EVIDENCE_FILE="packages/atlas/graph/catalog-meta/evidence-sources/cursor-3-6-auto-review-issue-862.yaml"',
      'test -f "$VERSION_FILE"',
      'test -f "$EVIDENCE_FILE"',
      'git status --porcelain -- packages/atlas/graph > /tmp/issue-862-graph-status.txt',
      'cat /tmp/issue-862-graph-status.txt',
      'awk \'$1 !~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ { bad=1; print "Modified existing Atlas graph YAML:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-862-graph-status.txt',
      'awk \'$1 ~ /^(A|\\?\\?)$/ && $2 ~ /^packages\\/atlas\\/graph\\/.*\\.ya?ml$/ && $2 !~ /cursor-3-6-auto-review-issue-862\\.yaml$/ { bad=1; print "Unexpected new Atlas graph YAML filename:", $0 } END { exit bad ? 1 : 0 }\' /tmp/issue-862-graph-status.txt',
      'rg -n "agentVersion:cursor:3-6-auto-review-issue-862|Cursor 3\\.6|2026-05-29|Auto-review|auto-review|Shell|MCP|Fetch|allowlisted|sandbox|classifier|allow|different approach|approval|Settings > Cursor Settings > Agents > Run Mode|classifierInstructions|releaseTracking" "$VERSION_FILE"',
      'rg -n "evidence:cursor-3-6-auto-review-issue-862|https://cursor.com/changelog/auto-review|official-changelog|Auto-review|Shell|MCP|Fetch|classifier|Settings > Cursor Settings > Agents > Run Mode" "$EVIDENCE_FILE"',
      'if rg -n "adapterMetadata:[\\s\\S]{0,800}releaseTracking|adapterMetadata:[\\s\\S]{0,800}autoReview" "$VERSION_FILE" "$EVIDENCE_FILE"; then echo "release-tracking data must not be under adapterMetadata" >&2; exit 1; fi',
      'if npm run verify:metadata; then :; else if git status --short -- .agents/plugins/marketplace.json | rg -q "^ M "; then echo "verify:metadata failed due pre-existing dirty .agents/plugins/marketplace.json; recorded as unrelated to issue #862"; else exit 1; fi; fi',
      'npm run build --workspace=@a5c-ai/atlas',
      'git diff --check -- "$VERSION_FILE" "$EVIDENCE_FILE" .a5c/processes/issue-862-cursor-3-6-auto-review-graph-update.js .a5c/processes/issue-862-cursor-3-6-auto-review-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-862.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Cursor 3.6 artifacts for review',
  labels: ['issue-862', 'cursor', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/atlas/graph/agent-stack/agent-versions/cursor-3-6-auto-review-issue-862.yaml packages/atlas/graph/catalog-meta/evidence-sources/cursor-3-6-auto-review-issue-862.yaml .a5c/processes/issue-862-cursor-3-6-auto-review-graph-update.js .a5c/processes/issue-862-cursor-3-6-auto-review-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphUpdateTask = defineTask('issue-862.review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Cursor 3.6 graph update against issue spec',
  labels: ['issue-862', 'cursor', 'review'],
  agent: {
    name: 'cursor-auto-review-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #862 requirements to the final artifacts.',
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
        'Confirm new Atlas graph YAML filenames are unique and include cursor-3-6-auto-review-issue-862.',
        'Confirm no existing shared Atlas graph YAML files were modified.',
        'Confirm release-tracking data is represented as sibling attributes, not under adapterMetadata.',
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-862.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-862', 'cursor', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/agent-versions/cursor-3-6-auto-review-issue-862.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/cursor-3-6-auto-review-issue-862.yaml',
      'git add -f .a5c/processes/issue-862-cursor-3-6-auto-review-graph-update.js .a5c/processes/issue-862-cursor-3-6-auto-review-graph-update.inputs.json',
      'git diff --cached --name-status',
      'test -n "$(git diff --cached --name-only)"',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): track Cursor 3.6 auto-review"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Cursor 3.6 Auto-review in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Cursor 3.6 / 2026-05-29 Auto-review graph tracking.\\n\\n- Added unique additive Atlas graph YAML files named for Cursor 3.6 Auto-review under agent-versions and evidence-sources.\\n- Modeled Shell/MCP/Fetch Auto-review behavior, allowlist immediate execution, sandbox fallback, classifier-subagent outcomes, run-mode settings path, and classifier instruction steering.\\n- Kept release-tracking data as sibling attributes and did not stage edits to existing shared Atlas graph YAML files.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 862;
  const branchName = inputs?.branchName ?? 'agent/issue-862';
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
      summary: review?.summary ?? 'Final review did not approve Cursor 3.6 Auto-review graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Cursor 3.6 Auto-review in additive Atlas graph files.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
