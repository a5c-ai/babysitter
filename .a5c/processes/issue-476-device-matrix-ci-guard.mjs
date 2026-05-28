/**
 * @process repo/issue-476-device-matrix-ci-guard
 * @description Implement issue #476: device test matrix planning guidance and CI guard for media-touching changes.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string }
 * @outputs { success: boolean, diagnosis: object, changedFiles: string[], verification: object, delivery: object }
 *
 * @process methodologies/pilot-shell/pilot-shell-feature
 * @process methodologies/planning-with-files/planning-orchestrator
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/gsd/plan-phase
 * @process methodologies/gsd/verify-work
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 * @agent spec-guard methodologies/pilot-shell/agents/spec-guard/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readIssueAndMapTask = defineTask('issue-476.read-issue-and-map', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #476 and map affected surfaces',
  labels: ['issue-476', 'context', 'sdk', 'plugins', 'ci'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- associated prs ---\\n"',
      `gh pr list --state open --search "#${args.issueNumber}" --json number,title,headRefName,baseRefName,body,url`,
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
      'printf "\\n--- existing device/platform hardening references ---\\n"',
      'rg -n "Device test matrix|media-touching|media related|PLATFORM_BOUNDARY|iPad Safari|iPhone Safari|macOS Safari|Desktop Chrome|tts|stt|audio|hands-free|media|voice" .codex plugins packages library scripts docs .github -S || true',
      'printf "\\n--- planning and command surfaces ---\\n"',
      'sed -n "1,240p" .codex/skills/plan/SKILL.md 2>/dev/null || true',
      'sed -n "1,240p" plugins/babysitter-unified/commands/plan.md 2>/dev/null || true',
      'sed -n "1,260p" packages/sdk/src/prompts/templates/process-creation.md 2>/dev/null || true',
      'sed -n "1,260p" packages/sdk/src/prompts/templates/process-guidelines.md 2>/dev/null || true',
      'sed -n "1,260p" library/methodologies/superpowers/writing-plans.js 2>/dev/null || true',
      'sed -n "1,260p" library/methodologies/gsd/plan-phase.js 2>/dev/null || true',
      'printf "\\n--- package and CI excerpts ---\\n"',
      'sed -n "1,140p" package.json',
      'sed -n "1,130p" .github/workflows/ci.yml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const prepareBranchTask = defineTask('issue-476.prepare-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Create issue #476 implementation branch',
  labels: ['issue-476', 'git', 'branch'],
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

const planTask = defineTask('issue-476.plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan issue #476 implementation',
  labels: ['issue-476', 'planning', 'sdk', 'plugins', 'ci'],
  agent: {
    name: 'device-matrix-ci-planner',
    prompt: {
      role: 'senior TypeScript maintainer and CI engineer',
      task: 'Plan the issue #476 implementation without editing files.',
      instructions: [
        'SPEC AND CODEBASE CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files.',
        'Trace the live surfaces that cause babysitter:plan and downstream babysitter:call guidance to be emitted.',
        'Identify where the canonical media device matrix should live and where a deterministic CI guard belongs.',
        'Plan tests before implementation and keep the scope to issue #476.',
        'Return JSON: { runtimeCallPaths: string[], affectedFiles: string[], implementationPlan: string[], testPlan: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-476.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement issue #476 changes and tests',
  labels: ['issue-476', 'implementation', 'tests', 'ci'],
  agent: {
    name: 'device-matrix-ci-implementer',
    prompt: {
      role: 'senior TypeScript maintainer and CI engineer',
      task: 'Implement issue #476 and focused regression tests.',
      instructions: [
        'SPEC AND CODEBASE CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.plan ?? {}, null, 2),
        '---',
        'Edit the repository directly.',
        'Add the per-device media matrix guidance to the active plan/implementation guidance surfaces.',
        'Add a configurable deterministic CI guard that checks changed media-related paths and validates IMPL.md or PR body matrix evidence.',
        'Add focused tests/fixtures for no media changes, valid matrix, missing matrix, SKIP with justification, and SKIP without justification.',
        'Wire the guard into package scripts and CI without staging unrelated dirty files.',
        'Return JSON: { changedFiles: string[], summary: string, testsAdded: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-476.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run targeted issue #476 verification',
  labels: ['issue-476', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run check:processes',
      'npm run build:sdk',
      'npm run test:sdk',
      'npm run verify:metadata',
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

const readArtifactsTask = defineTask('issue-476.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final artifacts for review',
  labels: ['issue-476', 'review', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'printf "\\n--- diff ---\\n"',
      'git diff -- package.json .github/workflows/ci.yml scripts packages/sdk/src/prompts/templates .codex/skills/plan/SKILL.md plugins/babysitter-unified/commands/plan.md library/methodologies/superpowers/writing-plans.js library/methodologies/gsd/plan-phase.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-476.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #476 implementation against spec',
  labels: ['issue-476', 'review', 'quality-gate'],
  agent: {
    name: 'device-matrix-ci-reviewer',
    prompt: {
      role: 'senior maintainer and CI reviewer',
      task: 'Compare issue #476 requirements to the final artifacts.',
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
        'Check prompt/template surfaces, guard behavior, configurability, test coverage, CI wiring, and unrelated-file risk.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliverTask = defineTask('issue-476.deliver', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue #476',
  labels: ['issue-476', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'FILES=$(git diff --name-only -- package.json .github/workflows/ci.yml scripts packages/sdk/src/prompts/templates .codex/skills/plan/SKILL.md plugins/babysitter-unified/commands/plan.md library/methodologies/superpowers/writing-plans.js library/methodologies/gsd/plan-phase.js)',
      'test -n "$FILES"',
      'printf "%s\\n" "$FILES" | xargs git add --',
      'git add -f .a5c/processes/issue-476-device-matrix-ci-guard.mjs .a5c/processes/issue-476-device-matrix-ci-guard.inputs.json',
      'git diff --cached --check',
      'git diff --cached --quiet && { echo "No staged changes to commit" >&2; exit 1; }',
      'git commit -m "feat(processes): require media device test matrix"',
      `git push -u origin ${args.branchName}`,
      'PR_URL=$(gh pr create --base "${BASE_BRANCH}" --head "${BRANCH_NAME}" --title "Require media device test matrix for process changes" --body "Fixes #476\\n\\n## Summary\\n- add the required media-touching device test matrix guidance to Babysitter planning surfaces\\n- add a configurable process guard for media-related changes that validates IMPL.md or PR body evidence\\n- wire the guard into package scripts and CI with focused test coverage\\n\\n## Tests\\n- npm run check:processes\\n- npm run build:sdk\\n- npm run test:sdk\\n- npm run verify:metadata")',
      'gh issue comment "${ISSUE_NUMBER}" --body "Implemented the per-device media matrix guidance and CI guard for issue #476.\\n\\nSummary:\\n- added the required media-touching device test matrix guidance to Babysitter planning/process surfaces\\n- added a configurable process guard that checks media-related changed files and validates IMPL.md or PR body evidence rows\\n- wired the guard into package scripts and CI with focused tests\\n\\nVerification run locally:\\n- npm run check:processes\\n- npm run build:sdk\\n- npm run test:sdk\\n- npm run verify:metadata\\n\\nPR: ${PR_URL}"',
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    env: {
      BASE_BRANCH: args.baseBranch,
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
  const issueNumber = inputs?.issueNumber ?? 476;
  const branchName = inputs?.branchName ?? 'agent/issue-476';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readIssueAndMapTask, { issueNumber }, {
    key: 'issue-476.context',
  });

  const branch = await ctx.task(prepareBranchTask, { branchName, baseBranch }, {
    key: 'issue-476.branch',
  });

  const plan = await ctx.task(planTask, {
    contextStdout: taskStdout(context),
    branch,
  }, {
    key: 'issue-476.plan',
  });

  const implementation = await ctx.task(implementTask, {
    contextStdout: taskStdout(context),
    plan,
  }, {
    key: 'issue-476.implementation',
  });

  const verification = await ctx.task(verifyTask, { implementation }, {
    key: 'issue-476.verify',
  });

  const artifacts = await ctx.task(readArtifactsTask, { implementation }, {
    key: 'issue-476.artifacts',
  });

  const review = await ctx.task(reviewTask, {
    contextStdout: taskStdout(context),
    artifactsStdout: taskStdout(artifacts),
  }, {
    key: 'issue-476.review',
  });

  if (review?.approved === false) {
    return {
      success: false,
      diagnosis: plan,
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
      delivery: null,
    };
  }

  const delivery = await ctx.task(deliverTask, {
    issueNumber,
    branchName,
    baseBranch,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-476.delivery',
  });

  return {
    success: true,
    diagnosis: plan,
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    delivery,
  };
}
