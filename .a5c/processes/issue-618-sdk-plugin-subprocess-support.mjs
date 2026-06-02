/**
 * @process repo/issue-618-sdk-plugin-subprocess-support
 * @description Implement SDK plugin-mode subprocess support with TDD, explicit local support mode, lifecycle cleanup, and regression gates.
 * @inputs { issueNumber?: number, baseBranch?: string, branchName?: string, maxAttempts?: number }
 * @outputs { success, attempts, runtimeCallPaths, changedFiles, tests, verification, review }
 *
 * @process cradle/feature-implementation-contribute
 * @process methodologies/metaswarm/metaswarm-execution-loop
 * @process processes/shared/tdd-triplet
 * @process processes/shared/completeness-gate
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readSpecTask = defineTask('issue-618.read-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #618 and plugin-mode design context',
  labels: ['issue-618', 'sdk', 'plugins', 'spec'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- docs/agent-mux-babysitter-integrations/plugin-mode.md ---\\n"',
      'sed -n "1,170p" docs/agent-mux-babysitter-integrations/plugin-mode.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const traceRuntimeTask = defineTask('issue-618.trace-runtime', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Trace subprocess runtime and plugin orchestration path',
  labels: ['issue-618', 'sdk', 'runtime-trace'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "\\n--- subprocess support references ---\\n"',
      'rg -n "subprocessSupport|runSubprocessIntrinsic|ctx\\.subprocess|kind: \\"subprocess\\"|onCleanup|cleanupCallbacks|flushProcessCleanup" packages/sdk packages/tula-platform docs -g "*.ts" -g "*.md"',
      'printf "\\n--- subprocess intrinsic ---\\n"',
      'sed -n "1,130p" packages/sdk/src/runtime/intrinsics/subprocess.ts',
      'printf "\\n--- runtime types ---\\n"',
      'sed -n "180,240p" packages/sdk/src/runtime/types.ts',
      'printf "\\n--- process context support and cleanup ---\\n"',
      'sed -n "1,230p" packages/sdk/src/runtime/processContext.ts',
      'printf "\\n--- replay/orchestrate plumbing ---\\n"',
      'sed -n "1,115p" packages/sdk/src/runtime/replay/createReplayEngine.ts',
      'sed -n "245,270p" packages/sdk/src/runtime/orchestrateIteration.ts',
      'printf "\\n--- plugin stop hook / unified adapter surfaces ---\\n"',
      'sed -n "140,190p" packages/sdk/src/harness/unified/adapter.ts',
      'sed -n "405,540p" packages/sdk/src/harness/hooks/stopHookHandler.ts',
      'printf "\\n--- agent-platform enabling sites ---\\n"',
      'sed -n "632,646p" packages/tula-platform/src/harness/internal/createRun/orchestration/effects.ts',
      'sed -n "140,153p" packages/tula-platform/src/api/runs.ts',
      'printf "\\n--- existing subprocess tests ---\\n"',
      'sed -n "90,155p" packages/sdk/src/runtime/__tests__/intrinsics.behaviors.test.ts',
      'printf "\\n--- cleanup tests ---\\n"',
      'sed -n "35,210p" packages/sdk/src/runtime/__tests__/orchestrateIteration.integration.test.ts',
      'printf "\\n--- package verification commands ---\\n"',
      'node -e "const root=require(\'./package.json\'); const sdk=require(\'./packages/sdk/package.json\'); console.log(JSON.stringify({root: root.scripts, sdk: sdk.scripts}, null, 2))"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 240000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const architectureTask = defineTask('issue-618.architecture-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan subprocess support architecture from live runtime path',
  labels: ['issue-618', 'architecture', 'runtime-call-path'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime architect',
      task: 'Create the implementation architecture for SDK plugin-mode subprocess support.',
      instructions: [
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
        '',
        'RUNTIME TRACE (verbatim):',
        '---',
        args.runtimeTraceStdout,
        '---',
        '',
        'Trace the live execution path from plugin stop-hook iteration to ctx.subprocess() effect creation.',
        'Preserve disabled mode as a hard block.',
        'Choose one explicit local/plugin support mode name and carry it consistently through public/internal types.',
        'Do not widen agent-platform behavior except where shared typing requires it.',
        'Plan lifecycle cleanup for local plugin subprocesses on plugin/run exit, failure, and cancellation, using existing ctx.onCleanup/process cleanup mechanisms where possible.',
        'Identify regression tests before implementation and include exact target files.',
        'Return JSON: { runtimeCallPaths: string[], modeName: string, implementationScope: string[], testPlan: string[], lifecyclePlan: string[], riskControls: string[], qualityGates: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const writeTestsTask = defineTask('issue-618.write-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing regression tests before implementation',
  labels: ['issue-618', 'tdd', 'tests-first'],
  agent: {
    name: 'sdk-test-engineer',
    prompt: {
      role: 'senior SDK test engineer practicing strict TDD',
      task: 'Write regression tests for issue #618 before implementation.',
      instructions: [
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
        '',
        'ARCHITECTURE PLAN (verbatim):',
        '---',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '---',
        '',
        'Do not read files under implementation directories. Author tests strictly from the spec text above and the architecture plan.',
        'You may inspect existing test files and test helpers to match local style.',
        'Tests must fail against the current implementation and cover: disabled still throws, agent-platform still emits subprocess effects, plugin/local mode emits subprocess effects, plugin-mode orchestration intentionally passes the new support mode, and lifecycle cleanup behavior for local subprocesses.',
        'Keep tests scoped to SDK runtime/harness test files already identified by the architecture plan unless a new focused fixture is necessary.',
        'Return JSON: { testsWritten: string[], expectedInitialFailures: string[], notes: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const runTargetedTestsTask = defineTask('issue-618.run-targeted-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run targeted SDK regression tests (${args.stage})`,
  labels: ['issue-618', 'verification', 'targeted-tests'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run test --workspace=@a5c-ai/babysitter-sdk -- src/runtime/__tests__/intrinsics.behaviors.test.ts src/runtime/__tests__/orchestrateIteration.integration.test.ts src/cli/__tests__/cliRuns.test.ts src/harness/unified/__tests__/e2e-integration.test.ts src/harness/__tests__/harness.test.ts',
    ].join('\n'),
    expectedExitCode: args.expectFailure ? 1 : 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-618.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement plugin-local subprocess support',
  labels: ['issue-618', 'implementation', 'sdk', 'plugins'],
  agent: {
    name: 'sdk-runtime-implementer',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Implement SDK plugin-mode subprocess support for issue #618.',
      instructions: [
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specStdout,
        '---',
        '',
        'ARCHITECTURE PLAN (verbatim):',
        '---',
        JSON.stringify(args.architecture ?? {}, null, 2),
        '---',
        '',
        'TESTS-FIRST RESULT (verbatim):',
        '---',
        JSON.stringify(args.tests ?? {}, null, 2),
        '---',
        '',
        'Edit the repository directly.',
        'Keep changes scoped to files on the runtime call paths and tests identified above.',
        'Preserve the disabled subprocessSupport path as a hard failure.',
        'Keep the agent-platform subprocess path behavior-compatible.',
        'Make plugin-mode orchestration opt into the new local/plugin support mode intentionally.',
        'Tie local subprocess lifecycle cleanup to the existing process/plugin cleanup path; do not introduce orphan-prone subprocess behavior.',
        'Do not change unrelated plugin, process-library, or agent-platform behavior.',
        'Return JSON: { changedFiles: string[], summary: string, testsAddedOrUpdated: string[], lifecycleHandling: string[], followUpRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-618.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run SDK subprocess support quality gates',
  labels: ['issue-618', 'quality-gate', 'sdk'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run test --workspace=@a5c-ai/babysitter-sdk -- src/runtime/__tests__/intrinsics.behaviors.test.ts src/runtime/__tests__/orchestrateIteration.integration.test.ts src/cli/__tests__/cliRuns.test.ts src/harness/unified/__tests__/e2e-integration.test.ts src/harness/__tests__/harness.test.ts',
      'npm run build:sdk',
      'npm run test:sdk',
      'npm run verify:metadata',
      'if rg -n "only supported when the run is iterated by agent-platform|subprocessSupport\\?: \\"disabled\\" \\| \\"agent-platform\\"|subprocessSupport: \\"disabled\\" \\| \\"agent-platform\\"" packages/sdk/src; then echo "stale agent-platform-only subprocess support gate remains"; exit 1; fi',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-618.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read implementation artifacts for final review',
  labels: ['issue-618', 'review', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
      'printf "\\n--- changed files ---\\n"',
      'git diff --name-only -- packages/sdk packages/tula-platform docs plugins .a5c',
      'printf "\\n--- implementation diff ---\\n"',
      'git diff -- packages/sdk/src/runtime packages/sdk/src/harness packages/sdk/src/testing packages/tula-platform docs/agent-mux-babysitter-integrations/plugin-mode.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-618.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fresh final review against spec and artifacts',
  labels: ['issue-618', 'review', 'adversarial'],
  agent: {
    name: 'sdk-runtime-reviewer',
    prompt: {
      role: 'senior SDK runtime reviewer',
      task: 'Review the implementation for issue #618 against the spec.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Do not summarize either block -- compare line by line.',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Check for disabled-mode preservation, explicit plugin/local mode plumbing, agent-platform regression safety, lifecycle cleanup, and test coverage.',
        'Return JSON: { approved: boolean, findings: string[], missingCoverage: string[], residualRisk: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 618;
  const maxAttempts = inputs?.maxAttempts ?? 3;

  const spec = await ctx.task(readSpecTask, { issueNumber }, { key: 'issue-618.spec' });
  const runtimeTrace = await ctx.task(traceRuntimeTask, {}, { key: 'issue-618.runtime-trace' });

  const architecture = await ctx.task(architectureTask, {
    specStdout: spec.stdout,
    runtimeTraceStdout: runtimeTrace.stdout,
  }, { key: 'issue-618.architecture' });

  const tests = await ctx.task(writeTestsTask, {
    specStdout: spec.stdout,
    architecture,
  }, { key: 'issue-618.tests-first' });

  await ctx.task(runTargetedTestsTask, {
    stage: 'red',
    expectFailure: true,
  }, { key: 'issue-618.tests-red' });

  let verification = null;
  let review = null;
  let implementation = null;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    implementation = await ctx.task(implementTask, {
      specStdout: spec.stdout,
      architecture,
      tests,
      previousReview: review,
      attempt: attempts,
    }, { key: `issue-618.implementation.${attempts}` });

    verification = await ctx.task(verifyTask, {
      implementation,
      attempt: attempts,
    }, { key: `issue-618.verification.${attempts}` });

    const artifacts = await ctx.task(readArtifactsTask, {}, { key: `issue-618.artifacts.${attempts}` });
    review = await ctx.task(reviewTask, {
      specStdout: spec.stdout,
      artifactsStdout: artifacts.stdout,
      verification,
      attempt: attempts,
    }, { key: `issue-618.review.${attempts}` });

    if (review?.approved === true) {
      return {
        success: true,
        attempts,
        runtimeCallPaths: architecture?.runtimeCallPaths ?? [],
        changedFiles: implementation?.changedFiles ?? [],
        tests,
        verification,
        review,
      };
    }
  }

  await ctx.breakpoint({
    title: 'Issue #618 Review Escalation',
    question: `Issue #618 did not pass final review after ${maxAttempts} attempts. Review findings and decide whether to continue manually.`,
    context: {
      runId: ctx.runId,
      review,
      verification,
      runtimeCallPaths: architecture?.runtimeCallPaths ?? [],
    },
  });

  return {
    success: false,
    attempts,
    runtimeCallPaths: architecture?.runtimeCallPaths ?? [],
    changedFiles: implementation?.changedFiles ?? [],
    tests,
    verification,
    review,
  };
}
