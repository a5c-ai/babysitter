/**
 * @process repo/issue-599-transport-mux-integration-plan
 * @description Plan and execute issue #599: validate and finish transport-mux cost feedback, session-aware proxy context, codec plugin discovery, and shared tool schema normalization.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxAttempts?: number, targetFiles: string[], relatedIssues: number[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], reuseAudit: object, runtimeTrace: object, contractDesign: object, regressionPlan: object, implementation: object, verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-reference/command-surfaces.md
 * - docs/agent-reference/repo-map.md
 * - docs/agent-layer-gaps.md
 * - docs/plugins.md
 * - packages/transport-mux/architecture.md
 * - packages/transport-mux/migration.md
 * - .a5c/processes/issue-578-end-to-end-token-cost-tracking.mjs
 * - .a5c/processes/issue-591-agent-runtime-observability.mjs
 * - .a5c/processes/issue-588-agent-core-tool-system-gaps.mjs
 * - library/cradle/feature-implementation-contribute.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/deterministic-quality-gate.js
 * - library/specializations/sdk-platform-development/*
 * - library/specializations/qa-testing-automation/*
 *
 * Note: .a5c/process-library/ was not present in this checkout. Matching
 * methodologies and specializations were researched under the repository
 * library/ root and nearby .a5c/processes process files.
 *
 * Planning refresh note: current staging may already include partial or complete
 * work for cost feedback and session metadata. Every implementation slice must
 * first classify the slice as complete, partial, or missing and preserve working
 * code instead of rewriting it.
 *
 * This process intentionally uses agent tasks rather than shell tasks to
 * respect the repository override for direct Babysitter workflows.
 *
 * @process cradle/feature-implementation-contribute
 * @process methodologies/superpowers/test-driven-development
 * @process processes/shared/tdd-triplet
 * @process processes/shared/deterministic-quality-gate
 * @process specializations/sdk-platform-development
 * @process specializations/qa-testing-automation
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent api-design-reviewer specializations/sdk-platform-development/agents/api-design-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent telemetry-privacy-auditor specializations/sdk-platform-development/agents/telemetry-privacy-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_ATTEMPTS = 3;

function compactResult(result) {
  return result?.value ?? result ?? null;
}

export async function process(inputs, ctx) {
  const maxAttempts = inputs?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-599.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext: compactResult(issueContext),
  }, {
    key: 'issue-599.reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceRuntimePathsTask, {
    inputs,
    issueContext: compactResult(issueContext),
    reuseAudit: compactResult(reuseAudit),
  }, {
    key: 'issue-599.runtime-trace',
  });

  const contractDesign = await ctx.task(designIntegrationContractsTask, {
    inputs,
    issueContext: compactResult(issueContext),
    reuseAudit: compactResult(reuseAudit),
    runtimeTrace: compactResult(runtimeTrace),
  }, {
    key: 'issue-599.contract-design',
  });

  if (compactResult(contractDesign)?.needsMaintainerDecision === true) {
    const decision = await ctx.breakpoint({
      breakpointId: 'issue-599.contract-decision',
      title: 'Issue #599 Transport Integration Contract Decision',
      question: compactResult(contractDesign)?.question ?? 'Review the proposed cost/session/codec contract before implementation continues.',
      options: [
        'Proceed with recommended contract',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-599', 'transport-mux', 'approval-gate'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs?.issueNumber ?? 599,
        contractDesign: compactResult(contractDesign),
        runtimeTrace: compactResult(runtimeTrace),
      },
    });

    if (decision?.approved === false) {
      return {
        success: false,
        blocked: true,
        stoppedAt: 'contract-decision',
        feedback: decision.feedback ?? decision.response,
        phases: ['issue-context', 'reuse-audit', 'runtime-trace', 'contract-design'],
        issueContext: compactResult(issueContext),
        reuseAudit: compactResult(reuseAudit),
        runtimeTrace: compactResult(runtimeTrace),
        contractDesign: compactResult(contractDesign),
      };
    }
  }

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext: compactResult(issueContext),
    reuseAudit: compactResult(reuseAudit),
    runtimeTrace: compactResult(runtimeTrace),
    contractDesign: compactResult(contractDesign),
  }, {
    key: 'issue-599.regression-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const costFeedback = await ctx.task(implementCostFeedbackTask, {
      inputs,
      issueContext: compactResult(issueContext),
      reuseAudit: compactResult(reuseAudit),
      runtimeTrace: compactResult(runtimeTrace),
      contractDesign: compactResult(contractDesign),
      regressionPlan: compactResult(regressionPlan),
      previousVerification: compactResult(verification),
      previousReview: compactResult(review),
      attempt,
    }, {
      key: `issue-599.implementation.cost-feedback.${attempt}`,
    });

    const sessionContext = await ctx.task(implementSessionContextTask, {
      inputs,
      issueContext: compactResult(issueContext),
      reuseAudit: compactResult(reuseAudit),
      runtimeTrace: compactResult(runtimeTrace),
      contractDesign: compactResult(contractDesign),
      regressionPlan: compactResult(regressionPlan),
      priorSlice: compactResult(costFeedback),
      previousVerification: compactResult(verification),
      previousReview: compactResult(review),
      attempt,
    }, {
      key: `issue-599.implementation.session-context.${attempt}`,
    });

    const codecDiscovery = await ctx.task(implementCodecDiscoveryTask, {
      inputs,
      issueContext: compactResult(issueContext),
      reuseAudit: compactResult(reuseAudit),
      runtimeTrace: compactResult(runtimeTrace),
      contractDesign: compactResult(contractDesign),
      regressionPlan: compactResult(regressionPlan),
      priorSlices: [compactResult(costFeedback), compactResult(sessionContext)],
      previousVerification: compactResult(verification),
      previousReview: compactResult(review),
      attempt,
    }, {
      key: `issue-599.implementation.codec-discovery.${attempt}`,
    });

    const schemaSharing = await ctx.task(implementSchemaSharingTask, {
      inputs,
      issueContext: compactResult(issueContext),
      reuseAudit: compactResult(reuseAudit),
      runtimeTrace: compactResult(runtimeTrace),
      contractDesign: compactResult(contractDesign),
      regressionPlan: compactResult(regressionPlan),
      priorSlices: [
        compactResult(costFeedback),
        compactResult(sessionContext),
        compactResult(codecDiscovery),
      ],
      previousVerification: compactResult(verification),
      previousReview: compactResult(review),
      attempt,
    }, {
      key: `issue-599.implementation.schema-sharing.${attempt}`,
    });

    implementation = {
      attempt,
      costFeedback: compactResult(costFeedback),
      sessionContext: compactResult(sessionContext),
      codecDiscovery: compactResult(codecDiscovery),
      schemaSharing: compactResult(schemaSharing),
      changedFiles: [
        ...(compactResult(costFeedback)?.changedFiles ?? []),
        ...(compactResult(sessionContext)?.changedFiles ?? []),
        ...(compactResult(codecDiscovery)?.changedFiles ?? []),
        ...(compactResult(schemaSharing)?.changedFiles ?? []),
      ],
    };

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext: compactResult(issueContext),
      reuseAudit: compactResult(reuseAudit),
      runtimeTrace: compactResult(runtimeTrace),
      contractDesign: compactResult(contractDesign),
      regressionPlan: compactResult(regressionPlan),
      implementation,
      attempt,
    }, {
      key: `issue-599.verification.${attempt}`,
    });

    review = await ctx.task(reviewIntegrationTask, {
      inputs,
      issueContext: compactResult(issueContext),
      reuseAudit: compactResult(reuseAudit),
      runtimeTrace: compactResult(runtimeTrace),
      contractDesign: compactResult(contractDesign),
      regressionPlan: compactResult(regressionPlan),
      implementation,
      verification: compactResult(verification),
      attempt,
    }, {
      key: `issue-599.review.${attempt}`,
    });

    attempts.push({
      attempt,
      implementation,
      verification: compactResult(verification),
      review: compactResult(review),
    });

    if (compactResult(verification)?.passed === true && compactResult(review)?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext: compactResult(issueContext),
    reuseAudit: compactResult(reuseAudit),
    runtimeTrace: compactResult(runtimeTrace),
    contractDesign: compactResult(contractDesign),
    regressionPlan: compactResult(regressionPlan),
    implementation,
    verification: compactResult(verification),
    review: compactResult(review),
    attempts,
  }, {
    key: 'issue-599.final-acceptance',
  });

  if (compactResult(finalGate)?.needsHumanDecision === true) {
    await ctx.breakpoint({
      breakpointId: 'issue-599.final-decision',
      title: 'Issue #599 Final Acceptance Decision',
      question: compactResult(finalGate)?.question ?? 'Review remaining transport-mux integration risks before delivery.',
      options: [
        'Accept current implementation',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-599', 'transport-mux', 'final-gate'],
      context: {
        runId: ctx.runId,
        finalGate: compactResult(finalGate),
        attempts,
      },
    });
  }

  return {
    success: compactResult(finalGate)?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'runtime-path-trace',
      'contract-design',
      'regression-plan',
      'implementation-loop',
      'verification-gate',
      'architecture-privacy-review',
      'final-acceptance',
    ],
    changedFiles: compactResult(finalGate)?.changedFiles ?? implementation?.changedFiles ?? [],
    issueContext: compactResult(issueContext),
    reuseAudit: compactResult(reuseAudit),
    runtimeTrace: compactResult(runtimeTrace),
    contractDesign: compactResult(contractDesign),
    regressionPlan: compactResult(regressionPlan),
    implementation,
    verification: compactResult(verification),
    review: compactResult(review),
    attempts,
    finalGate: compactResult(finalGate),
  };
}

export const readIssueContextTask = defineTask('issue-599.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #599 and related transport integration context',
  labels: ['issue-599', 'transport-mux', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter platform maintainer',
      task: 'Read GitHub issue #599 and produce the authoritative implementation scope.',
      instructions: [
        `Run: gh issue view ${args.issueNumber ?? 599} --json title,body,labels,comments`,
        `If #${args.issueNumber ?? 599} resolves as a PR instead, also run: gh pr view ${args.issueNumber ?? 599} --json files,title,body,comments`,
        'Use the issue body, every comment, and labels as the source of truth.',
        'Inspect related issues #578 and #591 only enough to identify ownership boundaries for cost tracking and observability.',
        'Notice whether prior plan PRs or implementation comments exist, but do not assume they completed the current staging branch.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, relatedIssues, acceptanceCriteria, nonGoals, existingPlanOrPrReferences, riskLevel, targetFilesFromIssue, openQuestions }.',
      ],
      context: {
        seedIssue: args.issueSeed ?? null,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-599.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse audit for transport-mux integration',
  labels: ['issue-599', 'transport-mux', 'reuse-audit', 'phase:0'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior monorepo architecture analyst',
      task: 'Perform the repo-required Phase 0 reuse audit before proposing or editing implementation code.',
      instructions: [
        'Do not edit files in this phase.',
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from issue #599: transport-mux, cost feedback, NormalizedCostRecord, extractCostRecord, SDK journal, COST_TRACKED, L6 cost tracking, runId, sessionId, traceparent, correlation ID, codec discovery, plugin descriptor, marketplace, tool schema normalization, tool-mux.',
        'Scan for matching migrations, API routes, environment variables, SDK dependencies, package exports, imports, plugin registry surfaces, route tests, transport codecs, and scorecard gates. Honor .a5c/reuse-audit.json if present.',
        'Inspect packages/transport-mux first, then follow imports and consumers through packages/sdk cost/session code, agent-mux launcher/adapter surfaces, docs/plugins.md, docs/agent-layer-gaps.md, and related issue process plans.',
        'Call out existing staging implementation that may already cover part of the issue, especially costFeedbackSink, CostFeedbackMetadata, x-babysitter headers, appendCostEventOnce, session budget tests, normalizeUsage, convertTools, and codec descriptor lookup.',
        'For each issue slice, classify current state as complete, partial, or missing and list evidence files and tests. Treat complete slices as preserve-and-verify work, not implementation work.',
        'Return JSON: { renderedFindings, keywords, existingInfrastructure, sliceState: { costFeedback, sessionContext, codecDiscovery, schemaSharing }, partialImplementationAlreadyPresent, reusableModules, dependencyFindings, envVars, routeAndApiFindings, pluginFindings, gapsStillOpen, noMatchNotes, risksForNewInfrastructure }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRuntimePathsTask = defineTask('issue-599.trace-runtime-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1 - Trace transport runtime paths and package boundaries',
  labels: ['issue-599', 'runtime-trace', 'transport-mux', 'phase:1'],
  agent: {
    name: 'transport-runtime-tracer',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Trace the live request, cost, session, codec, and schema call paths before design or implementation.',
      instructions: [
        'Do not edit files in this phase.',
        'Start with the target files from inputs, then follow imports and tests only as needed.',
        'Trace buffered completion flow through createTransportMuxApp, route handlers, buildCompletionRequest, completionEngine.complete, response encoding, metrics, and cost feedback.',
        'Trace streaming flow for OpenAI Chat, OpenAI Responses SSE/WebSocket, Anthropic, Google/Vertex, Bedrock, and passthrough. Identify where done usage exists and where it does not.',
        'Trace how request context headers are accepted, redacted, forwarded, or leaked. Include auth and passthrough forwarding behavior.',
        'Trace SDK journal cost helpers, run cost stats, effect index cost fields, and session budget enforcement enough to design a narrow sink boundary.',
        'Trace codec registry and descriptor lookup, including hardcoded built-ins, aliases, normalizeUsage, convertTools, and public exports.',
        'Trace tool schema normalization consumers in tool-mux or adjacent packages and identify a non-circular sharing strategy.',
        'For already-implemented-looking paths, trace both production code and assertions so later phases can distinguish true completion from superficial test fixtures.',
        'Return JSON: { currentState, sliceState, runtimeCallPaths, publicContracts, liveVsAdjacentFiles, testFiles, missingSurfaces, compatibilityRisks, securityRisks, proposedImplementationSlices, outOfScope }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designIntegrationContractsTask = defineTask('issue-599.design-integration-contracts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2 - Design cost, session, codec, and schema contracts',
  labels: ['issue-599', 'architecture', 'contract', 'phase:2'],
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'senior SDK API designer',
      task: 'Design the narrow contracts for issue #599 before tests and implementation.',
      instructions: [
        'Base the design on the issue context, reuse audit, and runtime trace.',
        'For cost feedback, prefer an injected event sink and SDK adapter helper over importing private journal internals directly into transport-mux. Define exact-once/idempotency semantics.',
        'For session-aware proxying, define an internal request context contract that carries runId, sessionId, effectId, taskId, taskKind, traceparent, tracestate, and correlation/request IDs without leaking internal headers upstream by default.',
        'For passthrough routes, define metrics-only behavior unless upstream usage parsing is explicitly implemented and tested.',
        'For codec discovery, define explicit registration/discovery APIs, deterministic descriptor/plugin loading, duplicate behavior, alias behavior, unknown codec behavior, and package exports.',
        'For schema sharing, define where NormalizedToolDefinition, normalizeTools, denormalizeTools, convertTools, and any tool-mux adapter should live without circular dependencies.',
        'Define migration notes for staging branches that already have partial or complete cost/session plumbing so the implementation agent validates before rewriting.',
        'For any slice classified complete by the reuse audit and runtime trace, define preserve-and-verify acceptance criteria instead of new implementation tasks.',
        'Return JSON: { apiSurface, costFeedbackContract, requestContextContract, traceContract, codecDiscoveryContract, schemaSharingContract, migrationPlan, acceptanceCriteria, needsMaintainerDecision, question, risks }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        runtimeTrace: args.runtimeTrace,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-599.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3 - Author failing regression and contract tests',
  labels: ['issue-599', 'tdd', 'tests-first', 'phase:3'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior TypeScript test engineer practicing strict TDD',
      task: 'Author the regression plan and, during execution, failing tests before production changes.',
      instructions: [
        'Follow tests-first execution. Do not implement production code before tests demonstrate the missing behavior.',
        'Target package-local tests near the live surfaces identified by the runtime trace.',
        'Cover buffered cost feedback for OpenAI Chat, OpenAI Responses, Anthropic, Google/Vertex, Bedrock, and Azure/Foundry where routes normalize usage.',
        'Cover streaming final done usage exactly once for SSE and WebSocket paths that expose done usage.',
        'Cover passthrough routes as metrics-only and prove internal x-babysitter-* and trace metadata are redacted from upstream fetches unless explicitly configured.',
        'Cover SDK journal adapter behavior with appendCostEventOnce, duplicate idempotency keys, effect index cost fields, and session budget enforcement where this issue owns the integration point.',
        'Cover request context extraction from headers and configured defaults, including traceparent/correlation IDs and malformed or missing metadata.',
        'Cover codec registration/discovery: built-ins, aliases, descriptor lookup, plugin/manifest descriptor loading, duplicate registration, unknown codec, and deterministic ordering.',
        'Cover shared tool schema normalization so tool-mux and transport-mux do not diverge on OpenAI/Anthropic/Google shapes.',
        'Run narrow tests after writing them and record that failures match issue #599 rather than setup drift. If a slice is already green on staging, record that as current-state validation and require only missing regression coverage.',
        'Return JSON: { testFiles, testNames, redPhaseCommands, expectedFailures, routeCoverage, sdkCoverage, codecCoverage, schemaCoverage, redVerified, risks }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        runtimeTrace: args.runtimeTrace,
        contractDesign: args.contractDesign,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementCostFeedbackTask = defineTask('issue-599.implement-cost-feedback', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4a - Implement cost feedback loop',
  labels: ['issue-599', 'transport-mux', 'sdk', 'cost-feedback', 'implementation'],
  agent: {
    name: 'transport-mux-implementer',
    prompt: {
      role: 'senior TypeScript platform engineer',
      task: 'Implement or complete the cost feedback slice for issue #599.',
      instructions: [
        'Edit the repository directly, but keep changes scoped to issue #599.',
        'First validate whether staging already has a costFeedbackSink or equivalent. Preserve working partial or complete implementation instead of rewriting it.',
        'If the slice is complete, do not edit production code for this slice; add only missing focused tests or docs required by contractDesign.',
        'Wire normalized usage-bearing completion results and streaming done events into the approved cost/event sink.',
        'Use codec extractCostRecord or normalized usage consistently; do not double-count.',
        'Bridge to SDK journal through a narrow adapter/helper using appendCostEventOnce semantics when the run directory is available.',
        'Keep passthrough metrics-only unless contractDesign explicitly authorizes usage parsing and tests cover it.',
        'Run the focused red/green tests for this slice and report exact commands and outcomes.',
        'Return JSON: { changedFiles, summary, testsRun, costEmissionRules, idempotencyHandling, remainingRisks }.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSessionContextTask = defineTask('issue-599.implement-session-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4b - Implement session-aware proxy context',
  labels: ['issue-599', 'transport-mux', 'observability', 'session-context', 'implementation'],
  agent: {
    name: 'transport-mux-implementer',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement or complete session-aware request context for issue #599.',
      instructions: [
        'Edit the repository directly, but keep changes scoped to issue #599.',
        'First validate whether staging already extracts x-babysitter-* metadata. Preserve compatible existing behavior.',
        'If the slice is complete, do not edit production code for this slice; add only missing focused tests or docs required by contractDesign.',
        'Add or complete a typed request context contract for runId, sessionId, effectId, taskId, taskKind, traceparent, tracestate, request/correlation IDs, and source metadata.',
        'Propagate context only to internal metrics/cost/tracing sinks by default.',
        'Redact internal x-babysitter-* headers from upstream passthrough and provider requests unless the contract allows explicit forwarding.',
        'Use existing agent-mux/session surfaces where available rather than inventing unrelated session stores.',
        'Run focused tests and report exact commands and outcomes.',
        'Return JSON: { changedFiles, summary, testsRun, contextFields, redactionRules, compatibilityNotes, remainingRisks }.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementCodecDiscoveryTask = defineTask('issue-599.implement-codec-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4c - Implement codec registration and plugin discovery',
  labels: ['issue-599', 'transport-mux', 'plugins', 'codec-discovery', 'implementation'],
  agent: {
    name: 'codec-plugin-implementer',
    prompt: {
      role: 'senior TypeScript package engineer',
      task: 'Implement or complete deterministic codec registration and plugin-backed discovery for issue #599.',
      instructions: [
        'Edit the repository directly, but keep changes scoped to issue #599.',
        'First validate existing descriptor lookup, normalizeUsage, convertTools, built-in aliases, and public exports. Preserve any complete current behavior.',
        'Preserve built-in codecs and existing aliases.',
        'If the slice is complete, do not edit production code for this slice; add only missing focused tests or docs required by contractDesign.',
        'Expose supported registration/discovery APIs rather than relying on private static registry mutation.',
        'Load plugin or descriptor metadata deterministically through approved manifest/atlas/package configuration surfaces; do not add implicit arbitrary code execution.',
        'Define and test duplicate codec behavior, alias collision behavior, descriptor lookup, unknown codec behavior, and stable ordering.',
        'Update exports and docs only where required for the public package contract.',
        'Run focused codec and package tests and report exact commands and outcomes.',
        'Return JSON: { changedFiles, summary, testsRun, registrationApi, discoverySources, duplicateBehavior, remainingRisks }.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSchemaSharingTask = defineTask('issue-599.implement-schema-sharing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4d - Implement shared tool schema normalization',
  labels: ['issue-599', 'transport-mux', 'tool-mux', 'schema-normalization', 'implementation'],
  agent: {
    name: 'schema-normalization-implementer',
    prompt: {
      role: 'senior TypeScript API integration engineer',
      task: 'Share tool schema normalization between tool-mux and transport-mux without circular coupling.',
      instructions: [
        'Edit the repository directly, but keep changes scoped to issue #599.',
        'First validate existing NormalizedToolDefinition, convertTools, normalizeTools, and denormalizeTools concepts and any tool-mux overlap. Preserve any complete current behavior.',
        'Choose a package boundary that avoids circular dependencies and preserves public API compatibility.',
        'Add tests proving OpenAI, Anthropic, and Google tool schemas normalize and denormalize consistently through both consumers.',
        'Do not refactor unrelated tool-mux dispatch behavior.',
        'If the slice is complete, do not edit production code for this slice; add only missing focused tests or docs required by contractDesign.',
        'Run focused schema/tool tests and report exact commands and outcomes.',
        'Return JSON: { changedFiles, summary, testsRun, sharedTypes, packageBoundary, compatibilityNotes, remainingRisks }.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-599.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5 - Run issue #599 quality gates',
  labels: ['issue-599', 'quality-gate', 'verification', 'phase:5'],
  agent: {
    name: 'transport-mux-verifier',
    prompt: {
      role: 'senior TypeScript platform verifier',
      task: 'Run and interpret the required quality gates for issue #599.',
      instructions: [
        'Run the verification commands from the repository root and record exact commands, exit status, and relevant output summaries.',
        'Confirm issue #599 red-phase tests failed for intended missing behavior before implementation and now pass.',
        'Confirm cost feedback is emitted exactly once for each usage-bearing buffered completion or stream done event.',
        'Confirm passthrough does not emit cost from absent usage and does not leak internal headers upstream.',
        'Confirm SDK journal/event index/session budget integration works through the narrow sink adapter.',
        'Confirm runId/sessionId/trace/correlation metadata is available to internal sinks and not forwarded unexpectedly.',
        'Confirm codec plugin discovery is deterministic and duplicate/unknown behavior is tested.',
        'Confirm shared tool schema normalization is used by both affected surfaces or document an explicit non-goal approved by contractDesign.',
        'Run git diff --check and inspect final changed files for unrelated source churn.',
        'Return JSON: { passed, commands, failures, changedFiles, criteria, redGreenVerified, exactOnceCostVerified, metadataRedactionVerified, codecDiscoveryVerified, schemaSharingVerified, notes }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        runtimeTrace: args.runtimeTrace,
        contractDesign: args.contractDesign,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewIntegrationTask = defineTask('issue-599.review-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6 - Review transport integration architecture and privacy',
  labels: ['issue-599', 'review', 'privacy', 'compatibility', 'phase:6'],
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'senior code reviewer for SDK, proxy, plugin, and observability integration',
      task: 'Review the issue #599 implementation against the contract, tests, and privacy boundaries.',
      instructions: [
        'Review in code-review style: findings first, ordered by severity, with file/line references where possible.',
        'Prioritize cost double-counting, missing SDK journal integration, metadata leaks to upstream providers, session/trace context corruption, codec registry nondeterminism, circular package dependencies, public API breaks, and missing route-level tests.',
        'Verify implementation stayed within issue #599 and did not make unrelated transport/provider refactors.',
        'Verify docs and migration scorecard text are updated only where required and remain honest.',
        'Return JSON: { approved, findings, requiredFixes, compatibilityRisks, privacyRisks, missingTests, changedFiles, notes }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        runtimeTrace: args.runtimeTrace,
        contractDesign: args.contractDesign,
        regressionPlan: args.regressionPlan,
        implementation: args.implementation,
        verification: args.verification,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-599.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7 - Final issue acceptance and delivery readiness',
  labels: ['issue-599', 'final-gate', 'acceptance', 'phase:7'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'release-minded Babysitter maintainer',
      task: 'Decide whether issue #599 is complete and ready for delivery.',
      instructions: [
        'Compare the final implementation to the issue body, all comments, labels, and contractDesign acceptance criteria.',
        'Require passing verification and approved review unless an explicit maintainer decision accepts remaining risk.',
        'Confirm related issue boundaries: #578 owns broader end-to-end cost tracking, #591 owns broader observability, while #599 owns the transport-mux integration points.',
        'Confirm the final PR description can list changed files, tests, quality gates, and remaining non-goals.',
        'If any acceptance criterion remains incomplete, set passed=false and list exact blockers.',
        'Return JSON: { passed, changedFiles, acceptanceCriteriaStatus, tests, qualityGates, remainingRisks, needsHumanDecision, question, deliverySummary }.',
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
