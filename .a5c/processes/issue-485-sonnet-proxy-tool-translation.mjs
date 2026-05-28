/**
 * @process repo/issue-485-sonnet-proxy-tool-translation
 * @description Investigate and fix issue #485: Anthropic Sonnet BP/BI proxy tool-call translation failures.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string }
 * @outputs { success: boolean, diagnosis: object, changedFiles: string[], verification: object, review: object, delivery: object }
 *
 * @process cradle/bugfix
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/sdk-platform-development/custom-transport-middleware
 * @agent proxy-expert specializations/network-programming/agents/proxy-expert/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readContextTask = defineTask('issue-485.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, PR, and transport-mux context',
  labels: ['issue-485', 'context', 'transport-mux', 'live-stack'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- associated open prs ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR fixes #${args.issueNumber} in:body OR closes #${args.issueNumber} in:body" --json number,title,headRefName,baseRefName,body,url`,
      'printf "\\n--- previous fix PR #501 ---\\n"',
      'gh pr view 501 --json number,title,state,mergedAt,files,body,comments',
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
      'printf "\\n--- transport-mux codec and engine surfaces ---\\n"',
      'sed -n "1,260p" packages/transport-mux/src/codecs/anthropic.ts',
      'sed -n "1,260p" packages/transport-mux/src/codecs/openai-chat.ts',
      'sed -n "1,260p" packages/transport-mux/src/codecs/openai-responses.ts',
      'sed -n "1,260p" packages/transport-mux/src/engines/anthropic.ts',
      'sed -n "1,260p" packages/transport-mux/src/engines/openai.ts',
      'printf "\\n--- server translation hotspots ---\\n"',
      'rg -n "tool_use|tool_result|tool_calls|function_call|CompletionResult|complete\\(|streamCompletion|openai|anthropic" packages/transport-mux/src packages/transport-mux/tests -S',
      'printf "\\n--- recent transport history ---\\n"',
      'git log --oneline -30 -- packages/transport-mux packages/agent-mux/cli/tests/live-stack packages/agent-mux/launch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const prepareBranchTask = defineTask('issue-485.prepare-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Create issue #485 implementation branch',
  labels: ['issue-485', 'git', 'branch'],
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

const diagnoseTask = defineTask('issue-485.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose Anthropic/OpenAI tool-call translation failure',
  labels: ['issue-485', 'diagnosis', 'transport-mux'],
  agent: {
    name: 'transport-mux-proxy-diagnoser',
    prompt: {
      role: 'senior TypeScript runtime and protocol-translation engineer',
      task: 'Diagnose why Anthropic Sonnet BP/BI proxy runs still lose tool execution after PR #501.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this task.',
        'Trace tool schema and tool-call/result conversion in both directions between Anthropic Messages and OpenAI Chat/Responses formats.',
        'Focus especially on packages/transport-mux/src/codecs/anthropic.ts and how content blocks are translated for cross-provider proxy paths.',
        'Identify the smallest deterministic regression tests that do not require live provider credentials.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], evidenceSignals: string[], ruledOut: string[], likelyFiles: string[], testPlan: string[], fixPlan: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-485.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Anthropic proxy tool-call fix and tests',
  labels: ['issue-485', 'implementation', 'tests'],
  agent: {
    name: 'transport-mux-proxy-implementer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Implement the issue #485 fix and focused regression tests.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim JSON):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'Edit the repository directly.',
        'Keep changes scoped to transport-mux codec/server/engine behavior and focused tests unless the traced root cause proves otherwise.',
        'Preserve unrelated worktree changes.',
        'Do not require live provider credentials for regression coverage.',
        'Return JSON: { changedFiles: string[], summary: string, rootCauseAddressed: string, testsAdded: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-485.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run targeted issue #485 verification',
  labels: ['issue-485', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/transport-mux/src/__tests__/codecs.test.ts packages/transport-mux/tests/transports/anthropic.test.ts packages/transport-mux/tests/transports/openai-chat.test.ts packages/transport-mux/tests/transports/openai-responses.test.ts',
      'npm run build --workspace=@a5c-ai/transport-mux',
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

const readArtifactsTask = defineTask('issue-485.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final artifacts for review',
  labels: ['issue-485', 'review', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/transport-mux/src packages/transport-mux/tests .a5c/processes/issue-485-sonnet-proxy-tool-translation.mjs .a5c/processes/issue-485-sonnet-proxy-tool-translation.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-485.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #485 fix against spec',
  labels: ['issue-485', 'review', 'quality-gate'],
  agent: {
    name: 'transport-mux-proxy-reviewer',
    prompt: {
      role: 'senior runtime reviewer',
      task: 'Review the issue #485 fix against the issue and artifacts.',
      instructions: [
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification ?? {}, null, 2),
        '---',
        'Check that the fix targets cross-provider Anthropic/OpenAI tool-call translation and includes deterministic regression coverage.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliverTask = defineTask('issue-485.deliver', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue #485',
  labels: ['issue-485', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git add packages/transport-mux/src packages/transport-mux/tests',
      'git add -f .a5c/processes/issue-485-sonnet-proxy-tool-translation.mjs .a5c/processes/issue-485-sonnet-proxy-tool-translation.inputs.json',
      'git diff --cached --check',
      'git diff --cached --quiet && { echo "No staged changes to commit" >&2; exit 1; }',
      'git commit -m "fix(transport-mux): preserve Anthropic proxy tool calls"',
      `git push -u origin ${args.branchName}`,
      'PR_URL=$(gh pr create --base staging --head "${BRANCH_NAME}" --title "Fix Anthropic proxy tool-call translation" --body "Fixes #485\\n\\n## Summary\\n- preserve OpenAI Responses function_call/function_call_output input items as Anthropic tool_use/tool_result blocks\\n- make the Anthropic codec preserve tool content and encode toolCalls as tool_use responses\\n- add deterministic transport-mux regression coverage for cross-provider tool-call translation\\n\\n## Tests\\n- npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/transport-mux/src/__tests__/codecs.test.ts packages/transport-mux/tests/transports/anthropic.test.ts packages/transport-mux/tests/transports/openai-chat.test.ts packages/transport-mux/tests/transports/openai-responses.test.ts\\n- npm run build --workspace=@a5c-ai/transport-mux\\n- git diff --check")',
      'gh issue comment "${ISSUE_NUMBER}" --body "Implemented a follow-up fix for the Anthropic/Sonnet proxy tool-call path.\\n\\nSummary:\\n- fixed request-side OpenAI Responses -> Anthropic translation so function_call and function_call_output input items survive as tool_use/tool_result blocks\\n- fixed the Anthropic codec to preserve tool content blocks and encode toolCalls as tool_use responses\\n- added deterministic codec and transport regression coverage without live provider credentials\\n\\nVerification run locally:\\n- transport-mux codec + Anthropic/OpenAI focused Vitest suite\\n- transport-mux package build\\n- git diff whitespace check\\n\\nPR: ${PR_URL}"',
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
  const issueNumber = inputs?.issueNumber ?? 485;
  const branchName = inputs?.branchName ?? 'agent/issue-485';

  const context = await ctx.task(readContextTask, { issueNumber }, {
    key: 'issue-485.context',
  });

  await ctx.task(prepareBranchTask, {
    branchName,
    baseBranch: inputs?.baseBranch ?? 'staging',
  }, {
    key: 'issue-485.branch',
  });

  const diagnosis = await ctx.task(diagnoseTask, {
    contextStdout: taskStdout(context),
  }, {
    key: 'issue-485.diagnosis',
  });

  const implementation = await ctx.task(implementTask, {
    contextStdout: taskStdout(context),
    diagnosis,
  }, {
    key: 'issue-485.implementation',
  });

  const verification = await ctx.task(verifyTask, { implementation }, {
    key: 'issue-485.verification',
  });

  const artifacts = await ctx.task(readArtifactsTask, {}, {
    key: 'issue-485.artifacts',
  });

  const review = await ctx.task(reviewTask, {
    contextStdout: taskStdout(context),
    artifactsStdout: taskStdout(artifacts),
    verification,
  }, {
    key: 'issue-485.review',
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
    key: 'issue-485.delivery',
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
