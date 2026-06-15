/**
 * @process repo/issue-598-sdk-tasks-mux-hooks-integration
 * @description Implementation process for issue #598: integrate SDK task metadata, tasks-mux routing, tool-mux dispatch, hooks-mux lifecycle wiring, and plugin registry ownership.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, relatedIssues: number[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], contract: object, implementation: object, verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Issue #598 is an integration umbrella spanning SDK effect/task surfaces, tasks-mux routing, tool-mux dispatch, hooks-mux lifecycle wiring, MCP registration, and plugin registry ownership.
 * - Issue comments update the architecture: unified effect execution routes through tasks-mux (#633), not a standalone SDK executor.
 * - Matching existing infrastructure exists in SDK task/effect serialization, SDK runtime hooks, SDK MCP task tools, tasks-mux responder routing/backends, tool-mux ToolRegistry/ToolDispatcher/McpBridge/ToolHookBridge, hooks-mux normalized lifecycle APIs, agent-core DeferredToolRegistry, agent-platform McpToolRegistry/McpToolExecutor, and SDK/adapters plugin registries.
 * - Repo-local .a5c/process-library was not present while this plan was authored. Matching methodology references were found under /home/runner/.a5c/process-library/babysitter-repo/library: atdd-tdd, process-hardening, verification-before-completion, planning-with-files, sdk-architecture-design, sdk-testing-strategy, plugin-extension-architecture, and backward-compatibility-management.
 * - This process intentionally uses agent tasks instead of shell tasks to honor the repo-specific babysitter:call override. Verification agents still run concrete commands and report exact exit codes.
 *
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/planning-with-files/planning-orchestrator
 * @process specializations/sdk-platform-development/sdk-architecture-design
 * @process specializations/sdk-platform-development/sdk-testing-strategy
 * @process specializations/sdk-platform-development/plugin-extension-architecture
 * @process specializations/sdk-platform-development/backward-compatibility-management
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent api-design-reviewer specializations/sdk-platform-development/agents/api-design-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_REPAIR_ATTEMPTS = 3;

function approved(result) {
  return result?.passed === true || result?.approved === true || result?.success === true;
}

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}

export async function process(inputs = {}, ctx) {
  const issueNumber = inputs.issueNumber ?? 598;
  const maxRepairAttempts = inputs.maxRepairAttempts ?? DEFAULT_MAX_REPAIR_ATTEMPTS;

  const context = await ctx.task(readIssueAndReuseAuditTask, {
    ...inputs,
    issueNumber,
  }, {
    key: 'issue-598.phase-0.context-reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceRuntimePathsTask, {
    ...inputs,
    issueNumber,
    context,
  }, {
    key: 'issue-598.phase-1.runtime-paths',
  });

  const contract = await ctx.task(authorIntegrationContractTask, {
    ...inputs,
    issueNumber,
    context,
    runtimeTrace,
  }, {
    key: 'issue-598.phase-2.integration-contract',
  });

  if (contract.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #598 Integration Contract Decision',
      question: contract.question ?? 'The integration contract found an ambiguity that should be resolved before implementation. Choose whether to continue with the recommended contract or pause for maintainer input.',
      context: {
        issueNumber,
        runId: ctx.runId,
        recommendedPath: contract.recommendedPath,
        risks: contract.risks,
      },
    }, {
      breakpointId: 'issue-598.integration-contract-decision',
      tags: ['issue-598', 'contract', 'maintainer-decision'],
      strategy: 'single',
    });
  }

  const tests = await ctx.task(authorContractTestsTask, {
    ...inputs,
    issueNumber,
    context,
    runtimeTrace,
    contract,
  }, {
    key: 'issue-598.phase-3.tests-first',
  });

  const taskMetadataSlice = await ctx.task(implementTaskMetadataSliceTask, {
    ...inputs,
    issueNumber,
    context,
    runtimeTrace,
    contract,
    tests,
  }, {
    key: 'issue-598.phase-4.task-metadata',
  });

  const routingSlice = await ctx.task(implementRoutingSliceTask, {
    ...inputs,
    issueNumber,
    context,
    runtimeTrace,
    contract,
    tests,
    taskMetadataSlice,
  }, {
    key: 'issue-598.phase-5.routing',
  });

  const hooksSlice = await ctx.task(implementHooksSliceTask, {
    ...inputs,
    issueNumber,
    context,
    runtimeTrace,
    contract,
    tests,
    taskMetadataSlice,
    routingSlice,
  }, {
    key: 'issue-598.phase-6.hooks',
  });

  const pluginSlice = await ctx.task(implementPluginRegistrySliceTask, {
    ...inputs,
    issueNumber,
    context,
    runtimeTrace,
    contract,
    tests,
    taskMetadataSlice,
    routingSlice,
    hooksSlice,
  }, {
    key: 'issue-598.phase-7.plugin-registry',
  });

  const repairs = [];
  let verification = null;
  let review = null;

  for (let attempt = 1; attempt <= maxRepairAttempts; attempt += 1) {
    verification = await ctx.task(runVerificationGateTask, {
      ...inputs,
      issueNumber,
      context,
      runtimeTrace,
      contract,
      tests,
      implementation: {
        taskMetadataSlice,
        routingSlice,
        hooksSlice,
        pluginSlice,
        repairs,
      },
      attempt,
    }, {
      key: `issue-598.phase-8.verification.${attempt}`,
    });

    review = await ctx.task(reviewImplementationTask, {
      ...inputs,
      issueNumber,
      context,
      runtimeTrace,
      contract,
      tests,
      verification,
      implementation: {
        taskMetadataSlice,
        routingSlice,
        hooksSlice,
        pluginSlice,
        repairs,
      },
      attempt,
    }, {
      key: `issue-598.phase-9.review.${attempt}`,
    });

    if (approved(verification) && approved(review)) {
      break;
    }

    if (attempt < maxRepairAttempts) {
      const repair = await ctx.task(repairImplementationTask, {
        ...inputs,
        issueNumber,
        context,
        runtimeTrace,
        contract,
        tests,
        verification,
        review,
        attempt,
      }, {
        key: `issue-598.phase-10.repair.${attempt}`,
      });
      repairs.push(repair);
    }
  }

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    ...inputs,
    issueNumber,
    context,
    runtimeTrace,
    contract,
    tests,
    implementation: {
      taskMetadataSlice,
      routingSlice,
      hooksSlice,
      pluginSlice,
      repairs,
    },
    verification,
    review,
  }, {
    key: 'issue-598.phase-11.final-acceptance',
  });

  return {
    success: finalAcceptance.passed === true,
    phases: [
      'context-and-reuse-audit',
      'runtime-path-trace',
      'integration-contract',
      'tests-first',
      'task-metadata-slice',
      'tasks-mux-tool-mux-routing-slice',
      'hooks-mux-lifecycle-slice',
      'plugin-registry-slice',
      'verification-and-review',
      'final-acceptance',
    ],
    issueNumber,
    baseBranch: inputs.baseBranch ?? 'staging',
    implementationBranch: inputs.implementationBranch,
    contract,
    runtimeCallPaths: runtimeTrace.runtimeCallPaths,
    tests,
    implementation: {
      taskMetadataSlice,
      routingSlice,
      hooksSlice,
      pluginSlice,
      repairs,
    },
    verification,
    review,
    finalAcceptance,
    metadata: {
      processId: 'issue-598-sdk-tasks-mux-hooks-integration',
      completedAt: new Date().toISOString(),
      maxRepairAttempts,
    },
  };
}

export const readIssueAndReuseAuditTask = defineTask('issue-598/read-issue-and-reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Read issue context and perform reuse audit',
  labels: ['issue-598', 'context', 'reuse-audit', 'planning'],
  agent: {
    name: 'sdk-platform-context-researcher',
    prompt: {
      role: 'senior SDK platform maintainer performing the mandatory reuse audit',
      task: 'Read issue #598, its comments and labels, related issues, repo references, and process-library guidance before implementation starts.',
      instructions: [
        `Run and read: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run and read: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read docs/agent-layer-gaps.md, docs/agent-reference/process-authoring.md, docs/agent-reference/command-surfaces.md, docs/adapters-babysitter-integrations/tasks-mux-routing.md, docs/adapters-babysitter-integrations/effect-resolution.md, docs/adapters-babysitter-integrations/external-agent-tasks.md, and docs/plugins.md.',
        'Research process-library guidance. The prompt requested .a5c/process-library; if absent, record that fact and use the active user-level process-library under /home/runner/.a5c/process-library/babysitter-repo/library.',
        'Extract keyword nouns and verbs from the issue: SDK, effect execution, tasks-mux, tool-mux, hooks-mux, PreToolUse, PostToolUse, lifecycle, JSON Schema parameters, MCP, plugin registry, DeferredToolRegistry, McpToolRegistry, ToolDispatcher, McpBridge, TaskDef, callRuntimeHook.',
        'Scan for matching existing migrations, API routes, environment variables, SDK dependencies, imports, tests, registries, and runtime call sites.',
        'Render a section exactly titled: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Do not edit files.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['issueTitle', 'labels', 'commentsRead', 'reuseAudit', 'processLibraryFindings', 'acceptanceCriteria', 'nonGoals', 'relatedIssueStatus', 'knownAmbiguities'],
      properties: {
        issueTitle: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
        commentsRead: { type: 'array', items: { type: 'object' } },
        reuseAudit: { type: 'object' },
        processLibraryFindings: { type: 'array', items: { type: 'object' } },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        nonGoals: { type: 'array', items: { type: 'string' } },
        relatedIssueStatus: { type: 'array', items: { type: 'object' } },
        knownAmbiguities: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: io(taskCtx),
}));

export const traceRuntimePathsTask = defineTask('issue-598/trace-runtime-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1 - Trace live runtime call paths',
  labels: ['issue-598', 'runtime-trace', 'brownfield', 'quality-gate'],
  agent: {
    name: 'runtime-path-architect',
    prompt: {
      role: 'senior TypeScript runtime integration architect',
      task: 'Trace the live SDK, tasks-mux, tool-mux, hooks-mux, MCP, and plugin registry paths that issue #598 can safely change.',
      instructions: [
        'Use the context and reuse audit below as source material.',
        JSON.stringify(args.context ?? {}, null, 2),
        'Do not edit files.',
        'Trace file/function hops for: SDK ctx.task and task definition serialization; run iteration and task:post result commit; SDK MCP task discovery; tasks-mux responder routing and backends; tool-mux ToolRegistry, ToolDispatcher, McpBridge, and ToolHookBridge; agent-core DeferredToolRegistry/tool_fetch/tool_search; agent-platform McpToolRegistry/McpToolExecutor and orchestration effect paths; hooks-mux normalized lifecycle APIs and adapters; SDK runtime hook dispatch; SDK plugin registry and adapters plugin manager surfaces.',
        'Separate live call paths from documentation-only or stale design paths.',
        'Identify files that should not be edited because they are off path or belong to related but separate issues.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['runtimeCallPaths', 'candidateFiles', 'candidateTests', 'filesToAvoid', 'dependencyRisks', 'missingSeams'],
      properties: {
        runtimeCallPaths: { type: 'object' },
        candidateFiles: { type: 'array', items: { type: 'string' } },
        candidateTests: { type: 'array', items: { type: 'string' } },
        filesToAvoid: { type: 'array', items: { type: 'string' } },
        dependencyRisks: { type: 'array', items: { type: 'string' } },
        missingSeams: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: io(taskCtx),
}));

export const authorIntegrationContractTask = defineTask('issue-598/author-integration-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2 - Author integration contract',
  labels: ['issue-598', 'contract', 'architecture', 'quality-gate'],
  agent: {
    name: 'sdk-platform-contract-architect',
    prompt: {
      role: 'senior API and runtime contract architect',
      task: 'Define the authoritative implementation contract for issue #598 before tests or production code are changed.',
      instructions: [
        'Use the issue context, reuse audit, and runtime trace below.',
        JSON.stringify({ context: args.context, runtimeTrace: args.runtimeTrace }, null, 2),
        'Do not edit files.',
        'The contract must make tasks-mux the effect/task routing authority. Do not create a standalone SDK effect executor.',
        'Define additive TaskDef/task.json JSON Schema parameter metadata needed for tool discovery and historical replay compatibility.',
        'Define how SDK MCP task discovery registers through tool-mux McpBridge and how tool-mux ToolDispatcher mediates concrete dispatch.',
        'Define a hooks-mux-backed ToolHookBridge for PreToolUse/PostToolUse and a mapping from SDK runtime lifecycle hooks to hooks-mux phases.',
        'Define the plugin registry ownership boundary between SDK plugin registry flows and agent-platform/adapters plugin systems, including migration compatibility expectations.',
        'State package dependency direction and any adapter/interface needed to avoid cycles.',
        'Set needsMaintainerDecision true only if a specific ambiguity cannot be resolved from issue comments and existing docs.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedPath', 'acceptanceCriteria', 'apiContracts', 'packageBoundaries', 'testStrategy', 'compatibilityRules', 'outOfScope', 'risks', 'needsMaintainerDecision'],
      properties: {
        recommendedPath: { type: 'string' },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        apiContracts: { type: 'array', items: { type: 'object' } },
        packageBoundaries: { type: 'array', items: { type: 'object' } },
        testStrategy: { type: 'array', items: { type: 'object' } },
        compatibilityRules: { type: 'array', items: { type: 'string' } },
        outOfScope: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'object' } },
        needsMaintainerDecision: { type: 'boolean' },
        question: { type: 'string' },
      },
    },
  },
  io: io(taskCtx),
}));

export const authorContractTestsTask = defineTask('issue-598/author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3 - Author failing contract tests',
  labels: ['issue-598', 'tests-first', 'atdd', 'tdd'],
  agent: {
    name: 'sdk-platform-test-architect',
    prompt: {
      role: 'senior cross-package TypeScript test engineer',
      task: 'Author focused failing tests for issue #598 before production implementation.',
      instructions: [
        'Edit only test files and fixtures in this phase.',
        'Use the approved contract and runtime trace below.',
        JSON.stringify({ contract: args.contract, runtimeTrace: args.runtimeTrace }, null, 2),
        'Cover additive TaskDef parameter schema metadata and old task.json replay compatibility.',
        'Cover SDK MCP/task discovery exposing schemas through tool-mux registration.',
        'Cover tasks-mux routing for SDK effects without a standalone SDK executor.',
        'Cover tool-mux dispatch invoking hooks-mux-backed PreToolUse/PostToolUse mediation.',
        'Cover SDK runtime lifecycle mapping to hooks-mux without breaking shell/plugin hook discovery.',
        'Cover plugin registry compatibility for installed-plugin discovery, marketplace resolution, and migration behavior.',
        'Use fakes for MCP servers, external agents, and hook handlers. Do not require live credentials or network.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'testsAdded', 'expectedInitialFailures', 'coverageMap', 'redCommands'],
      properties: {
        changedFiles: { type: 'array', items: { type: 'string' } },
        testsAdded: { type: 'array', items: { type: 'string' } },
        expectedInitialFailures: { type: 'array', items: { type: 'string' } },
        coverageMap: { type: 'array', items: { type: 'object' } },
        redCommands: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: io(taskCtx),
}));

export const implementTaskMetadataSliceTask = defineTask('issue-598/implement-task-metadata-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4 - Implement SDK task metadata and discovery slice',
  labels: ['issue-598', 'implementation', 'sdk', 'task-metadata'],
  agent: {
    name: 'sdk-task-metadata-implementer',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Implement the additive SDK TaskDef/task.json parameter schema metadata and discovery slice.',
      instructions: [
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Use the issue context, runtime trace, contract, and tests below.',
        JSON.stringify({ context: args.context, runtimeTrace: args.runtimeTrace, contract: args.contract, tests: args.tests }, null, 2),
        'Keep serialized task changes additive and backward compatible with historical task records.',
        'Add or update public types, defineTask validation/helpers, serializer behavior, SDK MCP task discovery, and focused docs only where the traced path requires it.',
        'Do not implement routing, hooks, or plugin registry changes in this slice except for seams explicitly required by the metadata contract.',
      ],
    },
    outputSchema: implementationOutputSchema(),
  },
  io: io(taskCtx),
}));

export const implementRoutingSliceTask = defineTask('issue-598/implement-routing-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5 - Implement tasks-mux and tool-mux routing slice',
  labels: ['issue-598', 'implementation', 'tasks-mux', 'tool-mux'],
  agent: {
    name: 'routing-integration-implementer',
    prompt: {
      role: 'senior runtime routing engineer',
      task: 'Implement the tasks-mux routing and tool-mux dispatch integration slice for issue #598.',
      instructions: [
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Use tasks-mux as the effect/task routing authority. Do not add a standalone SDK effect executor.',
        'Use or adapt tool-mux ToolRegistry, ToolDispatcher, and McpBridge as the concrete tool dispatch/registration boundary.',
        'Preserve compatibility with agent-core DeferredToolRegistry and agent-platform McpToolRegistry/McpToolExecutor while migrating live call sites through the contract.',
        'Keep package dependencies acyclic. Prefer thin adapter interfaces when a direct package import would create a cycle.',
        'Use fakes in tests for external agents, MCP servers, and humans.',
        JSON.stringify({ runtimeTrace: args.runtimeTrace, contract: args.contract, tests: args.tests, taskMetadataSlice: args.taskMetadataSlice }, null, 2),
      ],
    },
    outputSchema: implementationOutputSchema(),
  },
  io: io(taskCtx),
}));

export const implementHooksSliceTask = defineTask('issue-598/implement-hooks-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6 - Implement hooks-mux lifecycle bridge slice',
  labels: ['issue-598', 'implementation', 'hooks-mux', 'tool-mux'],
  agent: {
    name: 'hooks-mux-bridge-implementer',
    prompt: {
      role: 'senior hooks-mux and SDK runtime engineer',
      task: 'Wire tool-mux and SDK runtime hooks through hooks-mux lifecycle events.',
      instructions: [
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Replace no-op-only tool hook behavior on the traced path with a hooks-mux-backed bridge for PreToolUse/PostToolUse.',
        'Map SDK runtime lifecycle calls to hooks-mux phases without removing existing SDK shell/plugin hook discovery compatibility.',
        'Define and test fail-open versus fail-closed behavior. PreToolUse deny/ask semantics must be honored only where the contract and hooks-mux support blocking.',
        'PostToolUse must observe success and failure without retroactively corrupting tool results.',
        JSON.stringify({ runtimeTrace: args.runtimeTrace, contract: args.contract, tests: args.tests, routingSlice: args.routingSlice }, null, 2),
      ],
    },
    outputSchema: implementationOutputSchema(),
  },
  io: io(taskCtx),
}));

export const implementPluginRegistrySliceTask = defineTask('issue-598/implement-plugin-registry-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7 - Reconcile plugin registry ownership slice',
  labels: ['issue-598', 'implementation', 'plugins', 'compatibility'],
  agent: {
    name: 'plugin-registry-compatibility-implementer',
    prompt: {
      role: 'senior plugin platform engineer',
      task: 'Reconcile SDK plugin registry responsibilities with platform and adapters plugin flows.',
      instructions: [
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Identify the minimal ownership boundary needed for issue #598. Do not rewrite unrelated marketplace or install flows.',
        'Keep existing installed-plugin registry files, marketplace resolution, and migration behavior compatible.',
        'Add compatibility tests before changing registry behavior where not already covered by the tests-first phase.',
        JSON.stringify({ context: args.context, runtimeTrace: args.runtimeTrace, contract: args.contract, tests: args.tests }, null, 2),
      ],
    },
    outputSchema: implementationOutputSchema(),
  },
  io: io(taskCtx),
}));

export const runVerificationGateTask = defineTask('issue-598/run-verification-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8 - Run deterministic verification gates',
  labels: ['issue-598', 'verification', 'quality-gate'],
  agent: {
    name: 'cross-package-verifier',
    prompt: {
      role: 'senior CI and release verification engineer',
      task: 'Run focused and broad verification commands, then report exact pass/fail evidence.',
      instructions: [
        'Run the verification commands listed below unless a command is unavailable. Record exact exit code, command, and a concise failure summary for every command.',
        JSON.stringify(args.verificationCommands ?? [], null, 2),
        'Also run git diff --check.',
        'Run source audits that fail if the implementation adds a standalone SDK effect executor or direct adapters bypass for routable SDK effects.',
        'Do not mark verification as passed unless all required commands and audits pass.',
        'If a command is skipped, provide the exact reason and residual risk.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'audits', 'failures', 'skipped', 'residualRisk'],
      properties: {
        passed: { type: 'boolean' },
        commands: { type: 'array', items: { type: 'object' } },
        audits: { type: 'array', items: { type: 'object' } },
        failures: { type: 'array', items: { type: 'object' } },
        skipped: { type: 'array', items: { type: 'object' } },
        residualRisk: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: io(taskCtx),
}));

export const reviewImplementationTask = defineTask('issue-598/review-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9 - Review integration against contract',
  labels: ['issue-598', 'review', 'quality-gate'],
  agent: {
    name: 'cross-package-code-reviewer',
    prompt: {
      role: 'senior cross-package code reviewer',
      task: 'Review the final diff against issue #598, the integration contract, tests, and verification evidence.',
      instructions: [
        'Use a code-review stance. Findings first, ordered by severity, with file and line references.',
        'Block on regressions in task replay compatibility, tasks-mux routing authority, tool-mux dispatch mediation, hooks-mux lifecycle semantics, MCP discovery, plugin registry compatibility, or package dependency cycles.',
        'Verify tests are meaningful and would fail on the previous behavior.',
        'Verify source audits rule out standalone SDK executor drift and direct adapters bypasses for routable task effects.',
        JSON.stringify({ contract: args.contract, tests: args.tests, verification: args.verification }, null, 2),
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'findings', 'acceptanceStatus', 'testAssessment', 'residualRisk'],
      properties: {
        approved: { type: 'boolean' },
        findings: { type: 'array', items: { type: 'object' } },
        acceptanceStatus: { type: 'array', items: { type: 'object' } },
        testAssessment: { type: 'array', items: { type: 'object' } },
        residualRisk: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: io(taskCtx),
}));

export const repairImplementationTask = defineTask('issue-598/repair-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10 - Repair failed verification or review',
  labels: ['issue-598', 'repair', 'quality-gate'],
  agent: {
    name: 'integration-repair-engineer',
    prompt: {
      role: 'senior TypeScript maintainer repairing a bounded integration',
      task: 'Fix only the failures reported by verification and review for issue #598.',
      instructions: [
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Do not broaden scope beyond the contract and reported failures.',
        'Add or adjust tests when the failure reveals a missing assertion.',
        JSON.stringify({ verification: args.verification, review: args.review, contract: args.contract, attempt: args.attempt }, null, 2),
      ],
    },
    outputSchema: implementationOutputSchema(),
  },
  io: io(taskCtx),
}));

export const finalAcceptanceTask = defineTask('issue-598/final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11 - Final acceptance and delivery summary',
  labels: ['issue-598', 'final-acceptance'],
  agent: {
    name: 'final-acceptance-reviewer',
    prompt: {
      role: 'release owner',
      task: 'Produce final acceptance evidence for issue #598.',
      instructions: [
        'Confirm whether all acceptance criteria are met from the contract, review, and verification evidence.',
        'Confirm implementation did not add a standalone SDK effect executor and did not bypass tasks-mux for routable SDK effects.',
        'Confirm backwards compatibility risks and skipped checks are explicitly documented.',
        'Return passed=false if verification or review is not approved.',
        JSON.stringify({ contract: args.contract, verification: args.verification, review: args.review, implementation: args.implementation }, null, 2),
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'summary', 'acceptanceStatus', 'verificationSummary', 'remainingRisks', 'deliveryNotes'],
      properties: {
        passed: { type: 'boolean' },
        summary: { type: 'string' },
        acceptanceStatus: { type: 'array', items: { type: 'object' } },
        verificationSummary: { type: 'array', items: { type: 'object' } },
        remainingRisks: { type: 'array', items: { type: 'string' } },
        deliveryNotes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: io(taskCtx),
}));

function implementationOutputSchema() {
  return {
    type: 'object',
    required: ['changedFiles', 'summary', 'testsRun', 'compatibilityNotes', 'remainingRisks'],
    properties: {
      changedFiles: { type: 'array', items: { type: 'string' } },
      summary: { type: 'string' },
      testsRun: { type: 'array', items: { type: 'object' } },
      compatibilityNotes: { type: 'array', items: { type: 'string' } },
      remainingRisks: { type: 'array', items: { type: 'string' } },
      verificationCommands: { type: 'array', items: { type: 'string' } },
    },
  };
}
