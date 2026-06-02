/**
 * @process repo/issue-588-agent-core-tool-system-gaps
 * @description Implement the unified agent tool execution contract for AbortSignal cancellation, streaming updates, metadata, typed errors, SSH hardening, caching, and configurable limits.
 * @inputs { issueNumber: number, title: string, issueBody: string, issueComments: array, labels: string[], relatedIssues: array, targetFiles: string[], qualityCommands: string[], maxVerificationAttempts?: number }
 * @outputs { success, phases, reuseAudit, runtimeCallPaths, contractDesign, changedFiles, qualityGate, review }
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process specializations/ai-agents-conversational/custom-tool-development
 * @process specializations/ai-agents-conversational/tool-safety-validation
 *
 * This process intentionally uses agent tasks rather than shell tasks for
 * execution and verification, matching this repository's process-authoring
 * override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const reuseAuditTask = defineTask(
  'issue-588.reuse-audit-and-runtime-trace',
  async ({ issueContext, targetFiles }) => ({
    kind: 'agent',
    title: 'Phase 0 - Reuse audit and tool runtime trace',
    labels: ['agent-core', 'tool-mux', 'agent-platform', 'reuse-audit', 'phase:research'],
    agent: {
      name: 'tool-system-researcher',
      prompt: {
        role: 'senior TypeScript platform engineer',
        task: 'Run the plan-only reuse audit and trace the live tool execution paths for issue #588.',
        instructions: [
          'Do not edit source files in this phase.',
          'Render a section titled exactly "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" in your result.',
          'Extract keyword nouns and verbs from the issue context: AbortSignal, streaming, onUpdate, metadata, category, tags, cost hints, rateLimit, requiresApproval, typed errors, SSH, cache, web fetch, schema fetch, configurable limits, tool-mux, DeferredToolRegistry.',
          'Scan for matching migrations, API routes, environment variables, SDK dependencies, imports, registries, dispatchers, tool metadata, approval/governance hooks, cache facilities, and timeout/output-limit constants.',
          'Trace live runtime call paths from agent-core tool definition creation through built-in tool execution, deferred discovery/fetch, programmatic code_executor nested tool calls, tool-mux dispatch, MCP/client registry surfaces, and agent-platform host integration.',
          'Identify all already-existing infrastructure that should be reused rather than replaced.',
          'Identify which paths are directly on the live execution path and which are only adjacent documentation or tests.',
          'Return JSON with: { reuseAudit: { keywords: array, findings: array, noMatchingInfrastructureNotes: array }, runtimeCallPaths: array, existingInfrastructure: array, affectedFiles: array, nonGoals: array, risks: array, confidence: number }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Reuse audit and runtime trace', labels: ['phase:research'] },
);

const designUnifiedContractTask = defineTask(
  'issue-588.design-unified-tool-contract',
  async ({ issueContext, reuseAudit }) => ({
    kind: 'agent',
    title: 'Phase 1 - Design unified tool contract',
    labels: ['agent-core', 'tool-mux', 'architecture', 'phase:design'],
    agent: {
      name: 'tool-contract-architect',
      prompt: {
        role: 'senior SDK API designer',
        task: 'Design the unified tool execution contract before tests and implementation.',
        instructions: [
          'Base the design on the issue context and the reuse audit/runtime trace.',
          'Define the shared execution context passed to all tool executors, including AbortSignal, toolCallId, caller, runId/sessionId when available, workspace, update emitter, policy metadata, and deadline/limit configuration.',
          'Define streaming update semantics: event shape, ordering relative to final result, backpressure/failure behavior, and how existing onUpdate is wired.',
          'Define structured ToolResult and ToolError types while preserving a migration path for existing text-only results.',
          'Define metadata fields for category, tags, cost hints, rateLimit, requiresApproval, readOnly/sideEffect profile, cache policy, and configurable timeout/output limits.',
          'Define how agent-core should route through tool-mux ToolRegistry/ToolDispatcher instead of extending DeferredToolRegistry further.',
          'Define how agent-platform governance, approval posture, MCP tools, plugin tools, and hooks should consume the metadata.',
          'Define SSH hardening scope: host-key policy, BatchMode behavior, keepalive/retry controls, and explicit compatibility risks.',
          'Define cache semantics as opt-in and read-only by default, including cache keys, TTL, invalidation, and schema/web-fetch result boundaries.',
          'Identify backward compatibility hazards and the smallest migration strategy that still removes the architectural gap.',
          'Return JSON with: { apiSurface: object, streamingSemantics: object, errorModel: object, metadataModel: object, dispatcherIntegration: object, cachePlan: object, sshPlan: object, migrationPlan: array, acceptanceCriteria: array, risks: array, confidence: number }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT AND RUNTIME TRACE:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Design unified contract', labels: ['phase:design'] },
);

const authorContractTestsTask = defineTask(
  'issue-588.author-contract-tests',
  async ({ issueContext, reuseAudit, contractDesign, testTargets }) => ({
    kind: 'agent',
    title: 'Phase 2 - Author failing contract and integration tests',
    labels: ['agent-core', 'tool-mux', 'tdd', 'phase:red'],
    agent: {
      name: 'tool-system-test-author',
      prompt: {
        role: 'senior TypeScript test engineer',
        task: 'Author the failing tests for issue #588 before implementation changes.',
        instructions: [
          'Follow strict TDD: add tests before production implementation changes.',
          'Use the issue context and contract design as the acceptance spec.',
          'Prefer package-local tests near the changed surfaces: agent-core tool types/execution/discovery tests, tool-mux dispatcher/registry tests, and agent-platform governance or host integration tests.',
          'Add tests proving a shared AbortSignal cancels long-running built-in and custom tools and propagates a typed cancellation result.',
          'Add tests proving onUpdate/streaming events are emitted in order and final results remain stable.',
          'Add tests proving metadata fields are present in discovery/fetch and flow through tool-mux dispatch and agent-platform policy decisions.',
          'Add tests proving typed ToolError results are not collapsed into plain "Error: ..." text.',
          'Add tests for configurable bash/search/output limits without relying on hardcoded 120s/30s/50MiB constants.',
          'Add tests for SSH option construction that does not silently use StrictHostKeyChecking=no without an explicit policy.',
          'Add tests for opt-in caching of read-only fetch/schema results and explicit non-caching of side-effectful tools.',
          'Run the narrow tests and confirm they fail for the intended missing behavior, not unrelated setup failures.',
          'Do not weaken, skip, or delete existing tests.',
          'Return JSON with: { testFiles: string[], testNames: string[], redVerified: boolean, redCommands: array, redOutputSummary: string, failureMatchesIssue: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'CONTRACT DESIGN:',
          JSON.stringify(contractDesign ?? {}, null, 2),
          '',
          `TEST TARGETS: ${JSON.stringify(testTargets ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author contract tests', labels: ['phase:red'] },
);

const implementContractSliceTask = defineTask(
  'issue-588.implement-contract-slice',
  async ({ issueContext, reuseAudit, contractDesign, tests, slice, previousSlices, verificationFeedback }) => ({
    kind: 'agent',
    title: `Phase 3 - Implement ${slice?.id ?? 'tool-system'} slice`,
    labels: ['agent-core', 'tool-mux', 'agent-platform', 'implementation', 'phase:green'],
    agent: {
      name: 'tool-system-implementer',
      prompt: {
        role: 'senior TypeScript platform engineer',
        task: `Implement the issue #588 slice: ${slice?.title ?? 'tool-system changes'}.`,
        instructions: [
          'Keep changes scoped to live runtime paths identified in the reuse audit.',
          'Do not implement unrelated tool-system improvements beyond the issue and approved contract design.',
          'Preserve public behavior where migration compatibility is explicitly required by the contract design.',
          'Prefer reusing tool-mux ToolRegistry/ToolDispatcher, existing agent-platform governance/rate-limit posture, and existing cache primitives before adding new infrastructure.',
          'Do not extend DeferredToolRegistry as the long-term architecture; use it only as a temporary adapter if the contract design requires a migration bridge.',
          'Maintain typed TypeScript surfaces and update package exports/docs when public APIs change.',
          'Run focused tests for this slice and report exact commands and outcomes.',
          'Return JSON with: { sliceId: string, changedFiles: string[], summary: string, testsRun: array, contractCriteriaCovered: array, remainingRisks: array, needsFollowupSlice: boolean }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'CONTRACT DESIGN:',
          JSON.stringify(contractDesign ?? {}, null, 2),
          '',
          'RED TESTS:',
          JSON.stringify(tests ?? {}, null, 2),
          '',
          'IMPLEMENTATION SLICE:',
          JSON.stringify(slice ?? {}, null, 2),
          '',
          'PREVIOUS SLICES:',
          JSON.stringify(previousSlices ?? [], null, 2),
          '',
          'VERIFICATION FEEDBACK FROM PRIOR ATTEMPT:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement contract slice', labels: ['phase:green'] },
);

const verifyQualityGateTask = defineTask(
  'issue-588.verify-quality-gate',
  async ({ issueContext, reuseAudit, contractDesign, tests, implementationSlices, qualityCommands }) => ({
    kind: 'agent',
    title: 'Phase 4 - Verify tool-system quality gates',
    labels: ['agent-core', 'tool-mux', 'agent-platform', 'verification', 'phase:quality-gate'],
    agent: {
      name: 'tool-system-verifier',
      prompt: {
        role: 'senior TypeScript platform verifier',
        task: 'Run and interpret all quality gates for issue #588.',
        instructions: [
          'Run the listed commands from the repository root and record exact results.',
          'Confirm the issue #588 tests failed in the red phase for intended missing behavior and now pass.',
          'Confirm package builds and package-local tests pass for agent-core, tool-mux, and agent-platform.',
          'Confirm metadata verification passes.',
          'Inspect the final diff for source changes outside issue scope.',
          'Verify every contract criterion is covered by tests or an explicit documented non-goal.',
          'Verify shared AbortSignal, streaming/onUpdate, typed result/error model, metadata/policy flow, SSH policy, opt-in cache behavior, and configurable limits are all exercised.',
          'Return JSON with: { passed: boolean, commands: array, failures: array, changedFiles: string[], criteria: array, redGreenVerified: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'CONTRACT DESIGN:',
          JSON.stringify(contractDesign ?? {}, null, 2),
          '',
          'RED TESTS:',
          JSON.stringify(tests ?? {}, null, 2),
          '',
          'IMPLEMENTATION SLICES:',
          JSON.stringify(implementationSlices ?? [], null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['phase:quality-gate'] },
);

const reviewFinalDiffTask = defineTask(
  'issue-588.review-final-diff',
  async ({ issueContext, reuseAudit, contractDesign, tests, implementationSlices, qualityGate }) => ({
    kind: 'agent',
    title: 'Phase 5 - Review final tool-system implementation',
    labels: ['agent-core', 'tool-mux', 'agent-platform', 'review', 'phase:review'],
    agent: {
      name: 'tool-system-reviewer',
      prompt: {
        role: 'senior code reviewer for SDK and agent tool systems',
        task: 'Review the final changes against issue #588 and the approved contract design.',
        instructions: [
          'Compare the issue context directly to the tests, implementation, and verification results.',
          'Prioritize behavioral regressions, API compatibility risks, incomplete integration across agent-core/tool-m../tula-platform, and missing tests.',
          'Check that AbortSignal is shared rather than re-created independently by each tool.',
          'Check that streaming uses existing onUpdate or its replacement coherently and preserves transcript/final-result ordering.',
          'Check that metadata is authoritative enough for discovery, policy, approval, cost/rate hints, side-effect classification, and caching.',
          'Check that typed errors remain machine-readable and are not only displayed as text strings.',
          'Check that SSH hardening does not silently preserve insecure host-key behavior.',
          'Check that caching is opt-in and limited to declared read-only tools until invalidation is explicit.',
          'Return JSON with: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, residualRisks: array, finalSummary: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'CONTRACT DESIGN:',
          JSON.stringify(contractDesign ?? {}, null, 2),
          '',
          'RED TESTS:',
          JSON.stringify(tests ?? {}, null, 2),
          '',
          'IMPLEMENTATION SLICES:',
          JSON.stringify(implementationSlices ?? [], null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review final diff', labels: ['phase:review'] },
);

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 588,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    comments: inputs?.issueComments ?? [],
    relatedIssues: inputs?.relatedIssues ?? [],
    planningNotes: inputs?.planningNotes ?? [],
  };

  const targetFiles = inputs?.targetFiles ?? [];
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm run build:sdk',
    'npm run test:sdk',
    'npm run verify:metadata',
    'npm --workspace packages/agent-core test',
    'npm --workspace packages/tool-mux test',
    'npm --workspace packages/tula-platform test',
  ];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? 2;

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext,
    targetFiles,
  }, { key: 'issue-588.reuse-audit' });

  if (Number(reuseAudit?.confidence ?? 1) < 0.65) {
    await ctx.breakpoint({
      title: 'Runtime trace confidence is low',
      question: 'The reuse audit/runtime trace confidence is below 0.65. Review the traced surfaces before contract design continues?',
      context: {
        runId: ctx.runId,
        reuseAudit,
      },
    });
  }

  const contractDesign = await ctx.task(designUnifiedContractTask, {
    issueContext,
    reuseAudit,
  }, { key: 'issue-588.contract-design' });

  await ctx.breakpoint({
    title: 'Unified tool contract review',
    question: 'Review the unified tool contract before authoring tests and changing agent-core/tool-m../tula-platform execution surfaces.',
    context: {
      runId: ctx.runId,
      contractDesign,
      issueNumber: issueContext.issueNumber,
    },
  });

  const tests = await ctx.task(authorContractTestsTask, {
    issueContext,
    reuseAudit,
    contractDesign,
    testTargets: inputs?.testTargets ?? [],
  }, { key: 'issue-588.contract-tests' });

  const slices = inputs?.implementationSlices ?? [
    {
      id: 'contract-types',
      title: 'shared execution context, AbortSignal, streaming event, ToolResult, ToolError, and metadata types',
      focus: ['packages/agent-core/src/types.ts', 'packages/tool-mux/src/types.ts', 'package exports and README surfaces'],
    },
    {
      id: 'dispatcher-registry-integration',
      title: 'agent-core execution through tool-mux registry/dispatcher and discovery metadata flow',
      focus: ['DeferredToolRegistry migration adapter', 'tool_search/tool_fetch', 'programmatic code_executor nested calls', 'MCP/plugin/custom tool descriptors'],
    },
    {
      id: 'builtin-tools-runtime',
      title: 'built-in tool cancellation, streaming updates, typed errors, and configurable timeout/output limits',
      focus: ['bash/python/ssh/fetch/search/process helpers', 'onUpdate delivery', 'shared limits configuration'],
    },
    {
      id: 'policy-ssh-cache',
      title: 'metadata-driven policy, approval/rate/cost hints, SSH hardening, and opt-in read-only caching',
      focus: ['agent-platform governance bridge', 'tool-mux hooks', 'SSH options policy', 'fetch/schema cache behavior'],
    },
  ];

  const implementationSlices = [];
  let verificationFeedback = null;
  for (const slice of slices) {
    const sliceResult = await ctx.task(implementContractSliceTask, {
      issueContext,
      reuseAudit,
      contractDesign,
      tests,
      slice,
      previousSlices: implementationSlices,
      verificationFeedback,
    }, { key: `issue-588.implementation.${slice.id}` });
    implementationSlices.push(sliceResult);
  }

  let qualityGate = null;
  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    qualityGate = await ctx.task(verifyQualityGateTask, {
      issueContext,
      reuseAudit,
      contractDesign,
      tests,
      implementationSlices,
      qualityCommands,
    }, { key: `issue-588.quality-gate.${attempt}` });

    if (qualityGate?.passed === true) {
      break;
    }

    if (attempt >= maxVerificationAttempts) {
      break;
    }

    verificationFeedback = qualityGate;
    const remediationSlice = {
      id: `verification-remediation-${attempt}`,
      title: 'remediate quality-gate failures without expanding scope',
      focus: qualityGate?.failures ?? [],
    };
    const remediation = await ctx.task(implementContractSliceTask, {
      issueContext,
      reuseAudit,
      contractDesign,
      tests,
      slice: remediationSlice,
      previousSlices: implementationSlices,
      verificationFeedback,
    }, { key: `issue-588.remediation.${attempt}` });
    implementationSlices.push(remediation);
  }

  const review = await ctx.task(reviewFinalDiffTask, {
    issueContext,
    reuseAudit,
    contractDesign,
    tests,
    implementationSlices,
    qualityGate,
  }, { key: 'issue-588.review' });

  if (qualityGate?.passed !== true || review?.approved !== true) {
    await ctx.breakpoint({
      title: 'Tool-system plan needs human decision',
      question: 'Quality gates or final review did not approve the issue #588 implementation. Choose whether to continue remediation, narrow scope explicitly, or stop for manual follow-up.',
      context: {
        runId: ctx.runId,
        qualityGate,
        review,
      },
    });
  }

  return {
    success: qualityGate?.passed === true && review?.approved === true,
    phases: [
      'reuse-audit-and-runtime-trace',
      'unified-contract-design',
      'contract-tests-red-phase',
      'sliced-implementation',
      'quality-gate',
      'final-review',
    ],
    reuseAudit: reuseAudit?.reuseAudit ?? reuseAudit,
    runtimeCallPaths: reuseAudit?.runtimeCallPaths ?? [],
    contractDesign,
    changedFiles: [
      ...new Set(
        implementationSlices
          .flatMap((slice) => Array.isArray(slice?.changedFiles) ? slice.changedFiles : []),
      ),
    ],
    qualityGate,
    review,
  };
}
