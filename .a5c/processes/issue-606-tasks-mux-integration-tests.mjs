import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process babysitter/issue-606-tasks-mux-integration-tests
 * @description Implement the issue #606 test suite for tasks-mux based agent dispatch after dependency readiness is confirmed.
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @inputs { issueNumber: number, baseBranch: string, specPaths: string[], dependencyIssues: number[], targetTestFiles: string[], qualityGateCommands: object[] }
 * @outputs { success: boolean, readiness: object, runtimeCallPaths: object, testMatrix: object, gates: object[], finalReview: object }
 */

const DEFAULT_TIMEOUT_MS = 120000;

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 606;
  const maxRepairIterations = inputs.maxRepairIterations ?? 2;

  const issue = await ctx.task(readIssueTask, { issueNumber });
  const specs = await ctx.task(readSpecsTask, { specPaths: inputs.specPaths ?? [] });
  const dependencies = await ctx.task(readDependencyStatusTask, {
    dependencyIssues: inputs.dependencyIssues ?? [],
  });
  const inventory = await ctx.task(readCodeInventoryTask, {
    sourceGlobs: inputs.sourceGlobs ?? [],
    testGlobs: inputs.testGlobs ?? [],
    searchTerms: inputs.searchTerms ?? [],
  });

  const readiness = await ctx.task(assessDependencyReadinessTask, {
    issueStdout: outputText(issue),
    specStdout: outputText(specs),
    dependencyStdout: outputText(dependencies),
    inventoryStdout: outputText(inventory),
    dependencyIssues: inputs.dependencyIssues ?? [],
  });

  if (readiness.ready === false || readiness.status === 'blocked') {
    await ctx.breakpoint({
      title: 'Dependency Readiness',
      question: 'Issue #606 depends on foundational work. Review the readiness report and approve continuing, defer execution, or narrow to tests that are unblocked.',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/issue-606/dependency-readiness.json', format: 'code', language: 'json' },
          { path: 'artifacts/issue-606/dependency-readiness.md', format: 'markdown' },
        ],
      },
    });
  }

  const runtimeCallPaths = await ctx.task(traceRuntimeCallPathsTask, {
    issueStdout: outputText(issue),
    specStdout: outputText(specs),
    inventoryStdout: outputText(inventory),
    targetSourceFiles: inputs.targetSourceFiles ?? [],
  });

  const testMatrix = await ctx.task(buildTestMatrixTask, {
    issueStdout: outputText(issue),
    specStdout: outputText(specs),
    runtimeCallPaths,
    targetTestFiles: inputs.targetTestFiles ?? [],
  });

  await ctx.breakpoint({
    title: 'Test Matrix Review',
    question: 'Review the test matrix and runtime call-path map before any test files or workflows are edited.',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/issue-606/runtime-call-paths.md', format: 'markdown' },
        { path: 'artifacts/issue-606/test-matrix.md', format: 'markdown' },
      ],
    },
  });

  const authoredTests = await ctx.task(authorTestsTask, {
    issueStdout: outputText(issue),
    specStdout: outputText(specs),
    testMatrix,
    targetTestFiles: inputs.targetTestFiles ?? [],
    mutablePaths: inputs.mutablePaths ?? [],
  });

  const gateResults = [];
  const targetedGate = await runGate(ctx, inputs.targetedTestCommand, 'Targeted issue #606 test suite');
  gateResults.push(targetedGate);

  let currentFailures = failedGates(gateResults);
  let repairIteration = 0;
  while (currentFailures.length > 0 && repairIteration < maxRepairIterations) {
    repairIteration += 1;
    const diagnosis = await ctx.task(diagnoseGateFailuresTask, {
      issueStdout: outputText(issue),
      specStdout: outputText(specs),
      failures: currentFailures,
      authoredTests,
      repairIteration,
    });

    if (diagnosis.blockedByDependency === true) {
      await ctx.breakpoint({
        title: 'Foundation Gap',
        question: 'The test gate appears blocked by dependent implementation work rather than test defects. Review the diagnosis before continuing.',
        context: {
          runId: ctx.runId,
          files: [
            { path: 'artifacts/issue-606/gate-failure-diagnosis.md', format: 'markdown' },
            { path: 'artifacts/issue-606/gate-failure-diagnosis.json', format: 'code', language: 'json' },
          ],
        },
      });
    }

    await ctx.task(repairTestsOnlyTask, {
      issueStdout: outputText(issue),
      specStdout: outputText(specs),
      failures: currentFailures,
      diagnosis,
      mutablePaths: inputs.mutablePaths ?? [],
      repairIteration,
    });

    const retryGate = await runGate(
      ctx,
      inputs.targetedTestCommand,
      `Targeted issue #606 test suite retry ${repairIteration}`,
    );
    gateResults.push(retryGate);
    currentFailures = failedGates([retryGate]);
  }

  for (const command of inputs.qualityGateCommands ?? []) {
    const result = await runGate(ctx, command, command.title);
    gateResults.push(result);
  }

  const diff = await ctx.task(readArtifactsTask, {
    command: inputs.artifactReadCommand,
  });
  const finalReview = await ctx.task(finalSpecCoverageReviewTask, {
    issueStdout: outputText(issue),
    specStdout: outputText(specs),
    artifactsStdout: outputText(diff),
    gateResults,
  });

  if (finalReview.pass !== true) {
    await ctx.breakpoint({
      title: 'Coverage Review',
      question: 'Final coverage review did not pass. Review the report before deciding whether to iterate or defer.',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/issue-606/final-coverage-review.md', format: 'markdown' },
          { path: 'artifacts/issue-606/final-coverage-review.json', format: 'code', language: 'json' },
        ],
      },
    });
  }

  return {
    success: finalReview.pass === true && failedGates(gateResults).length === 0,
    readiness,
    runtimeCallPaths,
    testMatrix,
    gates: gateResults,
    finalReview,
    metadata: {
      issueNumber,
      baseBranch: inputs.baseBranch ?? 'staging',
      processId: 'babysitter/issue-606-tasks-mux-integration-tests',
      completedAt: ctx.now(),
    },
  };
}

