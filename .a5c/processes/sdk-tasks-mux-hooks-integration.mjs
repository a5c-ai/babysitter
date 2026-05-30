/**
 * @process repo/sdk-tasks-mux-hooks-integration
 * @description Implement issue #598: route SDK effect resolution through tasks-mux and wire SDK/tool hooks through hooks-mux lifecycle events.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, relatedIssues: number[], architectureDocs: string[], targetPackages: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], runtimeCallPaths: string[], changedFiles: string[], verification: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - docs/agent-mux-babysitter-integrations/tasks-mux-routing.md
 * - methodologies/shared/root-cause-diagnosis
 * - methodologies/superpowers/test-driven-development
 * - methodologies/superpowers/verification-before-completion
 * - cradle/feature-implementation-contribute
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Matching existing infrastructure found: SDK task/effect journal and replay runtime, tasks-mux backends/router-adjacent breakpoint surfaces, tool-mux ToolRegistry/ToolDispatcher/ToolHookBridge, hooks-mux programmatic lifecycle engine and SDK interface builders, agent-platform effect resolver, agent-core DeferredToolRegistry, agent-platform McpToolRegistry, SDK plugin registry.
 * - No repo-local .a5c/process-library directory exists; active process library is /home/runner/.a5c/process-library/babysitter-repo/library.
 * - Issue #598 architecture was updated: unified effect execution must route through tasks-mux (#633) instead of adding a standalone SDK executor. tool-mux remains the dispatch/registry/hook boundary for actual tool calls.
 *
 * @process cradle/feature-implementation-contribute
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/sdk-platform-development
 * @process specializations/cli-mcp-development
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent api-design-reviewer specializations/sdk-platform-development/agents/api-design-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent mcp-testing-expert specializations/cli-mcp-development/agents/mcp-testing-expert/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-598.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditAndTraceTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-598.reuse-audit-and-trace',
  });

  const contractPlan = await ctx.task(authorContractTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-598.author-contract-tests',
  });

  const architecturePlan = await ctx.task(designIntegrationContractTask, {
    inputs,
    issueContext,
    reuseAudit,
    contractPlan,
  }, {
    key: 'issue-598.design-integration-contract',
  });

  if (architecturePlan?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #598 Architecture Decision Required',
      question: architecturePlan.question ?? 'The implementation plan found a blocker or scope conflict. Which path should the run take?',
      options: [
        'Proceed with tasks-mux routing design',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['issue-598', 'architecture', 'approval-gate'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        architecturePlan,
      },
    });
  }

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementIntegrationTask, {
      inputs,
      issueContext,
      reuseAudit,
      contractPlan,
      architecturePlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-598.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      reuseAudit,
      contractPlan,
      architecturePlan,
      implementation,
      attempt,
    }, {
      key: `issue-598.verification.${attempt}`,
    });

    review = await ctx.task(reviewIntegrationTask, {
      inputs,
      issueContext,
      reuseAudit,
      contractPlan,
      architecturePlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-598.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueContext,
    reuseAudit,
    contractPlan,
    architecturePlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-598.final-acceptance',
  });

  const delivery = finalGate?.passed === true
    ? await ctx.task(deliverImplementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecturePlan,
      implementation,
      verification,
      review,
      finalGate,
    }, {
      key: 'issue-598.delivery',
    })
    : { delivered: false, reason: 'final acceptance gate did not pass' };

  return {
    success: finalGate?.passed === true && delivery?.delivered !== false,
    phases: [
      'issue-context',
      'reuse-audit-and-runtime-trace',
      'contract-tests-first',
      'integration-contract',
      'implementation-loop',
      'verification-gates',
      'cross-package-review',
      'final-acceptance',
      'delivery',
    ],
    runtimeCallPaths: reuseAudit?.runtimeCallPaths ?? [],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    issueContext,
    reuseAudit,
    contractPlan,
    architecturePlan,
    attempts,
    verification,
    review,
    finalGate,
    delivery,
  };
}

export const readIssueContextTask = defineTask('issue-598.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #598 and related routing context',
  labels: ['issue-598', 'sdk', 'tasks-mux', 'hooks-mux', 'research'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK/platform integration engineer',
      task: 'Read the GitHub issue and produce the authoritative implementation spec for issue #598.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Also read related issues and PRs mentioned by #${args.issueNumber}, at minimum: ${JSON.stringify(args.relatedIssues ?? [])}.`,
        'Read the architecture docs listed in inputs, especially docs/agent-layer-gaps.md and docs/agent-mux-babysitter-integrations/tasks-mux-routing.md.',
        'Treat the issue comment saying effect routing now goes through tasks-mux (#633) as authoritative over the older standalone-executor wording.',
        'Do not edit files in this task.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, relatedIssues, authoritativeScope, acceptanceCriteria, nonGoals, dependencyStatus, risks, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditAndTraceTask = defineTask('issue-598.reuse-audit-and-trace', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run reuse audit and trace live effect/hook paths',
  labels: ['issue-598', 'reuse-audit', 'runtime-trace', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime architect',
      task: 'Audit existing infrastructure before proposing or editing integration code.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from the issue: SDK effects, tasks-mux routing, tool-mux dispatch, hooks-mux lifecycle, task JSON Schema parameters, plugin registry, MCP server registration, DeferredToolRegistry, McpToolRegistry.',
        'Scan for matching migrations, APIs, environment variables, dependencies, exports, and imports. Honor .a5c/reuse-audit.json if present.',
        'Trace runtime call paths from SDK ctx.task()/ctx.breakpoint()/ctx.hook() through journal serialization, run:iterate/task:list/task:post, agent-platform effect resolution, tasks-mux breakpoint/router surfaces, tool-mux dispatch, hooks-mux event processing, and plugin registry discovery.',
        'Inspect at least these likely surfaces from inputs.targetPackages and architecture docs; follow imports/callers as needed.',
        'Do not edit files in this task.',
        'Return JSON: { reuseAuditFindings, runtimeCallPaths, existingInfrastructure, duplicateSurfaces, liveExecutionPathFiles, testFiles, dependencyGaps, recommendedScope, nonGoals }.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractTestsTask = defineTask('issue-598.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests before implementation',
  labels: ['issue-598', 'tdd', 'contracts', 'tests'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript contract-test engineer',
      task: 'Add failing tests that freeze the issue #598 contract before implementation changes.',
      instructions: [
        'You own test files and test fixtures only in this task. Do not modify production implementation files.',
        'Write tests from the issue context and runtime trace, not from a proposed implementation.',
        'Cover additive SDK TaskDef JSON Schema parameter metadata and serialized task backward compatibility with old task records.',
        'Cover SDK effect routing through tasks-mux routing contracts instead of a standalone executor or direct agent-mux bridge.',
        'Cover tool-mux ToolHookBridge backed by hooks-mux PreToolUse/PostToolUse allow, deny, mutation, failure, and audit behavior.',
        'Cover SDK runtime hooks mapping to hooks-mux lifecycle phases for iteration/run/session/tool events without breaking existing SDK shell/plugin hook discovery.',
        'Cover plugin registry reconciliation boundaries: SDK plugin registry must either delegate to the platform/plugin flow or expose a tested compatibility adapter; do not silently maintain conflicting authoritative registries.',
        'Prefer deterministic unit and integration tests that do not require live provider credentials.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, contractMatrix, notes }.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'REUSE AUDIT AND TRACE JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designIntegrationContractTask = defineTask('issue-598.design-integration-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design tasks-mux, tool-mux, and hooks-mux integration contract',
  labels: ['issue-598', 'architecture', 'integration-contract'],
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'senior API and package-boundary reviewer',
      task: 'Define the smallest coherent integration contract for issue #598.',
      instructions: [
        'Do not edit files in this task.',
        'Produce a concrete implementation plan that avoids a standalone SDK effect executor. SDK effect resolution must delegate routing decisions to tasks-mux as described by #633.',
        'Separate responsibilities clearly: tasks-mux chooses responder/routing type; tool-mux resolves and dispatches concrete tools; hooks-mux mediates lifecycle events; SDK preserves deterministic journaling/replay.',
        'Decide how TaskDef exposes first-class JSON Schema parameter metadata while preserving serialized task compatibility.',
        'Decide how SDK MCP server registration reaches the unified tool-mux/MCP path without replacing live MCP lifecycle/executor behavior with a declarative-only bridge.',
        'Decide how to reconcile SDK plugin registry responsibilities with existing platform/plugin package flows, including migration or compatibility tests.',
        'Identify any dependency on related issues (#630, #631, #633) that is not present in the current branch. If the run cannot proceed without a maintainer decision, set needsHumanDecision true and provide a question.',
        'Return JSON: { designSummary, packageBoundaries, runtimeCallPaths, implementationMilestones, compatibilityRules, testRequirements, verificationCommands, needsHumanDecision, question, risks }.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'REUSE AUDIT AND TRACE JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        'CONTRACT TEST PLAN JSON:',
        JSON.stringify(args.contractPlan ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementIntegrationTask = defineTask('issue-598.implement-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement issue #598 integration attempt ${args.attempt}`,
  labels: ['issue-598', 'implementation', 'sdk', 'tasks-mux', 'hooks-mux', 'tool-mux'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript maintainer for the Babysitter runtime stack',
      task: 'Implement the issue #598 integration using the approved contract and failing tests.',
      instructions: [
        'Edit the repository directly. Preserve unrelated worktree changes.',
        'Do not add a standalone SDK effect executor. Route SDK effect resolution through tasks-mux and let tasks-mux choose internal, human, agent, tracker, or auto responders according to the available routing contract.',
        'Wire SDK runtime/tool hooks to hooks-mux lifecycle events. Replace production use of NoopToolHookBridge only where a hooks-mux bridge can be constructed; keep no-op behavior available for tests or explicitly hookless consumers.',
        'Use tool-mux ToolRegistry/ToolDispatcher/McpBridge as the canonical tool boundary where the current live path can do so without losing deferred schema loading, source-qualified identity, MCP lifecycle/execution, or plugin tool semantics.',
        'Add first-class JSON Schema parameter metadata to SDK task definitions and serialization in an additive, replay-compatible way.',
        'Register or adapt the SDK MCP server through the unified tool-mux/MCP path without breaking existing SDK MCP tools.',
        'Reconcile SDK plugin registry ownership with platform/plugin package flows through an explicit adapter, migration path, or documented compatibility boundary with tests.',
        'Keep changes scoped to live runtime paths identified by reuseAudit.runtimeCallPaths and architecturePlan.packageBoundaries.',
        'Do not weaken tests authored in the contract phase to match the implementation.',
        'Return JSON: { changedFiles, summary, runtimeCallPathsChanged, compatibilityNotes, testsUpdated, docsUpdated, risksRemaining }.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'REUSE AUDIT AND TRACE JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        'CONTRACT TEST PLAN JSON:',
        JSON.stringify(args.contractPlan ?? {}, null, 2),
        'ARCHITECTURE PLAN JSON:',
        JSON.stringify(args.architecturePlan ?? {}, null, 2),
        'PREVIOUS VERIFICATION JSON:',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        'PREVIOUS REVIEW JSON:',
        JSON.stringify(args.previousReview ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-598.run-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #598 verification gate attempt ${args.attempt}`,
  labels: ['issue-598', 'verification', 'quality-gate'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior CI and integration verification engineer',
      task: 'Run deterministic verification for the issue #598 integration and summarize exact results.',
      instructions: [
        'Run the verification commands from inputs and architecturePlan. Include exact command, exit status, and the important failure output for every command.',
        'At minimum verify SDK tests/build, tasks-mux tests/typecheck, tool-mux tests/typecheck, hooks-mux tests/build, and focused agent-core/agent-platform/agent-mux tests touched by the change.',
        'Run compatibility checks for old serialized task records, task schema metadata, tasks-mux routing, tool-mux hook allow/deny/audit behavior, hooks-mux lifecycle mapping, SDK MCP registration, and plugin registry compatibility.',
        'Run a source audit proving there is no new production standalone effect executor and no accidental direct agent-mux dispatch bypassing tasks-mux for the #598 path.',
        'If a command cannot run because of environment limitations, record the blocker and the closest targeted substitute; do not mark it passed.',
        'Return JSON: { passed, commands, failedCommands, compatibilityChecks, sourceAudit, residualRisks, recommendedFixes }.',
        '',
        'VERIFICATION COMMANDS:',
        JSON.stringify(args.inputs?.verificationCommands ?? [], null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'ARCHITECTURE PLAN JSON:',
        JSON.stringify(args.architecturePlan ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewIntegrationTask = defineTask('issue-598.review-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #598 integration attempt ${args.attempt}`,
  labels: ['issue-598', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior runtime compatibility reviewer',
      task: 'Review the issue #598 implementation against the issue context, architecture plan, and verification results.',
      instructions: [
        'Review source changes directly. Prioritize behavioral regressions, replay determinism, package dependency cycles, public API compatibility, hook semantics, MCP lifecycle behavior, and plugin migration risk.',
        'Confirm the implementation routes effect resolution through tasks-mux for the relevant SDK/agent-platform path and does not introduce a standalone SDK executor.',
        'Confirm tool-mux hook dispatch is backed by hooks-mux PreToolUse/PostToolUse where production integration expects it.',
        'Confirm SDK runtime hooks map to hooks-mux lifecycle phases while preserving existing shell/plugin hooks or explicitly documenting the migration path.',
        'Confirm JSON Schema task metadata is first-class, discoverable, serialized additively, and compatible with historical run replay.',
        'Return JSON: { approved, issues, blockingIssues, changedFiles, missingTests, compatibilityRisks, summary }.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'REUSE AUDIT AND TRACE JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        'ARCHITECTURE PLAN JSON:',
        JSON.stringify(args.architecturePlan ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-598.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform final issue #598 acceptance gate',
  labels: ['issue-598', 'acceptance', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'release acceptance reviewer',
      task: 'Compare issue #598 requirements to the final artifacts and decide whether the run is ready to deliver.',
      instructions: [
        'Compare the issue context, architecture plan, implementation summary, verification output, and review output directly.',
        'Require all critical gates to pass: tasks-mux routing architecture, hooks-mux lifecycle wiring, task JSON Schema metadata compatibility, tool-mux hook integration, SDK MCP/tool discovery compatibility, plugin registry reconciliation, and cross-package tests/builds.',
        'Reject if verification failed, review has blocking issues, or the implementation silently scoped out an acceptance criterion without maintainer approval.',
        'Return JSON: { passed, changedFiles, acceptanceMatrix, unresolvedRequirements, residualRisks, releaseNotes }.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'ARCHITECTURE PLAN JSON:',
        JSON.stringify(args.architecturePlan ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'REVIEW JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
        'ATTEMPTS JSON:',
        JSON.stringify(args.attempts ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverImplementationTask = defineTask('issue-598.deliver-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, open PR, and update issue #598',
  labels: ['issue-598', 'delivery', 'github'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior maintainer finishing a development branch',
      task: 'Prepare the implementation branch for review and link it back to issue #598.',
      instructions: [
        `Ensure the branch is ${args.inputs?.branchName ?? 'agent/issue-598'} based on ${args.inputs?.baseBranch ?? 'staging'}.`,
        'Stage only files changed for issue #598. Preserve unrelated worktree changes.',
        'Commit with a concise conventional commit message.',
        'Push the branch and create a PR against the base branch with a title that links to issue #598.',
        'The PR body must summarize implementation phases, changed packages, quality gates, verification commands, and residual risks.',
        `Post a comment on issue #${args.inputs?.issueNumber ?? 598} with the implementation summary, verification summary, and PR link.`,
        'Return JSON: { delivered, branchName, commitSha, prUrl, issueCommentUrl, summary }.',
        '',
        'FINAL GATE JSON:',
        JSON.stringify(args.finalGate ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
