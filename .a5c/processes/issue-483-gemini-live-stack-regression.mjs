/**
 * @process repo/issue-483-gemini-live-stack-regression
 * @description Investigate and fix issue #483: gemini-cli non-interactive Live Stack auth regression.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string }
 * @outputs { success: boolean, diagnosis: object, changedFiles: string[], verification: object, delivery: object }
 *
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/gsd/debug
 * @process specializations/network-programming/transparent-proxy
 * @agent proxy-expert specializations/network-programming/agents/proxy-expert/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readIssueAndTraceTask = defineTask('issue-483.read-issue-and-trace', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #483 and trace gemini live-stack path',
  labels: ['issue-483', 'live-stack', 'gemini-cli', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- associated prs ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR fixes #${args.issueNumber} in:body OR closes #${args.issueNumber} in:body" --json number,title,headRefName,baseRefName,body,url`,
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
      'printf "\\n--- gemini install/auth/runtime surfaces ---\\n"',
      'rg -n "@google/gemini-cli|gemini-cli|GOOGLE_API_KEY|GEMINI_API_KEY|GOOGLE_GEMINI_BASE_URL|GOOGLE_GENAI_USE_VERTEXAI|proxy-token|auth method|adapters install gemini|harness:install" packages plugins .github docs -S',
      'printf "\\n--- live-stack workflow excerpts ---\\n"',
      'sed -n "180,455p" .github/workflows/live-stack.yml',
      'printf "\\n--- launch proxy setup excerpt ---\\n"',
      'sed -n "880,1035p" packages/adapters/launch/src/launch.ts',
      'printf "\\n--- adapter install excerpts ---\\n"',
      'sed -n "1,260p" packages/adapters/adapters/src/adapter-install.ts',
      'sed -n "1,220p" packages/adapters/adapters/tests/base-adapter-install.test.ts',
      'printf "\\n--- live-stack tests ---\\n"',
      'sed -n "1,320p" packages/adapters/cli/tests/live-stack/scenario-contract.test.ts',
      'sed -n "1,360p" packages/adapters/cli/tests/live-stack/primary-live-runner.test.ts',
      'printf "\\n--- recent relevant history ---\\n"',
      'git log --oneline -30 -- packages/adapters/launch packages/adapters/adapters packages/adapters/cli/tests/live-stack .github/workflows/live-stack.yml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const prepareBranchTask = defineTask('issue-483.prepare-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Create issue #483 implementation branch',
  labels: ['issue-483', 'git', 'branch'],
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

const diagnoseTask = defineTask('issue-483.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose gemini-cli auth regression',
  labels: ['issue-483', 'diagnosis', 'live-stack', 'gemini-cli'],
  agent: {
    name: 'gemini-live-stack-diagnoser',
    prompt: {
      role: 'senior TypeScript runtime and CI debugging engineer',
      task: 'Diagnose issue #483 without changing code.',
      instructions: [
        'SPEC AND RUNTIME CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files.',
        'Trace the runtime call path from Live Stack matrix generation to adapters install/launch, gemini-cli package installation, proxy env setup, and non-interactive auth selection.',
        'Identify the smallest root-cause fix that can be tested deterministically in this repository.',
        'Preserve the issue requirement to implement a real fix on a new branch, test it, open a PR, and comment on the issue.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], evidenceSignals: string[], fixPlan: string[], testPlan: string[], likelyFiles: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-483.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement issue #483 fix and tests',
  labels: ['issue-483', 'implementation', 'tests'],
  agent: {
    name: 'gemini-live-stack-implementer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Implement the issue #483 fix and focused regression tests.',
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
        'Keep changes scoped to the live-stack gemini-cli runtime path.',
        'Prefer a deterministic guardrail that would catch npm package drift for gemini-cli non-interactive auth.',
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

const verifyTask = defineTask('issue-483.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run targeted issue #483 verification',
  labels: ['issue-483', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/adapters/adapters/tests/base-adapter-install.test.ts packages/adapters/cli/tests/live-stack/scenario-contract.test.ts packages/adapters/cli/tests/live-stack/primary-live-runner.test.ts packages/adapters/cli/tests/launch-runtime-integration.test.ts',
      'npm run build --workspace=@a5c-ai/adapters-codecs',
      'npm run build --workspace=@a5c-ai/adapters-cli',
      'npm run build --workspace=@a5c-ai/agent-launch-mux',
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

const readArtifactsTask = defineTask('issue-483.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final artifacts for review',
  labels: ['issue-483', 'review', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/adapters/adapters packages/adapters/cli/tests packages/adapters/launch packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml .github/workflows/live-stack.yml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-483.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #483 fix against spec',
  labels: ['issue-483', 'review', 'quality-gate'],
  agent: {
    name: 'gemini-live-stack-reviewer',
    prompt: {
      role: 'senior runtime reviewer',
      task: 'Compare issue #483 requirements to the final artifacts.',
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
        'Check that the fix is on the traced live execution path and deterministic verification passed.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliverTask = defineTask('issue-483.deliver', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue #483',
  labels: ['issue-483', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git add packages/atlas/graph/agent-stack/versions/gemini-cli-current.yaml packages/adapters/adapters/tests/base-adapter-install.test.ts packages/adapters/cli/tests/live-stack/scenario-contract.test.ts packages/adapters/cli/tests/live-stack/primary-live-runner.test.ts',
      'git add -f .a5c/processes/issue-483-gemini-live-stack-regression.mjs .a5c/processes/issue-483-gemini-live-stack-regression.inputs.json',
      'git diff --cached --check',
      'git diff --cached --quiet && { echo "No staged changes to commit" >&2; exit 1; }',
      'git commit -m "fix(gemini): pin live-stack CLI install"',
      `git push -u origin ${args.branchName}`,
      'PR_URL=$(gh pr create --base staging --head "${BRANCH_NAME}" --title "Fix gemini-cli live-stack auth regression" --body "Fixes #483\\n\\n## Summary\\n- pin gemini-cli installation used by adapters to avoid the 0.44.0 auth-selection regression in Live Stack\\n- add regression coverage for the pinned gemini install command and live-stack scenario contract\\n\\n## Tests\\n- npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/adapters/adapters/tests/base-adapter-install.test.ts packages/adapters/cli/tests/live-stack/scenario-contract.test.ts packages/adapters/cli/tests/live-stack/primary-live-runner.test.ts packages/adapters/cli/tests/launch-runtime-integration.test.ts\\n- npm run build --workspace=@a5c-ai/adapters-codecs\\n- npm run build --workspace=@a5c-ai/adapters-cli\\n- npm run build --workspace=@a5c-ai/agent-launch-mux")',
      'gh issue comment "${ISSUE_NUMBER}" --body "Implemented a fix for the gemini-cli Live Stack auth regression.\\n\\nRoot cause: gemini-cli 0.44.0 changed non-interactive auth selection, so the Live Stack proxy-token + custom base URL path started exiting with \\`Invalid auth method selected\\`.\\n\\nFix: pin the adapters gemini install path to the last known-good 0.43.x line and add regression coverage so package drift does not silently re-enter the Live Stack matrix.\\n\\nVerification run locally:\\n- targeted vitest suite for adapter install + live-stack contracts/runtime integration\\n- adapter, CLI, and launch package builds\\n\\nPR: ${PR_URL}"',
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
  const issueNumber = inputs?.issueNumber ?? 483;
  const branchName = inputs?.branchName ?? 'agent/issue-483';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readIssueAndTraceTask, { issueNumber }, {
    key: 'issue-483.context',
  });

  const branch = await ctx.task(prepareBranchTask, { branchName, baseBranch }, {
    key: 'issue-483.branch',
  });

  const diagnosis = await ctx.task(diagnoseTask, {
    contextStdout: taskStdout(context),
    branch,
  }, {
    key: 'issue-483.diagnosis',
  });

  const implementation = await ctx.task(implementTask, {
    contextStdout: taskStdout(context),
    diagnosis,
  }, {
    key: 'issue-483.implementation',
  });

  const verification = await ctx.task(verifyTask, { implementation }, {
    key: 'issue-483.verification',
  });

  const artifacts = await ctx.task(readArtifactsTask, {}, {
    key: 'issue-483.artifacts',
  });

  const review = await ctx.task(reviewTask, {
    contextStdout: taskStdout(context),
    artifactsStdout: taskStdout(artifacts),
    verification,
  }, {
    key: 'issue-483.review',
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
    key: 'issue-483.delivery',
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
