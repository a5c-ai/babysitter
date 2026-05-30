/**
 * @process repo/issue-584-decouple-process-env-mutation
 * @description Implement issue #584 by replacing hidden in-process process.env mutation with typed env/config contracts and explicit scoped config.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, maxIterations?: number, targetFiles: string[], regressionTestFiles: string[], verificationCommands: string[] }
 * @outputs { success, phases, runtimeCallPaths, changedFiles, verification, review }
 *
 * @process cradle/bugfix
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process processes/shared/tdd-triplet
 * @process processes/shared/completeness-gate
 * @agent code-reviewer specializations/web-development/agents/code-reviewer/AGENT.md
 * @agent api-architect specializations/web-development/agents/api-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readIssueAndRepoContextTask = defineTask('issue-584.read-issue-and-repo-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #584 and env-coupling code context',
  labels: ['issue-584', 'context', 'env-contract'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- docs/here-be-dragons env coupling section ---\\n"',
      'sed -n "25,75p" docs/here-be-dragons.md',
      'printf "\\n--- current env mutation/read surfaces ---\\n"',
      'rg -n "process\\\\.env|configureAzureOpenAiEnvDefaults|setConfigValue|AMUX_LOG_LEVEL|AMUX_OBSERVABILITY_MODE|AZURE_OPENAI" packages/agent-platform/src/harness/piWrapper/moduleSupport.ts packages/agent-platform/src/harness/piWrapper.ts packages/agent-core/src/session.ts packages/agent-core/src/agenticTools/config/state.ts packages/agent-platform/src/harness/agenticTools/config/state.ts packages/agent-mux/cli/src/index.ts docs/here-be-dragons.md',
      'printf "\\n--- package scripts ---\\n"',
      'node -e "const p=require(\'./package.json\'); console.log(JSON.stringify({scripts:p.scripts}, null, 2))"',
      'printf "\\n--- git status ---\\n"',
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

const traceRuntimeConfigPathsTask = defineTask('issue-584.trace-runtime-config-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace live env/config runtime paths',
  labels: ['issue-584', 'runtime-trace', 'architecture'],
  agent: {
    name: 'env-config-architect',
    prompt: {
      role: 'senior TypeScript architecture engineer',
      task: 'Trace the live runtime config paths for issue #584 before any implementation work.',
      instructions: [
        'ISSUE_AND_REPO_CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this task.',
        'Trace writer-to-reader call paths for Azure OpenAI defaults, agent-core config state, agent-platform config state, and agent-mux CLI logging flags.',
        'Classify each process.env use as an external process boundary read/write, a compatibility read, or hidden in-process mutable config.',
        'Identify the smallest shared contract location that can be imported without creating package cycles.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], allowedEnvBoundaries: string[], mutationSitesToRemove: string[], affectedFiles: string[], proposedContractLocation: string, risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorRegressionTestsTask = defineTask('issue-584.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression tests before implementation',
  labels: ['issue-584', 'tdd', 'tests'],
  agent: {
    name: 'strict-tdd-test-writer',
    prompt: {
      role: 'senior TypeScript engineer practicing strict TDD',
      task: 'Write failing regression tests for issue #584 before implementation changes.',
      instructions: [
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.contextStdout,
        '---',
        'Do not read files under implementation directories. Author tests strictly from spec text above.',
        'Write or update tests only. Do not edit implementation files.',
        'Create tests that fail while hidden in-process process.env mutation remains the config transport.',
        'Cover Azure OpenAI default synthesis without mutating process.env, global/run-scoped config state without permanent env writes, and agent-mux logging flag propagation without AMUX_* mutation.',
        'Target these test files unless existing adjacent tests make a clearly better local fit:',
        JSON.stringify(args.regressionTestFiles, null, 2),
        'Return JSON: { testFiles: string[], testsWritten: number, summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const runRedTestsTask = defineTask('issue-584.run-red-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run new regression tests and confirm red state',
  labels: ['issue-584', 'tdd', 'red'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts ' + args.regressionTestFiles.map((file) => JSON.stringify(file)).join(' '),
    ].join('\n'),
    expectedExitCode: 1,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const designContractTask = defineTask('issue-584.design-env-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design typed env/config contract and migration plan',
  labels: ['issue-584', 'design', 'env-contract'],
  agent: {
    name: 'typed-config-architect',
    prompt: {
      role: 'senior TypeScript package architect',
      task: 'Design the typed env/config contract and staged refactor for issue #584.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        '---',
        'RED_TESTS (verbatim):',
        '---',
        JSON.stringify(args.redTests ?? {}, null, 2),
        '---',
        'Define a central typed registry for AZURE_OPENAI_*, AMUX_*, BABYSITTER_*, and model/provider keys named by existing behavior.',
        'Plan scoped config objects and dependency injection so readers consume explicit config values rather than relying on writer init order.',
        'Preserve true process-boundary env snapshots for child processes and external CLI/API contracts.',
        'Avoid package cycles and avoid broad unrelated env cleanup.',
        'Return JSON: { contractLocation: string, scopedConfigTypes: string[], migrationSteps: string[], compatibilityRules: string[], filesToEdit: string[], verificationPlan: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementRefactorTask = defineTask('issue-584.implement-refactor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement process.env decoupling iteration ${args.iteration}`,
  labels: ['issue-584', 'implementation', 'env-contract'],
  agent: {
    name: 'env-config-refactorer',
    prompt: {
      role: 'senior TypeScript refactoring engineer',
      task: 'Implement issue #584 using the approved contract design and failing tests.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        '---',
        'CONTRACT_DESIGN (verbatim):',
        '---',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
        '---',
        'PREVIOUS_FEEDBACK (verbatim):',
        '---',
        args.previousFeedback ? JSON.stringify(args.previousFeedback, null, 2) : 'none',
        '---',
        'Edit the repository directly.',
        'Keep implementation scoped to files on the traced runtime paths and the regression tests.',
        'Remove hidden process.env writes from the issue-listed writers; keep env propagation only at true process boundaries.',
        'Prefer shared implementation over duplicated agent-core and agent-platform config state when it avoids cycles.',
        'Update docs/here-be-dragons.md only if the hazard is genuinely mitigated.',
        'Preserve unrelated dirty workspace files.',
        'Return JSON: { changedFiles: string[], summary: string, testsAdded: string[], residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyFocusedTask = defineTask('issue-584.verify-focused', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run focused env/config verification iteration ${args.iteration}`,
  labels: ['issue-584', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      ...args.verificationCommands,
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const auditRemainingMutationsTask = defineTask('issue-584.audit-remaining-env-mutations', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Audit targeted files for remaining hidden env writes',
  labels: ['issue-584', 'static-audit', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      '! rg -n "process\\\\.env(\\\\[[^\\\\]]+\\\\]|\\\\.[A-Z0-9_]+)\\\\s*=" ' + args.mutationFiles.map((file) => JSON.stringify(file)).join(' '),
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-584.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final diff artifacts',
  labels: ['issue-584', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- . ":!.codex/**" ":!plugins/babysitter/**" ":!.agents/plugins/marketplace.json"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewAgainstSpecTask = defineTask('issue-584.review-against-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review env/config refactor against issue #584',
  labels: ['issue-584', 'review', 'quality-gate'],
  agent: {
    name: 'env-config-reviewer',
    prompt: {
      role: 'code reviewer focused on TypeScript configuration architecture',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Verify that test coverage was added before implementation and remains meaningful.',
        'Verify hidden in-process process.env writes were removed from issue-listed writers without breaking legitimate env reads or process-boundary propagation.',
        'Return JSON: { approved: boolean, issues: string[], changedFiles: string[], summary: string, residualRisk: string[] }.',
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
        '',
        'STATIC AUDIT OUTPUT (verbatim):',
        '---',
        args.auditStdout,
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const maxIterations = inputs.maxIterations ?? 2;

  const context = await ctx.task(readIssueAndRepoContextTask, {
    issueNumber: inputs.issueNumber,
  }, { key: 'issue-584.context' });

  const contextStdout = context?.stdout ?? JSON.stringify(context, null, 2);

  const runtimeTrace = await ctx.task(traceRuntimeConfigPathsTask, {
    contextStdout,
  }, { key: 'issue-584.runtime-trace' });

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    contextStdout,
    regressionTestFiles: inputs.regressionTestFiles,
  }, { key: 'issue-584.regression-tests' });

  const redTests = await ctx.task(runRedTestsTask, {
    regressionTestFiles: inputs.regressionTestFiles,
  }, { key: 'issue-584.red-tests' });

  const contractDesign = await ctx.task(designContractTask, {
    contextStdout,
    runtimeTrace,
    redTests,
  }, { key: 'issue-584.contract-design' });

  await ctx.breakpoint({
    title: 'Approve Env Contract Architecture',
    question: [
      'Review the traced runtime paths and typed env/config contract design before implementation.',
      'Approve only if the design preserves process-boundary env behavior while removing hidden in-process mutation.',
    ].join('\n'),
    expert: 'owner',
    tags: ['architecture-gate', 'issue-584'],
    context: { runId: ctx.runId },
  });

  let implementation = null;
  let verification = null;
  let audit = null;
  let review = null;
  let artifacts = null;
  let previousFeedback = null;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    implementation = await ctx.task(implementRefactorTask, {
      contextStdout,
      runtimeTrace,
      contractDesign,
      previousFeedback,
      iteration,
    }, { key: `issue-584.implementation.${iteration}` });

    verification = await ctx.task(verifyFocusedTask, {
      iteration,
      verificationCommands: inputs.verificationCommands,
    }, { key: `issue-584.verification.${iteration}` });

    audit = await ctx.task(auditRemainingMutationsTask, {
      mutationFiles: inputs.mutationFiles,
    }, { key: `issue-584.static-audit.${iteration}` });

    artifacts = await ctx.task(readArtifactsTask, {}, { key: `issue-584.artifacts.${iteration}` });

    review = await ctx.task(reviewAgainstSpecTask, {
      contextStdout,
      artifactsStdout: artifacts?.stdout ?? JSON.stringify(artifacts, null, 2),
      verificationStdout: verification?.stdout ?? JSON.stringify(verification, null, 2),
      auditStdout: audit?.stdout ?? JSON.stringify(audit, null, 2),
    }, { key: `issue-584.review.${iteration}` });

    if (review?.approved === true) {
      break;
    }
    previousFeedback = review;
  }

  if (review?.approved !== true) {
    await ctx.breakpoint({
      title: 'Issue #584 Review Did Not Pass',
      question: 'The automated review did not approve the implementation within the configured iterations. Review the findings and decide whether to continue with a new iteration.',
      expert: 'owner',
      tags: ['review-gate', 'issue-584'],
      context: { runId: ctx.runId },
    });
  }

  return {
    success: review?.approved === true,
    phases: [
      'issue-context',
      'runtime-call-path-trace',
      'regression-tests-first',
      'red-test-confirmation',
      'typed-contract-design',
      'implementation-loop',
      'focused-verification',
      'static-mutation-audit',
      'spec-review',
    ],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    changedFiles: review?.changedFiles ?? implementation?.changedFiles ?? [],
    verification,
    audit,
    review,
  };
}
