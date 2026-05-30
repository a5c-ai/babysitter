/**
 * @process repo/issue-637-hooks-mux-handler-types
 * @description Implement issue #637: add typed hooks-mux handlers for command, http, mcp_tool, prompt, and agent execution modes.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, dependentIssues: number[], relatedIssues: number[], handlerTypes: object[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object, delivery: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Matching command-handler infrastructure exists in packages/hooks-mux/core/src/types/plan.ts, packages/hooks-mux/core/src/normalizer/runner.ts, packages/hooks-mux/core/src/normalizer/plan-resolver.ts, packages/hooks-mux/core/src/api.ts, and packages/hooks-mux/cli/src/cli/commands/invoke.ts.
 * - HandlerRef is currently a shell-only shape with source, handler, and priority. runHandler unconditionally delegates to runShellHandler, and CLI --handler parsing describes shell command handlers only.
 * - Matching agent-mux bridge infrastructure exists in packages/agent-platform/src/harness/amux/amuxBridge.ts, which already forwards an opaque hooks option into agent-mux.
 * - Matching MCP client/tool registry infrastructure exists under packages/agent-platform/src/mcp/client and packages/agent-platform/src/harness/deferredToolRegistry.ts; the plan must avoid a second MCP registry.
 * - No .a5c/reuse-audit.json was present when this process was authored; keyword scan used: HandlerRef, runHandler, runShellHandler, http, mcp_tool, prompt, agent, toolRegistry, amuxBridge.
 *
 * References used while authoring:
 * - docs/agent-stack/hooks/missing-capabilities.md
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-reference/repo-map.md
 * - packages/hooks-mux/ARCHITECTURE.md
 * - methodologies/spec-kit-brownfield.js
 * - tdd-quality-convergence.js
 * - specializations/sdk-platform-development/sdk-testing-strategy.js
 * - specializations/sdk-platform-development/backward-compatibility-management.js
 * - specializations/sdk-platform-development/plugin-extension-architecture.js
 * - specializations/qa-testing-automation/quality-gates.js
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent api-design-reviewer specializations/sdk-platform-development/agents/api-design-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent security-review-agent specializations/sdk-platform-development/agents/security-review-agent/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

function passed(result) {
  return result?.passed === true || result?.approved === true || result?.success === true;
}

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-637.read-issue-context',
  });

  const dependencyReadiness = await ctx.task(auditReuseAndDependenciesTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-637.reuse-audit-dependency-readiness',
  });

  if (dependencyReadiness?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #637 Dependency Or Registry Decision',
      question: dependencyReadiness.question,
      options: [
        'Proceed with stable compatibility seam',
        'Pause until dependency lands',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-637', 'dependency-sequencing'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        dependentIssues: inputs.dependentIssues,
        relatedIssues: inputs.relatedIssues,
        dependencyReadiness,
      },
    });
  }

  const runtimeTrace = await ctx.task(traceRuntimeSurfacesTask, {
    inputs,
    issueContext,
    dependencyReadiness,
  }, {
    key: 'issue-637.trace-runtime-surfaces',
  });

  const handlerContract = await ctx.task(designHandlerContractTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
  }, {
    key: 'issue-637.design-handler-contract',
  });

  if (handlerContract?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #637 Handler Contract Needs Maintainer Input',
      question: handlerContract.question,
      options: [
        'Use recommended contract',
        'Pause for explicit maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-637', 'handler-contract'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        handlerContract,
      },
    });
  }

  const contractTests = await ctx.task(authorContractTestsTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    handlerContract,
  }, {
    key: 'issue-637.author-contract-tests',
  });

  const coreImplementation = await ctx.task(implementCoreDispatchTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    handlerContract,
    contractTests,
  }, {
    key: 'issue-637.implement-core-dispatch',
  });

  const httpImplementation = await ctx.task(implementHttpHandlerTask, {
    inputs,
    issueContext,
    handlerContract,
    contractTests,
    coreImplementation,
  }, {
    key: 'issue-637.implement-http-handler',
  });

  const platformHandlerImplementation = await ctx.task(implementPlatformHandlersTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    handlerContract,
    contractTests,
    coreImplementation,
    httpImplementation,
  }, {
    key: 'issue-637.implement-platform-handlers',
  });

  const bridgeDocsImplementation = await ctx.task(implementBridgeDocsTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    handlerContract,
    implementations: {
      coreImplementation,
      httpImplementation,
      platformHandlerImplementation,
    },
  }, {
    key: 'issue-637.implement-bridge-docs',
  });

  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= (inputs.maxFixAttempts ?? MAX_FIX_ATTEMPTS); attempt++) {
    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      dependencyReadiness,
      runtimeTrace,
      handlerContract,
      contractTests,
      implementations: {
        coreImplementation,
        httpImplementation,
        platformHandlerImplementation,
        bridgeDocsImplementation,
      },
      attempt,
      previousReview: review,
    }, {
      key: `issue-637.verification.${attempt}`,
    });

    review = await ctx.task(reviewIntegrationTask, {
      inputs,
      issueContext,
      dependencyReadiness,
      runtimeTrace,
      handlerContract,
      contractTests,
      verification,
      attempt,
    }, {
      key: `issue-637.review.${attempt}`,
    });

    attempts.push({ attempt, verification, review });

    if (passed(verification) && passed(review)) {
      break;
    }

    if (attempt < (inputs.maxFixAttempts ?? MAX_FIX_ATTEMPTS)) {
      await ctx.task(refineImplementationTask, {
        inputs,
        issueContext,
        dependencyReadiness,
        runtimeTrace,
        handlerContract,
        contractTests,
        verification,
        review,
        attempt,
      }, {
        key: `issue-637.refine.${attempt}`,
      });
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    dependencyReadiness,
    runtimeTrace,
    handlerContract,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-637.final-acceptance',
  });

  const delivery = await ctx.task(deliveryTask, {
    inputs,
    finalGate,
    verification,
    review,
  }, {
    key: 'issue-637.delivery',
  });

  return {
    success: finalGate?.passed === true && delivery?.delivered !== false,
    phases: [
      'issue-context-and-reuse-audit',
      'dependency-readiness',
      'runtime-surface-trace',
      'handler-contract',
      'contract-tests',
      'core-dispatch',
      'typed-handlers',
      'bridge-and-docs',
      'verification-review-refinement',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    verification,
    review,
    delivery,
    attempts,
    metadata: {
      processId: 'repo/issue-637-hooks-mux-handler-types',
      issueNumber: inputs.issueNumber,
      timestamp: ctx.now(),
    },
  };
}

const readIssueContextTask = defineTask('issue-637.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #637 and referenced context',
  labels: ['issue-637', 'context', 'hooks-mux'],
  agent: {
    name: 'hooks-mux-context-researcher',
    prompt: {
      role: 'senior hooks-mux and agent-platform maintainer',
      task: 'Read the issue, comments, labels, referenced docs, and adjacent process plans before implementation work.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read docs/agent-stack/hooks/missing-capabilities.md section 1 in full.',
        'Read .a5c/processes/issue-636-hooks-mux-missing-events.mjs and .a5c/processes/issue-638-hooks-mux-decisions.mjs for adjacent sequencing and quality-gate style.',
        'Read docs/agent-reference/process-authoring.md and honor its plan reuse-audit requirement.',
        'Do not edit files in this task.',
        'Return JSON: { title, labels, issueBody, comments, referencedDocs, adjacentPlans, acceptanceCriteria, constraints, dependencies, nonGoals }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const auditReuseAndDependenciesTask = defineTask('issue-637.reuse-audit-dependency-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run reuse audit and dependency readiness check',
  labels: ['issue-637', 'reuse-audit', 'dependencies', 'quality-gate'],
  agent: {
    name: 'handler-type-reuse-auditor',
    prompt: {
      role: 'senior brownfield integration architect',
      task: 'Determine which existing infrastructure must be reused and whether dependency work is ready enough to implement against.',
      instructions: [
        'Render a section exactly titled: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Scan for HandlerRef, runHandler, runShellHandler, resolveHookPlan, parseHandlerArgs, registerHandler, amuxBridge, deferredToolRegistry, MCP tool registry, invoker, prompt, and agent responder infrastructure.',
        'Check issue dependencies and related issues from inputs:',
        JSON.stringify({ dependentIssues: args.inputs.dependentIssues, relatedIssues: args.inputs.relatedIssues }, null, 2),
        'Issue #636 must be considered a sequencing dependency for event/dispatch infrastructure. Issue #576 must be considered the tool registry integration source for mcp_tool.',
        'Do not invent a parallel MCP registry if an existing registry/tool-mux path is available.',
        'If dependency state or the MCP registry interface is ambiguous enough to risk throwaway work, set needsMaintainerDecision true with one precise question. Otherwise set it false and state the compatibility assumption.',
        'Return JSON: { reuseAudit, dependencyState, stableInterfaces, compatibilityAssumptions, needsMaintainerDecision, question, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const traceRuntimeSurfacesTask = defineTask('issue-637.trace-runtime-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace hook handler runtime surfaces',
  labels: ['issue-637', 'runtime-trace', 'brownfield'],
  agent: {
    name: 'hooks-mux-runtime-tracer',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Trace live execution paths from handler registration through execution, merge, adapter rendering, and agent-platform bridge forwarding.',
      instructions: [
        'Read the target files from inputs and any directly imported files needed to understand the live path.',
        'Trace at least these paths: CLI invoke --handler to HandlerRef; programmatic registerHandler to runNormalized; runPlan to runHandler; runHandler to current shell execution; amuxBridge hooks forwarding; MCP client/tool registry surfaces; agent/prompt invocation surfaces.',
        'Record exact files and function names for each path.',
        'Identify which files are on the live execution path and which are docs/tests only.',
        'Do not edit files in this task.',
        'Return JSON: { runtimeCallPaths, liveFiles, testFiles, bridgeFiles, registryFiles, risks, implementationBoundaries }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const designHandlerContractTask = defineTask('issue-637.design-handler-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design typed handler contract',
  labels: ['issue-637', 'contract', 'api-design', 'quality-gate'],
  agent: {
    name: 'handler-contract-architect',
    prompt: {
      role: 'senior API and compatibility architect',
      task: 'Define the backward-compatible HandlerRef contract and execution semantics for all target handler types.',
      instructions: [
        'Use the issue context, dependency readiness, and runtime trace below:',
        JSON.stringify({
          issueContext: args.issueContext,
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          handlerTypes: args.inputs.handlerTypes,
        }, null, 2),
        'Design a discriminated HandlerRef model where omitted type remains command for backward compatibility.',
        'For each type, specify required config, optional config, timeout/cancellation behavior, result parsing, error classification, diagnostics metadata, and safe defaults.',
        'HTTP must cover POST body shape, URL validation, header interpolation, allowedEnvVars, timeout, and secret-leak/SSRF guardrails.',
        'mcp_tool must integrate with the existing tool registry/tool-mux path from #576 if present, or provide a narrow compatibility seam that can be deleted when #576 lands.',
        'prompt and agent handlers must define bounded runtime, recursion/depth controls, audit metadata, and how they call existing platform invocation surfaces.',
        'Define unsupported type behavior and fail-open/fail-closed interaction without changing existing command semantics.',
        'If a handler type cannot be implemented safely without maintainer input, set needsMaintainerDecision true with one precise question.',
        'Return JSON: { handlerContract, migrationRules, securityControls, timeoutSemantics, diagnostics, testExpectations, needsMaintainerDecision, question, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorContractTestsTask = defineTask('issue-637.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing typed-handler contract tests',
  labels: ['issue-637', 'tests', 'tdd', 'quality-gate'],
  agent: {
    name: 'typed-handler-test-architect',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused failing tests for the typed handler contract before production implementation.',
      instructions: [
        'Edit only test and fixture files in this task.',
        'Use the handler contract below:',
        JSON.stringify(args.handlerContract, null, 2),
        'Cover legacy command HandlerRef with omitted type, explicit command type, dispatch by http/mcp_tool/prompt/agent, unsupported type errors, per-entry timeout, fail-open/fail-closed behavior, diagnostics metadata, and plan sorting compatibility.',
        'Cover HTTP safety: allowedEnvVars interpolation only, no broad process.env leaks, invalid URL rejection, timeout behavior, and JSON result parsing.',
        'Cover mcp_tool integration by mocking the existing registry/tool-mux seam, not by introducing real network or a duplicate registry.',
        'Cover prompt/agent handlers through bounded mocks of existing platform invocation surfaces, including recursion/depth rejection.',
        'Add CLI parsing tests if the implementation contract changes --handler syntax or introduces a config-file path.',
        'Tests should fail before implementation for the missing behavior and should not require real external services.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, coverageByHandlerType, commandsToRun }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementCoreDispatchTask = defineTask('issue-637.implement-core-dispatch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement core HandlerRef typing and dispatch',
  labels: ['issue-637', 'implementation', 'hooks-mux-core'],
  agent: {
    name: 'hooks-mux-core-implementer',
    prompt: {
      role: 'senior TypeScript hooks-mux maintainer',
      task: 'Implement the core typed handler model and dispatcher while preserving command compatibility.',
      instructions: [
        'Edit the repository directly. Keep changes scoped to issue #637.',
        'Use the runtime trace, handler contract, and failing tests below:',
        JSON.stringify({
          runtimeTrace: args.runtimeTrace,
          handlerContract: args.handlerContract,
          contractTests: args.contractTests,
        }, null, 2),
        'Update packages/hooks-mux/core/src/types/plan.ts with a backward-compatible discriminated union. Omitted type must behave as command.',
        'Update packages/hooks-mux/core/src/normalizer/runner.ts to dispatch by handler type instead of always calling runShellHandler.',
        'Move or wrap existing command execution cleanly so current command tests and diagnostics remain compatible.',
        'Update plan resolver sorting only if the new shape requires it, preserving deterministic order.',
        'Update public exports as needed without breaking existing HandlerRef import paths.',
        'Return JSON: { changedFiles, summary, compatibilityNotes, runtimeCallPaths, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementHttpHandlerTask = defineTask('issue-637.implement-http-handler', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement HTTP hook handler',
  labels: ['issue-637', 'implementation', 'http-handler', 'security'],
  agent: {
    name: 'http-handler-implementer',
    prompt: {
      role: 'senior TypeScript networking and security engineer',
      task: 'Implement packages/hooks-mux/core/src/handlers/http.ts and route it through core dispatch.',
      instructions: [
        'Edit the repository directly. Keep changes scoped to issue #637.',
        'Use the handler contract and tests below:',
        JSON.stringify({ handlerContract: args.handlerContract, contractTests: args.contractTests }, null, 2),
        'Implement a POST handler that sends the normalized event, supports explicit headers, interpolates only allowed environment variables, enforces timeout/cancellation, and parses compatible JSON UnifiedHookResult responses.',
        'Reject unsafe or unsupported URLs according to the contract. Do not leak arbitrary environment variables.',
        'Classify errors so runner fail-open/fail-closed policy works exactly as with command handlers.',
        'Avoid introducing new runtime dependencies unless package policy and existing package.json patterns require it.',
        'Return JSON: { changedFiles, summary, securityControls, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementPlatformHandlersTask = defineTask('issue-637.implement-platform-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement MCP tool, prompt, and agent handlers',
  labels: ['issue-637', 'implementation', 'mcp-tool', 'prompt-handler', 'agent-handler'],
  agent: {
    name: 'platform-handler-implementer',
    prompt: {
      role: 'senior agent-platform integration engineer',
      task: 'Implement mcp_tool, prompt, and agent handler modules using existing platform seams.',
      instructions: [
        'Edit the repository directly. Keep changes scoped to issue #637.',
        'Use the dependency readiness, runtime trace, handler contract, and tests below:',
        JSON.stringify({
          dependencyReadiness: args.dependencyReadiness,
          runtimeTrace: args.runtimeTrace,
          handlerContract: args.handlerContract,
          contractTests: args.contractTests,
        }, null, 2),
        'Add packages/hooks-mux/core/src/handlers/mcp-tool.ts, packages/hooks-mux/core/src/handlers/prompt.ts, and packages/hooks-mux/core/src/handlers/agent.ts.',
        'mcp_tool must use or adapt to the existing MCP client/tool registry path. If #576 is not landed, create only a narrow injectable executor seam with tests, and document the assumption.',
        'prompt handler must use existing prompt/model invocation facilities where available, with timeout, cancellation, audit metadata, and bounded output parsing.',
        'agent handler must use existing agent responder/agent-mux invocation surfaces where available, with maxTurns/depth controls and no unbounded self-recursion.',
        'All handlers must return UnifiedHookResult-compatible output and propagate HandlerError/HandlerTimeoutError categories for runner policy.',
        'Return JSON: { changedFiles, summary, registryIntegration, recursionControls, residualGaps, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementBridgeDocsTask = defineTask('issue-637.implement-bridge-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Wire bridge config and update documentation',
  labels: ['issue-637', 'implementation', 'agent-platform', 'docs'],
  agent: {
    name: 'bridge-docs-implementer',
    prompt: {
      role: 'senior agent-platform and documentation maintainer',
      task: 'Wire typed handler config through agent-platform bridge surfaces and update docs that claimed the capability was missing.',
      instructions: [
        'Edit the repository directly. Keep changes scoped to issue #637.',
        'Use the handler contract and implementations below:',
        JSON.stringify({ handlerContract: args.handlerContract, implementations: args.implementations }, null, 2),
        'Update packages/agent-platform/src/harness/amux/amuxBridge.ts or adjacent types only where needed to preserve typed hook handler config through the bridge.',
        'Update docs/agent-stack/hooks/missing-capabilities.md section 1 after implementation, noting any deferred limitations around #576 or dependency sequencing.',
        'Update package exports or README snippets only if required for consumers to use the new handler types.',
        'Return JSON: { changedFiles, summary, docsUpdated, bridgeBehavior, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const runVerificationGateTask = defineTask('issue-637.verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run typed-handler verification gates',
  labels: ['issue-637', 'verification', 'quality-gate'],
  agent: {
    name: 'typed-handler-verifier',
    prompt: {
      role: 'senior CI and release verification engineer',
      task: 'Run fresh verification and report evidence without claiming success unless commands pass.',
      instructions: [
        'Run the verification commands exactly as listed unless a command is unavailable; if unavailable, record the exact blocker and closest targeted substitute.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'At minimum verify hooks-mux build/test/lint, agent-platform affected tests, metadata verification, and git diff --check.',
        'Also run the targeted tests created for issue #637.',
        'Check that every handler type from inputs has explicit tests and that legacy command HandlerRef behavior is still covered.',
        'Read full command output, record exit codes, and count failures. Do not summarize a failing command as passed.',
        'Return JSON: { passed, commandResults, handlerCoverage, legacyCompatibility, docsStatus, evidenceGaps, changedFiles }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewIntegrationTask = defineTask('issue-637.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review implementation against typed-handler contract',
  labels: ['issue-637', 'review', 'quality-gate'],
  agent: {
    name: 'typed-handler-contract-reviewer',
    prompt: {
      role: 'senior hooks-mux code reviewer',
      task: 'Review the final diff against issue #637, the handler contract, and verification evidence.',
      instructions: [
        'Use a code-review stance. Findings first, ordered by severity, with file/line references.',
        'Compare implementation directly to the handler contract. Ignore optimistic summaries if the diff or tests disagree.',
        'Check for backwards incompatibility in HandlerRef, command handler behavior, plan sorting, CLI --handler behavior, fail-open/fail-closed policy, timeout semantics, and public exports.',
        'Check HTTP safety for secret leakage, URL validation, header interpolation, timeout/cancellation, and response parsing.',
        'Check mcp_tool for registry duplication or drift from #576/tool-mux direction.',
        'Check prompt/agent handlers for recursion, unbounded runtime/cost, cancellation, audit metadata, and use of existing platform seams.',
        'Inputs:',
        JSON.stringify({
          handlerContract: args.handlerContract,
          dependencyReadiness: args.dependencyReadiness,
          verification: args.verification,
        }, null, 2),
        'Return JSON: { approved, findings, missingCoverage, residualRisks, summary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const refineImplementationTask = defineTask('issue-637.refine', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Repair verification or review gaps',
  labels: ['issue-637', 'repair', 'implementation'],
  agent: {
    name: 'typed-handler-repair-engineer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Repair only the concrete gaps found by verification or review.',
      instructions: [
        'Edit the repository directly. Keep the repair narrowly scoped to issue #637.',
        'Contract, verification, and review context:',
        JSON.stringify({
          handlerContract: args.handlerContract,
          verification: args.verification,
          review: args.review,
          attempt: args.attempt,
        }, null, 2),
        'Add or adjust tests first when the gap is behavioral.',
        'Do not rewrite unrelated hook capabilities from docs/agent-stack/hooks/missing-capabilities.md.',
        'Return JSON: { changedFiles, fixes, remainingRisks, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalAcceptanceGateTask = defineTask('issue-637.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate',
  labels: ['issue-637', 'final-gate', 'quality-gate'],
  agent: {
    name: 'typed-handler-final-gate',
    prompt: {
      role: 'release gatekeeper',
      task: 'Decide whether issue #637 is ready for delivery based on evidence only.',
      instructions: [
        'Verify all quality gates from inputs are satisfied.',
        JSON.stringify(args.inputs.qualityGates, null, 2),
        'Verification must have passed and review must be approved. If not, set passed false and list blockers.',
        'Confirm no implementation work from #636, #638, or unrelated missing hook capabilities was silently included beyond required compatibility seams.',
        'Confirm docs identify any residual #576-related limitation truthfully.',
        'Return JSON: { passed, blockers, changedFiles, qualityGateStatus, residualRisks, releaseNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliveryTask = defineTask('issue-637.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, PR, and issue update',
  labels: ['issue-637', 'delivery', 'github'],
  agent: {
    name: 'github-delivery-engineer',
    prompt: {
      role: 'senior maintainer responsible for GitHub delivery',
      task: 'Prepare the implementation branch for review after all gates pass.',
      instructions: [
        'Only proceed if finalGate.passed is true, verification.passed is true, and review.approved is true.',
        'Do not stage unrelated dirty worktree files.',
        `Use branch ${args.inputs.targetBranch} based on ${args.inputs.baseBranch}.`,
        'Commit the scoped implementation, tests, and docs with a concise issue-linked message.',
        `Push the branch and create a PR against ${args.inputs.baseBranch} with a title that starts with "Fix:". Link to #${args.inputs.issueNumber}.`,
        `Post a comment on #${args.inputs.issueNumber} summarizing implemented handler types, verification commands, residual gaps if any, and the PR link.`,
        'Return JSON: { delivered, commit, prUrl, issueCommentUrl, skippedReason }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
