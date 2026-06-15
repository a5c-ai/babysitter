/**
 * @process repo/issue-497-copilot-cli-1-0-55-7-graph-update
 * @description Finish GitHub Copilot CLI 1.0.55-7 Atlas graph update with evidence, catalog guardrail, PR, and issue comment.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string }
 *
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/gsd/quick
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-497.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, release notes, graph context, and prior PR',
  labels: ['issue-497', 'copilot-cli', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} OR #${args.issueNumber}" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- prior graph pr ---\\n"',
      'gh pr view 495 --json number,title,state,mergedAt,headRefName,baseRefName,body,comments',
      'printf "\\n--- official release notes ---\\n"',
      'gh api repos/github/copilot-cli/releases/tags/v1.0.55-5 --jq "{tag_name,body,html_url}"',
      'gh api repos/github/copilot-cli/releases/tags/v1.0.55-6 --jq "{tag_name,body,html_url}"',
      'gh api repos/github/copilot-cli/releases/tags/v1.0.55-7 --jq "{tag_name,body,html_url}"',
      'printf "\\n--- current copilot graph refs ---\\n"',
      'rg -n "copilot-cli-1-0-55-[3567]-release|agentVersion:copilot:ge-1-0-55-[37]|>=1\\\\.0\\\\.55-[37]|1\\\\.0\\\\.55-7|autopilot|exit_plan_mode|folder-backed|extensions_manage" packages/atlas/graph packages/agent-catalog/src',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-497.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Copilot CLI 1.0.55-7 graph update',
  labels: ['issue-497', 'copilot-cli', 'implementation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Update the repository for GitHub Copilot CLI 1.0.55-7 graph tracking.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Keep the stable AgentVersion node id agentVersion:copilot:ge-1-0-55-3 and all inbound graph references intact unless a full migration is performed.',
        'Model 1.0.55-7 as the concrete current version via currentVersion, upstreamReleaseTag, releaseNotesUrl, notes, and official release evidence.',
        'Do not leave AgentVersion id slugs and versionRange slugs divergent.',
        'Add official release evidence for v1.0.55-5, v1.0.55-6, and v1.0.55-7, including the issue checklist items: dedicated MCP config screen; /autopilot and /goal; cell-based renderer; per-extension logs through extensions_manage; non-git .github/extensions discovery; /statusline and /theme during execution; exit_plan_mode only in plan mode; native-binary crash fallback.',
        'Update agent-catalog tests if needed to prevent future AgentVersion id/versionRange drift.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-497.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Copilot CLI graph and catalog guardrail',
  labels: ['issue-497', 'copilot-cli', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "id: agentVersion:copilot:ge-1-0-55-3|versionRange: \\\">=1.0.55-3\\\"|currentVersion: \\\"1.0.55-7\\\"|v1.0.55-7|evidence:copilot-cli-1-0-55-7-release" packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml',
      'rg -n "evidence:copilot-cli-1-0-55-5-release|evidence:copilot-cli-1-0-55-6-release|evidence:copilot-cli-1-0-55-7-release|autopilot|/goal|extensions_manage|folder-backed|exit_plan_mode|JavaScript fallback" packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'rg -n "copilot-slash-autopilot|copilot-slash-goal|executionAllowedWhileAgentRuns" packages/atlas/graph/agent-stack/ui-impls/copilot-cli-ui-current.yaml packages/atlas/graph/agent-stack/interaction-primitives/copilot-cli-slash-commands.yaml',
      'rg -n "versionRange slug" packages/agent-catalog/src/catalog.test.ts',
      'git diff --check',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm run build --workspace=@a5c-ai/agent-catalog',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/agent-catalog/src/catalog.test.ts',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-497.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final diff',
  labels: ['issue-497', 'copilot-cli', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml packages/atlas/graph/agent-stack/ui-impls/copilot-cli-ui-current.yaml packages/atlas/graph/agent-stack/interaction-primitives/copilot-cli-slash-commands.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/catalog.test.ts',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-497.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Copilot graph update against issue spec',
  labels: ['issue-497', 'copilot-cli', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'code reviewer focused on Atlas graph correctness',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisk: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.verificationStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-497.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue',
  labels: ['issue-497', 'copilot-cli', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml packages/atlas/graph/agent-stack/ui-impls/copilot-cli-ui-current.yaml packages/atlas/graph/agent-stack/interaction-primitives/copilot-cli-slash-commands.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml packages/agent-catalog/src/catalog.test.ts',
      'git add -f .a5c/processes/issue-497-copilot-cli-1-0-55-7-graph-update.js .a5c/processes/issue-497-copilot-cli-1-0-55-7-graph-update.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "fix(atlas): track Copilot CLI 1.0.55-7 evidence"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base staging --head ${args.branchName} --title "Track GitHub Copilot CLI 1.0.55-7 graph update" --body "Closes #${args.issueNumber}\\n\\nUpdates the Atlas graph for GitHub Copilot CLI ${args.targetVersion}, adds official release evidence for v1.0.55-5 through v1.0.55-7, preserves the stable AgentVersion range identity, and adds an agent-catalog guardrail for AgentVersion id/versionRange drift.\\n\\nVerification:\\n- npm run verify:metadata\\n- npm run build --workspace=@a5c-ai/atlas\\n- npm run build --workspace=@a5c-ai/agent-catalog\\n- npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/agent-catalog/src/catalog.test.ts")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Completed Copilot CLI %s graph update.\\n\\n- Preserved the stable Copilot AgentVersion node identity while recording %s as the current upstream release.\\n- Added official release evidence for v1.0.55-5, v1.0.55-6, and v1.0.55-7.\\n- Added an agent-catalog regression test for AgentVersion id/versionRange slug drift.\\n- Ran metadata, atlas build, agent-catalog build, and catalog tests.\\n\\nPR: %s' '${args.targetVersion}' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 497;
  const targetVersion = inputs?.targetVersion ?? '1.0.55-7';
  const branchName = inputs?.branchName ?? 'agent/issue-497';

  const context = await ctx.task(readContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTask, { targetVersion });
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
    verificationStdout: verification?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, targetVersion, branchName });

  return {
    success: true,
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
