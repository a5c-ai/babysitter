/**
 * @process issue-634-tasks-mux-routing-hub-gaps
 * @description Implement tasks-mux routing-hub task-management gaps with runtime-read specs, TDD, backend parity, and release gates.
 * @process methodologies/top-down
 * @process processes/shared/tdd-triplet
 * @process processes/shared/completeness-gate
 * @process specializations/cli-mcp-development/cli-command-structure-design
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent coder methodologies/maestro/agents/coder/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const SPEC_COMMAND = [
  'set -euo pipefail',
  'echo "# Issue #634"',
  'gh issue view 634 --json title,body,labels,comments',
  'echo',
  'echo "# Canonical related issue #596"',
  'gh issue view 596 --json title,body,labels,comments',
  'echo',
  'echo "# docs/agent-layer-gaps.md tasks-mux section"',
  "awk '/^## tasks-mux /,/^---$/' docs/agent-layer-gaps.md",
  'echo',
  'echo "# docs/agent-mux-babysitter-integrations/tasks-mux-routing.md"',
  'cat docs/agent-mux-babysitter-integrations/tasks-mux-routing.md',
].join('\n');

const RUNTIME_TRACE_COMMAND = [
  'set -euo pipefail',
  'echo "# tasks-mux package files"',
  "rg --files packages/tasks-mux | sort",
  'echo',
  'echo "# current symbols relevant to issue #634"',
  "rg -n \"BreakpointStatus|Urgency|priority|dependsOn|history|audit|search|bulk|claimBreakpoint|listPendingBreakpoints|answerBreakpoint|cancelBreakpoint|McpServer|createBreakpointsCommand\" packages/tasks-mux docs/agent-layer-gaps.md docs/agent-mux-babysitter-integrations/tasks-mux-routing.md",
  'echo',
  'echo "# package scripts"',
  "node -e \"const p=require('./packages/tasks-mux/package.json'); console.log(JSON.stringify(p.scripts,null,2))\"",
].join('\n');

const ARTIFACT_COMMAND = [
  'set -euo pipefail',
  'git status --short',
  'echo',
  'echo "# changed files"',
  'git diff --name-only',
  'echo',
  'echo "# changed diff"',
  'git diff -- packages/tasks-mux docs .a5c/processes',
].join('\n');

export async function process(inputs, ctx) {
  const spec = await ctx.task(readSpecTask, {
    issueNumber: inputs.issueNumber,
    canonicalIssueNumber: inputs.canonicalIssueNumber,
  });

  const runtimeTrace = await ctx.task(traceRuntimeTask, {
    packageName: inputs.packageName,
  });

  const architecture = await ctx.task(architectureTask, {
    specStdout: spec.stdout,
    runtimeTraceStdout: runtimeTrace.stdout,
    targetPaths: inputs.targetPaths,
    constraints: inputs.constraints,
  });

  await ctx.task(writeAcceptanceTestsTask, {
    specStdout: spec.stdout,
    runtimeTraceStdout: runtimeTrace.stdout,
    architecture,
    targetPaths: inputs.targetPaths,
  });

  await ctx.task(runRedGateTask, { command: inputs.targetedTestCommand });

  const implementationSlices = [
    {
      id: 'schema-backend-contract',
      title: 'Schema and backend contract',
      focus: [
        'Add canonical priority, dependency, richer status, status-history, audit, search, and bulk-operation types.',
        'Add backend interface methods and shared state-transition validation primitives.',
        'Keep existing breakpoint JSON readable through defaults or migration helpers.',
      ],
      verificationCommand: inputs.contractVerificationCommand,
    },
    {
      id: 'git-native-persistence',
      title: 'Git-native persistence and behavior',
      focus: [
        'Persist new fields, status history, and audit entries in breakpoint JSON.',
        'Implement dependency blocking, search filters, state validation, and bulk operations for git-native.',
        'Avoid indexing complexity unless tests prove filesystem scanning is insufficient for the requested API.',
      ],
      verificationCommand: inputs.gitNativeVerificationCommand,
    },
    {
      id: 'server-github-client-parity',
      title: 'Server, GitHub Issues, and client parity',
      focus: [
        'Carry the backend contract through server and GitHub Issues backends.',
        'Expose client methods without diverging semantics across transports.',
        'Document or gate unsupported backend capabilities explicitly if a backend cannot faithfully support one operation.',
      ],
      verificationCommand: inputs.backendParityVerificationCommand,
    },
    {
      id: 'cli-mcp-docs',
      title: 'CLI, MCP, and docs surface',
      focus: [
        'Expose search, bulk approve, bulk close, bulk reassign, assignment/status operations, and status/audit visibility.',
        'Keep CLI JSON output and table output consistent with existing command style.',
        'Update README/setup/expert docs and packaged-surface expectations.',
      ],
      verificationCommand: inputs.surfaceVerificationCommand,
    },
  ];

  const sliceResults = [];
  for (const slice of implementationSlices) {
    const result = await executeSlice(ctx, {
      slice,
      specStdout: spec.stdout,
      runtimeTraceStdout: runtimeTrace.stdout,
      architecture,
      maxRefinementAttempts: inputs.maxRefinementAttempts ?? 2,
    });
    sliceResults.push(result);
  }

  await ctx.task(runShellGateTask, {
    title: 'Full tasks-mux test suite',
    command: inputs.fullTestCommand,
  });
  await ctx.task(runShellGateTask, {
    title: 'Tasks-mux lint',
    command: inputs.lintCommand,
  });
  await ctx.task(runShellGateTask, {
    title: 'Tasks-mux typecheck',
    command: inputs.typecheckCommand,
  });
  await ctx.task(runShellGateTask, {
    title: 'Tasks-mux build',
    command: inputs.buildCommand,
  });
  await ctx.task(runShellGateTask, {
    title: 'Packaged surface parity',
    command: inputs.packagedSurfaceCommand,
  });
  await ctx.task(runShellGateTask, {
    title: 'Dry-run package',
    command: inputs.packCommand,
  });
  await ctx.task(runShellGateTask, {
    title: 'Repository metadata verification',
    command: inputs.metadataCommand,
  });

  const artifacts = await ctx.task(readArtifactsTask, {});
  const finalReview = await ctx.task(finalSpecReviewTask, {
    specStdout: spec.stdout,
    artifactsStdout: artifacts.stdout,
  });

  if (finalReview.passed !== true) {
    await ctx.task(finalFixTask, {
      specStdout: spec.stdout,
      artifactsStdout: artifacts.stdout,
      finalReview,
    });

    await ctx.task(runShellGateTask, {
      title: 'Post-review full tasks-mux test suite',
      command: inputs.fullTestCommand,
    });
    await ctx.task(runShellGateTask, {
      title: 'Post-review tasks-mux typecheck',
      command: inputs.typecheckCommand,
    });
    await ctx.task(runShellGateTask, {
      title: 'Post-review packaged surface parity',
      command: inputs.packagedSurfaceCommand,
    });

    const postFixArtifacts = await ctx.task(readArtifactsTask, {});
    const postFixReview = await ctx.task(finalSpecReviewTask, {
      specStdout: spec.stdout,
      artifactsStdout: postFixArtifacts.stdout,
    });
    if (postFixReview.passed !== true) {
      throw new Error('Final spec review still failed after refinement.');
    }
  }

  return {
    success: true,
    issueNumber: inputs.issueNumber,
    canonicalIssueNumber: inputs.canonicalIssueNumber,
    packageName: inputs.packageName,
    runtimeCallPaths: architecture.runtimeCallPaths ?? [],
    implementationSlices: sliceResults,
    qualityGates: [
      inputs.targetedTestCommand,
      inputs.fullTestCommand,
      inputs.lintCommand,
      inputs.typecheckCommand,
      inputs.buildCommand,
      inputs.packagedSurfaceCommand,
      inputs.packCommand,
      inputs.metadataCommand,
    ],
    metadata: {
      processId: 'issue-634-tasks-mux-routing-hub-gaps',
      completedAt: ctx.now(),
    },
  };
}

async function executeSlice(ctx, args) {
  let lastVerification = null;

  for (let attempt = 1; attempt <= args.maxRefinementAttempts + 1; attempt += 1) {
    await ctx.task(implementationSliceTask, {
      ...args,
      attempt,
      lastVerification,
    });

    const verification = await ctx.task(runShellGateTask, {
      title: `${args.slice.title} verification`,
      command: args.slice.verificationCommand,
    });

    lastVerification = verification;
    return {
      sliceId: args.slice.id,
      title: args.slice.title,
      attempts: attempt,
      verification,
    };
  }

  throw new Error(`Slice did not converge: ${args.slice.id}`);
}

const readSpecTask = defineTask('issue-634/read-live-spec', () => ({
  kind: 'shell',
  title: 'Read issue and design specs',
  command: SPEC_COMMAND,
  expectedExitCode: 0,
  labels: ['spec', 'issue-634', 'runtime-read'],
}));

const traceRuntimeTask = defineTask('issue-634/trace-runtime', () => ({
  kind: 'shell',
  title: 'Trace current tasks-mux runtime surface',
  command: RUNTIME_TRACE_COMMAND,
  expectedExitCode: 0,
  labels: ['analysis', 'runtime-call-paths'],
}));

const architectureTask = defineTask('issue-634/architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design additive tasks-mux task-management architecture',
  agent: {
    name: 'architect',
    prompt: [
      'Role: senior TypeScript package architect.',
      'Task: design the implementation plan for the tasks-mux task-management expansion.',
      '',
      'Use only files on the live runtime path unless you identify and record a required new file.',
      'Return JSON with: runtimeCallPaths, proposedFileChanges, compatibilityPlan, stateMachinePlan, testPlan, risks.',
      '',
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
      'TARGET PATHS (from inputs):',
      JSON.stringify(args.targetPaths, null, 2),
      '',
      'CONSTRAINTS (from inputs):',
      JSON.stringify(args.constraints, null, 2),
    ].join('\n'),
    outputSchema: {
      type: 'object',
      required: ['runtimeCallPaths', 'proposedFileChanges', 'compatibilityPlan', 'stateMachinePlan', 'testPlan', 'risks'],
      properties: {
        runtimeCallPaths: { type: 'array' },
        proposedFileChanges: { type: 'array' },
        compatibilityPlan: { type: 'array' },
        stateMachinePlan: { type: 'array' },
        testPlan: { type: 'array' },
        risks: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['architecture', 'tasks-mux'],
}));

const writeAcceptanceTestsTask = defineTask('issue-634/write-acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing acceptance and compatibility tests first',
  agent: {
    name: 'test-engineer',
    prompt: [
      'Role: senior TypeScript test engineer.',
      'Task: author tests before implementation.',
      'Do not read files outside the runtime trace unless required to place tests in existing test structure.',
      'Do not change implementation files. Add or update tests only.',
      'Tests must exercise backend contract, git-native behavior, CLI/MCP surface, compatibility defaults, invalid transitions, dependencies, status history, audit log, search filters, and bulk operations according to SPEC.',
      'Return JSON with testFiles, coverageMap, and expectedInitialFailures.',
      '',
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
      'ARCHITECTURE OUTPUT:',
      JSON.stringify(args.architecture, null, 2),
      '',
      'TARGET PATHS:',
      JSON.stringify(args.targetPaths, null, 2),
    ].join('\n'),
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'coverageMap', 'expectedInitialFailures'],
      properties: {
        testFiles: { type: 'array' },
        coverageMap: { type: 'array' },
        expectedInitialFailures: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['tdd', 'tests-first', 'tasks-mux'],
}));

const runRedGateTask = defineTask('issue-634/red-gate', (args) => ({
  kind: 'shell',
  title: 'Confirm acceptance tests fail before implementation',
  command: args.command,
  expectedExitCode: 1,
  labels: ['tdd', 'red-gate'],
}));

const implementationSliceTask = defineTask('issue-634/implementation-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement slice: ${args.slice.title}`,
  agent: {
    name: 'coder',
    prompt: [
      'Role: senior TypeScript engineer.',
      `Task: implement this slice only: ${args.slice.title}.`,
      'Keep edits scoped to tasks-mux package files and docs proven relevant by the runtime trace or architecture output.',
      'Do not skip compatibility handling for existing breakpoint JSON.',
      'When adding behavior, update tests and docs in the same slice if the public surface changes.',
      'Return JSON with filesChanged, behaviorImplemented, testsUpdated, and residualRisks.',
      '',
      'SLICE FOCUS:',
      JSON.stringify(args.slice.focus, null, 2),
      '',
      'PREVIOUS VERIFICATION:',
      JSON.stringify(args.lastVerification, null, 2),
      '',
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
      'ARCHITECTURE OUTPUT:',
      JSON.stringify(args.architecture, null, 2),
    ].join('\n'),
    outputSchema: {
      type: 'object',
      required: ['filesChanged', 'behaviorImplemented', 'testsUpdated', 'residualRisks'],
      properties: {
        filesChanged: { type: 'array' },
        behaviorImplemented: { type: 'array' },
        testsUpdated: { type: 'array' },
        residualRisks: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['implementation', 'tasks-mux'],
}));

const runShellGateTask = defineTask('issue-634/shell-gate', (args) => ({
  kind: 'shell',
  title: args.title,
  command: args.command,
  expectedExitCode: 0,
  labels: ['quality-gate', 'shell'],
}));

const readArtifactsTask = defineTask('issue-634/read-artifacts', () => ({
  kind: 'shell',
  title: 'Read changed artifacts for final review',
  command: ARTIFACT_COMMAND,
  expectedExitCode: 0,
  labels: ['artifacts', 'runtime-read'],
}));

const finalSpecReviewTask = defineTask('issue-634/final-spec-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final spec-to-artifacts review',
  agent: {
    name: 'code-reviewer',
    prompt: [
      'Role: strict acceptance reviewer.',
      'Task: compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      'Return JSON with passed, missingCriteria, extraScope, compatibilityRisks, and requiredFixes.',
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
    ].join('\n'),
    outputSchema: {
      type: 'object',
      required: ['passed', 'missingCriteria', 'extraScope', 'compatibilityRisks', 'requiredFixes'],
      properties: {
        passed: { type: 'boolean' },
        missingCriteria: { type: 'array' },
        extraScope: { type: 'array' },
        compatibilityRisks: { type: 'array' },
        requiredFixes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['review', 'spec-gate'],
}));

const finalFixTask = defineTask('issue-634/final-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply final spec review fixes',
  agent: {
    name: 'coder',
    prompt: [
      'Role: senior TypeScript engineer.',
      'Task: apply only the required fixes from FINAL REVIEW, then update focused tests/docs if needed.',
      'Return JSON with filesChanged, fixesApplied, and remainingRisks.',
      '',
      'FINAL REVIEW:',
      JSON.stringify(args.finalReview, null, 2),
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
    ].join('\n'),
    outputSchema: {
      type: 'object',
      required: ['filesChanged', 'fixesApplied', 'remainingRisks'],
      properties: {
        filesChanged: { type: 'array' },
        fixesApplied: { type: 'array' },
        remainingRisks: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['refinement', 'spec-gate'],
}));