async function runGate(ctx, commandConfig, fallbackTitle) {
  const command = typeof commandConfig === 'string' ? commandConfig : commandConfig?.command;
  const title = typeof commandConfig === 'string' ? fallbackTitle : commandConfig?.title ?? fallbackTitle;
  return ctx.task(shellCommandTask, {
    title,
    command,
    timeoutMs: commandConfig?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    expectedExitCode: commandConfig?.expectedExitCode ?? 0,
  });
}

function outputText(result) {
  if (typeof result === 'string') return result;
  if (result && typeof result.stdout === 'string') return result.stdout;
  if (result && typeof result.value === 'string') return result.value;
  return JSON.stringify(result ?? null, null, 2);
}

function failedGates(results) {
  return results.filter((result) => {
    if (!result) return true;
    if (result.exitCode !== undefined) return result.exitCode !== 0;
    if (result.value && typeof result.value === 'object' && result.value.exitCode !== undefined) {
      return result.value.exitCode !== 0;
    }
    if (result.success === false) return true;
    return false;
  });
}

const shellCommandTask = defineTask('issue-606/shell-command', (args, taskCtx) => ({
  kind: 'shell',
  title: args.title,
  shell: {
    command: args.command,
    timeout: args.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    expectedExitCode: args.expectedExitCode ?? 0,
  },
  expectedExitCode: args.expectedExitCode ?? 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'quality-gate'],
}));

