/**
 * @process repo/issue-489-live-stack-deepseek-timeout
 * @description Fix live-stack DeepSeek-V4-Pro BP timeout failures with root-cause analysis, scoped implementation, verification, and PR handoff.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, review, publish }
 *
 * @process contrib/rogelsm/generic-bugfix
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/collaboration/github/issue-only-no-direct-commits
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-489.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR status, process references, and live-stack timeout surfaces',
  labels: ['issue-489', 'live-stack', 'deepseek', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process references ---\\n"',
      'rg -n "live-stack|timeout|DeepSeek|root-cause|bugfix|verification|issue-only-no-direct-commits" /home/runner/.a5c/process-library/babysitter-repo/library .a5c/processes -g "*.js" -g "*.md" | head -320',
      'printf "\\n--- repo timeout/deepseek surfaces ---\\n"',
      'rg -n "720000|720s|timeout|DeepSeek|deepseek|V4-Pro|BP|bridged-hooks|predefined|live-stack" . -g "*.ts" -g "*.tsx" -g "*.js" -g "*.mjs" -g "*.cjs" -g "*.json" -g "*.yml" -g "*.yaml" -g "*.md" | head -800',
      'printf "\\n--- package scripts ---\\n"',
      'node -e "const p=require(\\"./package.json\\"); console.log(JSON.stringify(p.scripts||{}, null, 2))"',
      'printf "\\n--- git state ---\\n"',
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

const diagnoseTask = defineTask('issue-489.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose DeepSeek live-stack timeout root cause',
  labels: ['issue-489', 'live-stack', 'deepseek', 'diagnosis'],
  agent: {
    name: 'live-stack-timeout-diagnostician',
    prompt: {
      role: 'senior live-stack test infrastructure engineer',
      task: 'Diagnose the DeepSeek-V4-Pro BP timeout issue without changing code.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this diagnosis task.',
        'Identify the runtime call path from live-stack matrix/test configuration to the timeout value that terminates BP modes.',
        'Confirm the root cause with at least two independent evidence signals from the issue/comments and repository code/config.',
        'Rule out whether this is a harness correctness bug versus a timeout budget issue.',
        'Propose a tightly scoped fix and a verification plan.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], evidenceSignals: string[], alternativesRuledOut: string[], proposedFix: string, verificationPlan: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementFixTask = defineTask('issue-489.implement-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement DeepSeek timeout fix',
  labels: ['issue-489', 'live-stack', 'deepseek', 'implementation'],
  agent: {
    name: 'live-stack-timeout-implementer',
    prompt: {
      role: 'senior TypeScript test infrastructure engineer',
      task: 'Implement the scoped fix for issue #489.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Preserve unrelated local worktree changes.',
        'Keep the change focused on increasing or correctly applying the DeepSeek BP/live-stack timeout budget from 720s to the issue-approved 900s, or a more precise equivalent if the code structure requires it.',
        'Do not reduce coverage, mark cells expected-fail, or hide failures.',
        'Add or update a regression test or guardrail if the timeout is represented in code/config that can be tested locally.',
        'Return JSON: { changedFiles: string[], summary: string, testsAddedOrUpdated: string[], verificationCommands: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyFixTask = defineTask('issue-489.verify-fix', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify DeepSeek timeout fix',
  labels: ['issue-489', 'live-stack', 'deepseek', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run build:sdk',
      'npm run test:sdk',
      'npm run verify:metadata',
      'printf "\\n--- timeout guard ---\\n"',
      'rg -n "900000|900s|15 min|15min|timeout" . -g "*.ts" -g "*.tsx" -g "*.js" -g "*.mjs" -g "*.cjs" -g "*.json" -g "*.yml" -g "*.yaml" -g "*.md" | head -200',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-489.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed artifacts for final review',
  labels: ['issue-489', 'live-stack', 'deepseek', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- . ":!.agents/plugins/marketplace.json" ":!.codex/skills/babysit/SKILL.md" ":!.codex/config.toml" ":!.codex/hooks.json" ":!.codex/hooks/**" ":!.codex/skills/**" ":!plugins/babysitter/**"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-489.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review DeepSeek timeout fix against issue spec',
  labels: ['issue-489', 'live-stack', 'deepseek', 'review'],
  agent: {
    name: 'live-stack-timeout-reviewer',
    prompt: {
      role: 'senior test infrastructure reviewer',
      task: 'Compare issue #489 requirements to the final artifacts.',
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
        'Return JSON: { approved: boolean, issues: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-489.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-489', 'live-stack', 'deepseek', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add .a5c/processes/issue-489-live-stack-deepseek-timeout.js',
      'git diff --name-only | rg -v "^(\\.agents/plugins/marketplace\\.json|\\.codex/skills/babysit/SKILL\\.md|\\.codex/config\\.toml|\\.codex/hooks\\.json|\\.codex/hooks/|\\.codex/skills/|plugins/babysitter/)" | while IFS= read -r path; do [ -n "$path" ] && git add "$path"; done',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "fix(live-stack): extend DeepSeek BP timeout"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Fix DeepSeek BP live-stack timeout" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented a live-stack timeout fix for DeepSeek-V4-Pro BP modes.\\n\\n- Root cause: DeepSeek BP cells were hitting the existing 720s timeout while the agent was still making progress.\\n- Fix: raised the scoped DeepSeek BP/live-stack timeout budget to the issue-approved 900s path instead of marking cells expected-fail.\\n- Verification: ran build, SDK tests, metadata verification, and diff checks through the babysitter run.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 489;
  const branchName = inputs?.branchName ?? 'agent/issue-489';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const diagnosis = await ctx.task(diagnoseTask, {
    contextStdout: context?.stdout ?? '',
  });
  const implementation = await ctx.task(implementFixTask, {
    contextStdout: context?.stdout ?? '',
    diagnosis,
  });
  const verification = await ctx.task(verifyFixTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'diagnosis', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve the DeepSeek timeout fix.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'diagnosis', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Fixed DeepSeek-V4-Pro BP timeout handling.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
