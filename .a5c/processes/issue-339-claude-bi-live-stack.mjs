/**
 * @process repo/issue-339-claude-bi-live-stack
 * @description Fix Live Stack claude-code bridged-interactive fallback failures across models on Ubuntu and Windows.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, targetFiles: string[], liveVerification: object }
 * @outputs { success, phases, diagnosis, changedFiles, verification, review, liveVerificationPlan }
 *
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/requesting-code-review
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/gsd/debug
 * @agent proxy-expert specializations/network-programming/agents/proxy-expert/AGENT.md
 * @agent e2e-runner methodologies/everything-claude-code/agents/e2e-runner/AGENT.md
 * @agent tdd-guide methodologies/everything-claude-code/agents/tdd-guide/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-339.read-runtime-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue and runtime context',
  labels: ['issue-339', 'context', 'live-stack', 'agent-mux'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- target files ---\\n"',
      `printf "%s\\n" ${JSON.stringify((args.targetFiles ?? []).join('\n'))}`,
      'printf "\\n--- launch prompt and fallback path ---\\n"',
      'sed -n "206,260p" packages/agent-mux/launch/src/launch.ts',
      'sed -n "1080,1325p" packages/agent-mux/launch/src/launch.ts',
      'printf "\\n--- bridge hooks path ---\\n"',
      'sed -n "1,260p" packages/agent-mux/launch/src/bridge-hooks.ts',
      'printf "\\n--- launch behavior/catalog surfaces ---\\n"',
      'rg -n "launchBehavior|promptDelivery|stdinBehavior|bridgeCapabilities|interactiveBridge|claude" packages/atlas packages/agent-catalog/src packages/sdk/src/harness -g "*.yaml" -g "*.ts" | head -240 || true',
      'printf "\\n--- live-stack workflow and tests ---\\n"',
      'sed -n "1,260p" .github/workflows/live-stack.yml',
      'sed -n "1,240p" packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts',
      'sed -n "1,220p" packages/agent-mux/cli/tests/launch-bridge-interactive.test.ts',
      'sed -n "1,260p" packages/agent-mux/cli/tests/launch-runtime-integration.test.ts',
      'printf "\\n--- recent launch history ---\\n"',
      'git log --oneline -20 -- packages/agent-mux/launch packages/agent-mux/cli/tests packages/agent-catalog packages/sdk/src/harness .github/workflows/live-stack.yml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const diagnoseTask = defineTask('issue-339.diagnose-claude-bi-fallback', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose claude-code BI fallback failure',
  labels: ['issue-339', 'diagnosis', 'agent-mux', 'transport-mux'],
  agent: {
    name: 'claude-bi-fallback-diagnoser',
    prompt: {
      role: 'senior runtime debugging engineer',
      task: 'Diagnose the specific failure mechanism for issue #339 without changing code.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files.',
        'Trace the live execution path from Live Stack matrix generation to amux launch, bridge-interactive PTY spawn, child_process fallback, prompt delivery, transport-mux proxy startup, hook emulation, and artifact/report validation.',
        'Record runtimeCallPaths as concrete file/function paths.',
        'Identify at least two independent evidence signals for the root cause.',
        'Separate exact original evidence (gpt-5.4-mini) from the expanded all-model Ubuntu/Windows scope.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], evidenceSignals: string[], ruledOut: string[], likelyFiles: string[], testHypotheses: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorRegressionTestsTask = defineTask('issue-339.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression tests before implementation',
  labels: ['issue-339', 'tdd', 'tests'],
  agent: {
    name: 'claude-bi-tdd-engineer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression tests for the issue #339 failure mode before implementation.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'Do not implement the fix.',
        'Add focused tests only in existing test files on the live execution path.',
        'Cover claude-code/claude bridged-interactive child_process fallback prompt delivery when PTY is unavailable.',
        'Cover Windows argument handling so prompt-in-args survives .cmd/.exe resolution and delayed stdin is not required when args already carry the prompt.',
        'Cover Live Stack command construction for claude-code all-model bridged-interactive and bridged-hooks lanes without expanding unrelated matrix behavior.',
        'Use existing Vitest patterns and mocks.',
        'Return JSON: { changedFiles: string[], testFiles: string[], expectedFailCommands: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const redGateTask = defineTask('issue-339.red-test-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Confirm regression tests fail before fix',
  labels: ['issue-339', 'tdd', 'red-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'rg -n "issue #339|claude.*BI|bridged.*fallback|child_process.*fallback|prompt.*args|delayed stdin|Windows" packages/agent-mux/cli/tests packages/agent-mux/launch -g "*.ts"',
      'set +e',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/agent-mux/cli/tests/launch-bridge-interactive.test.ts packages/agent-mux/cli/tests/launch-runtime-integration.test.ts packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts',
      'status=$?',
      'set -e',
      'if [ "$status" -eq 0 ]; then',
      '  echo "Expected at least one issue #339 regression test to fail before implementation, but targeted tests passed." >&2',
      '  exit 1',
      'fi',
      'echo "Red gate passed: targeted regression suite fails before implementation."',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementFixTask = defineTask('issue-339.implement-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement focused claude-code BI fix',
  labels: ['issue-339', 'implementation', 'agent-mux'],
  agent: {
    name: 'claude-bi-fallback-implementer',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement the issue #339 fix against the failing regression tests.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'RED TEST RESULT (verbatim):',
        '---',
        args.redGateStdout,
        '---',
        'Edit the repository directly.',
        'Keep changes scoped to files on the traced live execution path.',
        'Prefer changing prompt delivery/child_process fallback behavior at the root cause over adding sleeps.',
        'Do not remove trace/artifact validation that catches bad Live Stack runs.',
        'Preserve unrelated worktree changes.',
        'Return JSON: { changedFiles: string[], summary: string, rootCauseAddressed: string, verificationNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyFixTask = defineTask('issue-339.verify-fix', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run targeted deterministic verification',
  labels: ['issue-339', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/agent-mux/cli/tests/launch-bridge-interactive.test.ts packages/agent-mux/cli/tests/launch-runtime-integration.test.ts packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts packages/agent-catalog/src/catalog.test.ts packages/sdk/src/harness/amuxFallbackMetadata.contract.test.ts',
      'npm run build --workspace=@a5c-ai/agent-launch-mux',
      'npm run build --workspace=@a5c-ai/agent-mux-cli',
      'npm run build --workspace=@a5c-ai/agent-catalog',
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

const readArtifactsTask = defineTask('issue-339.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed artifacts for review',
  labels: ['issue-339', 'review', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/agent-mux/launch packages/agent-mux/cli/tests packages/agent-catalog packages/sdk/src/harness .github/workflows/live-stack.yml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-339.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review fix against issue spec',
  labels: ['issue-339', 'review', 'quality-gate'],
  agent: {
    name: 'claude-bi-fallback-reviewer',
    prompt: {
      role: 'senior runtime reviewer',
      task: 'Compare issue #339 requirements to the final artifacts.',
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
        'Check that tests preceded implementation, the fix is on the live execution path, and deterministic verification passed.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const liveVerificationPlanTask = defineTask('issue-339.live-stack-verification-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Live Stack verification plan',
  labels: ['issue-339', 'live-stack', 'ci'],
  agent: {
    name: 'live-stack-verification-planner',
    prompt: {
      role: 'CI verification engineer',
      task: 'Prepare the exact post-fix Live Stack verification commands and acceptance criteria.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'LIVE VERIFICATION INPUTS (verbatim JSON):',
        '---',
        JSON.stringify(args.liveVerification ?? {}, null, 2),
        '---',
        'Produce a concise plan to dispatch Ubuntu and Windows Live Stack workflow runs for claude-code across the listed model matrix.',
        'Include NI control cells, bridged-interactive cells, and bridged-hooks plugin cells where listed.',
        'Acceptance: Ubuntu and Windows claude-code bridged lanes pass for all requested models, or any failure is proven unrelated by artifacts.',
        'List artifacts to inspect: agent-mux-events, transport-mux-trace, provider-trace-redacted, plugin-command-transcript when applicable, and Live Stack reports.',
        'Return JSON: { commands: string[], acceptanceCriteria: string[], artifactChecklist: string[], blockingNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 339;
  const targetFiles = inputs?.targetFiles ?? [];
  const liveVerification = inputs?.liveVerification ?? {};

  const context = await ctx.task(readContextTask, { issueNumber, targetFiles }, {
    key: 'issue-339.context',
  });

  const diagnosis = await ctx.task(diagnoseTask, {
    contextStdout: context?.stdout ?? '',
  }, {
    key: 'issue-339.diagnosis',
  });

  await ctx.breakpoint({
    title: 'Diagnosis Gate',
    question: 'Review the issue #339 root-cause diagnosis and approve proceeding to regression-test authoring and implementation.',
    context: {
      runId: ctx.runId,
      files: [
        { path: `tasks/issue-339.diagnosis/output.json`, format: 'code', language: 'json', label: 'Diagnosis' },
      ],
    },
  });

  const testAuthoring = await ctx.task(authorRegressionTestsTask, {
    contextStdout: context?.stdout ?? '',
    diagnosis,
  }, {
    key: 'issue-339.tests',
  });

  const redGate = await ctx.task(redGateTask, {
    testAuthoring,
  }, {
    key: 'issue-339.red-gate',
  });

  const implementation = await ctx.task(implementFixTask, {
    contextStdout: context?.stdout ?? '',
    diagnosis,
    redGateStdout: redGate?.stdout ?? '',
  }, {
    key: 'issue-339.implementation',
  });

  const verification = await ctx.task(verifyFixTask, {
    implementation,
  }, {
    key: 'issue-339.verification',
  });

  const artifacts = await ctx.task(readArtifactsTask, {}, {
    key: 'issue-339.artifacts',
  });

  const review = await ctx.task(finalReviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  }, {
    key: 'issue-339.review',
  });

  const liveVerificationPlan = await ctx.task(liveVerificationPlanTask, {
    contextStdout: context?.stdout ?? '',
    liveVerification,
  }, {
    key: 'issue-339.live-verification-plan',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'diagnosis', 'tests', 'red-gate', 'implementation', 'verification', 'review'],
      diagnosis,
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
      liveVerificationPlan,
    };
  }

  return {
    success: true,
    phases: ['context', 'diagnosis', 'tests', 'red-gate', 'implementation', 'verification', 'review', 'live-verification-plan'],
    diagnosis,
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    liveVerificationPlan,
  };
}
