/**
 * @process repo/issue-598-sdk-tasks-mux-hooks-integration
 * @description Plan and execute issue #598: SDK task metadata, tasks-mux effect routing, tool-mux dispatch, hooks-mux lifecycle wiring, and plugin registry reconciliation.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, relatedIssues: number[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], runtimeCallPaths: object, implementation: object, verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Matching existing infrastructure was found in SDK task/effect serialization, runtime hooks, process schemas, MCP tools, tasks-mux routing/backends, tool-mux ToolRegistry/ToolDispatcher/McpBridge, hooks-mux lifecycle/adapter packages, agent-core DeferredToolRegistry, agent-platform McpToolRegistry/McpToolExecutor, and SDK/platform plugin registry surfaces.
 * - Issue #598 has an architecture update: effect execution should route through tasks-mux (#633), not through a standalone SDK effect executor.
 * - Prior planning PR #667 existed for this issue and was closed after implementation started; this process refreshes the plan around tasks-mux as routing authority and keeps hooks-mux lifecycle wiring independent.
 * - The active process library was searched at /home/runner/.a5c/process-library/babysitter-repo/library. Relevant patterns: methodologies/atdd-tdd/atdd-tdd.js, methodologies/process-hardening/process-hardening-patterns.js, methodologies/superpowers/verification-before-completion.js, methodologies/planning-with-files/planning-orchestrator.js, and specializations/sdk-platform-development/sdk-architecture-design.js.
 * - No repo-local .a5c/process-library directory exists; use the active process-library binding reported by `babysitter process-library:active --json`.
 *
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/planning-with-files/planning-orchestrator
 * @process specializations/sdk-platform-development/sdk-architecture-design
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent api-design-reviewer specializations/sdk-platform-development/agents/api-design-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_REPAIR_ATTEMPTS = 3;

function passed(result) {
  return result?.passed === true || result?.approved === true || result?.success === true;
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 598;
  const maxRepairAttempts = inputs?.maxRepairAttempts ?? DEFAULT_MAX_REPAIR_ATTEMPTS;

  const context = await ctx.task(collectContextAndReuseAuditTask, {
    ...inputs,
    issueNumber,
  }, {
    key: 'issue-598.context-and-reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceRuntimeCallPathsTask, {
    ...inputs,
    issueNumber,
    contextStdout: context.stdout,
  }, {
    key: 'issue-598.runtime-call-paths',
  });

  const contract = await ctx.task(designIntegrationContractTask, {
    ...inputs,
    issueNumber,
    contextStdout: context.stdout,
    runtimeTrace,
  }, {
    key: 'issue-598.integration-contract',
  });

  if (contract?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #598 Integration Contract Decision',
      question: contract.question,
      options: [
        'Use recommended contract and continue',
        'Pause for maintainer clarification',
      ],
      expert: 'owner',
      tags: ['issue-598', 'contract', 'approval-gate'],
      context: {
        runId: ctx.runId,
        issueNumber,
        contract,
      },
    });
  }

  const tests = await ctx.task(authorContractTestsTask, {
    ...inputs,
    issueNumber,
    contextStdout: context.stdout,
    runtimeTrace,
    contract,
  }, {
    key: 'issue-598.contract-tests-first',
  });

  const taskMetadataImplementation = await ctx.task(implementTaskMetadataTask, {
    ...inputs,
    issueNumber,
    contextStdout: context.stdout,
    runtimeTrace,
    contract,
    tests,
  }, {
    key: 'issue-598.implement-task-metadata',
  });

  const routingImplementation = await ctx.task(implementTasksMuxToolMuxRoutingTask, {
    ...inputs,
    issueNumber,
    contextStdout: context.stdout,
    runtimeTrace,
    contract,
    tests,
    taskMetadataImplementation,
  }, {
    key: 'issue-598.implement-tasks-mux-tool-mux-routing',
  });

  const hookImplementation = await ctx.task(implementHooksMuxBridgeTask, {
    ...inputs,
    issueNumber,
    contextStdout: context.stdout,
    runtimeTrace,
    contract,
    tests,
    taskMetadataImplementation,
    routingImplementation,
  }, {
    key: 'issue-598.implement-hooks-mux-bridge',
  });

  const pluginImplementation = await ctx.task(reconcilePluginRegistryTask, {
    ...inputs,
    issueNumber,
    contextStdout: context.stdout,
    runtimeTrace,
    contract,
    tests,
    implementations: {
      taskMetadataImplementation,
      routingImplementation,
      hookImplementation,
    },
  }, {
    key: 'issue-598.reconcile-plugin-registry',
  });

  let verification = null;
  let review = null;
  const repairs = [];

  for (let attempt = 1; attempt <= maxRepairAttempts; attempt += 1) {
    verification = await ctx.task(runVerificationGateTask, {
      ...inputs,
      issueNumber,
      contextStdout: context.stdout,
      runtimeTrace,
      contract,
      tests,
      implementations: {
        taskMetadataImplementation,
        routingImplementation,
        hookImplementation,
        pluginImplementation,
      },
      attempt,
      previousReview: review,
    }, {
      key: `issue-598.verification.${attempt}`,
    });

    review = await ctx.task(reviewIntegrationTask, {
      ...inputs,
      issueNumber,
      contextStdout: context.stdout,
      runtimeTrace,
      contract,
      tests,
      verification,
      attempt,
    }, {
      key: `issue-598.review.${attempt}`,
    });

    if (passed(verification) && passed(review)) {
      break;
    }

    if (attempt < maxRepairAttempts) {
      const repair = await ctx.task(repairImplementationTask, {
        ...inputs,
        issueNumber,
        contextStdout: context.stdout,
        runtimeTrace,
        contract,
        tests,
        verification,
        review,
        attempt,
      }, {
        key: `issue-598.repair.${attempt}`,
      });
      repairs.push(repair);
    }
  }

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    ...inputs,
    issueNumber,
    contextStdout: context.stdout,
    runtimeTrace,
    contract,
    tests,
    implementations: {
      taskMetadataImplementation,
      routingImplementation,
      hookImplementation,
      pluginImplementation,
    },
    verification,
    review,
    repairs,
  }, {
    key: 'issue-598.final-acceptance',
  });

  return {
    success: finalAcceptance?.passed === true,
    phases: [
      'context-and-reuse-audit',
      'runtime-call-path-trace',
      'integration-contract',
      'contract-tests-first',
      'task-schema-metadata',
      'tasks-mux-tool-mux-routing',
      'hooks-mux-lifecycle-bridge',
      'plugin-registry-reconciliation',
      'verification-review-repair-loop',
      'final-acceptance',
    ],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? {},
    contract,
    tests,
    implementation: {
      taskMetadataImplementation,
      routingImplementation,
      hookImplementation,
      pluginImplementation,
      repairs,
    },
    verification,
    review,
    finalAcceptance,
  };
}

export const collectContextAndReuseAuditTask = defineTask('issue-598.collect-context-and-reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Collect issue context and reuse-audit findings',
  labels: ['issue-598', 'context', 'reuse-audit', 'sdk', 'tasks-mux', 'hooks-mux'],
  shell: {
    command: [
      'set -euo pipefail',
      `printf "%s\\n" "=== Issue #${args.issueNumber} ==="`,
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `printf "%s\\n" "=== PR #${args.issueNumber} probe ==="`,
      `gh pr view ${args.issueNumber} --json files,title,body,comments || true`,
      'printf "%s\\n" "=== Related issue context ==="',
      ...(args.relatedIssues ?? []).map((issue) => `gh issue view ${issue} --json title,body,labels,comments || true`),
      'printf "%s\\n" "=== Reuse-audit findings (REVIEW BEFORE PROCEEDING) ==="',
      'printf "%s\\n" "Keywords: SDK effects, tasks-mux routing, tool-mux dispatch, hooks-mux lifecycle, PreToolUse, PostToolUse, task JSON Schema parameters, plugin registry, DeferredToolRegistry, McpToolRegistry, ToolDispatcher, NoopToolHookBridge, callRuntimeHook."',
      'printf "%s\\n" "--- Existing infrastructure matches ---"',
      'rg -n "Effect execution scattered|No tool metadata in tasks|Hooks disconnected|Plugin registry parallel|ToolDispatcher|NoopToolHookBridge|DeferredToolRegistry|McpToolRegistry|TaskRouter|RoutableTaskDef|callRuntimeHook|resolveAndPostEffect|resolveEffectWithRetry|inputSchema|outputSchema|parameters" docs packages plugins .a5c/processes -S || true',
      'printf "%s\\n" "--- Process-library active binding and matching references ---"',
      'babysitter process-library:active --json || true',
      'find /home/runner/.a5c/process-library/babysitter-repo/library -type f \\( -path "*/atdd-tdd/*" -o -path "*/process-hardening/*" -o -path "*/superpowers/verification-before-completion.js" -o -path "*/planning-with-files/*" -o -path "*/sdk-platform-development/*" \\) | sort | sed -n "1,220p" || true',
      'printf "%s\\n" "--- Existing issue #598 plan artifacts, if any ---"',
      'find .a5c/processes -maxdepth 1 -type f | sort | rg "598|sdk.*hooks|tasks-mux|hooks-mux" || true',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: io(taskCtx),
}));

export const traceRuntimeCallPathsTask = defineTask('issue-598.trace-runtime-call-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace SDK, tasks-mux, tool-mux, hooks-mux, and plugin runtime paths',
  labels: ['issue-598', 'runtime-trace', 'brownfield', 'quality-gate'],
  agent: {
    name: 'sdk-platform-runtime-architect',
    prompt: {
      role: 'senior TypeScript runtime integration engineer',
      task: 'Trace live runtime call paths before design or implementation work.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this task.',
        'Trace these paths with file/function hops: SDK ctx.task creation and task definition serialization; EffectAction replay and task:post result commit; tasks-mux routing/backends from RoutableTaskDef to responder selection; tool-mux ToolRegistry, ToolDispatcher, McpBridge, and hook bridge; agent-core DeferredToolRegistry/tool_fetch/tool_search; agent-platform McpToolRegistry/McpToolExecutor and orchestration effects; hooks-mux lifecycle event representation/dispatch; SDK runtime hook dispatch; SDK and platform plugin registry flows.',
        'Account for issue #633: effect resolution must route through tasks-mux rather than a new standalone SDK effect executor.',
        'Separate files on the live execution path from documentation, generated catalog, or historical artifacts that should not be modified unless a later contract requires them.',
        'Return JSON: { runtimeCallPaths, filesToModify, filesToAvoid, existingTests, missingTests, integrationRisks, openQuestions }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const designIntegrationContractTask = defineTask('issue-598.design-integration-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design integration contract and migration slices',
  labels: ['issue-598', 'architecture', 'contract', 'quality-gate'],
  agent: {
    name: 'sdk-platform-contract-architect',
    prompt: {
      role: 'principal SDK/platform architect',
      task: 'Design the issue #598 integration contract before tests or implementation.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'RUNTIME TRACE (verbatim JSON):',
        '---',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        '---',
        'Do not edit files in this task.',
        'Define additive task JSON Schema metadata that works for task/tool discovery while preserving old task.json replay.',
        'Define effect routing ownership: tasks-mux routes responder/backend selection; tool-mux owns concrete tool registry/dispatch; SDK owns journaling/replay/task metadata; agent-platform consumes the routing boundary without direct agent-mux bypass.',
        'Define hooks-mux bridge behavior for SDK lifecycle events and tool-mux PreToolUse/PostToolUse, including fail-open/fail-closed semantics, mutation/blocking support, and compatibility with existing callRuntimeHook tests.',
        'Define plugin registry responsibility boundaries and a migration path that avoids breaking installed-plugin discovery or platform plugin flows.',
        'Split implementation into independently reviewable slices with compatibility checkpoints.',
        'Set needsMaintainerDecision true only for a decision that cannot be derived from issue #598, related issues, or current code.',
        'Return JSON: { contract, implementationSlices, compatibilityRules, acceptanceCriteria, outOfScope, targetFiles, testMatrix, needsMaintainerDecision, question, risks }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const authorContractTestsTask = defineTask('issue-598.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests before implementation',
  labels: ['issue-598', 'tests', 'atdd', 'tdd', 'quality-gate'],
  agent: {
    name: 'sdk-platform-contract-test-author',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Write deterministic failing tests that lock the issue #598 contract before production code changes.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'INTEGRATION CONTRACT (verbatim JSON):',
        '---',
        JSON.stringify(args.contract ?? {}, null, 2),
        '---',
        'Edit tests and fixtures only. Do not change production source files in this task.',
        'Prefer extending existing suites under packages/sdk/src/**/__tests__, packages/tasks-mux/src/**, packages/tool-mux/src/**/__tests__, packages/hooks-mux/**/__tests__, packages/agent-core/src/**, and packages/agent-platform/src/**.',
        'Cover: backward-compatible TaskDef/task.json schema metadata; SDK MCP/task discovery exposing JSON Schema parameters; tasks-mux routing of SDK effects; tool-mux dispatch and PreToolUse/PostToolUse mediation; hooks-mux lifecycle mapping for SDK task/run/iteration events; agent-platform no longer bypassing tasks-mux/tool-mux for targeted effects; plugin registry compatibility.',
        'Tests must use fakes and fixtures. Do not require live MCP servers, provider credentials, network access, or installed external agents.',
        'Return JSON: { changedFiles, testsAdded, redCommands, expectedFailureSignals, coverageByAcceptanceCriterion }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementTaskMetadataTask = defineTask('issue-598.implement-task-metadata', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SDK task JSON Schema metadata slice',
  labels: ['issue-598', 'implementation', 'sdk', 'task-schema'],
  agent: {
    name: 'sdk-task-schema-implementer',
    prompt: {
      role: 'senior Babysitter SDK maintainer',
      task: 'Implement the task metadata slice for issue #598.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT AND TEST PLAN (verbatim JSON):',
        '---',
        JSON.stringify({ contract: args.contract, tests: args.tests }, null, 2),
        '---',
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Keep serialized task changes additive and backward compatible for old task.json records.',
        'Expose canonical input/output JSON Schema metadata where SDK task discovery, MCP tools, tasks-mux routing, and tool_fetch consumers can read it.',
        'Do not introduce a standalone effect executor in the SDK.',
        'Return JSON: { changedFiles, summary, schemaFields, compatibilityNotes, verificationCommands }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementTasksMuxToolMuxRoutingTask = defineTask('issue-598.implement-tasks-mux-tool-mux-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement tasks-mux routing and tool-mux dispatch slice',
  labels: ['issue-598', 'implementation', 'tasks-mux', 'tool-mux', 'agent-platform'],
  agent: {
    name: 'tasks-tool-routing-implementer',
    prompt: {
      role: 'senior runtime routing engineer',
      task: 'Route SDK effect resolution through tasks-mux and concrete tool execution through tool-mux.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT, TESTS, AND PRIOR SLICE (verbatim JSON):',
        '---',
        JSON.stringify({
          contract: args.contract,
          tests: args.tests,
          taskMetadataImplementation: args.taskMetadataImplementation,
        }, null, 2),
        '---',
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Make tasks-mux the routing authority for SDK effect responder/backend selection, following issue #633.',
        'Use tool-mux ToolRegistry/ToolDispatcher/McpBridge for tool descriptors and concrete tool dispatch where the traced paths prove tool execution is in scope.',
        'Preserve existing agent-core DeferredToolRegistry and agent-platform McpToolRegistry behavior through adapters or compatibility facades until callers are migrated.',
        'Prevent direct agent-mux bypass paths for the targeted SDK effect routing path, while keeping unrelated harness launch behavior out of scope.',
        'Return JSON: { changedFiles, summary, routingBoundary, compatibilityNotes, verificationCommands }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementHooksMuxBridgeTask = defineTask('issue-598.implement-hooks-mux-bridge', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement hooks-mux lifecycle and tool hook bridge slice',
  labels: ['issue-598', 'implementation', 'hooks-mux', 'tool-mux', 'sdk'],
  agent: {
    name: 'hooks-mux-bridge-implementer',
    prompt: {
      role: 'senior hooks-mux and SDK lifecycle engineer',
      task: 'Wire SDK runtime hooks and tool-mux tool hooks through hooks-mux lifecycle events.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT, TESTS, AND PRIOR SLICES (verbatim JSON):',
        '---',
        JSON.stringify({
          contract: args.contract,
          tests: args.tests,
          taskMetadataImplementation: args.taskMetadataImplementation,
          routingImplementation: args.routingImplementation,
        }, null, 2),
        '---',
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Replace or wrap NoopToolHookBridge on the traced path with a hooks-mux-backed bridge for PreToolUse and PostToolUse.',
        'Map SDK runtime lifecycle events from callRuntimeHook to hooks-mux phases without breaking existing SDK shell/plugin hook discovery.',
        'Honor block/mutation semantics only where hooks-mux and the traced runtime path already support them; otherwise fail open and record a compatibility note.',
        'Add tests for run/task/iteration lifecycle events, tool before/after events, failure behavior, and backward-compatible no-hook operation.',
        'Return JSON: { changedFiles, summary, lifecycleMapping, failOpenFailClosedRules, verificationCommands }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const reconcilePluginRegistryTask = defineTask('issue-598.reconcile-plugin-registry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconcile SDK and platform plugin registry responsibilities',
  labels: ['issue-598', 'implementation', 'plugins', 'compatibility'],
  agent: {
    name: 'plugin-registry-compatibility-engineer',
    prompt: {
      role: 'senior plugin platform maintainer',
      task: 'Reconcile SDK plugin registry responsibilities with platform/plugin package flows.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT, TESTS, AND PRIOR IMPLEMENTATION SLICES (verbatim JSON):',
        '---',
        JSON.stringify({
          contract: args.contract,
          tests: args.tests,
          implementations: args.implementations,
        }, null, 2),
        '---',
        'Edit the repository directly, preserving unrelated worktree changes.',
        'Define one ownership boundary for plugin discovery/registration while preserving installed-plugin migrations and existing SDK CLI behavior.',
        'Prefer adapters and compatibility tests over broad registry replacement when callers are not yet migrated.',
        'Do not introduce unrelated plugin marketplace or installation behavior.',
        'Return JSON: { changedFiles, summary, ownershipBoundary, compatibilityNotes, verificationCommands }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const runVerificationGateTask = defineTask('issue-598.run-verification-gates', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run deterministic verification gates',
  labels: ['issue-598', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      ...(args.verificationCommands ?? []),
      'printf "%s\\n" "--- Source audit: forbidden standalone executor / bypass patterns ---"',
      '! rg -n "class .*EffectExecutor|new .*EffectExecutor|standalone.*effect executor|direct.*agent-mux|agentMux.*dispatch" packages/sdk/src packages/agent-platform/src packages/tasks-mux/src packages/tool-mux/src -S',
      'printf "%s\\n" "--- Diff hygiene ---"',
      'git diff --check',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: io(taskCtx),
}));

export const reviewIntegrationTask = defineTask('issue-598.review-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review final integration against issue contract',
  labels: ['issue-598', 'review', 'quality-gate'],
  agent: {
    name: 'sdk-platform-integration-reviewer',
    prompt: {
      role: 'senior code reviewer for SDK/platform integrations',
      task: 'Review the implementation against issue #598, the runtime trace, and verification evidence.',
      instructions: [
        'Use a code-review stance. Findings first, ordered by severity, with file/line references.',
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT, TESTS, AND VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify({
          runtimeTrace: args.runtimeTrace,
          contract: args.contract,
          tests: args.tests,
          verification: args.verification,
          attempt: args.attempt,
        }, null, 2),
        '---',
        'Check backward-compatible task serialization/replay, task JSON Schema metadata discovery, tasks-mux routing authority, tool-mux dispatch integration, hooks-mux lifecycle behavior, plugin registry compatibility, and absence of standalone SDK effect executor regressions.',
        'Return JSON: { approved, findings, missingCoverage, residualRisks, changedFiles, summary }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const repairImplementationTask = defineTask('issue-598.repair-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Repair verification or review gaps',
  labels: ['issue-598', 'repair', 'implementation'],
  agent: {
    name: 'sdk-platform-repair-engineer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Repair only the concrete issue #598 gaps found by verification or review.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'GAP CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify({
          runtimeTrace: args.runtimeTrace,
          contract: args.contract,
          tests: args.tests,
          verification: args.verification,
          review: args.review,
          attempt: args.attempt,
        }, null, 2),
        '---',
        'Edit the repository directly. Keep changes narrowly scoped to the reported gaps.',
        'Add or adjust tests first for behavioral gaps. Do not weaken contract tests to match an incomplete implementation.',
        'Return JSON: { changedFiles, fixes, remainingRisks, verificationCommands }.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const finalAcceptanceTask = defineTask('issue-598.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance and delivery summary',
  labels: ['issue-598', 'acceptance', 'delivery'],
  agent: {
    name: 'sdk-platform-final-acceptance',
    prompt: {
      role: 'release integrator',
      task: 'Decide whether issue #598 is complete and prepare delivery notes.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'ARTIFACTS (verbatim JSON):',
        '---',
        JSON.stringify({
          runtimeTrace: args.runtimeTrace,
          contract: args.contract,
          tests: args.tests,
          implementations: args.implementations,
          verification: args.verification,
          review: args.review,
          repairs: args.repairs,
        }, null, 2),
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Pass only if verification passed, review approved, no issue #598 acceptance criterion is missing, backward compatibility risks are documented, and the diff avoids a standalone SDK effect executor.',
        'Return JSON: { passed, summary, completedCriteria, residualRisks, changedFiles, prBodySections, issueComment }.',
      ],
    },
  },
  io: io(taskCtx),
}));

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}