const readIssueTask = defineTask('issue-606/read-issue', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read GitHub issue #${args.issueNumber}`,
  shell: {
    command: `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
    timeout: 60000,
    expectedExitCode: 0,
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'spec', 'github'],
}));

const readSpecsTask = defineTask('issue-606/read-specs', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #606 design sources',
  shell: {
    command: [
      'set -euo pipefail',
      'for f in "$@"; do',
      '  echo "===== ${f} ====="',
      '  sed -n "1,260p" "$f"',
      'done',
    ].join('\n'),
    args: args.specPaths ?? [],
    timeout: 60000,
    expectedExitCode: 0,
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'spec', 'docs'],
}));

const readDependencyStatusTask = defineTask('issue-606/read-dependencies', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read dependency issue status',
  shell: {
    command: [
      'set -euo pipefail',
      'for issue in "$@"; do',
      '  echo "===== issue #${issue} ====="',
      '  gh issue view "$issue" --json number,title,state,labels,body,comments',
      'done',
    ].join('\n'),
    args: (args.dependencyIssues ?? []).map(String),
    timeout: 120000,
    expectedExitCode: 0,
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'dependency-audit', 'github'],
}));

const readCodeInventoryTask = defineTask('issue-606/read-code-inventory', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read relevant code and test inventory',
  shell: {
    command: [
      'set -euo pipefail',
      'echo "===== source files ====="',
      'for pattern in "$@"; do rg --files | rg "$pattern" || true; done',
      'echo "===== search hits ====="',
      'rg -n "ResponderType|fallbackType|AgentMuxResponderBackend|ExternalTrackerBackend|responderType|tasks-mux|amuxBridge|external agent|plugin mode|stopHook" docs packages/tasks-mux/src packages/sdk/src packages/tula-platform/src .github/workflows -g "!node_modules" || true',
    ].join('\n'),
    args: [...(args.sourceGlobs ?? []), ...(args.testGlobs ?? [])],
    timeout: 120000,
    expectedExitCode: 0,
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'repo-research'],
}));

const assessDependencyReadinessTask = defineTask('issue-606/assess-dependency-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess foundational dependency readiness',
  agent: {
    name: 'architect',
    prompt: [
      'Decide whether issue #606 can be implemented now without implementing its foundational dependencies.',
      'Write artifacts/issue-606/dependency-readiness.md and artifacts/issue-606/dependency-readiness.json.',
      'Return JSON with: ready (boolean), status ("ready"|"blocked"|"partial"), blockers, unblockedTestAreas, requiredUserDecision.',
      'Do not propose production implementation work for dependency gaps; classify those as blockers or partial readiness.',
      '',
      'DEPENDENCY ISSUES (verbatim):',
      '---',
      args.dependencyStdout,
      '---',
      '',
      'REPO INVENTORY (verbatim):',
      '---',
      args.inventoryStdout,
      '---',
      '',
      'ISSUE AND DESIGN SPEC (verbatim):',
      '---',
      args.issueStdout,
      args.specStdout,
      '---',
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'dependency-audit', 'agent'],
}));

const traceRuntimeCallPathsTask = defineTask('issue-606/runtime-call-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace runtime call paths for tests',
  agent: {
    name: 'architect',
    prompt: [
      'Trace the live runtime paths that the issue #606 tests must cover.',
      'Read only the files needed to establish actual execution paths and existing test patterns.',
      'Write artifacts/issue-606/runtime-call-paths.md.',
      'Return JSON with runtimeCallPaths, relevantFiles, existingTestPatterns, and riskNotes.',
      'Do not edit source or test files in this task.',
      '',
      'REPO INVENTORY (verbatim):',
      '---',
      args.inventoryStdout,
      '---',
      '',
      'ISSUE AND DESIGN SPEC (verbatim):',
      '---',
      args.issueStdout,
      args.specStdout,
      '---',
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'architecture', 'runtime-call-paths'],
}));

const buildTestMatrixTask = defineTask('issue-606/build-test-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build issue #606 test matrix',
  agent: {
    name: 'test-engineer',
    prompt: [
      'Create a test matrix for issue #606 and map each row to target test files.',
      'Prioritize tasks-mux responder routing, plugin-mode routing, standalone routing, fallback routing, mock agent-mux, tracker backend, validation/prompt coverage, and gated live-stack coverage only where supported by the spec.',
      'Write artifacts/issue-606/test-matrix.md.',
      'Return JSON with testRows, targetFiles, fixtures, mocks, qualityGates, and deferredItems.',
      'Do not edit source or test files in this task.',
      '',
      'RUNTIME CALL PATHS (verbatim object):',
      '---',
      JSON.stringify(args.runtimeCallPaths ?? null, null, 2),
      '---',
      '',
      'ISSUE AND DESIGN SPEC (verbatim):',
      '---',
      args.issueStdout,
      args.specStdout,
      '---',
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'test-plan', 'agent'],
}));

const authorTestsTask = defineTask('issue-606/author-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author issue #606 tests and workflow coverage',
  agent: {
    name: 'test-engineer',
    prompt: [
      'Author the issue #606 test suite. Change only test files, test fixtures, and CI workflow entries listed in mutablePaths.',
      'Do not implement foundational production behavior. If a required production API is missing, write the test against the documented contract and surface the dependency gap in artifacts/issue-606/dependency-gaps.md.',
      'Use existing Vitest and workflow patterns from the repo.',
      'Do not read files under implementation directories while deciding expected behavior; author expected behavior strictly from the spec text below.',
      'Return JSON with filesChanged, testsAdded, scenariosCovered, dependencyGaps, and commandsToRun.',
      '',
      'ALLOWED MUTABLE PATHS (verbatim object):',
      '---',
      JSON.stringify(args.mutablePaths ?? [], null, 2),
      '---',
      '',
      'TEST MATRIX (verbatim object):',
      '---',
      JSON.stringify(args.testMatrix ?? null, null, 2),
      '---',
      '',
      'ISSUE AND DESIGN SPEC (verbatim):',
      '---',
      args.issueStdout,
      args.specStdout,
      '---',
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'test-authoring', 'agent'],
}));

const diagnoseGateFailuresTask = defineTask('issue-606/diagnose-gate-failures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Diagnose issue #606 gate failures attempt ${args.repairIteration}`,
  agent: {
    name: 'test-engineer',
    prompt: [
      'Diagnose failing issue #606 test gates.',
      'Classify each failure as test defect, missing foundational dependency, environment problem, or production regression exposed by the tests.',
      'Write artifacts/issue-606/gate-failure-diagnosis.md and artifacts/issue-606/gate-failure-diagnosis.json.',
      'Return JSON with blockedByDependency, testRepairs, productionGaps, environmentGaps, and recommendedNextStep.',
      '',
      'FAILING GATES (verbatim object):',
      '---',
      JSON.stringify(args.failures ?? [], null, 2),
      '---',
      '',
      'ISSUE AND DESIGN SPEC (verbatim):',
      '---',
      args.issueStdout,
      args.specStdout,
      '---',
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'diagnosis', 'agent'],
}));

