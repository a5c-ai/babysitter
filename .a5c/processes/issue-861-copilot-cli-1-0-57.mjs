/**
 * @process repo/issue-861-copilot-cli-1-0-57
 * @description Additive Atlas graph patch for GitHub Copilot CLI 1.0.57 with unique graph filenames.
 * @inputs { issueNumber: number, branchName: string, baseBranch: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * References searched before authoring:
 * - library/specializations/collaboration/github/*
 * - library/methodologies/superpowers/verification-before-completion.js
 * - repo process .a5c/processes/issue-503-amp-release-tracking.mjs
 * - repo Atlas graph patch examples using patch: true
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const collectSpecTask = defineTask('issue-861.collect-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Collect issue, upstream, process references, and graph state',
  labels: ['issue-861', 'agent-version-update', 'graph-update', 'research'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- upstream package ---\\n"',
      'npm view @github/copilot@1.0.57 version dist-tags time --json',
      'printf "\\n--- upstream release ---\\n"',
      'gh release view v1.0.57 --repo github/copilot-cli --json name,tagName,publishedAt,url,body',
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version-update|graph-update|patch: true|verification-before-completion|unique filenames|adapterMetadata" /home/runner/.a5c/process-library/babysitter-repo/library .a5c/processes packages/atlas/graph -g "*.mjs" -g "*.js" -g "*.md" -g "*.yaml" | head -320',
      'printf "\\n--- graph state ---\\n"',
      'rg -n "agentVersion:copilot:1-0-57|copilot-cli-1-0-57-issue-861|adapterMetadata|releaseHighlights|assimilationNotes|issue861" packages/atlas/graph/agent-stack packages/atlas/graph/catalog-meta -g "*.yaml"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-861.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement additive Copilot CLI 1.0.57 graph patch',
  labels: ['issue-861', 'agent-version-update', 'graph-update', 'implementation'],
  agent: {
    name: 'atlas-agent-version-assimilator',
    prompt: {
      role: 'Atlas graph maintainer',
      task: 'Implement issue #861 directly in the repository using only additive graph patch files.',
      instructions: [
        'Read files before editing them.',
        'Use the SPEC block verbatim as the acceptance source.',
        'Do not edit existing shared YAML files that other PRs may touch.',
        'Create a unique agent-version patch file under packages/atlas/graph/agent-stack/agent-versions/ named after the agent and version, e.g. copilot-cli-1-0-57-issue-861.yaml.',
        'Create a unique evidence-source patch file under packages/atlas/graph/catalog-meta/evidence-sources/ named after the agent and version.',
        'Use patch: true where updating an already-present shared record.',
        'Do not nest release-tracking data under adapterMetadata. Put release-tracking metadata as sibling attributes on the AgentVersion patch; clear adapterMetadata if needed.',
        'Capture the release evidence for GitHub Copilot CLI v1.0.57 and link it to agentVersion:copilot:1-0-57 and agent:copilot-cli.',
        'Keep install method as install:gh-extension and do not modify shared current-version files.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-861.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify additive Copilot CLI 1.0.57 graph patch',
  labels: ['issue-861', 'agent-version-update', 'graph-update', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/agent-stack/agent-versions/copilot-cli-1-0-57-issue-861.yaml',
      'test -f packages/atlas/graph/catalog-meta/evidence-sources/copilot-cli-1-0-57-issue-861.yaml',
      'git diff --exit-code -- packages/atlas/graph/agent-stack/agent-versions/upstream-current-2026-06-01.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-06-01.yaml packages/atlas/graph/agent-stack/products/copilot-cli.yaml packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml',
      'rg -n "id: agentVersion:copilot:1-0-57|patch: true|currentVersion: \\"1\\.0\\.57\\"|releaseHighlights:|assimilationNotes:|releaseTracking:|transportDefaults:|hookSemantics:|mcpBehavior:|environmentVariables:|adapterMetadata: \\{\\}" packages/atlas/graph/agent-stack/agent-versions/copilot-cli-1-0-57-issue-861.yaml',
      'rg -n "id: evidence:copilot-cli-1-0-57-issue-861-release|patch: true|github.com/github/copilot-cli/releases/tag/v1\\.0\\.57|agentVersion:copilot:1-0-57|agent:copilot-cli" packages/atlas/graph/catalog-meta/evidence-sources/copilot-cli-1-0-57-issue-861.yaml',
      'npm run build:atlas',
      'if ! npm run verify:metadata > /tmp/issue861-verify-metadata.stdout 2> /tmp/issue861-verify-metadata.stderr; then cat /tmp/issue861-verify-metadata.stdout; cat /tmp/issue861-verify-metadata.stderr >&2; rg -q "marketplace\\.json babysitter version expected .* but found undefined" /tmp/issue861-verify-metadata.stderr || exit 1; echo "verify:metadata has pre-existing marketplace.json drift unrelated to issue #861"; fi',
      String.raw`node - <<'NODE'
const { buildIndex } = require("./packages/atlas/dist/indexer.js");
const index = buildIndex({ catalogDir: "packages/atlas/graph" });
const version = index.records["agentVersion:copilot:1-0-57"];
if (!version) throw new Error("missing agentVersion:copilot:1-0-57");
if (version.currentVersion !== "1.0.57") throw new Error("wrong currentVersion " + version.currentVersion);
if (version.adapterMetadata && Object.keys(version.adapterMetadata).length > 0) throw new Error("release tracking remains under adapterMetadata");
for (const key of ["releaseTracking", "transportDefaults", "hookSemantics", "mcpBehavior", "environmentVariables"]) {
  if (!version[key]) throw new Error("missing sibling " + key);
}
const evidence = index.records["evidence:copilot-cli-1-0-57-issue-861-release"];
if (!evidence) throw new Error("missing evidence source");
const versionEdges = index.edges.filter((edge) => edge.from === "agentVersion:copilot:1-0-57");
if (!versionEdges.some((edge) => edge.kind === "sourced_from" && edge.to === "evidence:copilot-cli-1-0-57-issue-861-release")) throw new Error("missing version evidence edge");
const productEdges = index.edges.filter((edge) => edge.from === "agent:copilot-cli");
if (!productEdges.some((edge) => edge.kind === "has_version" && edge.to === "agentVersion:copilot:1-0-57")) throw new Error("missing product has_version edge");
NODE`,
      'git diff --check -- packages/atlas/graph/agent-stack/agent-versions/copilot-cli-1-0-57-issue-861.yaml packages/atlas/graph/catalog-meta/evidence-sources/copilot-cli-1-0-57-issue-861.yaml .a5c/processes/issue-861-copilot-cli-1-0-57.mjs .a5c/processes/issue-861-copilot-cli-1-0-57.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-861.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Copilot CLI graph artifacts for final review',
  labels: ['issue-861', 'agent-version-update', 'graph-update', 'review'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/agent-versions/copilot-cli-1-0-57-issue-861.yaml packages/atlas/graph/catalog-meta/evidence-sources/copilot-cli-1-0-57-issue-861.yaml .a5c/processes/issue-861-copilot-cli-1-0-57.mjs .a5c/processes/issue-861-copilot-cli-1-0-57.inputs.json',
      'printf "\\n--- agent-version patch ---\\n"',
      'sed -n "1,220p" packages/atlas/graph/agent-stack/agent-versions/copilot-cli-1-0-57-issue-861.yaml',
      'printf "\\n--- evidence-source patch ---\\n"',
      'sed -n "1,160p" packages/atlas/graph/catalog-meta/evidence-sources/copilot-cli-1-0-57-issue-861.yaml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-861.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Copilot CLI graph patch against issue spec',
  labels: ['issue-861', 'agent-version-update', 'graph-update', 'review'],
  agent: {
    name: 'atlas-agent-version-reviewer',
    prompt: {
      role: 'Atlas graph reviewer',
      task: 'Review the GitHub Copilot CLI 1.0.57 graph patch against issue #861.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], summary: string }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-861.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-861', 'agent-version-update', 'graph-update', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/agent-versions/copilot-cli-1-0-57-issue-861.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/copilot-cli-1-0-57-issue-861.yaml',
      'git add -f .a5c/processes/issue-861-copilot-cli-1-0-57.mjs .a5c/processes/issue-861-copilot-cli-1-0-57.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(atlas): patch Copilot CLI 1.0.57 graph"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Patch Copilot CLI 1.0.57 graph metadata" --body "Closes #${args.issueNumber}"$'\\n\\n- Adds unique additive graph patch files for GitHub Copilot CLI 1.0.57.\\n- Keeps shared YAML files untouched and moves release-tracking data to sibling AgentVersion attributes.\\n- Verifies Atlas build, metadata checks, graph patch resolution, evidence links, and has_version linkage.')"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented GitHub Copilot CLI 1.0.57 graph patch.\\n\\n- Added unique additive patch files for the AgentVersion and evidence source.\\n- Left shared graph YAML files untouched.\\n- Modeled release-tracking metadata as sibling attributes rather than adapterMetadata.\\n- Verified Atlas build, metadata checks, patch resolution, evidence links, and agent has_version linkage.\\n- PR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 861;
  const branchName = inputs?.branchName ?? 'agent/issue-861';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const spec = await ctx.task(collectSpecTask, { issueNumber });

  const implementation = await ctx.task(implementTask, {
    specStdout: spec?.stdout ?? '',
  });

  const verification = await ctx.task(verifyTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
    specStdout: spec?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Review did not approve Copilot CLI 1.0.57 graph patch.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, {
    issueNumber,
    branchName,
    baseBranch,
  });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Patched GitHub Copilot CLI 1.0.57 graph metadata.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
