/**
 * @process repo/issue-808-pi-0-78-0-graph-update
 * @description Assimilate Pi 0.78.0 release details through versioned Atlas graph YAML additions.
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

const readContextTask = defineTask('issue-808.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release, process references, and Pi graph context',
  labels: ['issue-808', 'pi', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- Pi 0.78.0 release ---\\n"',
      'gh release view v0.78.0 --repo earendil-works/pi --json name,tagName,publishedAt,url,body',
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version|version update|graph-update|assimilat|verify|knowledge-graph" /home/runner/.a5c/process-library/babysitter-repo/library .a5c/processes -g "*.js" -g "*.mjs" -g "*.md" | head -260',
      'printf "\\n--- Pi graph surface ---\\n"',
      'rg -n "Pi|pi-coding-agent|agent:pi|0\\\\.78\\\\.0|0-78-0|--name|-n|OSC 8|file://|display name|session name|promptExtraFlags|metadataFields" packages/atlas/graph -g "*.yaml" | head -900',
      'printf "\\n--- Unique file policy ---\\n"',
      'printf "%s\\n" "Create only new Atlas graph YAML files whose filenames include pi-0-78-0 or issue-808; do not rename generic pi files."',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementGraphUpdateTask = defineTask('issue-808.implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Pi 0.78.0 versioned graph additions',
  labels: ['issue-808', 'pi', 'implementation'],
  agent: {
    name: 'pi-release-graph-assimilator',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Add versioned Atlas graph YAML records for the Pi 0.78.0 release.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #808 and Pi 0.78.0.',
        'Preserve unrelated local worktree changes.',
        'Use existing Atlas graph YAML patterns.',
        'Use unique filenames that include pi-0-78-0 or issue-808.',
        'Represent --name / -n as launchBehavior prompt/session naming flags.',
        'Represent OSC 8 file:// hyperlinks in built-in file tool titles as terminal parser/snapshot tolerance metadata.',
        'Represent startup session display names in Pi session metadata.',
        'Add dedicated release evidence for issue #808.',
        'Do not modify shared current Pi version files unless verification proves it is required.',
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

const verifyGraphUpdateTask = defineTask('issue-808.verify-graph-update', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Pi 0.78.0 versioned graph update',
  labels: ['issue-808', 'pi', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/agent-stack/agent-versions/pi-0-78-0-issue-808.yaml',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/pi-0-78-0-issue-808.yaml',
      'rg -n "agentVersion:pi:0-78-0|0.78.0|--name|-n|OSC 8|file://|startup|display name|sessionName|session display name|promptExtraFlags|terminalParser|issue #808|issue-808" packages/atlas/graph/agent-stack/agent-versions/pi-0-78-0-issue-808.yaml packages/atlas/graph/catalog-meta/evidence-sources/pi-0-78-0-issue-808.yaml',
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

const readArtifactsTask = defineTask('issue-808.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Pi 0.78.0 artifacts for review',
  labels: ['issue-808', 'pi', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/agent-versions/pi-0-78-0-issue-808.yaml packages/atlas/graph/catalog-meta/evidence-sources/pi-0-78-0-issue-808.yaml .a5c/processes/issue-808-pi-0-78-0-graph-update.js .a5c/processes/issue-808-pi-0-78-0-graph-update.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-808.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Pi 0.78.0 graph update against issue spec',
  labels: ['issue-808', 'pi', 'review'],
  agent: {
    name: 'pi-release-graph-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Compare issue #808 requirements to the final artifacts.',
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

const publishTask = defineTask('issue-808.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-808', 'pi', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/agent-versions/pi-0-78-0-issue-808.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/pi-0-78-0-issue-808.yaml',
      'git add -f .a5c/processes/issue-808-pi-0-78-0-graph-update.js .a5c/processes/issue-808-pi-0-78-0-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then git commit -m "feat(graph): add Pi 0.78.0 issue 808 records"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Pi 0.78.0 issue 808 graph records" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Pi 0.78.0 graph tracking for issue #%s.\\n\\n- Added versioned Atlas graph YAML records for Pi 0.78.0 release evidence and additive release metadata.\\n- Modeled --name / -n startup session naming, OSC 8 file:// hyperlink parser tolerance, and session display-name metadata.\\n- Ran metadata verification, Atlas build, and diff checks.\\n\\nPR: %s' "${args.issueNumber}" "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 808;
  const branchName = inputs?.branchName ?? 'agent/issue-808';
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
      summary: review?.summary ?? 'Final review did not approve Pi 0.78.0 issue #808 graph update.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Pi 0.78.0 in versioned Atlas graph records.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
