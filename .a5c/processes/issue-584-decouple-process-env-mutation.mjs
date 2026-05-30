/**
 * @process repo/issue-584-decouple-process-env-mutation
 * @description Implementation process for issue #584: decouple hidden process.env mutation across agent-core, agent-platform, and agent-mux.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, maxIterations?: number, targetFiles: string[], mutationFiles: string[], regressionTestFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, runtimeCallPaths: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/here-be-dragons.md
 * - .a5c/processes/issue-600-deduplicate-background-registry-shell-invocation.mjs
 * - .a5c/processes/issue-601-remaining-dragons-plan.mjs
 * - methodologies/spec-kit-brownfield.js
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 * - tdd-quality-convergence.js
 * - specializations/sdk-platform-development/sdk-architecture-design.js
 * - specializations/sdk-platform-development/compatibility-testing.js
 *
 * Process-library research note:
 * - The requested repo-local .a5c/process-library/ directory was not present.
 * - The active process-library binding was /home/runner/.a5c/process-library/babysitter-repo/library.
 *
 * Repo policy note:
 * - Direct Babysitter processes in this repo should avoid kind:"shell" subtasks
 *   unless a shell-oriented workflow is explicitly requested. This process uses
 *   agent tasks for context collection and deterministic verification.
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Env var infrastructure already exists through direct process.env reads/writes in
 *   packages/agent-platform/src/harness/piWrapper/moduleSupport.ts,
 *   packages/agent-core/src/session.ts,
 *   packages/agent-core/src/agenticTools/config/state.ts,
 *   packages/agent-platform/src/harness/agenticTools/config/state.ts, and
 *   packages/agent-mux/cli/src/index.ts.
 * - docs/here-be-dragons.md already contains the contract table for the issue-listed
 *   AZURE_OPENAI_*, AMUX_*, and BABYSITTER_* coupling, so the implementation should
 *   update that documentation only when the live hazard is actually removed.
 * - agent-core and agent-platform contain copied config/state implementations, so the
 *   process should prefer a shared contract/state location only after checking package
 *   boundaries and import cycles.
 * - No database migrations, API routes, or new SDK dependencies are needed for this issue.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_ITERATIONS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-584.issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-584.reuse-audit',
  });

  const processLibraryResearch = await ctx.task(researchProcessLibraryTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-584.process-library-research',
  });

  const runtimeTrace = await ctx.task(traceRuntimeConfigPathsTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
  }, {
    key: 'issue-584.runtime-trace',
  });

  const regressionPlan = await ctx.task(authorRegressionTestPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
  }, {
    key: 'issue-584.regression-test-plan',
  });

  const contractDesign = await ctx.task(designEnvContractTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    regressionPlan,
  }, {
    key: 'issue-584.contract-design',
  });

  if (contractDesign?.needsArchitectureApproval !== false) {
    await ctx.breakpoint({
      title: 'Approve Issue #584 Env Contract Architecture',
      question: [
        'Review the typed env/config contract, runtime call paths, and compatibility rules before implementation starts.',
        'Approve only if the design removes hidden in-process process.env mutation while preserving legitimate process-boundary env behavior.',
      ].join('\n'),
      options: ['Approve architecture', 'Pause for redesign'],
      expert: 'owner',
      tags: ['issue-584', 'architecture-gate', 'env-contract'],
      context: {
        runId: ctx.runId,
        contractDesign,
        runtimeTrace,
      },
    });
  }

  let implementation = null;
  let verification = null;
  let mutationAudit = null;
  let review = null;
  const attempts = [];
  const maxIterations = inputs.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    implementation = await ctx.task(implementEnvDecouplingTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      contractDesign,
      previousVerification: verification,
      previousReview: review,
      iteration,
    }, {
      key: `issue-584.implementation.${iteration}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      implementation,
      iteration,
    }, {
      key: `issue-584.verification.${iteration}`,
    });

    mutationAudit = await ctx.task(auditRemainingMutationTask, {
      inputs,
      implementation,
      verification,
      iteration,
    }, {
      key: `issue-584.mutation-audit.${iteration}`,
    });

    review = await ctx.task(reviewAgainstSpecTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      regressionPlan,
      contractDesign,
      implementation,
      verification,
      mutationAudit,
      iteration,
    }, {
      key: `issue-584.spec-review.${iteration}`,
    });

    attempts.push({ iteration, implementation, verification, mutationAudit, review });

    if (verification?.passed === true && mutationAudit?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    regressionPlan,
    contractDesign,
    attempts,
    implementation,
    verification,
    mutationAudit,
    review,
  }, {
    key: 'issue-584.final-acceptance',
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #584 Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Continue with recommended next step', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['issue-584', 'final-gate'],
      context: {
        runId: ctx.runId,
        finalGate,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'process-library-research',
      'runtime-call-path-trace',
      'tests-first-plan',
      'typed-env-contract-design',
      'architecture-breakpoint',
      'implementation-loop',
      'verification-gate',
      'static-mutation-audit',
      'spec-review',
      'final-acceptance',
    ],
    reuseAudit,
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    changedFiles: finalGate?.changedFiles ?? review?.changedFiles ?? implementation?.changedFiles ?? [],
    verification,
    mutationAudit,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-584.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #584 and current env-coupling context',
  labels: ['issue-584', 'context', 'spec'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter repository researcher',
      task: 'Read the authoritative GitHub and repository context for issue #584.',
      instructions: [
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments and preserve the title, body, labels, and every comment.`,
        `Also run gh pr view ${args.issueNumber} --json files,title,body,comments and record that it is not a PR if GitHub returns no pull request.`,
        'Read docs/here-be-dragons.md around the process.env coupling section and coupling map.',
        'Inspect only the issue-listed env mutation/read surfaces plus package scripts needed for verification:',
        'packages/agent-platform/src/harness/piWrapper/moduleSupport.ts',
        'packages/agent-platform/src/harness/piWrapper.ts',
        'packages/agent-core/src/session.ts',
        'packages/agent-core/src/agenticTools/config/state.ts',
        'packages/agent-platform/src/harness/agenticTools/config/state.ts',
        'packages/agent-mux/cli/src/index.ts',
        'packages/agent-mux/observability/src/logger.ts',
        'package.json',
        'Return JSON: { title, labels, rawIssue, comments, isPullRequest, affectedFiles, envContractTable, mutationEvidence, readerEvidence, verificationScripts, acceptanceCriteria, risks, relatedIssues, priorPlanningPrs }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-584.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform Phase 0 reuse audit for env/config infrastructure',
  labels: ['issue-584', 'reuse-audit', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter platform architect',
      task: 'Run the Phase 0 reuse audit before planning new env/config infrastructure.',
      instructions: [
        'ISSUE_CONTEXT (verbatim):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        'Inspect the target files, package dependencies, imports, and docs for existing env contract, scoped config, DI, and validation infrastructure.',
        'Search specifically for AZURE_OPENAI_*, AMUX_*, BABYSITTER_*, config state, session endpoint resolution, logger configuration, env registry, and env validation.',
        'Report matching existing infrastructure that should be reused or extended. Explicitly note that database migrations, API routes, and new SDK dependencies are not expected unless fresh evidence contradicts that.',
        'Return JSON: { findings: string[], existingInfra: object[], duplicateRisks: string[], preferredReuse: string[], noNewInfraNeeded: boolean }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-584.research-process-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research relevant process-library methodologies',
  labels: ['issue-584', 'process-library', 'planning'],
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'Babysitter process author',
      task: 'Identify process-library patterns that should shape this implementation run.',
      instructions: [
        'Use babysitter process-library:active --json to find the active process-library root.',
        'If repo-local .a5c/process-library/ does not exist, record that and use the active process-library binding instead.',
        'Inspect relevant files under methodologies/spec-kit-brownfield, methodologies/superpowers/test-driven-development, methodologies/superpowers/verification-before-completion, tdd-quality-convergence, and specializations/sdk-platform-development.',
        'Favor patterns for brownfield runtime-path tracing, TDD, compatibility review, deterministic verification, and final acceptance gates.',
        'Return JSON: { selectedPatterns: string[], rejectedPatterns: string[], taskShapeGuidance: string[], breakpointGuidance: string[], qualityGateGuidance: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRuntimeConfigPathsTask = defineTask('issue-584.trace-runtime-config-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace live env/config writer-to-reader paths',
  labels: ['issue-584', 'runtime-trace', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript architecture engineer',
      task: 'Trace the live runtime config paths for issue #584 before implementation.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'Do not edit files in this task.',
        'Trace writer-to-reader paths for Azure OpenAI defaults, agent-core config state, agent-platform config state, and agent-mux CLI logging flags.',
        'Classify each process.env use as one of: external process boundary, compatibility read, hidden in-process mutable config, test-only fixture, or unrelated.',
        'Identify package-boundary constraints and any import-cycle risks before proposing a shared registry or state helper.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], allowedEnvBoundaries: string[], mutationSitesToRemove: string[], affectedFiles: string[], proposedContractLocations: string[], risks: string[], outOfScope: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestPlanTask = defineTask('issue-584.author-regression-test-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan tests before implementation',
  labels: ['issue-584', 'tdd', 'tests-first'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test architect',
      task: 'Author a tests-first plan for issue #584. Do not implement production code in this task.',
      instructions: [
        'SPEC (verbatim, do not paraphrase):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'Do not read files under implementation directories when deciding acceptance criteria. Use the spec and runtime trace above.',
        'Plan concrete regression tests for Azure OpenAI default synthesis without permanent env mutation, global/run-scoped config behavior without hidden env writes, agent-mux logging configuration without AMUX_* mutation, and package-boundary compatibility.',
        'Use or create the test files listed in inputs unless adjacent existing tests are demonstrably a better fit.',
        'Return JSON: { testFiles: string[], redPhaseCommands: string[], coverageMatrix: object[], expectedInitialFailures: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designEnvContractTask = defineTask('issue-584.design-env-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design typed env/config contract and scoped config migration',
  labels: ['issue-584', 'design', 'env-contract'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript package architect',
      task: 'Design a compatibility-preserving env/config decoupling plan for issue #584.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'REGRESSION_PLAN (verbatim):',
        '---',
        JSON.stringify(args.regressionPlan, null, 2),
        '---',
        'Define a central typed registry for existing AZURE_OPENAI_*, AMUX_*, BABYSITTER_*, provider, and model keys named by current behavior.',
        'Design scoped config objects and dependency injection so readers consume explicit config values instead of relying on writer init order.',
        'Keep process.env propagation only at true process boundaries such as spawning subprocesses or adapting external CLI/API contracts.',
        'Avoid package cycles and avoid broad unrelated env cleanup.',
        'Return JSON: { needsArchitectureApproval: boolean, contractLocation: string, scopedConfigTypes: string[], migrationSteps: string[], compatibilityRules: string[], filesToEdit: string[], verificationPlan: string[], stopConditions: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementEnvDecouplingTask = defineTask('issue-584.implement-env-decoupling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement issue #584 env decoupling iteration ${args.iteration}`,
  labels: ['issue-584', 'implementation', 'env-contract'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript refactoring engineer',
      task: 'Implement issue #584 using the approved contract design and tests-first plan.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        'REGRESSION_PLAN (verbatim):',
        '---',
        JSON.stringify(args.regressionPlan, null, 2),
        '---',
        'CONTRACT_DESIGN (verbatim):',
        '---',
        JSON.stringify(args.contractDesign, null, 2),
        '---',
        'PREVIOUS_VERIFICATION (verbatim):',
        '---',
        args.previousVerification ? JSON.stringify(args.previousVerification, null, 2) : 'none',
        '---',
        'PREVIOUS_REVIEW (verbatim):',
        '---',
        args.previousReview ? JSON.stringify(args.previousReview, null, 2) : 'none',
        '---',
        'Edit the repository directly.',
        'Write or update regression tests before production implementation in this iteration.',
        'Keep changes scoped to files on traced runtime paths unless fresh evidence proves another live-path file is necessary.',
        'Remove hidden process.env writes from the issue-listed writer files; preserve process.env reads at process boundaries and compatibility reads where approved by the design.',
        'Refactor duplicated agent-core and agent-platform config state together, or explicitly justify why a shared implementation would create a worse package boundary.',
        'Update docs/here-be-dragons.md only if the implementation changes the documented risk.',
        'Preserve unrelated dirty workspace files.',
        'Return JSON: { changedFiles: string[], testsAddedOrUpdated: string[], summary: string, residualRisks: string[], followUpNeeded: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-584.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run deterministic verification gate iteration ${args.iteration}`,
  labels: ['issue-584', 'verification', 'quality-gate'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'verification engineer',
      task: 'Run and interpret the deterministic verification gate for issue #584.',
      instructions: [
        'Run git diff --check.',
        'Run each verification command from inputs.verificationCommands exactly once unless a command is unavailable; if unavailable, explain the concrete blocker.',
        'Capture command, exit status, high-signal output, and whether the result proves the intended gate.',
        'Do not claim success for skipped commands.',
        'Return JSON: { passed: boolean, commands: object[], failures: object[], skipped: object[], changedFiles: string[], evidenceSummary: string }.',
      ],
      context: {
        inputs: args.inputs,
        implementation: args.implementation,
        iteration: args.iteration,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const auditRemainingMutationTask = defineTask('issue-584.audit-remaining-mutation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit remaining env writes iteration ${args.iteration}`,
  labels: ['issue-584', 'static-audit', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'static configuration coupling auditor',
      task: 'Audit issue-listed writer files for remaining hidden process.env mutation.',
      instructions: [
        'Run rg or equivalent over inputs.mutationFiles for direct process.env assignment using this intent: process.env[...] = or process.env.A_NAME =.',
        'Classify any matches as hidden in-process config mutation, allowed test fixture, process-boundary env construction, or false positive.',
        'Fail this gate if any issue-listed production writer still mutates process.env for in-process config flow.',
        'Return JSON: { passed: boolean, command: string, matches: object[], allowedMatches: object[], blockingMatches: object[], rationale: string }.',
      ],
      context: {
        inputs: args.inputs,
        implementation: args.implementation,
        verification: args.verification,
        iteration: args.iteration,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewAgainstSpecTask = defineTask('issue-584.review-against-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review implementation against issue #584 iteration ${args.iteration}`,
  labels: ['issue-584', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'code reviewer focused on TypeScript configuration architecture',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Inspect the working tree diff and verification outputs.',
        'Verify tests were added or updated for the issue behavior before relying on implementation claims.',
        'Verify hidden in-process process.env writes were removed from issue-listed writer files without breaking legitimate env reads or process-boundary propagation.',
        'Verify the typed registry and scoped config/DI path are actually used by the traced readers and writers.',
        'Return JSON: { approved: boolean, issues: string[], changedFiles: string[], summary: string, residualRisk: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        '',
        'RUNTIME_TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        '',
        'CONTRACT_DESIGN (verbatim):',
        '---',
        JSON.stringify(args.contractDesign, null, 2),
        '---',
        '',
        'IMPLEMENTATION (verbatim):',
        '---',
        JSON.stringify(args.implementation, null, 2),
        '---',
        '',
        'VERIFICATION (verbatim):',
        '---',
        JSON.stringify(args.verification, null, 2),
        '---',
        '',
        'MUTATION_AUDIT (verbatim):',
        '---',
        JSON.stringify(args.mutationAudit, null, 2),
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-584.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #584',
  labels: ['issue-584', 'final-gate', 'quality'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'release readiness reviewer',
      task: 'Decide whether the issue #584 run is complete and ready for delivery.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        'ATTEMPTS (verbatim):',
        '---',
        JSON.stringify(args.attempts, null, 2),
        '---',
        'Pass only if verification, static mutation audit, and spec review all pass.',
        'Require explicit changed file list and residual risk notes.',
        'If the issue is only partially solved, set passed=false and needsHumanDecision=true with a concise question.',
        'Return JSON: { passed: boolean, needsHumanDecision: boolean, question?: string, changedFiles: string[], summary: string, residualRisk: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
