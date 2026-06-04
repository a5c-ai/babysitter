/**
 * @process repo/issue-637-hooks-mux-typed-handlers
 * @description Implement issue #637: add typed hooks-mux handler support for command, http, mcp_tool, prompt, and agent handlers.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, dependentIssues: number[], relatedPrs: number[], targetHandlerTypes: string[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], contract: object, verification: object, review: object, delivery: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Matching existing infrastructure found in hooks-mux plan types, plan resolver ordering, normalizer runner shell execution, merge/result parsing,
 *   programmatic engine fanout, CLI invoke parsing, hooks-mux tests, agent-platform ADAPTERS bridge, and agent-platform MCP/tool registry surfaces.
 * - The active process-library binding is `/home/runner/.a5c/process-library/babysitter-repo/library`. Matching methodology guidance is
 *   available there under `methodologies/atdd-tdd/atdd-tdd.js`, `methodologies/process-hardening/process-hardening-patterns.js`,
 *   `methodologies/superpowers/verification-before-completion.js`, and `tdd-quality-convergence.js`.
 * - Repo-local `.a5c/process-library/` is not present; use the active process-library binding above for library methodology lookups.
 * - No `.a5c/reuse-audit.json` was present in this checkout; keyword scan used: HandlerRef, handler type, command, shell, http, mcp_tool,
 *   prompt, agent, runHandler, runShellHandler, allowedEnvVars, MCP, tool registry, agent-platform, amuxBridge, timeout, fail-open, fail-closed.
 * - Current `staging` still treats `HandlerRef.type` as `command | shell` only and `runHandler` unconditionally dispatches to
 *   `runShellHandler`, so issue #637 remains a live implementation gap on the base branch even though closed PR #695 contains useful prior art.
 *
 * References used while authoring:
 * - gh issue view 637 --json title,body,labels,comments
 * - gh pr view 695 --json files,title,body,comments,state
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-stack/hooks/missing-capabilities.md
 * - packages/hooks-mux/core/src/types/plan.ts
 * - packages/hooks-mux/core/src/normalizer/runner.ts
 * - packages/hooks-mux/core/src/normalizer/plan-resolver.ts
 * - packages/genty/platform/src/mcp/client/toolRegistry.ts
 * - packages/genty/platform/src/harness/adapters/amuxBridge.ts
 *
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process methodologies/superpowers/verification-before-completion
 * @process tdd-quality-convergence
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_REPAIR_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-637.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditAndPriorArtTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-637.reuse-audit-and-prior-art',
  });

  const dependencyReadiness = await ctx.task(dependencyReadinessTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-637.dependency-readiness',
  });

  if (dependencyReadiness?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #637 Dependency Or Interface Decision',
      question: dependencyReadiness.question,
      options: [
        'Proceed with compatibility seams and documented assumptions',
        'Pause until dependent interface lands',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-637', 'dependencies'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        dependentIssues: inputs.dependentIssues,
        dependencyReadiness,
      },
    });
  }

  const runtimeTrace = await ctx.task(traceRuntimeSurfacesTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyReadiness,
  }, {
    key: 'issue-637.trace-runtime-surfaces',
  });

  const contract = await ctx.task(designHandlerContractTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyReadiness,
    runtimeTrace,
  }, {
    key: 'issue-637.design-handler-contract',
  });

  if (contract?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #637 Handler Contract Decision',
      question: contract.question,
      options: [
        'Use recommended contract',
        'Pause for explicit maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-637', 'handler-contract'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        contract,
      },
    });
  }

  const tests = await ctx.task(authorContractTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyReadiness,
    runtimeTrace,
    contract,
  }, {
    key: 'issue-637.author-contract-tests',
  });

  const implementation = await ctx.task(implementTypedHandlersTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyReadiness,
    runtimeTrace,
    contract,
    tests,
  }, {
    key: 'issue-637.implement-typed-handlers',
  });

  const bridgeDocs = await ctx.task(updateBridgeAndDocsTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyReadiness,
    runtimeTrace,
    contract,
    tests,
    implementation,
  }, {
    key: 'issue-637.update-bridge-and-docs',
  });

  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= (inputs.maxRepairAttempts ?? MAX_REPAIR_ATTEMPTS); attempt++) {
    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      reuseAudit,
      dependencyReadiness,
      runtimeTrace,
      contract,
      tests,
      implementation,
      bridgeDocs,
      previousReview: review,
      attempt,
    }, {
      key: `issue-637.verification.${attempt}`,
    });

    review = await ctx.task(reviewImplementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      dependencyReadiness,
      runtimeTrace,
      contract,
      tests,
      implementation,
      bridgeDocs,
      verification,
      attempt,
    }, {
      key: `issue-637.review.${attempt}`,
    });

    attempts.push({ attempt, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }

    if (attempt < (inputs.maxRepairAttempts ?? MAX_REPAIR_ATTEMPTS)) {
      await ctx.task(repairImplementationTask, {
        inputs,
        issueContext,
        reuseAudit,
        dependencyReadiness,
        runtimeTrace,
        contract,
        tests,
        verification,
        review,
        attempt,
      }, {
        key: `issue-637.repair.${attempt}`,
      });
    }
  }

  const finalAcceptance = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    dependencyReadiness,
    runtimeTrace,
    contract,
    tests,
    implementation,
    bridgeDocs,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-637.final-acceptance',
  });

  let delivery = null;
  if (finalAcceptance?.passed === true) {
    delivery = await ctx.task(deliveryTask, {
      inputs,
      issueContext,
      finalAcceptance,
      verification,
      review,
    }, {
      key: 'issue-637.delivery',
    });
  }

  return {
    success: finalAcceptance?.passed === true && (delivery?.success ?? true),
    phases: [
      'issue-context',
      'reuse-audit-and-prior-art',
      'dependency-readiness',
      'runtime-surface-trace',
      'handler-contract',
      'contract-tests-first',
      'typed-handler-implementation',
      'bridge-and-docs',
      'verification-review-repair-loop',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalAcceptance?.changedFiles ?? [],
    contract,
    verification,
    review,
    delivery,
    attempts,
    finalAcceptance,
  };
}

export const readIssueContextTask = defineTask('issue-637.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #637 and linked context',
  labels: ['issue-637', 'hooks-mux', 'agent-platform', 'research'],
  agent: {
    name: 'hooks-mux-context-researcher',
    prompt: {
      role: 'senior Babysitter hooks-mux maintainer',
      task: 'Read the issue, comments, labels, and linked work before making implementation decisions.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} resolves as a PR in the current repository, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read docs/agent-stack/hooks/missing-capabilities.md section 1 and any nearby sections that affect handler timeout, env, or output behavior.',
        'Read issue comments carefully. Account for #636 as a dependency and #576 as the tool-mux/MCP registry dependency.',
        'Read PR #695 as prior art if available, but do not assume it is merged. Verify current base branch state separately.',
        'Return JSON: { title, labels, rawIssueBody, comments, relatedIssues, relatedPrs, acceptanceCriteria, nonGoals, priority, risk, targetFilesFromIssue, priorImplementationStatus }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditAndPriorArtTask = defineTask('issue-637.reuse-audit-and-prior-art', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run reuse audit and prior-art reconciliation',
  labels: ['issue-637', 'reuse-audit', 'prior-art', 'quality-gate'],
  agent: {
    name: 'reuse-audit-architect',
    prompt: {
      role: 'senior monorepo reuse auditor',
      task: 'Perform the repo-required Phase 0 reuse audit before implementation planning continues.',
      instructions: [
        'Follow docs/agent-reference/process-authoring.md for `babysitter:plan` reuse audit requirements.',
        'Extract keyword nouns and verbs from issue #637 and scan matching code, tests, docs, SDK dependencies, imports, and bridge surfaces.',
        'Check whether `.a5c/reuse-audit.json` exists; if it does not, record that and use focused scans over packages/hooks-mux, packages/genty/platform, packages/sdk, docs/agent-stack/hooks, and package metadata.',
        'Resolve the active process-library binding with `babysitter process-library:active --json`; use that binding for methodology lookups.',
        'Record whether repo-local `.a5c/process-library/` exists, but do not treat its absence as a blocker when the active process-library binding is available.',
        'Read `methodologies/atdd-tdd/atdd-tdd.js`, `methodologies/process-hardening/process-hardening-patterns.js`, `methodologies/superpowers/verification-before-completion.js`, and `tdd-quality-convergence.js` from the active process-library binding only enough to extract process guidance.',
        'Inspect current base branch files, especially packages/hooks-mux/core/src/types/plan.ts, packages/hooks-mux/core/src/normalizer/runner.ts, packages/hooks-mux/core/src/normalizer/plan-resolver.ts, packages/hooks-mux/core/src/api.ts, packages/hooks-mux/core/src/index.ts, and packages/genty/platform/src/harness/adapters/amuxBridge.ts.',
        'Inspect PR #695 files and summary as prior art. Treat it as a reference, not source of truth, unless it is merged into the current base branch.',
        'Render a section exactly titled: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Return JSON: { reuseAuditConfigPresent, keywords, matchingInfrastructure, currentBaseStatus, priorArt, processLibraryFindings, reuseConstraints, staleOrMisleadingDocs, recommendedProcessShape }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const dependencyReadinessTask = defineTask('issue-637.dependency-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess #636 and #576 dependency readiness',
  labels: ['issue-637', 'dependencies', 'hooks-mux', 'mcp'],
  agent: {
    name: 'dependency-readiness-reviewer',
    prompt: {
      role: 'senior integration engineer',
      task: 'Decide which parts of issue #637 can proceed safely against the current branch and which need compatibility seams.',
      instructions: [
        'Use issue context and reuse audit:',
        JSON.stringify({ issueContext: args.issueContext, reuseAudit: args.reuseAudit }, null, 2),
        'Read the state of dependent issues named in inputs, especially #636 and #576, only enough to determine interface readiness.',
        'For #636, decide whether missing event dispatch work affects handler-type dispatch or only broader event coverage.',
        'For #576, decide how `mcp_tool` should avoid duplicating the tool registry. Prefer a narrow injectable executor seam until tool-mux integration is stable.',
        'If a dependency blocks all meaningful work, set needsMaintainerDecision true with one precise question. Otherwise define assumptions and proceedable slices.',
        'Return JSON: { ready: boolean, blockingDependencies, proceedableSlices, deferredSlices, assumptions, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRuntimeSurfacesTask = defineTask('issue-637.trace-runtime-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace handler execution and bridge surfaces',
  labels: ['issue-637', 'runtime-trace', 'hooks-mux', 'agent-platform'],
  agent: {
    name: 'runtime-surface-tracer',
    prompt: {
      role: 'senior TypeScript runtime architect',
      task: 'Trace the existing handler registration and execution paths before contract design.',
      instructions: [
        'Trace HookPlanEntry and HandlerRef from CLI/programmatic creation through plan resolution, handler sorting, runPlan fanout, runHandler dispatch, timeout/error policy, result parsing, merge behavior, and adapter rendering.',
        'Trace exported APIs from packages/hooks-mux/core/src/api.ts, packages/hooks-mux/core/src/index.ts, and normalizer exports so new executor seams can be consumed without private imports.',
        'Trace how agent-platform ADAPTERS bridge forwards hook handler config and where MCP/tool registry or agent responder infrastructure already exists.',
        'Identify existing test suites that can host contract tests without excessive new harness code.',
        'Return JSON: { runtimeCallPaths, exportedSurfaces, testSurfaces, bridgeSurfaces, mcpRegistrySurfaces, promptAgentSurfaces, compatibilityRisks, recommendedFilePlan }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designHandlerContractTask = defineTask('issue-637.design-handler-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design backward-compatible typed handler contract',
  labels: ['issue-637', 'contract', 'quality-gate'],
  agent: {
    name: 'handler-contract-architect',
    prompt: {
      role: 'senior API compatibility architect',
      task: 'Define the precise HandlerRef and executor contract before production code changes.',
      instructions: [
        'Use the current branch trace, dependency readiness, and issue acceptance criteria:',
        JSON.stringify({
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          acceptanceCriteria: args.issueContext?.acceptanceCriteria,
          targetHandlerTypes: args.inputs?.targetHandlerTypes,
        }, null, 2),
        'Preserve backwards compatibility: omitted `type` and `type: "command"` must execute the existing shell-command path. Decide whether `type: "shell"` remains an alias and document it.',
        'Define type-specific config for `http`, `mcp_tool`, `prompt`, and `agent` without overfitting to a single adapter.',
        'For HTTP, require URL validation, POST event payload, timeout/cancellation, response parsing as UnifiedHookResult, safe header interpolation, and `allowedEnvVars` restrictions.',
        'For MCP, prompt, and agent, prefer injectable executor seams and deterministic failure results until live platform/tool-mux wiring is stable. Do not create a duplicate MCP registry.',
        'Define unsupported type behavior, timeout behavior, cancellation behavior, fail-open/fail-closed preservation, diagnostics metadata, exported API additions, and docs updates.',
        'If a product/API ambiguity cannot be resolved from existing patterns, set needsMaintainerDecision true with one concise question.',
        'Return JSON: { handlerRefContract, handlerTypeMatrix, executorSeams, securityControls, compatibilityRules, errorSemantics, exportPlan, docsPlan, testMatrix, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractTestsTask = defineTask('issue-637.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests first',
  labels: ['issue-637', 'tests', 'atdd', 'hooks-mux'],
  agent: {
    name: 'typed-handler-test-architect',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused failing tests for the typed handler contract before production implementation.',
      instructions: [
        'Edit only test files and test fixtures in this task.',
        'Use the contract below as the source of truth:',
        JSON.stringify(args.contract, null, 2),
        'Cover legacy omitted type and `command` behavior, optional `shell` alias if kept, handler ordering by priority, all new handler types, unsupported types, timeout behavior, fail-open/fail-closed behavior, diagnostics metadata, exported executor seam configuration, and bridge pass-through where in scope.',
        'For HTTP, avoid real external services. Use a local test server or mock fetch/HTTP client according to existing test patterns. Cover method, payload, JSON result parsing, timeout/abort, URL validation, forbidden private/invalid URLs if implemented, and `allowedEnvVars` header interpolation without leaking disallowed env vars.',
        'For MCP/prompt/agent, use fake executor functions and assert the runner dispatches normalized event payload, respects timeout/depth/max-turn bounds, and produces deterministic error results when no executor is configured.',
        'Tests should fail against the pre-implementation code for the real gaps; do not weaken assertions to match current shell-only behavior.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, coverageByHandlerType, commandsToRun }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementTypedHandlersTask = defineTask('issue-637.implement-typed-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement hooks-mux typed handlers',
  labels: ['issue-637', 'implementation', 'hooks-mux'],
  agent: {
    name: 'typed-handler-implementer',
    prompt: {
      role: 'senior hooks-mux TypeScript maintainer',
      task: 'Implement typed handler support in hooks-mux core while keeping the change scoped to issue #637.',
      instructions: [
        'Edit the repository directly. Keep production changes focused on typed handler support and direct supporting exports.',
        'Use the contract, tests, and runtime trace below:',
        JSON.stringify({ contract: args.contract, tests: args.tests, runtimeTrace: args.runtimeTrace }, null, 2),
        'Extend packages/hooks-mux/core/src/types/plan.ts with a backward-compatible discriminated handler model. Omitted type must remain command.',
        'Add dispatch in packages/hooks-mux/core/src/normalizer/runner.ts instead of unconditionally calling the shell runner.',
        'Add focused handler modules under packages/hooks-mux/core/src/handlers/: http.ts, mcp-tool.ts, prompt.ts, agent.ts, and shared helpers if useful.',
        'Expose narrow executor registration/configuration APIs only where needed by tests and downstream bridge wiring. Avoid global mutable state unless existing hooks-mux patterns justify it; if used, provide clear test reset helpers.',
        'Implement HTTP safety controls from the contract. Never forward arbitrary environment variables into headers.',
        'Implement MCP/prompt/agent as deterministic executor seams. If no executor is configured, return a typed unsupported/unavailable result according to the contract instead of falling back to shell.',
        'Preserve existing command handler semantics, shell selection, timeout handling, async/once behavior, runPlan merge behavior, and diagnostics shape.',
        'Return JSON: { changedFiles, summary, compatibilityNotes, securityControls, executorSeams, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const updateBridgeAndDocsTask = defineTask('issue-637.update-bridge-and-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update bridge wiring and docs',
  labels: ['issue-637', 'agent-platform', 'docs'],
  agent: {
    name: 'bridge-docs-integrator',
    prompt: {
      role: 'senior agent-platform integration engineer',
      task: 'Wire typed handler metadata through existing bridge surfaces and update docs to match actual implementation.',
      instructions: [
        'Use the contract and implementation summary below:',
        JSON.stringify({ contract: args.contract, implementation: args.implementation }, null, 2),
        'Inspect packages/genty/platform/src/harness/adapters/amuxBridge.ts and related ADAPTERS tests. Update only if current bridge code drops or narrows handler type config.',
        'Do not implement full live MCP/tool-mux integration here if #576 is not ready. Document the seam and residual dependency instead.',
        'Update docs/agent-stack/hooks/missing-capabilities.md section 1 from gap language to implemented/core-seam language only where the code actually supports it.',
        'Add or update tests for bridge pass-through when production bridge code changes.',
        'Return JSON: { changedFiles, bridgeChanges, docsChanges, residualGaps, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-637.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #637 verification gate attempt ${args.attempt}`,
  labels: ['issue-637', 'verification', 'quality-gate'],
  agent: {
    name: 'typed-handler-verifier',
    prompt: {
      role: 'senior CI and release verification engineer',
      task: 'Run fresh deterministic verification and report evidence without overstating results.',
      instructions: [
        'Run the verification commands from inputs unless a command is impossible in the current environment. Record exact command, exit code, and important output for every gate.',
        JSON.stringify(args.inputs?.verificationCommands ?? [], null, 2),
        'Also run targeted tests added for issue #637 before broad package gates if they can be identified from the tests task output.',
        'Confirm that no source file unrelated to typed handler support was changed.',
        'Confirm that command/legacy handler behavior is still covered and new handler types have deterministic tests without real external services.',
        'Confirm docs accurately distinguish core handler support from deferred live platform/tool-mux execution.',
        'Return JSON: { passed, commandResults, targetedCoverage, changedFiles, docsStatus, blockers, evidenceGaps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewImplementationTask = defineTask('issue-637.review-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #637 implementation attempt ${args.attempt}`,
  labels: ['issue-637', 'review', 'quality-gate'],
  agent: {
    name: 'typed-handler-reviewer',
    prompt: {
      role: 'senior hooks-mux code reviewer',
      task: 'Review the final diff against issue #637, the typed handler contract, and verification evidence.',
      instructions: [
        'Use a code-review stance. Findings first, ordered by severity, with file/line references.',
        'Check backwards compatibility: existing HandlerRef objects without type, existing shell command execution, shell selection, timeouts, async/once, and fail-open/fail-closed behavior.',
        'Check HTTP security: URL validation, no disallowed env leakage, safe header interpolation, timeout/cancellation, and deterministic tests.',
        'Check MCP/tool handling: no duplicate registry, executor seam compatibility with #576/tool-mux, and clear unavailable behavior.',
        'Check prompt/agent handling: bounded depth/runtime/max-turn controls, cancellation, and no unbounded recursion.',
        'Check exports and docs for accuracy.',
        'Inputs:',
        JSON.stringify({ contract: args.contract, verification: args.verification }, null, 2),
        'Return JSON: { approved, findings, missingCoverage, compatibilityRisks, securityRisks, residualRisks, summary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const repairImplementationTask = defineTask('issue-637.repair-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Repair issue #637 gaps after attempt ${args.attempt}`,
  labels: ['issue-637', 'repair', 'implementation'],
  agent: {
    name: 'typed-handler-repair-engineer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Repair only concrete verification or review gaps for issue #637.',
      instructions: [
        'Edit the repository directly. Keep repairs narrow and tied to failed gates or blocking review findings.',
        'When the gap is behavioral, add or adjust a focused test first.',
        'Do not broaden into #638 decision semantics, #639 matcher/async config, or full #576 tool registry implementation unless the current issue cannot pass without a small compatibility seam.',
        'Context:',
        JSON.stringify({ contract: args.contract, verification: args.verification, review: args.review, attempt: args.attempt }, null, 2),
        'Return JSON: { changedFiles, fixes, testsAdjusted, remainingRisks, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-637.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #637',
  labels: ['issue-637', 'acceptance', 'quality-gate'],
  agent: {
    name: 'typed-handler-acceptance-gate',
    prompt: {
      role: 'release acceptance reviewer',
      task: 'Decide whether issue #637 is complete and ready for delivery.',
      instructions: [
        'Pass only if verification passed, review approved, each target handler type is implemented or explicitly dependency-gated according to the contract, legacy command behavior is preserved, and docs match the code.',
        'Fail if any required quality gate was skipped without a concrete environment-only reason.',
        'Fail if HTTP safety, MCP registry reuse, prompt/agent bounds, or backwards compatibility remain unresolved.',
        'Return JSON: { passed, changedFiles, acceptanceSummary, qualityGateSummary, residualRisks, deliveryNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliveryTask = defineTask('issue-637.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, PR, and issue update for issue #637',
  labels: ['issue-637', 'delivery', 'github'],
  agent: {
    name: 'github-delivery-engineer',
    prompt: {
      role: 'release delivery engineer',
      task: 'Deliver the completed issue #637 implementation after all gates pass.',
      instructions: [
        'Only proceed if finalAcceptance.passed is true.',
        `Use implementation branch: ${args.inputs?.implementationBranch}`,
        `Use base branch: ${args.inputs?.baseBranch}`,
        'Commit only files related to issue #637. Do not include unrelated working tree changes.',
        'Push the branch and create or update a PR that links #637.',
        'PR body must summarize implementation, compatibility behavior, residual dependency notes for #576 if any, and quality gates run.',
        'Post a concise comment on #637 with the PR link, summary, quality gates, and residual risks.',
        'Return JSON: { success, branchName, commit, prUrl, issueCommentUrl }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
