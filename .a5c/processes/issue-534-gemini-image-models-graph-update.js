/**
 * @process repo/issue-534-gemini-image-models-graph-update
 * @description Verify and publish the Gemini image model Atlas graph update for issue #534.
 * @inputs { issueNumber?: number, prNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, context, structure, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/verify-work
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-534.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR, process references, and graph context',
  labels: ['issue-534', 'gemini', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- associated PR ---\\n"',
      `gh pr view ${args.prNumber} --json files,title,body,comments,headRefName,baseRefName,url`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "graph-update|model-version|Atlas graph|verify-work|verification-before-completion" /home/runner/.a5c/process-library/babysitter-repo/library .a5c/processes -g "*.js" -g "*.md" | head -260',
      'printf "\\n--- changed files against base ---\\n"',
      `git diff --name-status origin/${args.baseBranch}...HEAD`,
      'printf "\\n--- issue 534 graph records ---\\n"',
      'rg -n "issue-534|gemini-3\\.1-flash-image|gemini-3-pro-image|gemini-2\\.5-flash-image|gemini-2\\.0-flash-preview-image-generation" packages/atlas/graph -g "*.yaml"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyStructureTask = defineTask('issue-534.verify-structure', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify issue-numbered Atlas YAML structure',
  labels: ['issue-534', 'gemini', 'graph', 'structure'],
  shell: {
    command: [
      'set -euo pipefail',
      `BASE="origin/${args.baseBranch}"`,
      'git diff --name-status "$BASE"...HEAD -- packages/atlas/graph > /tmp/issue-534-atlas-name-status.txt',
      'cat /tmp/issue-534-atlas-name-status.txt',
      'test -s /tmp/issue-534-atlas-name-status.txt',
      'awk \'$1 != "A" { print "Atlas graph change is not a new file: "$0; bad=1 } END { exit bad ? 1 : 0 }\' /tmp/issue-534-atlas-name-status.txt',
      'awk \'{ path=$2; n=split(path, parts, "/"); file=parts[n]; if (file !~ /issue-534[.]yaml$/) { print "Atlas graph YAML filename lacks issue number: " path; bad=1 } } END { exit bad ? 1 : 0 }\' /tmp/issue-534-atlas-name-status.txt',
      'git diff --name-only "$BASE"...HEAD -- packages/atlas/graph | sort > /tmp/issue-534-atlas-files.txt',
      'grep -Fx "packages/atlas/graph/catalog-meta/claims/gemini-image-models-issue-534.yaml" /tmp/issue-534-atlas-files.txt',
      'grep -Fx "packages/atlas/graph/catalog-meta/evidence-sources/gemini-image-models-issue-534.yaml" /tmp/issue-534-atlas-files.txt',
      'grep -Fx "packages/atlas/graph/compute/models/gemini-3-1-flash-image-issue-534.yaml" /tmp/issue-534-atlas-files.txt',
      'grep -Fx "packages/atlas/graph/compute/models/gemini-3-pro-image-issue-534.yaml" /tmp/issue-534-atlas-files.txt',
      'grep -Fx "packages/atlas/graph/compute/models/gemini-2-5-flash-image-issue-534.yaml" /tmp/issue-534-atlas-files.txt',
      'grep -Fx "packages/atlas/graph/compute/models/gemini-2-0-flash-preview-image-generation-issue-534.yaml" /tmp/issue-534-atlas-files.txt',
      'rg -n "gemini-3\\.1-flash-image|gemini-3-pro-image|gemini-2\\.5-flash-image|gemini-2\\.0-flash-preview-image-generation|google-gemini-deprecations-issue-534|google-gemini-pricing-issue-534|google-vertex-gemini-image-models-issue-534" packages/atlas/graph/catalog-meta packages/atlas/graph/compute/models/*issue-534.yaml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyAtlasTask = defineTask('issue-534.verify-atlas', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run Atlas and repository verification',
  labels: ['issue-534', 'gemini', 'graph', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm run validate:edges --workspace=@a5c-ai/atlas',
      'npm run validate:processes',
      'git diff --check',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-534.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit process artifacts, push branch, and comment on issue',
  labels: ['issue-534', 'gemini', 'graph', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add -f .a5c/processes/issue-534-gemini-image-models-graph-update.js .a5c/processes/issue-534-gemini-image-models-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(process): add issue 534 graph verification"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Gemini image models in Atlas graph" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Verified Gemini image model and lifecycle graph tracking.\\n\\n- Confirmed PR %s on branch %s adds only new Atlas graph YAML files under issue-numbered filenames for issue #%s.\\n- Confirmed the graph records cover Gemini 3.1 Flash Image, Gemini 3 Pro Image, Gemini 2.5 Flash Image, and Gemini 2.x/2.5 lifecycle/deprecation evidence with Google/Vertex/pricing/deprecation sources.\\n- Ran metadata verification, Atlas build, Atlas edge validation, process validation, and diff checks.\\n\\nPR: %s' '${args.prNumber}' '${args.branchName}' '${args.issueNumber}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 534;
  const prNumber = inputs?.prNumber ?? 555;
  const branchName = inputs?.branchName ?? 'graph-update/534';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, {
    issueNumber,
    prNumber,
    baseBranch,
  });
  const structure = await ctx.task(verifyStructureTask, { baseBranch });
  const verification = await ctx.task(verifyAtlasTask, {});
  const publish = await ctx.task(publishTask, {
    issueNumber,
    prNumber,
    branchName,
    baseBranch,
  });

  return {
    success: true,
    context,
    structure,
    verification,
    publish,
  };
}
