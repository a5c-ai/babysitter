/**
 * @process repo/issue-576-unify-tool-registries
 * @description Implement issue #576: make tool-mux the canonical registry and dispatch layer, replacing DeferredToolRegistry and McpToolRegistry consumers.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxFixAttempts?: number, relatedIssues: number[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object, delivery: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - tool-mux already owns ToolRegistry, ToolDispatcher, McpBridge, ToolHookBridge, schema/provider translation, and unit tests.
 * - agent-core and agent-platform still own copied DeferredToolRegistry implementations consumed by tool_search/tool_fetch.
 * - agent-platform still owns McpToolRegistry plus McpToolExecutor; McpBridge currently registers descriptors only and does not preserve MCP runtime execution by itself.
 * - agent-core code_executor currently invokes an in-memory map of agent-core tool definitions directly rather than dispatching through ToolDispatcher.
 * - docs/agent-layer-gaps.md records the same three-registry split and calls out the no-op ToolHookBridge and declarative-only McpBridge.
 * - The requested .a5c/process-library/ path is absent in this checkout; matching methodology references were researched under /home/runner/.a5c/process-library/babysitter-repo/library.
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - /home/runner/.a5c/process-library/babysitter-repo/library/cradle/feature-implementation-contribute.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared/tdd-triplet.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/superpowers/test-driven-development.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development/sdk-testing-strategy.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/ai-agents-conversational/tool-safety-validation.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/cli-mcp-development/mcp-server-registry-discovery.js
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent mcp-integration-architect specializations/cli-mcp-development/agents/mcp-integration-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent tool-safety-reviewer specializations/ai-agents-conversational/agents/tool-safety-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_FIX_ATTEMPTS = 3;

function asJson(value) {
  return JSON.stringify(value ?? {}, null, 2);
}

const repositoryContext = [
  'You are working in the a5c-ai/babysitter repository.',
  'This run implements issue #576 only: unify tool registries so tool-mux is canonical.',
  'Preserve unrelated worktree changes and keep edits scoped to the issue boundary.',
  'Use agent tasks for commands and verification; do not create shell subtasks for this repo workflow.',
].join('\n');

const sourceOfTruthInstructions = [
  'Read current source materials directly at task execution time.',
  'Required issue/context reads:',
  '- gh issue view 576 --json title,body,labels,comments',
  '- gh pr view 576 --json files,title,body,comments 2>/dev/null || true',
  '- docs/agent-layer-gaps.md sections for tool-mux, SDK MCP server, and registry split',
  '- related issues #580, #588, #598, #600, and #602 only enough to preserve boundaries and dependencies',
  'Treat the issue body, comments, and labels as authoritative. The triage comment on May 30, 2026 requires preserving deferred schema loading, source-qualified names, MCP lifecycle/execution, plugin tools, and hook semantics before deleting old registries.',
].join('\n');

const issueBoundaryInstructions = [
  'Required outcome: tool-mux ToolRegistry and ToolDispatcher become the live registry/dispatch path for builtin, plugin/custom, and MCP tools.',
  'Preserve current tool_search/tool_fetch behavior, including lightweight search, lazy full schema fetch, cache behavior, source/sourceQualifier filtering, stable ranking, and duplicate names across sources.',
  'Preserve current code_executor behavior and limits while routing nested tool calls through ToolDispatcher.',
  'Preserve MCP lifecycle and execution through McpClientManager/McpToolExecutor while using McpBridge/ToolRegistry for discovery and dispatcher routing.',
  'Activate ToolHookBridge integration for PreToolUse/PostToolUse allow/deny/audit behavior without making hooks-mux a brittle hard dependency where package boundaries disallow it.',
  'Remove or convert DeferredToolRegistry and McpToolRegistry only after compatibility shims, exports, docs, and tests prove old import paths either still work or intentionally fail with migration guidance.',
  'Do not implement unrelated #600 shell/background deduplication, #602 external agent discovery, #598 SDK effect executor routing, or #588 streaming/AbortSignal metadata beyond fields required to avoid blocking this registry integration.',
].join('\n');

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 576;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const implementationBranch = inputs?.implementationBranch ?? 'agent/issue-576-unify-tool-registries';
  const maxFixAttempts = inputs?.maxFixAttempts ?? DEFAULT_MAX_FIX_ATTEMPTS;

  const issueContext = await ctx.task(readIssueContextTask, {
    issueNumber,
    relatedIssues: inputs?.relatedIssues ?? [580, 588, 598, 600, 602],
  }, {
    key: 'issue-576.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-576.reuse-audit',
  });

  const architectureTrace = await ctx.task(traceToolRegistryArchitectureTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-576.architecture-trace',
  });

  const semanticDesign = await ctx.task(designUnifiedToolSemanticsTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
  }, {
    key: 'issue-576.semantic-design',
  });

  if (semanticDesign?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #576 Tool Identity Or Hook Semantics Need Decision',
      question: semanticDesign.question,
      options: [
        'Proceed with recommended unified semantics',
        'Pause for explicit maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-576', 'tool-mux', 'registry-semantics'],
      context: {
        runId: ctx.runId,
        issueNumber,
        semanticDesign,
      },
    });
  }

  const contractTests = await ctx.task(authorContractTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    semanticDesign,
  }, {
    key: 'issue-576.contract-tests',
  });

  const branch = await ctx.task(prepareImplementationBranchTask, {
    baseBranch,
    implementationBranch,
  }, {
    key: 'issue-576.prepare-branch',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxFixAttempts; attempt += 1) {
    implementation = await ctx.task(implementUnifiedRegistryTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      semanticDesign,
      contractTests,
      branch,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-576.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      architectureTrace,
      semanticDesign,
      contractTests,
      implementation,
      attempt,
    }, {
      key: `issue-576.verification.${attempt}`,
    });

    review = await ctx.task(reviewToolIntegrationTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      semanticDesign,
      contractTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-576.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }

    if (attempt >= maxFixAttempts) {
      await ctx.breakpoint({
        title: 'Issue #576 Verification Or Review Gate Failed',
        question: 'The unified tool registry implementation did not pass verification or review within the configured attempt budget. Continue refinement or stop for maintainer intervention?',
        options: ['Continue refinement', 'Stop for maintainer intervention'],
        expert: 'owner',
        tags: ['approval-gate', 'issue-576', 'quality-gate'],
        context: {
          runId: ctx.runId,
          issueNumber,
          verification,
          review,
          attempts,
        },
      });
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    semanticDesign,
    contractTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-576.final-acceptance',
  });

  const delivery = await ctx.task(deliveryTask, {
    issueNumber,
    deliveryPrNumber: inputs?.deliveryPrNumber ?? 687,
    baseBranch,
    implementationBranch,
    finalGate,
    verification,
    review,
  }, {
    key: 'issue-576.delivery',
  });

  return {
    success: Boolean(finalGate?.passed === true && delivery?.delivered === true),
    phases: [
      'issue-context',
      'reuse-audit',
      'architecture-trace',
      'semantic-design',
      'contract-tests-first',
      'branch-preparation',
      'unified-registry-implementation',
      'verification-loop',
      'tool-safety-and-compatibility-review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: architectureTrace?.runtimeCallPaths ?? [],
    issueContext,
    reuseAudit,
    architectureTrace,
    semanticDesign,
    contractTests,
    branch,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
    delivery,
  };
}

export const readIssueContextTask = defineTask('issue-576.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #576 and related registry context',
  labels: ['issue-576', 'tool-mux', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter agent-stack architect',
      task: 'Read the authoritative GitHub and documentation context for issue #576.',
      instructions: [
        repositoryContext,
        sourceOfTruthInstructions,
        `Issue number: ${args.issueNumber}`,
        `Related issues to inspect lightly: ${(args.relatedIssues ?? []).join(', ')}`,
        'Read all comments and labels carefully. Preserve raw issue/comment details that affect implementation order.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, relatedIssues, acceptanceCriteria, explicitNonGoals, affectedPackages, riskLevel, priority, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-576.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for unified tool registry',
  labels: ['issue-576', 'reuse-audit', 'tool-mux', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Run the repo-required Phase 0 reuse audit before proposing new registry or dispatch infrastructure.',
      instructions: [
        repositoryContext,
        'Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from the issue: DeferredToolRegistry, McpToolRegistry, ToolRegistry, ToolDispatcher, McpBridge, ToolHookBridge, tool_search, tool_fetch, code_executor, sourceQualifier, lazy schema, MCP lifecycle, plugin tools, PreToolUse, PostToolUse.',
        'Search the repo for matching implementations, package dependencies, public exports, imports, tests, docs, environment variables, and package boundary constraints. Honor .a5c/reuse-audit.json if present.',
        'Start with inputs.targetFiles, then follow imports and consumers.',
        'Identify existing infrastructure to reuse, duplicate implementations to retire, compatibility shims required, and new infrastructure that is forbidden or unnecessary.',
        'Do not edit files in this task.',
        'Issue context JSON:',
        asJson(args.issueContext),
        'Target files JSON:',
        asJson(args.inputs?.targetFiles),
        'Return JSON: { renderedFindings, keywords, existingInfrastructure, duplicateImplementations, importAndExportMap, packageBoundaryNotes, candidateTests, noMatchNotes, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceToolRegistryArchitectureTask = defineTask('issue-576.trace-tool-registry-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace current tool registry and dispatch architecture',
  labels: ['issue-576', 'tool-mux', 'runtime-trace', 'architecture'],
  agent: {
    name: 'mcp-integration-architect',
    prompt: {
      role: 'senior TypeScript agent-platform and MCP integration engineer',
      task: 'Map the live execution paths and package contracts that must move to tool-mux.',
      instructions: [
        repositoryContext,
        issueBoundaryInstructions,
        'Use the issue context and reuse audit below.',
        'Issue context JSON:',
        asJson(args.issueContext),
        'Reuse audit JSON:',
        asJson(args.reuseAudit),
        'Inspect these likely files first, then follow imports and tests:',
        asJson(args.inputs?.targetFiles),
        'Trace agent-core createAgentCoreToolDefinitions, discovery tools, DeferredToolRegistry, code_executor, onToolUse, allowed/disabled tool lists, and public exports.',
        'Trace agent-platform harness copied discovery registry and createRun/planProcess tool injection surfaces.',
        'Trace agent-platform MCP manager, McpToolRegistry, McpToolExecutor, config persistence, connection lifecycle, and any existing tests or docs.',
        'Trace tool-mux ToolRegistry, ToolDispatcher, McpBridge, ToolHookBridge, provider schema translation, package exports, and tests.',
        'Trace hooks-mux PreToolUse/PostToolUse types and execution APIs that can back a production ToolHookBridge.',
        'Identify where source-qualified identity and duplicate names currently break because ToolRegistry indexes only by name.',
        'Return JSON: { currentState, runtimeCallPaths, liveEntryPoints, publicImportPaths, packageBoundaryFindings, identityCollisionFindings, hookIntegrationFindings, mcpLifecycleFindings, candidateTestFiles, proposedImplementationSlices, outOfScope, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designUnifiedToolSemanticsTask = defineTask('issue-576.design-unified-tool-semantics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design canonical registry, dispatch, MCP, and hook semantics',
  labels: ['issue-576', 'tool-mux', 'design', 'semantics'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior API compatibility and runtime semantics engineer',
      task: 'Design the smallest coherent issue #576 implementation in testable slices.',
      instructions: [
        repositoryContext,
        issueBoundaryInstructions,
        'Use this JSON context as constraints:',
        asJson({
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          architectureTrace: args.architectureTrace,
        }),
        'Define canonical ToolDescriptor identity. It must support duplicate tool names across builtin, plugin/custom, and MCP sources without losing the existing source/sourceQualifier lookup contract.',
        'Define lazy schema loading in tool-mux. Prefer extending ToolDescriptor/ToolRegistry with optional lazy schema metadata or adapter APIs over reintroducing DeferredToolRegistry under a new name.',
        'Define search and fetch behavior for tool_search/tool_fetch using tool-mux, including ranking, max_results, source validation, source_qualifier filtering, and stable error messages.',
        'Define ToolDispatcher execution for agent-core builtin tools and code_executor nested tool calls while preserving max_tool_calls, timeout, onToolUse, and result wrapping semantics.',
        'Define MCP registration and execution so McpBridge populates ToolRegistry and ToolDispatcher delegates MCP execution through the live McpToolExecutor/McpClientManager lifecycle.',
        'Define ToolHookBridge integration with hooks-mux PreToolUse/PostToolUse: allow, deny, audit, failure behavior, metadata, and package dependency strategy.',
        'Define compatibility and removal strategy for agent-core DeferredToolRegistry, agent-platform DeferredToolRegistry, and McpToolRegistry exports.',
        'Set needsMaintainerDecision true only if identity semantics, hook dependency direction, or backward compatibility cannot be resolved safely from source materials.',
        'Return JSON: { identityModel, registryApiChanges, lazySchemaPlan, searchFetchPlan, dispatchPlan, mcpBridgeExecutionPlan, hookBridgePlan, compatibilityPlan, implementationSlices, testPlan, docsPlan, needsMaintainerDecision, question, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractTestsTask = defineTask('issue-576.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests before registry implementation',
  labels: ['issue-576', 'tests', 'tdd', 'quality-gate'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer practicing strict TDD',
      task: 'Add focused failing tests for issue #576 before implementation changes.',
      instructions: [
        repositoryContext,
        issueBoundaryInstructions,
        'You own test files only in this task. Do not modify implementation files.',
        'Use the issue, reuse audit, architecture trace, and semantic design JSON as the executable spec source.',
        asJson({
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          architectureTrace: args.architectureTrace,
          semanticDesign: args.semanticDesign,
        }),
        'Add or update tool-mux tests for source-qualified identity, duplicate names across sources, lazy schema loading and cache invalidation, source/server removal, and dispatcher resolution by qualified identity.',
        'Add or update agent-core tests proving tool_search/tool_fetch behavior is backed by tool-mux and code_executor nested calls route through ToolDispatcher without changing limits or result shapes.',
        'Add or update agent-platform tests proving copied deferred registry behavior is removed or shimmed through tool-mux.',
        'Add or update MCP tests proving McpBridge registration preserves server identity and ToolDispatcher executes MCP calls through McpToolExecutor/McpClientManager, including list/refresh/cache and execution error behavior.',
        'Add or update hook tests proving PreToolUse allow/deny and PostToolUse audit/failure are invoked through a production ToolHookBridge and that deny short-circuits execution.',
        'Run targeted tests or document exact red-state commands and expected failures. Use commands from inputs.verificationCommands where relevant.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsRun, failureEvidence, coverageMap, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const prepareImplementationBranchTask = defineTask('issue-576.prepare-implementation-branch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare implementation branch',
  labels: ['issue-576', 'git', 'branch'],
  agent: {
    name: 'git-branch-preparer',
    prompt: {
      role: 'repository maintainer',
      task: 'Prepare the implementation branch for issue #576 without disturbing unrelated worktree changes.',
      instructions: [
        repositoryContext,
        `Base branch: ${args.baseBranch}`,
        `Implementation branch: ${args.implementationBranch}`,
        'Check current branch and worktree status.',
        'Create or switch to the implementation branch from the base branch. Do not stash, reset, or revert unrelated changes.',
        'If unrelated local changes block branch preparation, report the blocker instead of overwriting them.',
        'Return JSON: { branchReady, currentBranch, baseBranch, implementationBranch, blockers }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementUnifiedRegistryTask = defineTask('issue-576.implement-unified-registry', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement unified tool registry attempt ${args.attempt}`,
  labels: ['issue-576', 'tool-mux', 'implementation', 'refactor'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript agent-stack engineer',
      task: 'Implement issue #576 in focused slices against the pre-authored tests.',
      instructions: [
        repositoryContext,
        sourceOfTruthInstructions,
        issueBoundaryInstructions,
        'Do not weaken or delete regression tests to fit the implementation.',
        'Use this run context:',
        asJson({
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          architectureTrace: args.architectureTrace,
          semanticDesign: args.semanticDesign,
          contractTests: args.contractTests,
          previousVerification: args.previousVerification,
          previousReview: args.previousReview,
          attempt: args.attempt,
        }),
        'Implementation order:',
        '1. Extend tool-mux ToolRegistry/ToolDescriptor only as needed for source-qualified identity, search, lazy schema fetch, server/source removal, and compatibility adapters.',
        '2. Move agent-core tool_search/tool_fetch to tool-mux. Keep source/source_qualifier behavior, invalid-source errors, JSON result shape, and no-registry error behavior compatible unless the design explicitly changes it.',
        '3. Wire agent-core code_executor nested calls through ToolDispatcher, preserving timeout, max_tool_calls, onToolUse, VM isolation, and result wrapping.',
        '4. Replace agent-platform copied DeferredToolRegistry consumption with tool-mux-backed compatibility or direct ToolRegistry usage.',
        '5. Connect agent-platform MCP discovery through McpBridge and MCP execution through ToolDispatcher plus McpToolExecutor/McpClientManager. Preserve connection lifecycle, refresh/cache behavior, qualified name support, and execution error reporting.',
        '6. Implement a production ToolHookBridge adapter backed by hooks-mux PreToolUse/PostToolUse where package boundaries allow; otherwise place the bridge in the package with the legal dependency direction and inject it into ToolDispatcher.',
        '7. Remove duplicate registry code and update package exports/docs after tests prove compatibility. If an old export must stay temporarily, make it a thin compatibility shim with explicit deprecation comments.',
        '8. Update docs/agent-layer-gaps.md, package READMEs, and tests only where claims changed.',
        'Return JSON: { changedFiles, summary, registrySemantics, dispatchSemantics, mcpSemantics, hookSemantics, compatibilityNotes, docsUpdated, testsExpectedToPass, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-576.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run unified tool registry verification gate attempt ${args.attempt}`,
  labels: ['issue-576', 'verification', 'quality-gate', 'tool-mux'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior TypeScript verification engineer',
      task: 'Run targeted and package-level quality gates for issue #576.',
      instructions: [
        repositoryContext,
        'Run commands directly in this agent task and capture exact command, exit code, and relevant output.',
        'Verification commands from inputs:',
        asJson(args.inputs?.verificationCommands),
        'Also run any targeted tests named by the contract test task or implementation summary.',
        'Search guard requirements:',
        '- no live consumer should still require DeferredToolRegistry except approved compatibility shims or tests',
        '- no live consumer should still require McpToolRegistry except approved compatibility shims or tests',
        '- code_executor nested tool calls should route through ToolDispatcher',
        '- MCP execution should route through McpToolExecutor/McpClientManager, not a declarative-only descriptor path',
        '- ToolHookBridge should no longer be no-op-only for production dispatch paths',
        'Check package dependency direction, public exports, docs claims, and unrelated file churn.',
        'Run git diff --check and ensure no generated dist/lockfile churn unless justified.',
        'Implementation JSON:',
        asJson(args.implementation),
        'Return JSON: { passed, commands, failures, preExistingFailures, changedFiles, searchGuards, packageBoundaryNotes, coverageNotes, nextFixInstructions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewToolIntegrationTask = defineTask('issue-576.review-tool-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review unified tool registry integration attempt ${args.attempt}`,
  labels: ['issue-576', 'review', 'tool-safety', 'compatibility'],
  agent: {
    name: 'tool-safety-reviewer',
    prompt: {
      role: 'senior tool safety, MCP, and API compatibility reviewer',
      task: 'Review the issue #576 implementation for behavioral regressions and contract drift.',
      instructions: [
        repositoryContext,
        sourceOfTruthInstructions,
        issueBoundaryInstructions,
        'Read the final diff and relevant changed files directly during review.',
        'Prioritize bugs, behavioral regressions, missing tests, security/tool-safety risks, package-boundary violations, and public API compatibility issues. Findings must include file and line references.',
        'Compare issue requirements to artifacts directly; ignore optimistic summaries when the code disagrees.',
        'Review these areas in depth:',
        '- source-qualified identity and duplicate names across builtin, plugin/custom, and MCP',
        '- lazy schema loading and cache invalidation',
        '- tool_search/tool_fetch result and error shapes',
        '- code_executor dispatcher integration and nested call limits',
        '- MCP lifecycle, refresh, cache, qualified names, execution, errors, and server removal',
        '- hook allow/deny/audit/failure behavior and package dependency direction',
        '- old registry export compatibility or deprecation behavior',
        '- docs that claim tool-mux is not integrated',
        'Context JSON:',
        asJson({
          issueContext: args.issueContext,
          semanticDesign: args.semanticDesign,
          contractTests: args.contractTests,
          implementation: args.implementation,
          verification: args.verification,
        }),
        'Return JSON: { approved, findings, missingTests, securityRisks, compatibilityRisks, packageBoundaryRisks, docsRisks, requiredChanges, changedFiles, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-576.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #576',
  labels: ['issue-576', 'final-gate', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'release-minded agent-stack compatibility auditor',
      task: 'Decide whether issue #576 is complete and ready for delivery.',
      instructions: [
        repositoryContext,
        issueBoundaryInstructions,
        'Use the full run context below:',
        asJson({
          inputs: args.inputs,
          issueContext: args.issueContext,
          reuseAudit: args.reuseAudit,
          architectureTrace: args.architectureTrace,
          semanticDesign: args.semanticDesign,
          contractTests: args.contractTests,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          attempts: args.attempts,
        }),
        'Pass only if: tests were authored before implementation, tool-mux is the live registry and dispatcher path, current discovery behavior is preserved, MCP lifecycle and execution are preserved, hook bridge behavior is active, duplicate registries are removed or compatibility-shimmed, targeted/package gates passed, review approved, and docs/export claims are updated.',
        'If a maintainer decision is still needed, set passed false and describe the exact unresolved decision.',
        'Return JSON: { passed, changedFiles, acceptanceResults, verificationSummary, reviewSummary, unresolvedItems, releaseNotesCandidate, followUps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliveryTask = defineTask('issue-576.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, update PR #687, and comment on PR #687',
  labels: ['issue-576', 'delivery', 'github'],
  agent: {
    name: 'github-delivery-maintainer',
    prompt: {
      role: 'repository maintainer',
      task: 'Deliver the completed issue #576 implementation through GitHub.',
      instructions: [
        repositoryContext,
        `Issue number: ${args.issueNumber}`,
        `Delivery PR number: ${args.deliveryPrNumber}`,
        `Base branch: ${args.baseBranch}`,
        `Implementation branch: ${args.implementationBranch}`,
        'Final gate JSON:',
        asJson(args.finalGate),
        'Verification JSON:',
        asJson(args.verification),
        'Review JSON:',
        asJson(args.review),
        'Only proceed if finalGate.passed is true, verification.passed is true, and review.approved is true.',
        'Stage only issue #576 implementation, tests, docs, and process artifacts if they were intentionally changed. Do not stage unrelated local changes.',
        'Commit with an issue-specific message.',
        'Push the implementation branch.',
        'Do not create a new PR when deliveryPrNumber is present. Update the existing PR branch instead.',
        'In the existing PR, summarize unified registry/dispatch changes, MCP bridge/executor integration, ToolHookBridge behavior, compatibility strategy, and quality gates run if the body needs updating.',
        'Post a comment on PR #687 with the implementation summary and concise quality-gate summary.',
        'Return JSON: { delivered, commit, prUrl, issueCommentUrl, blockers }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
