/**
 * @process repo/issue-860-openai-node-6-40-0-graph-update
 * @description Add issue-scoped OpenAI Node SDK 6.40.0 Atlas graph patch files without editing shared YAML.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-860.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release notes, and Codex SDK graph context',
  labels: ['issue-860', 'openai-node', 'codex-sdk', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- OpenAI Node SDK release ---\\n"',
      `gh api repos/openai/openai-node/releases/tags/v${args.targetVersion} --jq '{tag_name,published_at,html_url,body}'`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|graph-update|patch: true|releaseTracking|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- Codex SDK graph surface ---\\n"',
      'rg -n "codex-sdk|openai-node|OpenAI Node SDK|6\\\\.40\\\\.0|additional_tools|ActionSearch|workload identity|migrate|patch: true|releaseTracking|adapterMetadata" packages/atlas/graph packages/atlas/src -g "*.yaml" -g "*.ts" -g "*.md" | head -1000',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphPatchTask = defineTask('issue-860.implement-graph-patch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement issue-scoped OpenAI Node SDK 6.40.0 graph patch',
  labels: ['issue-860', 'openai-node', 'codex-sdk', 'implementation'],
  agent: {
    name: 'codex-sdk-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add issue-scoped Atlas graph patch YAML for OpenAI Node SDK 6.40.0.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Preserve unrelated local worktree changes.',
        'Create only new Atlas graph YAML files for this issue. Do not edit existing shared YAML files.',
        'Place new agent-version patch files in packages/atlas/graph/agent-stack/agent-versions/.',
        'Place new evidence sources in packages/atlas/graph/catalog-meta/evidence-sources/.',
        'Use unique filenames named after the agent and version: codex-sdk-6-40-0-update.yaml in agent-versions and openai-node-6-40-0-update.yaml in evidence-sources.',
        'Use patch: true for the AgentVersion record so it augments agentVersion:codex-sdk:6-40-0 instead of duplicating it.',
        'Do not nest release-tracking data under adapterMetadata. Use sibling attributes such as releaseTracking, responseShapeUpdates, auditLogUpdates, and removedCliSurfaces.',
        'Record workload identity in audit logs, Responses additional_tools item support, ActionSearch.query optionality, removed migrate CLI, and unchanged package/install method.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyGraphPatchTask = defineTask('issue-860.verify-graph-patch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify issue-scoped OpenAI Node SDK graph patch',
  labels: ['issue-860', 'openai-node', 'codex-sdk', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --name-only origin/staging...HEAD > /tmp/issue-860-files.txt',
      'if grep -E "^packages/atlas/graph/.*\\.ya?ml$" /tmp/issue-860-files.txt | grep -Ev "^packages/atlas/graph/(agent-stack/agent-versions/codex-sdk-6-40-0-update.yaml|catalog-meta/evidence-sources/openai-node-6-40-0-update.yaml)$"; then echo "Only issue-scoped additive graph YAML files may change" >&2; exit 1; fi',
      'test -f packages/atlas/graph/agent-stack/agent-versions/codex-sdk-6-40-0-update.yaml',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/openai-node-6-40-0-update.yaml',
      'rg -n "id: agentVersion:codex-sdk:6-40-0|patch: true|releaseTracking:|responseShapeUpdates:|auditLogUpdates:|removedCliSurfaces:|additional_tools|ActionSearch\\.query|workload identity|migrate|install:npm" packages/atlas/graph/agent-stack/agent-versions/codex-sdk-6-40-0-update.yaml',
      'rg -n "evidence:openai-node-6-40-0-update-release|https://github.com/openai/openai-node/releases/tag/v6.40.0|additional_tools|ActionSearch\\.query|workload identity|migrate CLI" packages/atlas/graph/catalog-meta/evidence-sources/openai-node-6-40-0-update.yaml',
      'if rg -n "adapterMetadata.*release|adapterMetadata:" packages/atlas/graph/agent-stack/agent-versions/codex-sdk-6-40-0-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/openai-node-6-40-0-update.yaml; then echo "New release-tracking data must not be nested under adapterMetadata" >&2; exit 1; fi',
      'git diff --check',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-860.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final issue 860 graph diff',
  labels: ['issue-860', 'openai-node', 'codex-sdk', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/agent-versions/codex-sdk-6-40-0-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/openai-node-6-40-0-update.yaml .a5c/processes/issue-860-openai-node-6-40-0-graph-update.js .a5c/processes/issue-860-openai-node-6-40-0-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewGraphPatchTask = defineTask('issue-860.review-graph-patch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review OpenAI Node SDK graph patch against spec',
  labels: ['issue-860', 'openai-node', 'codex-sdk', 'review'],
  agent: {
    name: 'codex-sdk-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #860 requirements to the final artifacts.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.verificationStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Verify that Atlas graph YAML changes are new additive files only, use the requested directories, and do not put release-tracking fields under adapterMetadata.',
        'Return JSON: { approved: boolean, findings: string[], residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-860.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-860', 'openai-node', 'codex-sdk', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/agent-versions/codex-sdk-6-40-0-update.yaml packages/atlas/graph/catalog-meta/evidence-sources/openai-node-6-40-0-update.yaml',
      'git add -f .a5c/processes/issue-860-openai-node-6-40-0-graph-update.js .a5c/processes/issue-860-openai-node-6-40-0-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): add Codex SDK 6.40.0 patch"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Add Codex SDK 6.40.0 graph patch" --body "Closes #${args.issueNumber}\\n\\nAdds issue-scoped Atlas graph patch files for OpenAI Node SDK ${args.targetVersion}.")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Added issue-scoped OpenAI Node SDK %s graph patch files.\\n\\n- Created new unique YAML files under agent-versions and evidence-sources.\\n- Recorded workload identity audit logs, Responses additional_tools, optional ActionSearch.query, removed migrate CLI, and unchanged npm package/install method.\\n- Kept release-tracking fields as sibling attributes, not under adapterMetadata.\\n- Left existing shared YAML files untouched.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 860;
  const targetVersion = inputs?.targetVersion ?? '6.40.0';
  const branchName = inputs?.branchName ?? 'agent/issue-860';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementGraphPatchTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyGraphPatchTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewGraphPatchTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
    verificationStdout: verification?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve the OpenAI Node SDK 6.40.0 graph patch.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, targetVersion, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Added issue-scoped OpenAI Node SDK 6.40.0 graph patch files.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
