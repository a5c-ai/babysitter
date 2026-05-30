/**
 * @process repo/issue-631-agent-mux-responder-backend
 * @description Implement issue #631: tasks-mux AgentMuxResponderBackend dispatching agent responder tasks to agent-mux adapters.
 * @inputs {
 *   issueNumber: number,
 *   baseBranch: string,
 *   branchName: string,
 *   dependencyIssues: number[],
 *   designDoc: string,
 *   targetFiles: string[],
 *   verificationCommands: string[]
 * }
 * @outputs { success: boolean, phases: object, changedFiles: string[], verification: object, delivery: object }
 *
 * Process-library research:
 * - methodologies/superpowers/test-driven-development
 * - methodologies/superpowers/verification-before-completion
 * - specializations/sdk-platform-development/sdk-testing-strategy
 * - specializations/sdk-platform-development/api-design-specification
 * - specializations/sdk-platform-development/error-handling-debugging-support
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Existing backend contract: packages/tasks-mux/src/backend.ts exposes BreakpointBackend, SubmitBreakpointParams, WaitForAnswerOptions, and BreakpointWaitResult.
 * - Existing backend registry: packages/tasks-mux/src/backends/index.ts registers git-native, github-issues, and server; agent-mux is absent.
 * - Existing types: packages/tasks-mux/src/types.ts has BreakpointRouting/BackendConfig schemas but no ResponderType or agent backend config on staging.
 * - Existing agent-mux seam: packages/agent-mux/core/src/client.ts exports createClient(); AgentMuxClient.run() returns a thenable RunHandle.
 * - Existing run result surface: packages/agent-mux/core/src/run-handle.ts exposes RunResult.text, cost, tokenUsage, exitReason, and error.
 * - No local .a5c/process-library directory exists; matching methodologies were found in /home/runner/.a5c/process-library/babysitter-repo/library.
 * - The issue body mentions amuxBridge/getAmuxClient, but repo search on staging did not find that seam. Prefer current @a5c-ai/agent-mux API unless #630/#604 descendants add a stable bridge before execution.
 *
 * Repo-specific authoring note:
 * - This process uses agent tasks instead of kind: 'shell' subtasks per docs/agent-reference/process-authoring.md.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function json(value) {
  return JSON.stringify(value ?? {}, null, 2);
}

const phase0ReuseAuditTask = defineTask('issue-631.phase0-reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse audit and dependency check',
  labels: ['issue-631', 'phase-0', 'reuse-audit', 'dependency-check'],
  agent: {
    name: 'tasks-mux-architecture-researcher',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Perform the required reuse audit before implementing issue #631.',
      instructions: [
        'Do not edit files in this phase.',
        'Read the issue and comments for the current implementation constraints.',
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Check whether dependency issue #630 has landed on this branch by inspecting tasks-mux responder type/config changes.',
        'Scan these surfaces: packages/tasks-mux/src/backend.ts, packages/tasks-mux/src/types.ts, packages/tasks-mux/src/backends/index.ts, packages/tasks-mux/src/index.ts, packages/tasks-mux/package.json, packages/agent-mux/core/src/client.ts, packages/agent-mux/core/src/run-handle.ts, docs/agent-mux-babysitter-integrations/tasks-mux-routing.md.',
        'Search for amuxBridge/getAmuxClient. If absent, plan against createClient()/AgentMuxClient.run()/await RunHandle.',
        'Identify dependency-direction risk before adding @a5c-ai/agent-mux to @a5c-ai/tasks-mux.',
        'Return JSON with: findings, dependencyState, availableIntegrationSeams, selectedSeam, affectedFiles, risks, blockerIfAny.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const phase1ContractTask = defineTask('issue-631.phase1-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1 - Write backend contract tests first',
  labels: ['issue-631', 'phase-1', 'tdd', 'tests'],
  agent: {
    name: 'tasks-mux-tdd-implementer',
    prompt: {
      role: 'senior TypeScript engineer using strict TDD',
      task: 'Add failing tests for AgentMuxResponderBackend before production implementation.',
      instructions: [
        'Edit only test and type-surface files required for RED tests.',
        'Create packages/tasks-mux/src/backends/__tests__/agent-mux.test.ts unless the repo test layout strongly prefers packages/tasks-mux/src/__tests__/agent-mux-backend.test.ts; document the chosen layout.',
        'Mock the agent-mux client seam, do not spawn real adapters.',
        'Cover successful synchronous resolution: submitBreakpoint dispatches an agent run, awaits the RunHandle, creates an answered Breakpoint, stores/returns an answer, and waitForAnswer returns immediately.',
        'Cover run option mapping: agent/adapter, prompt text, model, cwd, timeout, collectEvents/tags where supported by current types.',
        'Cover cost/token metadata mapping from RunResult and cost events without inventing an unsupported public schema; if metadata requires a type extension, make the test express that extension explicitly.',
        'Cover errors: adapter not installed/unknown, authentication failure, run timeout, aborted wait signal, non-success exitReason/error.',
        'Cover registry/schema export expectations for backend type "agent-mux".',
        'Run the focused test command and confirm the new tests fail for missing implementation, not setup errors.',
        'Return JSON with: testFiles, behaviorsCovered, redCommand, redResultSummary, typeSurfaceChangesNeeded, risks.',
      ],
      context: {
        inputs: args.inputs,
        reuseAudit: args.reuseAudit,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const phase2BackendTask = defineTask('issue-631.phase2-backend-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2 - Implement AgentMuxResponderBackend',
  labels: ['issue-631', 'phase-2', 'implementation', 'agent-mux', 'tasks-mux'],
  agent: {
    name: 'tasks-mux-backend-implementer',
    prompt: {
      role: 'senior TypeScript backend engineer',
      task: 'Implement AgentMuxResponderBackend to satisfy the RED tests and current BreakpointBackend contract.',
      instructions: [
        'Keep implementation scoped to issue #631.',
        'Create packages/tasks-mux/src/backends/agent-mux.ts.',
        'Implement the full BreakpointBackend interface: submitBreakpoint, getBreakpoint, waitForAnswer, listPendingBreakpoints, answerBreakpoint, cancelBreakpoint, and listResponders if the selected seam supports discovery.',
        'Use dependency injection for the agent-mux client/factory so tests can mock it and production can use createClient() or a newly available bridge seam.',
        'If #630 responder type work has landed, integrate with its ResponderType/backend config types. If not, add the smallest forward-compatible AgentMuxBackendConfig and routing metadata extension needed by this backend without implementing the whole #630 scope.',
        'Do not copy design-doc pseudo fields blindly. Map from current SubmitBreakpointParams.text/context/routing and typed backend config.',
        'Run agent-mux with non-interactive/yolo-safe defaults only when appropriate for an agent responder backend, and pass explicit timeout/abort handling.',
        'Model answer fields deterministically: responderId/name, text from RunResult.text, confidence default, references from result/events only if present, selectedAnswer, status answered/completed semantics, created/updated/expires timestamps.',
        'Preserve lifecycle methods: getBreakpoint retrieves stored in-memory result for synchronous runs; waitForAnswer is immediate for completed dispatches; cancellation/abort handles pending dispatches if possible.',
        'Map adapter missing, not authenticated, timeout, crash, and validation errors to actionable Error messages or typed backend errors consistent with existing tasks-mux patterns.',
        'Return JSON with: changedFiles, implementationSummary, configShape, resultMapping, errorMapping, remainingRisks.',
      ],
      context: {
        inputs: args.inputs,
        reuseAudit: args.reuseAudit,
        tests: args.tests,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const phase3WiringTask = defineTask('issue-631.phase3-registry-and-exports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3 - Wire registry, exports, and dependency metadata',
  labels: ['issue-631', 'phase-3', 'wiring', 'package-surface'],
  agent: {
    name: 'tasks-mux-package-surface-maintainer',
    prompt: {
      role: 'TypeScript package surface maintainer',
      task: 'Register and export the agent-mux backend without breaking existing tasks-mux consumers.',
      instructions: [
        'Edit only the package surface files needed for the backend to be usable.',
        'Register backendFactories.set("agent-mux", ...) in packages/tasks-mux/src/backends/index.ts.',
        'Export AgentMuxResponderBackend and any config/error types from backends/index.ts and package root if consistent with existing backend exports.',
        'Update BackendConfigSchema only if a direct backend config type is required; keep discriminated unions backward compatible.',
        'Add @a5c-ai/agent-mux dependency to packages/tasks-mux/package.json only after confirming no workspace dependency cycle; otherwise use a dynamic import/injected factory seam and document why.',
        'Keep package exports stable; do not change CLI behavior unless tests prove it is required.',
        'Return JSON with: changedFiles, dependencyDecision, exportedSymbols, registryBehavior, compatibilityNotes.',
      ],
      context: {
        inputs: args.inputs,
        reuseAudit: args.reuseAudit,
        implementation: args.implementation,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const phase4QualityGateTask = defineTask('issue-631.phase4-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4 - Run quality gates and close gaps',
  labels: ['issue-631', 'phase-4', 'verification', 'quality-gate'],
  agent: {
    name: 'tasks-mux-quality-engineer',
    prompt: {
      role: 'senior TypeScript QA engineer',
      task: 'Verify issue #631 implementation with fresh evidence and fix scoped failures.',
      instructions: [
        'Run the focused and package-level verification commands listed in inputs.',
        'At minimum verify: new backend tests, full tasks-mux tests, tasks-mux typecheck/build, relevant agent-mux type compatibility if a new dependency/import was added, root metadata verification, and git diff --check.',
        'Read complete failures before changing code. Fix only issue #631-related failures.',
        'Confirm the RED tests from Phase 1 now pass.',
        'Check no implementation source files outside the intended surfaces were modified without a documented reason.',
        'Return JSON with: commandsRun, passFail, fixesApplied, changedFilesAfterVerification, evidence, unresolvedFailures.',
      ],
      context: {
        inputs: args.inputs,
        reuseAudit: args.reuseAudit,
        tests: args.tests,
        implementation: args.implementation,
        wiring: args.wiring,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const phase5ReviewTask = defineTask('issue-631.phase5-adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5 - Adversarial implementation review',
  labels: ['issue-631', 'phase-5', 'review', 'quality-gate'],
  agent: {
    name: 'tasks-mux-agent-mux-reviewer',
    prompt: {
      role: 'adversarial reviewer for TypeScript SDK integration work',
      task: 'Review the final diff for issue #631 against the issue, triage notes, and current code surfaces.',
      instructions: [
        'Do not make broad refactors.',
        'Review for dependency cycles, unsafe casts around routing/config, lifecycle contract violations, missing timeout/abort behavior, non-deterministic cost mapping, and tests that mock too little or too much.',
        'Verify the implementation does not depend on absent amuxBridge/getAmuxClient unless that seam exists in the branch.',
        'Verify adapter missing, auth missing, timeout, failed run, and cancellation paths are covered by tests.',
        'If defects are found, fix narrowly and rerun the affected tests.',
        'Return JSON with: approved, findings, fixesApplied, residualRisks, finalVerificationNeeded.',
      ],
      context: {
        inputs: args.inputs,
        reuseAudit: args.reuseAudit,
        verification: args.verification,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const phase6DeliveryTask = defineTask('issue-631.phase6-delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6 - Prepare implementation PR',
  labels: ['issue-631', 'phase-6', 'delivery', 'github'],
  agent: {
    name: 'github-delivery-agent',
    prompt: {
      role: 'release-minded GitHub delivery engineer',
      task: 'Commit, push, open the implementation PR, and comment on issue #631 after all gates pass.',
      instructions: [
        'Use branchName from inputs for the implementation branch unless already on an equivalent issue branch.',
        'Do not include unrelated dirty worktree files in the commit.',
        'Commit only issue #631 implementation, tests, package metadata, and process artifacts if intentionally updated by the run.',
        'Create a PR to baseBranch with a title like "Implement AgentMuxResponderBackend".',
        'Link to issue #631 and mention dependency state for #630 in the PR body.',
        'PR body must summarize implementation, tests, error handling, cost mapping, and quality gates.',
        'Post a comment on issue #631 with the PR URL, verification summary, and any dependency caveats.',
        'Return JSON with: branchName, commitSha, prUrl, issueCommentUrl, changedFiles.',
      ],
      context: {
        inputs: args.inputs,
        verification: args.verification,
        review: args.review,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const processInputs = {
    issueNumber: inputs?.issueNumber ?? 631,
    baseBranch: inputs?.baseBranch ?? 'staging',
    branchName: inputs?.branchName ?? 'agent/issue-631-agent-mux-responder-backend',
    dependencyIssues: inputs?.dependencyIssues ?? [630, 604, 633],
    designDoc: inputs?.designDoc ?? 'docs/agent-mux-babysitter-integrations/tasks-mux-routing.md',
    targetFiles: inputs?.targetFiles ?? [
      'packages/tasks-mux/src/backends/agent-mux.ts',
      'packages/tasks-mux/src/backends/__tests__/agent-mux.test.ts',
      'packages/tasks-mux/src/backends/index.ts',
      'packages/tasks-mux/src/index.ts',
      'packages/tasks-mux/src/types.ts',
      'packages/tasks-mux/package.json',
    ],
    verificationCommands: inputs?.verificationCommands ?? [
      'npm exec --workspace=@a5c-ai/tasks-mux -- vitest run src/backends/__tests__/agent-mux.test.ts',
      'npm run test --workspace=@a5c-ai/tasks-mux',
      'npm run typecheck --workspace=@a5c-ai/tasks-mux',
      'npm run build --workspace=@a5c-ai/tasks-mux',
      'npm run verify:metadata',
      'git diff --check',
    ],
  };

  ctx.log('Phase 0: reuse audit and dependency check for issue #631');
  const reuseAudit = await ctx.task(phase0ReuseAuditTask, processInputs, {
    key: 'issue-631.phase0-reuse-audit',
  });

  ctx.log('Phase 1: RED tests for AgentMuxResponderBackend');
  const tests = await ctx.task(phase1ContractTask, {
    inputs: processInputs,
    reuseAudit,
  }, {
    key: 'issue-631.phase1-contract-tests',
  });

  ctx.log('Phase 2: backend implementation');
  const implementation = await ctx.task(phase2BackendTask, {
    inputs: processInputs,
    reuseAudit,
    tests,
  }, {
    key: 'issue-631.phase2-backend-implementation',
  });

  ctx.log('Phase 3: registry, exports, and dependency metadata');
  const wiring = await ctx.task(phase3WiringTask, {
    inputs: processInputs,
    reuseAudit,
    implementation,
  }, {
    key: 'issue-631.phase3-registry-and-exports',
  });

  ctx.log('Phase 4: verification and scoped fixes');
  const verification = await ctx.task(phase4QualityGateTask, {
    inputs: processInputs,
    reuseAudit,
    tests,
    implementation,
    wiring,
  }, {
    key: 'issue-631.phase4-quality-gates',
  });

  ctx.log('Phase 5: adversarial review');
  const review = await ctx.task(phase5ReviewTask, {
    inputs: processInputs,
    reuseAudit,
    verification,
  }, {
    key: 'issue-631.phase5-adversarial-review',
  });

  ctx.log('Phase 6: delivery');
  const delivery = await ctx.task(phase6DeliveryTask, {
    inputs: processInputs,
    verification,
    review,
  }, {
    key: 'issue-631.phase6-delivery',
  });

  return {
    success: Boolean(review?.approved ?? true),
    issueNumber: processInputs.issueNumber,
    process: '.a5c/processes/issue-631-agent-mux-responder-backend.mjs#process',
    inputs: processInputs,
    phases: {
      reuseAudit,
      tests,
      implementation,
      wiring,
      verification,
      review,
      delivery,
    },
    changedFiles: [
      ...new Set([
        ...processInputs.targetFiles,
        '.a5c/processes/issue-631-agent-mux-responder-backend.mjs',
        '.a5c/processes/issue-631-agent-mux-responder-backend.inputs.json',
      ]),
    ],
    verification,
    delivery,
    summary: `Planned and executed issue #${processInputs.issueNumber}: AgentMuxResponderBackend for tasks-mux.`,
  };
}
