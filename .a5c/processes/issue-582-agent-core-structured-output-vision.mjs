/**
 * @process repo/issue-582-agent-core-structured-output-vision
 * @description Implement issue #582: add structured JSON output and vision/multimodal input support to agent-core with provider-normalized request mapping and guarded tests.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, issueContext: object, targetFiles: string[], relatedIssues: object, verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], runtimeCallPaths: string[], changedFiles: string[], verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - methodologies/planning-with-files/planning-orchestrator.js
 * - methodologies/spec-kit/spec-kit-planning.js
 * - babysitter/tdd-quality-convergence.js
 * - specializations/ai-agents-conversational/multi-modal-agent.js
 * - specializations/ai-agents-conversational/function-calling-agent.js
 * - specializations/collaboration/github/issue-linking.js
 * - docs/agent-reference/process-authoring.md
 *
 * Repo-specific note: this process intentionally uses agent tasks for verification
 * instead of kind: "shell" subtasks because this repository's process-authoring
 * policy says not to generate shell subtasks for babysitter:call processes unless
 * the user explicitly requests a shell-oriented workflow.
 *
 * @agent platform-architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @agent technical-planner methodologies/spec-kit/agents/technical-planner/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const reuseAudit = await ctx.task(reuseAuditTask, inputs, {
    key: 'issue-582.reuse-audit',
  });

  const architecturePlan = await ctx.task(architecturePlanTask, {
    inputs,
    reuseAudit,
  }, {
    key: 'issue-582.architecture-plan',
  });

  if (architecturePlan?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #582 API Decision Needed',
      question: architecturePlan.question,
      options: [
        'Proceed with recommended optional API',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-582', 'agent-core', 'public-api'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        architecturePlan,
      },
    });
  }

  const contractTests = await ctx.task(authorContractTestsTask, {
    inputs,
    reuseAudit,
    architecturePlan,
  }, {
    key: 'issue-582.author-contract-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementAgentCoreFeatureTask, {
      inputs,
      reuseAudit,
      architecturePlan,
      contractTests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-582.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      implementation,
      attempt,
    }, {
      key: `issue-582.verification.${attempt}`,
    });

    review = await ctx.task(reviewImplementationTask, {
      inputs,
      reuseAudit,
      architecturePlan,
      contractTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-582.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const docsAndHandoff = await ctx.task(updateDocsAndHandoffTask, {
    inputs,
    reuseAudit,
    architecturePlan,
    contractTests,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-582.docs-and-handoff',
  });

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    reuseAudit,
    architecturePlan,
    contractTests,
    implementation,
    verification,
    review,
    docsAndHandoff,
    attempts,
  }, {
    key: 'issue-582.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #582 Final Decision Needed',
      question: finalGate.question,
      options: [
        'Accept current implementation with documented residual risk',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-582', 'final-acceptance'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'reuse-audit',
      'architecture-plan',
      'contract-tests-first',
      'implementation-loop',
      'verification-gate',
      'review-gate',
      'docs-and-handoff',
      'final-acceptance',
    ],
    runtimeCallPaths: reuseAudit?.runtimeCallPaths ?? [],
    changedFiles: finalGate?.changedFiles ?? docsAndHandoff?.changedFiles ?? implementation?.changedFiles ?? [],
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const reuseAuditTask = defineTask('issue-582.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse-audit findings (REVIEW BEFORE PROCEEDING)',
  labels: ['agent-core', 'reuse-audit', 'runtime-trace', 'brownfield'],
  agent: {
    name: 'technical-planner',
    prompt: {
      role: 'senior TypeScript runtime architect',
      task: 'Run the required reuse audit and trace the live agent-core prompt path before any implementation work.',
      instructions: [
        'Use ISSUE_CONTEXT as the authoritative spec. Treat comments and labels as part of the issue context.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        'Inspect the repository before planning changes. Start with the target files listed in INPUTS, then follow imports and consumers as needed.',
        'Extract keyword nouns and verbs from the issue: structured output, JSON mode, JSON schema, typed returns, vision, multimodal, image URL, base64, provider request mapping, schema validation, ToolResult coordination.',
        'Scan for matching migrations, API routes, environment variables, SDK dependencies, exports, provider adapters, tests, and docs. Render a section literally titled "Reuse-audit findings (REVIEW BEFORE PROCEEDING)".',
        'Trace the runtime call path from createAgentCoreSession() and prompt() through endpoint resolution, provider payload construction, response parsing, event emission, result return, package exports, and agent-platform consumers.',
        'Identify which files are live execution paths and which are adjacent documentation or consumer surfaces.',
        'Explicitly mark #575 as dependency/coordination for streaming/multimodal response foundation and #588 as related/out-of-scope for image-bearing ToolResult support unless implementation evidence shows a required narrow type coordination.',
        'Return JSON: { reuseAuditFindings, runtimeCallPaths, liveExecutionFiles, adjacentFiles, existingInfrastructure, dependencyBoundaries, targetFiles, risks, outOfScope }.',
      ],
      context: {
        inputs: args,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const architecturePlanTask = defineTask('issue-582.architecture-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design provider-normalized structured-output and vision API',
  labels: ['agent-core', 'architecture', 'public-api', 'provider-mapping'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript API and LLM provider integration architect',
      task: 'Design the implementation plan for issue #582 before tests and code changes.',
      instructions: [
        'Compare ISSUE_CONTEXT and REUSE_AUDIT directly. Preserve current prompt(text, timeout?) behavior as the default path.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim JSON):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'Plan the smallest coherent public API addition for structured output and multimodal input in packages/agent-core.',
        'Cover: outputFormat text/json_object/json_schema, schema/name/strict fields, parsed or typed JSON result shape, validation errors, multimodal prompt parts, image URL and base64 image sources, provider-normalized internal request representation, OpenAI/Azure request mapping, Anthropic request mapping, response parsing, exports, README updates, and agent-platform type compatibility.',
        'Do not duplicate #588 tool-result image work. If ToolResult needs a narrow type compatibility change, isolate it and explain why it is required for issue #582 rather than #588.',
        'Call out any provider capability uncertainty that requires maintainer choice. Prefer an optional API and fail-fast validation over broad compatibility shims.',
        'Return JSON: { publicApiPlan, internalModelPlan, providerMappingPlan, validationPlan, typedReturnPlan, testPlan, docsPlan, needsMaintainerDecision, question, risks, changedFilesExpected }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractTestsTask = defineTask('issue-582.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests before implementation',
  labels: ['agent-core', 'tests', 'tdd', 'provider-payloads'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Author focused tests that freeze issue #582 acceptance before implementation changes.',
      instructions: [
        'Use ISSUE_CONTEXT, REUSE_AUDIT, and ARCHITECTURE_PLAN as authoritative inputs. Add or update tests before editing implementation files.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim JSON):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan, null, 2),
        '---',
        'Expected test coverage: OpenAI JSON object response_format payload, OpenAI JSON schema response_format payload, Azure parity for structured output, Anthropic structured-output strategy chosen by the architecture plan, image URL content parts, base64 image content parts, invalid schema/image validation failures, parsed JSON success/failure behavior, and backward compatibility for plain text prompt(text).',
        'Keep tests provider-mocked and deterministic. Prefer packages/agent-core/src/session.test.ts and adjacent type/export tests only when needed.',
        'Do not broaden into #588 image-bearing ToolResult tests unless the architecture plan requires a narrow coordination test.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, coverageMatrix, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementAgentCoreFeatureTask = defineTask('issue-582.implement-agent-core-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement agent-core structured output and vision attempt ${args.attempt}`,
  labels: ['agent-core', 'implementation', 'structured-output', 'vision'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement issue #582 in agent-core, scoped to the live execution path and contract tests.',
      instructions: [
        'Keep changes focused on the live files identified by REUSE_AUDIT. Preserve existing text-only behavior and public compatibility.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim JSON):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan, null, 2),
        '---',
        'CONTRACT_TESTS (verbatim JSON):',
        '---',
        JSON.stringify(args.contractTests, null, 2),
        '---',
        'PREVIOUS_VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.previousVerification, null, 2),
        '---',
        'PREVIOUS_REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.previousReview, null, 2),
        '---',
        'Implement the public types, normalized internal request model, validation, provider payload mapping, response parsing, typed/parsed result fields, and necessary exports/docs hooks.',
        'Provider mapping must be covered by tests rather than inferred from manual inspection. Keep all new fields optional. Do not introduce network-dependent tests.',
        'If Anthropic structured output cannot be expressed natively through the selected API surface, implement the architecture plan fallback explicitly and document the limitation in types/tests/docs.',
        'Return JSON: { changedFiles, summary, apiSurface, providerPayloadSemantics, validationSemantics, backwardCompatibility, commandsToRun, unresolvedRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-582.verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #582 verification gate attempt ${args.attempt}`,
  labels: ['agent-core', 'verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior TypeScript release validation engineer',
      task: 'Run the deterministic verification commands and interpret failures for issue #582.',
      instructions: [
        'Run the commands listed in VERIFICATION_COMMANDS from the repository root unless a command itself specifies a workspace.',
        'VERIFICATION_COMMANDS (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        '---',
        'IMPLEMENTATION (verbatim JSON):',
        '---',
        JSON.stringify(args.implementation, null, 2),
        '---',
        'The gate passes only when agent-core tests pass, agent-core builds, relevant package exports typecheck, and no focused contract test was skipped or weakened.',
        'If a command fails, capture the failing command, concise stderr/stdout evidence, likely root cause, and exact next fix recommendation.',
        'Return JSON: { passed, commands, failures, skippedChecks, evidence, nextFixes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewImplementationTask = defineTask('issue-582.review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #582 implementation attempt ${args.attempt}`,
  labels: ['agent-core', 'code-review', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior API compatibility and provider integration reviewer',
      task: 'Review the issue #582 implementation against the issue, design, tests, and verification evidence.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'SPEC (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim JSON):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan, null, 2),
        '---',
        'CONTRACT_TESTS (verbatim JSON):',
        '---',
        JSON.stringify(args.contractTests, null, 2),
        '---',
        'IMPLEMENTATION (verbatim JSON):',
        '---',
        JSON.stringify(args.implementation, null, 2),
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification, null, 2),
        '---',
        'Review for: public API clarity, backwards compatibility, provider payload correctness for OpenAI/Azure/Anthropic, validation safety for schema/image inputs, typed result ergonomics, test adequacy, and accidental scope bleed into #588.',
        'Return JSON: { approved, issues, requiredFixes, changedFiles, compatibilityRisks, providerRisks, testGaps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const updateDocsAndHandoffTask = defineTask('issue-582.docs-and-handoff', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update docs and prepare issue handoff',
  labels: ['agent-core', 'docs', 'handoff', 'github'],
  agent: {
    name: 'technical-planner',
    prompt: {
      role: 'senior developer documentation engineer',
      task: 'Update documentation and prepare the final GitHub handoff for issue #582.',
      instructions: [
        'Update only documentation that is directly affected by the implemented agent-core API. Prefer packages/agent-core/README.md and docs/agent-layer-gaps.md if the gap status changed.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'IMPLEMENTATION (verbatim JSON):',
        '---',
        JSON.stringify(args.implementation, null, 2),
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification, null, 2),
        '---',
        'REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.review, null, 2),
        '---',
        'Document structured output examples, multimodal prompt examples, provider caveats, validation errors, and #588 coordination boundaries. Do not claim ToolResult image support unless implemented in this issue.',
        'Prepare a concise PR summary and issue comment summary with tests run and residual risks.',
        'Return JSON: { changedFiles, docsUpdated, prSummary, issueComment, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-582.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #582',
  labels: ['agent-core', 'acceptance', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior maintainer performing final acceptance',
      task: 'Decide whether issue #582 is complete and ready for PR.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'SPEC (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'ARTIFACTS (verbatim JSON):',
        '---',
        JSON.stringify({
          reuseAudit: args.reuseAudit,
          architecturePlan: args.architecturePlan,
          contractTests: args.contractTests,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          docsAndHandoff: args.docsAndHandoff,
          attempts: args.attempts,
        }, null, 2),
        '---',
        'Pass only if structured output has a public typed API, provider request mapping is tested for OpenAI/Azure/Anthropic, multimodal image URL and base64 inputs are represented and mapped, invalid inputs fail clearly, default prompt(text) stays compatible, docs are updated, and #588 remains only coordinated unless explicitly justified.',
        'Return JSON: { passed, needsHumanDecision, question, changedFiles, evidence, remainingRisks, prSummary, issueComment }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
