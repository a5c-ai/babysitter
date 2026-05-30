/**
 * @process repo/issue-596-tasks-mux-task-management
 * @description Implementation process for issue #596: expand tasks-mux breakpoint routing into task-management primitives.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, relatedIssues: number[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], issueContext: object, reuseAudit: object, architecture: object, tests: object, implementationAttempts: object[], finalGate: object }
 *
 * Authoring context:
 * - Trigger: manual dispatch
 * - Source issue: gh issue view 596 --json title,body,labels,comments
 * - PR check: gh pr view 596 --json files,title,body,comments returned no PR for #596.
 * - Active process-library root: /home/runner/.a5c/process-library/babysitter-repo/library
 * - Repo-specific policy: docs/agent-reference/process-authoring.md
 *
 * Process-library research:
 * - cradle/feature-implementation-contribute.js for PR-oriented feature delivery shape.
 * - methodologies/atdd-tdd/atdd-tdd.js for tests-first outside-in acceptance coverage.
 * - methodologies/bdd-specification-by-example/examples/search-filtering.json for search/filter examples.
 * - methodologies/pilot-shell/README.md for spec, TDD, review, and verification gates.
 * - tdd-quality-convergence.md for iterative quality convergence and scoring.
 *
 * Phase 0 reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No repo-local .a5c/process-library directory exists; use the active process-library root above.
 * - No .a5c/reuse-audit.json exists in this checkout.
 * - packages/tasks-mux/src/types.ts currently has BreakpointStatus values pending/routed/claimed/answered/completed/expired/cancelled and Urgency low/medium/high, but not task priority low/medium/high/critical or assigned/in-progress/blocked/escalated.
 * - packages/tasks-mux/src/backend.ts exposes breakpoint operations only: submit/get/wait/listPending/answer/cancel/listResponders/claim. It has no task search, bulk mutation, dependency, comment, history, metrics, audit, export, notification, escalation, or form contract.
 * - packages/tasks-mux/src/backends/git-native.ts persists .breakpoints JSON and scans files for pending breakpoints. It can be extended, but indexing/search must remain compatible with existing JSON files.
 * - Later tasks-mux work is present on staging: responder types, external-tracker backend, and agent-mux backend now exist. Reuse those seams; do not recreate tracker or agent routing infrastructure.
 * - docs/agent-layer-gaps.md still lists issue #596 capabilities as open platform gaps.
 *
 * @process methodologies/atdd-tdd
 * @process methodologies/pilot-shell/pilot-shell-feature
 * @process processes/shared/completeness-gate
 * @process specializations/collaboration/github/pr-policies
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_ATTEMPTS = 3;

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 596;

  const issueContext = await ctx.task(readIssueContextTask, {
    ...inputs,
    issueNumber,
  }, {
    key: 'issue-596.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-596.reuse-audit',
  });

  if (reuseAudit?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #596 Scope Decision',
      question: reuseAudit.question ?? 'The reuse audit found a dependency or staging decision that should be resolved before implementation.',
      options: [
        'Proceed with additive core task-management primitives',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-596', 'tasks-mux', 'reuse-audit'],
      context: {
        runId: ctx.runId,
        summary: reuseAudit.summary,
        blockers: reuseAudit.blockers ?? [],
      },
    });
  }

  const architecture = await ctx.task(designArchitectureTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-596.design-architecture',
  });

  const tests = await ctx.task(authorTestsFirstPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
  }, {
    key: 'issue-596.tests-first-plan',
  });

  let verification = null;
  let review = null;
  const implementationAttempts = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const coreContract = await ctx.task(implementCoreContractTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      tests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-596.implementation.${attempt}.core-contract`,
    });

    const backendParity = await ctx.task(implementBackendParityTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      tests,
      coreContract,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-596.implementation.${attempt}.backend-parity`,
    });

    const cliMcpDocs = await ctx.task(implementCliMcpDocsTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      tests,
      coreContract,
      backendParity,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-596.implementation.${attempt}.cli-mcp-docs`,
    });

    const providersAndGovernance = await ctx.task(implementProvidersAndGovernanceTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      tests,
      coreContract,
      backendParity,
      cliMcpDocs,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-596.implementation.${attempt}.providers-governance`,
    });

    const implementation = {
      attempt,
      coreContract,
      backendParity,
      cliMcpDocs,
      providersAndGovernance,
    };
    implementationAttempts.push(implementation);

    verification = await ctx.task(runQualityGatesTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      tests,
      implementation,
      attempt,
    }, {
      key: `issue-596.verification.${attempt}`,
    });

    review = await ctx.task(reviewCompatibilityTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecture,
      tests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-596.review.${attempt}`,
    });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
    tests,
    implementationAttempts,
    verification,
    review,
  }, {
    key: 'issue-596.final-acceptance',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #596 Final Product/API Decision',
      question: finalGate.question ?? 'Final acceptance found a product or API decision that should not be guessed.',
      options: [
        'Accept the staged implementation and open follow-up issues',
        'Continue implementation in this issue',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-596', 'final-acceptance'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: implementationAttempts.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'architecture',
      'tests-first',
      'core-contract',
      'backend-parity',
      'cli-mcp-docs',
      'providers-governance',
      'quality-gates',
      'compatibility-review',
      'final-acceptance',
    ],
    issueContext,
    reuseAudit,
    architecture,
    tests,
    implementationAttempts,
    verification,
    review,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-596.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #596 and related task-management context',
  labels: ['issue-596', 'tasks-mux', 'issue-context'],
  agent: {
    name: 'tasks-mux-context-researcher',
    prompt: {
      role: 'senior TypeScript monorepo engineer',
      task: 'Read the authoritative GitHub issue context before implementation.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Also run: gh pr view ${args.issueNumber} --json files,title,body,comments. If it is not a PR, record that result.`,
        'Read every comment and label. Pay special attention to blockers/related issues #577, #597, #634, and #630.',
        'Read docs/agent-layer-gaps.md and extract only the tasks-mux task-management gaps relevant to this issue.',
        'Return JSON with title, labels, commentsSummary, relatedIssues, acceptanceCapabilities, nonGoals, riskLevel, and sourceEvidence.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const reuseAuditTask = defineTask('issue-596.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse audit before design',
  labels: ['issue-596', 'tasks-mux', 'reuse-audit'],
  agent: {
    name: 'tasks-mux-reuse-auditor',
    prompt: {
      role: 'senior SDK architect',
      task: 'Run the required reuse audit before proposing new infrastructure for issue #596.',
      context: args,
      instructions: [
        'Start the report with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract nouns and verbs from the issue: priority, dependsOn, search, filter, bulk approve, bulk close, reassign, assigned, in-progress, blocked, escalated, status history, timeline, comments, metrics, SLA, notification, Slack, Discord, webhook, escalation chains, forms, state machine, audit log, export, backup.',
        'Check whether .a5c/reuse-audit.json exists. If absent, state that explicitly.',
        'Search current package surfaces: packages/tasks-mux/src/types.ts, backend.ts, backends/*.ts, cli/commands/*.ts, mcp/**/*.ts, router/client/server surfaces, README, docs, and tests.',
        'Search for matching migrations, API routes, environment variables, SDK dependencies, package dependencies, exports, imports, and existing tests.',
        'Use the active process-library root /home/runner/.a5c/process-library/babysitter-repo/library and record matching methodologies or specializations that should guide implementation.',
        'Identify landed related infrastructure such as ResponderType, ExternalTrackerBackend, AgentMuxBackend, server backend, GitHub Issues backend, and MCP tools.',
        'Return JSON with summary, findings, reusableSeams, missingSeams, incompatibleAssumptions, blockers, needsMaintainerDecision, question, and recommendedFirstSlice.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const designArchitectureTask = defineTask('issue-596.design-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design additive task-management architecture',
  labels: ['issue-596', 'architecture', 'tasks-mux'],
  agent: {
    name: 'tasks-mux-architect',
    prompt: {
      role: 'domain-driven TypeScript API architect',
      task: 'Design a backward-compatible task-management architecture for tasks-mux.',
      context: args,
      instructions: [
        'Do not edit implementation files in this phase.',
        'Design around additive schema evolution so existing Breakpoint JSON, proven answers, CLI commands, MCP tools, and backend consumers keep working.',
        'Decide canonical naming for task priority, dependency, lifecycle status, assignment, comments, history, metrics, audit, export, forms, notifications, and escalation.',
        'Separate required core primitives from optional provider integrations. Notification and escalation providers must be disabled by default and credential-safe.',
        'Define state-transition validation rules including terminal statuses and allowed transitions for pending/routed/claimed/answered/completed/expired/cancelled plus assigned/in-progress/blocked/escalated.',
        'Define backend capability behavior for git-native, server, GitHub Issues, external-tracker, and agent-mux. Unsupported capabilities must return explicit typed errors rather than silent no-ops.',
        'Define search/filter semantics, pagination/sorting defaults, and bulk operation result shape with per-item success/error details.',
        'Return JSON with architectureSummary, newTypes, backendInterfaceExtensions, compatibilityPlan, migrationPlan, providerPlan, openDecisions, and implementationSlices.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const authorTestsFirstPlanTask = defineTask('issue-596.tests-first-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author acceptance and compatibility tests first',
  labels: ['issue-596', 'tests-first', 'atdd', 'tdd'],
  agent: {
    name: 'tasks-mux-test-architect',
    prompt: {
      role: 'ATDD/TDD test architect',
      task: 'Create failing acceptance and compatibility tests before implementation.',
      context: args,
      instructions: [
        'Author tests before production code changes.',
        'Cover schema parsing/defaulting for priorities, dependencies, statuses, assignments, history, comments, forms, metrics, audit, export metadata, notifications, and escalation config.',
        'Cover backward compatibility fixtures for existing breakpoint JSON without new fields.',
        'Cover backend contract tests using a shared capability suite for git-native, server, GitHub Issues, external-tracker, and agent-mux where applicable.',
        'Cover search/filter combinations including status, priority, assignee/responder, tags/domains, text query, dependency state, created/updated ranges, sorting, and pagination.',
        'Cover bulk approve/close/reassign partial failure behavior and idempotency.',
        'Cover invalid state transitions, dependency blocking, history/audit append behavior, comments, SLA metrics, export/backup redaction, and provider disabled-by-default behavior.',
        'Cover CLI and MCP parity for every public operation added.',
        'Run focused tests and confirm they fail for missing capability rather than setup errors.',
        'Return JSON with testFiles, acceptanceMatrix, redCommands, redResultSummary, fixtures, and knownDeferredCases.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementCoreContractTask = defineTask('issue-596.implement-core-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement core schema and backend contract',
  labels: ['issue-596', 'implementation', 'core-contract'],
  agent: {
    name: 'tasks-mux-core-implementer',
    prompt: {
      role: 'senior TypeScript SDK engineer',
      task: 'Implement the additive core schema, validation, and backend contract for issue #596.',
      context: args,
      instructions: [
        'Keep changes scoped to tasks-mux and directly necessary docs/tests.',
        'Extend types and schemas additively. Do not rename or remove existing Breakpoint fields without migration compatibility.',
        'Add priority, dependencies, assignment, richer statuses, comments, history/timeline, metrics/SLA metadata, form definitions/submissions, audit entries, export metadata, notification config, and escalation chain types as designed.',
        'Extend the backend interface with search/filter, bulk operations, assignment/reassignment, comments, transitions, metrics, export/backup, and capability discovery.',
        'Add state-transition validation helpers and typed unsupported-feature errors.',
        'Preserve proven-answer and existing selectBreakpointAnswer behavior.',
        'Run the focused type/schema tests and report results.',
        'Return JSON with changedFiles, contractSummary, compatibilityNotes, commandsRun, and unresolvedRisks.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementBackendParityTask = defineTask('issue-596.implement-backend-parity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement backend parity and compatibility',
  labels: ['issue-596', 'implementation', 'backend-parity'],
  agent: {
    name: 'tasks-mux-backend-implementer',
    prompt: {
      role: 'backend parity engineer',
      task: 'Implement task-management capabilities across tasks-mux backends with explicit capability reporting.',
      context: args,
      instructions: [
        'Start with git-native as the canonical durable implementation, preserving existing .breakpoints JSON compatibility.',
        'Use structured JSON parsing and typed helpers, not ad hoc string parsing.',
        'Implement search/filter and bulk operations efficiently enough for git-native, while preserving deterministic output and malformed-file tolerance.',
        'Map server and GitHub Issues backends to the new contract where possible; for unsupported operations, expose explicit unsupported capability errors and tests.',
        'Integrate with external-tracker and agent-mux only through their current public seams. Do not duplicate tracker or agent routing code.',
        'Ensure dependency blocking and escalation timeout behavior are deterministic and testable without real credentials or external network calls.',
        'Return JSON with changedFiles, backendCapabilityMatrix, compatibilityFixtures, commandsRun, and unsupportedCapabilities.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementCliMcpDocsTask = defineTask('issue-596.implement-cli-mcp-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Expose CLI, MCP, and documentation surfaces',
  labels: ['issue-596', 'implementation', 'cli', 'mcp', 'docs'],
  agent: {
    name: 'tasks-mux-surface-implementer',
    prompt: {
      role: 'CLI and MCP API engineer',
      task: 'Expose task-management operations consistently through tasks-mux CLI, MCP, README, and docs.',
      context: args,
      instructions: [
        'Add backend-agnostic CLI commands for search, assign/reassign, close/cancel, approve/answer, bulk approve/close/reassign, comments, escalation, stats, templates/forms, rules, export, and backup as applicable to the architecture.',
        'Add MCP tools for the same backend-agnostic operations and keep parameter schemas explicit.',
        'Keep existing ask/breakpoints/responders/server/auth commands compatible.',
        'Add CLI/MCP parity tests and JSON/text output tests.',
        'Update packages/tasks-mux/README.md, docs, and package architecture specs to document capabilities, unsupported behavior, provider defaults, and migration compatibility.',
        'Return JSON with changedFiles, cliCommands, mcpTools, docsUpdated, parityTests, and commandsRun.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const implementProvidersAndGovernanceTask = defineTask('issue-596.implement-providers-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement provider guardrails, audit, export, and metrics',
  labels: ['issue-596', 'implementation', 'providers', 'governance'],
  agent: {
    name: 'tasks-mux-governance-implementer',
    prompt: {
      role: 'integration safety engineer',
      task: 'Implement optional provider guardrails and governance features without creating noisy external side effects.',
      context: args,
      instructions: [
        'Notification and escalation providers must be disabled by default and require explicit configuration.',
        'Add provider interfaces for email, Slack, Discord, and webhook without requiring credentials in the default test suite.',
        'Use mocked integration tests for provider dispatch, timeout escalation, credential redaction, retries, and failure handling.',
        'Implement audit log, deterministic export/backup output, metrics/SLA calculations, and redaction rules.',
        'Ensure provider failures do not corrupt task state and are recorded in history/audit where appropriate.',
        'Return JSON with changedFiles, providerInterfaces, auditExportSummary, metricsSummary, commandsRun, and residualRisks.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const runQualityGatesTask = defineTask('issue-596.run-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run quality gates and repair scoped failures',
  labels: ['issue-596', 'quality-gate', 'verification'],
  agent: {
    name: 'tasks-mux-quality-engineer',
    prompt: {
      role: 'senior TypeScript QA engineer',
      task: 'Run focused and broad verification for issue #596 and fix scoped failures.',
      context: args,
      instructions: [
        'Run the verificationCommands from inputs plus any focused red/green commands identified by the tests-first phase.',
        'At minimum run git diff --check, tasks-mux tests, tasks-mux typecheck/build, root metadata verification, and any affected SDK compatibility tests.',
        'Read full failures before editing. Fix only failures attributable to issue #596.',
        'Verify existing breakpoint fixture compatibility, CLI/MCP parity, backend capability matrix, provider disabled-by-default behavior, state validation, audit/history, export/backup redaction, and docs accuracy.',
        'Return JSON with passed, commandsRun, failures, fixesApplied, changedFiles, evidence, and unresolvedFailures.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const reviewCompatibilityTask = defineTask('issue-596.review-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review compatibility, completeness, and scope',
  labels: ['issue-596', 'review', 'compatibility'],
  agent: {
    name: 'tasks-mux-adversarial-reviewer',
    prompt: {
      role: 'adversarial reviewer for TypeScript SDK and task-routing systems',
      task: 'Review the issue #596 implementation for compatibility regressions and missing requested capabilities.',
      context: args,
      instructions: [
        'Do not broaden the implementation beyond issue #596.',
        'Review for schema/API breakage, invalid migration assumptions, backend divergence, partial bulk-operation behavior, unsafe provider side effects, missing credential redaction, invalid state transitions, and CLI/MCP docs drift.',
        'Check every requested capability from the issue body and comments. Mark each implemented, explicitly unsupported, or deferred with a linked rationale.',
        'If defects are found, fix narrowly and rerun affected tests.',
        'Return JSON with approved, score, findings, capabilityChecklist, fixesApplied, commandsRun, and residualRisks.',
      ],
    },
  },
  io: io(taskCtx),
}));

export const finalAcceptanceGateTask = defineTask('issue-596.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance and delivery readiness',
  labels: ['issue-596', 'final-gate', 'delivery'],
  agent: {
    name: 'tasks-mux-release-reviewer',
    prompt: {
      role: 'release-minded maintainer',
      task: 'Decide whether the issue #596 implementation is ready for PR delivery.',
      context: args,
      instructions: [
        'Confirm the issue source, comments, labels, and docs/agent-layer-gaps.md are satisfied or explicitly scoped.',
        'Confirm no implementation code outside the intended tasks-mux surfaces changed without documented reason.',
        'Confirm verificationCommands passed or environment-only failures are recorded with exact command output and rationale.',
        'Confirm the PR body can link #596 and summarize implemented capabilities, unsupported/deferred work, tests, and risk.',
        'Return JSON with passed, needsMaintainerDecision, question, changedFiles, verificationSummary, capabilitySummary, prSummary, and followUps.',
      ],
    },
  },
  io: io(taskCtx),
}));
