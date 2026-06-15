/**
 * @process repo/issue-541-pi-0-77-0-graph-update
 * @description Assimilate Pi 0.77.0 release details through issue-numbered Atlas graph YAML additions only.
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

const readContextTask = defineTask('issue-541.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release, process references, and Pi graph context',
  labels: ['issue-541', 'pi', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- Pi 0.77.0 release ---\\n"',
      'gh release view v0.77.0 --repo earendil-works/pi --json name,tagName,publishedAt,url,body || true',
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimilat|verify|knowledge-graph" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- Pi graph and catalog surface ---\\n"',
      'rg -n "Pi|pi-coding-agent|agent:pi|0\\\\.76\\\\.0|0\\\\.77\\\\.0|exclude-tools|device-code|streamingBehavior|session_shutdown|promptGuidelines|promptExtraFlags|getAllTools" packages/atlas/graph packages/agent-catalog/src -g "*.yaml" -g "*.ts" -g "*.md" | head -900',
      'printf "\\n--- Issue-numbered file policy ---\\n"',
      'printf "%s\\n" "Create only new atlas graph YAML files whose filenames include issue-541; do not modify existing version files."',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-541.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Pi 0.77.0 issue-numbered graph additions',
  labels: ['issue-541', 'pi', 'implementation'],
  agent: {
    name: 'pi-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add issue-numbered Atlas graph YAML records for the Pi 0.77.0 release without modifying shared version files.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #541 and Pi 0.77.0.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML patterns.',
        'Only create new atlas graph YAML files whose filenames include issue-541.',
        'Do not modify packages/atlas/graph/agent-stack/versions/pi-current.yaml or packages/atlas/graph/agent-stack/agent-versions/pi-ge-0-75-5.yaml.',
        'Represent the release additions additively: --exclude-tools / -xt launch metadata, Codex subscription device-code auth, InputEvent.streamingBehavior, SIGTERM/SIGHUP session_shutdown cleanup, and pi.getAllTools() promptGuidelines exposure.',
        'Use a new EvidenceSource id tied to issue #541 and reference the existing Pi AgentVersion id.',
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

const verifyGraphUpdateTask = defineTask('issue-541.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Pi 0.77.0 issue-numbered graph update',
  labels: ['issue-541', 'pi', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/agent-stack/agent-versions/pi-issue-541.yaml',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/pi-issue-541.yaml',
      '! git diff --name-only -- packages/atlas/graph/agent-stack/versions/pi-current.yaml packages/atlas/graph/agent-stack/agent-versions/pi-ge-0-75-5.yaml | grep .',
      'rg -n "issue #541|issue-541|0.77.0|--exclude-tools|-xt|device-code|streamingBehavior|session_shutdown|promptGuidelines|getAllTools" packages/atlas/graph/agent-stack/agent-versions/pi-issue-541.yaml packages/atlas/graph/catalog-meta/evidence-sources/pi-issue-541.yaml',
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

const readArtifactsTask = defineTask('issue-541.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Pi issue #541 artifacts for review',
  labels: ['issue-541', 'pi', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/agent-versions/pi-issue-541.yaml packages/atlas/graph/catalog-meta/evidence-sources/pi-issue-541.yaml .a5c/processes/issue-541-pi-0-77-0-graph-update.js .a5c/processes/issue-541-pi-0-77-0-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-541.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Pi 0.77.0 graph update against issue spec',
  labels: ['issue-541', 'pi', 'review'],
  agent: {
    name: 'pi-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #541 requirements to the final artifacts.',
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

const publishTask = defineTask('issue-541.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-541', 'pi', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/agent-versions/pi-issue-541.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/pi-issue-541.yaml',
      'git add -f .a5c/processes/issue-541-pi-0-77-0-graph-update.js .a5c/processes/issue-541-pi-0-77-0-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(graph): add Pi 0.77.0 issue 541 records"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Pi 0.77.0 issue 541 graph records" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Pi 0.77.0 graph tracking for issue #%s.\\n\\n- Added issue-numbered Atlas graph YAML records for Pi 0.77.0 release evidence and additive release metadata.\\n- Kept shared Pi version files unchanged to avoid conflicts with concurrent PRs.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' "${args.issueNumber}" "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 541;
  const branchName = inputs?.branchName ?? 'graph-update/541';
  const baseBranch = inputs?.baseBranch ?? 'staging';

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
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve Pi 0.77.0 issue #541 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Pi 0.77.0 in issue-numbered Atlas graph records.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
