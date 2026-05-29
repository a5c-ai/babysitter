/**
 * @process repo/issue-544-amp-graph-update
 * @description Add issue-scoped Atlas graph evidence for Amp 0.0.1780032159-g3925ab without modifying shared version files.
 *
 * References searched before authoring:
 * - library/specializations/meta/atlas/README.md
 * - library/specializations/meta/atlas/claim-coverage-audit.cjs
 * - library/specializations/meta/atlas/graph-validator-sweep.cjs
 * - .a5c/processes/issue-503-amp-release-tracking.mjs
 * - /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared/completeness-gate.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/collaboration/github/*
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectContextTask = defineTask('issue-544.collect-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Collect issue, PR, npm, and graph context',
  labels: ['issue-544', 'agent-version-update', 'graph-update', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      `npm view @ampcode/cli@${args.targetVersion} version dist.tarball --json`,
      `test "$(npm view @ampcode/cli@${args.targetVersion} version)" = "${args.targetVersion}"`,
      `rg -n "${args.previousVersion}|${args.targetVersion}|@ampcode/cli|evidence:amp-0-0-1780032159-g3925ab-release" packages/atlas/graph/agent-stack/versions/amp-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-29.yaml`,
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

const authorClaimTask = defineTask('issue-544.author-claim', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Author issue-scoped Amp release claim',
  labels: ['issue-544', 'agent-version-update', 'graph-update', 'implementation'],
  shell: {
    command: [
      'set -euo pipefail',
      `test ! -e ${args.claimPath}`,
      `cat > ${args.claimPath} <<'YAML'`,
      'nodeKind: Claim',
      'id: claim:amp-issue-544-release-assimilation',
      'attributes:',
      '  claimId: amp-issue-544-release-assimilation',
      '  subjectKind: AgentVersion',
      '  subjectId: agent-version:amp@current',
      '  attribute: releaseAssimilation',
      '  value: "0.0.1780032159-g3925ab:upstream-release-tracked"',
      '  statement: "Issue #544 tracks @ampcode/cli 0.0.1780032159-g3925ab as the current Amp CLI graph release, using npm package evidence and preserving unchanged install metadata because no public Amp changelog or GitHub release note was found."',
      '  confidence: high',
      '  provenanceKind: observation',
      '  evidenceStrength: strong',
      '  status: accepted',
      '  evidenceSourceIds:',
      '    - evidence:amp-0-0-1780032159-g3925ab-release',
      '  claimedAt: "2026-05-29T12:00:00Z"',
      '  claimedBy: codex-babysitter-yolo',
      '  claimKind: assertion',
      '  note: "New issue-scoped graph artifact for #544; the shared Amp AgentVersion and evidence-source files were already updated on staging and are intentionally not modified here."',
      'edges:',
      '  about_subject:',
      '    - agent-version:amp@current',
      '  backed_by_evidence:',
      '    - evidence:amp-0-0-1780032159-g3925ab-release',
      '  sourced_from:',
      '    - evidence:amp-0-0-1780032159-g3925ab-release',
      'YAML',
      `test -s ${args.claimPath}`,
      `printf '%s\\n' ${args.claimPath}`,
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-544.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify issue-scoped Amp graph update',
  labels: ['issue-544', 'agent-version-update', 'graph-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      `test -f ${args.claimPath}`,
      `rg -n "claim:amp-issue-544-release-assimilation|Issue #544|${args.targetVersion}|agent-version:amp@current|evidence:amp-0-0-1780032159-g3925ab-release" ${args.claimPath}`,
      `rg -n 'currentVersion: "${args.targetVersion}"|versionRange: ">=${args.targetVersion}"|releaseNotesUrl: "https://www.npmjs.com/package/@ampcode/cli/v/${args.targetVersion}"' packages/atlas/graph/agent-stack/versions/amp-current.yaml`,
      `rg -n "id: evidence:amp-0-0-1780032159-g3925ab-release|${args.targetVersion}|@ampcode/cli" packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-29.yaml`,
      `test "$(git status --short -- packages/atlas/graph | awk '{print $2}')" = "${args.claimPath}"`,
      'npm run build:atlas',
      'npm run verify:metadata',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-544.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-544', 'agent-version-update', 'graph-update', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      `git diff --check -- ${args.claimPath} ${args.processPath} ${args.inputsPath}`,
      `git add ${args.claimPath}`,
      `git add -f ${args.processPath} ${args.inputsPath}`,
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(atlas): add Amp issue 544 release claim"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base staging --head ${args.branchName} --title "Add Amp issue 544 graph claim" --body "Closes #${args.issueNumber}"$'\\n\\n- Adds a new issue-scoped Atlas Claim file, packages/atlas/graph/catalog-meta/claims/amp-issue-544.yaml.\\n- Confirms the existing Amp AgentVersion tracks @ampcode/cli '${args.targetVersion}' with npm evidence.\\n- Leaves existing shared version/evidence files unchanged to avoid concurrent graph conflicts.\\n\\nVerification:\\n- npm run build:atlas\\n- npm run verify:metadata')"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented #544 on branch %s.\\n\\n- Added new issue-scoped Atlas graph file: %s.\\n- Confirmed staging already tracks @ampcode/cli %s in the Amp AgentVersion and release evidence.\\n- Did not modify existing shared graph version/evidence files.\\n- Verified with npm run build:atlas and npm run verify:metadata.\\n- PR: %s' '${args.branchName}' '${args.claimPath}' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 544;
  const targetVersion = inputs?.targetVersion ?? '0.0.1780032159-g3925ab';
  const previousVersion = inputs?.previousVersion ?? '0.0.1779959155-g362e01';
  const branchName = inputs?.branchName ?? 'graph-update/544';
  const claimPath = inputs?.claimPath ?? 'packages/atlas/graph/catalog-meta/claims/amp-issue-544.yaml';
  const processPath = inputs?.processPath ?? '.a5c/processes/issue-544-amp-graph-update.mjs';
  const inputsPath = inputs?.inputsPath ?? '.a5c/processes/issue-544-amp-graph-update.inputs.json';

  const context = await ctx.task(collectContextTask, {
    issueNumber,
    targetVersion,
    previousVersion,
  });
  const implementation = await ctx.task(authorClaimTask, {
    claimPath,
  });
  const verification = await ctx.task(verifyTask, {
    claimPath,
    targetVersion,
  });
  const publish = await ctx.task(publishTask, {
    issueNumber,
    targetVersion,
    branchName,
    claimPath,
    processPath,
    inputsPath,
  });

  return {
    success: true,
    issueNumber,
    branchName,
    claimPath,
    context,
    implementation,
    verification,
    publish,
    summary: `Added ${claimPath} for Amp ${targetVersion} and published the PR.`,
  };
}
