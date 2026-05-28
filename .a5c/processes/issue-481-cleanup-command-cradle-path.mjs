/**
 * @process repo/issue-481-cleanup-command-cradle-path
 * @description Fix issue #481: cleanup command guidance references obsolete cradle process path.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string }
 * @outputs { success: boolean, diagnosis: object, changedFiles: string[], verification: object, delivery: object }
 *
 * @process cradle/bugfix
 * @process processes/shared/tdd-triplet
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readIssueAndTraceTask = defineTask('issue-481.read-issue-and-trace', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #481 and trace cleanup command path',
  labels: ['issue-481', 'cleanup', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- associated prs ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR fixes #${args.issueNumber} in:body OR closes #${args.issueNumber} in:body" --json number,title,headRefName,baseRefName,body,url`,
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
      'printf "\\n--- cleanup path references ---\\n"',
      'rg -n "cleanup-runs|skills[/\\\\\\\\]babysit[/\\\\\\\\]process[/\\\\\\\\]cradle|process-library:active|cradle/cleanup-runs" plugins/babysitter-unified packages/sdk/src/prompts scripts package.json library -S',
      'printf "\\n--- cleanup command source ---\\n"',
      'sed -n "1,180p" plugins/babysitter-unified/commands/cleanup.md',
      'printf "\\n--- generated sdk cleanup template ---\\n"',
      'sed -n "1,220p" packages/sdk/src/prompts/templates/commands/cleanup.md',
      'printf "\\n--- sync script excerpt ---\\n"',
      'sed -n "1,230p" scripts/sync-sdk-command-templates.cjs',
      'printf "\\n--- canonical cleanup process exists ---\\n"',
      'test -f library/cradle/cleanup-runs.js',
      'sed -n "1,80p" library/cradle/cleanup-runs.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const prepareBranchTask = defineTask('issue-481.prepare-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Create issue #481 implementation branch',
  labels: ['issue-481', 'git', 'branch'],
  shell: {
    command: [
      'set -euo pipefail',
      `if git rev-parse --verify ${args.branchName} >/dev/null 2>&1; then`,
      `  git switch ${args.branchName}`,
      'else',
      `  git switch -c ${args.branchName}`,
      'fi',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const diagnoseTask = defineTask('issue-481.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose cleanup command path bug',
  labels: ['issue-481', 'diagnosis', 'cleanup'],
  agent: {
    name: 'cleanup-command-diagnoser',
    prompt: {
      role: 'senior SDK and plugin maintainer',
      task: 'Diagnose issue #481 without changing code.',
      instructions: [
        'SPEC AND RUNTIME CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files.',
        'Trace how plugins/babysitter-unified/commands/cleanup.md is propagated into packages/sdk/src/prompts/templates/commands/cleanup.md.',
        'Identify the smallest fix and a deterministic regression check that prevents the obsolete skills/babysit/process/cradle path from reappearing.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], evidenceSignals: string[], fixPlan: string[], testPlan: string[], likelyFiles: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-481.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement issue #481 fix and guardrail',
  labels: ['issue-481', 'implementation', 'tests'],
  agent: {
    name: 'cleanup-command-implementer',
    prompt: {
      role: 'senior TypeScript and plugin maintainer',
      task: 'Implement the issue #481 fix and focused regression check.',
      instructions: [
        'SPEC AND RUNTIME CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim JSON):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'Edit the repository directly.',
        'Keep changes scoped to cleanup command guidance, generated SDK command templates, and a focused template/path regression check.',
        'The cleanup command must resolve the active process library with `babysitter process-library:active --json` and use `cradle/cleanup-runs.js#process` relative to that active library root.',
        'Do not commit unrelated dirty worktree files.',
        'Return JSON: { changedFiles: string[], summary: string, rootCauseAddressed: string, testsAdded: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-481.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run issue #481 verification',
  labels: ['issue-481', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run check:sdk-command-templates',
      'npm run build:sdk',
      'npm run test:sdk',
      'npm run verify:metadata',
      'git diff --check',
      'if rg -n "skills[/\\\\\\\\]babysit[/\\\\\\\\]process[/\\\\\\\\]cradle|cleanup-runs.js/processes/cleanup-runs.js" plugins/babysitter-unified packages/sdk/src/prompts scripts; then',
      '  echo "obsolete cleanup cradle path still present" >&2',
      '  exit 1',
      'fi',
      'rg -n "process-library:active --json|cradle/cleanup-runs.js#process" plugins/babysitter-unified/commands/cleanup.md packages/sdk/src/prompts/templates/commands/cleanup.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-481.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final artifacts for review',
  labels: ['issue-481', 'review', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- plugins/babysitter-unified/commands/cleanup.md packages/sdk/src/prompts/templates/commands/cleanup.md scripts/sync-sdk-command-templates.cjs .a5c/processes/issue-481-cleanup-command-cradle-path.mjs .a5c/processes/issue-481-cleanup-command-cradle-path.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-481.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #481 fix against spec',
  labels: ['issue-481', 'review', 'quality-gate'],
  agent: {
    name: 'cleanup-command-reviewer',
    prompt: {
      role: 'senior SDK and plugin reviewer',
      task: 'Compare issue #481 requirements to the final artifacts.',
      instructions: [
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Check that generated SDK template remains synchronized with plugin command source and that stale path regression is deterministic.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliverTask = defineTask('issue-481.deliver', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue #481',
  labels: ['issue-481', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git add plugins/babysitter-unified/commands/cleanup.md packages/sdk/src/prompts/templates/commands/cleanup.md scripts/sync-sdk-command-templates.cjs',
      'git add -f .a5c/processes/issue-481-cleanup-command-cradle-path.mjs .a5c/processes/issue-481-cleanup-command-cradle-path.inputs.json',
      'git diff --cached --check',
      'git diff --cached --quiet && { echo "No staged changes to commit" >&2; exit 1; }',
      'git commit -m "fix(cleanup): use active library cradle process"',
      `git push -u origin ${args.branchName}`,
      'PR_URL=$(gh pr create --base staging --head "${BRANCH_NAME}" --title "Fix cleanup command cradle process path" --body "Fixes #481\\n\\n## Summary\\n- update /babysitter:cleanup guidance to resolve the active process-library root\\n- point cleanup orchestration at cradle/cleanup-runs.js#process instead of the obsolete plugin-cache path\\n- add a command-template regression check that rejects the stale cradle path\\n\\n## Tests\\n- npm run check:sdk-command-templates\\n- npm run build:sdk\\n- npm run test:sdk\\n- npm run verify:metadata")',
      'gh issue comment "${ISSUE_NUMBER}" --body "Implemented the cleanup command path fix.\\n\\nSummary:\\n- /babysitter:cleanup now tells agents to resolve the active process library with \\`babysitter process-library:active --json\\` and run \\`cradle/cleanup-runs.js#process\\` from that root.\\n- Regenerated the SDK cleanup command template from the unified plugin command source.\\n- Added a focused sync regression check that fails if the obsolete \\`skills/babysit/process/cradle\\` cleanup path appears again.\\n\\nVerification run locally:\\n- \\`npm run check:sdk-command-templates\\`\\n- \\`npm run build:sdk\\`\\n- \\`npm run test:sdk\\`\\n- \\`npm run verify:metadata\\`\\n\\nPR: ${PR_URL}"',
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    env: {
      BRANCH_NAME: args.branchName,
      ISSUE_NUMBER: String(args.issueNumber),
    },
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 481;
  const branchName = inputs?.branchName ?? 'agent/issue-481';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readIssueAndTraceTask, { issueNumber }, {
    key: 'issue-481.context',
  });

  const branch = await ctx.task(prepareBranchTask, { branchName, baseBranch }, {
    key: 'issue-481.branch',
  });

  const diagnosis = await ctx.task(diagnoseTask, {
    contextStdout: taskStdout(context),
    branch,
  }, {
    key: 'issue-481.diagnosis',
  });

  const implementation = await ctx.task(implementTask, {
    contextStdout: taskStdout(context),
    diagnosis,
  }, {
    key: 'issue-481.implementation',
  });

  const verification = await ctx.task(verifyTask, { implementation }, {
    key: 'issue-481.verification',
  });

  const artifacts = await ctx.task(readArtifactsTask, {}, {
    key: 'issue-481.artifacts',
  });

  const review = await ctx.task(reviewTask, {
    contextStdout: taskStdout(context),
    artifactsStdout: taskStdout(artifacts),
    verification,
  }, {
    key: 'issue-481.review',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'branch', 'diagnosis', 'implementation', 'verification', 'artifacts', 'review'],
      diagnosis,
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const delivery = await ctx.task(deliverTask, { issueNumber, branchName }, {
    key: 'issue-481.delivery',
  });

  return {
    success: true,
    phases: ['context', 'branch', 'diagnosis', 'implementation', 'verification', 'artifacts', 'review', 'delivery'],
    diagnosis,
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    delivery,
  };
}
