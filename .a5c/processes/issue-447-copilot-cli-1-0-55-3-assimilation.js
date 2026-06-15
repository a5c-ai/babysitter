/**
 * @process repo/issue-447-copilot-cli-1-0-55-3-assimilation
 * @description Finish GitHub Copilot CLI 1.0.55-3 Atlas graph tracking by verifying the daily update and adding missing release evidence linkage.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string }
 * @outputs { success, changedFiles, verification, review, publish }
 *
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/gsd/quick
 * @agent general-purpose methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-447.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR, and Copilot graph context',
  labels: ['issue-447', 'copilot-cli', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} OR #${args.issueNumber}" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- merged daily upstream graph pr ---\\n"',
      'gh pr view 448 --json number,title,state,mergedAt,headRefName,baseRefName,body',
      'printf "\\n--- current copilot graph refs ---\\n"',
      'rg -n "1\\\\.0\\\\.55-3|agentVersion:copilot|plugin-target:copilot-cli|github/copilot-cli|hook progress|pluginDirectories|owner/repo#ref|plugin-dir|authenticated copilot update/version" packages/atlas/graph packages/agent-catalog/src/catalog.test.ts',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementEvidenceTask = defineTask('issue-447.implement-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Add Copilot release evidence linkage',
  labels: ['issue-447', 'copilot-cli', 'implementation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Finish the GitHub Copilot CLI 1.0.55-3 tracking update in the repository.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'The current graph already tracks version 1.0.55-3. Keep that scope; do not rewrite unrelated daily graph updates.',
        'Add missing official release evidence for https://github.com/github/copilot-cli/releases/tag/v1.0.55-3 in packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml.',
        'Link packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml edges.sourced_from to source-ref:gh-copilot-github and the new evidence id.',
        'Keep the issue checklist items represented in graph notes or evidence notes: hook progress streaming, pluginDirectories on session.create/resume, remote session deletion, owner/repo#ref marketplace add, tmux progress, plugin-dir skill precedence, authenticated update/version release API requests, and snake_case settings migration.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-447.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Copilot release graph metadata',
  labels: ['issue-447', 'copilot-cli', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "agentVersion:copilot:ge-1-0-55-3|>=1.0.55-3|v1.0.55-3|https://github.com/github/copilot-cli/releases/tag/v1.0.55-3" packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml',
      'rg -n "evidence:copilot-cli-1-0-55-3-release|https://github.com/github/copilot-cli/releases/tag/v1.0.55-3|hook progress streaming|pluginDirectories|owner/repo#ref|plugin-dir skill precedence|authenticated copilot update/version|snake_case" packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'rg -n "source-ref:gh-copilot-github|evidence:copilot-cli-1-0-55-3-release" packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml',
      'git diff --check',
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

const readArtifactsTask = defineTask('issue-447.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read Copilot artifact diff',
  labels: ['issue-447', 'copilot-cli', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-447.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Copilot assimilation against issue spec',
  labels: ['issue-447', 'copilot-cli', 'review'],
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

const publishTask = defineTask('issue-447.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-447', 'copilot-cli', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/agent-stack/versions/copilot-cli-current.yaml packages/atlas/graph/catalog-meta/evidence-sources/agent-version-release-evidence-2026-05-27.yaml',
      'git add -f .a5c/processes/issue-447-copilot-cli-1-0-55-3-assimilation.js .a5c/processes/issue-447-copilot-cli-1-0-55-3-assimilation.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "fix(atlas): link Copilot CLI release evidence"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base staging --head ${args.branchName} --title "Track GitHub Copilot CLI 1.0.55-3 release evidence" --body "Closes #${args.issueNumber}\\n\\nAdds the missing official release evidence and source linkage for the GitHub Copilot CLI 1.0.55-3 Atlas graph record. The version-range and checklist content were already introduced by the daily upstream graph update in #448.")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Completed Copilot CLI %s tracking follow-up.\\n\\n- Confirmed staging already updated the Copilot CLI graph record to >=%s in merged PR #448.\\n- Added official v%s release evidence and linked it from the current AgentVersion record.\\n- Ran metadata verification.\\n\\nPR: %s' '${args.targetVersion}' '${args.targetVersion}' '${args.targetVersion}' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 447;
  const targetVersion = inputs?.targetVersion ?? '1.0.55-3';
  const branchName = inputs?.branchName ?? 'agent/issue-447';

  const context = await ctx.task(readContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementEvidenceTask, {
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