const repairTestsOnlyTask = defineTask('issue-606/repair-tests-only', (args, taskCtx) => ({
  kind: 'agent',
  title: `Repair issue #606 tests only attempt ${args.repairIteration}`,
  agent: {
    name: 'test-engineer',
    prompt: [
      'Repair only issue #606 test files, fixtures, and CI workflow entries listed in mutablePaths.',
      'Do not edit production implementation files. Do not weaken assertions to pass around missing behavior.',
      'If the diagnosis says a foundational dependency is missing, add or update the dependency-gaps artifact instead of implementing that dependency.',
      'Return JSON with filesChanged, repairsMade, assertionsPreserved, and remainingGaps.',
      '',
      'ALLOWED MUTABLE PATHS (verbatim object):',
      '---',
      JSON.stringify(args.mutablePaths ?? [], null, 2),
      '---',
      '',
      'DIAGNOSIS (verbatim object):',
      '---',
      JSON.stringify(args.diagnosis ?? null, null, 2),
      '---',
      '',
      'ISSUE AND DESIGN SPEC (verbatim):',
      '---',
      args.issueStdout,
      args.specStdout,
      '---',
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'test-repair', 'agent'],
}));

const readArtifactsTask = defineTask('issue-606/read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final test artifacts for coverage review',
  shell: {
    command: args.command,
    timeout: 60000,
    expectedExitCode: 0,
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'artifact-read', 'shell'],
}));

const finalSpecCoverageReviewTask = defineTask('issue-606/final-spec-coverage-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final issue #606 spec coverage review',
  agent: {
    name: 'code-reviewer',
    prompt: [
      'Review whether the produced tests and workflow changes cover issue #606 without implementing foundational production work.',
      'Write artifacts/issue-606/final-coverage-review.md and artifacts/issue-606/final-coverage-review.json.',
      'Return JSON with pass, missingCoverage, extraScope, riskyAssertions, and gateSummary.',
      '',
      'GATE RESULTS (verbatim object):',
      '---',
      JSON.stringify(args.gateResults ?? [], null, 2),
      '---',
      '',
      'SPEC (verbatim):',
      '---',
      args.issueStdout,
      args.specStdout,
      '---',
      '',
      'ARTIFACTS (verbatim):',
      '---',
      args.artifactsStdout,
      '---',
      'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
    ].join('\n'),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['issue-606', 'coverage-review', 'agent'],
}));
