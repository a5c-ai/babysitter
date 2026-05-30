/**
 * @process repo/issue-596-tasks-mux-task-management
 * @description Plan and execute issue #596: expand tasks-mux from breakpoint routing into task-management primitives.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxImplementationAttempts: number }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - methodologies/spec-kit/spec-kit-planning.js
 * - methodologies/state-machine-orchestration.js
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 * - methodologies/planning-with-files/planning-execution.js
 * - specializations/collaboration/github/pr-policies.js
 *
 * @agent technical-planner methodologies/spec-kit/agents/technical-planner/AGENT.md
 * @agent task-analyst methodologies/spec-kit/agents/task-analyst/AGENT.md
 * @agent implementation-engineer methodologies/spec-kit/agents/implementation-engineer/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @agent api-architect specializations/web-development/agents/api-architect/AGENT.md
 * @agent unit-testing specializations/web-development/agents/unit-testing/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 596;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const implementationBranch = inputs?.implementationBranch ?? 'agent/issue-596-tasks-mux-task-management';
  const maxImplementationAttempts = inputs?.maxImplementationAttempts ?? DEFAULT_MAX_IMPLEMENTATION_ATTEMPTS;

  const specContext = await ctx.task(readSpecContextTask, { issueNumber }, {
    key: 'issue-596.read-spec-context',
  });

  const baseline = await ctx.task(readTasksMuxBaselineTask, {}, {
    key: 'issue-596.read-tasks-mux-baseline',
  });

  const architecturePlan = await ctx.task(designTaskManagementArchitectureTask, {
    specContextStdout: specContext?.stdout ?? '',
    baselineStdout: baseline?.stdout ?? '',
  }, {
    key: 'issue-596.design-task-management-architecture',
  });

  const regressionPlan = await ctx.task(authorAcceptanceTestsTask, {
    specContextStdout: specContext?.stdout ?? '',
    baselineStdout: baseline?.stdout ?? '',
    architecturePlan,
  }, {
    key: 'issue-596.author-acceptance-tests-first',
  });

  const initialTestEvidence = await ctx.task(captureExpectedFailingTestsTask, {}, {
    key: 'issue-596.capture-expected-failing-tests',
  });

  const implementationSlices = [
    {
      id: 'schema-contract',
      title: 'Schema, backend contract, migration, and transition validation',
      focus: 'Extend canonical task schema/types, preserve breakpoint compatibility, add validation for priorities, dependencies, richer statuses, history, comments, audit, and metrics primitives.',
    },
    {
      id: 'git-native-backend',
      title: 'Git-native task persistence, search, dependencies, bulk operations, history, comments, audit, and metrics',
      focus: 'Implement the new backend contract against the filesystem backend without regressing existing breakpoint files or proven-answer behavior.',
    },
    {
      id: 'server-github-backends',
      title: 'Server and GitHub Issues backend parity',
      focus: 'Map the backend-agnostic task model onto server and GitHub Issues transports with capability-aware behavior and shared compatibility tests.',
    },
    {
      id: 'cli-mcp-docs',
      title: 'CLI, MCP tools, package exports, and documentation',
      focus: 'Expose backend-agnostic commands and MCP tools for search, assign/reassign, close/cancel, bulk approve/close/reassign, comments, escalation, stats, forms/templates/rules, and update package docs/specs.',
    },
    {
      id: 'providers-and-operational-guards',
      title: 'Notifications, escalation chains, forms, audit export, and disabled-by-default provider guards',
      focus: 'Add isolated provider interfaces for notification/escalation/form behavior, keep external side effects disabled by default, and cover with mocked integration tests.',
    },
  ];

  const sliceResults = [];
  let verification = null;
  let review = null;

  for (const slice of implementationSlices) {
    let sliceComplete = false;
    for (let attempt = 1; attempt <= maxImplementationAttempts; attempt++) {
      const implementation = await ctx.task(implementSliceTask, {
        specContextStdout: specContext?.stdout ?? '',
        baselineStdout: baseline?.stdout ?? '',
        architecturePlan,
        regressionPlan,
        initialTestEvidenceStdout: initialTestEvidence?.stdout ?? '',
        previousVerification: verification,
        previousReview: review,
        slice,
        completedSlices: sliceResults,
        attempt,
      }, {
        key: `issue-596.implement.${slice.id}.${attempt}`,
      });

      verification = await ctx.task(runTargetedVerificationTask, { slice }, {
        key: `issue-596.verify.${slice.id}.${attempt}`,
      });

      const artifacts = await ctx.task(readCurrentArtifactsTask, { slice }, {
        key: `issue-596.read-artifacts.${slice.id}.${attempt}`,
      });

      review = await ctx.task(reviewSliceTask, {
        specContextStdout: specContext?.stdout ?? '',
        baselineStdout: baseline?.stdout ?? '',
        architecturePlan,
        regressionPlan,
        implementation,
        artifactsStdout: artifacts?.stdout ?? '',
        verificationStdout: verification?.stdout ?? '',
        slice,
        attempt,
      }, {
        key: `issue-596.review.${slice.id}.${attempt}`,
      });

      sliceResults.push({ slice, attempt, implementation, verification, review });

      if (verification?.passed === true && review?.approved === true) {
        sliceComplete = true;
        break;
      }
    }

    if (!sliceComplete) {
      return {
        success: false,
        phases: ['spec-context', 'baseline', 'architecture', 'tests-first', 'implementation-slices'],
        changedFiles: sliceResults.flatMap((result) => result.implementation?.changedFiles ?? []),
        runtimeCallPaths: architecturePlan?.runtimeCallPaths ?? [],
        verification,
        review,
        failedSlice: slice,
        sliceResults,
      };
    }
  }

  const finalVerification = await ctx.task(runFinalVerificationTask, {}, {
    key: 'issue-596.final-verification',
  });

  const finalArtifacts = await ctx.task(readFinalArtifactsTask, {}, {
    key: 'issue-596.read-final-artifacts',
  });

  const finalReview = await ctx.task(finalAcceptanceReviewTask, {
    specContextStdout: specContext?.stdout ?? '',
    architecturePlan,
    regressionPlan,
    finalArtifactsStdout: finalArtifacts?.stdout ?? '',
    finalVerificationStdout: finalVerification?.stdout ?? '',
    sliceResults,
  }, {
    key: 'issue-596.final-acceptance-review',
  });

  if (finalReview?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #596 Scope Decision',
      question: finalReview.question ?? 'A scope or compatibility decision is needed before publishing issue #596.',
      options: ['Proceed with reviewed implementation', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['issue-596', 'tasks-mux', 'scope-gate'],
      context: {
        runId: ctx.runId,
        finalReview,
      },
    });
  }

  const publish = finalVerification?.passed === true && finalReview?.approved === true
    ? await ctx.task(publishImplementationTask, {
      issueNumber,
      baseBranch,
      implementationBranch,
      finalReview,
      finalVerification,
    }, {
      key: 'issue-596.publish-implementation',
    })
    : null;

  return {
    success: finalVerification?.passed === true && finalReview?.approved === true,
    phases: [
      'spec-context',
      'baseline-runtime-trace',
      'architecture-design',
      'tests-first',
      'schema-contract',
      'git-native-backend',
      'server-github-backends',
      'cli-mcp-docs',
      'providers-and-operational-guards',
      'final-verification',
      'final-review',
      'publish',
    ],
    changedFiles: finalReview?.changedFiles ?? [],
    runtimeCallPaths: architecturePlan?.runtimeCallPaths ?? [],
    verification: finalVerification,
    review: finalReview,
    sliceResults,
    publish,
  };
}

export const readSpecContextTask = defineTask('issue-596.read-spec-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #596, related PR fallback, and task-management gap source',
  labels: ['issue-596', 'tasks-mux', 'spec', 'runtime-read'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr view ${args.issueNumber} --json files,title,body,comments 2>/dev/null || true`,
      'printf "\\n--- docs/agent-layer-gaps tasks-mux section ---\\n"',
      'sed -n \'/^## tasks-mux /,/^---$/p\' docs/agent-layer-gaps.md',
      'printf "\\n--- related issues mentioned from issue context ---\\n"',
      'gh issue view 577 --json title,state,body,labels 2>/dev/null || true',
      'gh issue view 597 --json title,state,body,labels 2>/dev/null || true',
      'gh issue view 634 --json title,state,body,labels 2>/dev/null || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readTasksMuxBaselineTask = defineTask('issue-596.read-tasks-mux-baseline', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read tasks-mux baseline architecture and live surfaces',
  labels: ['issue-596', 'tasks-mux', 'baseline', 'runtime-trace'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "\\n--- package scripts ---\\n"',
      'node -e "const p=require(\'./packages/tasks-mux/package.json\'); console.log(JSON.stringify({scripts:p.scripts, exports:p.exports, bin:p.bin}, null, 2))"',
      'printf "\\n--- architecture specs and docs ---\\n"',
      'sed -n "1,180p" packages/tasks-mux/specs/architecture.md',
      'sed -n "1,160p" packages/tasks-mux/README.md',
      'printf "\\n--- task mux source files ---\\n"',
      'rg --files packages/tasks-mux/src packages/tasks-mux/specs packages/tasks-mux/skills | sort',
      'printf "\\n--- current task-management feature search ---\\n"',
      'rg -n "priority|dependsOn|dependency|search|filter|bulk|assigned|in-progress|blocked|escalated|history|timeline|comment|metrics|SLA|notification|Slack|Discord|webhook|escalation|form|audit|export|transition|state machine|reassign|close|approve" packages/tasks-mux docs/agent-layer-gaps.md -g "*.ts" -g "*.md" || true',
      'printf "\\n--- existing backend and CLI/MCP contracts ---\\n"',
      'sed -n "1,260p" packages/tasks-mux/src/types.ts',
      'sed -n "1,220p" packages/tasks-mux/src/backend.ts',
      'sed -n "1,280p" packages/tasks-mux/src/backends/git-native.ts',
      'sed -n "1,240p" packages/tasks-mux/src/backends/server.ts',
      'sed -n "1,260p" packages/tasks-mux/src/backends/github-issues.ts',
      'sed -n "1,220p" packages/tasks-mux/src/cli/commands/breakpoints.ts',
      'sed -n "1,240p" packages/tasks-mux/src/mcp/server.ts',
      'printf "\\n--- existing tasks-mux tests ---\\n"',
      'rg --files packages/tasks-mux/src | rg "__tests__|\\.test\\." | sort || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designTaskManagementArchitectureTask = defineTask('issue-596.design-task-management-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design staged tasks-mux task-management architecture',
  labels: ['issue-596', 'tasks-mux', 'architecture', 'planning'],
  agent: {
    name: 'technical-planner',
    prompt: {
      role: 'senior TypeScript SDK architect',
      task: 'Design the implementation architecture and staged rollout for issue #596.',
      instructions: [
        'Use the issue and baseline outputs below as the authoritative source. Do not rely on memory of the issue.',
        'Trace runtime call paths from public package exports, CLI commands, MCP tools, harness interaction provider, and each backend to final persisted/transported task data.',
        'Separate canonical contract work from backend implementations, command/tool surfaces, provider abstractions, and documentation.',
        'Preserve existing breakpoint API compatibility unless the spec explicitly requires a breaking change; prefer additive fields, versioned migrations, and compatibility fixtures.',
        'Derive the task state machine and feature coverage from SPEC_CONTEXT, retaining existing statuses and behavior from BASELINE where compatible.',
        'Plan dependency validation, operation atomicity/error reporting, data shapes, derived metrics, provider abstractions, and export/backup behavior only where those requirements are explicitly present in SPEC_CONTEXT.',
        'Return JSON: { runtimeCallPaths: string[], targetFiles: string[], stagedDesign: object, compatibilityPlan: string[], stateMachine: object, backendParityPlan: string[], cliMcpPlan: string[], docsPlan: string[], risks: string[], outOfScope: string[] }.',
        '',
        'SPEC_CONTEXT (verbatim):',
        '---',
        args.specContextStdout,
        '---',
        '',
        'BASELINE (verbatim):',
        '---',
        args.baselineStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorAcceptanceTestsTask = defineTask('issue-596.author-acceptance-tests-first', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author issue #596 acceptance tests before implementation',
  labels: ['issue-596', 'tasks-mux', 'tests-first', 'tdd'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Author failing acceptance and compatibility tests for issue #596 before implementation changes.',
      instructions: [
        'Do not edit implementation files in this task. Add or update tests and fixtures only.',
        'Do not read files under implementation directories except test harness helpers and package public type surfaces needed to compile tests. Author tests strictly from the spec text and baseline contract below.',
        'For each gap explicitly listed in SPEC_CONTEXT, add a failing test or fixture that would catch the current missing behavior.',
        'Add compatibility fixtures proving existing breakpoint JSON and existing public operations still parse and behave.',
        'Prefer shared backend capability tests so git-native, server, and GitHub Issues parity cannot drift silently.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], fixturesAdded: string[], expectedInitialFailures: string[], verificationCommands: string[] }.',
        '',
        'SPEC_CONTEXT (verbatim):',
        '---',
        args.specContextStdout,
        '---',
        '',
        'BASELINE (verbatim):',
        '---',
        args.baselineStdout,
        '---',
        '',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan ?? {}, null, 2),
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const captureExpectedFailingTestsTask = defineTask('issue-596.capture-expected-failing-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture expected failing test evidence after tests-first phase',
  labels: ['issue-596', 'tasks-mux', 'tdd', 'red-phase'],
  shell: {
    command: [
      'set -euo pipefail',
      'status=0',
      'npm run typecheck --workspace=@a5c-ai/tasks-mux || status=$?',
      'npm run test --workspace=@a5c-ai/tasks-mux || status=$?',
      'printf "\\nexpected_red_phase_exit_code=%s\\n" "$status"',
      'test "$status" != "0"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSliceTask = defineTask('issue-596.implement-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement issue #596 slice: ${args.slice.title}`,
  labels: ['issue-596', 'tasks-mux', 'implementation'],
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'senior TypeScript SDK engineer',
      task: `Implement this issue #596 slice: ${args.slice.title}`,
      instructions: [
        'Edit the repository directly.',
        'Keep changes scoped to packages/tasks-mux and directly related docs/specs/tests unless the runtime trace proves another file is on the live execution path.',
        'Preserve existing breakpoint API compatibility unless the issue text and architecture plan require a deliberate breaking change.',
        'Use structured parsers and existing zod/type patterns. Avoid ad hoc JSON/string manipulation when a schema or typed helper is appropriate.',
        'Do not wire external email, Slack, Discord, webhook, or escalation side effects on by default; provider abstractions must be inert unless explicitly configured and tests must mock them.',
        'Maintain backend-agnostic semantics before backend-specific mappings. If a backend cannot support a feature natively, expose explicit capability/fallback behavior with tests.',
        'If SPEC_CONTEXT requires state transition validation, implement it through a shared validator rather than unrelated backend-local rules.',
        'Return JSON: { changedFiles: string[], summary: string, compatibilityNotes: string[], testsExpectedToPass: string[], residualRisk: string[] }.',
        '',
        'SLICE (verbatim JSON):',
        '---',
        JSON.stringify(args.slice, null, 2),
        '---',
        '',
        'SPEC_CONTEXT (verbatim):',
        '---',
        args.specContextStdout,
        '---',
        '',
        'BASELINE (verbatim):',
        '---',
        args.baselineStdout,
        '---',
        '',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan ?? {}, null, 2),
        '---',
        '',
        'REGRESSION_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        '---',
        '',
        'INITIAL_TEST_EVIDENCE (verbatim):',
        '---',
        args.initialTestEvidenceStdout,
        '---',
        '',
        'COMPLETED_SLICES (verbatim JSON):',
        '---',
        JSON.stringify(args.completedSlices ?? [], null, 2),
        '---',
        '',
        'PREVIOUS_VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        '---',
        '',
        'PREVIOUS_REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.previousReview ?? {}, null, 2),
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runTargetedVerificationTask = defineTask('issue-596.run-targeted-verification', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run targeted tasks-mux verification for ${args.slice.id}`,
  labels: ['issue-596', 'tasks-mux', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run typecheck --workspace=@a5c-ai/tasks-mux',
      'npm run test --workspace=@a5c-ai/tasks-mux',
      'npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-mux',
      'printf "\\npassed=true\\n"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readCurrentArtifactsTask = defineTask('issue-596.read-current-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read current artifacts after ${args.slice.id}`,
  labels: ['issue-596', 'tasks-mux', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/tasks-mux docs/agent-layer-gaps.md',
      'printf "\\n--- changed files ---\\n"',
      'git diff --name-only -- packages/tasks-mux docs/agent-layer-gaps.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewSliceTask = defineTask('issue-596.review-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #596 slice: ${args.slice.title}`,
  labels: ['issue-596', 'tasks-mux', 'review', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior TypeScript SDK reviewer',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail for this slice.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Focus on correctness, compatibility, backend parity, state-transition safety, migration safety, and test adequacy.',
        'Return JSON: { approved: boolean, issues: string[], changedFiles: string[], summary: string, residualRisk: string[] }.',
        '',
        'SLICE (verbatim JSON):',
        '---',
        JSON.stringify(args.slice, null, 2),
        '---',
        '',
        'BASELINE (verbatim):',
        '---',
        args.baselineStdout,
        '---',
        '',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan ?? {}, null, 2),
        '---',
        '',
        'REGRESSION_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        '---',
        '',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.verificationStdout,
        '---',
        '',
        'SPEC (verbatim):',
        '---',
        args.specContextStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
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

export const runFinalVerificationTask = defineTask('issue-596.run-final-verification', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run full issue #596 quality gate',
  labels: ['issue-596', 'tasks-mux', 'final-verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run lint --workspace=@a5c-ai/tasks-mux',
      'npm run typecheck --workspace=@a5c-ai/tasks-mux',
      'npm run test --workspace=@a5c-ai/tasks-mux',
      'npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-mux',
      'npm run build --workspace=@a5c-ai/tasks-mux',
      'npm pack --json --dry-run --workspace=@a5c-ai/tasks-mux',
      'npm run verify:metadata',
      'printf "\\npassed=true\\n"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readFinalArtifactsTask = defineTask('issue-596.read-final-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final issue #596 diff and public surfaces',
  labels: ['issue-596', 'tasks-mux', 'final-artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/tasks-mux docs/agent-layer-gaps.md',
      'printf "\\n--- changed files ---\\n"',
      'git diff --name-only -- packages/tasks-mux docs/agent-layer-gaps.md',
      'printf "\\n--- public exports and command surfaces after implementation ---\\n"',
      'node -e "const p=require(\'./packages/tasks-mux/package.json\'); console.log(JSON.stringify({exports:p.exports, bin:p.bin, scripts:p.scripts}, null, 2))"',
      'sed -n "1,220p" packages/tasks-mux/README.md',
      'sed -n "1,220p" packages/tasks-mux/specs/architecture.md',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceReviewTask = defineTask('issue-596.final-acceptance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final issue #596 acceptance review',
  labels: ['issue-596', 'tasks-mux', 'acceptance', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'principal TypeScript SDK reviewer',
      task: 'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      instructions: [
        'Return JSON: { approved: boolean, needsHumanDecision: boolean, question?: string, issues: string[], changedFiles: string[], coverageMatrix: object, compatibilityAssessment: string[], backendParityAssessment: string[], finalSummary: string, residualRisk: string[] }.',
        'Reject if tests were adjusted to match implementation instead of SPEC, if existing breakpoint compatibility is unproven, if backends diverge without explicit capability behavior, or if any provider can cause external side effects by default without SPEC approval.',
        '',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan ?? {}, null, 2),
        '---',
        '',
        'REGRESSION_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        '---',
        '',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.finalVerificationStdout,
        '---',
        '',
        'SLICE_RESULTS (verbatim JSON):',
        '---',
        JSON.stringify(args.sliceResults ?? [], null, 2),
        '---',
        '',
        'SPEC (verbatim):',
        '---',
        args.specContextStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.finalArtifactsStdout,
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

export const publishImplementationTask = defineTask('issue-596.publish-implementation', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue #596',
  labels: ['issue-596', 'tasks-mux', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      `current_branch="$(git branch --show-current)"`,
      `if [ "$current_branch" != "${args.implementationBranch}" ]; then git switch -c "${args.implementationBranch}"; fi`,
      'git status --short',
      'git add packages/tasks-mux docs/agent-layer-gaps.md',
      'git diff --cached --name-only',
      'if ! git diff --cached --quiet; then git commit -m "feat(tasks-mux): add task management primitives"; fi',
      `git push -u origin "${args.implementationBranch}"`,
      `PR_URL="$(gh pr list --head "${args.implementationBranch}" --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base "${args.baseBranch}" --head "${args.implementationBranch}" --title "Implement tasks-mux task management features" --body "Closes #${args.issueNumber}"$'\\n\\nAdds task-management primitives for priorities, dependencies, search/filter, bulk operations, richer states, history, comments, metrics, notification/escalation/form provider interfaces, audit/export behavior, and CLI/MCP/backend parity.')"; fi`,
      'COMMENT_BODY="$(mktemp)"',
      'cat > "$COMMENT_BODY" <<COMMENT',
      'Implemented the tasks-mux task-management expansion for issue #596.',
      '',
      'Summary:',
      '- Extended canonical schema/backend contracts for task priorities, dependencies, richer statuses, history, comments, metrics, audit/export, forms, notifications, and escalation.',
      '- Added backend parity coverage for git-native, server, and GitHub Issues semantics.',
      '- Exposed backend-agnostic CLI/MCP surfaces and updated package docs/specs.',
      '- Kept external notification/escalation providers disabled by default and covered by mocked tests.',
      '',
      'Quality gates:',
      '- npm run lint --workspace=@a5c-ai/tasks-mux',
      '- npm run typecheck --workspace=@a5c-ai/tasks-mux',
      '- npm run test --workspace=@a5c-ai/tasks-mux',
      '- npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-mux',
      '- npm run build --workspace=@a5c-ai/tasks-mux',
      '- npm pack --json --dry-run --workspace=@a5c-ai/tasks-mux',
      '- npm run verify:metadata',
      'COMMENT',
      'printf "\\nPR: %s\\n" "$PR_URL" >> "$COMMENT_BODY"',
      `gh issue comment ${args.issueNumber} --body-file "$COMMENT_BODY"`,
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
